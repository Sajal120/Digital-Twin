const https = require('https')
const fs = require('fs').promises
const { put, del } = require('@vercel/blob')

async function generateSlowNaturalThinking() {
  console.log('🎵 Generating SLOW natural thinking with YOUR actual voice...')

  // Super slow, natural thinking - long drawn out hmmmm sounds with natural pauses
  // Pattern: looong slow Hmmmmmm... pause... medium slow hmmmm... pause... short slow hmmm
  const text = 'Hmmmmmmmmmmm... hmmmmmm... hmmm'

  const voiceId = 'WcXkU7PbsO0uKKBdWJrG' // YOUR ACTUAL CLONED VOICE (Sajal Basnet English)

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
      stability: 0.7, // Very stable for thinking
      similarity_boost: 0.9, // Maximum similarity to YOUR voice
      style: 0.1, // Minimal style for natural thinking
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
        console.log(`✅ Generated ${audioBuffer.length} bytes (slower & natural)`)

        // Save locally
        const localPath = 'thinking_natural.mp3'
        await fs.writeFile(localPath, audioBuffer)
        console.log(`💾 Saved to ${localPath}`)

        // Delete old version from Vercel Blob
        console.log('🗑️ Deleting old version...')
        try {
          await del(
            'https://brxp5nmtsramnrr1.public.blob.vercel-storage.com/phone-audio/thinking_natural.mp3',
            {
              token: process.env.BLOB_READ_WRITE_TOKEN,
            },
          )
          console.log('✅ Deleted old version')
        } catch (e) {
          console.log('⚠️ No old version found')
        }

        // Upload new version
        console.log('📤 Uploading new SLOW natural thinking sound...')
        const blob = await put('phone-audio/thinking_natural.mp3', audioBuffer, {
          access: 'public',
          contentType: 'audio/mpeg',
          cacheControlMaxAge: 31536000,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })

        console.log('✅ Uploaded:', blob.url)
        console.log('\n🎉 SLOW natural thinking with YOUR voice is live!')
        console.log(
          '   Pattern: Long slow Hmmmmmm... pause... medium slow hmmmm... pause... short slow hmmm',
        )
        resolve(blob.url)
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

generateSlowNaturalThinking()
  .then(() => console.log('\n✅ Try calling now - should be much slower and in YOUR voice!'))
  .catch((err) => console.error('❌ Failed:', err.message))
