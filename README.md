# Telegram Chat Forwarder

A secure, privacy-focused application for managing Telegram message forwarding between chats, channels, and groups.

![Telegram Forwarder](https://telegram.org/img/t_logo.png)

## Features

- **Connect your Telegram account** securely using Telegram's official authentication process
- **Forward messages** between any chats you have access to
- **Manage active links** to monitor and delete forwarding rules
- **Filter messages** based on content patterns (Premium feature)
- **Privacy-first design** - your messages are never stored or read

## Setup

### Prerequisites

- Node.js (v18 or higher)
- Python 3.7+
- Telegram API credentials (API ID and API Hash)

### Backend Setup

1. Install dependencies:
   ```bash
   cd telegramforwarder_backend
   pip install -r requirements.txt
   ```

2. Create a `.env` file with your Telegram API credentials:
   ```
   TG_API_ID=your_api_id
   TG_API_HASH=your_api_hash
   ```

3. Run the backend server:
   ```bash
   python main.py
   ```

4. In a separate terminal, run the message forwarder:
   ```bash
   python forwarder_runner.py
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. **Authentication**: Connect your Telegram account using your phone number and verification code
2. **Create Links**: Set up forwarding rules between source and destination chats
3. **Message Forwarding**: The forwarder service monitors your connected chats and automatically forwards messages according to your rules
4. **Manage Links**: View and delete active forwarding rules as needed

## Privacy & Security

- We do not store the content of your messages
- Session data is stored locally on your device
- All communication with the Telegram API is done using the official Telethon library
- Data transmission between frontend and backend is secured

## Development

- Frontend: Next.js 15 / React 19 with Tailwind CSS
- Backend: Python Flask with Telethon library
- Storage: Local JSON files for forwarding rules

## Disclaimer

This tool is for personal use only. Please respect Telegram's Terms of Service and do not use this tool to spam or otherwise abuse Telegram's platform.

## License

MIT License