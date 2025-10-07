import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

// One-time upload endpoint to push thinking sounds to Vercel Blob
// Call this once after deployment: curl -X POST https://www.sajal-app.online/api/upload-thinking-sounds

export async function POST() {
  try {
    console.log('🎵 Starting thinking sounds upload to Vercel Blob...')

    const files = [{ filename: 'thinking_natural.mp3', text: 'Hmmmmm... hmm, hmm' }]

    const results = []

    for (const file of files) {
      try {
        // Read from project root (where files were committed)
        const filePath = join(process.cwd(), file.filename)
        const audioBuffer = await readFile(filePath)

        console.log(`📤 Uploading ${file.filename} (${audioBuffer.length} bytes)...`)

        const blob = await put(`phone-audio/${file.filename}`, audioBuffer, {
          access: 'public',
          contentType: 'audio/mpeg',
          cacheControlMaxAge: 31536000, // 1 year
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })

        console.log(`✅ Uploaded: ${blob.url}`)
        results.push({
          filename: file.filename,
          url: blob.url,
          size: audioBuffer.length,
          text: file.text,
        })
      } catch (error) {
        console.error(`❌ Failed to upload ${file.filename}:`, error)
        results.push({
          filename: file.filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: '✅ Thinking sounds uploaded successfully',
      files: results,
    })
  } catch (error) {
    console.error('❌ Upload failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
