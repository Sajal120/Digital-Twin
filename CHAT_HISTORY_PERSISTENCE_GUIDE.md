# Chat History Persistence Guide

## Current Status ✅

### What Works
- ✅ **Session Management**: Each conversation gets a unique session ID
- ✅ **Title Generation**: Smart extraction creates meaningful titles like "Key Skills Expertise" and "Play Basketball"
- ✅ **History Display**: Histories show correctly in sidebar during active session
- ✅ **Session Switching**: Can switch between conversations and resume them
- ✅ **Update Logic**: When you continue a conversation, it updates the same history (no duplicates)

### What Doesn't Work ❌
- ❌ **Persistence Across Page Reloads**: Histories disappear when you refresh the page
- ❌ **Persistence Across Deployments**: Histories disappear when serverless functions restart

## Root Cause 🔍

The Memory API (`/src/app/api/voice/memory/route.ts`) uses **in-memory storage**:

```typescript
const conversationSummaries = new Map<string, {...}>()
```

This means:
- Data is stored in RAM of the serverless function
- When the function "cold starts" (restarts), all data is lost
- This happens on every deployment, and periodically when functions are idle

## Log Analysis from Your Test 📊

```
✅ Loaded 0 plain chat histories  ← Memory cleared (cold start)

Session 1: chat_1761554461196_m07i3ujsr
✅ Title from words: Play Basketball
💾 Plain chat history saved to memory

Session 2: chat_1761554478383_xylyiqhco
✅ Title from words: Key Skills Expertise
💾 Plain chat history saved to memory
```

**Both sessions are UNIQUE and SEPARATE** ✅
- Different session IDs
- Different titles
- No linking between them

**But they're both stored in RAM** ⚠️
- Lost on page refresh
- Lost on function restart
- Only available during current session

## Solutions

### Option 1: Vercel KV (Redis) - Recommended ⭐

**Pros:**
- ✅ True persistence across all sessions
- ✅ Fast (Redis-based)
- ✅ Free tier: 30,000 commands/month
- ✅ Easy setup with Vercel

**Setup Steps:**

1. Install Vercel KV:
```bash
pnpm add @vercel/kv
```

2. Create KV Database in Vercel:
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to Storage → Create Database → KV
   - Copy environment variables

3. Add to `.env.local`:
```env
KV_REST_API_URL="your-kv-url"
KV_REST_API_TOKEN="your-kv-token"
```

4. Update Memory API:
```typescript
import { kv } from '@vercel/kv'

// Replace Map with KV
export async function POST(request: NextRequest) {
  // Save
  await kv.set(`chat:${sessionId}`, {
    summary,
    timestamp: new Date(),
    turnCount,
    memory,
    title,
    chatType
  })
  
  // Get
  const data = await kv.get(`chat:${sessionId}`)
  
  // Get all by type
  const keys = await kv.keys('chat:*')
  const histories = await Promise.all(
    keys.map(key => kv.get(key))
  )
  const filtered = histories.filter(h => h.chatType === chatType)
}
```

### Option 2: Upstash Redis - Alternative

Similar to Vercel KV but with different pricing:
```bash
pnpm add @upstash/redis
```

### Option 3: PostgreSQL - Full Database

You already have Postgres setup for Payload CMS. Could create a `chat_histories` table:

```sql
CREATE TABLE chat_histories (
  session_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  chat_type TEXT NOT NULL,
  summary TEXT,
  turn_count INTEGER,
  memory JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Option 4: localStorage - Temporary Workaround ⚠️

**Pros:**
- ✅ No backend changes needed
- ✅ Works immediately
- ✅ Persists across page reloads

**Cons:**
- ❌ Only works on same browser/device
- ❌ Limited to ~5-10MB storage
- ❌ Can't sync across devices

**Implementation:**

Add to `AIControllerChat.tsx`:

```typescript
// Save to both API and localStorage
const saveHistory = async (sessionId: string, data: any) => {
  // Save to API (temporary)
  await fetch('/api/voice/memory', {
    method: 'POST',
    body: JSON.stringify({ action: 'save', sessionId, ...data })
  })
  
  // Save to localStorage (persistent)
  const existing = JSON.parse(localStorage.getItem('plainChatHistories') || '[]')
  const index = existing.findIndex((h: any) => h.sessionId === sessionId)
  
  if (index >= 0) {
    existing[index] = { sessionId, ...data, timestamp: new Date().toISOString() }
  } else {
    existing.push({ sessionId, ...data, timestamp: new Date().toISOString() })
  }
  
  localStorage.setItem('plainChatHistories', JSON.stringify(existing))
}

// Load from localStorage first, then API
const loadHistories = async () => {
  // Try localStorage first
  const localHistories = JSON.parse(localStorage.getItem('plainChatHistories') || '[]')
  
  if (localHistories.length > 0) {
    console.log('📦 Loaded from localStorage:', localHistories.length)
    return localHistories
  }
  
  // Fallback to API
  const response = await fetch('/api/voice/memory?chatType=plain_chat')
  const data = await response.json()
  return data.histories || []
}
```

## Recommendation 🎯

**For Production:** Use **Vercel KV** (Option 1)
- Takes 5 minutes to setup
- Free tier is generous
- Purpose-built for this use case

**For Quick Testing:** Use **localStorage** (Option 4)
- Works immediately
- Good enough for demo/testing
- Can migrate to KV later

## Current Behavior Summary

Your implementation is **100% correct** ✅
- Sessions are unique and separate
- Titles are meaningful
- No duplicate entries
- Histories display correctly in sidebar

The only issue is **persistence**, which requires backend storage beyond in-memory Map.

## Next Steps

Choose one of the options above based on your needs:
- Production app → Vercel KV
- Quick demo → localStorage
- Enterprise → PostgreSQL

Would you like me to implement any of these solutions?
