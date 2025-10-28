import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize client lazily to avoid build-time errors
let openai: OpenAI | null = null

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAIClient()
    if (!openai) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const { message, context, conversationHistory, interactionType } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get professional context from your existing MCP chat endpoint
    const professionalContext = await getProfessionalContext(message, interactionType)

    // Create specialized system prompt based on interaction type
    const systemPrompt = createSystemPrompt(interactionType, professionalContext, context)

    // Prepare conversation messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message },
    ]

    // Get AI response optimized for real-time voice interaction
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // Faster response for real-time
      messages: messages,
      temperature: 0.6, // Slightly lower for more consistent voice responses
      max_tokens: 400, // Shorter for quicker voice delivery
      presence_penalty: 0.2, // Encourage varied vocabulary
      frequency_penalty: 0.1,
      stream: false, // Keep non-streaming for voice chat reliability
      top_p: 0.9, // Focused responses for voice interaction
    })

    const aiResponse = response.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    // Note: Audio generation is handled by the frontend to avoid conflicts
    // The frontend will make its own TTS request using the response text

    return NextResponse.json({
      success: true,
      response: aiResponse,
      audioUrl: null, // Let frontend handle audio generation
      interactionType: interactionType || 'general',
      timestamp: new Date().toISOString(),
      usage: response.usage,
    })
  } catch (error) {
    console.error('Professional voice API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process professional voice request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// Get professional context from your existing systems
async function getProfessionalContext(query: string, interactionType?: string): Promise<string> {
  try {
    // Try to connect to your existing chat API endpoint
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        user_id: `voice_${Date.now()}`,
        role: 'user',
        content: query,
        enhancedMode: true, // Use your enhanced RAG
        interviewType: interactionType,
        conversationHistory: [],
      }),
    })

    if (response.ok) {
      const data = await response.json()
      // Your chat API returns response in different format
      const contextResponse = data.response || data.message?.content || data.content
      if (contextResponse && contextResponse.length > 50) {
        console.log('✅ Using MCP server context for voice response')
        return contextResponse
      }
    }
  } catch (error) {
    console.warn('Could not fetch professional context from MCP server:', error)
  }

  return getFallbackContext(interactionType)
}

// Create specialized system prompts for real-time voice interaction
function createSystemPrompt(
  interactionType: string,
  professionalContext: string,
  additionalContext?: string,
): string {
  const basePrompt = `You are Sajal Basnet, a skilled software engineer in a real-time voice conversation. 

CRITICAL VOICE GUIDELINES:
- Always speak in FIRST PERSON: "I am Sajal", "My experience", "I've built"
- Keep responses SHORT and CONVERSATIONAL (15-45 seconds when spoken)
- Use NATURAL speech patterns with contractions: "I've", "I'll", "that's"
- Speak with ENERGY and ENTHUSIASM about your work
- Ask ONE engaging follow-up question per response
- Use CLEAR, SIMPLE language - avoid jargon unless explaining it

Professional Background:
${professionalContext}

Real-Time Voice Optimization:
- Respond quickly and naturally like a live conversation
- Use verbal cues: "So...", "Well...", "Actually..."
- Break complex ideas into bite-sized pieces
- Show genuine interest in the conversation
- Match the caller's energy level and speaking style`

  const specializedPrompts = {
    hr_screening: `
${basePrompt}

You're in an HR screening call. Focus on:
- Professional achievements with specific metrics
- Culture fit and communication skills
- Salary expectations and logistics
- Enthusiasm for the role and company
- Clear, structured responses using STAR methodology when relevant`,

    technical_interview: `
${basePrompt}

You're in a technical interview. Focus on:
- Deep technical knowledge and problem-solving
- Specific project examples with technical details
- System design thinking and trade-offs
- Code quality and best practices
- Leadership and mentoring experience`,

    networking: `
${basePrompt}

You're in a networking conversation. Focus on:
- Building professional relationships
- Sharing industry insights and expertise
- Identifying mutual opportunities
- Professional brand and unique value proposition
- Following up and maintaining connections`,

    career_coaching: `
${basePrompt}

You're in a career coaching session. Focus on:
- Career goal assessment and planning
- Skill development and growth opportunities
- Industry trends and market positioning
- Professional development strategies
- Actionable next steps and recommendations`,
  }

  const prompt =
    specializedPrompts[interactionType as keyof typeof specializedPrompts] || basePrompt

  if (additionalContext) {
    return `${prompt}

Additional Context: ${additionalContext}`
  }

  return prompt
}

// Generate audio response using TTS - DISABLED
// Audio generation is now handled entirely by the frontend to avoid conflicts
// with blob URL creation and audio element management
/*
async function generateAudioResponse(text: string): Promise<string | null> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/voice/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: 'alloy', // Professional voice
      }),
    })

    if (response.ok) {
      // Return a URL or base64 encoded audio
      return `${baseUrl}/api/voice/speech?text=${encodeURIComponent(text)}`
    }
  } catch (error) {
    console.warn('Could not generate audio response:', error)
  }

  return null
}
*/

// Fallback professional context for different interaction types
function getFallbackContext(interactionType?: string): string {
  const baseContext = `Experienced software engineer with 5+ years of professional experience:
- Full-stack development with TypeScript, React, Node.js
- Cloud architecture and deployment (AWS, Vercel)
- Team leadership and mentoring experience
- System design and scalability expertise`

  const contextMap = {
    hr_screening: `${baseContext}
- Strong communication and culture fit
- Track record of successful project delivery
- Collaborative team player with leadership potential`,

    technical_interview: `${baseContext}
- Deep problem-solving and algorithm knowledge
- Experience with complex system architecture
- Code quality advocate and best practices implementation`,

    networking: `${baseContext}
- Active in tech community and industry events
- Expertise in modern development practices
- Interested in knowledge sharing and mentoring`,

    career_coaching: `${baseContext}
- Career progression from developer to technical lead
- Experience with diverse technologies and industries
- Focus on continuous learning and growth`,
  }

  return contextMap[interactionType as keyof typeof contextMap] || baseContext
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    },
  )
}
