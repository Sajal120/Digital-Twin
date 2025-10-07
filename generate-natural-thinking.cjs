const https = require('https')
const fs = require('fs').promises
const { put } = require('@vercel/blob')

async function generateNaturalThinking() {
  console.log('🎵 Generating natural thinking sound with YOUR ElevenLabs voice...')

  const text = 'Hmmmmm... hmm, hmm' // Natural varied pattern
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'WcXkU7PbsO0uKKBdWJrG' // YOUR actual cloned voice from .env

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
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.0,
      use_speaker_boost: true,
    },
  })

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = []

      res.on('data', (chunk) => chunks.push(chunk))

      res.on('end', async () => {
        if (res.statusCode !== 200) {
          reject(new Error(`ElevenLabs error: ${res.statusCode}`))
          return
        }

        const audioBuffer = Buffer.concat(chunks)
        console.log(`✅ Generated ${audioBuffer.length} bytes`)

        // Save locally
        const localPath = 'thinking_natural.mp3'
        await fs.writeFile(localPath, audioBuffer)
        console.log(`💾 Saved to ${localPath}`)

        // Upload to Vercel Blob if token available
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          console.log('📤 Uploading to Vercel Blob...')
          try {
            const blob = await put(`phone-audio/${localPath}`, audioBuffer, {
              access: 'public',
              contentType: 'audio/mpeg',
              cacheControlMaxAge: 31536000,
              token: process.env.BLOB_READ_WRITE_TOKEN,
              addRandomSuffix: false,
            })
            console.log('✅ Uploaded:', blob.url)
            resolve(blob.url)
          } catch (err) {
            console.log('⚠️ Upload failed:', err.message)
            resolve(null)
          }
        } else {
          console.log('⚠️ No BLOB token - file ready for production upload')
          resolve(null)
        }
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

generateNaturalThinking()
  .then((url) => {
    if (url) {
      console.log('\n🎉 SUCCESS! Use this URL:')
      console.log(url)
    }
  })
  .catch((err) => console.error('❌ Failed:', err.message))
