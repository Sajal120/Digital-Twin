import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      response: "Test response - chat API is working!",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        response: "Sorry, I'm having trouble connecting right now.",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: "Chat API is running" })
}