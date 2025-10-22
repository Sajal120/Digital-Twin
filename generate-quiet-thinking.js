// Generate QUIET thinking acknowledgment audio files for phone system
// Run: node generate-quiet-thinking.js

import dotenv from 'dotenv'
import { put } from '@vercel/blob'
import fs from 'fs'

// Load .env.local explicitly
dotenv.config({ path: '.env.local' })

async function generateQuietThinkingAudio() {
  // Much quieter and shorter thinking sounds
  const files = [
    { filename: 'thinking_natural.mp3', text: 'mm' }, // Very short, quiet
  ]

  console.log('🎤 Generating QUIET thinking sound with Cartesia (language-neutral)...')

  for (const file of files) {
    try {
      console.log(`\n📝 Generating quiet: "${file.text}"`)

      const response = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.CARTESIA_API_KEY,
          'Cartesia-Version': '2024-10-21',
        },
        body: JSON.stringify({
          model_id: 'sonic-english',
          transcript: file.text,
          voice: {
            mode: 'id',
            id: process.env.CARTESIA_VOICE_ID,
            __experimental_controls: {
              speed: 'slower', // Slower for more natural
              volume: 'quiet', // Much quieter
            },
          },
          output_format: {
            container: 'mp3',
            encoding: 'mp3',
            sample_rate: 22050,
            bit_rate: 64000, // Lower bitrate
          },
          language: 'en',
        }),
      })

      console.log(`📡 Cartesia response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Cartesia failed: ${response.status} - ${errorText}`)
      }

      const audioBuffer = await response.arrayBuffer()
      console.log(`✅ Generated ${audioBuffer.byteLength} bytes`)

      // Save locally first
      fs.writeFileSync(file.filename, Buffer.from(audioBuffer))
      console.log(`✅ Saved to ${file.filename}`)

      // Upload to Vercel Blob
      const blob = await put(`phone-audio/${file.filename}`, Buffer.from(audioBuffer), {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
        cacheControlMaxAge: 31536000, // Cache for 1 year (never changes)
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      console.log(`✅ Uploaded to Vercel Blob: ${blob.url}`)
      console.log(`🔗 New thinking sound URL: ${blob.url}`)
    } catch (error) {
      console.error(`❌ Failed to generate "${file.text}":`, error.message)
    }
  }

  console.log('\n✅ All QUIET thinking audio files generated!')
  console.log('📝 Remember to update the thinking sound URL in handle-speech/route.ts')
}

generateQuietThinkingAudio().catch(console.error)
