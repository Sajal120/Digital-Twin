import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for conversation summaries
// In production, this would be a database
const conversationSummaries = new Map<
  string,
  {
    summary: string
    timestamp: Date
    turnCount: number
    memory: Array<{ transcript?: string; response?: string; question?: string; answer?: string }>
    title?: string
    chatType?: 'voice_chat' | 'text_chat'
  }
>()

export async function POST(request: NextRequest) {
  try {
    const { action, sessionId, summary, turnCount, memory, title, chatType } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    if (action === 'save') {
      if (!summary) {
        return NextResponse.json({ error: 'Summary is required for save action' }, { status: 400 })
      }

      // Save conversation summary AND memory array with title and chatType
      conversationSummaries.set(sessionId, {
        summary,
        timestamp: new Date(),
        turnCount: turnCount || 0,
        memory: memory || [], // Store the actual conversation turns
        title: title || 'Untitled Chat',
        chatType: chatType || 'voice_chat',
      })

      console.log(
        `💾 Saved ${chatType || 'voice_chat'} conversation: ${sessionId} - "${title}" with ${memory?.length || 0} turns`,
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
        title: data.title || 'Untitled Chat',
        chatType: data.chatType || 'voice_chat',
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
    const chatType = url.searchParams.get('chatType')

    // If chatType is provided without sessionId, return all histories of that type
    if (chatType && !sessionId) {
      const histories = Array.from(conversationSummaries.entries())
        .filter(([_, data]) => data.chatType === chatType)
        .map(([sessionId, data]) => ({
          sessionId,
          title: data.title || 'Untitled Chat',
          timestamp: data.timestamp.toISOString(),
          turnCount: data.turnCount,
          chatType: data.chatType,
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Most recent first

      console.log(`📚 Retrieved ${histories.length} ${chatType} histories`)

      return NextResponse.json({
        success: true,
        histories,
        count: histories.length,
      })
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID or chatType is required' }, { status: 400 })
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
      title: data.title || 'Untitled Chat',
      chatType: data.chatType || 'voice_chat',
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

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const existed = conversationSummaries.has(sessionId)
    conversationSummaries.delete(sessionId)

    console.log(`🗑️ Deleted conversation for session: ${sessionId}`)

    return NextResponse.json({
      success: true,
      action: 'deleted',
      sessionId,
      existed,
    })
  } catch (error) {
    console.error('❌ Voice memory DELETE error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete conversation memory',
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
        'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    },
  )
}
