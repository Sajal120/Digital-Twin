// Test specific terraform question
async function testSpecificQuestion() {
  try {
    console.log('Testing specific Terraform structuring question...')

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
      console.log('Response:', data.response)
      console.log('\nFull response object:', JSON.stringify(data, null, 2))
    } else {
      console.error('Error:', response.status, await response.text())
    }
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testSpecificQuestion()
