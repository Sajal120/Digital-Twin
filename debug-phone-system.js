#!/usr/bin/env node

// Test phone system debugging
console.log('🔍 Phone System Debug Test')
console.log('=========================\n')

// Test environment variables
console.log('Environment Variables:')
console.log('ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? '✅ Set' : '❌ Missing')
console.log(
  'ELEVENLABS_VOICE_ID:',
  process.env.ELEVENLABS_VOICE_ID || 'WcXkU7PbsO0uKKBdWJrG (default)',
)
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ Missing')
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing')
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing')
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing')

// Test MCP server connection
async function testMCPConnection() {
  console.log('\n🔌 Testing MCP Server Connection...')
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.sajal-app.online'
    const response = await fetch(`${baseUrl}/api/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'debug_test',
        method: 'tools/call',
        params: {
          name: 'ask_digital_twin',
          arguments: {
            question: 'What are your main technical skills?',
            interviewType: 'technical',
            enhancedMode: true,
          },
        },
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ MCP Server: Working')
      console.log('Response length:', data.result?.content?.[0]?.text?.length || 0)
    } else {
      console.log('❌ MCP Server: Failed -', response.status)
    }
  } catch (error) {
    console.log('❌ MCP Server: Error -', error.message)
  }
}

// Test ElevenLabs API
async function testElevenLabsAPI() {
  console.log('\n🎤 Testing ElevenLabs API...')

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    console.log('❌ ElevenLabs API key missing')
    return
  }

  try {
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'WcXkU7PbsO0uKKBdWJrG'
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: 'Hello, this is a test of my custom voice.',
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    })

    if (response.ok) {
      console.log('✅ ElevenLabs API: Working')
      console.log('Audio size:', response.headers.get('content-length'), 'bytes')
    } else {
      console.log('❌ ElevenLabs API: Failed -', response.status)
      const errorText = await response.text()
      console.log('Error:', errorText.substring(0, 200))
    }
  } catch (error) {
    console.log('❌ ElevenLabs API: Error -', error.message)
  }
}

// Test Chat API
async function testChatAPI() {
  console.log('\n💬 Testing Chat API...')
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.sajal-app.online'
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What programming languages do you know?',
        enhancedMode: true,
        interviewType: 'technical',
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Chat API: Working')
      console.log('Enhanced mode:', data.enhanced)
      console.log('Response length:', data.response?.length || 0)
    } else {
      console.log('❌ Chat API: Failed -', response.status)
    }
  } catch (error) {
    console.log('❌ Chat API: Error -', error.message)
  }
}

// Run all tests
async function runTests() {
  await testMCPConnection()
  await testElevenLabsAPI()
  await testChatAPI()

  console.log('\n🏁 Debug Test Complete')
}

runTests()
