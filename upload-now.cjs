const { put } = require('@vercel/blob')
const fs = require('fs').promises

async function uploadNaturalThinking() {
  console.log('🎵 Uploading thinking_natural.mp3 to Vercel Blob...')

  try {
    const audioBuffer = await fs.readFile('thinking_natural.mp3')
    console.log(`📤 Uploading ${audioBuffer.length} bytes...`)

    const blob = await put('phone-audio/thinking_natural.mp3', audioBuffer, {
      access: 'public',
      contentType: 'audio/mpeg',
      cacheControlMaxAge: 31536000, // 1 year
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log('✅ SUCCESS! Uploaded to:', blob.url)
    console.log('\n🎉 Your thinking sound is now live!')
    console.log('Try calling your phone number - it should work perfectly now!')

    return blob.url
  } catch (error) {
    console.error('❌ Upload failed:', error.message)
    throw error
  }
}

uploadNaturalThinking()
