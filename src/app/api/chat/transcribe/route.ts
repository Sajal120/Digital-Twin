import { createClient } from '@deepgram/sdk'
import { NextRequest, NextResponse } from 'next/server'

const deepgram = createClient(process.env.DEEPGRAM_API_KEY || '')

export async function POST(request: NextRequest) {
  console.log('🎤 Chat voice transcription endpoint called (Deepgram)')

  try {
    // Check for API key
    if (!process.env.DEEPGRAM_API_KEY) {
      console.error('❌ DEEPGRAM_API_KEY not configured!')
      return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 })
    }

    // Get audio from form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as Blob

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    console.log('🎤 Received audio blob:', {
      size: audioFile.size,
      type: audioFile.type,
    })

    // Validate minimum audio size (< 5KB is likely silence or error)
    if (audioFile.size < 5000) {
      console.warn('⚠️ Very small audio file (<5KB) - likely silence or recording error')
      return NextResponse.json({
        transcript: '',
        confidence: 0,
        detectedLanguage: 'unknown',
        warning: 'Audio too short or silent',
      })
    }

    // Convert blob to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())

    console.log('🎙️ Sending to Deepgram for transcription (nova-3)...')
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
      model: 'nova-3', // Best multilingual support
      language: 'multi', // Auto-detect language
      detect_language: true,
      punctuate: true,
      smart_format: true,
      filler_words: false,
      profanity_filter: false,
      diarize: false,
      utterances: false,
      vad_events: false,
    })

    if (error) {
      console.error('❌ Deepgram error:', error)
      return NextResponse.json({ error: 'Transcription failed', details: error }, { status: 500 })
    }

    const transcript = result?.results?.channels[0]?.alternatives[0]?.transcript || ''
    const confidence = result?.results?.channels[0]?.alternatives[0]?.confidence || 0
    const detectedLanguage = result?.results?.channels[0]?.detected_language || 'en'

    console.log('✅ Deepgram chat transcription:', {
      transcript,
      confidence,
      detectedLanguage,
      audioSize: audioBuffer.length,
    })

    return NextResponse.json({
      success: true,
      transcript,
      confidence,
      detectedLanguage,
    })
  } catch (error) {
    console.error('❌ Chat transcription error:', error)
    return NextResponse.json(
      { error: 'Transcription failed', details: String(error) },
      { status: 500 },
    )
  }
}
