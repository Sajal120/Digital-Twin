/**
 * Upload varied thinking sounds to Vercel Blob
 */

import 'dotenv/config'
import { put } from '@vercel/blob'
import fs from 'fs'

const files = [
  { filename: 'thinking_short.mp3', description: 'Short Hmm' },
  { filename: 'thinking_medium.mp3', description: 'Medium Hmmmm' },
  { filename: 'thinking_long.mp3', description: 'Long Hmmmmmmm' },
]

async function uploadThinkingSounds() {
  console.log('☁️ Uploading thinking sounds to Vercel Blob...')

  for (const file of files) {
    try {
      const audioBuffer = fs.readFileSync(file.filename)
      console.log(`\n📤 Uploading ${file.description}: ${file.filename}`)

      const blob = await put(`phone-audio/${file.filename}`, audioBuffer, {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
        cacheControlMaxAge: 31536000, // 1 year
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      console.log(`✅ Uploaded: ${blob.url}`)
    } catch (error) {
      console.error(`❌ Error uploading ${file.filename}:`, error.message)
    }
  }

  console.log('\n✅ All thinking sounds uploaded!')
}

uploadThinkingSounds()
