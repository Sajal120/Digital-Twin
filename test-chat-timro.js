// Test the chat API with the specific content
async function testChatAPI() {
  try {
    console.log('Testing chat API with "timro anuhar"...')

    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'timro anuhar',
        user_id: 'test_user',
      }),
    })

    const data = await response.json()
    console.log('Chat API Response:')
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testChatAPI()
