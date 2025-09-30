import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    // Convert file to the format expected by OpenAI
    const audioBuffer = await audioFile.arrayBuffer()
    const audioData = new File([audioBuffer], audioFile.name, {
      type: audioFile.type,
    })

    // Transcribe audio using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioData,
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
    })

    return NextResponse.json({
      success: true,
      transcription: transcription.text,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('STT API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to transcribe audio',
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
