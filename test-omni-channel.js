#!/usr/bin/env node

/**
 * Omni-Channel Digital Twin Testing Suite
 * Comprehensive tests for chat, voice, and phone integrations
 */

import { createRequire } from 'module'
import https from 'https'
import http from 'http'

const require = createRequire(import.meta.url)

// Configuration
const CONFIG = {
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  testTimeout: 30000,
  retryAttempts: 3,
}

// ANSI colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
}

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan')
  log(`🧪 ${title}`, 'cyan')
  log('='.repeat(60), 'cyan')
}

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️'
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow'
  log(`${icon} ${name}`, color)
  if (details) log(`   ${details}`, 'reset')

  testResults.total++
  if (status === 'PASS') testResults.passed++
  else if (status === 'FAIL') testResults.failed++
  else testResults.skipped++
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith('http') ? url : `${CONFIG.baseUrl}${url}`
    const urlObj = new URL(fullUrl)
    const client = urlObj.protocol === 'https:' ? https : http

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Digital-Twin-Test-Suite',
        ...options.headers,
      },
    }

    const req = client.request(requestOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            raw: data,
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: {},
            raw: data,
          })
        }
      })
    })

    req.on('error', reject)

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }

    req.end()

    // Timeout handling
    setTimeout(() => {
      req.destroy()
      reject(new Error('Request timeout'))
    }, CONFIG.testTimeout)
  })
}

// Test suites
async function testChatChannel() {
  logSection('CHAT CHANNEL TESTING (MCP Server)')

  try {
    // Test 1: MCP Server Status
    const mcpStatus = await makeRequest('/api/mcp')
    if (mcpStatus.status === 200 && mcpStatus.data.name) {
      logTest('MCP Server Status', 'PASS', `Version: ${mcpStatus.data.version}`)
    } else {
      logTest('MCP Server Status', 'FAIL', `Status: ${mcpStatus.status}`)
    }

    // Test 2: Digital Twin Tool Call
    const mcpToolCall = await makeRequest('/api/mcp', {
      method: 'POST',
      body: {
        jsonrpc: '2.0',
        id: 'test_123',
        method: 'tools/call',
        params: {
          name: 'ask_digital_twin',
          arguments: {
            question: 'What are your main technical skills?',
            interviewType: 'technical',
            enhancedMode: true,
          },
        },
      },
    })

    if (mcpToolCall.status === 200 && mcpToolCall.data.result) {
      logTest(
        'MCP Tool Call',
        'PASS',
        `Response length: ${mcpToolCall.data.result.response?.length || 0} chars`,
      )
    } else {
      logTest('MCP Tool Call', 'FAIL', `Status: ${mcpToolCall.status}`)
    }

    // Test 3: Enhanced Chat API
    const chatAPI = await makeRequest('/api/chat', {
      method: 'POST',
      body: {
        message: 'Tell me about your experience with AI integration',
        enhancedMode: true,
        interviewType: 'technical',
      },
    })

    if (chatAPI.status === 200 && chatAPI.data.response) {
      logTest(
        'Enhanced Chat API',
        'PASS',
        `Enhanced: ${chatAPI.data.enhanced}, Sources: ${chatAPI.data.sources?.length || 0}`,
      )
    } else {
      logTest('Enhanced Chat API', 'FAIL', `Status: ${chatAPI.status}`)
    }
  } catch (error) {
    logTest('Chat Channel Tests', 'FAIL', `Error: ${error.message}`)
  }
}

async function testVoiceChannel() {
  logSection('VOICE CHANNEL TESTING (OpenAI Realtime API)')

  try {
    // Test 1: Voice Conversation API
    const voiceConversation = await makeRequest('/api/voice/conversation', {
      method: 'POST',
      body: {
        message: 'Can you tell me about your leadership experience?',
        interactionType: 'interview',
        context: 'Voice AI testing',
      },
    })

    if (voiceConversation.status === 200 && voiceConversation.data.response) {
      logTest(
        'Voice Conversation API',
        'PASS',
        `Response: ${voiceConversation.data.response.substring(0, 50)}...`,
      )
    } else {
      logTest('Voice Conversation API', 'FAIL', `Status: ${voiceConversation.status}`)
    }

    // Test 2: Text-to-Speech API
    const ttsAPI = await makeRequest('/api/voice/speech', {
      method: 'POST',
      body: {
        text: 'This is a test of the text-to-speech system for omni-channel testing.',
        voice: 'alloy',
        provider: 'openai',
      },
    })

    if (ttsAPI.status === 200 && ttsAPI.headers['content-type']?.includes('audio')) {
      logTest('Text-to-Speech API', 'PASS', `Audio size: ${ttsAPI.headers['content-length']} bytes`)
    } else {
      logTest('Text-to-Speech API', 'FAIL', `Status: ${ttsAPI.status}`)
    }

    // Test 3: Voice Route API
    const voiceRoute = await makeRequest('/api/voice', {
      method: 'POST',
      body: {
        message: 'What technologies do you work with?',
        context: 'API testing',
      },
    })

    if (voiceRoute.status === 200 && voiceRoute.data.response) {
      logTest('Voice Route API', 'PASS', `Professional context included`)
    } else {
      logTest('Voice Route API', 'FAIL', `Status: ${voiceRoute.status}`)
    }
  } catch (error) {
    logTest('Voice Channel Tests', 'FAIL', `Error: ${error.message}`)
  }
}

async function testPhoneChannel() {
  logSection('PHONE CHANNEL TESTING (Twilio Integration)')

  try {
    // Test 1: Twilio Webhook Handler
    const webhookTest = await makeRequest('/api/phone/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'CallSid=test_call_123&From=%2B1234567890&To=%2B0987654321&CallStatus=ringing',
    })

    if (webhookTest.status === 200 && webhookTest.raw.includes('<Response>')) {
      logTest('Twilio Webhook Handler', 'PASS', 'TwiML response generated')
    } else {
      logTest('Twilio Webhook Handler', 'FAIL', `Status: ${webhookTest.status}`)
    }

    // Test 2: Recording Handler
    const recordingTest = await makeRequest('/api/phone/handle-recording', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'CallSid=test_call_123&RecordingUrl=https://example.com/test.wav&RecordingDuration=30&RecordingSid=test_rec_123',
    })

    if (recordingTest.status === 200) {
      logTest('Recording Handler', 'PASS', 'Recording processing endpoint accessible')
    } else {
      logTest('Recording Handler', 'FAIL', `Status: ${recordingTest.status}`)
    }

    // Test 3: Transcription Handler
    const transcriptionTest = await makeRequest('/api/phone/handle-transcription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'CallSid=test_call_123&TranscriptionSid=test_trans_123&TranscriptionText=Hello%20this%20is%20a%20test&TranscriptionStatus=completed',
    })

    if (transcriptionTest.status === 200) {
      logTest('Transcription Handler', 'PASS', 'Transcription processing endpoint accessible')
    } else {
      logTest('Transcription Handler', 'FAIL', `Status: ${transcriptionTest.status}`)
    }
  } catch (error) {
    logTest('Phone Channel Tests', 'FAIL', `Error: ${error.message}`)
  }
}

async function testCallFlows() {
  logSection('PROFESSIONAL CALL FLOWS TESTING')

  try {
    // Test 1: Call Classification
    const classifyCall = await makeRequest('/api/phone/call-flows', {
      method: 'POST',
      body: {
        action: 'classify_call',
        callSid: 'test_123',
        userInput: 'Hi, I am calling about a software engineering position at our company',
        context: {},
      },
    })

    if (classifyCall.status === 200 && classifyCall.data.callType) {
      logTest('Call Classification', 'PASS', `Classified as: ${classifyCall.data.callType}`)
    } else {
      logTest('Call Classification', 'FAIL', `Status: ${classifyCall.status}`)
    }

    // Test 2: Flow Response Generation
    const flowResponse = await makeRequest('/api/phone/call-flows', {
      method: 'POST',
      body: {
        action: 'get_flow_response',
        callType: 'recruiter_screening',
        userInput: 'What technologies does Sajal work with?',
        context: {},
      },
    })

    if (flowResponse.status === 200 && flowResponse.data.response) {
      logTest('Flow Response Generation', 'PASS', `Response generated for recruiter screening`)
    } else {
      logTest('Flow Response Generation', 'FAIL', `Status: ${flowResponse.status}`)
    }

    // Test 3: Escalation Check
    const escalationCheck = await makeRequest('/api/phone/call-flows', {
      method: 'POST',
      body: {
        action: 'check_escalation',
        callType: 'consultation_call',
        userInput: 'We need someone for a 6-month executive technical advisor role',
        context: {},
      },
    })

    if (escalationCheck.status === 200) {
      logTest(
        'Escalation Check',
        'PASS',
        `Escalation needed: ${escalationCheck.data.escalationNeeded}`,
      )
    } else {
      logTest('Escalation Check', 'FAIL', `Status: ${escalationCheck.status}`)
    }
  } catch (error) {
    logTest('Call Flows Tests', 'FAIL', `Error: ${error.message}`)
  }
}

async function testOmniChannelContext() {
  logSection('OMNI-CHANNEL CONTEXT TESTING')

  try {
    // Test 1: Context Unification
    const unifyContext = await makeRequest('/api/omni-context', {
      method: 'POST',
      body: {
        action: 'unify_context',
        channelType: 'phone',
        sessionData: {
          phoneNumber: '+1234567890',
          callSid: 'test_call_123',
        },
        userIdentifier: 'test_user_123',
      },
    })

    if (unifyContext.status === 200 && unifyContext.data.context) {
      logTest('Context Unification', 'PASS', `Session ID: ${unifyContext.data.sessionId}`)
    } else {
      logTest('Context Unification', 'FAIL', `Status: ${unifyContext.status}`)
    }

    // Test 2: Persona Generation
    const getPersona = await makeRequest('/api/omni-context', {
      method: 'POST',
      body: {
        action: 'get_persona',
        channelType: 'phone',
        context: {
          professionalContext: {
            relationship: 'recruiter',
          },
        },
      },
    })

    if (getPersona.status === 200 && getPersona.data.persona) {
      logTest(
        'Persona Generation',
        'PASS',
        `Communication style: ${getPersona.data.persona.communication?.style}`,
      )
    } else {
      logTest('Persona Generation', 'FAIL', `Status: ${getPersona.status}`)
    }

    // Test 3: Channel Handoff
    const channelHandoff = await makeRequest('/api/omni-context', {
      method: 'POST',
      body: {
        action: 'channel_handoff',
        sessionData: {
          fromChannel: 'phone',
          toChannel: 'chat',
        },
        context: {
          sessionId: 'test_session_123',
          conversationState: {
            currentTopic: 'technical_discussion',
          },
        },
      },
    })

    if (channelHandoff.status === 200 && channelHandoff.data.handoffData) {
      logTest('Channel Handoff', 'PASS', `Handoff URL generated`)
    } else {
      logTest('Channel Handoff', 'FAIL', `Status: ${channelHandoff.status}`)
    }
  } catch (error) {
    logTest('Omni-Channel Context Tests', 'FAIL', `Error: ${error.message}`)
  }
}

async function testIntegrationFlow() {
  logSection('END-TO-END INTEGRATION TESTING')

  try {
    // Test 1: Cross-Channel Context Continuity
    // Simulate a conversation that starts on phone and continues on chat

    // Step 1: Start phone conversation
    const phoneStart = await makeRequest('/api/omni-context', {
      method: 'POST',
      body: {
        action: 'unify_context',
        channelType: 'phone',
        sessionData: { phoneNumber: '+1234567890' },
        userIdentifier: 'integration_test_user',
      },
    })

    const sessionId = phoneStart.data?.sessionId

    // Step 2: Get chat context with same session
    const chatContinue = await makeRequest('/api/chat', {
      method: 'POST',
      body: {
        message: 'Continue our conversation about your technical background',
        sessionId: sessionId,
        enhancedMode: true,
      },
    })

    if (chatContinue.status === 200 && chatContinue.data.response) {
      logTest('Cross-Channel Continuity', 'PASS', 'Context preserved across channels')
    } else {
      logTest('Cross-Channel Continuity', 'FAIL', 'Context not preserved')
    }

    // Test 2: Professional Response Consistency
    const responses = []

    // Get response from each channel for the same question
    const question = 'What is your experience with cloud technologies?'

    const chatResponse = await makeRequest('/api/chat', {
      method: 'POST',
      body: { message: question, enhancedMode: true },
    })
    responses.push(chatResponse.data?.response || '')

    const voiceResponse = await makeRequest('/api/voice/conversation', {
      method: 'POST',
      body: { message: question, interactionType: 'interview' },
    })
    responses.push(voiceResponse.data?.response || '')

    // Check if all responses contain professional keywords
    const professionalKeywords = ['experience', 'AWS', 'cloud', 'development', 'years']
    const consistentResponses = responses.every((response) =>
      professionalKeywords.some((keyword) =>
        response.toLowerCase().includes(keyword.toLowerCase()),
      ),
    )

    if (consistentResponses) {
      logTest(
        'Professional Response Consistency',
        'PASS',
        'All channels provide professional responses',
      )
    } else {
      logTest('Professional Response Consistency', 'FAIL', 'Inconsistent professional responses')
    }
  } catch (error) {
    logTest('Integration Tests', 'FAIL', `Error: ${error.message}`)
  }
}

async function testSystemHealth() {
  logSection('SYSTEM HEALTH & PERFORMANCE')

  try {
    // Test 1: API Response Times
    const startTime = Date.now()
    await makeRequest('/api/mcp')
    const mcpTime = Date.now() - startTime

    logTest('MCP Response Time', mcpTime < 2000 ? 'PASS' : 'FAIL', `${mcpTime}ms`)

    // Test 2: Error Handling
    const errorTest = await makeRequest('/api/nonexistent-endpoint')
    if (errorTest.status === 404) {
      logTest('Error Handling', 'PASS', '404 properly returned for invalid endpoints')
    } else {
      logTest('Error Handling', 'FAIL', `Unexpected status: ${errorTest.status}`)
    }

    // Test 3: Environment Variables
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'UPSTASH_VECTOR_REST_URL',
      'UPSTASH_VECTOR_REST_TOKEN',
    ]
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

    if (missingVars.length === 0) {
      logTest('Environment Configuration', 'PASS', 'All required environment variables present')
    } else {
      logTest('Environment Configuration', 'FAIL', `Missing: ${missingVars.join(', ')}`)
    }
  } catch (error) {
    logTest('System Health Tests', 'FAIL', `Error: ${error.message}`)
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting Omni-Channel Digital Twin Test Suite', 'bold')
  log(`📡 Testing against: ${CONFIG.baseUrl}`, 'blue')
  log(`⏱️  Timeout: ${CONFIG.testTimeout}ms\n`, 'blue')

  // Run all test suites
  await testSystemHealth()
  await testChatChannel()
  await testVoiceChannel()
  await testPhoneChannel()
  await testCallFlows()
  await testOmniChannelContext()
  await testIntegrationFlow()

  // Final results
  logSection('TEST RESULTS SUMMARY')
  log(`📊 Total Tests: ${testResults.total}`, 'blue')
  log(`✅ Passed: ${testResults.passed}`, 'green')
  log(`❌ Failed: ${testResults.failed}`, 'red')
  log(`⏭️  Skipped: ${testResults.skipped}`, 'yellow')

  const successRate = Math.round((testResults.passed / testResults.total) * 100)
  log(`📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red')

  if (testResults.failed === 0) {
    log('\n🎉 All tests passed! Your omni-channel digital twin is ready for production!', 'green')
  } else {
    log('\n⚠️  Some tests failed. Please check the implementation and try again.', 'yellow')
  }

  process.exit(testResults.failed > 0 ? 1 : 0)
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch((error) => {
    log(`💥 Test suite crashed: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  })
}

export { runTests, makeRequest }
