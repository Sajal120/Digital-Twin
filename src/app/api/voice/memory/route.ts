import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for conversation summaries
// In production, this would be a database
const conversationSummaries = new Map<
  string,
  {
    summary: string
    timestamp: Date
    turnCount: number
    memory: Array<{ transcript: string; response: string }>
  }
>()

export async function POST(request: NextRequest) {
  try {
    const { action, sessionId, summary, turnCount, memory } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    if (action === 'save') {
      if (!summary) {
        return NextResponse.json({ error: 'Summary is required for save action' }, { status: 400 })
      }

      // Save conversation summary AND memory array
      conversationSummaries.set(sessionId, {
        summary,
        timestamp: new Date(),
        turnCount: turnCount || 0,
        memory: memory || [], // Store the actual conversation turns
      })

      console.log(
        `💾 Saved conversation summary for session: ${sessionId} with ${memory?.length || 0} turns`,
      )

      return NextResponse.json({
        success: true,
        action: 'saved',
        sessionId,
        timestamp: new Date().toISOString(),
      })
    }

    if (action === 'get') {
      // Retrieve conversation summary
      const data = conversationSummaries.get(sessionId)

      if (!data) {
        return NextResponse.json({
          success: true,
          found: false,
          sessionId,
        })
      }

      console.log(`📖 Retrieved conversation summary for session: ${sessionId}`)

      return NextResponse.json({
        success: true,
        found: true,
        sessionId,
        summary: data.summary,
        timestamp: data.timestamp.toISOString(),
        turnCount: data.turnCount,
        memory: data.memory || [], // Return the conversation turns array
      })
    }

    if (action === 'clear') {
      // Clear conversation summary
      const existed = conversationSummaries.has(sessionId)
      conversationSummaries.delete(sessionId)

      console.log(`🗑️ Cleared conversation summary for session: ${sessionId}`)

      return NextResponse.json({
        success: true,
        action: 'cleared',
        sessionId,
        existed,
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use: save, get, or clear' }, { status: 400 })
  } catch (error) {
    console.error('❌ Voice memory API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to manage voice conversation memory',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get conversation summary via GET
    const data = conversationSummaries.get(sessionId)

    if (!data) {
      return NextResponse.json({
        success: true,
        found: false,
        sessionId,
      })
    }

    return NextResponse.json({
      success: true,
      found: true,
      sessionId,
      summary: data.summary,
      timestamp: data.timestamp.toISOString(),
      turnCount: data.turnCount,
      memory: data.memory || [], // Return the conversation turns array
    })
  } catch (error) {
    console.error('❌ Voice memory GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve voice conversation memory',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    },
  )
}
