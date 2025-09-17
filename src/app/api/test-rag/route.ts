/**
 * Simple Test Endpoint
 * ===================
 *
 * Basic test to verify the server is working without Groq dependencies
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'working',
    message: 'Enhanced RAG system is ready',
    timestamp: new Date().toISOString(),
    features: {
      basicRAG: true,
      enhancedRAG: !!process.env.GROQ_API_KEY,
      vectorSearch: !!(
        process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN
      ),
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { test = 'basic' } = body

    if (test === 'groq') {
      // Test if Groq can be imported
      try {
        const { default: Groq } = await import('groq-sdk')
        const groq = new Groq({
          apiKey: process.env.GROQ_API_KEY || 'test-key',
        })

        return NextResponse.json({
          status: 'success',
          message: 'Groq SDK imported successfully',
          hasApiKey: !!process.env.GROQ_API_KEY,
        })
      } catch (error) {
        return NextResponse.json({
          status: 'error',
          message: 'Groq SDK import failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Basic test passed',
      groqAvailable: !!process.env.GROQ_API_KEY,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
