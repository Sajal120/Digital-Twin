// Simple debug script to test the chat API
async function debugChat() {
  console.log('Testing chat API...')

  try {
    // Use Node.js built-in fetch (Node 18+) or http module
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'naam k ho',
        conversationHistory: [],
      }),
    })

    console.log('Status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('Success response:', JSON.stringify(data, null, 2))
    } else {
      const errorText = await response.text()
      console.log('Error response:', errorText)
    }
  } catch (error) {
    console.error('Network error:', error.message)
  }
}

debugChat()
