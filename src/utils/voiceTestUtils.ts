// Simple Voice API Test Utility
export async function testVoiceAPI(text = 'Hello, this is a test.') {
  try {
    console.log('🧪 Testing Voice API...')

    const response = await fetch('/api/voice/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        provider: 'cartesia',
        language: 'auto',
      }),
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Voice API failed:', errorText)
      return false
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('audio')) {
      console.error('❌ Invalid content type:', contentType)
      return false
    }

    const blob = await response.blob()
    console.log('✅ Voice API working:', {
      size: blob.size,
      type: blob.type,
      provider: response.headers.get('x-voice-provider'),
      language: response.headers.get('x-voice-language'),
    })

    return true
  } catch (error) {
    console.error('❌ Voice API test failed:', error)
    return false
  }
}

// Test Audio Playback
export async function testAudioPlayback() {
  try {
    console.log('🧪 Testing Audio Playback...')

    // Test if Audio constructor is available
    if (typeof Audio === 'undefined') {
      console.error('❌ Audio not supported')
      return false
    }

    // Test audio creation
    const audio = new Audio()
    console.log('✅ Audio element created')

    // Test audio format support
    const formats = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
    }

    const supportedFormats = Object.entries(formats)
      .filter(([_, type]) => audio.canPlayType(type) !== '')
      .map(([format]) => format)

    console.log('✅ Supported audio formats:', supportedFormats)

    if (supportedFormats.length === 0) {
      console.error('❌ No supported audio formats')
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Audio playback test failed:', error)
    return false
  }
}

// Run comprehensive voice system test
export async function runVoiceSystemTest() {
  console.log('🔊 Starting Voice System Test...')
  console.log('========================================')

  const results = {
    audioPlayback: await testAudioPlayback(),
    voiceAPI: await testVoiceAPI(),
  }

  console.log('\n📊 Test Results:')
  console.log(`Audio Playback: ${results.audioPlayback ? '✅' : '❌'}`)
  console.log(`Voice API: ${results.voiceAPI ? '✅' : '❌'}`)

  const allPassed = Object.values(results).every(Boolean)
  console.log(`\n🎯 Overall: ${allPassed ? '✅ All tests passed' : '❌ Some tests failed'}`)

  return results
}

// Add to window for easy testing in browser console
if (typeof window !== 'undefined') {
  ;(window as any).testVoiceSystem = runVoiceSystemTest
  ;(window as any).testVoiceAPI = testVoiceAPI
  ;(window as any).testAudioPlayback = testAudioPlayback
}
