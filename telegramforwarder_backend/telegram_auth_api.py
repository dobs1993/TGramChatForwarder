from flask import Blueprint, request, jsonify
from flask_cors import CORS
from telethon import TelegramClient, events
from telethon.tl.types import PeerUser, PeerChat, PeerChannel
from telethon.sessions.memory import MemorySession
from dotenv import load_dotenv
import os, asyncio, traceback, json
import threading
import logging
from datetime import datetime
import hashlib
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("telegram_api.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("telegram_auth_api")

load_dotenv()

session_locks = {}
memory_sessions = {}  # Store sessions in memory to avoid file locks

auth_api = Blueprint('auth_api', __name__)
# Enable CORS for all origins for debugging
CORS(auth_api, supports_credentials=True, origins=["*"])  # Changed to allow all origins for debugging

API_ID = os.getenv("TG_API_ID") or "YOUR_API_ID"
API_HASH = os.getenv("TG_API_HASH") or "YOUR_API_HASH"
SESSION_PATH = "sessions"
os.makedirs(SESSION_PATH, exist_ok=True)

# Store phone_code_hash temporarily
phone_code_hashes = {}

# Load saved redirections
REDIRECTION_FILE = "active_redirections.json"
if os.path.exists(REDIRECTION_FILE):
    with open(REDIRECTION_FILE, "r") as f:
        active_redirections = json.load(f)
else:
    active_redirections = {}

def save_redirections():
    # Create a temporary file and then rename to avoid corruption
    temp_file = f"{REDIRECTION_FILE}.tmp"
    with open(temp_file, "w") as f:
        json.dump(active_redirections, f)
    os.replace(temp_file, REDIRECTION_FILE)
    logger.info(f"Saved redirections to {REDIRECTION_FILE}")

def sanitize_log_data(data):
    """Sanitize sensitive data for logging"""
    if isinstance(data, dict):
        result = {}
        for k, v in data.items():
            # Mask sensitive fields
            if k in ["phone", "code", "phone_code_hash"]:
                if isinstance(v, str):
                    result[k] = f"{v[:2]}****{v[-2:]}" if len(v) > 4 else "****"
                else:
                    result[k] = "****"
            else:
                result[k] = sanitize_log_data(v)
        return result
    elif isinstance(data, list):
        return [sanitize_log_data(item) for item in data]
    else:
        return data

async def get_client(phone):
    """Create a client with retry logic to avoid database locks"""
    session_path = f"{SESSION_PATH}/{phone}"
    
    # Try up to 3 times with a short delay
    for attempt in range(3):
        try:
            # Use MemorySession to avoid SQLite database locks
            if phone in memory_sessions:
                # Reuse existing session from memory
                print(f"Using existing memory session for {phone}")
                client = TelegramClient(memory_sessions[phone], API_ID, API_HASH)
            else:
                print(f"Creating new client with file session: {session_path}")
                # Load from file but use memory for operations
                client = TelegramClient(session_path, API_ID, API_HASH)
                memory_sessions[phone] = MemorySession()
            
            await client.connect()
            return client
        except Exception as e:
            if "database is locked" in str(e) and attempt < 2:
                print(f"Database lock detected, retrying in {(attempt+1)*0.5} seconds...")
                await asyncio.sleep((attempt+1) * 0.5)
            else:
                raise
    
    raise Exception("Failed to create client after multiple attempts")

@auth_api.route('/send-code', methods=['POST'])
def send_code():
    print("========== RECEIVED /send-code REQUEST ==========")
    print(f"Request headers: {request.headers}")
    
    try:
        data = request.get_json()
        print(f"Request data: {data}")
        
        phone = data.get("phone")
        print(f"Phone number received: {phone}")
        
        logger.info(f"Received code request for: {phone[:2]}****{phone[-2:]}")
        
        if not phone:
            print("ERROR: No phone number provided")
            return jsonify({"error": "Phone number required"}), 400

        async def run():
            try:
                client = await get_client(phone)
                
                if not await client.is_user_authorized():
                    print("User not authorized, sending code request")
                    sent = await client.send_code_request(phone)
                    phone_code_hashes[phone] = sent.phone_code_hash
                    print(f"Code sent successfully, hash stored for: {phone}")
                    await client.disconnect()
                    return {"status": "Code sent"}
                else:
                    print(f"User already authorized: {phone}")
                    await client.disconnect()
                    return {"status": "Already authorized"}
            except Exception as e:
                print(f"ERROR in send_code: {str(e)}")
                traceback.print_exc()
                return {"error": str(e)}

        result = asyncio.run(run())
        print(f"Result: {result}")
        print("================================================")
        return jsonify(result), 200 if "status" in result else 500
    except Exception as e:
        print(f"UNHANDLED EXCEPTION: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Server error: " + str(e)}), 500

@auth_api.route('/verify-code', methods=['POST'])
def verify_code():
    print("========== RECEIVED /verify-code REQUEST ==========")
    print(f"Request headers: {request.headers}")
    
    try:
        data = request.get_json()
        print(f"Request data: {data}")
        
        phone = data.get("phone")
        code = data.get("code")
        
        print(f"Phone: {phone}, Code: {code}")
        logger.info(f"Verifying code for: {phone[:2]}****{phone[-2:]}")
        
        if not phone or not code:
            print("ERROR: Missing phone or code")
            return jsonify({"error": "Phone and code required"}), 400

        phone_code_hash = phone_code_hashes.get(phone)
        if not phone_code_hash:
            print(f"ERROR: No phone_code_hash found for {phone}")
            return jsonify({"error": "No phone_code_hash found. Request code again."}), 400

        async def run():
            try:
                client = await get_client(phone)
                
                if await client.is_user_authorized():
                    print(f"User already authorized: {phone}")
                    await client.disconnect()
                    return {"status": "Already authorized"}

                print(f"Signing in with code: {code}")
                await client.sign_in(phone=phone, code=code, phone_code_hash=phone_code_hash)
                print("Sign in successful")
                
                # Save the session to file
                await client.session.save()
                
                # Clear the code hash after successful verification
                if phone in phone_code_hashes:
                    del phone_code_hashes[phone]
                    print(f"Cleared phone_code_hash for {phone}")
                    
                await client.disconnect()
                return {"status": "Login successful"}
            except Exception as e:
                print(f"ERROR in verify_code: {str(e)}")
                traceback.print_exc()
                return {"error": str(e)}

        result = asyncio.run(run())
        print(f"Result: {result}")
        print("================================================")
        return jsonify(result), 200 if "status" in result else 500
    except Exception as e:
        print(f"UNHANDLED EXCEPTION: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Server error: " + str(e)}), 500

@auth_api.route('/get-chats', methods=['POST'])
def get_chats():
    print("========== RECEIVED /get-chats REQUEST ==========")
    
    try:
        data = request.get_json()
        phone = data.get("phone")
        
        print(f"Phone: {phone}")
        
        if not phone:
            print("ERROR: No phone number provided")
            return jsonify({"error": "Phone number required"}), 400

        lock = get_lock(phone)

        with lock:
            async def fetch():
                try:
                    client = await get_client(phone)
                    
                    try:
                        if not await client.is_user_authorized():
                            print(f"ERROR: User not authorized: {phone}")
                            await client.disconnect()
                            return {"error": "Unauthorized"}
                        
                        print("Fetching dialogs...")
                        result = []
                        async for dialog in client.iter_dialogs():
                            if dialog.name and dialog.name.strip():
                                chat_type = (
                                    "User" if isinstance(dialog.entity, PeerUser)
                                    else "Group" if isinstance(dialog.entity, PeerChat)
                                    else "Channel" if isinstance(dialog.entity, PeerChannel)
                                    else "Unknown"
                                )
                                result.append({
                                    "id": dialog.id,
                                    "name": dialog.name.strip(),
                                    "type": chat_type
                                })
                        
                        print(f"Found {len(result)} chats")
                        return sorted(result, key=lambda x: x["name"].lower())
                    finally:
                        await client.disconnect()
                        print("Disconnected from Telegram")
                except Exception as e:
                    print(f"ERROR in get_chats: {str(e)}")
                    traceback.print_exc()
                    return {"error": str(e)}

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(fetch())
            loop.close()

            print(f"Returning {len(result) if isinstance(result, list) else 'error'} result")
            print("================================================")
            return jsonify(result), 200 if isinstance(result, list) else 500
    except Exception as e:
        print(f"UNHANDLED EXCEPTION: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Server error: " + str(e)}), 500


@auth_api.route('/set-link', methods=['POST'])
def set_link():
    print("========== RECEIVED /set-link REQUEST ==========")
    
    try:
        data = request.get_json()
        phone = data.get("phone")
        source_id = str(data.get("source_id"))
        destination_id = str(data.get("destination_id"))

        print(f"Phone: {phone}, Source ID: {source_id}, Destination ID: {destination_id}")
        logger.info(f"Setting link: {source_id} → {destination_id}")

        if not all([phone, source_id, destination_id]):
            print("ERROR: Missing required fields")
            return jsonify({"error": "Missing required fields"}), 400

        lock = get_lock(phone)

        with lock:
            async def apply():
                try:
                    client = await get_client(phone)

                    print(f"Adding link: {source_id} → {destination_id}")
                    if source_id not in active_redirections:
                        active_redirections[source_id] = []
                    if destination_id not in active_redirections[source_id]:
                        active_redirections[source_id].append(destination_id)
                        save_redirections()
                        print("Link saved successfully")

                    await client.disconnect()
                    print("Disconnected from Telegram")
                    return {"status": "Link applied successfully"}
                except Exception as e:
                    print(f"ERROR in set_link: {str(e)}")
                    traceback.print_exc()
                    return {"error": str(e)}

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(apply())
            loop.close()

            print(f"Result: {result}")
            print("================================================")
            return jsonify(result), 200 if "status" in result else 500
    except Exception as e:
        print(f"UNHANDLED EXCEPTION: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Server error: " + str(e)}), 500


@auth_api.route('/get-links', methods=['POST'])
def get_links():
    print("========== RECEIVED /get-links REQUEST ==========")
    
    try:
        data = request.get_json()
        phone = data.get("phone")
        
        print(f"Phone: {phone}")
        
        if not phone:
            print("ERROR: No phone number provided")
            return jsonify({"error": "Phone required"}), 400

        async def fetch():
            try:
                client = await get_client(phone)

                if not await client.is_user_authorized():
                    print(f"ERROR: User not authorized: {phone}")
                    await client.disconnect()
                    return {"error": "Unauthorized"}

                print("Fetching active links...")
                results = []
                for sid, dests in active_redirections.items():
                    for did in dests:
                        try:
                            print(f"Resolving entity for source: {sid}")
                            s_entity = await client.get_entity(int(sid))
                            print(f"Resolving entity for destination: {did}")
                            d_entity = await client.get_entity(int(did))
                            
                            source_name = getattr(s_entity, 'title', getattr(s_entity, 'first_name', 'Unknown'))
                            dest_name = getattr(d_entity, 'title', getattr(d_entity, 'first_name', 'Unknown'))
                            
                            results.append({
                                "source_id": sid,
                                "destination_id": did,
                                "source_name": source_name,
                                "destination_name": dest_name,
                            })
                            print(f"Added link: {source_name} → {dest_name}")
                        except Exception as e:
                            print(f"ERROR resolving names for {sid} → {did}: {str(e)}")
                            logger.error(f"Could not resolve names for {sid} → {did}: {str(e)}")
                
                await client.disconnect()
                print(f"Found {len(results)} links")
                return results
            except Exception as e:
                print(f"ERROR in get_links: {str(e)}")
                traceback.print_exc()
                return {"error": str(e)}

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(fetch())
        loop.close()

        print(f"Returning {len(result) if isinstance(result, list) else 'error'} result")
        print("================================================")
        return jsonify(result), 200 if isinstance(result, list) else 500
    except Exception as e:
        print(f"UNHANDLED EXCEPTION: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Server error: " + str(e)}), 500


@auth_api.route('/delete-link', methods=['POST'])
def delete_link():
    print("========== RECEIVED /delete-link REQUEST ==========")
    
    try:
        data = request.get_json()
        source_id = str(data.get("source_id"))
        destination_id = str(data.get("destination_id"))

        print(f"Source ID: {source_id}, Destination ID: {destination_id}")
        logger.info(f"Deleting link: {source_id} → {destination_id}")

        if not source_id or not destination_id:
            print("ERROR: Missing source or destination ID")
            return jsonify({"error": "Missing source or destination ID"}), 400

        if source_id in active_redirections and destination_id in active_redirections[source_id]:
            active_redirections[source_id].remove(destination_id)
            if not active_redirections[source_id]:
                del active_redirections[source_id]
            save_redirections()
            print("Link removed successfully")
            print("================================================")
            return jsonify({"status": "Link removed"}), 200
            
        print("ERROR: Link not found")
        print("================================================")
        return jsonify({"error": "Link not found"}), 404
    except Exception as e:
        print(f"UNHANDLED EXCEPTION: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Server error: " + str(e)}), 500

def get_lock(phone):
    if phone not in session_locks:
        session_locks[phone] = threading.Lock()
    return session_locks[phone]

# Debug endpoint to check if server is running
@auth_api.route('/ping', methods=['GET'])
def ping():
    print("PING received - server is running")
    return jsonify({"status": "Server is running"}), 200