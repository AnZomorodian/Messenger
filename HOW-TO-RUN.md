# OCHAT - Real-Time Chat Application

A modern, feature-rich real-time messaging platform built with React and Express.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open in browser
# Navigate to http://localhost:5000
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server (after build) |

## Requirements

- Node.js 18+
- npm 9+

## Features

### Core Messaging
- Real-time messaging with 1-second polling
- Text formatting: **Bold** (Ctrl+B), *Italic* (Ctrl+I), __Underline__ (Ctrl+U)
- Hyperlinks with [text](url) markdown format
- @mentions with notifications
- Message replies with inline preview

### Media Sharing
- Photo sharing (2MB limit, auto-deleted after 6 hours)
- File sharing (5MB limit, 3-hour auto-deletion)

### Interactive Features
- Polls with visual voting results
- 168 emoji reactions
- Personal timers with countdown display
- Message locking (prevent editing/deletion)

### Direct Messages
- Request/accept workflow for private conversations
- Edit, delete, and lock DM messages
- Pin important messages
- Read receipts (seen notifications)
- Witness Mode - add a 3rd person with mutual consent

### User Experience
- User status indicators (Online, Away, Busy, Offline)
- Dark/Light theme toggle
- Vibrant 24-color user color picker
- Auto-logout when tab closes

### Administration
- Password-protected admin panel (/admin)
- User management (view, delete, ban)
- Message management (view, delete, clear all)
- View DM conversations
- Export data as JSON
- Default password: `admin123`

## Project Structure

```
├── client/              # React frontend (Vite)
│   └── src/
│       ├── pages/       # Page components (Chat, Login, Admin)
│       ├── components/  # Reusable UI components
│       └── hooks/       # Custom React hooks
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   └── storage.ts       # In-memory data storage
└── shared/              # Shared types and schemas
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold text |
| Ctrl+I | Italic text |
| Ctrl+U | Underline text |
| Ctrl+H | Insert hyperlink |

## Environment

- **No external database required** - uses in-memory storage
- All data is stored locally and resets on server restart
- Perfect for development and testing

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TanStack Query, Tailwind CSS, Framer Motion
- **Backend**: Express, Node.js, TypeScript
- **UI Components**: shadcn/ui, Radix UI, Lucide Icons

## Tips

1. Join with a unique username (max 15 characters, English only)
2. Pick a color to personalize your messages
3. Use @username to mention other users
4. Create polls to gather opinions
5. Set timers for reminders
6. Pin important DM messages for quick access

---

Built with love by Artin Zomorodian
