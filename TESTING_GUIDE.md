# Testing Guide for Advanced RAG Patterns

## Overview

This guide provides multiple ways to test your advanced RAG implementation, from quick manual tests to comprehensive automated test suites.

## 🚀 Quick Start Testing

### 1. **Basic Health Check**
First, ensure your server is running and the system is healthy:

```bash
# Start your Next.js server
npm run dev
# or
yarn dev

# Test basic health
curl http://localhost:3000/api/rag-system?action=health
```

### 2. **Simple Manual Tests**
Test basic functionality with curl:

```bash
# Simple query
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what is your name?", "enhancedMode": true}'

# GitHub query (should trigger tool-enhanced RAG)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me your GitHub repositories", "enhancedMode": true}'

# Complex query (should trigger multi-hop RAG)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about your Python experience and show me specific project examples", "enhancedMode": true}'
```

## 🧪 Automated Testing Options

### Option 1: Shell Script (Recommended for Quick Tests)

```bash
# Run the comprehensive shell test
./test-advanced-rag.sh

# Verbose output
./test-advanced-rag.sh --verbose

# Custom API base
./test-advanced-rag.sh --api-base http://localhost:3001
```

### Option 2: Node.js Test Suite (Comprehensive)

```bash
# Run all tests
node test-advanced-rag.js

# Test specific areas
node test-advanced-rag.js --health
node test-advanced-rag.js --patterns
node test-advanced-rag.js --followup

# Test a single query
node test-advanced-rag.js --single "Tell me about your projects"
```

### Option 3: Python Unit Tests (Detailed Analysis)

```bash
# Install dependencies first
pip install aiohttp

# Run unit tests
python test-advanced-rag-unit.py

# Results will be saved to test-results.json
```

## 📊 What Each Test Covers

### 1. **Pattern Selection Tests**
Verifies that different query types trigger the appropriate RAG patterns:

| Query Type | Expected Pattern | Example |
|------------|------------------|---------|
| Simple questions | `standard_agentic` | "What's your name?" |
| GitHub queries | `tool_enhanced` | "Show me your repos" |
| Complex queries | `multi_hop` | "Tell me about X and show me Y" |
| Comparisons | `hybrid_search` | "Compare Python vs Java" |
| Follow-ups | Context-aware | "Tell me more about that" |

### 2. **Context Awareness Tests**
Tests conversation memory and follow-up detection:

```javascript
// Initial query
{"message": "Tell me about your AI experience", "sessionId": "test-session"}

// Follow-up should be detected
{"message": "Can you give me more details?", "sessionId": "test-session"}
```

### 3. **System Health Tests**
Checks all system components:

- ✅ Upstash Vector Database connection
- ✅ Groq API availability  
- ✅ Database connection
- ✅ Tool availability (GitHub, real-time data)
- ✅ RAG pattern functionality

### 4. **Performance Tests**
Measures response times and quality metrics:

- Response time for different query complexities
- Memory usage with conversation context
- Fallback behavior when services are unavailable

## 🔍 Testing Different RAG Patterns

### Multi-hop RAG
Test with complex, multi-part questions:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What programming languages do you know and can you show me examples from your recent projects?",
    "enhancedMode": true,
    "sessionId": "multihop-test"
  }'
```

Expected response metadata should include:
```json
{
  "ragPattern": "multi_hop",
  "searchSteps": 2,
  "totalResults": 6
}
```

### Hybrid Search
Test with comparison or technical queries:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Compare your Python and JavaScript experience",
    "enhancedMode": true
  }'
```

Expected response metadata should include:
```json
{
  "ragPattern": "hybrid_search",
  "fusionStrategy": "adaptive"
}
```

### Tool-Enhanced RAG
Test with queries needing external data:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are your most recent GitHub commits?",
    "enhancedMode": true
  }'
```

Expected response metadata should include:
```json
{
  "ragPattern": "tool_enhanced",
  "toolsUsed": ["github_profile"]
}
```

### Contextual RAG
Test conversation memory:

```bash
# First message
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about your Python experience",
    "sessionId": "context-test-123",
    "enhancedMode": true
  }'

# Follow-up (should reference previous context)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What about specific examples?",
    "sessionId": "context-test-123",
    "enhancedMode": true
  }'
```

Expected follow-up response metadata:
```json
{
  "contextEnhanced": {
    "isFollowUp": true,
    "entities": ["Python"],
    "intent": "request_details"
  }
}
```

## 🛠️ Debugging and Troubleshooting

### Check System Health
```bash
curl http://localhost:3000/api/rag-system?action=health | jq
```

Look for:
- `upstashVector.available: true`
- `groqAPI.available: true`
- `ragPatterns.advancedAgentic: true`

### Check System Statistics
```bash
curl http://localhost:3000/api/rag-system?action=stats | jq
```

Review:
- Active conversations
- Top topics discussed
- Average response times

### Common Issues and Solutions

1. **"Enhanced mode not available"**
   - Check `GROQ_API_KEY` environment variable
   - Verify Groq API key is valid

2. **"Vector search failed"**
   - Check `UPSTASH_VECTOR_REST_URL` and `UPSTASH_VECTOR_REST_TOKEN`
   - Verify Upstash Vector database is accessible

3. **"Tool execution failed"**
   - GitHub tools are mocked by default - this is normal
   - Real GitHub integration requires API keys

4. **Poor context awareness**
   - Ensure you're using the same `sessionId` for related queries
   - Check conversation memory isn't full (automatically cleaned)

### Enable Debug Logging

Add this to your `.env.local`:
```bash
NODE_ENV=development
DEBUG=true
```

This will show detailed console logs for:
- RAG pattern selection decisions
- Search execution steps
- Context enhancement details
- Tool execution results

## 📈 Performance Benchmarks

### Expected Response Times
- **Simple queries**: < 500ms
- **Complex queries**: < 2000ms  
- **Tool-enhanced queries**: < 3000ms
- **Multi-hop queries**: < 4000ms

### Quality Metrics
The system tracks several quality metrics:
- **Relevance**: How well the response matches the query
- **Completeness**: Whether the response fully answers the question
- **Accuracy**: Correctness of the information provided
- **Clarity**: How well-structured and understandable the response is

### Monitoring Dashboard
You can build a simple monitoring dashboard using the stats endpoint:

```javascript
// Fetch system statistics
const stats = await fetch('/api/rag-system?action=stats').then(r => r.json());

console.log('Active conversations:', stats.conversations.activeConversations);
console.log('Average session length:', stats.conversations.averageSessionLength);
console.log('Top topics:', stats.conversations.topTopics);
```

## 🎯 Test Scenarios by Use Case

### Interview Preparation Testing
```bash
# Technical interview
curl -X POST http://localhost:3000/api/chat \
  -d '{"message": "Walk me through a challenging technical problem you solved", "interviewType": "technical"}'

# Behavioral interview  
curl -X POST http://localhost:3000/api/chat \
  -d '{"message": "Tell me about a time you had to learn something new quickly", "interviewType": "behavioral"}'
```

### Portfolio Showcase Testing
```bash
# Project showcase
curl -X POST http://localhost:3000/api/chat \
  -d '{"message": "Show me your most impressive projects"}'

# Skills demonstration
curl -X POST http://localhost:3000/api/chat \
  -d '{"message": "What makes you stand out as a developer?"}'
```

### Conversation Flow Testing
```bash
# Natural conversation progression
# 1. Introduction
# 2. Deep dive
# 3. Specific examples
# 4. Follow-up questions
# 5. Clarifications
```

## ✅ Success Criteria

Your RAG system is working correctly if:

1. **Pattern Selection**: Different query types trigger appropriate patterns (≥80% accuracy)
2. **Context Awareness**: Follow-up questions are detected (≥90% accuracy)
3. **Response Quality**: Responses are relevant and complete (≥85% quality score)
4. **Performance**: Response times meet benchmarks (≥90% within limits)
5. **Error Handling**: Graceful fallbacks when services fail (100% uptime)
6. **System Health**: All components report as healthy

## 🔄 Continuous Testing

Consider setting up automated tests that run:
- **On every deployment** - Basic functionality tests
- **Daily** - Comprehensive test suite
- **Weekly** - Performance and load testing
- **On demand** - When debugging issues

This ensures your advanced RAG system maintains high quality and performance over time.

## 🎨 Custom Test Cases

You can easily add custom test cases by modifying the test files:

1. **Add new queries** to `TEST_QUERIES` in `test-advanced-rag.js`
2. **Create new test functions** in `test-advanced-rag-unit.py`  
3. **Extend shell tests** in `test-advanced-rag.sh`

Example custom test:
```javascript
// Add to TEST_QUERIES
domain_specific: [
  "Tell me about your experience with microservices",
  "How do you handle API rate limiting?",
  "Describe your database optimization strategies"
]
```

This comprehensive testing approach ensures your advanced RAG system works reliably across all patterns and use cases!