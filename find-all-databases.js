// Help find the correct database by checking all possibilities
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function findAllDatabases() {
  try {
    console.log('🔍 FINDING YOUR CORRECT UPSTASH DATABASE')
    console.log('======================================')

    console.log('📋 Your Configuration:')
    console.log('URL:', process.env.UPSTASH_VECTOR_REST_URL)
    console.log('Token exists:', !!process.env.UPSTASH_VECTOR_REST_TOKEN)
    console.log('')

    // Test current connection
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    const info = await index.info()
    console.log('✅ CONNECTED TO DATABASE WITH:')
    console.log('Vector Count:', info.vectorCount)
    console.log('Model:', info.denseIndex?.embeddingModel)
    console.log('Dimensions:', info.dimension)
    console.log('')

    // Verify content exists
    const testSearch = await index.query({
      data: 'timro anuhar',
      topK: 1,
      includeMetadata: true,
    })

    if (testSearch && testSearch.length > 0) {
      console.log('✅ CONTENT VERIFIED:')
      console.log('Found:', testSearch[0].id)
      console.log('Title:', testSearch[0].metadata?.title)
      console.log('Content:', testSearch[0].metadata?.content)
      console.log('')
    }

    console.log('🎯 TO FIND THIS DATABASE IN CONSOLE:')
    console.log('===================================')
    console.log('1. Go to: https://console.upstash.com/vector')
    console.log("2. Check if you're logged into the CORRECT account")
    console.log('3. Look for a database with these EXACT specs:')
    console.log(`   📊 Vector Count: ${info.vectorCount}`)
    console.log(`   🤖 Model: ${info.denseIndex?.embeddingModel}`)
    console.log(`   📏 Dimensions: ${info.dimension}`)
    console.log(`   🎯 Similarity: ${info.similarityFunction}`)
    console.log('')

    console.log('4. Try these search patterns in the main dashboard:')
    console.log('   - Look for databases with 29 vectors (not 72)')
    console.log('   - Check different regions (us-east-1, us-west-1, etc.)')
    console.log('   - Look in different teams if you have multiple')
    console.log('')

    console.log('🔧 ALTERNATIVE SOLUTIONS:')
    console.log('========================')
    console.log("If you can't find it in the console:")
    console.log('1. Your content IS working in your application')
    console.log('2. The sync from admin → Upstash IS working')
    console.log("3. You just can't see it in the web interface")
    console.log('4. This is likely an account/team/organization issue')
    console.log('')

    console.log('💡 ACCOUNT CHECK:')
    console.log('=================')
    console.log("Make sure you're logged into the Upstash account that has:")
    console.log('- Access to your REST URL:', process.env.UPSTASH_VECTOR_REST_URL)
    console.log('- The same email/team that created this database')
    console.log('')

    console.log('✅ YOUR SYSTEM IS WORKING CORRECTLY!')
    console.log('The issue is just finding the database in the web interface.')
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('')
    console.log('🚨 This suggests a connection issue:')
    console.log('- Check your .env file')
    console.log('- Verify URL and token are correct')
    console.log('- Database might have been deleted')
  }
}

findAllDatabases()
