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
    // Use Say verb for reliable text-to-speech instead of serving audio files
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
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
