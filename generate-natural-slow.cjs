const https = require('https')
const fs = require('fs').promises
const { put } = require('@vercel/blob')

async function generateNaturalThinking() {
  console.log('🎵 Generating NATURAL thinking sound with YOUR voice...')

  // Much more natural with pauses: long thoughtful hmm, pause, shorter confirmation hmms
  const text = 'Hmmmmmmmm... hmm... hmm.'
  const voiceId = 'pFZP5JQG7iQjIQuC4Bku' // YOUR actual cloned voice

  const options = {
    hostname: 'api.elevenlabs.io',
    path: `/v1/text-to-speech/${voiceId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
  }

  const postData = JSON.stringify({
    text: text,
    model_id: 'eleven_turbo_v2_5',
    voice_settings: {
      stability: 0.6, // More stable for natural thinking
      similarity_boost: 0.85, // Higher similarity to YOUR voice
      style: 0.2, // Slight style variation
      use_speaker_boost: true,
    },
  })

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = []

      res.on('data', (chunk) => chunks.push(chunk))

      res.on('end', async () => {
        if (res.statusCode !== 200) {
          const error = Buffer.concat(chunks).toString()
          console.error('ElevenLabs error:', error)
          reject(new Error(`ElevenLabs error: ${res.statusCode}`))
          return
        }

        const audioBuffer = Buffer.concat(chunks)
        console.log(`✅ Generated ${audioBuffer.length} bytes`)

        // Save locally
        const localPath = 'thinking_natural.mp3'
        await fs.writeFile(localPath, audioBuffer)
        console.log(`💾 Saved to ${localPath}`)

        // Upload to Vercel Blob (overwrite existing)
        console.log('📤 Uploading to Vercel Blob...')

        // Delete old version first
        const { del } = require('@vercel/blob')
        try {
          await del(
            'https://brxp5nmtsramnrr1.public.blob.vercel-storage.com/phone-audio/thinking_natural.mp3',
            {
              token: process.env.BLOB_READ_WRITE_TOKEN,
            },
          )
          console.log('🗑️ Deleted old version')
        } catch (e) {
          console.log('⚠️ No old version to delete')
        }

        const blob = await put('phone-audio/thinking_natural.mp3', audioBuffer, {
          access: 'public',
          contentType: 'audio/mpeg',
          cacheControlMaxAge: 31536000,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })

        console.log('✅ Uploaded:', blob.url)
        console.log('\n🎉 Natural thinking sound with YOUR voice is live!')
        resolve(blob.url)
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

generateNaturalThinking()
  .then((url) => console.log('\n✅ Try calling now!'))
  .catch((err) => console.error('❌ Failed:', err.message))
