#!/usr/bin/env node

// Voice AI Integration Test Script
// Run this to verify voice endpoints are working

const baseUrl = 'http://localhost:3000'

async function testVoiceEndpoints() {
  console.log('🎙️ Testing Voice AI Integration...\n')

  // Test 1: Voice Conversation API
  console.log('1. Testing Voice Conversation API...')
  try {
    const conversationResponse = await fetch(`${baseUrl}/api/voice/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Tell me about your technical skills',
        interactionType: 'technical_interview',
        conversationHistory: [],
      }),
    })

    if (conversationResponse.ok) {
      const data = await conversationResponse.json()
      console.log('✅ Voice Conversation API: Working')
      console.log(`   Response: "${data.response?.substring(0, 100)}..."`)
      console.log(`   Type: ${data.interactionType}`)
    } else {
      console.log('❌ Voice Conversation API: Failed')
      console.log(`   Status: ${conversationResponse.status}`)
    }
  } catch (error) {
    console.log('❌ Voice Conversation API: Error')
    console.log(`   Error: ${error.message}`)
  }

  console.log('')

  // Test 2: Text-to-Speech API
  console.log('2. Testing Text-to-Speech API...')
  try {
    const ttsResponse = await fetch(`${baseUrl}/api/voice/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Hello, this is a test of the text-to-speech system.',
        voice: 'alloy',
      }),
    })

    if (ttsResponse.ok && ttsResponse.headers.get('content-type')?.includes('audio')) {
      console.log('✅ Text-to-Speech API: Working')
      console.log(`   Content-Type: ${ttsResponse.headers.get('content-type')}`)
      console.log(`   Content-Length: ${ttsResponse.headers.get('content-length')} bytes`)
    } else {
      console.log('❌ Text-to-Speech API: Failed')
      console.log(`   Status: ${ttsResponse.status}`)
    }
  } catch (error) {
    console.log('❌ Text-to-Speech API: Error')
    console.log(`   Error: ${error.message}`)
  }

  console.log('')

  // Test 3: Basic Voice API
  console.log('3. Testing Basic Voice API...')
  try {
    const voiceResponse = await fetch(`${baseUrl}/api/voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What is your experience with AI development?',
        conversationHistory: [],
      }),
    })

    if (voiceResponse.ok) {
      const data = await voiceResponse.json()
      console.log('✅ Basic Voice API: Working')
      console.log(`   Response: "${data.response?.substring(0, 100)}..."`)
    } else {
      console.log('❌ Basic Voice API: Failed')
      console.log(`   Status: ${voiceResponse.status}`)
    }
  } catch (error) {
    console.log('❌ Basic Voice API: Error')
    console.log(`   Error: ${error.message}`)
  }

  console.log('')

  // Test 4: MCP Integration via Chat API
  console.log('4. Testing MCP Integration (via existing chat API)...')
  try {
    const chatResponse = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What technologies do you specialize in?',
        user_id: 'voice_test_user',
        role: 'user',
        enhancedMode: true,
      }),
    })

    if (chatResponse.ok) {
      const data = await chatResponse.json()
      console.log('✅ MCP Integration: Working')
      console.log(`   Enhanced: ${data.enhanced}`)
      console.log(`   Response: "${data.response?.substring(0, 100)}..."`)
    } else {
      console.log('❌ MCP Integration: Failed')
      console.log(`   Status: ${chatResponse.status}`)
    }
  } catch (error) {
    console.log('❌ MCP Integration: Error')
    console.log(`   Error: ${error.message}`)
  }

  console.log('')
  console.log('🎯 Voice AI Integration Test Complete!')
  console.log('')
  console.log('📋 Next Steps:')
  console.log('1. Visit http://localhost:3000/voice to test the UI')
  console.log('2. Grant microphone permissions when prompted')
  console.log('3. Try different interaction types (HR, Technical, Networking)')
  console.log('4. Test voice input and audio playback')
  console.log('')
  console.log('🚀 Your Voice AI is ready to use!')
}

// Run the tests
testVoiceEndpoints().catch(console.error)
