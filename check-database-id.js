// Extract the correct database ID from your Upstash URL
import dotenv from 'dotenv'

dotenv.config()

function extractDatabaseInfo() {
  const url = process.env.UPSTASH_VECTOR_REST_URL
  console.log('🔗 YOUR UPSTASH CONFIGURATION:')
  console.log('=====================================')
  console.log('REST URL:', url)

  // Extract database ID from the URL
  if (url) {
    // Format: https://[name]-[id]-[region]-vector.upstash.io
    const parts = url.replace('https://', '').replace('-vector.upstash.io', '').split('-')
    console.log('URL Parts:', parts)

    // The URL you're using vs what you should use
    console.log('\n🎯 CORRECT UPSTASH CONSOLE URLs:')
    console.log('=====================================')

    // Your current URL
    const yourUrl =
      'https://console.upstash.com/vector/361687cd-d05e-4885-ad1e-065ff9ca78ed/databrowser?teamid=0'
    console.log("❌ URL you're using:", yourUrl)

    // Extract the ID differences
    const yourId = '361687cd-d05e-4885-ad1e-065ff9ca78ed'
    const correctIdFromGuide = '361687cd-d05e-4885-ad1e-065f0ca78ed'

    console.log('\n🔍 ID COMPARISON:')
    console.log('Your URL ID:    ', yourId)
    console.log('Guide ID:       ', correctIdFromGuide)
    console.log('Difference:     ', yourId.length, 'vs', correctIdFromGuide.length, 'characters')

    // Character by character comparison
    console.log('\nCharacter-by-character diff:')
    const maxLen = Math.max(yourId.length, correctIdFromGuide.length)
    for (let i = 0; i < maxLen; i++) {
      const yourChar = yourId[i] || '_'
      const correctChar = correctIdFromGuide[i] || '_'
      if (yourChar !== correctChar) {
        console.log(`Position ${i}: '${yourChar}' vs '${correctChar}' ← DIFFERENT`)
      }
    }
  }

  console.log('\n💡 SOLUTION:')
  console.log('=====================================')
  console.log('Try finding your database in the main Upstash console:')
  console.log('1. Go to: https://console.upstash.com/vector')
  console.log('2. Look for a database named "sajal-portfolio-vectors" or similar')
  console.log('3. Click on it to get the correct URL')
  console.log('4. The URL should match your REST endpoint:', url)
}

extractDatabaseInfo()
