import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
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

    // Get AI response optimized for voice interaction
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.7,
      max_tokens: 600, // Shorter responses for voice
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
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

// Create specialized system prompts for different interaction types
function createSystemPrompt(
  interactionType: string,
  professionalContext: string,
  additionalContext?: string,
): string {
  const basePrompt = `You are Sajal Basnet, a skilled software engineer speaking directly to the caller. 

IMPORTANT: Always speak in FIRST PERSON using "I", "my", "me" - you ARE Sajal Basnet, not an assistant.

Professional Background:
${professionalContext}

Voice Interaction Guidelines:
- Speak as Sajal Basnet directly: "I am Sajal Basnet", "My experience includes...", "I have worked on..."
- Keep responses conversational and natural for voice (30-90 seconds when spoken)
- Use specific examples and metrics from your professional background
- Speak with confidence but remain approachable and personable
- Ask follow-up questions to maintain engagement
- Use clear transitions and signaling phrases for voice clarity`

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
