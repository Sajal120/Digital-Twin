/**
 * Process AI Response Endpoint (Dynamic Route)
 *
 * This endpoint is called AFTER the thinking sound plays.
 * It retrieves the speech from memory and processes the AI response.
 *
 * Path: /api/phone/process-response/[callSid]
 */

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { omniChannelManager } from '@/lib/omni-channel-manager'
import { retrieveSpeech } from '@/lib/redis-phone-cache'

export const runtime = 'nodejs'
export const maxDuration = 60

// Import the pending speech map from handle-speech
// Note: In production, use Redis or similar for cross-instance storage
declare global {
  var pendingSpeechMap: Map<string, string>
  var pendingAIPromises: Map<string, Promise<any>>
}

if (!global.pendingSpeechMap) {
  global.pendingSpeechMap = new Map()
}

if (!global.pendingAIPromises) {
  global.pendingAIPromises = new Map()
}

async function processResponse(request: NextRequest, { params }: { params: { callSid: string } }) {
  const callSid = params.callSid

  console.log('🚀 [PROCESS-RESPONSE] Endpoint called!')
  console.log('📍 CallSid:', callSid)
  console.log('📍 Method:', request.method)

  try {
    // Retrieve speech from Redis (works across serverless instances!)
    const speechData = await retrieveSpeech(callSid)

    console.log('� Retrieved and deleted speech from Redis:', callSid)
    console.log('📋 Speech data structure:', typeof speechData, Object.keys(speechData || {}))

    // Handle both old format (string) and new format (object)
    let speechResult: string
    let detectedLanguage: string = 'en'

    if (typeof speechData === 'string') {
      // Old format - direct string
      speechResult = speechData
      console.log('📋 Using legacy string format:', speechResult?.substring(0, 50))
    } else if (speechData && typeof speechData === 'object') {
      // New format - object with text and detectedLanguage
      const dataObj = speechData as any // Type assertion for flexibility
      speechResult = dataObj.text || dataObj.speechResult || ''
      detectedLanguage = dataObj.detectedLanguage || dataObj.language || 'en'
      console.log('📋 Using object format:', speechResult?.substring(0, 50))
    } else {
      console.error('❌ Invalid speech data format:', speechData)
      throw new Error('Invalid speech data format from Redis')
    }

    if (!callSid || !speechResult) {
      console.error('❌ Missing data from Redis:', {
        callSid: !!callSid,
        speechResult: !!speechResult,
        speechDataType: typeof speechData,
      })
      throw new Error('Missing callSid or speech result from Redis')
    }

    console.log(
      '🤖 Processing AI response for:',
      speechResult?.substring(0, 50) || 'No speech result',
    )
    console.log('🌍 Detected language from transcription:', detectedLanguage)

    // Get unified context
    const unifiedContext = await omniChannelManager.getUnifiedContext(
      callSid,
      'phone',
      callSid,
      'Twilio Voice API',
    )

    // Check previous language
    const lastTurn =
      unifiedContext.conversationHistory[unifiedContext.conversationHistory.length - 1]
    const previousLanguage = (lastTurn?.metadata as any)?.detectedLanguage || null

    // Generate AI response using MCP
    const aiStartTime = Date.now()
    const unifiedResponse = await omniChannelManager.generateUnifiedResponse(
      callSid,
      speechResult,
      {
        currentTurn: unifiedContext.conversationHistory.length,
        phoneCall: true,
        ultraBrief: true,
        deepgramLanguage: detectedLanguage,
        enableMCP: true,
        enableDatabase: true,
        enableMultiLanguage: true,
      },
    )

    console.log(`✅ MCP response generated in ${Date.now() - aiStartTime}ms!`)
    console.log('📊 Source:', unifiedResponse.source)

    const currentLanguage = (unifiedResponse as any).language || 'en'
    if (currentLanguage !== previousLanguage && previousLanguage) {
      console.log(`🔄 LANGUAGE SWITCHED: ${previousLanguage} → ${currentLanguage}`)
    }

    // Continue with audio generation...
    const responseStartTime = Date.now()

    // Determine Twilio language code
    let twilioLanguage = 'en-US'
    if (currentLanguage === 'hi') {
      twilioLanguage = 'hi-IN'
    } else if (currentLanguage === 'ne') {
      twilioLanguage = 'ne-NP'
    }

    console.log(
      `🌍 Using Twilio language: ${twilioLanguage} (current turn: ${currentLanguage}, previous turn: ${previousLanguage || 'none'})`,
    )

    // Check for cached audio first
    let audioUrl: string | null = null
    try {
      const { getCachedAudioUrl, cacheAudioUrl } = await import('@/lib/redis-cache')
      audioUrl = await getCachedAudioUrl(unifiedResponse.response, currentLanguage)
      if (audioUrl) {
        console.log('⚡ Using cached audio URL (instant)')
      }
    } catch (cacheError) {
      console.warn('⚠️ Audio cache check failed:', cacheError)
    }

    // Generate audio with Cartesia if not cached
    if (!audioUrl) {
      console.log('🎤 Generating YOUR voice response with Cartesia...')
      const cartesiaStartTime = Date.now()

      const cartesiaResponse = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.CARTESIA_API_KEY || '',
          'Cartesia-Version': '2024-10-21',
        },
        body: JSON.stringify({
          model_id: detectedLanguage === 'hi' ? 'sonic-multilingual' : 'sonic-english',
          transcript: unifiedResponse.response,
          voice: {
            mode: 'id',
            id: process.env.CARTESIA_VOICE_ID,
            __experimental_controls: {
              speed: 'normal',
            },
          },
          output_format: {
            container: 'mp3',
            encoding: 'mp3',
            sample_rate: 44100,
            bit_rate: 128000,
          },
          language: detectedLanguage,
        }),
      })

      if (!cartesiaResponse.ok) {
        const errorText = await cartesiaResponse.text()
        throw new Error(`Cartesia API error: ${cartesiaResponse.status} - ${errorText}`)
      }

      console.log(`⚡ Cartesia responded in ${Date.now() - cartesiaStartTime}ms`)

      const audioBuffer = await cartesiaResponse.arrayBuffer()
      const audioBufferObj = Buffer.from(audioBuffer)

      // Generate unique audio ID
      const audioId = `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Upload to Vercel Blob
      const uploadStartTime = Date.now()
      console.log('⚡ Starting blob upload...')
      console.log('📁 Audio metadata:', {
        audioId,
        bufferSize: audioBufferObj.length,
        textPreview: unifiedResponse.response.substring(0, 50),
      })

      const blob = await put(`phone-audio/${audioId}.mp3`, audioBufferObj, {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
        cacheControlMaxAge: 3600,
      })

      console.log(`✅ Blob upload completed in ${Date.now() - uploadStartTime}ms`)
      console.log('🔗 Blob URL:', blob.url)

      audioUrl = blob.url

      // Cache the audio URL for future reuse
      try {
        const { cacheAudioUrl } = await import('@/lib/redis-cache')
        await cacheAudioUrl(unifiedResponse.response, audioUrl, currentLanguage)
      } catch (cacheError) {
        console.warn('⚠️ Audio caching failed:', cacheError)
      }
    }

    console.log('🔗 Audio URL:', audioUrl)
    console.log(`⏱️ Total audio generation time: ${Date.now() - responseStartTime}ms`)

    // Return TwiML with the response
    console.log('🏗️ BUILDING TwiML response...')

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Pause length="1"/>
  <Record
    action="/api/phone/handle-speech"
    method="POST"
    timeout="5"
    finishOnKey="#"
    maxLength="30"
    playBeep="false"
    transcribe="false"
    recordingStatusCallback="/api/phone/handle-speech"
    recordingStatusCallbackMethod="POST"
  />
</Response>`

    console.log('📤 Returning TwiML with Play directive')
    console.log('🎵 Audio URL:', audioUrl)
    console.log('📋 TwiML length:', twiml.length, 'characters')

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('❌ Error processing response:', error)

    // Generate error message in YOUR voice with Cartesia
    try {
      const errorMessage = "Sorry, I'm having trouble processing that. Please try again."
      const errorAudioResponse = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.CARTESIA_API_KEY || '',
          'Cartesia-Version': '2024-10-21',
        },
        body: JSON.stringify({
          model_id: 'sonic-english',
          transcript: errorMessage,
          voice: {
            mode: 'id',
            id: process.env.CARTESIA_VOICE_ID,
            __experimental_controls: {
              speed: 'normal',
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

      if (errorAudioResponse.ok) {
        const errorAudioBuffer = await errorAudioResponse.arrayBuffer()
        const errorAudioId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const errorBlob = await put(
          `phone-audio/${errorAudioId}.mp3`,
          Buffer.from(errorAudioBuffer),
          {
            access: 'public',
            contentType: 'audio/mpeg',
            cacheControlMaxAge: 3600,
          },
        )

        const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${errorBlob.url}</Play>
  <Pause length="1"/>
  <Record
    action="/api/phone/handle-speech"
    method="POST"
    timeout="5"
    finishOnKey="#"
    maxLength="30"
    playBeep="false"
    transcribe="false"
  />
</Response>`

        return new Response(errorTwiml, {
          headers: { 'Content-Type': 'text/xml' },
        })
      }
    } catch (cartesiaError) {
      console.error('❌ Cartesia error fallback failed:', cartesiaError)
    }

    // Final fallback if Cartesia fails
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Google.en-US-Standard-D">Sorry, having trouble. Please call back.</Say>
  <Hangup/>
</Response>`

    return new Response(errorTwiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}

// Support both GET and POST methods
export async function GET(request: NextRequest, context: { params: { callSid: string } }) {
  return processResponse(request, context)
}

export async function POST(request: NextRequest, context: { params: { callSid: string } }) {
  return processResponse(request, context)
}
