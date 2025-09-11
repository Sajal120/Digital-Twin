# Simple Chat Backend with Neon Postgres

A minimal chatbot backend that connects directly to your Neon Postgres database using the `pg` library. This bypasses Payload's database handling and provides direct PostgreSQL operations.

## Features

- �️ **Direct Neon Connection**: Uses `pg` library to connect directly to your Neon Postgres database
- � **Simple Messages Table**: Basic structure with id, user_id, role, content, and created_at
- 🔄 **Context Management**: Returns last 20 messages for conversation context
- 🎯 **Clean API**: Single `/api/chat` endpoint for inserting and retrieving messages
- � **Admin View**: Read-only Payload CMS collection for viewing messages

## Database Schema

Simple messages table in your Neon Postgres database:

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoint

### POST `/api/chat`
Insert a new message and get the last 20 messages as context.

**Request:**
```json
{
  "user_id": "user123",
  "role": "user",
  "content": "Hello, how are you?"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": 1,
    "user_id": "user123",
    "role": "user", 
    "content": "Hello, how are you?",
    "created_at": "2025-09-09T12:00:00Z"
  },
  "context": [...], // Last 20 messages
  "total": 1
}
```

### GET `/api/chat`
Retrieve recent messages.

**Query Parameters:**
- `user_id`: Filter by user ID
- `limit`: Number of messages (default: 20)

## Usage Example

```typescript
import { ChatClient } from '@/utilities/chatClient'

const client = new ChatClient()

// Send a user message
const response = await client.sendMessage({
  user_id: 'user123',
  role: 'user',
  content: 'Hello there!'
})

console.log('New message:', response.message)
console.log('Context:', response.context)
```

## Direct Database Usage

```typescript
import { ChatDatabase } from '@/utilities/database'

// Insert a message
const message = await ChatDatabase.insertMessage({
  user_id: 'user123',
  role: 'assistant',
  content: 'Hello! How can I help you today?'
})

// Get recent messages
const messages = await ChatDatabase.getRecentMessages(20, 'user123')
```

## Environment Setup

Make sure your `.env` file has:

```bash
DATABASE_URL=postgresql://neondb_owner:password@host/neondb?sslmode=require
PAYLOAD_SECRET=your-secret
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

## Testing

Test the API with curl:

```bash
# Send a message
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "role": "user", "content": "Hello!"}'

# Get messages
curl "http://localhost:3000/api/chat?user_id=test&limit=5"
```

## Development

```bash
# Install dependencies (already done)
pnpm install

# Start development server
pnpm dev

# The messages table will be created automatically when you first run the app
```

## What's Different

This implementation:
- Uses **direct PostgreSQL connections** with `pg` library
- **Bypasses Payload's database layer** completely for messages
- Uses **simple SERIAL IDs** instead of UUIDs
- Has a **minimal schema** focused on core chat functionality
- Provides **read-only admin view** in Payload CMS for message management

The Payload Messages collection is configured as read-only and serves only as an admin interface to view messages stored directly in your Neon database.