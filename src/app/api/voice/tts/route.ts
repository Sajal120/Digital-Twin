import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const cartesiaApiKey = process.env.CARTESIA_API_KEY
    const voiceId = process.env.CARTESIA_VOICE_ID || '6de7b29c-12d3-480d-9738-dd1f7b640364' // Your cloned voice

    if (!cartesiaApiKey) {
      console.error('❌ Cartesia API key not found')
      return NextResponse.json({ error: 'Cartesia API key not configured' }, { status: 500 })
    }

    console.log('🎤 Generating speech with Cartesia cloned voice...', text.substring(0, 50) + '...')
    console.log('🔑 Using voice ID:', voiceId)

    // Generate speech using Cartesia with your cloned voice
    const cartesiaResponse = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': cartesiaApiKey,
      },
      body: JSON.stringify({
        model_id: 'sonic-english',
        transcript: text,
        voice: {
          mode: 'id',
          id: voiceId,
          __experimental_controls: {
            speed: 'normal',
            emotion: ['curiosity:low', 'positivity:high'],
          },
        },
        output_format: {
          container: 'mp3',
          encoding: 'mp3',
          sample_rate: 44100,
          bit_rate: 128000,
        },
        language: 'en',
      }),
    })

    if (!cartesiaResponse.ok) {
      const errorText = await cartesiaResponse.text()
      console.error('❌ Cartesia API error:', errorText)
      throw new Error(`Cartesia API error: ${cartesiaResponse.status}`)
    }

    const audioBuffer = await cartesiaResponse.arrayBuffer()
    console.log('✅ Cartesia TTS successful, audio size:', audioBuffer.byteLength, 'bytes')

    // Return audio as response
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('❌ Cartesia TTS error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate speech with Cartesia',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'cartesia',
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
