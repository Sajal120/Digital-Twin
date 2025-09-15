// Test the chat API with Upstash vector integration
async function testChatAPI() {
  try {
    console.log('Testing chat API with Upstash vector search...')

    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'How do you structure Terraform?',
        conversationHistory: [],
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Chat response:', JSON.stringify(data, null, 2))
    } else {
      console.error('Error:', response.status, await response.text())
    }

    // Test with another query
    console.log('\nTesting with another query...')

    const response2 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What technologies do you work with?',
        conversationHistory: [],
      }),
    })

    if (response2.ok) {
      const data2 = await response2.json()
      console.log('Second chat response:', JSON.stringify(data2, null, 2))
    } else {
      console.error('Error:', response2.status, await response2.text())
    }
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testChatAPI()
