// Generate thinking acknowledgment audio files for phone system
// Run: node generate-thinking-audio.js

import dotenv from 'dotenv'
import { put } from '@vercel/blob'

// Load .env.local explicitly
dotenv.config({ path: '.env.local' })

async function generateThinkingAudio() {
  // Just natural sounds - no words, works in all languages
  const files = [
  { filename: 'thinking_natural.mp3', text: 'hmm... hmm' },

  console.log('🎤 Generating thinking sound with ElevenLabs (language-neutral)...')

  for (const phrase of phrases) {
    try {
      console.log(`\n📝 Generating: "${phrase.text}"`)

      console.log(`🔑 Using Voice ID: ${process.env.ELEVENLABS_VOICE_ID}`)
      console.log(`🔑 API Key: ${process.env.ELEVENLABS_API_KEY?.substring(0, 10)}...`)

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: phrase.text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
            output_format: 'mp3_22050_32',
            optimize_streaming_latency: 4,
          }),
        },
      )

      console.log(`📡 ElevenLabs response status: ${response.status}`)

      if (!response.ok) {
        throw new Error(`ElevenLabs failed: ${response.status}`)
      }

      const audioBuffer = await response.arrayBuffer()
      console.log(`✅ Generated ${audioBuffer.byteLength} bytes`)

      // Save locally first
      const fs = await import('fs')
      fs.default.writeFileSync(phrase.filename, Buffer.from(audioBuffer))
      console.log(`✅ Saved to ${phrase.filename}`)

      // Upload to Vercel Blob
      const blob = await put(`phone-audio/${phrase.filename}`, Buffer.from(audioBuffer), {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
        cacheControlMaxAge: 31536000, // Cache for 1 year (never changes)
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      console.log(`✅ Uploaded to Vercel Blob: ${blob.url}`)
    } catch (error) {
      console.error(`❌ Failed to generate "${phrase.text}":`, error.message)
    }
  }

  console.log('\n✅ All thinking audio files generated!')
}

generateThinkingAudio().catch(console.error)
