import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { detectLanguage } from '@/utils/languageDetection'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Cartesia configuration (primary voice provider)
const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY
const CARTESIA_VOICE_ID = process.env.CARTESIA_VOICE_ID // Your cloned voice ID

const USE_VOICE_CLONING = process.env.USE_VOICE_CLONING === 'true'

export async function POST(request: NextRequest) {
  console.log('🎤 Speech API called:', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  })

  try {
    let requestBody
    try {
      requestBody = await request.json()
      console.log('📝 Request body:', {
        hasText: !!requestBody.text,
        voice: requestBody.voice,
        provider: requestBody.provider,
        language: requestBody.language,
      })
    } catch (parseError) {
      console.error('Failed to parse request JSON:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { text, voice = 'alloy', provider = 'auto', language = 'auto' } = requestBody

    if (!text) {
      console.error('❌ No text provided in request')
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    console.log('🔍 Voice provider selection:', {
      provider,
      USE_VOICE_CLONING,
      hasCartesiaKey: !!CARTESIA_API_KEY,
      hasCartesiaVoice: !!CARTESIA_VOICE_ID,
      cartesiaVoiceId: CARTESIA_VOICE_ID?.substring(0, 8) + '...',
    })

    // Use Cartesia voice cloning if configured and available
    if (
      (provider === 'auto' || provider === 'cartesia') &&
      USE_VOICE_CLONING &&
      CARTESIA_API_KEY &&
      CARTESIA_VOICE_ID
    ) {
      console.log('✅ Using Cartesia with your cloned voice')
      return await generateCartesiaSpeech(text, language)
    }

    console.log('⚠️ Falling back to OpenAI TTS (generic voice)')
    // Fallback to OpenAI TTS
    return await generateOpenAISpeech(text, voice)
  } catch (error) {
    console.error('TTS API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate speech',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

async function generateCartesiaSpeech(text: string, language = 'auto') {
  // Detect language if auto
  let detectedLanguage = language
  if (language === 'auto') {
    const detection = detectLanguage(text)
    detectedLanguage = detection.language
  }

  console.log('🎤 Calling Cartesia API with your voice:', {
    voiceId: CARTESIA_VOICE_ID?.substring(0, 8) + '...',
    textLength: text.length,
    language: detectedLanguage,
  })

  const response = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': CARTESIA_API_KEY!,
      'Cartesia-Version': '2024-10-21',
    },
    body: JSON.stringify({
      model_id: 'sonic-english',
      transcript: text,
      voice: {
        mode: 'id',
        id: CARTESIA_VOICE_ID,
        __experimental_controls: {
          speed: 'normal',
          emotion: ['positivity:medium', 'curiosity:medium'],
        },
      },
      output_format: {
        container: 'mp3',
        encoding: 'mp3',
        sample_rate: 44100,
        bit_rate: 128000,
      },
      language: detectedLanguage,
    }),
  })

  console.log('📡 Cartesia API response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('🚨 Cartesia API error:', errorText)
    throw new Error(`Cartesia TTS failed: ${response.status} - ${errorText}`)
  }

  const audioBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(audioBuffer)

  console.log('✅ Cartesia audio generated successfully:', {
    audioSize: buffer.length,
    voiceProvider: 'cartesia',
    voiceId: CARTESIA_VOICE_ID?.substring(0, 8) + '...',
    language: detectedLanguage,
  })

  return new NextResponse(buffer as BodyInit, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600',
      'X-Voice-Provider': 'cartesia',
      'X-Voice-Language': detectedLanguage,
      'X-Voice-ID': CARTESIA_VOICE_ID!,
      'X-Voice-Speed': 'normal',
    },
  })
}

async function generateOpenAISpeech(text: string, voice: string) {
  console.log('🔄 Using OpenAI TTS fallback (slower, more natural)')

  // Generate speech using OpenAI TTS with slower, more natural settings
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1-hd', // Higher quality model
    voice: 'nova' as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer', // More natural female voice
    input: text,
    speed: 0.9, // Slightly slower for clarity
  })

  // Convert to buffer
  const buffer = Buffer.from(await mp3.arrayBuffer())

  // Return audio as response
  return new NextResponse(buffer as BodyInit, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600',
      'X-Voice-Provider': 'openai',
    },
  })
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    },
  )
}
