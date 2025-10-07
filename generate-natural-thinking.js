import ElevenLabs from 'elevenlabs-node'
import { put } from '@vercel/blob'
import fs from 'fs/promises'

const voice = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY,
})

async function generateNaturalThinking() {
  console.log('🎵 Generating natural thinking sound...')

  // More natural: long hmm, brief pause (in speech), medium hmm, short hmm
  // ElevenLabs will naturally create the pauses in the speech pattern
  const text = 'Hmmmmm... hmm, hmm'

  try {
    const audio = await voice.textToSpeech({
      voiceId: 'pFZP5JQG7iQjIQuC4Bku', // YOUR cloned voice
      text: text,
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.8,
      style: 0.0,
      useSpeakerBoost: true,
    })

    // Save locally first
    const localPath = 'thinking_natural.mp3'
    await fs.writeFile(localPath, audio)
    const stats = await fs.stat(localPath)
    console.log(`✅ Generated ${stats.size} bytes → ${localPath}`)

    // Upload to Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      console.log('📤 Uploading to Vercel Blob...')
      const blob = await put(`phone-audio/${localPath}`, audio, {
        access: 'public',
        contentType: 'audio/mpeg',
        cacheControlMaxAge: 31536000, // 1 year
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      console.log('✅ Uploaded:', blob.url)
      return blob.url
    } else {
      console.log('⚠️ No BLOB token - file saved locally only')
      return null
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

generateNaturalThinking()
  .then((url) => {
    if (url) {
      console.log('\n🎉 SUCCESS! Update your code with this URL:')
      console.log(url)
    } else {
      console.log('\n💡 File ready - will auto-upload in production')
    }
  })
  .catch((err) => console.error('Failed:', err))
