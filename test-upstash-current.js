// Test current Upstash Vector contents and search for the specific content
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testUpstashContents() {
  try {
    console.log('Initializing Upstash Vector client...')

    // Initialize the Index
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    console.log('✓ Client initialized successfully!')

    // Test searching for the specific content "timro anuhar"
    console.log('\n🔍 Searching for "timro anuhar"...')
    const results1 = await index.query({
      data: 'timro anuhar',
      topK: 5,
      includeMetadata: true,
    })

    console.log('Search results for "timro anuhar":')
    if (results1 && results1.length > 0) {
      console.log(`✓ Found ${results1.length} results`)
      results1.forEach((result, i) => {
        console.log(`\nResult ${i + 1}:`)
        console.log(`  Score: ${result.score}`)
        console.log(`  ID: ${result.id}`)
        console.log(`  Title: ${result.metadata?.title}`)
        console.log(`  Content: ${result.metadata?.content?.substring(0, 100)}...`)
      })
    } else {
      console.log('❌ No results found for "timro anuhar"')
    }

    // Also test with Nepali content
    console.log('\n🔍 Searching for "nepali" content...')
    const results2 = await index.query({
      data: 'nepali',
      topK: 5,
      includeMetadata: true,
    })

    console.log('Search results for "nepali":')
    if (results2 && results2.length > 0) {
      console.log(`✓ Found ${results2.length} results`)
      results2.forEach((result, i) => {
        console.log(`\nResult ${i + 1}:`)
        console.log(`  Score: ${result.score}`)
        console.log(`  ID: ${result.id}`)
        console.log(`  Title: ${result.metadata?.title}`)
        console.log(`  Content: ${result.metadata?.content?.substring(0, 100)}...`)
      })
    } else {
      console.log('❌ No results found for "nepali"')
    }

    // Try to get info about the database
    console.log('\n📊 Checking database info...')
    try {
      const info = await index.info()
      console.log('Database info:', JSON.stringify(info, null, 2))
    } catch (error) {
      console.log('Could not get database info:', error.message)
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testUpstashContents()
