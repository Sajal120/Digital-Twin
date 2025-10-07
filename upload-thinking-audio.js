// Upload existing thinking audio to Vercel Blob
import dotenv from 'dotenv'
import { put } from '@vercel/blob'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

async function uploadThinkingAudio() {
  try {
    console.log('📤 Uploading thinking_hmm.mp3 to Vercel Blob...')

    const audioBuffer = fs.readFileSync('thinking_hmm.mp3')
    console.log(`📊 File size: ${audioBuffer.length} bytes`)

    const blob = await put('phone-audio/thinking_hmm.mp3', audioBuffer, {
      access: 'public',
      contentType: 'audio/mpeg',
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log(`✅ Uploaded successfully!`)
    console.log(`🔗 URL: ${blob.url}`)
    console.log(`\n📋 Add this to your code:`)
    console.log(`const THINKING_SOUND_URL = '${blob.url}'`)
  } catch (error) {
    console.error('❌ Upload failed:', error.message)
  }
}

uploadThinkingAudio()
