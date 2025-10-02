#!/usr/bin/env node

// Test environment variables in production
console.log('🔧 Environment Variables Test')
console.log('==============================\n')

async function testEnvironmentVars() {
  console.log('🌐 Testing environment variable access in production...')

  try {
    // Create a test endpoint that will log environment status
    const response = await fetch('https://www.sajal-app.online/api/phone/handle-recording', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'CallSid=env_test&RecordingUrl=https://api.twilio.com/test.wav&RecordingSid=test&RecordingDuration=1',
    })

    const responseText = await response.text()
    console.log('Response status:', response.status)
    console.log('Response preview:', responseText.substring(0, 300))

    // Check if it's the error fallback
    if (responseText.includes('having trouble processing')) {
      console.log('⚠️ Getting error fallback - check Vercel logs for details')
      console.log('🔍 Likely issues:')
      console.log('  - Environment variables not set in Vercel')
      console.log('  - OpenAI API key missing or invalid')
      console.log('  - Twilio credentials missing or invalid')
      console.log('  - Network/timeout issues')
    } else if (responseText.includes("didn't catch that")) {
      console.log('✅ Processing pipeline working - just empty transcription')
    } else if (responseText.includes('Say voice=')) {
      console.log('✅ Processing successful - generating proper responses')
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

async function checkVercelEnvironment() {
  console.log('\n📋 Vercel Environment Setup Check')
  console.log('==================================')
  console.log('Required environment variables in Vercel:')
  console.log('✓ OPENAI_API_KEY - for speech transcription')
  console.log('✓ TWILIO_ACCOUNT_SID - for downloading recordings')
  console.log('✓ TWILIO_AUTH_TOKEN - for downloading recordings')
  console.log('✓ ELEVENLABS_API_KEY - for custom voice (optional)')
  console.log('✓ NEXTAUTH_URL - should be https://www.sajal-app.online')
  console.log('')
  console.log('To set these:')
  console.log('1. Go to https://vercel.com/dashboard')
  console.log('2. Select your Digital-Twin project')
  console.log('3. Go to Settings → Environment Variables')
  console.log('4. Add each variable for Production environment')
  console.log('5. Redeploy the project')
}

async function runTest() {
  await testEnvironmentVars()
  await checkVercelEnvironment()

  console.log('\n🎯 Next Steps:')
  console.log('1. Check Vercel function logs in dashboard')
  console.log('2. Verify all environment variables are set')
  console.log('3. Make a test call and monitor logs in real-time')
  console.log('4. Look for specific error messages in the logs')
}

runTest()
