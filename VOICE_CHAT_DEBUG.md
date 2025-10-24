# Voice Chat Debug Guide

## Current Issues

### 1. Hindi/Nepali Words in English Responses ❌
**Example**: "Main timro, as a software developer..."
- "Main" = "I am" in Hindi
- "timro" = "yours" in Nepali

**Root Cause**: Backend `formatForInterview` function is adding these words
**Location**: Likely in `/src/app/api/chat/route.ts` or related RAG formatting

**Fix Needed**: Backend code review to remove Hindi/Nepali word injection

### 2. No History Being Created ❌
**Expected**: After ending conversation, history should appear as clickable item
**Actual**: No history items showing up

**Debugging Steps**:
1. Start voice conversation
2. Have 2-3 exchanges
3. Click "🛑 End Conversation" button
4. Open browser console (F12 / Cmd+Option+I)
5. Look for these logs:

```
🛑 ===== ENDING VOICE CONVERSATION =====
🛑 Current sessionId: voice_xxx
🛑 Conversation memory length: 3
📝 Generating history for conversation with 3 turns
📝 Calling generateConversationSummary...
📋 Creating history message with ID: history_xxx
📋 Has existing history? false
✅ Adding new history for session voice_xxx with 3 turns
```

**If missing these logs**: History creation function not being called
**If logs show "Has existing history? true"**: Duplicate prevention blocking creation

### 3. Different Conversations Connected ❌
**Issue**: Multiple session IDs in one conversation:
- `voice_1761310255899_nuwotnrp6_7633`
- `voice_1761310272241_8jnmee2n5_23974`

**Cause**: Session ID changing mid-conversation
**Expected**: One session ID per conversation until "End Conversation" clicked

## Testing Checklist

### Test 1: Simple Conversation
1. ✅ Click "Start New Conversation"
2. ✅ Ask: "Do you play football?"
3. ✅ Ask: "Tell me about your experience"
4. ✅ Click "🛑 End Conversation"
5. ❓ Check: Does history appear?
6. ❓ Check: Browser console logs?

### Test 2: Resume Conversation
1. ✅ Click on a history item
2. ✅ Ask another question
3. ✅ Click "🛑 End Conversation"
4. ❓ Check: Does history update (not duplicate)?

### Test 3: Language Detection
1. ✅ Ask in English: "What are your skills?"
2. ❓ Check: Is response pure English (no Hindi/Nepali)?

## Expected Session Flow

```
┌─────────────────────────────────────┐
│  Click "Start New Conversation"    │
└──────────────┬──────────────────────┘
               │
               ▼
      ┌────────────────────┐
      │ Create unique      │
      │ sessionId          │
      │ voice_123_abc_456  │
      └────────┬───────────┘
               │
               ▼
      ┌────────────────────┐
      │ Multiple exchanges │
      │ (same sessionId)   │
      └────────┬───────────┘
               │
               ▼
      ┌────────────────────┐
      │ Click "End         │
      │ Conversation"      │
      └────────┬───────────┘
               │
               ▼
      ┌────────────────────┐
      │ Create history     │
      │ item with that     │
      │ sessionId          │
      └────────────────────┘
```

## Browser Console Commands

```javascript
// Check current state
console.log('Session ID:', sessionId)
console.log('Memory length:', conversationMemory.length)
console.log('Voice messages:', voiceChatMessages.length)

// Check for histories
voiceChatMessages.filter(m => m.isClickableHistory)
```
