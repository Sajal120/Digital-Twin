import { NextRequest, NextResponse } from 'next/server'
import { omniChannelManager } from '../../../../lib/omni-channel-manager'
import { voiceService } from '../../../../services/voiceService'
import { phoneAudioCache, createPhoneAudioUrl } from '../../../../lib/phone-audio-cache'

// Handle Twilio speech recognition results (NO recording download needed!)
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🎙️ Speech webhook called - processing transcribed speech...')

  try {
    // Parse Twilio form data
    const formData = await request.formData()
    const webhookData = Object.fromEntries(formData.entries())

    const callSid = webhookData.CallSid as string
    const speechResult = webhookData.SpeechResult as string
    const confidence = webhookData.Confidence as string

    console.log('🎤 Speech transcription received:', {
      callSid,
      speechResult: speechResult || '(no speech)',
      confidence: confidence || 'N/A',
      speechResultLength: speechResult?.length || 0,
      fullWebhookData: webhookData, // Log everything to debug
    })

    // Validate required fields
    if (!callSid) {
      console.error('❌ Missing CallSid')
      throw new Error('Missing required webhook data')
    }

    // Check if we got speech
    if (!speechResult || speechResult.trim().length === 0) {
      console.log('❌ No speech detected, asking user to repeat')
      const noSpeechTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Matthew-Neural" language="en-US">
    I didn't catch that. Could you please repeat your question?
  </Say>
  <Gather 
    input="speech"
    action="/api/phone/handle-speech"
    method="POST"
    timeout="10"
    speechTimeout="5"
    language="en-US"
    speechModel="phone_call"
    profanityFilter="false"
    hints="kya, kaam, karte, ho, aap, tum, tumhara, timro, naam, name, kun, ke, kahan, kaun, padhe, padhai, university, college, work, job, batao, batana, malai, mera, meri, hai, cha, xa, kaisa, kese, kaise, where, what, tell, about, study, university, swinburne, work, experience, sydney, australia"
  >
    <Pause length="1"/>
  </Gather>
  <Redirect>/api/phone/handle-speech</Redirect>
</Response>`
      return new NextResponse(noSpeechTwiml, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }

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

    // Generate AI response using MCP
    console.log('🤖 Generating AI response with MCP...')
    console.log(`📝 User said: "${speechResult}"`)

    let aiResponse: any

    try {
      const unifiedResponse = await omniChannelManager.generateUnifiedResponse(
        callSid,
        speechResult,
        {
          currentTurn: unifiedContext.conversationHistory.length,
          phoneCall: true,
          ultraBrief: true,
        },
      )

      console.log('✅ MCP response generated!')
      console.log(`📊 Source: ${unifiedResponse.source}`)

      // Store conversation turn
      await omniChannelManager.addConversationTurn(
        callSid,
        speechResult,
        unifiedResponse.response,
        {
          audioProcessed: true,
          confidence: parseFloat(confidence) || 0.9,
          channelType: 'phone',
          turnNumber: unifiedContext.conversationHistory.length,
        },
      )

      aiResponse = {
        response: unifiedResponse.response,
        success: true,
        source: unifiedResponse.source,
      }
    } catch (error: any) {
      console.error('❌ MCP failed:', error.message)
      const retryTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural" language="en-US">
    Sorry, could you repeat that?
  </Say>
  <Gather 
    input="speech"
    action="/api/phone/handle-speech"
    method="POST"
    timeout="5"
    speechTimeout="auto"
    language="en-US"
  >
    <Pause length="1"/>
  </Gather>
  <Redirect>/api/phone/handle-speech</Redirect>
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

    // Generate ElevenLabs audio
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000) // 2s timeout

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
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.65,
              similarity_boost: 0.85,
              style: 0.3,
              use_speaker_boost: true,
            },
            output_format: 'mp3_44100_128',
          }),
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

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

      console.log('📁 Caching audio:', {
        audioId,
        bufferSize: audioBufferObj.length,
        textPreview: aiResponse.response.substring(0, 50),
      })

      phoneAudioCache.set(audioId, {
        buffer: audioBufferObj,
        contentType: 'audio/mpeg',
        text: aiResponse.response.substring(0, 100),
        timestamp: Date.now(),
        expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      })

      // Verify it was cached
      const cached = phoneAudioCache.get(audioId)
      if (!cached) {
        console.error('❌ Failed to cache audio!')
        throw new Error('Audio caching failed')
      }

      console.log('✅ Audio cached successfully:', audioId)
      console.log('📊 Audio size:', audioBufferObj.length, 'bytes')

      const audioUrl = createPhoneAudioUrl(audioId)
      console.log('✅ YOUR voice audio ready!')
      console.log('🔗 Audio URL:', audioUrl)

      const duration = Date.now() - startTime
      console.log(`✅ Total time: ${duration}ms`)

      // Return TwiML with audio and gather next input
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather 
    input="speech"
    action="/api/phone/handle-speech"
    method="POST"
    timeout="10"
    speechTimeout="5"
    language="en-US"
    speechModel="phone_call"
    profanityFilter="false"
    hints="kya, kaam, karte, ho, aap, tum, tumhara, timro, naam, name, kun, ke, kahan, kaun, padhe, padhai, university, college, work, job, batao, batana, malai, mera, meri, hai, cha, xa, kaisa, kese, kaise, where, what, tell, about, study, university, swinburne, work, experience, sydney, australia"
  >
    <Pause length="1"/>
  </Gather>
  <Say voice="Polly.Matthew-Neural" language="en-US">
    Thank you for calling. Goodbye!
  </Say>
</Response>`

      return new NextResponse(twiml, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    } catch (voiceError: any) {
      console.warn('⚠️ ElevenLabs failed, using Twilio voice:', voiceError.message)

      // Fallback to Twilio voice
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Matthew-Neural" language="en-US">${aiResponse.response}</Say>
  <Gather 
    input="speech"
    action="/api/phone/handle-speech"
    method="POST"
    timeout="10"
    speechTimeout="5"
    language="en-US"
    speechModel="phone_call"
    profanityFilter="false"
    hints="kya, kaam, karte, ho, aap, tum, tumhara, timro, naam, name, kun, ke, kahan, kaun, padhe, padhai, university, college, work, job, batao, batana, malai, mera, meri, hai, cha, xa, kaisa, kese, kaise, where, what, tell, about, study, university, swinburne, work, experience, sydney, australia"
  >
    <Pause length="1"/>
  </Gather>
  <Say voice="Polly.Matthew-Neural" language="en-US">
    Thank you for calling. Goodbye!
  </Say>
  <Hangup/>
</Response>`

      return new NextResponse(twiml, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }
  } catch (error) {
    console.error('🚨 Error in speech handler:', error)

    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural" language="en-US">
    Sorry, something went wrong. Please try again later.
  </Say>
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
