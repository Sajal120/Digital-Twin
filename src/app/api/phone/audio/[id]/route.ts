import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for temporary audio files (in production, use proper storage)
const audioCache = new Map<
  string,
  { buffer: ArrayBuffer; contentType: string; timestamp: number }
>()

// Clean up old audio files every 10 minutes
setInterval(
  () => {
    const now = Date.now()
    const maxAge = 10 * 60 * 1000 // 10 minutes

    for (const [id, data] of audioCache.entries()) {
      if (now - data.timestamp > maxAge) {
        audioCache.delete(id)
      }
    }
  },
  10 * 60 * 1000,
)

// Store audio temporarily
export function storeAudio(id: string, buffer: ArrayBuffer, contentType: string) {
  audioCache.set(id, {
    buffer,
    contentType,
    timestamp: Date.now(),
  })
}

// Serve temporary audio files for Twilio
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const audioId = params.id
    const audioData = audioCache.get(audioId)

    if (!audioData) {
      console.log(`🔍 Audio not found for ID: ${audioId}`)
      return new NextResponse('Audio not found', { status: 404 })
    }

    console.log(`🎵 Serving audio for ID: ${audioId}`)

    return new NextResponse(audioData.buffer, {
      headers: {
        'Content-Type': audioData.contentType,
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error serving audio:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
