import { createClient } from '@deepgram/sdk'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const deepgram = createClient(process.env.DEEPGRAM_API_KEY || '')
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  console.log('🎤 Chat voice transcription endpoint called (OpenAI Whisper with Deepgram fallback)')

  try {
    // Try OpenAI Whisper first (more reliable with audio formats)
    if (process.env.OPENAI_API_KEY) {
      try {
        return await transcribeWithOpenAI(request)
      } catch (openaiError) {
        console.error('❌ OpenAI transcription failed, trying Deepgram fallback:', openaiError)

        // Fall back to Deepgram if OpenAI fails
        if (process.env.DEEPGRAM_API_KEY) {
          console.log('🔄 Falling back to Deepgram...')
          return await transcribeWithDeepgram(request)
        } else {
          throw openaiError // Re-throw if no Deepgram key
        }
      }
    }

    // Fallback to Deepgram if OpenAI is not available
    return await transcribeWithDeepgram(request)
  } catch (error) {
    console.error('❌ All transcription methods failed:', error)
    return NextResponse.json(
      {
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

async function transcribeWithOpenAI(request: NextRequest) {
  console.log('🎤 Using OpenAI Whisper for transcription')

  const formData = await request.formData()
  const audioFile = formData.get('audio') as Blob

  if (!audioFile) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
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

  // Try multiple approaches for WebM compatibility
  let file
  if (audioFile.type.includes('webm')) {
    // For WebM files, try without specifying MIME type to let OpenAI auto-detect
    file = new File([audioBuffer], fileName)
  } else {
    file = new File([audioBuffer], fileName, { type: mimeType })
  }

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

    // If WebM fails due to format issue, try creating as different format
    if (audioFile.type.includes('webm') && error?.message?.includes('format')) {
      console.log('🔄 WebM failed, retrying as WAV...')
      try {
        const wavFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' })
        console.log('🎯 Retrying with WAV format')

        const retryTranscription = await openai.audio.transcriptions.create({
          file: wavFile,
          model: 'whisper-1',
          response_format: 'json',
          temperature: 0.2,
          prompt:
            'This is a voice message that may contain technical terms, names, or casual conversation.',
        })

        console.log('✅ WAV retry successful:', retryTranscription.text?.substring(0, 100))
        return NextResponse.json({
          transcript: retryTranscription.text || '',
          confidence: 1.0,
          detectedLanguage: 'en',
          provider: 'openai-whisper-wav-retry',
        })
      } catch (retryError) {
        console.error('❌ WAV retry also failed:', retryError)
      }
    }

    // If OpenAI fails completely, fall back to Deepgram
    console.log('🔄 OpenAI failed, falling back to Deepgram...')
    throw error // This will trigger the Deepgram fallback in the main function
  }
}

async function transcribeWithDeepgram(request: NextRequest) {
  console.log('🎤 Using Deepgram for transcription')

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
