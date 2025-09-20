# Manual Testing Checklist ✅

## Pre-Testing Setup

- [ ] Server is running (`npm run dev` or `yarn dev`)
- [ ] Environment variables are set:
  - [ ] `GROQ_API_KEY` (for advanced features)
  - [ ] `UPSTASH_VECTOR_REST_URL` (for vector search)
  - [ ] `UPSTASH_VECTOR_REST_TOKEN` (for vector search)
  - [ ] `DATABASE_URL` (for conversation memory)

## Quick Health Check

```bash
# 1. Basic server response
curl http://localhost:3000/api/chat -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Should return a response (not 404 or 500)
```

```bash  
# 2. System health
curl http://localhost:3000/api/rag-system?action=health

# Should show components as available/healthy
```

## Test Each RAG Pattern

### 1. Standard Agentic RAG ✅
**Test Query**: `"What's your name?"`

**Expected**:
- [ ] Quick response (< 1 second)
- [ ] `ragPattern: "standard_agentic"` in metadata
- [ ] Natural conversational response

### 2. Tool-Enhanced RAG ✅  
**Test Query**: `"Show me your GitHub repositories"`

**Expected**:
- [ ] `ragPattern: "tool_enhanced"` in metadata
- [ ] Response mentions GitHub/repositories
- [ ] `toolsUsed` array in metadata

### 3. Multi-hop RAG ✅
**Test Query**: `"Tell me about your Python experience and show me specific project examples"`

**Expected**:
- [ ] `ragPattern: "multi_hop"` in metadata
- [ ] `searchSteps: 2` or higher in metadata  
- [ ] Comprehensive response covering both topics

### 4. Hybrid Search RAG ✅
**Test Query**: `"Compare your Python vs Java experience"`

**Expected**:
- [ ] `ragPattern: "hybrid_search"` in metadata
- [ ] `fusionStrategy` in metadata
- [ ] Response compares both languages

### 5. Advanced Agentic RAG ✅
**Test Query**: Complex query in ongoing conversation

**Expected**:
- [ ] `ragPattern: "advanced_agentic"` in metadata
- [ ] Quality assessment metrics
- [ ] Execution plan details

## Context Awareness Testing

### Initial Question
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about your AI projects",
    "sessionId": "test-context-123",
    "enhancedMode": true
  }'
```

**Check**:
- [ ] Response received successfully
- [ ] Session context established

### Follow-up Question  
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you give me more details about that?",
    "sessionId": "test-context-123",
    "enhancedMode": true
  }'
```

**Expected**:
- [ ] `contextEnhanced.isFollowUp: true`
- [ ] Relevant entities detected
- [ ] Response references previous context

## Error Handling Testing

### 1. Invalid JSON
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"invalid": json}'
```

**Expected**:
- [ ] HTTP 400 error
- [ ] Helpful error message

### 2. Missing Fields
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**:
- [ ] Graceful error handling
- [ ] Clear error message about missing fields

### 3. Service Degradation
Temporarily disable services to test fallbacks:

**Expected**:
- [ ] System continues to work with reduced functionality
- [ ] Fallback to basic RAG when enhanced features fail
- [ ] No crashes or 500 errors

## Performance Testing

### Response Time Benchmarks
Test the same query 3 times and average the response times:

- [ ] Simple queries: < 500ms
- [ ] Complex queries: < 2000ms
- [ ] Tool-enhanced queries: < 3000ms
- [ ] Multi-hop queries: < 4000ms

### Memory Usage
Monitor conversation memory:

- [ ] Context properly maintained across messages
- [ ] Old conversations cleaned up automatically
- [ ] No memory leaks with long conversations

## Quality Assessment

### Response Quality Checklist
For each test response, verify:

- [ ] **Relevance**: Response addresses the question asked
- [ ] **Completeness**: Question is fully answered
- [ ] **Accuracy**: Information is correct and up-to-date
- [ ] **Clarity**: Response is well-structured and understandable
- [ ] **Consistency**: Tone and style match Sajal's voice

### Advanced Features Working
- [ ] Entity recognition identifies relevant concepts
- [ ] Intent classification correctly categorizes questions
- [ ] Conversation branching handles topic changes
- [ ] Quality scores are reasonable (> 0.6)

## System Monitoring

### Health Dashboard
```bash
# Get system statistics
curl http://localhost:3000/api/rag-system?action=stats

# Check configuration
curl http://localhost:3000/api/rag-system?action=config
```

**Verify**:
- [ ] Active conversations being tracked
- [ ] Top topics make sense
- [ ] All RAG patterns are available
- [ ] Performance metrics are reasonable

### Log Analysis
Check server logs for:

- [ ] No error messages during normal operation
- [ ] Pattern selection decisions logged clearly
- [ ] Tool execution results logged
- [ ] Performance metrics logged

## Edge Cases Testing

### 1. Very Long Messages
Test with a very long query (500+ words):

**Expected**:
- [ ] System handles gracefully
- [ ] Response time reasonable
- [ ] Quality maintained

### 2. Special Characters
Test with emojis, special characters, code snippets:

**Expected**:  
- [ ] Characters processed correctly
- [ ] No encoding issues
- [ ] Response handles special content

### 3. Multiple Rapid Requests
Send multiple requests quickly with same session:

**Expected**:
- [ ] All requests processed
- [ ] Context maintained correctly
- [ ] No race conditions

### 4. Empty or Whitespace Messages
Test with empty strings, only spaces, etc.:

**Expected**:
- [ ] Graceful error handling
- [ ] Helpful error messages
- [ ] No crashes

## Final Validation

### Overall System Check
- [ ] All RAG patterns can be triggered
- [ ] Context awareness works in conversations  
- [ ] Performance meets benchmarks
- [ ] Error handling is robust
- [ ] Quality metrics are good

### User Experience Check
- [ ] Responses sound natural and conversational
- [ ] Information is accurate and helpful
- [ ] Follow-up questions work smoothly
- [ ] System feels intelligent and responsive

### Production Readiness
- [ ] No console errors in normal operation
- [ ] Graceful degradation when services fail
- [ ] Monitoring and health checks work
- [ ] Documentation is up to date

---

## 🎯 Quick Test Commands

For rapid testing during development:

```bash
# Quick health check
curl localhost:3000/api/rag-system?action=health

# Test pattern selection
curl -X POST localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me your GitHub repos"}'

# Test context awareness  
curl -X POST localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me more", "sessionId": "test"}'

# Run full test suite
./test-advanced-rag.sh
```

## ✅ Success Criteria

Your advanced RAG system passes testing if:

1. **All RAG patterns can be triggered** (5/5 patterns working)
2. **Context awareness works** (follow-ups detected ≥90% of time)
3. **Performance meets benchmarks** (response times within limits)
4. **Error handling is robust** (no crashes, helpful messages)
5. **Quality is high** (responses are relevant, complete, accurate)
6. **System health is good** (all components available)

🎉 **Congratulations!** If all checks pass, your advanced RAG system is ready for production use!