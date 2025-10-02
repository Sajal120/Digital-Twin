#!/usr/bin/env node

// Comprehensive phone system diagnostic
console.log('🔧 Complete Phone System Diagnostic')
console.log('====================================\n')

// Test 1: Environment Variables Status
async function testEnvironmentStatus() {
  console.log('1️⃣ Testing Environment Variables in Production...')

  try {
    // Test if we can access a protected endpoint that would use environment variables
    const response = await fetch('https://www.sajal-app.online/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test OpenAI access',
        enhancedMode: true,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Chat API (OpenAI): Working')
      console.log('✅ Enhanced mode:', data.enhanced)
    } else {
      console.log('❌ Chat API failed:', response.status)
    }
  } catch (error) {
    console.log('❌ Chat API error:', error.message)
  }
}

// Test 2: Twilio Credentials
async function testTwilioCredentials() {
  console.log('\n2️⃣ Testing Twilio Integration...')

  try {
    // Test the webhook endpoint
    const response = await fetch('https://www.sajal-app.online/api/phone/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'CallSid=test_credentials&From=%2B1234567890&To=%2B61278044137&CallStatus=ringing',
    })

    if (response.ok) {
      const twiml = await response.text()
      console.log('✅ Twilio Webhook: Working')

      // Check if it has the right timeout settings
      if (twiml.includes('timeout="5"')) {
        console.log('✅ Timeout settings: Correct (5 seconds)')
      } else {
        console.log('⚠️ Timeout settings: May be incorrect')
      }

      if (twiml.includes('maxLength="60"')) {
        console.log('✅ Max length: Correct (60 seconds)')
      } else {
        console.log('⚠️ Max length: May be incorrect')
      }
    } else {
      console.log('❌ Twilio Webhook failed:', response.status)
    }
  } catch (error) {
    console.log('❌ Twilio Webhook error:', error.message)
  }
}

// Test 3: Recording Handler with Mock Data
async function testRecordingHandler() {
  console.log('\n3️⃣ Testing Recording Handler Pipeline...')

  try {
    // This will trigger the recording handler with invalid data to see where it fails
    const response = await fetch('https://www.sajal-app.online/api/phone/handle-recording', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'CallSid=diagnostic_test&RecordingUrl=https://invalid-url.com/test.wav&RecordingSid=test&RecordingDuration=3',
    })

    const responseText = await response.text()
    console.log('Response status:', response.status)

    if (responseText.includes('having trouble processing')) {
      console.log('❌ Recording Handler: Hitting error fallback')
      console.log('🔍 This means the handler is failing early in the process')

      if (responseText.includes('timeout="5"')) {
        console.log('✅ Error fallback has correct timeout settings')
      }
    } else if (responseText.includes("didn't catch that")) {
      console.log('✅ Recording Handler: Processing pipeline working')
      console.log('✅ The handler is processing but getting empty transcription')
    } else {
      console.log('❓ Recording Handler: Unexpected response')
      console.log('Response preview:', responseText.substring(0, 200))
    }
  } catch (error) {
    console.log('❌ Recording Handler error:', error.message)
  }
}

// Test 4: ElevenLabs Integration
async function testElevenLabsAccess() {
  console.log('\n4️⃣ Testing ElevenLabs Voice Integration...')

  try {
    // Test if ElevenLabs voice is working by checking the voice endpoint
    const response = await fetch('https://www.sajal-app.online/api/voice/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test voice generation',
        context: 'Voice test',
        interactionType: 'test',
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Voice Conversation API: Working')
      console.log('✅ Response length:', data.response?.length || 0)
    } else {
      console.log('❌ Voice Conversation API failed:', response.status)
    }
  } catch (error) {
    console.log('❌ Voice Conversation API error:', error.message)
  }
}

// Test 5: Specific Environment Variable Check
async function checkSpecificVariables() {
  console.log('\n5️⃣ Environment Variables Checklist...')
  console.log('Based on your .env file, these should be set in Vercel:')
  console.log('')
  console.log('🔑 OPENAI_API_KEY: sk-proj-cgTvqVmyx7bpaRU9iwOE...')
  console.log('🎤 ELEVENLABS_API_KEY: sk_264b7f4b380378e30e3c...')
  console.log('🗣️ ELEVENLABS_VOICE_ID: WcXkU7PbsO0uKKBdWJrG')
  console.log('🌐 NEXTAUTH_URL: https://www.sajal-app.online')
  console.log('')
  console.log('❓ Missing from your .env (need to be added to Vercel):')
  console.log('📞 TWILIO_ACCOUNT_SID: (not visible in .env)')
  console.log('🔐 TWILIO_AUTH_TOKEN: (not visible in .env)')
  console.log('')
  console.log('These Twilio credentials are REQUIRED for phone calls to work!')
}

// Main diagnostic function
async function runDiagnostic() {
  await testEnvironmentStatus()
  await testTwilioCredentials()
  await testRecordingHandler()
  await testElevenLabsAccess()
  await checkSpecificVariables()

  console.log('\n🎯 DIAGNOSIS SUMMARY:')
  console.log('===================')
  console.log('If tests show:')
  console.log('✅ Chat API working + ❌ Recording Handler failing')
  console.log('   → Missing TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Vercel')
  console.log('')
  console.log('✅ All APIs working + ❌ Custom voice not working')
  console.log('   → ELEVENLABS_API_KEY not properly set in Vercel')
  console.log('')
  console.log('❌ Multiple APIs failing')
  console.log('   → Environment variables not transferred to Vercel production')

  console.log('\n🔧 SOLUTION:')
  console.log('1. Go to https://vercel.com/dashboard')
  console.log('2. Select Digital-Twin project')
  console.log('3. Settings → Environment Variables')
  console.log('4. Add ALL variables from your .env file')
  console.log('5. Make sure to select "Production" environment')
  console.log('6. Redeploy the project')
}

runDiagnostic()
