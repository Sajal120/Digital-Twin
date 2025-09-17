#!/usr/bin/env node
/**
 * Enhanced RAG Testing Script
 * ===========================
 *
 * Comprehensive testing for the LLM-enhanced RAG system.
 * Tests various interview scenarios and validates improvements.
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api'

// Test cases for different interview scenarios
const TEST_CASES = [
  {
    category: 'Technical Interview',
    interviewType: 'technical',
    questions: [
      "What's your experience with React and modern web development?",
      'Tell me about a challenging technical problem you solved',
      'How do you approach system architecture and scalability?',
      'Describe your experience with Python and Java development',
      "What's your experience with AI and machine learning technologies?",
    ],
  },
  {
    category: 'Behavioral Interview',
    interviewType: 'behavioral',
    questions: [
      'Tell me about a time you showed leadership',
      'How do you handle conflicts in a team environment?',
      'Describe a project where you had to learn something new',
      'What are your key strengths and achievements?',
      'Tell me about a time you failed and what you learned',
    ],
  },
  {
    category: 'Executive Interview',
    interviewType: 'executive',
    questions: [
      "What's your vision for the future of AI in business?",
      'How do you prioritize strategic initiatives?',
      'Tell me about your approach to innovation and technology adoption',
      'How do you measure success and business impact?',
      "What's your leadership philosophy?",
    ],
  },
  {
    category: 'General Interview',
    interviewType: 'general',
    questions: [
      'Tell me about yourself',
      'Why should we hire you?',
      'What are you looking for in your next role?',
      'Tell me about your recent projects',
      'Where do you see yourself in 5 years?',
    ],
  },
]

/**
 * Test Enhanced RAG System
 */
async function testEnhancedRAG() {
  console.log('🚀 Starting Enhanced RAG System Testing')
  console.log('=====================================\\n')

  const results = []

  for (const testCategory of TEST_CASES) {
    console.log(`📋 Testing ${testCategory.category}`)
    console.log('-'.repeat(50))

    for (let i = 0; i < testCategory.questions.length; i++) {
      const question = testCategory.questions[i]
      console.log(`\\n${i + 1}. Testing: "${question}"`)

      try {
        // Test enhanced RAG
        const startTime = Date.now()
        const response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: question,
            interviewType: testCategory.interviewType,
            enhancedMode: true,
            conversationHistory: [],
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        const processingTime = Date.now() - startTime

        console.log(`   ✅ Enhanced response (${processingTime}ms):`)
        console.log(
          `   ${data.response.substring(0, 200)}${data.response.length > 200 ? '...' : ''}`,
        )
        console.log(
          `   📊 Enhanced: ${data.enhanced}, Query: "${data.metadata?.enhancedQuery?.substring(0, 50)}..."`,
        )

        results.push({
          category: testCategory.category,
          question,
          enhanced: data.enhanced,
          processingTime,
          responseLength: data.response.length,
          hasMetrics: !!data.metadata,
        })

        // Brief pause to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
        results.push({
          category: testCategory.category,
          question,
          error: error.message,
          enhanced: false,
          processingTime: 0,
          responseLength: 0,
        })
      }
    }

    console.log('\\n')
  }

  // Generate summary report
  console.log('📊 TESTING SUMMARY REPORT')
  console.log('=========================\\n')

  const successfulTests = results.filter((r) => !r.error)
  const failedTests = results.filter((r) => r.error)
  const enhancedTests = results.filter((r) => r.enhanced)

  console.log(`Total Tests: ${results.length}`)
  console.log(`✅ Successful: ${successfulTests.length}`)
  console.log(`❌ Failed: ${failedTests.length}`)
  console.log(`✨ Enhanced RAG Used: ${enhancedTests.length}`)
  console.log(
    `⚡ Average Processing Time: ${Math.round(successfulTests.reduce((sum, r) => sum + r.processingTime, 0) / successfulTests.length)}ms`,
  )
  console.log(
    `📝 Average Response Length: ${Math.round(successfulTests.reduce((sum, r) => sum + r.responseLength, 0) / successfulTests.length)} characters\\n`,
  )

  // Category breakdown
  const categories = [...new Set(results.map((r) => r.category))]
  categories.forEach((category) => {
    const categoryResults = results.filter((r) => r.category === category && !r.error)
    console.log(`${category}:`)
    console.log(
      `  • Success Rate: ${Math.round((categoryResults.length / TEST_CASES.find((tc) => tc.category === category).questions.length) * 100)}%`,
    )
    console.log(
      `  • Avg Time: ${Math.round(categoryResults.reduce((sum, r) => sum + r.processingTime, 0) / categoryResults.length)}ms`,
    )
    console.log(
      `  • Enhanced: ${categoryResults.filter((r) => r.enhanced).length}/${categoryResults.length}`,
    )
  })

  console.log('\\n🎉 Testing completed!')
  return results
}

/**
 * Test A/B Comparison
 */
async function testComparison() {
  console.log('\\n🔄 Testing A/B Comparison System')
  console.log('=================================\\n')

  const comparisonQuestions = [
    'What are my key achievements?',
    'Tell me about your React experience',
    'How do you handle challenging projects?',
    'What makes you a strong candidate?',
  ]

  for (let i = 0; i < comparisonQuestions.length; i++) {
    const question = comparisonQuestions[i]
    console.log(`${i + 1}. Comparing: "${question}"`)

    try {
      const response = await fetch(`${API_BASE}/rag-compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          interviewType: 'general',
          includeAnalysis: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Comparison API error: ${response.status}`)
      }

      const data = await response.json()

      console.log(`   📊 Comparison completed in ${data.totalComparisonTime}ms`)
      console.log(
        `   📈 Improvements: ${data.improvement_indicators.response_length_increase} length, specificity: ${data.improvement_indicators.specificity_improvement ? '✅' : '❌'}`,
      )
      console.log(
        `   🎯 Enhanced query: "${data.results.enhanced.enhancedQuery.substring(0, 60)}..."`,
      )

      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }

  console.log('\\n✅ Comparison testing completed!')
}

/**
 * Test MCP Server Integration
 */
async function testMCPServer() {
  console.log('\\n🔌 Testing MCP Server Integration')
  console.log('=================================\\n')

  // Test tools/list
  try {
    console.log('1. Testing MCP tools list...')
    const toolsResponse = await fetch(`${API_BASE}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      }),
    })

    if (toolsResponse.ok) {
      const toolsData = await toolsResponse.json()
      console.log(`   ✅ Found ${toolsData.result?.tools?.length || 0} tools`)
      console.log(`   🔧 Tools: ${toolsData.result?.tools?.map((t) => t.name).join(', ')}`)
    } else {
      console.log(`   ❌ Tools list failed: ${toolsResponse.status}`)
    }
  } catch (error) {
    console.log(`   ❌ MCP server error: ${error.message}`)
  }

  // Test tool call
  try {
    console.log('\\n2. Testing enhanced MCP tool call...')
    const toolCallResponse = await fetch(`${API_BASE}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'ask_digital_twin',
          arguments: {
            question: 'What are my technical skills?',
            interviewType: 'technical',
            enhancedMode: true,
          },
        },
      }),
    })

    if (toolCallResponse.ok) {
      const toolData = await toolCallResponse.json()
      console.log(`   ✅ MCP tool call successful`)
      console.log(
        `   💬 Response preview: "${toolData.result?.content?.[0]?.text?.substring(0, 100)}..."`,
      )
    } else {
      console.log(`   ❌ MCP tool call failed: ${toolCallResponse.status}`)
    }
  } catch (error) {
    console.log(`   ❌ MCP tool call error: ${error.message}`)
  }

  console.log('\\n✅ MCP testing completed!')
}

/**
 * Main Test Runner
 */
async function runTests() {
  const startTime = Date.now()

  console.log('🧪 ENHANCED RAG SYSTEM - COMPREHENSIVE TESTING')
  console.log('===============================================')
  console.log(`Test started at: ${new Date().toLocaleString()}`)
  console.log(`API Base URL: ${API_BASE}\\n`)

  try {
    // Run all test suites
    await testEnhancedRAG()
    await testComparison()
    await testMCPServer()

    const totalTime = Date.now() - startTime
    console.log(`\\n🎯 ALL TESTS COMPLETED in ${totalTime}ms`)
    console.log('===============================================')
  } catch (error) {
    console.error('\\n💥 Test suite failed:', error)
    process.exit(1)
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Test execution failed:', error)
    process.exit(1)
  })
}

module.exports = { runTests, testEnhancedRAG, testComparison, testMCPServer }
