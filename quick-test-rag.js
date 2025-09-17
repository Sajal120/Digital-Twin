#!/usr/bin/env node

/**
 * Quick Test Script for Enhanced RAG
 * =================================
 */

const API_BASE = 'http://localhost:3000/api'

async function testBasicChat() {
  console.log('🧪 Testing Basic Chat API...')

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, tell me about your skills',
        enhancedMode: false,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Basic chat working!')
      console.log('Response:', data.response.substring(0, 100) + '...')
      return true
    } else {
      console.log('❌ Basic chat failed:', response.status)
      return false
    }
  } catch (error) {
    console.log('❌ Basic chat error:', error.message)
    return false
  }
}

async function testEnhancedChat() {
  console.log('🚀 Testing Enhanced Chat API...')

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me about my React experience for a technical interview',
        enhancedMode: true,
        interviewType: 'technical',
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Enhanced chat working!')
      console.log('Enhanced:', data.enhanced)
      console.log('Response:', data.response.substring(0, 150) + '...')
      if (data.metadata) {
        console.log('Enhanced Query:', data.metadata.enhancedQuery?.substring(0, 100) + '...')
      }
      return true
    } else {
      console.log('❌ Enhanced chat failed:', response.status)
      const errorData = await response.text()
      console.log('Error:', errorData.substring(0, 200))
      return false
    }
  } catch (error) {
    console.log('❌ Enhanced chat error:', error.message)
    return false
  }
}

async function testStatus() {
  console.log('📊 Testing API Status...')

  try {
    const response = await fetch(`${API_BASE}/test-rag`)
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API Status:', data.status)
      console.log('Enhanced RAG Available:', data.features.enhancedRAG)
      console.log('Vector Search Available:', data.features.vectorSearch)
      return true
    } else {
      console.log('❌ Status check failed:', response.status)
      return false
    }
  } catch (error) {
    console.log('❌ Status check error:', error.message)
    return false
  }
}

async function runQuickTest() {
  console.log('🎯 QUICK ENHANCED RAG TEST')
  console.log('==========================\n')

  const statusOk = await testStatus()
  if (!statusOk) {
    console.log('❌ API not responding, make sure server is running on port 3000')
    return
  }

  console.log('')
  const basicOk = await testBasicChat()

  console.log('')
  const enhancedOk = await testEnhancedChat()

  console.log('\n📋 TEST SUMMARY')
  console.log('================')
  console.log('API Status:', statusOk ? '✅ Working' : '❌ Failed')
  console.log('Basic Chat:', basicOk ? '✅ Working' : '❌ Failed')
  console.log('Enhanced Chat:', enhancedOk ? '✅ Working' : '❌ Failed')

  if (statusOk && basicOk && enhancedOk) {
    console.log('\n🎉 All tests passed! Enhanced RAG is working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.')
  }
}

// Add timeout for the fetch calls
const originalFetch = global.fetch
global.fetch = (url, options = {}) => {
  return Promise.race([
    originalFetch(url, { ...options, timeout: 10000 }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 10000)),
  ])
}

// Run the test
runQuickTest().catch(console.error)
