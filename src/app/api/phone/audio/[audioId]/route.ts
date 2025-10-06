import { NextRequest, NextResponse } from 'next/server'
import { head } from '@vercel/blob'

// Allow cross-origin access for audio streaming endpoint
// Updated: Use Vercel Blob for persistent serverless audio storage
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

    // Try to get from Vercel Blob Storage
    try {
      const blobUrl = `${process.env.BLOB_READ_WRITE_TOKEN ? 'vercel-blob://' : 'https://'}phone-audio/${audioId}.mp3`

      // Check if blob exists
      const blobInfo = await head(blobUrl)

      if (!blobInfo) {
        throw new Error('Blob not found')
      }

      console.log(`✅ Found audio in Vercel Blob: ${blobInfo.size} bytes`)

      // Fetch the actual audio data
      const audioResponse = await fetch(blobInfo.url)
      const audioBuffer = await audioResponse.arrayBuffer()

      console.log(`✅ Streaming audio: ${audioBuffer.byteLength} bytes`)

      // Return audio stream
      return new NextResponse(audioBuffer as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
          'Accept-Ranges': 'bytes',
          ...CORS_HEADERS,
        },
      })
    } catch (blobError) {
      console.warn(`❌ Audio not found in Vercel Blob: ${audioId}`)
      console.warn(`   This can happen if audio was just generated`)
      console.warn(`   Twilio will fall back to <Say> verb in TwiML`)

      // Return 404 - Twilio will handle gracefully and skip to next verb
      return new NextResponse('Audio not found in blob storage', {
        status: 404,
        headers: {
          'X-Cache-Miss': 'true',
          'X-Serverless-Note': 'Audio not yet uploaded to blob storage',
        },
      })
    }
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
