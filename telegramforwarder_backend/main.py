# main.py
from flask import Flask, jsonify
from flask_cors import CORS
from regex_trainer_api import app as regex_app
from telegram_auth_api import auth_api

app = Flask(__name__)
# Allow all origins during debugging
CORS(app, supports_credentials=True, origins=["*"])
app.register_blueprint(regex_app)
app.register_blueprint(auth_api, url_prefix='/')  # Applies to /send-code, /verify-code, etc.

@app.route('/ping', methods=['GET', 'OPTIONS'])
def ping():
    print("PING received - server is running")
    return jsonify({"status": "Server is running"}), 200

if __name__ == '__main__':
    print("Starting Telegram Forwarder backend server on port 5001...")
    print("API endpoints available:")
    print("  - /ping (GET) - Check if server is running")
    print("  - /send-code (POST) - Request verification code")
    print("  - /verify-code (POST) - Verify with code")
    print("  - /get-chats (POST) - Get user's chats")
    print("  - /set-link (POST) - Create forwarding rule")
    print("  - /get-links (POST) - Get active links")
    print("  - /delete-link (POST) - Delete a link")
    app.run(host='0.0.0.0', port=5001)