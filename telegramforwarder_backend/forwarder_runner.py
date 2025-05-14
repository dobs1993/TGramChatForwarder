# forwarder_runner.py

import asyncio
import json
import os
import logging
from telethon import TelegramClient, events
from telethon.sessions.memory import MemorySession
from dotenv import load_dotenv
import signal
import sys
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("forwarder.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("forwarder_runner")

load_dotenv()

API_ID = int(os.getenv("TG_API_ID") or "YOUR_API_ID")
API_HASH = os.getenv("TG_API_HASH") or "YOUR_API_HASH"
SESSION_DIR = "sessions"
REDIRECT_FILE = "active_redirections.json"

os.makedirs(SESSION_DIR, exist_ok=True)

# Global variables for handling graceful shutdown
running_clients = []
shutdown_event = asyncio.Event()

def handle_signals():
    """Setup signal handlers for graceful shutdown"""
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, lambda sig, _: handle_shutdown(sig))

def handle_shutdown(sig):
    """Handle shutdown signals"""
    logger.info(f"Received signal {sig}, shutting down gracefully...")
    shutdown_event.set()

async def cleanup():
    """Cleanup resources before shutdown"""
    logger.info(f"Disconnecting {len(running_clients)} clients...")
    await asyncio.gather(*[client.disconnect() for client in running_clients])
    logger.info("All clients disconnected")

async def forward_message(client, source_id, destination_id, message):
    """Forward a message with proper error handling and logging"""
    try:
        # Sanitize message content for logging (truncate if too long)
        log_message = message[:30] + "..." if len(message) > 30 else message
        logger.info(f"Forwarding: {source_id} → {destination_id}: {log_message}")
        await client.send_message(int(destination_id), message)
        return True
    except Exception as e:
        logger.error(f"Failed to forward from {source_id} to {destination_id}: {str(e)}")
        return False

def load_redirections():
    """Load redirections with error handling"""
    if not os.path.exists(REDIRECT_FILE):
        logger.warning(f"No redirection file found at {REDIRECT_FILE}")
        return {}
    
    try:
        with open(REDIRECT_FILE, "r") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing redirection file: {str(e)}")
        # Create backup of corrupted file
        backup_file = f"{REDIRECT_FILE}.bak"
        os.rename(REDIRECT_FILE, backup_file)
        logger.info(f"Corrupted file backed up to {backup_file}")
        return {}
    except Exception as e:
        logger.error(f"Unexpected error loading redirections: {str(e)}")
        return {}

async def setup_client(session_path):
    """Set up a single client with its event handlers"""
    try:
        # Extract phone number from session filename for logging
        session_file = os.path.basename(session_path)
        session_name = session_file.replace('.session', '')
        
        logger.info(f"Starting client for session: {session_name}")
        
        # Use memory session to avoid SQLite locking issues
        # but load data from the file session
        for attempt in range(3):
            try:
                client = TelegramClient(MemorySession(), API_ID, API_HASH)
                await client.connect()
                
                # Load session data manually
                file_client = TelegramClient(session_path, API_ID, API_HASH)
                await file_client.connect()
                if await file_client.is_user_authorized():
                    # Copy auth data if needed
                    client._self_id = file_client._self_id
                    await file_client.disconnect()
                    break
                else:
                    await file_client.disconnect()
                    logger.warning(f"Client {session_name} is not authorized. Skipping.")
                    return None
            except Exception as e:
                if "database is locked" in str(e) and attempt < 2:
                    logger.warning(f"Database lock detected, retrying in {(attempt+1)*0.5} seconds...")
                    time.sleep((attempt+1) * 0.5)
                else:
                    raise
        
        if not await client.is_user_authorized():
            logger.warning(f"Client {session_name} is not authorized even after loading. Skipping.")
            await client.disconnect()
            return None
        
        # Keep track of clients for graceful shutdown
        running_clients.append(client)
        
        # Load redirections for this client
        redirections = load_redirections()
        
        # Set up message handler
        @client.on(events.NewMessage())
        async def message_handler(event):
            if shutdown_event.is_set():
                return
                
            chat_id = str(event.chat_id)
            if chat_id in redirections:
                message_text = event.message.message
                if message_text:  # Only forward non-empty text messages
                    for dest_id in redirections[chat_id]:
                        await forward_message(client, chat_id, dest_id, message_text)
        
        logger.info(f"Client {session_name} started successfully")
        return client
    except Exception as e:
        logger.error(f"Error setting up client {os.path.basename(session_path)}: {str(e)}")
        return None

async def main():
    """Main function to run the forwarder"""
    logger.info("🚀 Telegram Forwarder starting up")
    
    # Set up signal handlers
    handle_signals()
    
    # Get all session files
    session_files = [
        os.path.join(SESSION_DIR, f) 
        for f in os.listdir(SESSION_DIR) 
        if f.endswith(".session")
    ]
    
    if not session_files:
        logger.warning("No session files found. Exiting.")
        return
    
    # Set up all clients
    clients = []
    session_paths = [f.replace('.session', '') for f in session_files]
    
    for session_path in session_paths:
        client = await setup_client(session_path)
        if client:
            clients.append(client)
    
    if not clients:
        logger.warning("No authorized clients could be started. Exiting.")
        return
    
    logger.info(f"✅ Successfully loaded {len(clients)} Telegram clients")
    logger.info("Listening for messages (Press Ctrl+C to stop)...")
    
    # Keep running until shutdown signal
    try:
        await shutdown_event.wait()
    finally:
        await cleanup()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received, exiting")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
    
    logger.info("Forwarder stopped")
    sys.exit(0)