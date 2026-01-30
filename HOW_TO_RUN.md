# How to Run OCHAT

## Quick Start

1. **Open the project** in Replit
2. **Click the Run button** - the app will start automatically
3. **Open the webview** to access the chat application

## Features Guide

### Joining the Chat
- Enter a username (2-20 characters)
- Select your color from 24 available options
- Click "Join Chat"
- Note: Reserved names like "admin" or "support" cannot be used
- Note: If someone is already using a username, you cannot use it while they're active

### Sending Messages
- Type your message in the input field
- Press Enter or click the Send button
- Use the emoji picker to add reactions

### Text Formatting
- **Bold**: Select text and press `Ctrl+B` (or `Cmd+B` on Mac)
- *Italic*: Select text and press `Ctrl+I` (or `Cmd+I` on Mac)
- Format appears as: `**bold**` and `*italic*`

### Sharing Photos
- Click the image icon next to the input
- Select an image (max 2MB)
- Photos are automatically deleted after 6 hours

### Replying to Messages
- Hover over a message and click the reply icon
- Your reply will appear with a reference to the original message

### Editing Your Messages
- Hover over your message and click the edit icon
- Edit the text and press Enter to save
- Note: You cannot edit locked messages

### Message Locking
- Other users can lock your messages
- Locked messages cannot be edited or deleted
- The locker can unlock them later

### Reactions
- Click the smiley icon on any message
- Choose from 8 quick reactions or 168+ emojis
- You cannot react to your own messages

### Status
- Click your status indicator in the sidebar
- Choose: Online, Away, Busy, or Offline
- When Offline, you cannot send messages

### Direct Messages (DM)
1. Click the DM icon next to a user's name in the sidebar
2. A request is sent to that user
3. When they accept, you can chat privately
4. Access your DM conversations from the sidebar

## Technical Notes

- Messages refresh every 1 second
- User list refreshes every 5 seconds
- All data is stored in memory (resets when server restarts)
- No external database required
