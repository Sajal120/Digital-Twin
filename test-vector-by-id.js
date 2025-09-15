// Test searching for the specific vector ID in Upstash
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testSpecificVector() {
  try {
    console.log('Testing specific vector lookup for cms_chunk_9...')

    // Initialize the Index
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Try to fetch the specific vector by ID
    console.log('\n1️⃣ Attempting to fetch vector by ID: cms_chunk_9')
    try {
      const vector = await index.fetch(['cms_chunk_9'])
      console.log('Direct fetch result:', JSON.stringify(vector, null, 2))
    } catch (error) {
      console.log('Direct fetch failed:', error.message)
    }

    // Search for content that should match cms_chunk_9
    console.log('\n2️⃣ Searching for "timro anuhar" (should return cms_chunk_9)')
    const searchResults = await index.query({
      data: 'timro anuhar',
      topK: 5,
      includeMetadata: true,
    })

    if (searchResults && searchResults.length > 0) {
      searchResults.forEach((result, i) => {
        console.log(`\nResult ${i + 1}:`)
        console.log(`  🆔 ID: ${result.id}`)
        console.log(`  📊 Score: ${result.score}`)
        console.log(`  📝 Title: ${result.metadata?.title || 'No title'}`)
        console.log(`  💬 Content: ${result.metadata?.content?.substring(0, 100)}...`)

        if (result.id === 'cms_chunk_9') {
          console.log(`  ✅ This is cms_chunk_9!`)
        }
      })
    }

    // List all vectors with their IDs (if possible)
    console.log('\n3️⃣ Trying to list all vectors...')
    try {
      // This might not work depending on your Upstash plan
      const info = await index.info()
      console.log('Database info:', JSON.stringify(info, null, 2))
    } catch (error) {
      console.log('Could not list all vectors:', error.message)
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testSpecificVector()
