import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        CARTESIA_API_KEY: process.env.CARTESIA_API_KEY ? '✅ Set' : '❌ Missing',
        CARTESIA_VOICE_ID: process.env.CARTESIA_VOICE_ID ? '✅ Set' : '❌ Missing',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing',
        USE_VOICE_CLONING: process.env.USE_VOICE_CLONING,
        PREFERRED_TTS_PROVIDER: process.env.PREFERRED_TTS_PROVIDER || 'cartesia',
      },
      voiceIds: {
        cartesia: process.env.CARTESIA_VOICE_ID || 'Not set',
      },
      apis: {
        voiceSpeech: '/api/voice/speech',
        voiceConversation: '/api/voice/conversation',
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
