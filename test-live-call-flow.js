#!/usr/bin/env node

// Live debugging test for phone conversation flow
console.log('🔍 Live Phone Call Debug Test')
console.log('===============================\n')

// Test with a realistic recording scenario
async function testLiveRecordingFlow() {
  console.log('📞 Simulating actual phone call recording process...')

  try {
    // Simulate what happens when Twilio sends a recording
    const testData = new URLSearchParams({
      CallSid: 'live_test_call_' + Date.now(),
      RecordingUrl: 'https://api.twilio.com/2010-04-01/Accounts/test/Recordings/test.wav',
      RecordingSid: 'test_recording_sid',
      RecordingDuration: '3',
    }).toString()

    console.log('🎵 Sending recording data to handler...')
    console.log('Data:', testData)

    const response = await fetch('https://www.sajal-app.online/api/phone/handle-recording', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'TwilioProxy/1.1',
      },
      body: testData,
    })

    console.log('📊 Response status:', response.status)
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('📄 Full response:')
    console.log(responseText)

    // Analyze the response
    if (responseText.includes('<Say')) {
      console.log('✅ TwiML Say detected - voice response will be generated')

      // Extract the message
      const sayMatch = responseText.match(/<Say[^>]*>(.*?)<\/Say>/s)
      if (sayMatch) {
        console.log('🎤 AI will say:', sayMatch[1].substring(0, 150) + '...')
      }

      // Check if it continues recording
      if (responseText.includes('<Record')) {
        console.log('✅ Recording continuation detected - conversation will continue')
      } else {
        console.log('❌ No recording continuation - conversation will end')
      }
    } else if (responseText.includes('<Play')) {
      console.log('🎵 TwiML Play detected - audio file response')
    } else {
      console.log('❌ No voice response detected in TwiML')
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

// Test webhook flow
async function testWebhookFlow() {
  console.log('\n📞 Testing initial webhook (call start)...')

  try {
    const response = await fetch('https://www.sajal-app.online/api/phone/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'CallSid=test_webhook&From=%2B1234567890&To=%2B61278044137&CallStatus=ringing',
    })

    const twiml = await response.text()
    console.log('✅ Webhook response length:', twiml.length)

    // Check if it starts recording
    if (twiml.includes('<Record')) {
      console.log('✅ Initial recording setup detected')

      // Check timeout settings
      const timeoutMatch = twiml.match(/timeout="(\d+)"/)
      if (timeoutMatch) {
        console.log('⏰ Timeout setting:', timeoutMatch[1], 'seconds')
      }

      // Check action URL
      const actionMatch = twiml.match(/action="([^"]+)"/)
      if (actionMatch) {
        console.log('🎯 Recording action URL:', actionMatch[1])
      }
    } else {
      console.log('❌ No recording setup in initial webhook')
    }
  } catch (error) {
    console.log('❌ Webhook test failed:', error.message)
  }
}

// Run tests
async function runLiveTest() {
  await testWebhookFlow()
  await testLiveRecordingFlow()

  console.log('\n🎯 DIAGNOSIS:')
  console.log('============')
  console.log('If you see:')
  console.log('✅ TwiML Say detected + ✅ Recording continuation → Phone should talk back')
  console.log('❌ No voice response → Check Vercel function logs for errors')
  console.log('⏰ Wrong timeout → May cause conversation interruption')

  console.log('\n📋 NEXT STEPS:')
  console.log('1. Make a test call to +61 2 7804 4137')
  console.log('2. Speak clearly for 3-5 seconds')
  console.log('3. Wait 5-10 seconds for AI response')
  console.log('4. If no response, check Vercel function logs')
}

runLiveTest()
