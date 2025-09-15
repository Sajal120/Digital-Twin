// Get the URL for the 72-vector database from the console
// Based on the console screenshot, we need to extract the correct URL

async function getConsoleDatabase() {
  console.log('🔄 SWITCHING TO 72-VECTOR DATABASE')
  console.log('=================================')

  // From your console screenshot, the database is:
  // sajal-portfolio-vectors (72 vectors) with ID: 361687cd-d05e-4885-ad1e-065ff9ca78ed

  const consoleDbId = '361687cd-d05e-4885-ad1e-065ff9ca78ed'

  console.log('📋 DATABASE INFO FROM CONSOLE:')
  console.log('Name: sajal-portfolio-vectors')
  console.log('Vectors: 72/72')
  console.log('Region: N. Virginia, USA (us-east-1)')
  console.log('Console ID:', consoleDbId)
  console.log('')

  // The URL pattern for Upstash is typically:
  // https://[name]-[region]-vector.upstash.io
  // But we need to construct it from the console database info

  console.log('🔍 POSSIBLE DATABASE URLS:')
  console.log('=========================')

  const possibleUrls = [
    // Based on the database name pattern
    'https://sajal-portfolio-vectors-us1-vector.upstash.io',
    'https://sajal-portfolio-vectors-us-east-1-vector.upstash.io',
    'https://sajal-portfolio-vectors-virginia-vector.upstash.io',
    // Based on ID pattern (less likely but possible)
    `https://upstash-${consoleDbId.substring(0, 8)}-us1-vector.upstash.io`,
  ]

  console.log('Try these URLs in your .env file:')
  possibleUrls.forEach((url, i) => {
    console.log(`${i + 1}. ${url}`)
  })

  console.log('\n🔧 NEXT STEPS:')
  console.log('==============')
  console.log("1. I'll create a script to test different URLs")
  console.log("2. We'll find which URL connects to your 72-vector database")
  console.log('3. Update your .env file with the correct URL')
  console.log('4. Sync your content to the console database')
  console.log('')

  console.log('💡 ALTERNATIVE APPROACH:')
  console.log('========================')
  console.log('In your Upstash console:')
  console.log('1. Go to sajal-portfolio-vectors database')
  console.log('2. Look for "Connection" or "Settings" tab')
  console.log('3. Find the REST URL and token')
  console.log('4. Copy them to replace your current .env values')
}

getConsoleDatabase()
