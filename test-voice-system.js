#!/usr/bin/env node

// Test Voice Cloning API Endpoints
async function testVoiceAPIs() {
  const baseUrl = 'http://localhost:3001' // Updated port

  console.log('🔊 Testing Voice Cloning System...')
  console.log('=' * 50)

  // Test 1: Basic English TTS
  console.log('\n1. Testing English Voice (ElevenLabs)...')
  try {
    const response = await fetch(`${baseUrl}/api/voice/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello, this is a test of my English voice clone.',
        provider: 'elevenlabs',
        language: 'en',
      }),
    })

    if (response.ok) {
      const contentType = response.headers.get('content-type')
      const contentLength = response.headers.get('content-length')
      const voiceProvider = response.headers.get('x-voice-provider')
      const voiceLanguage = response.headers.get('x-voice-language')
      const voiceId = response.headers.get('x-voice-id')

      console.log('✅ English Voice: SUCCESS')
      console.log(`   Provider: ${voiceProvider}`)
      console.log(`   Language: ${voiceLanguage}`)
      console.log(`   Voice ID: ${voiceId}`)
      console.log(`   Content Type: ${contentType}`)
      console.log(`   Size: ${contentLength} bytes`)
    } else {
      const error = await response.text()
      console.log('❌ English Voice: FAILED')
      console.log(`   Error: ${error}`)
    }
  } catch (error) {
    console.log('❌ English Voice: ERROR')
    console.log(`   Error: ${error.message}`)
  }

  // Test 2: Nepali TTS
  console.log('\n2. Testing Nepali Voice (ElevenLabs)...')
  try {
    const response = await fetch(`${baseUrl}/api/voice/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'नमस्कार, यो मेरो नेपाली आवाजको परीक्षण हो।',
        provider: 'elevenlabs',
        language: 'auto',
      }),
    })

    if (response.ok) {
      const voiceProvider = response.headers.get('x-voice-provider')
      const voiceLanguage = response.headers.get('x-voice-language')
      const voiceId = response.headers.get('x-voice-id')
      const contentLength = response.headers.get('content-length')

      console.log('✅ Nepali Voice: SUCCESS')
      console.log(`   Provider: ${voiceProvider}`)
      console.log(`   Detected Language: ${voiceLanguage}`)
      console.log(`   Voice ID: ${voiceId}`)
      console.log(`   Size: ${contentLength} bytes`)
    } else {
      const error = await response.text()
      console.log('❌ Nepali Voice: FAILED')
      console.log(`   Error: ${error}`)
    }
  } catch (error) {
    console.log('❌ Nepali Voice: ERROR')
    console.log(`   Error: ${error.message}`)
  }

  // Test 3: Spanish TTS
  console.log('\n3. Testing Spanish Voice (ElevenLabs)...')
  try {
    const response = await fetch(`${baseUrl}/api/voice/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hola, esta es una prueba de mi voz clonada en español.',
        provider: 'elevenlabs',
        language: 'auto',
      }),
    })

    if (response.ok) {
      const voiceProvider = response.headers.get('x-voice-provider')
      const voiceLanguage = response.headers.get('x-voice-language')
      const voiceId = response.headers.get('x-voice-id')
      const contentLength = response.headers.get('content-length')

      console.log('✅ Spanish Voice: SUCCESS')
      console.log(`   Provider: ${voiceProvider}`)
      console.log(`   Detected Language: ${voiceLanguage}`)
      console.log(`   Voice ID: ${voiceId}`)
      console.log(`   Size: ${contentLength} bytes`)
    } else {
      const error = await response.text()
      console.log('❌ Spanish Voice: FAILED')
      console.log(`   Error: ${error}`)
    }
  } catch (error) {
    console.log('❌ Spanish Voice: ERROR')
    console.log(`   Error: ${error.message}`)
  }

  // Test 4: Fallback to OpenAI
  console.log('\n4. Testing OpenAI Fallback...')
  try {
    const response = await fetch(`${baseUrl}/api/voice/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'This should use OpenAI TTS as fallback.',
        provider: 'openai',
        voice: 'alloy',
      }),
    })

    if (response.ok) {
      const voiceProvider = response.headers.get('x-voice-provider')
      const contentLength = response.headers.get('content-length')

      console.log('✅ OpenAI Fallback: SUCCESS')
      console.log(`   Provider: ${voiceProvider}`)
      console.log(`   Size: ${contentLength} bytes`)
    } else {
      const error = await response.text()
      console.log('❌ OpenAI Fallback: FAILED')
      console.log(`   Error: ${error}`)
    }
  } catch (error) {
    console.log('❌ OpenAI Fallback: ERROR')
    console.log(`   Error: ${error.message}`)
  }

  console.log('\n🎉 Voice cloning tests completed!')
  console.log('\nIf all tests passed, your multilingual voice system is working correctly!')
}

// Run tests
testVoiceAPIs().catch(console.error)
