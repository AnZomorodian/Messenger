# Messenger

## Overview

A real-time chat/messenger application built with React frontend and Express backend. Users can join with a username and custom color, send messages, reply to messages, edit their own messages, and see other active users. The application uses polling for real-time updates and stores data in PostgreSQL using Drizzle ORM.

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
- `GET /api/messages` - Fetch all messages with user and reply data
- `POST /api/messages` - Create new message
- `PATCH /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

### Database Schema
Located in `shared/schema.ts`:
- **users**: id, username (unique), color
- **messages**: id, userId, content, replyToId (self-reference), isEdited, timestamp

### Build System
- Development: Vite dev server with HMR, proxied through Express
- Production: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`
- TypeScript path aliases: `@/*` for client, `@shared/*` for shared code

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema definition and query building
- **drizzle-kit**: Database migrations (`npm run db:push`)

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