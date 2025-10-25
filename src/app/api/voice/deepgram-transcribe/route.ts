import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    const deepgramApiKey = process.env.DEEPGRAM_API_KEY
    if (!deepgramApiKey) {
      console.error('❌ Deepgram API key not found')
      return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 })
    }

    console.log('🎤 Transcribing with Deepgram...', audioFile.size, 'bytes')

    // Convert to ArrayBuffer for Deepgram
    const audioBuffer = await audioFile.arrayBuffer()

    // Call Deepgram API with automatic language detection
    const deepgramResponse = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&detect_language=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${deepgramApiKey}`,
          'Content-Type': audioFile.type || 'audio/webm',
        },
        body: audioBuffer,
      },
    )

    if (!deepgramResponse.ok) {
      const errorText = await deepgramResponse.text()
      console.error('❌ Deepgram API error:', errorText)
      throw new Error(`Deepgram API error: ${deepgramResponse.status}`)
    }

    const deepgramData = await deepgramResponse.json()
    console.log('📊 Deepgram response:', JSON.stringify(deepgramData, null, 2))

    // Extract transcript and detected language from Deepgram response
    const transcript = deepgramData?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    const confidence = deepgramData?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0
    const detectedLanguage = deepgramData?.results?.channels?.[0]?.detected_language || 'en'
    const languageConfidence = deepgramData?.results?.channels?.[0]?.language_confidence || 0

    console.log('✅ Deepgram transcription:', transcript)
    console.log('📊 Confidence:', confidence)
    console.log('🌐 Detected language:', detectedLanguage, 'with confidence:', languageConfidence)

    return NextResponse.json({
      success: true,
      transcription: transcript,
      confidence: confidence,
      detectedLanguage: detectedLanguage,
      languageConfidence: languageConfidence,
      timestamp: new Date().toISOString(),
      provider: 'deepgram',
    })
  } catch (error) {
    console.error('❌ Deepgram transcription error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to transcribe audio with Deepgram',
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
