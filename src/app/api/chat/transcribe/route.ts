import { createClient } from '@deepgram/sdk'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize clients lazily to avoid build-time errors
let deepgram: ReturnType<typeof createClient> | null = null
let openai: OpenAI | null = null

function getDeepgramClient() {
  if (!deepgram && process.env.DEEPGRAM_API_KEY) {
    deepgram = createClient(process.env.DEEPGRAM_API_KEY)
  }
  return deepgram
}

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

export async function POST(request: NextRequest) {
  console.log('🎤 Voice Chat Transcription - Using Deepgram (fast & reliable)')

  try {
    // Read form data once and cache it
    const formData = await request.formData()
    const audioFile = formData.get('audio') as Blob

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Try Deepgram first (better WebM support, faster, multilingual)
    if (process.env.DEEPGRAM_API_KEY) {
      try {
        return await transcribeWithDeepgram(audioFile)
      } catch (deepgramError) {
        console.error('❌ Deepgram failed, trying OpenAI fallback:', deepgramError)

        // Fallback to OpenAI if Deepgram fails
        if (process.env.OPENAI_API_KEY) {
          console.log('🔄 Falling back to OpenAI Whisper...')
          return await transcribeWithOpenAI(audioFile)
        } else {
          throw deepgramError
        }
      }
    }

    // Use OpenAI if Deepgram not available
    return await transcribeWithOpenAI(audioFile)
  } catch (error) {
    console.error('❌ All transcription methods failed:', error)
    return NextResponse.json(
      {
        error: 'Voice transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

async function transcribeWithOpenAI(audioFile: Blob) {
  console.log('🎤 Using OpenAI Whisper for transcription')

  const openai = getOpenAIClient()
  if (!openai) {
    throw new Error('OpenAI client not available')
  }

  console.log('🎤 Received audio blob:', {
    size: audioFile.size,
    type: audioFile.type,
  })

  // Convert blob to File for OpenAI with proper filename
  const audioBuffer = await audioFile.arrayBuffer()

  // OpenAI Whisper supports: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
  // Use proper file extension based on MIME type
  let fileName = 'audio.mp3' // default
  let mimeType = 'audio/mp3'

  if (audioFile.type.includes('webm')) {
    // For WebM, use a more compatible MIME type that OpenAI accepts
    fileName = 'audio.webm'
    mimeType = 'audio/webm'
  } else if (audioFile.type.includes('wav')) {
    fileName = 'audio.wav'
    mimeType = 'audio/wav'
  } else if (audioFile.type.includes('ogg')) {
    fileName = 'audio.ogg'
    mimeType = 'audio/ogg'
  } else if (audioFile.type.includes('mp4')) {
    fileName = 'audio.mp4'
    mimeType = 'audio/mp4'
  } else if (audioFile.type.includes('m4a')) {
    fileName = 'audio.m4a'
    mimeType = 'audio/m4a'
  }

  console.log('🎤 Creating file for OpenAI:', {
    fileName,
    originalType: audioFile.type,
    finalMimeType: mimeType,
  })

  // Create file for OpenAI (simpler approach)
  const file = new File([audioBuffer], fileName, { type: mimeType })

  try {
    console.log('🎯 Sending to OpenAI Whisper:', { fileName, fileSize: audioBuffer.byteLength })

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'json',
      // Remove language constraint for better auto-detection
      temperature: 0.2, // Lower temperature for more consistent results
      prompt:
        'This is a voice message that may contain technical terms, names, or casual conversation.', // Context hint
    })

    console.log('✅ OpenAI transcription successful:', transcription.text?.substring(0, 100))
    return NextResponse.json({
      transcript: transcription.text || '',
      confidence: 1.0, // OpenAI doesn't provide confidence scores
      detectedLanguage: 'en',
      provider: 'openai-whisper',
    })
  } catch (error: any) {
    console.error('❌ OpenAI Whisper error:', error)
    throw error // Let the main function handle fallback
  }
}

async function transcribeWithDeepgram(audioFile: Blob) {
  console.log('🎤 Using Deepgram for voice chat transcription')

  const deepgram = getDeepgramClient()

  // Check for API key
  if (!deepgram || !process.env.DEEPGRAM_API_KEY) {
    console.error('❌ DEEPGRAM_API_KEY not configured!')
    return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 })
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

  console.log('🎙️ Sending to Deepgram for transcription (nova-3 with multi-language)...')
  console.log('🌍 Audio format:', audioFile.type, 'Size:', audioBuffer.length, 'bytes')

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
    model: 'nova-3', // Best multilingual support (supports 100+ languages including Hindi)
    language: 'multi', // Auto-detect language (critical for Hindi/English/etc)
    detect_language: true, // Enable language detection
    punctuate: true,
    smart_format: true,
    filler_words: false,
    profanity_filter: false,
    diarize: false,
    utterances: false,
    vad_events: false,
    // Additional settings for better Hindi support
    numerals: true, // Convert numbers properly
    replacements: [], // No word replacements
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
    provider: 'deepgram',
  })
}
