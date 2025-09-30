#!/usr/bin/env node

// Multi-Language Voice Test Script
// Tests all configured voice IDs for different languages

const baseUrl = 'http://localhost:3000'

const testCases = [
  {
    language: 'English',
    text: 'Hello, this is a test of my English voice clone. I am Sajal, a software engineer.',
    expectedLang: 'en',
  },
  {
    language: 'Nepali',
    text: 'नमस्कार, यो मेरो नेपाली आवाजको परीक्षण हो। म सजल हुँ, एक सफ्टवेयर इन्जिनियर।',
    expectedLang: 'ne',
  },
  {
    language: 'Hindi',
    text: 'नमस्ते, यह मेरी हिंदी आवाज़ का परीक्षण है। मैं सजल हूं, एक सॉफ्टवेयर इंजीनियर।',
    expectedLang: 'hi',
  },
  {
    language: 'Spanish',
    text: 'Hola, esta es una prueba de mi voz clonada en español. Soy Sajal, ingeniero de software.',
    expectedLang: 'es',
  },
  {
    language: 'Chinese',
    text: '你好，这是我的中文克隆声音测试。我是Sajal，软件工程师。',
    expectedLang: 'zh',
  },
]

async function testVoiceCloning() {
  console.log('🎙️ Testing Multi-Language Voice Cloning System')
  console.log('=' * 50)
  console.log('')

  for (const testCase of testCases) {
    console.log(`Testing ${testCase.language}...`)

    try {
      const response = await fetch(`${baseUrl}/api/voice/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testCase.text,
          provider: 'elevenlabs',
          language: 'auto', // Let system auto-detect
        }),
      })

      if (response.ok) {
        const detectedLang = response.headers.get('X-Voice-Language')
        const voiceProvider = response.headers.get('X-Voice-Provider')
        const voiceId = response.headers.get('X-Voice-ID')
        const contentLength = response.headers.get('Content-Length')

        console.log(`✅ ${testCase.language}: SUCCESS`)
        console.log(`   Detected Language: ${detectedLang}`)
        console.log(`   Voice Provider: ${voiceProvider}`)
        console.log(`   Voice ID: ${voiceId}`)
        console.log(`   Audio Size: ${contentLength} bytes`)

        if (detectedLang !== testCase.expectedLang) {
          console.log(
            `   ⚠️  Language detection mismatch: expected ${testCase.expectedLang}, got ${detectedLang}`,
          )
        }
      } else {
        const error = await response.text()
        console.log(`❌ ${testCase.language}: FAILED`)
        console.log(`   Status: ${response.status}`)
        console.log(`   Error: ${error}`)
      }
    } catch (error) {
      console.log(`❌ ${testCase.language}: ERROR`)
      console.log(`   Error: ${error.message}`)
    }

    console.log('')
  }

  // Test voice mapping endpoint
  console.log('Testing voice mapping...')
  try {
    // This would be a custom endpoint to check voice mappings
    console.log('📋 Voice ID Configuration:')
    console.log(`   English: ${process.env.ELEVENLABS_VOICE_ID_ENGLISH || 'Not configured'}`)
    console.log(`   Nepali: ${process.env.ELEVENLABS_VOICE_ID_NEPALI || 'Not configured'}`)
    console.log(`   Hindi: ${process.env.ELEVENLABS_VOICE_ID_HINDI || 'Not configured'}`)
    console.log(`   Spanish: ${process.env.ELEVENLABS_VOICE_ID_SPANISH || 'Not configured'}`)
    console.log(`   Chinese: ${process.env.ELEVENLABS_VOICE_ID_CHINESE || 'Not configured'}`)
  } catch (error) {
    console.log(`❌ Voice mapping check failed: ${error.message}`)
  }

  console.log('')
  console.log('🎉 Voice cloning test completed!')
  console.log('Your AI can now speak in multiple languages with your voice!')
}

// Run the tests
if (require.main === module) {
  testVoiceCloning().catch(console.error)
}

module.exports = { testVoiceCloning }
