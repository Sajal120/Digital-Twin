import { NextRequest, NextResponse } from 'next/server'
import { omniChannelManager } from '../../../../lib/omni-channel-manager'
import { voiceService } from '../../../../services/voiceService'
import { put } from '@vercel/blob'
import { createPhoneAudioUrl } from '../../../../lib/phone-audio-cache'
import { storeSpeech } from '../../../../lib/redis-phone-cache'

// Temporary storage for speech results (before processing)
// Maps callSid -> speechResult
// Use global to share across serverless invocations
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

// DEEPGRAM VERSION 2.9 - THINKING ACKNOWLEDGMENT
const VERSION = 'v2.9-thinking-ack-oct7'

// Pre-generated "thinking" sound - plays immediately while AI processes
// Natural varied pattern: "Hmmmmm... hmm, hmm" (pauses built into audio)
const THINKING_SOUND_URL =
  'https://brxp5nmtsramnrr1.public.blob.vercel-storage.com/phone-audio/thinking_natural.mp3'

// In-memory deduplication store (prevents duplicate webhook processing)
// Key: callSid + recordingUrl hash, Value: timestamp
const processingCache = new Map<string, number>()
const DEDUP_TTL = 10000 // 10 seconds - enough to handle duplicate webhooks

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of processingCache.entries()) {
    if (now - timestamp > DEDUP_TTL) {
      processingCache.delete(key)
    }
  }
}, 5000) // Clean every 5 seconds

// Map language codes to Twilio language codes
function getTwilioLanguageCode(languageCode: string): string {
  const languageMap: Record<string, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    ne: 'ne-NP',
    zh: 'zh-CN',
    es: 'es-ES',
    fr: 'fr-FR',
    tl: 'fil-PH',
    id: 'id-ID',
    th: 'th-TH',
    vi: 'vi-VN',
    ar: 'ar-SA',
    ja: 'ja-JP',
    ko: 'ko-KR',
    pt: 'pt-BR',
    ru: 'ru-RU',
    de: 'de-DE',
    it: 'it-IT',
  }
  return languageMap[languageCode] || 'en-US'
}

// Handle Twilio speech recognition results (NO recording download needed!)
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log(`🎙️ [${VERSION}] Speech webhook - dedup + blob optimization`)
  console.log(`⚡ Performance: Duplicate prevention, parallel blob upload`)

  try {
    // Parse Twilio form data
    const formData = await request.formData()
    const webhookData = Object.fromEntries(formData.entries())

    const callSid = webhookData.CallSid as string
    const recordingUrl = webhookData.RecordingUrl as string
    const recordingStatus = webhookData.RecordingStatus as string
    let speechResult = webhookData.SpeechResult as string // Fallback to Twilio if available
    const confidence = webhookData.Confidence as string

    // IGNORE recording-status-callback webhooks (redundant - we process action-callback already)
    // Twilio sends BOTH action-callback AND recording-status-callback for the same recording
    // We only need to process one of them
    if (recordingStatus === 'completed' || recordingStatus === 'processing') {
      console.log(`🚫 IGNORING recording-status-callback (${recordingStatus}) - redundant`)
      console.log(`📝 Recording: ${recordingUrl}`)
      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // CRITICAL: EARLY DEDUPLICATION before any processing
    // Use recordingUrl if available, otherwise use callSid + "pending" for in-progress recordings
    // This catches duplicates even while transcription is happening
    const dedupKey = recordingUrl
      ? `${callSid}_${recordingUrl}`
      : `${callSid}_pending_${Math.floor(Date.now() / 5000)}` // 5-second window for pending

    const lastProcessed = processingCache.get(dedupKey)
    const now = Date.now()

    if (lastProcessed && now - lastProcessed < DEDUP_TTL) {
      const elapsed = now - lastProcessed
      console.log(
        `🚫 DUPLICATE WEBHOOK BLOCKED (${elapsed}ms ago) - ${recordingStatus || 'pending'}`,
      )
      console.log(`🔑 Dedup key: ${dedupKey}`)

      // Return empty TwiML immediately - don't reprocess
      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // ATOMIC: Mark as processing IMMEDIATELY (before any async work)
    processingCache.set(dedupKey, now)

    console.log('🎤 Webhook received (FIRST):', {
      callSid,
      recordingUrl: recordingUrl || 'none',
      recordingStatus: recordingStatus || 'none',
      hasRecording: !!recordingUrl,
      speechResult: speechResult || '(no speech)',
      confidence: confidence || 'N/A',
      webhookType: recordingStatus ? 'recording-status-callback' : 'action-callback',
      dedupKey,
    })

    // If we have a recording URL, use Deepgram for transcription
    if (recordingUrl) {
      console.log('🎙️ Transcribing with Deepgram...', { recordingUrl })
      try {
        const deepgramResponse = await fetch(
          `${request.nextUrl.origin}/api/phone/deepgram-transcribe`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioUrl: recordingUrl }),
          },
        )

        console.log('📡 Deepgram API response status:', deepgramResponse.status)

        if (deepgramResponse.ok) {
          const deepgramResult = await deepgramResponse.json()
          speechResult = deepgramResult.transcript

          // Store Deepgram's detected language to pass to language detection
          const deepgramLanguage = deepgramResult.detectedLanguage

          // Check if confidence is too low - but be more lenient for multilingual
          // Non-English languages naturally have lower confidence scores
          const isLikelyEmpty = !speechResult || speechResult.trim().length === 0
          const minConfidence = deepgramLanguage === 'en' ? 0.5 : 0.3 // Lower threshold for non-English

          if (deepgramResult.confidence < minConfidence && !isLikelyEmpty) {
            console.warn(
              `⚠️ Low confidence (${(deepgramResult.confidence * 100).toFixed(1)}%) for ${deepgramLanguage} - but keeping transcript: "${speechResult}"`,
            )
          } else if (isLikelyEmpty) {
            console.warn(
              `⚠️ Empty transcript (confidence: ${(deepgramResult.confidence * 100).toFixed(1)}%) - likely silence or background noise`,
            )
            speechResult = '' // Clear empty transcript
          }

          console.log('✅ Deepgram transcription SUCCESS:', {
            transcript: speechResult,
            deepgramDetectedLang: deepgramLanguage,
            confidence: deepgramResult.confidence,
          })

          // Store Deepgram language for passing to omniChannelManager
          // This will be used as a hint by multi-language-rag
          if (deepgramLanguage && deepgramLanguage !== 'unknown') {
            // Attach to request context to pass later
            ;(request as any).deepgramLanguage = deepgramLanguage
          }
        } else {
          const errorText = await deepgramResponse.text()
          console.error('❌ Deepgram API failed:', {
            status: deepgramResponse.status,
            error: errorText,
          })
        }
      } catch (deepgramError) {
        console.error('❌ Deepgram transcription error:', deepgramError)
      }
    } else {
      console.log('⚠️ No RecordingUrl found in webhook data')
    }

    console.log('🎤 Final speech result:', {
      callSid,
      speechResult: speechResult || '(no speech)',
      confidence: confidence || 'N/A',
      speechResultLength: speechResult?.length || 0,
    })

    // Validate required fields
    if (!callSid) {
      console.error('❌ Missing CallSid')
      throw new Error('Missing required webhook data')
    }

    // Check if we got speech
    if (!speechResult || speechResult.trim().length === 0) {
      console.log('❌ No speech detected, asking user to repeat with YOUR voice')

      // Generate YOUR voice for "didn't catch that" message
      try {
        const retryMessage = "I didn't catch that. Please speak after the beep."
        const elevenlabsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
          {
            method: 'POST',
            headers: {
              Accept: 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
            },
            body: JSON.stringify({
              text: retryMessage,
              model_id: 'eleven_turbo_v2_5',
              voice_settings: {
                stability: 0.6,
                similarity_boost: 0.8,
              },
              output_format: 'mp3_22050_32',
              optimize_streaming_latency: 4,
            }),
          },
        )

        if (elevenlabsResponse.ok) {
          const audioBuffer = await elevenlabsResponse.arrayBuffer()
          const audioId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

          // Upload to Vercel Blob with edge caching
          const blob = await put(`phone-audio/${audioId}.mp3`, Buffer.from(audioBuffer), {
            access: 'public',
            contentType: 'audio/mpeg',
            cacheControlMaxAge: 3600, // Cache at edge for faster delivery
          })

          console.log(`📁 Uploaded retry audio to Vercel Blob: ${blob.url}`)
          const audioUrl = blob.url

          const noSpeechTwiml = `<?xml version="1.0" encoding="UTF-8"?>
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
          return new NextResponse(noSpeechTwiml, {
            status: 200,
            headers: {
              'Content-Type': 'text/xml; charset=utf-8',
              'Cache-Control': 'no-cache',
            },
          })
        }
      } catch (error) {
        console.warn('⚠️ ElevenLabs failed for retry message, using Say fallback')
      }

      // Fallback to Say if ElevenLabs fails
      const noSpeechTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural" language="en-US">I didn't catch that. Please speak after the beep.</Say>
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
      return new NextResponse(noSpeechTwiml, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // INSTANT FEEDBACK: Store speech in Redis and play thinking sounds IMMEDIATELY
    // Then redirect to process-response which will retrieve from Redis and process
    console.log('🎵 Storing speech in Redis and playing thinking sounds...')

    // Store speech in Redis (survives across serverless instances!)
    await storeSpeech(callSid, speechResult)

    // Return thinking sounds IMMEDIATELY (AI will process after redirect)
    // Natural varied thinking: "Hmmmmmmmmmmmm... hmm... hmmmmmmm" with YOUR male voice
    // Plays 2x in parallel to cover entire AI processing time (~8-10s)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sajal-app.online'
    const thinkingTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play loop="2">${THINKING_SOUND_URL}</Play>
  <Redirect method="POST">${baseUrl}/api/phone/process-response/${callSid}</Redirect>
</Response>`

    console.log('✅ Returning instant thinking sounds TwiML')
    console.log('🔗 Will redirect to:', `${baseUrl}/api/phone/process-response/${callSid}`)

    return new NextResponse(thinkingTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })

    // UNREACHABLE CODE BELOW - old synchronous flow (kept for reference)
    // Get unified context
    console.log('🌐 Getting unified context...')
    const unifiedContext = await omniChannelManager.getUnifiedContext(
      callSid,
      'phone',
      callSid,
      'Twilio Voice API',
    )

    console.log(
      `👤 Context: ${unifiedContext.channels.length} channels, ${unifiedContext.conversationHistory.length} turns`,
    )

    // Check if we have a stored language from previous turns
    const lastTurn =
      unifiedContext.conversationHistory[unifiedContext.conversationHistory.length - 1]
    const previousLanguage = (lastTurn?.metadata as any)?.detectedLanguage || null
    console.log(
      `📋 Previous language from conversation: ${previousLanguage || 'None (first turn)'}`,
    )

    // Generate AI response using MCP
    console.log('🤖 Generating AI response with MCP...')
    console.log(`📝 User said: "${speechResult}"`)

    let aiResponse: any

    try {
      console.log('⏳ CALLING generateUnifiedResponse... (15s timeout)')
      const responseStartTime = Date.now()

      const unifiedResponse = await omniChannelManager.generateUnifiedResponse(
        callSid,
        speechResult,
        {
          currentTurn: unifiedContext.conversationHistory.length,
          phoneCall: true,
          ultraBrief: true,
          deepgramLanguage: (request as any).deepgramLanguage, // Pass Deepgram hint
          // Enable full ChatGPT-like capabilities: MCP, database, multi-language, RAG
          enableMCP: true,
          enableDatabase: true,
          enableMultiLanguage: true,
        },
      )

      const responseDuration = Date.now() - responseStartTime
      console.log(`✅ MCP response generated in ${responseDuration}ms!`)
      console.log(`📊 Source: ${unifiedResponse.source}`)

      // Extract detected language from CURRENT turn only - always re-detect, never stick to previous
      const detectedLanguage = unifiedResponse.context?.detectedLanguage || 'en'
      const twilioLanguage = getTwilioLanguageCode(detectedLanguage)

      // Log language switch if it changed
      if (previousLanguage && previousLanguage !== detectedLanguage) {
        console.log(`🔄 LANGUAGE SWITCHED: ${previousLanguage} → ${detectedLanguage}`)
      }

      console.log(
        `🌍 Using Twilio language: ${twilioLanguage} (current turn: ${detectedLanguage}, previous turn: ${previousLanguage || 'none'})`,
      )

      // Store conversation turn WITH detected language for persistence
      await omniChannelManager.addConversationTurn(
        callSid,
        speechResult,
        unifiedResponse.response,
        {
          audioProcessed: true,
          confidence: parseFloat(confidence) || 0.9,
          channelType: 'phone',
          turnNumber: unifiedContext.conversationHistory.length,
          detectedLanguage: detectedLanguage, // Store language for future turns
          twilioLanguage: twilioLanguage,
        },
      )

      aiResponse = {
        response: unifiedResponse.response,
        success: true,
        source: unifiedResponse.source,
        detectedLanguage: detectedLanguage,
        twilioLanguage: twilioLanguage,
      }
    } catch (error: any) {
      console.error('❌ MCP failed:', error.message)
      console.error('❌ MCP error stack:', error.stack)
      console.error('❌ User said:', speechResult)
      console.error('❌ Will return retry TwiML (not OK!)')

      const retryTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural" language="en-US">
    I'm having technical difficulties. Let me try again. Please speak after the beep.
  </Say>
  <Pause length="0.3"/>
  <Record
    action="/api/phone/handle-speech"
    method="POST"
    timeout="1.5"
    finishOnKey="#"
    maxLength="30"
    playBeep="false"
    transcribe="false"
    recordingStatusCallback="/api/phone/handle-speech"
    recordingStatusCallbackMethod="POST"
  />
</Response>`
      return new NextResponse(retryTwiml, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }

    console.log('🎤 Generating YOUR voice response...')
    const voiceStartTime = Date.now()

    // Generate ElevenLabs audio with aggressive timeout (must finish before Twilio timeout)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log('⏱️ ElevenLabs timeout after 3s, aborting...')
        controller.abort()
      }, 3000) // 3s timeout - ultra aggressive for phone speed

      const elevenlabsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          },
          body: JSON.stringify({
            text: aiResponse.response,
            model_id: 'eleven_turbo_v2_5', // Fastest model
            voice_settings: {
              stability: 0.5, // Lower for speed
              similarity_boost: 0.75, // Lower for speed
              style: 0.0, // Disable for speed
              use_speaker_boost: false, // Disable for speed
            },
            output_format: 'mp3_22050_32', // Lower quality for faster generation
            optimize_streaming_latency: 4, // Maximum speed optimization
            apply_text_normalization: 'off', // Skip normalization for speed
          }),
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)
      console.log(`⚡ ElevenLabs responded in ${Date.now() - voiceStartTime}ms`)

      if (!elevenlabsResponse.ok) {
        throw new Error(`ElevenLabs: ${elevenlabsResponse.status}`)
      }

      const audioBuffer = await elevenlabsResponse.arrayBuffer()

      if (!audioBuffer || audioBuffer.byteLength === 0) {
        throw new Error('Empty audio buffer from ElevenLabs')
      }

      // Cache audio
      const audioId = `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const audioBufferObj = Buffer.from(audioBuffer)
      const uploadStartTime = Date.now()

      console.log('⚡ PARALLEL: Starting blob upload (non-blocking)')
      console.log('📁 Audio metadata:', {
        audioId,
        bufferSize: audioBufferObj.length,
        textPreview: aiResponse.response.substring(0, 50),
      })

      // ULTRA-FAST: Start blob upload in parallel, don't wait
      // This saves 1-2 seconds by responding to Twilio immediately
      const uploadPromise = put(`phone-audio/${audioId}.mp3`, audioBufferObj, {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
        cacheControlMaxAge: 3600,
      })
        .then((blob) => {
          const uploadDuration = Date.now() - uploadStartTime
          console.log(`✅ Blob upload completed in ${uploadDuration}ms (background)`)
          console.log('� Blob URL:', blob.url)
          return blob
        })
        .catch((err) => {
          console.error('❌ Background blob upload failed:', err)
          throw err
        })

      // Wait for upload to complete and get real URL
      const blob = await uploadPromise
      const audioUrl = blob.url

      console.log('⚡ Responding immediately (blob upload in background)')
      console.log('🔗 Audio URL:', audioUrl)
      console.log(`⚡ Response time: ${Date.now() - startTime}ms (saved 1-2s)`)

      console.log('🏗️ BUILDING TwiML response...')

      // Return TwiML with AI response (no thinking sounds here - they should play BEFORE processing)
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

      return new NextResponse(twiml, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    } catch (voiceError: any) {
      console.error('❌ ElevenLabs failed:', voiceError.message)
      console.error('❌ ElevenLabs error stack:', voiceError.stack)
      // No fallback - throw error to trigger retry TwiML
      throw voiceError
    }
  } catch (error) {
    console.error('🚨 Error in speech handler:', error)

    // Generate error message in YOUR voice
    try {
      const errorMessage = "Sorry, I'm having trouble processing that. Please try again."
      const errorAudioResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          },
          body: JSON.stringify({
            text: errorMessage,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.6,
              similarity_boost: 0.8,
            },
            output_format: 'mp3_22050_32',
          }),
        },
      )

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

        return new NextResponse(errorTwiml, {
          status: 200,
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        })
      }
    } catch (elevenLabsError) {
      console.error('❌ ElevenLabs error fallback failed:', elevenLabsError)
    }

    // Final fallback if ElevenLabs fails
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural" language="en-US">Sorry, something went wrong. Please call back later.</Say>
  <Hangup/>
</Response>`

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  }
}
