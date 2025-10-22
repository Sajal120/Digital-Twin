/**
 * Process AI Response Endpoint
 *
 * This endpoint is called AFTER the thinking sound plays.
 * It processes the user's speech and returns the AI response.
 */

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { omniChannelManager } from '@/lib/omni-channel-manager'

export const runtime = 'nodejs'
export const maxDuration = 60

async function processResponse(request: NextRequest) {
  console.log('🚀 [PROCESS-RESPONSE] Endpoint called!')
  console.log('📍 URL:', request.url)
  console.log('📍 Method:', request.method)

  try {
    let callSid: string | null = null
    let speechResult: string | null = null

    // Try query params first (for GET or query string in POST)
    const searchParams = request.nextUrl.searchParams
    callSid = searchParams.get('CallSid') || searchParams.get('callSid')
    speechResult = searchParams.get('SpeechResult') || searchParams.get('speech')

    // If POST, also check form data (Twilio format)
    if (request.method === 'POST' && (!callSid || !speechResult)) {
      try {
        const formData = await request.formData()
        callSid = callSid || (formData.get('CallSid') as string)
        speechResult = speechResult || (formData.get('SpeechResult') as string)
      } catch (e) {
        console.log('⚠️ No form data available')
      }
    }

    console.log('📋 Parameters:', { callSid, speechLength: speechResult?.length })

    if (!callSid || !speechResult) {
      console.error('❌ Missing parameters:', { callSid: !!callSid, speech: !!speechResult })
      throw new Error('Missing callSid or speech parameter')
    }

    console.log('🤖 Processing AI response for:', speechResult.substring(0, 50))

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
    const responseStartTime = Date.now()
    const unifiedResponse = await omniChannelManager.generateUnifiedResponse(
      callSid,
      speechResult,
      {
        currentTurn: unifiedContext.conversationHistory.length,
        phoneCall: true,
        ultraBrief: true,
        deepgramLanguage: (request as any).deepgramLanguage,
        enableMCP: true,
        enableDatabase: true,
        enableMultiLanguage: true,
      },
    )

    const responseTime = Date.now() - responseStartTime
    console.log(`✅ MCP response generated in ${responseTime}ms!`)
    console.log('📊 Source:', unifiedResponse.source)

    const currentLanguage = (unifiedResponse as any).language || 'en'
    if (currentLanguage !== previousLanguage && previousLanguage) {
      console.log(`🔄 LANGUAGE SWITCHED: ${previousLanguage} → ${currentLanguage}`)
    }

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

    // Generate audio with Cartesia (your cloned voice)
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
        model_id: 'sonic-english',
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
        language: 'en',
      }),
    })

    if (!cartesiaResponse.ok) {
      throw new Error(`Cartesia API error: ${cartesiaResponse.status}`)
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

    const audioUrl = blob.url

    console.log('🔗 Audio URL:', audioUrl)
    console.log(`⏱️ Total response time: ${Date.now() - responseStartTime}ms`)

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

    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Google.en-US-Standard-D">I'm having trouble processing that. Please try again.</Say>
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
}

// Support both GET and POST methods
export async function GET(request: NextRequest) {
  return processResponse(request)
}

export async function POST(request: NextRequest) {
  return processResponse(request)
}
