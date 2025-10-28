import { createClient } from '@deepgram/sdk'
import { NextRequest, NextResponse } from 'next/server'

// Initialize client lazily to avoid build-time errors
let deepgram: ReturnType<typeof createClient> | null = null

function getDeepgramClient() {
  if (!deepgram && process.env.DEEPGRAM_API_KEY) {
    deepgram = createClient(process.env.DEEPGRAM_API_KEY)
  }
  return deepgram
}

export async function POST(request: NextRequest) {
  console.log('🎤 Deepgram multilingual transcription endpoint called')

  try {
    const deepgram = getDeepgramClient()
    if (!deepgram) {
      return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { audioUrl } = body

    // CHECK CACHE FIRST (avoid 7s Deepgram delay)
    try {
      const { getCachedTranscription } = await import('@/lib/redis-cache')
      const cached = await getCachedTranscription(audioUrl)
      if (cached) {
        console.log('⚡ TRANSCRIPTION CACHE HIT! (instant)')
        return NextResponse.json({
          success: true,
          transcript: cached.transcript,
          confidence: cached.confidence,
          detectedLanguage: cached.language,
          source: 'cache',
        })
      }
    } catch (error) {
      console.warn('⚠️ Transcription cache check failed:', error)
    }

    if (!audioUrl) {
      return NextResponse.json({ error: 'No audio URL provided' }, { status: 400 })
    }

    console.log('🎤 Transcribing audio with Deepgram:', audioUrl)

    // Check for API key
    if (!process.env.DEEPGRAM_API_KEY) {
      console.error('❌ DEEPGRAM_API_KEY not configured!')
      return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 })
    }

    // First, download the audio from Twilio with authentication
    console.log('📥 Downloading audio from Twilio...')

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error('❌ Missing Twilio credentials!')
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 })
    }

    const twilioAuth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`,
    ).toString('base64')

    // Wait 1 second for Twilio to finish processing the recording
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const audioResponse = await fetch(audioUrl, {
      headers: {
        Authorization: `Basic ${twilioAuth}`,
      },
    })

    if (!audioResponse.ok) {
      console.error('❌ Failed to download audio from Twilio:', audioResponse.status)
      const errorBody = await audioResponse.text()
      console.error('❌ Twilio error response:', errorBody)
      return NextResponse.json(
        { error: 'Failed to download audio', status: audioResponse.status },
        { status: 500 },
      )
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const contentType = audioResponse.headers.get('content-type') || 'unknown'
    console.log('✅ Audio downloaded:', {
      size: audioBuffer.byteLength,
      contentType,
      url: audioUrl,
    })

    // Validate minimum audio size (< 10KB is likely silence or error)
    if (audioBuffer.byteLength < 10000) {
      console.warn('⚠️ Very small audio file (<10KB) - likely silence or recording error')
      return NextResponse.json({
        transcript: '',
        confidence: 0,
        detectedLanguage: 'unknown',
        warning: 'Audio too short or silent',
      })
    }

    // Log first few bytes to verify it's actual audio data
    const firstBytes = Buffer.from(audioBuffer).slice(0, 16)
    console.log('🔍 Audio header (first 16 bytes):', firstBytes.toString('hex'))

    // Transcribe with Deepgram using the audio buffer
    // STRATEGY:
    // 1. Use Deepgram's multi-language detection for supported languages
    // 2. For unsupported languages (Nepali), transcribe as Hindi (closest relative)
    // 3. Our multi-language-rag will re-detect from transcript text for final language
    //
    // Deepgram Supported Languages: en, es, fr, de, it, pt, nl, hi, ja, ko, zh, ru, ar, tr, uk, sv
    // NOT Supported: Nepali (ne), Filipino (fil), Thai (th), Vietnamese (vi), Indonesian (id)
    // For these, we rely on text-based detection after transcription
    console.log('🎙️ Sending to Deepgram for multilingual transcription (nova-3)...')
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      Buffer.from(audioBuffer),
      {
        model: 'nova-3', // Nova-3: Best multilingual support (en, es, fr, de, hi, ru, pt, ja, it, nl)
        language: 'multi', // Auto-detect from 10+ languages
        detect_language: true, // Auto-detect language for accurate transcription
        punctuate: true,
        smart_format: true,
        filler_words: false, // Keep filler words for natural speech
        profanity_filter: false, // Don't censor words
        diarize: false, // Single speaker (phone call)
        utterances: false, // Not needed for short recordings
        vad_events: false, // Voice activity detection events not needed
        // Let Deepgram auto-detect encoding - Twilio can send various formats
        // encoding: 'linear16', // Remove fixed encoding
        // sample_rate: 8000, // Remove fixed sample rate
      },
    )

    if (error) {
      console.error('❌ Deepgram error:', error)
      return NextResponse.json({ error: 'Transcription failed', details: error }, { status: 500 })
    }

    // Log full Deepgram response for debugging
    console.log('📊 Deepgram full response:', JSON.stringify(result, null, 2))

    const transcript = result?.results?.channels[0]?.alternatives[0]?.transcript || ''
    const confidence = result?.results?.channels[0]?.alternatives[0]?.confidence || 0
    const deepgramDetectedLang = result?.results?.channels[0]?.detected_language || 'unknown'

    console.log('✅ Deepgram multilingual transcription:', {
      transcript,
      confidence,
      deepgramDetectedLang,
      audioSize: audioBuffer.byteLength,
    })

    // Return transcript AND detected language
    // Deepgram's language detection will be used as primary signal in multi-language-rag

    // CACHE THE TRANSCRIPTION for future speed (avoid 7s Deepgram delay)
    try {
      const { cacheTranscription } = await import('@/lib/redis-cache')
      await cacheTranscription(audioUrl, transcript, deepgramDetectedLang, confidence)
    } catch (error) {
      console.warn('⚠️ Failed to cache transcription:', error)
    }

    return NextResponse.json({
      transcript,
      confidence,
      detectedLanguage: deepgramDetectedLang, // CRITICAL: Pass Deepgram's language detection
    })
  } catch (error) {
    console.error('❌ Deepgram transcription error:', error)
    return NextResponse.json(
      { error: 'Transcription failed', details: String(error) },
      { status: 500 },
    )
  }
}
