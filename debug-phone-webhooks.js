#!/usr/bin/env node

// Test the actual phone webhook endpoints
console.log('📞 Phone Webhook Debug Test')
console.log('============================\n')

// Test main webhook
async function testPhoneWebhook() {
  console.log('🔗 Testing Phone Webhook...')
  try {
    const response = await fetch('https://www.sajal-app.online/api/phone/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'From=%2B1234567890&To=%2B61278044137&CallSid=test123&CallStatus=ringing',
    })

    if (response.ok) {
      const twiml = await response.text()
      console.log('✅ Phone Webhook: Working')
      console.log('TwiML Preview:', twiml.substring(0, 200) + '...')
    } else {
      console.log('❌ Phone Webhook: Failed -', response.status)
      const error = await response.text()
      console.log('Error:', error.substring(0, 300))
    }
  } catch (error) {
    console.log('❌ Phone Webhook: Error -', error.message)
  }
}

// Test recording handler with mock data
async function testRecordingHandler() {
  console.log('\n🎵 Testing Recording Handler...')
  try {
    // This would need a real recording URL to test properly
    console.log('⚠️ Recording handler needs actual Twilio recording to test')
    console.log('Will test during actual phone call')
  } catch (error) {
    console.log('❌ Recording Handler: Error -', error.message)
  }
}

// Test MCP integration specifically for phone context
async function testMCPForPhone() {
  console.log('\n🧠 Testing MCP for Phone Context...')
  try {
    const response = await fetch('https://www.sajal-app.online/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'phone_test',
        method: 'tools/call',
        params: {
          name: 'ask_digital_twin',
          arguments: {
            question: 'Tell me about your experience for a phone interview',
            interviewType: 'hr_screening',
            enhancedMode: true,
            maxResults: 5,
          },
        },
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const responseText = data.result?.content?.[0]?.text || 'No response'
      console.log('✅ MCP Phone Context: Working')
      console.log('Response length:', responseText.length)
      console.log('Sample:', responseText.substring(0, 150) + '...')

      // Check if it mentions Sajal Basnet
      if (
        responseText.includes('Sajal Basnet') ||
        responseText.includes('I am') ||
        responseText.includes('My')
      ) {
        console.log('✅ First-person response: Detected')
      } else {
        console.log('⚠️ First-person response: May need improvement')
      }
    } else {
      console.log('❌ MCP Phone Context: Failed -', response.status)
    }
  } catch (error) {
    console.log('❌ MCP Phone Context: Error -', error.message)
  }
}

// Test voice conversation API
async function testVoiceConversation() {
  console.log('\n🎙️ Testing Voice Conversation API...')
  try {
    const response = await fetch('https://www.sajal-app.online/api/voice/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Hello, I'm calling about a software engineering position",
        context: 'Phone call via Twilio. Professional phone conversation.',
        conversationHistory: [],
        interactionType: 'phone_professional',
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Voice Conversation: Working')
      console.log('Response length:', data.response?.length || 0)
      console.log('Sample:', data.response?.substring(0, 150) + '...')
    } else {
      console.log('❌ Voice Conversation: Failed -', response.status)
      const error = await response.text()
      console.log('Error:', error.substring(0, 200))
    }
  } catch (error) {
    console.log('❌ Voice Conversation: Error -', error.message)
  }
}

// Run phone-specific tests
async function runPhoneTests() {
  await testPhoneWebhook()
  await testRecordingHandler()
  await testMCPForPhone()
  await testVoiceConversation()

  console.log('\n📋 RECOMMENDATIONS:')
  console.log('1. Set ELEVENLABS_API_KEY in Vercel environment variables')
  console.log('2. Verify NEXTAUTH_URL is set to https://www.sajal-app.online')
  console.log('3. Test actual phone call to see TwiML flow')
  console.log('4. Check Vercel logs during phone calls for debugging')

  console.log('\n🏁 Phone Debug Test Complete')
}

runPhoneTests()
