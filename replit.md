# OCHAT

## Overview

A real-time chat/messenger application built with React frontend and Express backend. Users can join with a username and custom color, send messages, reply to messages, edit their own messages, and see other active users. The application uses polling for real-time updates and stores data in-memory (MemStorage).

## Architectural Guidelines
- **Strictly Local Database**: This project MUST only use in-memory storage or local file-based storage. NEVER use external databases like PostgreSQL, Replit Database, or any external services unless explicitly requested by the user.
- **No External Dependencies**: Keep all data local - no Replit DB, no external APIs for core functionality.
- **Witness Mode**: Direct chats support adding a third user (Witness) with the consent of all parties.

## Features
- **Real-time messaging** with 1-second polling
- **Photo sharing** with 2MB limit and download button (auto-deleted after 6 hours)
- **File sharing** with 5MB limit and 3-hour auto-deletion
- **Poll creation** with visual voting results, percentage bars, and winning option highlighting
- **Timer feature** with visual countdown display, quick presets (1/5/10/15/30 min), and completion notifications
- **Message reactions** with 8 quick-reaction emojis + 168-emoji picker (users cannot react to own messages)
- **Reply to messages** with inline preview
- **Edit messages** (if not locked)
- **Message locking** - users can lock others' messages to prevent editing AND deletion
- **User status** - online/away/busy/offline with visual indicators
- **Active user tracking** with heartbeat system (60-second threshold)
- **Manual refresh button** for active users list
- **Text formatting** - Ctrl+B for bold (**text**), Ctrl+I for italic (*text*), Ctrl+U for underline (__text__), Ctrl+H for Hyperlinks
- **Direct messaging** - Request/accept workflow for private conversations
- **DM Actions** - Edit, Delete, and Lock functionality for direct messages
- **DM pin messages** - Pin and unpin important messages in direct conversations
- **DM seen notifications** - Visual indicators showing when messages are read
- **Witness Mode** - Add a 3rd person to direct chats with mutual approval
- **Username validation** - Max 15 characters, English only (letters, numbers, underscores), reserved usernames blocked
- **Auto logout** - Username freed when user signs out or closes tab
- **24 color options** - Vibrant color picker with 6x4 grid
- **Admin Panel** - Password-protected panel at /admin to manage users and messages (password: admin123)
- **About Modal** - Info icon showing developer credits (Artin Zomorodian) and app features
- **Theme Selection** - Post-login toggle for Dark/Light mode
- **Mentions** - Support for @username mentions in public chat

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled with Vite
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state with polling strategy
  - Messages poll every 1 second for near real-time updates
  - Users list polls every 5 seconds
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme using CSS variables
- **Animations**: Framer Motion for smooth message and page transitions
- **Session Persistence**: localStorage stores user session (simulated authentication)

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for validation
- **Data Layer**: Drizzle ORM with PostgreSQL dialect
- **Storage Pattern**: Interface-based storage (`IStorage`) with in-memory implementation (`MemStorage`) that can be swapped for database storage

### Key API Endpoints
- `POST /api/users/login` - Create or authenticate user
- `GET /api/users` - List active users
- `POST /api/heartbeat` - Update user activity timestamp
- `PATCH /api/users/:id/status` - Update user status (online/away/busy/offline)
- `GET /api/messages` - Fetch all messages with user, reply data, and reactions
- `POST /api/messages` - Create new message (supports imageUrl)
- `PATCH /api/messages/:id` - Edit message (blocked if locked)
- `DELETE /api/messages/:id` - Delete message (blocked if locked)
- `POST /api/messages/:id/lock` - Lock message (prevent editing)
- `POST /api/messages/:id/unlock` - Unlock message
- `POST /api/reactions` - Add emoji reaction to message
- `DELETE /api/reactions` - Remove reaction
- `POST /api/upload` - Upload image (max 2MB, returns URL)
- `POST /api/dm/request` - Send DM request to another user
- `POST /api/dm/respond` - Accept or reject a DM request
- `GET /api/dm/requests/:userId` - Get pending DM requests for user
- `GET /api/dm/partners/:userId` - Get accepted DM partners
- `GET /api/dm/:userId1/:userId2` - Get direct messages between two users
- `POST /api/dm` - Send a direct message
- `GET /api/admin/users` - Get all users (admin)
- `GET /api/admin/messages` - Get all messages (admin)
- `DELETE /api/admin/users/:id` - Delete a user (admin)
- `DELETE /api/admin/messages/:id` - Delete a message (admin)
- `POST /api/admin/messages/clear` - Clear all messages (admin)

### Database Schema
Located in `shared/schema.ts`:
- **users**: id, username (unique), color, status (online/away/busy/offline)
- **messages**: id, userId, content, imageUrl, replyToId (self-reference), isEdited, isLocked, lockedByUserId, timestamp
- **reactions**: id, messageId, userId, emoji
- **dmRequests**: id, fromUserId, toUserId, status (pending/accepted/rejected), timestamp
- **directMessages**: id, fromUserId, toUserId, content, timestamp

### Build System
- Development: Vite dev server with HMR, proxied through Express
- Production: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`
- TypeScript path aliases: `@/*` for client, `@shared/*` for shared code

## External Dependencies

### Database
- **In-Memory Storage**: Uses MemStorage class for local data storage (no external database required)
- **Drizzle ORM**: Schema definition available for potential database migration

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **framer-motion**: Animation library for UI transitions
- **date-fns**: Date formatting for message timestamps
- **lucide-react**: Icon library
- **Radix UI**: Accessible UI primitives (via shadcn/ui)

### Backend Libraries
- **express**: Web framework
- **zod**: Runtime schema validation
- **drizzle-zod**: Generates Zod schemas from Drizzle tables
- **connect-pg-simple**: PostgreSQL session store (available but not currently used)

### Development Tools
- **Vite**: Frontend bundler with React plugin
- **esbuild**: Server bundler for production
- **tsx**: TypeScript execution for development