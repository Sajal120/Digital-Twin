const https = require('https')
const fs = require('fs').promises
const { put, del, list } = require('@vercel/blob')

async function deleteOldThinkingSound() {
  console.log('🗑️  Deleting old thinking sound from Vercel Blob...')

  try {
    // List all blobs in phone-audio directory
    const { blobs } = await list({
      prefix: 'phone-audio/thinking',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // Delete all old thinking sounds
    for (const blob of blobs) {
      console.log(`   Deleting: ${blob.pathname}`)
      await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN })
    }

    console.log('✅ Old thinking sounds deleted')
  } catch (err) {
    console.log('⚠️  Delete failed (might not exist):', err.message)
  }
}

async function generateClearSlowThinking() {
  console.log('🎵 Generating ULTRA SLOW, CLEAR thinking sound with YOUR voice...')
  console.log('   Pattern: Long "Hmmmmmmm" + pause + Long "Hmmmm"')
  console.log('   Style: Naturally loud, clear, no fade, super slow')

  // Ultra slow pattern with natural pause
  // Multiple 'm's make it longer and slower
  const text = 'Hmmmmmmmmmmmmmmmmmmmmmmmmmmm.......... Hmmmmmmmmmmmmmmm.'

  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'WcXkU7PbsO0uKKBdWJrG'

  console.log(`   Using voice ID: ${voiceId}`)

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
      stability: 0.7, // More stable for clear, consistent sound
      similarity_boost: 0.9, // Maximum similarity to YOUR voice
      style: 0.0, // Neutral style (no emotional variation)
      use_speaker_boost: true, // Naturally loud and clear
    },
  })

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = []

      res.on('data', (chunk) => chunks.push(chunk))

      res.on('end', async () => {
        if (res.statusCode !== 200) {
          const errorBody = Buffer.concat(chunks).toString()
          reject(new Error(`ElevenLabs error ${res.statusCode}: ${errorBody}`))
          return
        }

        const audioBuffer = Buffer.concat(chunks)
        const sizeKB = (audioBuffer.length / 1024).toFixed(2)
        console.log(`✅ Generated ${sizeKB} KB of audio`)

        // Save locally first
        const localPath = 'thinking_natural.mp3'
        await fs.writeFile(localPath, audioBuffer)
        console.log(`💾 Saved locally to ${localPath}`)

        // Upload to Vercel Blob
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          console.log('📤 Uploading to Vercel Blob...')
          try {
            const blob = await put(`phone-audio/${localPath}`, audioBuffer, {
              access: 'public',
              contentType: 'audio/mpeg',
              cacheControlMaxAge: 31536000, // 1 year
              token: process.env.BLOB_READ_WRITE_TOKEN,
            })
            console.log('✅ Uploaded successfully!')
            console.log(`   URL: ${blob.url}`)
            resolve(blob.url)
          } catch (err) {
            console.log('⚠️  Upload failed:', err.message)
            resolve(null)
          }
        } else {
          console.log('⚠️  No BLOB_READ_WRITE_TOKEN - skipping upload')
          resolve(null)
        }
      })
    })

    req.on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`))
    })

    req.write(postData)
    req.end()
  })
}

async function main() {
  console.log('🚀 Starting thinking sound regeneration...\n')

  // Step 1: Delete old sounds
  await deleteOldThinkingSound()
  console.log('')

  // Step 2: Generate new sound with YOUR voice
  const url = await generateClearSlowThinking()

  console.log('\n' + '='.repeat(60))
  if (url) {
    console.log('🎉 SUCCESS! Your new thinking sound is ready!')
    console.log('   ✓ Ultra slow pacing')
    console.log('   ✓ Clear, no fade')
    console.log('   ✓ Naturally loud')
    console.log('   ✓ YOUR actual voice')
    console.log('\n📍 Update this URL in handle-speech/route.ts:')
    console.log(`   ${url}`)
  } else {
    console.log('✅ Audio generated locally (thinking_natural.mp3)')
    console.log('   Upload manually to Vercel Blob if needed')
  }
  console.log('='.repeat(60))
}

main().catch((err) => {
  console.error('\n❌ FAILED:', err.message)
  process.exit(1)
})
