import { NextRequest, NextResponse } from 'next/server'

// Handle transcription callbacks from Twilio
export async function POST(request: NextRequest) {
  try {
    // Parse Twilio form data
    const formData = await request.formData()
    const webhookData = Object.fromEntries(formData.entries())

    const callSid = webhookData.CallSid as string
    const transcriptionSid = webhookData.TranscriptionSid as string
    const transcriptionText = webhookData.TranscriptionText as string
    const transcriptionStatus = webhookData.TranscriptionStatus as string
    const recordingSid = webhookData.RecordingSid as string

    console.log('📝 Transcription received:', {
      callSid,
      transcriptionSid,
      transcriptionStatus,
      textLength: transcriptionText?.length || 0,
    })

    // Only process completed transcriptions
    if (transcriptionStatus === 'completed' && transcriptionText) {
      // Store transcription for analysis
      await storeTranscription(callSid, {
        transcriptionSid,
        recordingSid,
        text: transcriptionText,
        timestamp: new Date().toISOString(),
        status: transcriptionStatus,
      })

      // Perform post-call analysis
      await analyzeConversation(callSid, transcriptionText)

      console.log('✅ Transcription processed successfully')
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('❌ Transcription processing error:', error)
    return new NextResponse('Error processing transcription', { status: 500 })
  }
}

// Store transcription data
async function storeTranscription(callSid: string, transcriptionData: any) {
  try {
    console.log(`💾 Storing transcription for call: ${callSid}`)

    // In production, store in database
    // This would include:
    // - Full conversation transcription
    // - Conversation analysis
    // - Key topics and insights
    // - Follow-up actions needed

    return Promise.resolve()
  } catch (error) {
    console.error('Error storing transcription:', error)
    return Promise.resolve()
  }
}

// Analyze conversation for insights and follow-up actions
async function analyzeConversation(callSid: string, transcriptionText: string) {
  try {
    console.log(`🔍 Analyzing conversation for call: ${callSid}`)

    // Use OpenAI to analyze the conversation
    const analysis = await performConversationAnalysis(transcriptionText)

    // Store analysis results
    await storeConversationAnalysis(callSid, analysis)

    // Trigger follow-up actions if needed
    if (analysis.followUpRequired) {
      await triggerFollowUpActions(callSid, analysis)
    }
  } catch (error) {
    console.error('Error analyzing conversation:', error)
  }
}

// Perform AI-powered conversation analysis
async function performConversationAnalysis(transcriptionText: string) {
  try {
    const analysisPrompt = `
Analyze this professional phone conversation and provide insights:

Conversation Transcript:
"${transcriptionText}"

Please provide a JSON analysis with:
1. conversation_type: (recruiter_call, networking, consultation, sales, other)
2. key_topics: [array of main topics discussed]
3. caller_intent: brief description of what the caller wanted
4. follow_up_required: boolean
5. follow_up_actions: [array of recommended next steps]
6. urgency: (high, medium, low)
7. conversation_sentiment: (positive, neutral, negative)
8. key_information: {any important details like company names, positions, dates}

Return only valid JSON.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a professional conversation analyst. Respond only with valid JSON.',
          },
          { role: 'user', content: transcriptionText },
        ],
        temperature: 0.5, // Lower for more consistent phone responses
        max_tokens: 30, // Ultra-short for real-time phone calls
        top_p: 0.9, // More focused responses
        presence_penalty: 0.1, // Slight variety encouragement
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    const analysisText = result.choices[0]?.message?.content

    try {
      return JSON.parse(analysisText)
    } catch (parseError) {
      console.error('Error parsing analysis JSON:', parseError)
      return {
        conversation_type: 'other',
        key_topics: ['general_inquiry'],
        caller_intent: 'Professional inquiry',
        follow_up_required: false,
        follow_up_actions: [],
        urgency: 'low',
        conversation_sentiment: 'neutral',
        key_information: {},
      }
    }
  } catch (error) {
    console.error('Error performing conversation analysis:', error)
    return {
      conversation_type: 'other',
      key_topics: ['analysis_failed'],
      caller_intent: 'Unable to analyze',
      follow_up_required: false,
      follow_up_actions: [],
      urgency: 'low',
      conversation_sentiment: 'neutral',
      key_information: {},
    }
  }
}

// Store conversation analysis
async function storeConversationAnalysis(callSid: string, analysis: any) {
  try {
    console.log(`📊 Storing analysis for call: ${callSid}`, analysis)

    // In production, store analysis in database
    // This would be used for:
    // - CRM updates
    // - Follow-up automation
    // - Conversation insights
    // - Performance analytics

    return Promise.resolve()
  } catch (error) {
    console.error('Error storing conversation analysis:', error)
    return Promise.resolve()
  }
}

// Trigger follow-up actions based on conversation analysis
async function triggerFollowUpActions(callSid: string, analysis: any) {
  try {
    console.log(`📬 Triggering follow-up actions for call: ${callSid}`)

    // Based on conversation type and analysis, trigger appropriate actions
    for (const action of analysis.follow_up_actions) {
      switch (action) {
        case 'send_thank_you_email':
          await scheduleThankYouEmail(callSid, analysis)
          break

        case 'schedule_meeting':
          await createMeetingInvite(callSid, analysis)
          break

        case 'send_portfolio_link':
          await sendPortfolioInformation(callSid, analysis)
          break

        case 'linkedin_connection':
          await suggestLinkedInConnection(callSid, analysis)
          break

        default:
          console.log(`📝 Manual follow-up required: ${action}`)
      }
    }
  } catch (error) {
    console.error('Error triggering follow-up actions:', error)
  }
}

// Schedule thank you email
async function scheduleThankYouEmail(callSid: string, analysis: any) {
  console.log(`📧 Scheduling thank you email for call: ${callSid}`)
  // In production, integrate with email service
}

// Create meeting invite
async function createMeetingInvite(callSid: string, analysis: any) {
  console.log(`📅 Creating meeting invite for call: ${callSid}`)
  // In production, integrate with calendar service
}

// Send portfolio information
async function sendPortfolioInformation(callSid: string, analysis: any) {
  console.log(`💼 Sending portfolio information for call: ${callSid}`)
  // In production, send personalized portfolio links
}

// Suggest LinkedIn connection
async function suggestLinkedInConnection(callSid: string, analysis: any) {
  console.log(`🔗 Suggesting LinkedIn connection for call: ${callSid}`)
  // In production, create LinkedIn connection suggestion
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
