# WhatsApp Birthday Bot 🤖

A WhatsApp bot that automatically sends birthday messages to group members with customizable images and messages.

## Features ✨

- Automated birthday messages in WhatsApp groups
- Support for custom birthday images
- Group management commands
- QR code authentication
- Persistent session management
- Scheduled birthday notifications

## Prerequisites 📋

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A WhatsApp account
- PostgreSQL database (for birthday data management)

## Installation 🚀

1. Clone the repository:
```bash
git clone <your-repository-url>
cd whatsapp-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `birthdays.json` file in the root directory with the following structure:
```json
[
  {
    "name": "Person Name",
    "date": "MM-DD",
    "jid": "phone_number@s.whatsapp.net",
    "group": "group_id@g.us",
    "image": "optional_image_url"
  }
]
```

## Usage 📱

1. Start the bot:
```bash
node birthday/index.js
```

2. Scan the QR code with your WhatsApp mobile app to authenticate the bot.

3. Available Commands:
- `!test` - Test if the bot is working
- `!groups` - List all groups the bot is in
- `!groupid` - Get the current group's ID (use in a group)
- `!groupinfo <group-id>` - Get detailed information about a specific group

## Configuration ⚙️

### Birthday Messages
The bot will automatically send birthday messages at 9 AM daily to the specified groups. Messages can include:
- Text messages with mentions
- Custom images (if provided in the birthdays.json)
- Group-specific messages

### Authentication
The bot uses multi-file authentication state for better reliability. Authentication data is stored in the `auth_info_baileys` directory.

## Dependencies 📦

- @whiskeysockets/baileys - WhatsApp Web API
- node-schedule - For scheduling birthday messages
- pino - For logging
- qrcode-terminal - For QR code display
- axios - For downloading images

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Support 💬

If you encounter any issues or have questions, please open an issue in the repository.

## Acknowledgments 🙏

- Thanks to the @whiskeysockets/baileys team for the WhatsApp Web API
- All contributors and users of this bot 