#!/usr/bin/env node

// Quick test to see if AI projects are prioritized
async function testAIPriority() {
  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message:
          'Tell me about your most impressive technical achievement and what makes you stand out as a developer',
        conversationHistory: [],
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    console.log('\n🤖 AI PRIORITY TEST RESPONSE:')
    console.log('=' * 60)
    console.log(data.response)
    console.log('=' * 60)

    // Check if AI Digital Twin is mentioned before Aubot
    const responseText = data.response.toLowerCase()
    const aiIndex = responseText.indexOf('ai digital twin')
    const aubotIndex = responseText.indexOf('aubot')

    console.log('\n📊 PRIORITY ANALYSIS:')
    console.log(`AI Digital Twin mentioned at position: ${aiIndex}`)
    console.log(`Aubot mentioned at position: ${aubotIndex}`)

    if (aiIndex !== -1 && (aubotIndex === -1 || aiIndex < aubotIndex)) {
      console.log('✅ SUCCESS: AI Digital Twin is prioritized over Aubot!')
    } else {
      console.log('❌ ISSUE: Aubot still appears before AI Digital Twin')
    }
  } catch (error) {
    console.error('Error testing chat:', error.message)

    // Check if server is running
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.log('\n💡 TIP: Make sure your Next.js dev server is running with:')
      console.log('   npm run dev')
      console.log('   # or')
      console.log('   pnpm dev')
    }
  }
}

testAIPriority()
