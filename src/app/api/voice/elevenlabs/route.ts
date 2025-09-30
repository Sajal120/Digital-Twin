import { NextRequest, NextResponse } from 'next/server'
import { detectLanguage as detectLang, getModelForLanguage } from '@/utils/languageDetection'

// ElevenLabs Voice Cloning API Integration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

export async function POST(request: NextRequest) {
  try {
    const {
      text,
      voiceId,
      stability = 0.5,
      similarityBoost = 0.8,
      language = 'auto',
      model = 'auto',
    } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
    }

    if (!voiceId) {
      return NextResponse.json({ error: 'Voice ID is required' }, { status: 400 })
    }

    // Detect language if not specified
    const detectionResult = language === 'auto' ? detectLang(text) : { language, confidence: 100 }
    const detectedLanguage = detectionResult.language

    // Choose appropriate model based on language
    let modelId = getModelForLanguage(detectedLanguage)

    if (model !== 'auto') {
      modelId = model
    }

    // Generate speech using ElevenLabs TTS with your cloned voice
    const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: modelId, // Dynamic model selection based on language
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('ElevenLabs API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate speech with ElevenLabs' },
        { status: response.status },
      )
    }

    // Get the audio buffer
    const audioBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(audioBuffer)

    // Return audio as response
    return new NextResponse(buffer as BodyInit, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'X-Voice-Language': detectedLanguage,
        'X-Voice-Model': modelId,
      },
    })
  } catch (error) {
    console.error('ElevenLabs TTS error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate speech with your voice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
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
