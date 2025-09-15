// Test Nepali responses
async function testNepaliResponses() {
  try {
    console.log('Testing Nepali responses...')

    // Test "naam k o"
    const response1 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'naam k o',
        conversationHistory: [],
      }),
    })

    if (response1.ok) {
      const data1 = await response1.json()
      console.log('Response to "naam k o":', data1.response)
    }

    // Test "neu khoje ho"
    const response2 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'neu khoje ho',
        conversationHistory: [],
      }),
    })

    if (response2.ok) {
      const data2 = await response2.json()
      console.log('Response to "neu khoje ho":', data2.response)
    }
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testNepaliResponses()
