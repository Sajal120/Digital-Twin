# AI Language Detection - Testing Plan

## Quick Test Checklist

### Prerequisites
✅ Ensure `GROQ_API_KEY` is set in `.env.local`

### Test Cases

#### 1. Devanagari Script (Fast Path - Pattern Matching)
```
Input: "नमस्ते, कैसे हो?"
Expected: Detected as "hi" via pattern matching (Devanagari unicode)
Expected Response: Hindi language response
Time: <1ms detection
Cost: $0
```

#### 2. Common Hinglish (Fast Path - Pattern Matching)
```
Input: "kaise ho bhai?"
Expected: Detected as "hi" via pattern matching (keyword: kaise, bhai)
Expected Response: Hindi language response
Time: <1ms detection
Cost: $0
```

#### 3. Ambiguous Hinglish (AI Path - Groq API)
```
Input: "kese ho?"
Expected: Pattern matching fails → AI detects as "hi"
Expected Response: Hindi language response
Time: ~100ms detection
Cost: $0.00001
```

#### 4. Mixed Language (AI Path)
```
Input: "how are you yaar?"
Expected: AI detects as "hi" (Hindi intent with "yaar")
Expected Response: Hindi language response
Time: ~100ms detection
Cost: $0.00001
```

#### 5. Pure English (Fast Path - Default)
```
Input: "How are you?"
Expected: Pattern matching → defaults to "en"
Expected Response: English language response
Time: <1ms detection
Cost: $0
```

#### 6. Spanish (Fast Path - Pattern Matching)
```
Input: "¿Cómo estás?"
Expected: Detected as "es" via diacritics (¿)
Expected Response: Spanish language response
Time: <1ms detection
Cost: $0
```

#### 7. Typo/Variant (AI Path)
```
Input: "kase ho?"
Expected: Pattern matching fails → AI detects as "hi"
Expected Response: Hindi language response
Time: ~100ms detection
Cost: $0.00001
```

## Console Log Verification

### Expected Frontend Logs

**Fast Path:**
```
🌐 Detected Devanagari script (Hindi/Nepali)
OR
🌐 Detected Hinglish (Hindi/Nepali in Roman script)
```

**AI Path:**
```
🤖 Using AI to detect language...
🤖 AI detected language: hi
```

### Expected Backend Logs

**AI Detection:**
```
🌐 AI detected language: hi
🌍 Language detected: hi (confidence: 0.99)
🎯 Selected pattern: standard_agentic
```

**Fast Pattern:**
```
📞 Detected language: hi (hi)
🌍 Language detected: hi (confidence: 0.95)
```

## Performance Benchmarks

| Metric | Target | Acceptable |
|--------|--------|-----------|
| AI Detection Time | <100ms | <200ms |
| Pattern Detection | <1ms | <5ms |
| Total Response Time | <900ms | <1500ms |
| Detection Accuracy | >98% | >95% |
| AI Detection Rate | 20-40% | 10-50% |

## Cost Monitoring

### Daily Check
```bash
# Check Groq API usage
# Login to: https://console.groq.com/usage

# Expected costs per day:
# Low usage (100 chats): $0.0003/day
# Medium usage (1000 chats): $0.003/day
# High usage (10000 chats): $0.03/day
```

### Monthly Alert Thresholds
- ⚠️ Yellow: $1/month (higher than expected)
- 🚨 Red: $5/month (investigate optimization)
- 🛑 Critical: $10/month (something wrong)

## Browser DevTools Testing

### Step-by-Step

1. **Open DevTools** (F12 or Cmd+Opt+I)

2. **Go to Console tab**

3. **Navigate to plain chat**
   - URL: `http://localhost:3000` (or your domain)
   - Click on plain chat mode

4. **Type test messages**
   - Start with Devanagari: "नमस्ते"
   - Then Hinglish: "kaise ho"
   - Then ambiguous: "kese ho"

5. **Verify console logs**
   - Check for 🤖 emoji (AI detection)
   - Check for 🌐 emoji (pattern detection)
   - Verify detectedLanguage value

6. **Check Network tab**
   - Filter: `/api/chat`
   - Check Request payload: `detectLanguage: true` (for AI path)
   - Check Response: `detectedLanguage: "hi"` (for AI path)

## Common Issues & Solutions

### Issue 1: AI Detection Not Triggering
**Symptoms**: Always seeing pattern matching, never AI
**Check**:
- Is `GROQ_API_KEY` set?
- Is the query really ambiguous? (try "kese ho")
- Check console for "🤖 Using AI to detect language..."

### Issue 2: Wrong Language Detected
**Symptoms**: English response for Hindi query
**Check**:
- Check console log for detected language
- Verify pattern matching keywords
- Test with AI path (ambiguous query)

### Issue 3: Slow Responses
**Symptoms**: >2 second response time
**Check**:
- Check network tab for API response time
- Groq should respond in <100ms
- If slow, might be Groq API issue

### Issue 4: High Costs
**Symptoms**: Groq bill >$5/month
**Check**:
- What % of queries use AI? (should be 20-40%)
- Are you caching language per session?
- Check for retry loops

## Production Readiness Checklist

### Before Deployment
- [ ] Groq API key in production environment
- [ ] Test all 7 test cases
- [ ] Verify console logs
- [ ] Check response accuracy
- [ ] Monitor initial costs (first 24h)
- [ ] Set up cost alerts
- [ ] Document user feedback process

### Post-Deployment
- [ ] Monitor detection rate (AI vs pattern)
- [ ] Check accuracy (user satisfaction)
- [ ] Track costs daily (first week)
- [ ] Gather user feedback
- [ ] Optimize patterns based on data
- [ ] Consider caching optimizations

## Success Metrics

### Week 1 Goals
- ✅ AI detection working for ambiguous cases
- ✅ Pattern matching for obvious cases
- ✅ <$1 total cost for the week
- ✅ No user complaints about language
- ✅ 98%+ detection accuracy

### Month 1 Goals
- ✅ Stable detection rate (20-40% AI, 60-80% pattern)
- ✅ <$5 total cost for the month
- ✅ User feedback: "responses are in my language"
- ✅ No language-related support tickets
- ✅ 99%+ detection accuracy

## Rollback Plan

If issues occur:

### Option 1: Disable AI Detection (Pattern Only)
```typescript
// In AIControllerChat.tsx, line ~301
useAIDetection = false // Force pattern-only detection
```

### Option 2: Increase AI Detection Threshold
```typescript
// Use AI for fewer cases
if (hindiWords.test(currentQuestion)) {
  detectedLanguage = 'hi'
  // Don't use AI, pattern is good enough
}
```

### Option 3: Remove detectLanguage Parameter
```typescript
// In API call, remove:
detectLanguage: chatMode === 'plain_chat' && useAIDetection,
// System will use pattern matching only
```

## Next Steps After Testing

1. **Optimize Patterns**: Add more common words based on logs
2. **Add Caching**: Cache language per session (reduce API calls)
3. **User Preference**: Allow manual language selection
4. **Analytics**: Track detection accuracy and costs
5. **A/B Testing**: Compare AI vs pattern-only accuracy

---

**Status**: Ready for testing
**Estimated Test Time**: 15 minutes
**Required**: Browser, console access, test messages

