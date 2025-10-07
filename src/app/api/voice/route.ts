import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, context, conversationHistory } = await request.json()

    // Validate input
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get professional context from your existing MCP server
    const professionalContext = await getProfessionalContext(message)

    // Create system prompt with professional persona
    const systemPrompt = `You are a professional AI assistant representing a skilled software engineer. 

Professional Context:
${professionalContext}

Instructions:
- Respond in a professional, confident, and articulate manner
- Use specific examples and metrics when discussing achievements
- Keep responses conversational but substantive (30-90 seconds when spoken)
- Reference actual experience and projects from the context
- Ask follow-up questions to understand the interviewer's specific interests
- Maintain professional boundaries while being personable

Current conversation context: ${context || 'Initial interaction'}`

    // Prepare messages for OpenAI Chat API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message },
    ]

    // Call OpenAI Chat API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.7,
      max_tokens: 800,
    })

    const aiResponse = response.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Voice API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process voice request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// Function to get professional context from your MCP server
async function getProfessionalContext(query: string): Promise<string> {
  try {
    // Try to connect to your existing MCP chat endpoint
    const response = await fetch(
      `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          context: 'voice_interaction',
        }),
      },
    )

    if (response.ok) {
      const data = await response.json()
      return data.response || 'Professional background available'
    }
  } catch (error) {
    console.warn('Could not fetch professional context:', error)
  }

  // Fallback professional context
  return `Experienced software engineer with expertise in:
- Full-stack development with TypeScript, React, Node.js
- Cloud architecture and deployment (AWS, Vercel)
- Team leadership and mentoring
- System design and scalability
- 5+ years of professional experience with measurable impact`
}

// Handle OPTIONS for CORS
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
