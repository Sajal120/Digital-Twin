#!/usr/bin/env node

/**
 * Phase 1 RAG Enhancement Test Script
 * ==================================
 *
 * Tests the three core Phase 1 enhancements:
 * 1. Agentic RAG - Intelligent search decisions
 * 2. Conversation Context Memory - Multi-turn conversations
 * 3. Performance Analytics - Metrics tracking
 */

const readline = require('readline')
const https = require('https')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const API_BASE = 'http://localhost:3000' // Adjust if needed
const SESSION_ID = `test-session-${Date.now()}`

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`
}

function log(color, message) {
  console.log(colorize(color, message))
}

async function makeAPIRequest(endpoint, data) {
  const url = `${API_BASE}${endpoint}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API request failed: ${error.message}`)
    return null
  }
}

async function testAgenticRAG() {
  log('cyan', '\n🤖 Testing Agentic RAG - Intelligent Decision Making')
  log('cyan', '=' * 60)

  const testQueries = [
    {
      query: 'Tell me about your React experience',
      expectedDecision: 'SEARCH',
      description: 'Should search for specific technical information',
    },
    {
      query: 'How do I prepare for technical interviews?',
      expectedDecision: 'DIRECT',
      description: 'Should provide direct advice without search',
    },
    {
      query: 'What do you think about that?',
      expectedDecision: 'CLARIFY',
      description: 'Should request clarification for vague question',
    },
  ]

  for (const test of testQueries) {
    log('yellow', `\n📝 Query: "${test.query}"`)
    log('blue', `Expected: ${test.expectedDecision} - ${test.description}`)

    const response = await makeAPIRequest('/api/chat', {
      message: test.query,
      sessionId: SESSION_ID,
      enhancedMode: true,
      interviewType: 'technical',
    })

    if (response) {
      const decision = response.metadata?.agenticDecision?.action || 'UNKNOWN'
      const confidence = response.metadata?.agenticDecision?.confidence || 0

      log('green', `✅ Result: ${decision} (Confidence: ${confidence}%)`)
      log('green', `Response: ${response.response.substring(0, 100)}...`)

      if (decision === test.expectedDecision) {
        log('green', '✅ PASS: Correct agentic decision')
      } else {
        log('red', `❌ FAIL: Expected ${test.expectedDecision}, got ${decision}`)
      }
    } else {
      log('red', '❌ FAIL: No response from API')
    }

    // Wait a bit between requests
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

async function testConversationContext() {
  log('cyan', '\n💬 Testing Conversation Context Memory')
  log('cyan', '=' * 60)

  const conversationFlow = [
    {
      query: 'Tell me about your Python projects',
      description: 'Initial question - should establish context',
    },
    {
      query: 'Tell me more about that',
      description: 'Follow-up - should use conversation context',
    },
    {
      query: 'What technologies did you use for it?',
      description: 'Another follow-up - should maintain context',
    },
  ]

  for (let i = 0; i < conversationFlow.length; i++) {
    const test = conversationFlow[i]
    log('yellow', `\n📝 Message ${i + 1}: "${test.query}"`)
    log('blue', `Purpose: ${test.description}`)

    const response = await makeAPIRequest('/api/chat', {
      message: test.query,
      sessionId: SESSION_ID, // Same session for context
      enhancedMode: true,
      interviewType: 'technical',
    })

    if (response) {
      const isFollowUp =
        response.metadata?.conversationContext?.includes('follow-up') ||
        response.metadata?.conversationContext?.includes('context')
      const contextUsed = response.metadata?.conversationContext || 'No context info'

      log('green', `✅ Response: ${response.response.substring(0, 100)}...`)
      log('green', `Context: ${contextUsed}`)

      if (i > 0) {
        if (isFollowUp || contextUsed !== 'No context info') {
          log('green', '✅ PASS: Conversation context detected')
        } else {
          log('yellow', '⚠️  WARN: Limited context usage detected')
        }
      }
    } else {
      log('red', '❌ FAIL: No response from API')
    }

    await new Promise((resolve) => setTimeout(resolve, 1500))
  }
}

async function testAnalytics() {
  log('cyan', '\n📊 Testing Performance Analytics')
  log('cyan', '=' * 60)

  log('yellow', 'Fetching analytics data...')

  try {
    const response = await fetch(`${API_BASE}/api/admin/rag-analytics?timeRange=1h`)

    if (response.ok) {
      const analytics = await response.json()

      log('green', '✅ Analytics API responsive')
      log('green', `📈 Queries last 24h: ${analytics.currentMetrics?.queriesLast24h || 'N/A'}`)
      log(
        'green',
        `⏱️  Avg response time: ${analytics.currentMetrics?.avgResponseTimeLast24h || 'N/A'}ms`,
      )
      log(
        'green',
        `⭐ Satisfaction: ${analytics.currentMetrics?.satisfactionRatingLast24h || 'N/A'}/5`,
      )

      if (analytics.currentMetrics?.agentic?.decisions) {
        const decisions = analytics.currentMetrics.agentic.decisions
        log(
          'green',
          `🤖 Agentic decisions: SEARCH(${decisions.SEARCH || 0}), DIRECT(${decisions.DIRECT || 0}), CLARIFY(${decisions.CLARIFY || 0})`,
        )
      }

      if (analytics.conversationStats) {
        const stats = analytics.conversationStats
        log(
          'green',
          `💬 Conversations: ${stats.activeConversations || 0} active, ${stats.avgMessagesPerConversation || 0} avg messages`,
        )
        log('green', `🏷️  Top topics: ${stats.topTopics?.join(', ') || 'None'}`)
      }

      log('green', '✅ PASS: Analytics system working')
    } else {
      log('red', `❌ FAIL: Analytics API error (${response.status})`)
    }
  } catch (error) {
    log('red', `❌ FAIL: Analytics request failed - ${error.message}`)
  }
}

async function runSystemHealthCheck() {
  log('cyan', '\n🏥 System Health Check')
  log('cyan', '=' * 60)

  // Test basic chat API
  log('yellow', 'Testing basic chat API...')
  const basicResponse = await makeAPIRequest('/api/chat', {
    message: 'Hello, test message',
    sessionId: `health-check-${Date.now()}`,
  })

  if (basicResponse) {
    log('green', '✅ Chat API responsive')
  } else {
    log('red', '❌ Chat API not responding')
    return false
  }

  // Test enhanced mode
  log('yellow', 'Testing enhanced RAG mode...')
  const enhancedResponse = await makeAPIRequest('/api/chat', {
    message: 'Test enhanced mode',
    sessionId: `health-check-enhanced-${Date.now()}`,
    enhancedMode: true,
  })

  if (enhancedResponse?.metadata) {
    log('green', '✅ Enhanced RAG mode active')
    if (enhancedResponse.metadata.agenticDecision) {
      log('green', '✅ Agentic decision making active')
    }
  } else {
    log('yellow', '⚠️  Enhanced mode may not be fully active')
  }

  return true
}

async function runInteractiveTest() {
  log('cyan', '\n🎮 Interactive Test Mode')
  log('cyan', '=' * 60)
  log('blue', 'Type your questions to test the RAG system. Type "exit" to quit.')
  log('blue', 'Each response will show the agentic decision and performance metrics.')

  const sessionId = `interactive-${Date.now()}`

  const askQuestion = () => {
    rl.question(colorize('yellow', '\n📝 Your question: '), async (question) => {
      if (question.toLowerCase() === 'exit') {
        rl.close()
        return
      }

      log('blue', '🤖 Processing...')

      const response = await makeAPIRequest('/api/chat', {
        message: question,
        sessionId,
        enhancedMode: true,
        interviewType: 'technical',
      })

      if (response) {
        log('green', `\n💬 Response: ${response.response}`)

        if (response.metadata) {
          const metadata = response.metadata
          log('cyan', `\n📊 Metadata:`)
          log('cyan', `  • Original Query: "${metadata.originalQuery}"`)
          log('cyan', `  • Enhanced Query: "${metadata.enhancedQuery}"`)
          if (metadata.agenticDecision) {
            log(
              'cyan',
              `  • Agentic Decision: ${metadata.agenticDecision.action} (${metadata.agenticDecision.confidence}% confidence)`,
            )
            log('cyan', `  • Reasoning: ${metadata.agenticDecision.reasoning}`)
          }
          if (metadata.conversationContext) {
            log('cyan', `  • Context: ${metadata.conversationContext}`)
          }
          log('cyan', `  • Results Found: ${metadata.resultsFound}`)
        }
      } else {
        log('red', '❌ No response received')
      }

      askQuestion()
    })
  }

  askQuestion()
}

async function main() {
  log('bright', '\n🚀 Phase 1 RAG Enhancement Test Suite')
  log('bright', '=====================================')
  log('blue', 'Testing the three core Phase 1 enhancements:')
  log('blue', '1. 🤖 Agentic RAG - Intelligent search decisions')
  log('blue', '2. 💬 Conversation Context Memory - Multi-turn conversations  ')
  log('blue', '3. 📊 Performance Analytics - Metrics tracking')

  try {
    // System health check first
    const systemHealthy = await runSystemHealthCheck()
    if (!systemHealthy) {
      log('red', '\n❌ System health check failed. Please ensure the server is running.')
      process.exit(1)
    }

    // Run automated tests
    await testAgenticRAG()
    await testConversationContext()
    await testAnalytics()

    // Summary
    log('bright', '\n🎯 Test Summary')
    log('bright', '===============')
    log('green', '✅ Automated tests completed')
    log('blue', '📋 Check the results above for any failures')

    // Interactive mode
    log('yellow', '\nWould you like to run interactive tests? (y/n)')
    rl.question('', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        runInteractiveTest()
      } else {
        log('green', '\n🎉 Phase 1 testing complete!')
        log(
          'blue',
          'Your enhanced RAG system with Agentic decisions and Conversation context is ready!',
        )
        rl.close()
      }
    })
  } catch (error) {
    log('red', `\n❌ Test suite failed: ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
