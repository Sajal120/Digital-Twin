#!/usr/bin/env node

// Advanced debugging to check actual environment variables in production
console.log('🔧 Advanced Environment & Error Debugging')
console.log('==========================================\n')

// Test: Create a debug endpoint call that will show us what's really happening
async function testEnvironmentVariablesInProduction() {
  console.log('🔍 Testing if environment variables are actually available in production...')

  try {
    // Use the actual recording handler but with debug logging
    const debugData = new URLSearchParams({
      CallSid: 'debug_env_test',
      RecordingUrl: 'https://debug-test-url.com/test.wav',
      RecordingSid: 'debug_sid',
      RecordingDuration: '2',
    }).toString()

    console.log('📤 Sending debug request to recording handler...')

    const response = await fetch('https://www.sajal-app.online/api/phone/handle-recording', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Debug-Test': 'true',
      },
      body: debugData,
    })

    console.log('📊 Response status:', response.status)
    const result = await response.text()

    // Look for specific error patterns
    if (result.includes('trouble processing')) {
      console.log('❌ Still hitting error fallback - checking why...')

      console.log('\n🔍 Possible causes:')
      if (result.includes('Missing Twilio credentials')) {
        console.log('  → Twilio credentials not available in production')
      } else if (result.includes('OpenAI API error')) {
        console.log('  → OpenAI API key issue')
      } else if (result.includes('Failed to download recording')) {
        console.log('  → Recording download failed')
      } else {
        console.log('  → Unknown error in processing pipeline')
      }
    } else {
      console.log('✅ Processing working!')
    }
  } catch (error) {
    console.log('❌ Debug test failed:', error.message)
  }
}

// Create a simple bypass test
async function testSimpleBypass() {
  console.log('\n🛠️ Creating bypass test...')

  console.log('The issue might be that the recording handler is too complex.')
  console.log('Let me suggest a simple fix to get conversation working first.')

  console.log('\n💡 SIMPLE SOLUTION:')
  console.log('====================')
  console.log('We can create a simplified recording handler that:')
  console.log('1. ✅ Skips audio download/transcription for now')
  console.log('2. ✅ Uses a default message like "I heard you speak"')
  console.log('3. ✅ Generates AI response to that message')
  console.log('4. ✅ Returns proper TwiML to continue conversation')
  console.log('')
  console.log('This will prove the conversation flow works,')
  console.log('then we can debug the audio processing separately.')
}

// Test if the issue is specifically with Twilio recording URLs
async function testRecordingURLIssue() {
  console.log('\n🎵 Testing recording URL format issue...')

  console.log('Twilio recording URLs require:')
  console.log('1. Proper authentication (Account SID + Auth Token)')
  console.log('2. Correct URL format from Twilio')
  console.log('3. The recording to actually exist')
  console.log('')
  console.log('Our test uses fake URLs, so it will always fail.')
  console.log('The real test is what happens during an actual phone call.')
}

async function runAdvancedDebug() {
  await testEnvironmentVariablesInProduction()
  await testSimpleBypass()
  await testRecordingURLIssue()

  console.log('\n🎯 RECOMMENDATION:')
  console.log('===================')
  console.log("Let's create a BYPASS version that works immediately:")
  console.log('1. Temporarily skip audio processing')
  console.log('2. Use "I heard you speak, let me respond" approach')
  console.log('3. Generate AI response to a default message')
  console.log('4. This will prove conversation flow works')
  console.log('5. Then debug audio processing separately')
  console.log('')
  console.log('This way you can test conversation immediately!')
}

runAdvancedDebug()
