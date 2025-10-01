import { NextRequest, NextResponse } from 'next/server'

// Escape XML special characters for TwiML
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Handle recorded audio from Twilio and process with AI
export async function POST(request: NextRequest) {
  try {
    // Parse Twilio form data
    const formData = await request.formData()
    const webhookData = Object.fromEntries(formData.entries())

    const callSid = webhookData.CallSid as string
    const recordingUrl = webhookData.RecordingUrl as string
    const recordingSid = webhookData.RecordingSid as string
    const duration = webhookData.RecordingDuration as string

    console.log('🎵 Recording received:', {
      callSid,
      recordingSid,
      duration: `${duration}s`,
      recordingUrl,
    })

    // Download and process the audio
    const audioBuffer = await downloadRecording(recordingUrl)

    // Convert audio to text using OpenAI Whisper
    const transcription = await transcribeAudio(audioBuffer)

    console.log('📝 Transcription:', transcription)

    // Get professional context for AI response
    const conversationContext = await getConversationContext(callSid)

    // Generate AI response using existing voice conversation API
    const aiResponse = await generateAIResponse(transcription, conversationContext)

    console.log('🤖 AI Response:', aiResponse.response)

    // Create TwiML to speak AI response and continue recording
    // Use your custom ElevenLabs voice for professional phone responses
    const speechUrl = await generateCustomVoiceSpeech(aiResponse.response)
    
    const twiml = speechUrl 
      ? `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${speechUrl}</Play>
  <Pause length="1"/>
  <Record 
    action="/api/phone/handle-recording"
    method="POST"
    timeout="30"
    transcribe="true"
    transcribeCallback="/api/phone/handle-transcription"
    maxLength="3600"
    playBeep="false"
  />
</Response>`
      : `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">${escapeXml(aiResponse.response)}</Say>
  <Pause length="1"/>
  <Record 
    action="/api/phone/handle-recording"
    method="POST"
    timeout="30"
    transcribe="true"
    transcribeCallback="/api/phone/handle-transcription"
    maxLength="3600"
    playBeep="false"
  />
</Response>`

    // Store conversation history
    await storeConversationTurn(callSid, {
      userInput: transcription,
      aiResponse: aiResponse.response,
      timestamp: new Date().toISOString(),
      recordingSid,
      duration,
    })

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('❌ Recording processing error:', error)

    // Return TwiML to continue recording even if processing fails
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    I apologize, but I'm having trouble processing your message. 
    Could you please repeat that?
  </Say>
  <Record 
    action="/api/phone/handle-recording"
    method="POST"
    timeout="30"
    maxLength="3600"
    playBeep="false"
  />
</Response>`

    return new NextResponse(fallbackTwiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}

// Download recording from Twilio
async function downloadRecording(recordingUrl: string): Promise<Buffer> {
  try {
    // Add Twilio auth to the URL
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN

    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error('Missing Twilio credentials')
    }

    // Create authenticated URL
    const authString = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')

    const response = await fetch(recordingUrl, {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.statusText}`)
    }

    return Buffer.from(await response.arrayBuffer())
  } catch (error) {
    console.error('Error downloading recording:', error)
    throw error
  }
}

// Transcribe audio using OpenAI Whisper
async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const formData = new FormData()
    const uint8Array = new Uint8Array(audioBuffer)
    const audioBlob = new Blob([uint8Array], { type: 'audio/wav' })
    formData.append('file', audioBlob, 'recording.wav')
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    return result.text || 'Could not transcribe audio'
  } catch (error) {
    console.error('Error transcribing audio:', error)
    return "I couldn't understand that. Could you please repeat?"
  }
}

// Get conversation context for the call
async function getConversationContext(callSid: string) {
  try {
    // In production, retrieve from stored call session data
    console.log(`📋 Getting conversation context for call: ${callSid}`)

    // For now, return basic professional context
    return {
      callSid,
      conversationType: 'professional_inquiry',
      callerContext: 'unknown',
      conversationHistory: [],
    }
  } catch (error) {
    console.error('Error getting conversation context:', error)
    return {
      callSid,
      conversationType: 'general',
      callerContext: 'unknown',
      conversationHistory: [],
    }
  }
}

// Generate AI response using existing voice conversation API
async function generateAIResponse(userMessage: string, context: any) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/voice/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        context: `Phone call via Twilio. Call ID: ${context.callSid}`,
        conversationHistory: context.conversationHistory,
        interactionType: 'phone_professional',
      }),
    })

    if (!response.ok) {
      throw new Error(`Voice API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      response:
        data.response || "I apologize, but I'm having trouble generating a response right now.",
      success: data.success,
    }
  } catch (error) {
    console.error('Error generating AI response:', error)
    return {
      response:
        "Thank you for calling. I'm having a technical issue right now. Could you please try again in a moment?",
      success: false,
    }
  }
}

// Generate speech using ElevenLabs custom voice
async function generateCustomVoiceSpeech(text: string): Promise<string | null> {
  try {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'WcXkU7PbsO0uKKBdWJrG' // Your custom voice

    if (!elevenLabsApiKey) {
      console.log('🔇 ElevenLabs API key not found, falling back to Twilio voice')
      return null
    }

    console.log('🎤 Generating custom voice speech with ElevenLabs')

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      console.error('ElevenLabs API error:', response.statusText)
      return null
    }

    // Get the audio buffer
    const audioBuffer = await response.arrayBuffer()

    // Convert to base64 for temporary hosting
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`

    // In production, you'd upload this to a CDN or cloud storage
    // For now, we'll create a temporary endpoint to serve this audio
    const tempAudioUrl = await createTempAudioEndpoint(audioBuffer, 'mpeg')

    console.log('✅ Custom voice speech generated successfully')
    return tempAudioUrl

  } catch (error) {
    console.error('Error generating custom voice speech:', error)
    return null
  }
}

// Create temporary audio endpoint (simplified for demo)
async function createTempAudioEndpoint(audioBuffer: ArrayBuffer, format: string): Promise<string> {
  try {
    // Generate unique ID for this audio
    const audioId = Math.random().toString(36).substring(7) + Date.now().toString(36)
    
    // Import the audio storage function
    const { storeAudio } = await import('../audio/[id]/route')
    
    // Store the audio with appropriate content type
    const contentType = format === 'mpeg' ? 'audio/mpeg' : 'audio/wav'
    storeAudio(audioId, audioBuffer, contentType)
    
    // Return the URL that Twilio can access
    const baseUrl = process.env.NEXTAUTH_URL || 'https://your-app.vercel.app'
    const audioUrl = `${baseUrl}/api/phone/audio/${audioId}`
    
    console.log(`🎵 Audio stored with ID: ${audioId}, URL: ${audioUrl}`)
    return audioUrl
    
  } catch (error) {
    console.error('Error creating temp audio endpoint:', error)
    return ''
  }
}

// Store conversation turn in call history
async function storeConversationTurn(callSid: string, turnData: any) {
  try {
    console.log(`💾 Storing conversation turn for call: ${callSid}`, turnData)

    // In production, store in database or Vercel KV
    // This would include:
    // - User input transcription
    // - AI response
    // - Timestamp
    // - Recording SID for reference
    // - Call analytics data

    return Promise.resolve()
  } catch (error) {
    console.error('Error storing conversation turn:', error)
    return Promise.resolve()
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
