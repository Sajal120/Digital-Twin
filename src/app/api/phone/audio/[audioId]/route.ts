import { NextRequest, NextResponse } from 'next/server'
import { phoneAudioCache } from '../../../../../lib/phone-audio-cache'

// Allow cross-origin access for audio streaming endpoint
// Updated: Fix Vercel build issue with dynamic routes
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=300', // 5 minutes cache
}

export async function GET(request: NextRequest, { params }: { params: { audioId: string } }) {
  try {
    const audioId = params.audioId
    console.log(`🎵 Streaming audio request for: ${audioId}`)

    // Get audio from cache
    const audioEntry = phoneAudioCache.get(audioId)

    if (!audioEntry) {
      console.warn(`❌ Audio not found in cache: ${audioId}`)
      console.warn(`   This is expected in serverless - cache doesn't persist across instances`)
      console.warn(`   Twilio will fall back to <Say> verb in TwiML`)
      
      // Return 404 - Twilio will handle gracefully and skip to next verb
      return new NextResponse('Audio not found in serverless cache', { 
        status: 404,
        headers: {
          'X-Cache-Miss': 'true',
          'X-Serverless-Note': 'Audio cache cleared between requests',
        }
      })
    }

    // Check if expired
    if (audioEntry.expires < Date.now()) {
      phoneAudioCache.delete(audioId)
      console.warn(`⏰ Audio expired: ${audioId}`)
      return new NextResponse('Audio expired', { status: 410 })
    }

    console.log(`✅ Streaming audio: ${audioEntry.buffer.length} bytes`)
    console.log(`📝 Audio text preview: ${audioEntry.text}`)

    // Return audio stream
    return new NextResponse(audioEntry.buffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': audioEntry.contentType,
        'Content-Length': audioEntry.buffer.length.toString(),
        'Accept-Ranges': 'bytes',
        ...CORS_HEADERS,
      },
    })
  } catch (error) {
    console.error('❌ Audio streaming error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  })
}
