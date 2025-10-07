/**
 * Generate Natural Thinking Sounds
 * Creates varied "Hmm" sounds: short, medium, long
 */

import 'dotenv/config'
import { put } from '@vercel/blob'
import fs from 'fs'

const phrases = [
  { text: 'Hmm', filename: 'thinking_short.mp3', description: 'Short hmm' },
  { text: 'Hmmmm', filename: 'thinking_medium.mp3', description: 'Medium hmmm' },
  { text: 'Hmmmmmmm', filename: 'thinking_long.mp3', description: 'Long hmmmmmm' },
]

async function generateThinkingSounds() {
  console.log('🎤 Generating natural thinking sounds with ElevenLabs...')
  console.log('🔑 Voice ID:', process.env.ELEVENLABS_VOICE_ID)

  for (const phrase of phrases) {
    try {
      console.log(`\n📝 Generating: "${phrase.text}" (${phrase.description})`)

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
              stability: 0.7,
              similarity_boost: 0.85,
              style: 0.5,
            },
            output_format: 'mp3_22050_32',
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`)
      }

      const audioBuffer = await response.arrayBuffer()
      console.log(`✅ Generated ${audioBuffer.byteLength} bytes`)

      // Save locally
      fs.writeFileSync(phrase.filename, Buffer.from(audioBuffer))
      console.log(`💾 Saved to ${phrase.filename}`)

      // Upload to Vercel Blob
      const blob = await put(`phone-audio/${phrase.filename}`, Buffer.from(audioBuffer), {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
        cacheControlMaxAge: 31536000, // 1 year - thinking sounds never change
      })

      console.log(`☁️ Uploaded to Vercel Blob: ${blob.url}`)
    } catch (error) {
      console.error(`❌ Error generating ${phrase.description}:`, error.message)
    }
  }

  console.log('\n✅ All thinking sounds generated!')
}

generateThinkingSounds()
