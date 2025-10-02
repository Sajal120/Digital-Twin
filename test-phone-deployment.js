#!/usr/bin/env node

// Quick test to verify phone system deployment
console.log('🔧 Quick Phone System Test')
console.log('==========================\n')

// Test the recording handler endpoint directly
async function testRecordingEndpoint() {
  console.log('🎙️ Testing Recording Handler Response...')
  try {
    // This should fail but give us insight into the endpoint
    const response = await fetch('https://www.sajal-app.online/api/phone/handle-recording', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'CallSid=test&RecordingUrl=test&RecordingSid=test&RecordingDuration=5',
    })

    const responseText = await response.text()
    console.log('Response status:', response.status)
    console.log('Response type:', response.headers.get('content-type'))
    console.log('Response preview:', responseText.substring(0, 300))

    if (responseText.includes('Say voice=') || responseText.includes('<Response>')) {
      console.log('✅ Endpoint is generating TwiML responses')
    } else {
      console.log('⚠️ Endpoint may not be generating proper TwiML')
    }
  } catch (error) {
    console.log('❌ Recording endpoint error:', error.message)
  }
}

// Test environment variable access
async function testEnvironmentCheck() {
  console.log('\n🔍 Testing Environment Variable Detection...')
  try {
    // Create a simple test endpoint call that logs environment status
    const response = await fetch('https://www.sajal-app.online/api/phone/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'CallSid=env_test&From=test&To=test&CallStatus=ringing',
    })

    if (response.ok) {
      const twiml = await response.text()
      console.log('✅ Environment test successful')
      console.log('Webhook response length:', twiml.length)
    } else {
      console.log('❌ Environment test failed:', response.status)
    }
  } catch (error) {
    console.log('❌ Environment test error:', error.message)
  }
}

// Main test function
async function runQuickTest() {
  await testRecordingEndpoint()
  await testEnvironmentCheck()

  console.log('\n📋 NEXT STEPS:')
  console.log('1. Check Vercel function logs for detailed error messages')
  console.log('2. Make a test call to +61 2 7804 4137')
  console.log('3. Monitor logs during the call for debugging')
  console.log('4. Verify ELEVENLABS_API_KEY is set in Vercel environment')

  console.log('\n🎯 EXPECTED BEHAVIOR:')
  console.log('- Initial greeting plays')
  console.log('- After you speak, should respond within 5-10 seconds')
  console.log('- Each response should continue recording for next input')
  console.log('- Custom voice if ElevenLabs key is set, Twilio voice as fallback')
}

runQuickTest()
