import { NextRequest, NextResponse } from 'next/server'
import { voiceService } from '../../../../services/voiceService'
import { phoneAudioCache, createPhoneAudioUrl } from '../../../../lib/phone-audio-cache'

// Define types for better TypeScript support
interface Contact {
  name: string
  company: string
  relationship: string
  lastContact: string
  notes: string
}

interface CallerContext {
  type: 'known_contact' | 'new_caller' | 'unknown'
  phoneNumber?: string
  name?: string
  company?: string
  relationship?: string
  lastContact?: string
  notes?: string
  classification?: string
  location?: string
  carrier?: string
}

// Twilio security validation
function validateTwilioSignature(
  twilioSignature: string,
  url: string,
  params: any,
  authToken: string,
): boolean {
  // In production, implement proper Twilio signature validation
  // For now, we'll do basic auth token check
  return authToken === process.env.TWILIO_AUTH_TOKEN
}

// Main Twilio webhook handler
export async function POST(request: NextRequest) {
  try {
    const twilioSignature = request.headers.get('x-twilio-signature') || ''

    // Parse Twilio webhook data
    const formData = await request.formData()
    const webhookData = Object.fromEntries(formData.entries())

    console.log('📞 Twilio webhook received:', {
      CallSid: webhookData.CallSid,
      From: webhookData.From,
      To: webhookData.To,
      CallStatus: webhookData.CallStatus,
    })

    // Validate request is from Twilio
    const isValidRequest = validateTwilioSignature(
      twilioSignature,
      request.url,
      webhookData,
      process.env.TWILIO_AUTH_TOKEN || '',
    )

    if (!isValidRequest && process.env.NODE_ENV === 'production') {
      console.error('❌ Invalid Twilio signature')
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Handle different call events
    const callStatus = webhookData.CallStatus as string
    const callSid = webhookData.CallSid as string
    const fromNumber = webhookData.From as string
    const toNumber = webhookData.To as string

    switch (callStatus) {
      case 'ringing':
        return handleIncomingCall(callSid, fromNumber, toNumber)

      case 'in-progress':
        return handleCallInProgress(callSid, fromNumber)

      case 'completed':
        return handleCallCompleted(callSid, fromNumber)

      default:
        console.log(`📞 Call status: ${callStatus}`)
        return new NextResponse('OK', { status: 200 })
    }
  } catch (error) {
    console.error('❌ Twilio webhook error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Handle incoming call - initial greeting and setup
async function handleIncomingCall(callSid: string, fromNumber: string, toNumber: string) {
  console.log(`📞 Incoming call from ${fromNumber} to ${toNumber}`)

  // Create professional greeting with caller context
  const callerContext = await getCallerContext(fromNumber)
  let twiml: string

  try {
    const greeting = generateProfessionalGreeting(callerContext)

    console.log('🎤 Generating custom voice greeting...')
    console.log('📝 Greeting:', greeting)

    // Generate custom voice greeting - Direct ElevenLabs call for speed
    const elevenlabsResponse = (await Promise.race([
      fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        },
        body: JSON.stringify({
          text: greeting,
          model_id: 'eleven_turbo_v2_5', // Fastest model
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('ElevenLabs timeout')), 5000)),
    ])) as Response

    if (!elevenlabsResponse.ok) {
      throw new Error(`ElevenLabs failed: ${elevenlabsResponse.status}`)
    }

    const audioBuffer = await elevenlabsResponse.arrayBuffer()

    if (audioBuffer && audioBuffer.byteLength > 0) {
      // Create audio endpoint
      const audioId = `greeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const mp3Buffer = Buffer.from(audioBuffer)

      phoneAudioCache.set(audioId, {
        buffer: mp3Buffer,
        contentType: 'audio/mpeg',
        text: greeting.substring(0, 100),
        timestamp: Date.now(),
        expires: Date.now() + 10 * 60 * 1000, // 10 minutes for greeting
      })

      const audioUrl = createPhoneAudioUrl(audioId)

      console.log('✅ Custom voice greeting generated')
      console.log(`🎵 Greeting audio URL: ${audioUrl}`)

      // TwiML with custom voice greeting
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Pause length="1"/>
  <Record 
    action="/api/phone/handle-recording"
    method="POST"
    timeout="10"
    finishOnKey="#"
    transcribe="true"
    transcribeCallback="/api/phone/handle-transcription"
    maxLength="120"
    playBeep="false"
  />
</Response>`
    } else {
      throw new Error('Empty audio buffer')
    }
  } catch (error: any) {
    console.warn('⚠️ Custom voice greeting failed, using Twilio voice:', error.message)

    // Fallback to Twilio voice
    const greeting = generateProfessionalGreeting(callerContext)

    // Create TwiML response for professional greeting with enhanced Twilio voice
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US" rate="medium" pitch="medium">${greeting}</Say>
  <Record 
    action="/api/phone/handle-recording"
    method="POST"
    timeout="10"
    finishOnKey="#"
    transcribe="true"
    transcribeCallback="/api/phone/handle-transcription"
    maxLength="120"
    playBeep="false"
  />
</Response>`
  }

  // Store call session for tracking
  await storeCallSession(callSid, fromNumber, {
    status: 'greeting',
    startTime: new Date().toISOString(),
    callerContext,
  })

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  })
}

// Handle call in progress
async function handleCallInProgress(callSid: string, fromNumber: string) {
  console.log(`📞 Call in progress: ${callSid}`)

  // Update call status
  await updateCallSession(callSid, { status: 'in-progress' })

  return new NextResponse('OK', { status: 200 })
}

// Handle call completion
async function handleCallCompleted(callSid: string, fromNumber: string) {
  console.log(`📞 Call completed: ${callSid}`)

  // Finalize call session
  await finalizeCallSession(callSid)

  // Trigger follow-up actions
  await triggerCallFollowUp(callSid, fromNumber)

  return new NextResponse('OK', { status: 200 })
}

// Get caller context from CRM or create new contact
async function getCallerContext(phoneNumber: string): Promise<CallerContext> {
  try {
    // Check if this is a known contact
    const contact = await lookupContact(phoneNumber)

    if (contact) {
      return {
        type: 'known_contact',
        name: contact.name,
        company: contact.company,
        relationship: contact.relationship,
        lastContact: contact.lastContact,
        notes: contact.notes,
      }
    }

    // For new callers, try to identify if it's a recruiter or business call
    const classification = await classifyPhoneNumber(phoneNumber)

    return {
      type: 'new_caller',
      phoneNumber,
      classification: classification.type, // 'business', 'mobile', 'unknown'
      location: classification.location,
      carrier: classification.carrier,
    }
  } catch (error) {
    console.error('Error getting caller context:', error)
    return {
      type: 'unknown',
      phoneNumber,
    }
  }
}

// Generate personalized professional greeting
function generateProfessionalGreeting(callerContext: CallerContext): string {
  const baseGreeting =
    "Hello! I'm Sajal Basnet, a software developer with a Masters from Swinburne University. How can I help you today?"

  if (callerContext.type === 'known_contact' && callerContext.name) {
    return `Hello ${callerContext.name}! This is Sajal Basnet. Great to hear from you. What can I help you with?`
  }

  if (callerContext.classification === 'business') {
    return 'Hello! This is Sajal Basnet, software developer with a Masters from Swinburne. What would you like to know?'
  }

  return baseGreeting
}

// Store call session data (using Vercel KV or similar)
async function storeCallSession(callSid: string, fromNumber: string, sessionData: any) {
  // Implementation would store in Vercel KV or database
  console.log(`💾 Storing call session: ${callSid}`, sessionData)

  // For now, just log - in production, store in persistent storage
  return Promise.resolve()
}

// Update call session data
async function updateCallSession(callSid: string, updates: any) {
  console.log(`📝 Updating call session: ${callSid}`, updates)
  return Promise.resolve()
}

// Finalize call session
async function finalizeCallSession(callSid: string) {
  console.log(`✅ Finalizing call session: ${callSid}`)

  // In production:
  // - Store final call data
  // - Generate call summary
  // - Update relationship CRM
  // - Schedule follow-up if needed

  return Promise.resolve()
}

// Lookup contact in CRM
async function lookupContact(phoneNumber: string): Promise<Contact | null> {
  // In production, query your CRM/contact database
  console.log(`🔍 Looking up contact: ${phoneNumber}`)
  return null // No existing contact found
}

// Classify phone number (business vs personal, etc.)
async function classifyPhoneNumber(phoneNumber: string) {
  // In production, use a phone number lookup service
  console.log(`🔍 Classifying phone number: ${phoneNumber}`)

  return {
    type: 'unknown',
    location: 'Unknown',
    carrier: 'Unknown',
  }
}

// Trigger follow-up actions after call
async function triggerCallFollowUp(callSid: string, fromNumber: string) {
  console.log(`📬 Triggering follow-up for call: ${callSid}`)

  // In production:
  // - Send thank you email
  // - Schedule calendar follow-up
  // - Update LinkedIn if applicable
  // - Generate call summary

  return Promise.resolve()
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
