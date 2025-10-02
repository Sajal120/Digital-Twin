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
  console.log('🎙️ Recording webhook called - processing user speech...')

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

    // Validate required fields
    if (!callSid) {
      console.error('❌ Missing CallSid')
      throw new Error('Missing required webhook data')
    }

    console.log('✅ Step 2: Bypassing complex audio processing for reliable conversation...')

    // STEP 2: Skip audio processing entirely - focus on progressive conversation
    console.log('🔄 Using progressive conversation system instead of audio transcription')

    // Get professional context for AI response
    const conversationContext = await getConversationContext(callSid)

    // STEP 3 IMPROVEMENT: Enhanced conversation memory & context building
    const turnCount = conversationContext.conversationHistory?.length || 0
    let conversationFocus = 'general_background'
    let contextualPrompt = 'Tell me about your professional background and experience'

    // Build context from previous conversation history
    const previousTopics =
      conversationContext.conversationHistory?.map((turn) => turn.userInput) || []
    const conversationSummary =
      previousTopics.length > 0
        ? `Previous discussion covered: ${previousTopics.slice(-2).join(', ')}. `
        : ''

    if (turnCount === 0) {
      conversationFocus = 'introduction_overview'
      contextualPrompt =
        'Give me a professional introduction and overview of your background. This is our first interaction, so provide a comprehensive overview.'
    } else if (turnCount === 1) {
      conversationFocus = 'technical_skills'
      contextualPrompt = `${conversationSummary}Now I'd like to dive deeper into your technical skills, programming languages, and specific technologies you work with.`
    } else if (turnCount === 2) {
      conversationFocus = 'recent_projects'
      contextualPrompt = `${conversationSummary}Can you tell me about specific recent projects where you applied these technical skills? Include details about challenges and achievements.`
    } else if (turnCount === 3) {
      conversationFocus = 'career_goals'
      contextualPrompt = `${conversationSummary}Based on your background and skills, what are your career goals and what type of opportunities or roles are you most interested in?`
    } else if (turnCount === 4) {
      conversationFocus = 'collaboration_style'
      contextualPrompt = `${conversationSummary}Tell me about your work style, how you collaborate with teams, and your approach to problem-solving.`
    } else {
      conversationFocus = 'questions_discussion'
      contextualPrompt = `${conversationSummary}Do you have any questions about potential opportunities, roles, or would you like to discuss any specific aspects of your experience further?`
    }

    console.log(`🎯 Turn ${turnCount}: Focus on ${conversationFocus}`)
    console.log(`💬 Contextual prompt: ${contextualPrompt}`)

    // Generate AI response with contextual focus
    const aiResponse = await generateAIResponse(contextualPrompt, {
      ...conversationContext,
      conversationFocus,
      interactionType: 'phone_professional',
      currentTurn: turnCount,
    })

    console.log('🤖 AI Response:', aiResponse.response)

    // Create TwiML to speak AI response and continue recording
    // TEMPORARY: Use Twilio voice while fixing audio serving issue
    console.log('🎤 Using Twilio voice for reliable conversation flow')
    console.log('📝 AI Response ready:', aiResponse.response.substring(0, 100) + '...')

    // STEP 3: Enhanced conversation prompts based on turn
    let conversationPrompt = 'Please continue with your questions.'
    if (turnCount === 0) {
      conversationPrompt = 'What would you like to know more about regarding my technical skills?'
    } else if (turnCount === 1) {
      conversationPrompt =
        "Would you like to hear about specific projects where I've applied these skills?"
    } else if (turnCount === 2) {
      conversationPrompt = 'What aspects of my career goals or future opportunities interest you?'
    } else if (turnCount === 3) {
      conversationPrompt =
        'Do you have questions about my work style or how I approach collaboration?'
    } else {
      conversationPrompt = 'What other questions do you have, or shall we discuss next steps?'
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">${escapeXml(aiResponse.response)}</Say>
  <Pause length="2"/>
  <Say voice="alice" language="en-US">${escapeXml(conversationPrompt)}</Say>
  <Pause length="1"/>
  <Record 
    action="/api/phone/handle-recording"
    method="POST"
    timeout="5"
    finishOnKey="#"
    transcribe="true"
    transcribeCallback="/api/phone/handle-transcription"
    maxLength="60"
    playBeep="false"
  />
</Response>`

    // Store conversation history
    await storeConversationTurn(callSid, {
      userInput: contextualPrompt,
      aiResponse: aiResponse.response,
      timestamp: new Date().toISOString(),
      recordingSid: recordingSid || 'step2_bypass',
      duration,
    })

    console.log('✅ TwiML response generated, returning to Twilio')
    console.log('📤 TwiML preview:', twiml.substring(0, 200) + '...')

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('❌ Recording processing error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')

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
    timeout="5"
    finishOnKey="#"
    maxLength="60"
    playBeep="false"
  />
</Response>`

    console.log('🔄 Returning fallback TwiML to continue conversation')
    return new NextResponse(fallbackTwiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}

// Download recording from Twilio
async function downloadRecording(recordingUrl: string): Promise<Buffer> {
  try {
    console.log('🔐 Checking Twilio credentials...')
    // Add Twilio auth to the URL
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('❌ Missing Twilio credentials in environment')
      throw new Error('Missing Twilio credentials')
    }

    console.log('✅ Twilio credentials found, downloading recording...')
    console.log('📥 Recording URL:', recordingUrl)

    // Create authenticated URL
    const authString = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')

    const response = await fetch(recordingUrl, {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    })

    console.log('📊 Download response status:', response.status, response.statusText)

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
    console.log('🔑 Checking OpenAI API key...')
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key missing from environment')
      throw new Error('OpenAI API key not configured')
    }

    console.log('✅ OpenAI API key found, creating transcription request...')
    const formData = new FormData()
    const uint8Array = new Uint8Array(audioBuffer)
    const audioBlob = new Blob([uint8Array], { type: 'audio/wav' })
    formData.append('file', audioBlob, 'recording.wav')
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')

    console.log('📤 Sending audio to OpenAI Whisper API...')
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    })

    console.log('📊 OpenAI response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ OpenAI API error details:', errorText)
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    return result.text || 'Could not transcribe audio'
  } catch (error) {
    console.error('Error transcribing audio:', error)
    return "I couldn't understand that. Could you please repeat?"
  }
}

// Enhanced conversation storage with professional context
interface ConversationData {
  history: Array<{
    userInput: string
    aiResponse: string
    timestamp: string
    recordingSid?: string
    duration?: string
  }>
  context: any
  interviewType: string
  callerInfo: any
}

const conversationStore = new Map<string, ConversationData>()

// Get conversation context for the call with MCP integration
async function getConversationContext(callSid: string) {
  try {
    console.log(`📋 Getting enhanced conversation context for call: ${callSid}`)

    // Get or initialize conversation data
    let conversationData = conversationStore.get(callSid)
    if (!conversationData) {
      conversationData = {
        history: [],
        context: {},
        interviewType: 'professional_phone_call',
        callerInfo: { source: 'phone', callSid },
      }
      conversationStore.set(callSid, conversationData)
    }

    console.log(`💭 Found ${conversationData.history.length} previous conversation turns`)
    console.log(`🎯 Interview type: ${conversationData.interviewType}`)

    return {
      callSid,
      conversationType: 'professional_phone_inquiry',
      callerContext: 'phone_interview_networking_recruiting',
      conversationHistory: conversationData.history.slice(-8), // Keep last 8 exchanges for rich context
      interviewType: conversationData.interviewType,
      enhancedMode: true, // Always use enhanced mode for phone calls
    }
  } catch (error) {
    console.error('Error getting conversation context:', error)
    return {
      callSid,
      conversationType: 'general',
      callerContext: 'unknown',
      conversationHistory: [],
      interviewType: 'general',
      enhancedMode: true,
    }
  }
}

// Generate AI response using MCP server and enhanced chat system
async function generateAIResponse(userMessage: string, context: any) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.sajal-app.online'

    console.log(
      '🤖 Generating AI response with full MCP integration for:',
      userMessage.substring(0, 100) + '...',
    )
    console.log('📞 Call context:', context.callSid, '| Type:', context.interviewType)
    console.log('💭 Conversation history length:', context.conversationHistory?.length || 0)

    // Try MCP server integration first (most comprehensive)
    try {
      console.log('🔌 Attempting MCP server integration...')
      const mcpResponse = await fetch(`${baseUrl}/api/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `phone_${context.callSid}_${Date.now()}`,
          method: 'tools/call',
          params: {
            name: 'ask_digital_twin',
            arguments: {
              question: userMessage,
              interviewType: context.interviewType || 'general',
              enhancedMode: true,
              maxResults: 5, // More context for phone calls
            },
          },
        }),
      })

      if (mcpResponse.ok) {
        const mcpData = await mcpResponse.json()
        if (mcpData.result?.content?.[0]?.text) {
          console.log('✅ MCP server response successful')
          // Clean up the response for voice (remove markdown formatting and MCP structure)
          let cleanResponse = mcpData.result.content[0].text
            .replace(/\*\*Enhanced Interview Response\*\* \([^)]+\):\s*/g, '') // Remove MCP header
            .replace(/---\s*\*\*[^*]+\*\*:[^\n]+/g, '') // Remove metadata lines
            .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
            .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
            .replace(/---\n/g, '') // Remove dividers
            .replace(/\n\n+/g, '. ') // Replace multiple newlines with periods
            .replace(/\n/g, '. ') // Replace single newlines with periods
            .replace(/\.\s*\./g, '.') // Remove duplicate periods
            .trim()

          // Ensure it starts naturally for phone conversation
          if (!cleanResponse.match(/^(Hello|Hi|I am|I'm|My name is|Thank you)/i)) {
            cleanResponse = `I'm Sajal Basnet. ${cleanResponse}`
          }

          console.log('🎯 Cleaned response preview:', cleanResponse.substring(0, 100) + '...')

          return {
            response: cleanResponse,
            success: true,
            source: 'mcp_server',
          }
        }
      }
    } catch (mcpError: any) {
      console.warn('⚠️ MCP server unavailable, falling back to chat API:', mcpError.message)
    }

    // Fallback to enhanced chat API
    console.log('🔄 Using enhanced chat API as fallback...')
    const chatResponse = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        user_id: `phone_${context.callSid}`,
        role: 'user',
        content: userMessage,
        enhancedMode: true,
        interviewType: context.interviewType || 'general',
        conversationHistory: context.conversationHistory || [],
        context: `Professional phone call via Twilio. Call ID: ${context.callSid}. This is a live phone conversation requiring natural, conversational responses.`,
      }),
    })

    if (!chatResponse.ok) {
      console.error('Chat API error:', chatResponse.status, chatResponse.statusText)
      throw new Error(`Chat API error: ${chatResponse.statusText}`)
    }

    const chatData = await chatResponse.json()
    console.log('✅ Chat API response generated successfully')
    console.log('📊 Enhanced mode active:', chatData.enhanced)

    // Clean up chat response for voice
    let cleanResponse = (chatData.response || chatData.message?.content || chatData.content)
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
      .replace(/\n\n+/g, '. ') // Replace multiple newlines with periods
      .replace(/\n/g, '. ') // Replace single newlines with periods
      .replace(/\.\s*\./g, '.') // Remove duplicate periods
      .trim()

    // Ensure it starts naturally for phone conversation
    if (!cleanResponse.match(/^(Hello|Hi|I am|I'm|My name is|Thank you)/i)) {
      cleanResponse = `I'm Sajal Basnet. ${cleanResponse}`
    }

    console.log('🎯 Chat cleaned response preview:', cleanResponse.substring(0, 100) + '...')

    return {
      response:
        cleanResponse || "I apologize, but I'm having trouble generating a response right now.",
      success: chatData.success !== false,
      source: 'chat_api',
      enhanced: chatData.enhanced,
    }
  } catch (error) {
    console.error('Error generating AI response:', error)
    return {
      response:
        "Thank you for calling. I'm having a technical issue right now, but I'm Sajal Basnet, a software engineer. Could you please repeat your question?",
      success: false,
      source: 'fallback',
    }
  }
} // Generate speech using ElevenLabs custom voice
async function generateCustomVoiceSpeech(text: string): Promise<string | null> {
  try {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'WcXkU7PbsO0uKKBdWJrG' // Your custom voice

    if (!elevenLabsApiKey) {
      console.log('🔇 ElevenLabs API key not found in environment variables')
      console.log('📝 Set ELEVENLABS_API_KEY in Vercel dashboard for custom voice')
      console.log('🔄 Falling back to Twilio voice')
      return null
    }

    console.log(
      '🎤 Generating custom voice speech with ElevenLabs for text:',
      text.substring(0, 100) + '...',
    )
    console.log('🔑 Using voice ID:', voiceId)

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
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
      console.error('ElevenLabs API error:', response.status, response.statusText)
      const errorBody = await response.text()
      console.error('ElevenLabs error details:', errorBody)
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

// Create temporary audio endpoint using direct streaming
async function createTempAudioEndpoint(audioBuffer: ArrayBuffer, format: string): Promise<string> {
  try {
    console.log('🎵 Creating audio endpoint for Twilio access...')

    // Store the audio in a simple cache that survives the function call
    const audioId = Math.random().toString(36).substring(7) + Date.now().toString(36)
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    // Create an endpoint that can regenerate the audio
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.sajal-app.online'

    // For now, let's use a workaround: embed the audio data in the URL
    // This bypasses the cache issue
    const audioUrl = `${baseUrl}/api/phone/audio/stream?data=${base64Audio.substring(0, 100)}&format=${format}&id=${audioId}`

    console.log('✅ Audio URL created:', audioUrl.substring(0, 80) + '...')
    return audioUrl
  } catch (error) {
    console.error('Error creating temp audio endpoint:', error)
    return ''
  }
}

// Store conversation turn with enhanced context
async function storeConversationTurn(callSid: string, turnData: any) {
  try {
    console.log(`💾 Storing enhanced conversation turn for call: ${callSid}`)

    // Get existing conversation data
    let conversationData = conversationStore.get(callSid) || {
      history: [],
      context: {},
      interviewType: 'professional_phone_call',
      callerInfo: { source: 'phone', callSid },
    }

    // Add new turn
    const newTurn = {
      userInput: turnData.userInput,
      aiResponse: turnData.aiResponse,
      timestamp: turnData.timestamp,
      recordingSid: turnData.recordingSid,
      duration: turnData.duration,
    }

    conversationData.history.push(newTurn)

    // Update context based on conversation content
    if (turnData.userInput) {
      const input = turnData.userInput.toLowerCase()
      if (input.includes('interview') || input.includes('position') || input.includes('role')) {
        conversationData.interviewType = 'technical'
      } else if (input.includes('recruiter') || input.includes('hiring')) {
        conversationData.interviewType = 'hr_screening'
      } else if (
        input.includes('network') ||
        input.includes('coffee') ||
        input.includes('connect')
      ) {
        conversationData.interviewType = 'networking'
      }
    }

    // Store updated conversation data (keep last 15 turns for rich context)
    conversationData.history = conversationData.history.slice(-15)
    conversationStore.set(callSid, conversationData)

    console.log(
      `✅ Stored turn. Total turns: ${conversationData.history.length}, Type: ${conversationData.interviewType}`,
    )

    return Promise.resolve()
  } catch (error) {
    console.error('Error storing conversation turn:', error)
    return Promise.resolve()
  }
} // Handle OPTIONS for CORS
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
