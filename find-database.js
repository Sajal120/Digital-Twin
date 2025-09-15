// Comprehensive test to help locate the correct Upstash database
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function findCorrectDatabase() {
  try {
    console.log('🔍 FINDING YOUR CORRECT UPSTASH DATABASE')
    console.log('=========================================')

    console.log('📋 Your Environment Configuration:')
    console.log('URL:', process.env.UPSTASH_VECTOR_REST_URL)
    console.log('Token length:', process.env.UPSTASH_VECTOR_REST_TOKEN?.length)
    console.log('')

    // Initialize the Index with your credentials
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Get database info
    console.log('📊 Connected Database Info:')
    const info = await index.info()
    console.log('Vector Count:', info.vectorCount)
    console.log('Embedding Model:', info.denseIndex?.embeddingModel)
    console.log('Dimensions:', info.dimension)
    console.log('Similarity Function:', info.similarityFunction)
    console.log('')

    // Test search to confirm this is the right database
    console.log('🧪 Testing search for your content...')
    const testResults = await index.query({
      data: 'timro anuhar',
      topK: 3,
      includeMetadata: true,
    })

    if (testResults && testResults.length > 0) {
      console.log('✅ SUCCESS! This database contains your content:')
      testResults.forEach((result, i) => {
        console.log(`  ${i + 1}. ID: ${result.id}`)
        console.log(`     Title: ${result.metadata?.title}`)
        console.log(`     Content: ${result.metadata?.content?.substring(0, 50)}...`)
        console.log(`     Score: ${result.score}`)
        console.log('')
      })
    } else {
      console.log('❌ No results found - this might be the wrong database')
    }

    // Extract the database ID from the URL to help find it in console
    console.log('🎯 HOW TO FIND THIS DATABASE IN UPSTASH CONSOLE:')
    console.log('===============================================')

    const url = process.env.UPSTASH_VECTOR_REST_URL
    if (url) {
      // Parse the URL to get identifying information
      const urlParts = url.replace('https://', '').replace('.upstash.io', '').split('-')
      console.log('Your database identifier parts:', urlParts)

      console.log('\n🔍 In the Upstash console (https://console.upstash.com/vector):')
      console.log('Look for a database with these characteristics:')
      console.log('- Name contains: "funny-koala" or "46921"')
      console.log('- Region: us-east-1 or us1')
      console.log('- Vector count: 29')
      console.log('- Embedding model: BGE_M3')

      console.log('\n📝 Alternative approach:')
      console.log('1. Go to https://console.upstash.com/vector')
      console.log('2. Look for ANY database that shows 29 vectors')
      console.log('3. Click on each database until you find one with:')
      console.log('   - 29 total vectors')
      console.log('   - BGE_M3 embedding model')
      console.log('   - Content that includes "timro anuhar", "sajal", etc.')
    }

    // Try to fetch specific known vectors
    console.log('\n🔬 Attempting to fetch known vectors:')
    const knownIds = ['cms_chunk_9', 'cms_chunk_8', 'cms_chunk_7', 'cms_chunk_6']

    for (const id of knownIds) {
      try {
        const vector = await index.fetch([id])
        if (vector && vector.length > 0) {
          console.log(`✅ Found ${id}: exists in database`)
        }
      } catch (error) {
        console.log(`❌ ${id}: not found or error`)
      }
    }
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message)
    console.log('\n🚨 POSSIBLE ISSUES:')
    console.log('1. Wrong URL or token in .env file')
    console.log('2. Network connectivity issue')
    console.log("3. Database doesn't exist or was deleted")
    console.log('4. Credentials expired or invalid')
  }
}

findCorrectDatabase()
