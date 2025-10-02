#!/usr/bin/env node

// Test the specific failure points in phone processing
console.log('🔧 Targeted Phone Processing Debug')
console.log('===================================\n')

// Test 1: Check if the recording handler can handle minimal valid input
async function testMinimalProcessing() {
  console.log('1️⃣ Testing minimal processing with required fields only...')

  try {
    const minimalData = new URLSearchParams({
      CallSid: 'debug_test_minimal',
      RecordingUrl: '', // Empty URL to trigger error
      RecordingSid: 'debug_sid',
      RecordingDuration: '1',
    }).toString()

    const response = await fetch('https://www.sajal-app.online/api/phone/handle-recording', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: minimalData,
    })

    const result = await response.text()
    console.log(
      '📄 Response with empty URL:',
      result.includes('trouble processing') ? 'Error fallback triggered' : 'Processed successfully',
    )
  } catch (error) {
    console.log('❌ Minimal test failed:', error.message)
  }
}

// Test 2: Check what happens with missing fields
async function testMissingFields() {
  console.log('\n2️⃣ Testing with missing required fields...')

  try {
    const incompleteData = new URLSearchParams({
      CallSid: 'debug_test_incomplete',
      // Missing RecordingUrl - should trigger validation error
    }).toString()

    const response = await fetch('https://www.sajal-app.online/api/phone/handle-recording', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: incompleteData,
    })

    const result = await response.text()
    console.log(
      '📄 Response with missing fields:',
      result.includes('trouble processing') ? 'Error fallback triggered' : 'Unexpected success',
    )
  } catch (error) {
    console.log('❌ Missing fields test failed:', error.message)
  }
}

// Test 3: Simple voice API test to verify it's working
async function testVoiceAPIDirectly() {
  console.log('\n3️⃣ Testing voice conversation API directly...')

  try {
    const response = await fetch('https://www.sajal-app.online/api/voice/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, test message for phone debugging',
        context: 'Phone call test',
        interactionType: 'phone_professional',
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Voice API working, response length:', data.response?.length || 0)
      console.log('📝 Sample response:', data.response?.substring(0, 100) + '...')
    } else {
      console.log('❌ Voice API failed:', response.status)
    }
  } catch (error) {
    console.log('❌ Voice API test failed:', error.message)
  }
}

// Test 4: Check if we can simulate a working recording
async function testWithWorkingRecording() {
  console.log('\n4️⃣ Checking the exact error point...')

  console.log('🔍 The issue is likely:')
  console.log("   1. Twilio credentials missing → Can't download recording")
  console.log("   2. OpenAI key missing → Can't transcribe")
  console.log('   3. Recording URL invalid → Download fails')
  console.log('   4. Audio format incompatible → Processing fails')

  console.log('\n📋 To fix this, we need to:')
  console.log('   ✓ Verify TWILIO_ACCOUNT_SID is set in Vercel')
  console.log('   ✓ Verify TWILIO_AUTH_TOKEN is set in Vercel')
  console.log('   ✓ Verify OPENAI_API_KEY is set in Vercel')
  console.log('   ✓ Test with a real Twilio recording URL')
}

// Main debug function
async function runTargetedDebug() {
  await testMinimalProcessing()
  await testMissingFields()
  await testVoiceAPIDirectly()
  await testWithWorkingRecording()

  console.log('\n🎯 IMMEDIATE ACTION NEEDED:')
  console.log('============================')
  console.log('Since you added the Twilio credentials to Vercel:')
  console.log('1. ✅ Go to Vercel Dashboard')
  console.log('2. ✅ Check Environment Variables are saved')
  console.log('3. 🔄 REDEPLOY the project (critical step!)')
  console.log('4. 📞 Make a test call after redeployment')
  console.log('')
  console.log('The environment variables only take effect after redeployment!')
}

runTargetedDebug()
