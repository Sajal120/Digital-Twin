const https = require('https')

async function listVoices() {
  console.log('🎤 Fetching your ElevenLabs voices...\n')

  const options = {
    hostname: 'api.elevenlabs.io',
    path: '/v1/voices',
    method: 'GET',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const data = JSON.parse(Buffer.concat(chunks).toString())
        console.log('Available voices:\n')
        data.voices.forEach((voice) => {
          console.log(`📢 ${voice.name}`)
          console.log(`   ID: ${voice.voice_id}`)
          console.log(`   Category: ${voice.category}`)
          console.log(
            `   Labels: ${Object.entries(voice.labels || {})
              .map(([k, v]) => `${k}:${v}`)
              .join(', ')}`,
          )
          console.log('')
        })

        // Find cloned voices
        const cloned = data.voices.filter((v) => v.category === 'cloned')
        if (cloned.length > 0) {
          console.log('\n🎯 YOUR CLONED VOICES:')
          cloned.forEach((v) => {
            console.log(`   ✅ ${v.name}: ${v.voice_id}`)
          })
        }
        resolve(data.voices)
      })
    })
    req.on('error', reject)
    req.end()
  })
}

listVoices().catch((err) => console.error('Error:', err.message))
