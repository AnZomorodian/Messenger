# How to Run OCHAT

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server (after build)

## Requirements

- Node.js 18+ 
- npm 9+

## Project Structure

```
├── client/          # React frontend
│   └── src/
│       ├── pages/   # Page components
│       ├── components/  # UI components
│       └── hooks/   # Custom React hooks
├── server/          # Express backend
│   ├── routes.ts    # API endpoints
│   └── storage.ts   # In-memory data storage
└── shared/          # Shared types and schemas
```

## Features

- Real-time messaging with polling
- Direct messages with edit, delete, and lock
- Photo and file sharing
- Polls
- Message reactions
- User status indicators
- Admin panel (password: admin123)
- Dark/Light mode toggle

## Environment

No external database required - uses in-memory storage.
