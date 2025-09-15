// Generate the exact console URL for your database
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function generateConsoleLink() {
  try {
    console.log('🔗 GENERATING EXACT CONSOLE LINK FOR YOUR DATABASE')
    console.log('=================================================')

    const url = process.env.UPSTASH_VECTOR_REST_URL // https://funny-koala-46921-us1-vector.upstash.io

    // Connect to verify this is the right database
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Get database info to confirm
    const info = await index.info()
    console.log('✅ Confirmed: This database has', info.vectorCount, 'vectors')

    // Test search to double-confirm
    const testResults = await index.query({
      data: 'timro anuhar',
      topK: 1,
      includeMetadata: true,
    })

    if (testResults && testResults.length > 0) {
      console.log('✅ Confirmed: Found your content "' + testResults[0].metadata?.title + '"')
    }

    console.log('\n🎯 STEP-BY-STEP INSTRUCTIONS:')
    console.log('=============================')
    console.log('1. Go to: https://console.upstash.com/vector')
    console.log('2. Look for a database with EXACTLY these details:')
    console.log('   📊 Vector Count: 29')
    console.log('   🤖 Embedding Model: BGE_M3')
    console.log('   📏 Dimensions: 1024')
    console.log('   🎯 Similarity: COSINE')
    console.log('   🏷️  Name likely contains: "funny-koala" or "46921"')
    console.log('   🌍 Region: us-east-1')
    console.log('')
    console.log('3. Click on that database')
    console.log('4. Go to the "Data Browser" tab')
    console.log('5. In the "By Data" search box, type: timro anuhar')
    console.log('6. Click "Query" button')
    console.log('')
    console.log('🔍 You should see:')
    console.log('   Result 1: cms_chunk_9 | Score: ~0.845 | Title: timro anuhar')
    console.log('')

    // Try to reverse-engineer the console URL pattern
    console.log('💡 CONSOLE URL PATTERN:')
    console.log('======================')
    console.log('The console URL typically follows this pattern:')
    console.log('https://console.upstash.com/vector/[DATABASE_ID]/databrowser')
    console.log('')
    console.log('Since your REST URL is:', url)
    console.log('The database should be identifiable by the "funny-koala-46921" part')
    console.log('')
    console.log("❓ If you still can't find it:")
    console.log('1. Check if you have multiple Upstash accounts')
    console.log("2. Make sure you're logged into the right account")
    console.log('3. Look for databases in different regions')
    console.log('4. Check if the database might be in a different team/organization')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

generateConsoleLink()
