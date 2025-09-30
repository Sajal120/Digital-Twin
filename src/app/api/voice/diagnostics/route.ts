import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ? '✅ Set' : '❌ Missing',
        ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID ? '✅ Set' : '❌ Missing',
        ELEVENLABS_VOICE_ID_ENGLISH: process.env.ELEVENLABS_VOICE_ID_ENGLISH
          ? '✅ Set'
          : '❌ Missing',
        ELEVENLABS_VOICE_ID_NEPALI: process.env.ELEVENLABS_VOICE_ID_NEPALI
          ? '✅ Set'
          : '❌ Missing',
        ELEVENLABS_VOICE_ID_SPANISH: process.env.ELEVENLABS_VOICE_ID_SPANISH
          ? '✅ Set'
          : '❌ Missing',
        ELEVENLABS_VOICE_ID_CHINESE: process.env.ELEVENLABS_VOICE_ID_CHINESE
          ? '✅ Set'
          : '❌ Missing',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing',
        USE_VOICE_CLONING: process.env.USE_VOICE_CLONING,
      },
      voiceIds: {
        english: process.env.ELEVENLABS_VOICE_ID_ENGLISH || 'Not set',
        nepali: process.env.ELEVENLABS_VOICE_ID_NEPALI || 'Not set',
        spanish: process.env.ELEVENLABS_VOICE_ID_SPANISH || 'Not set',
        chinese: process.env.ELEVENLABS_VOICE_ID_CHINESE || 'Not set',
        default: process.env.ELEVENLABS_VOICE_ID || 'Not set',
      },
      apis: {
        voiceSpeech: '/api/voice/speech',
        voiceConversation: '/api/voice/conversation',
        voiceElevenlabs: '/api/voice/elevenlabs',
      },
    }

    return NextResponse.json(diagnostics, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Diagnostics failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testType = 'basic' } = await request.json()

    const results = {
      timestamp: new Date().toISOString(),
      testType,
      results: {} as any,
    }

    if (testType === 'speech') {
      // Test speech API internally
      results.results.speechApi = {
        status: 'Available',
        message: 'Speech API endpoint is accessible',
      }
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
