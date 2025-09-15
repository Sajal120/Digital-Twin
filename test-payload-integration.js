// Test PayloadCMS integrated responses
async function testPayloadCMSIntegration() {
  try {
    console.log('Testing PayloadCMS integration with chat API...\n')

    // Test 1: Personal identity question
    console.log('1. Testing "naam k o" (should return PayloadCMS content)...')
    const response1 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'naam k o',
        conversationHistory: [],
      }),
    })

    if (response1.ok) {
      const data1 = await response1.json()
      console.log('Response:', data1.response)
    }

    // Test 2: About Sajal question
    console.log('\n2. Testing "Who are you?" (should find Sajal background)...')
    const response2 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Who are you?',
        conversationHistory: [],
      }),
    })

    if (response2.ok) {
      const data2 = await response2.json()
      console.log('Response:', data2.response)
    }

    // Test 3: Aubot experience
    console.log('\n3. Testing "Tell me about your work experience"...')
    const response3 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me about your work experience',
        conversationHistory: [],
      }),
    })

    if (response3.ok) {
      const data3 = await response3.json()
      console.log('Response:', data3.response)
    }

    // Test 4: Nepali casual response
    console.log('\n4. Testing Nepali casual response...')
    const response4 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'neu khoje ho',
        conversationHistory: [],
      }),
    })

    if (response4.ok) {
      const data4 = await response4.json()
      console.log('Response:', data4.response)
    }
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Wait a bit for server to start
setTimeout(testPayloadCMSIntegration, 3000)
