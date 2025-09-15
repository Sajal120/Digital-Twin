// Test the chat API
async function testChat() {
  try {
    const https = require('http')

    const postData = JSON.stringify({
      message: 'naam k o',
      conversationHistory: [],
    })

    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }

    const req = https.request(options, (res) => {
      console.log(`statusCode: ${res.statusCode}`)

      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        console.log('Response:', JSON.parse(data))
      })
    })

    req.on('error', (error) => {
      console.error('Error:', error)
    })

    req.write(postData)
    req.end()
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testChat()
