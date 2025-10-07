const https = require('https')
const fs = require('fs').promises
const { put, del } = require('@vercel/blob')

async function generateUltraSlowThinking() {
  console.log('🎵 Generating ULTRA SLOW single thinking sound with YOUR voice...')

  // ONE complete thinking sequence - two long natural hmms with pause
  // Long hmm, PAUSE, long hmm for natural thinking feel
  // Total 8-10 seconds to cover entire AI processing
  const text = 'Hmmmmmmmmmmmm. Hmmmmmmmmmmmm.'

  const voiceId = process.env.ELEVENLABS_VOICE_ID_ENGLISH || 'WcXkU7PbsO0uKKBdWJrG' // YOUR cloned voice (Sajal Basnet English)

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
      stability: 0.7, // Stable for thinking
      similarity_boost: 0.95, // MAXIMUM similarity to YOUR voice
      style: 0.0, // No style variation - pure YOUR voice
      use_speaker_boost: true,
    },
    output_format: 'mp3_44100_128', // Higher quality = louder, clearer
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
        console.log(`✅ Generated ${audioBuffer.length} bytes (ultra slow, single play)`)

        // Save locally
        const localPath = 'thinking_natural.mp3'
        await fs.writeFile(localPath, audioBuffer)
        console.log(`💾 Saved to ${localPath}`)

        // Delete old version
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
        console.log('📤 Uploading ULTRA SLOW single thinking sound...')
        const blob = await put('phone-audio/thinking_natural.mp3', audioBuffer, {
          access: 'public',
          contentType: 'audio/mpeg',
          cacheControlMaxAge: 31536000,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })

        console.log('✅ Uploaded:', blob.url)
        console.log('\n🎉 ULTRA SLOW thinking with YOUR MALE voice is live!')
        console.log('   ONE long sound (4-5s) - plays 2x = 8-10s total')
        console.log('   Voice: Sajal Basnet English (male)')
        resolve(blob.url)
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

generateUltraSlowThinking()
  .then(() => console.log('\n✅ Try calling - should be YOUR male voice, SLOW and natural!'))
  .catch((err) => console.error('❌ Failed:', err.message))
