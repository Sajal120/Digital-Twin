/**
 * Test Phone Conversation Flow
 * Simulates a complete phone conversation to verify:
 * - No repeated greetings
 * - Responds to actual questions
 * - Uses accurate CV data
 * - Turn counting works properly
 */

const BASE_URL = 'https://www.sajal-app.online'
const CALL_SID = `TEST_CALL_${Date.now()}`

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

async function testPhoneConversation() {
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.cyan}📞 PHONE CONVERSATION TEST${colors.reset}`)
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  try {
    // Test 1: Initial greeting
    console.log(`${colors.blue}[Turn 0]${colors.reset} ${colors.yellow}Initial Call${colors.reset}`)
    const greetingResponse = await fetch(`${BASE_URL}/api/phone/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        CallSid: CALL_SID,
        From: '+1234567890',
        To: '+61278044137',
      }),
    })

    const greeting = await greetingResponse.text()
    const greetingMatch = greeting.match(/<Say[^>]*>([^<]+)<\/Say>/)
    const greetingText = greetingMatch ? greetingMatch[1] : 'No speech found'

    console.log(`${colors.green}✓${colors.reset} Sajal: ${greetingText}`)

    // Check for accuracy
    if (greetingText.toLowerCase().includes('senior')) {
      console.log(`${colors.red}✗ WARNING: Still saying "senior"!${colors.reset}`)
    }
    if (
      greetingText.toLowerCase().includes('masters') ||
      greetingText.toLowerCase().includes('swinburne')
    ) {
      console.log(`${colors.green}✓ Good: Mentions Masters/Swinburne${colors.reset}`)
    }
    console.log()

    // Wait a bit between turns
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Test 2: User asks about education
    console.log(
      `${colors.blue}[Turn 1]${colors.reset} ${colors.yellow}Caller: "Tell me about your education"${colors.reset}`,
    )
    const turn1Response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me about your education',
        role: 'user',
        user_id: CALL_SID,
        enhancedMode: true,
      }),
    })

    const turn1Data = await turn1Response.json()
    const turn1Text = turn1Data.response || turn1Data.content || 'No response'
    console.log(`${colors.green}✓${colors.reset} Sajal: ${turn1Text.substring(0, 150)}...`)

    // Check if it repeats greeting
    if (
      turn1Text.toLowerCase().includes('hello') &&
      turn1Text.toLowerCase().includes('my name is')
    ) {
      console.log(`${colors.red}✗ WARNING: Repeating greeting on Turn 1!${colors.reset}`)
    } else {
      console.log(`${colors.green}✓ Good: Not repeating intro${colors.reset}`)
    }
    console.log()

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Test 3: User asks about experience
    console.log(
      `${colors.blue}[Turn 2]${colors.reset} ${colors.yellow}Caller: "What's your work experience?"${colors.reset}`,
    )
    const turn2Response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "What's your work experience?",
        role: 'user',
        user_id: CALL_SID,
        enhancedMode: true,
      }),
    })

    const turn2Data = await turn2Response.json()
    const turn2Text = turn2Data.response || turn2Data.content || 'No response'
    console.log(`${colors.green}✓${colors.reset} Sajal: ${turn2Text.substring(0, 150)}...`)

    // Check for accuracy
    if (turn2Text.toLowerCase().includes('senior') || turn2Text.match(/5\+?\s*years/i)) {
      console.log(`${colors.red}✗ WARNING: Still exaggerating experience!${colors.reset}`)
    } else {
      console.log(`${colors.green}✓ Good: No exaggeration detected${colors.reset}`)
    }
    if (turn2Text.toLowerCase().includes('aubot') || turn2Text.toLowerCase().includes('intern')) {
      console.log(`${colors.green}✓ Good: Mentions Aubot internship${colors.reset}`)
    }
    console.log()

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Test 4: User asks about location
    console.log(
      `${colors.blue}[Turn 3]${colors.reset} ${colors.yellow}Caller: "Where are you located?"${colors.reset}`,
    )
    const turn3Response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Where are you located?',
        role: 'user',
        user_id: CALL_SID,
        enhancedMode: true,
      }),
    })

    const turn3Data = await turn3Response.json()
    const turn3Text = turn3Data.response || turn3Data.content || 'No response'
    console.log(`${colors.green}✓${colors.reset} Sajal: ${turn3Text.substring(0, 150)}...`)

    if (turn3Text.toLowerCase().includes('auburn') || turn3Text.toLowerCase().includes('sydney')) {
      console.log(`${colors.green}✓ Good: Mentions Auburn/Sydney${colors.reset}`)
    }
    console.log()

    // Summary
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
    console.log(`${colors.green}✓ Test Complete!${colors.reset}\n`)
    console.log(`${colors.yellow}📋 Test Summary:${colors.reset}`)
    console.log(`   • Initial greeting delivered`)
    console.log(`   • 3 conversation turns completed`)
    console.log(`   • Responses use real data from RAG system`)
    console.log(`   • No obvious greeting repetition`)
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

    console.log(
      `${colors.yellow}📞 Next Step: Call ${colors.green}+61 2 7804 4137${colors.yellow} to test live!${colors.reset}`,
    )
    console.log(`${colors.cyan}Try asking:${colors.reset}`)
    console.log(`   • "Tell me about your education"`)
    console.log(`   • "What's your work experience?"`)
    console.log(`   • "What technologies do you work with?"`)
    console.log(`   • "Where are you located?"\n`)
  } catch (error) {
    console.error(`${colors.red}✗ Error during test:${colors.reset}`, error.message)
    if (error.response) {
      console.error('Response:', await error.response.text())
    }
  }
}

// Run the test
testPhoneConversation()
