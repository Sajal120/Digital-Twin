// Test script for Upstash Vector client
import { Index } from '@upstash/vector'

async function testUpstashEmbeddings() {
  try {
    console.log('Initializing Upstash Vector client...')

    // Initialize the Index
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    console.log('Client initialized successfully!')

    // Test with the same query from your Upstash
    const testQuery = 'How do you structure Terraform?'

    console.log(`Searching for: "${testQuery}"`)

    // Query using Upstash's built-in embedding
    const results = await index.query({
      data: testQuery,
      topK: 3,
      includeMetadata: true,
    })

    console.log('Search results:', JSON.stringify(results, null, 2))

    if (results && results.length > 0) {
      console.log(`Found ${results.length} results`)
      results.forEach((result, i) => {
        console.log(`Result ${i + 1}: Score ${result.score}, Metadata:`, result.metadata)
      })
    } else {
      console.log('No results found')
    }
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testUpstashEmbeddings()
