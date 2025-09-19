// Test the updated chat responses to verify VR content is de-emphasized
async function testChatResponses() {
  const baseUrl = 'http://localhost:3001' // Server is running on port 3001

  const testQuestions = [
    'What companies have you worked for?',
    'Tell me about your VR development experience',
    'What are your key achievements?',
    'What technologies do you specialize in?',
    'What skills do you have?',
  ]

  console.log('🧪 Testing updated chat responses...\n')

  for (const question of testQuestions) {
    try {
      console.log(`📝 Question: "${question}"`)

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          conversationHistory: [],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const responseText = data.response || 'No response'

        // Check if VR content is de-emphasized
        const vrMentions = (
          responseText.match(/VR|virtual reality|Present4D|immersive|panoramic/gi) || []
        ).length
        const devMentions = (
          responseText.match(/Python|Java|AI|web development|React|JavaScript/gi) || []
        ).length

        console.log(`✅ Response received (${responseText.length} chars)`)
        console.log(`📊 VR mentions: ${vrMentions}, Dev mentions: ${devMentions}`)

        if (vrMentions > 3 && question.toLowerCase().includes('vr')) {
          console.log('⚠️  VR question still has high VR focus - this is expected')
        } else if (vrMentions > devMentions && !question.toLowerCase().includes('vr')) {
          console.log('⚠️  Non-VR question has high VR focus - needs more adjustment')
        } else {
          console.log('✨ Good balance - VR appropriately de-emphasized')
        }

        // Show first 150 characters of response
        console.log(`📖 Preview: ${responseText.substring(0, 150)}...`)
      } else {
        console.log(`❌ Error: ${response.status}`)
      }

      console.log('\n' + '='.repeat(60) + '\n')
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}\n`)
    }
  }
}

// Run the test
testChatResponses().catch(console.error)
