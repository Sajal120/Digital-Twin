# Speed Optimization Testing Guide
**Date:** October 7, 2025  
**Purpose:** Verify chat system performance improvements

---

## 🧪 Quick Testing Checklist

### 1. Test Cache Performance

#### First Request (Cache Miss)
```bash
# Open browser console or use curl
curl -X POST https://www.sajal-app.online/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are your skills?", "user_id": "test-user"}'
```

**Expected:**
- Response time: 3-8 seconds
- Console log: `❌ Cache MISS`
- Console log: `💾 Cached response`

#### Second Request (Cache Hit)
```bash
# Same query within 15 minutes
curl -X POST https://www.sajal-app.online/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are your skills?", "user_id": "test-user"}'
```

**Expected:**
- Response time: <1 second ⚡
- Console log: `🎯 Cache HIT`
- Console log: `⚡ CACHE HIT! Returning cached response (instant)`

---

### 2. Test Vector Search Speed

#### Web Chat (topK=5)
```bash
curl -X POST https://www.sajal-app.online/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about your AI projects", "user_id": "test-user"}'
```

**Expected:**
- Vector search time: 0.8-1.5 seconds
- Console log: `🔎 Vector search: "..."`
- Console log: Results found with topK=5

#### Phone Mode (topK=3)
```bash
curl -X POST https://www.sajal-app.online/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is your experience?", "phoneOptimized": true, "user_id": "test-user"}'
```

**Expected:**
- Vector search time: 0.5-1 second
- Console log: `📞 Phone mode`
- Console log: Results found with topK=3

---

### 3. Test Audio Caching

#### First Phone Call (Generate Audio)
Test by making a phone call and asking a question.

**Expected:**
- ElevenLabs called
- Audio generated: 2-4 seconds
- Console log: `🎤 Generating YOUR voice response...`
- Console log: `💾 Cached audio URL for: "..."`

#### Second Call (Cached Audio)
Ask the same question again within 1 hour.

**Expected:**
- No ElevenLabs call
- Audio served instantly: <1 second
- Console log: `⚡ Using cached audio URL (instant)`

---

### 4. Test Parallel Processing

#### Web Chat with Context
```bash
curl -X POST https://www.sajal-app.online/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What did we just discuss?",
    "conversationHistory": [
      {"role": "user", "content": "Tell me about your skills"},
      {"role": "assistant", "content": "I have experience in..."}
    ],
    "user_id": "test-user"
  }'
```

**Expected:**
- Console log: `⚡ Running context enhancement and language detection in parallel...`
- Console log: `⚡ Parallel processing completed in XXXms (saved ~50% time)`
- Total context processing: 2-3 seconds (was 4-6 seconds)

---

### 5. Test Database Non-Blocking

#### Send Message and Check Response Time
```bash
# Time the request
time curl -X POST https://www.sajal-app.online/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "user_id": "test-user"}'
```

**Expected:**
- Response returned immediately (don't wait for DB write)
- Console log: `✅ User message saved to database` (appears after response)
- Console log: `✅ Assistant message saved to database` (appears after response)

---

### 6. Test Timeout Optimizations

#### MCP Timeout (Should complete in 15s for phone, 30s for web)
```bash
# Phone mode - should timeout at 15s if MCP fails
curl -X POST https://www.sajal-app.online/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Complex query here", "phoneOptimized": true, "user_id": "test-user"}'
```

**Expected:**
- MCP completes or times out at 15s (phone) or 30s (web)
- Console log: `⏱️ MCP mode: PHONE ⚡ (15000ms timeout)` or `WEB (30000ms timeout)`

---

## 📊 Performance Benchmarks

### Target Response Times

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| First chat message | 15-25s | 3-8s | **67% faster** |
| Cached message | 15-25s | <1s | **95% faster** |
| Phone call (first) | 20-30s | 5-12s | **60% faster** |
| Phone call (cached) | 20-30s | 2-4s | **90% faster** |
| Vector search | 2-4s | 0.8-1.5s | **60% faster** |

---

## 🔍 Monitoring Commands

### Check Cache Stats
Add this to your code temporarily:
```typescript
import { getCacheStats } from '@/lib/redis-cache'
const stats = await getCacheStats()
console.log('📊 Cache Stats:', stats)
```

### Check Redis Keys (CLI)
```bash
# Connect to Upstash Redis CLI
# Count cached responses
SCAN 0 MATCH "response:*" COUNT 100
# Count cached audio
SCAN 0 MATCH "audio:*" COUNT 100
```

### Monitor API Calls
Check your service dashboards:
- **Groq:** https://console.groq.com/usage
- **OpenAI:** https://platform.openai.com/usage
- **Upstash:** https://console.upstash.com
- **ElevenLabs:** https://elevenlabs.io/app/usage

---

## ⚠️ Troubleshooting

### Cache Not Working
1. Check Redis credentials in `.env`
2. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Check console logs for `❌ Redis GET error`

### Audio Caching Not Working
1. Check ElevenLabs API key
2. Verify blob uploads to Vercel
3. Check console logs for `💾 Cached audio URL`

### Database Issues
1. Database writes are non-blocking now
2. Check console logs for `❌ Failed to insert message`
3. Messages should still save, just asynchronously

### Slow Responses Despite Optimizations
1. Clear Redis cache and test again
2. Check network latency to APIs
3. Verify all paid services are active (not free tier limits)

---

## 🎯 Success Criteria

✅ Cache hit rate: 50-70%  
✅ First response: 3-8 seconds  
✅ Cached response: <1 second  
✅ Phone calls: 5-12 seconds  
✅ API calls reduced: 40-60%  
✅ No errors or regressions  

---

## 📝 Testing Checklist

- [ ] Test cache miss (first request)
- [ ] Test cache hit (repeat request)
- [ ] Test vector search speed
- [ ] Test audio caching
- [ ] Test parallel processing
- [ ] Test database non-blocking
- [ ] Test timeout handling
- [ ] Monitor API usage reduction
- [ ] Test phone call flow
- [ ] Verify no regressions

---

## 🚀 Next Steps

After testing:
1. Monitor production metrics for 24-48 hours
2. Check cache hit rates in Redis
3. Verify API cost reduction
4. Collect user feedback on perceived speed
5. Adjust cache TTLs if needed (15 min → 30 min for even better hit rates)

---

**Need help?** Check console logs - they're very detailed now! 🔍
