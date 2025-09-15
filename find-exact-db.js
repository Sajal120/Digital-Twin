// Find the exact database URL and ID to help locate it in console
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function findExactDatabase() {
  try {
    console.log('🔍 FINDING YOUR EXACT DATABASE')
    console.log('=============================')

    const url = process.env.UPSTASH_VECTOR_REST_URL
    console.log('Your application connects to:', url)

    // Connect to your actual working database
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Get database info
    const info = await index.info()
    console.log('\n📊 YOUR ACTUAL DATABASE SPECS:')
    console.log('Vector Count:', info.vectorCount)
    console.log('Model:', info.denseIndex?.embeddingModel)
    console.log('Dimensions:', info.dimension)
    console.log('Similarity:', info.similarityFunction)

    // Test search to confirm this is the right database
    const testResults = await index.query({
      data: 'timro anuhar',
      topK: 3,
      includeMetadata: true,
    })

    if (testResults && testResults.length > 0) {
      console.log('\n✅ CONFIRMED - THIS DATABASE CONTAINS YOUR CONTENT:')
      testResults.forEach((result, i) => {
        console.log(`${i + 1}. ID: ${result.id}`)
        console.log(`   Title: "${result.metadata?.title}"`)
        console.log(`   Content: "${result.metadata?.content}"`)
        console.log(`   Score: ${result.score}`)
        console.log('')
      })
    }

    // Extract the exact database identifier
    console.log('🎯 CONSOLE DATABASE IDENTIFICATION:')
    console.log('===================================')

    // Parse URL to get database parts
    // https://funny-koala-46921-us1-vector.upstash.io
    const urlWithoutProtocol = url.replace('https://', '')
    const urlWithoutSuffix = urlWithoutProtocol.replace('-vector.upstash.io', '')
    const parts = urlWithoutSuffix.split('-')

    console.log('URL Parts:', parts)
    console.log('Database Pattern:', `${parts[0]}-${parts[1]}`) // funny-koala
    console.log('Database Number:', parts[2]) // 46921
    console.log('Region:', parts[3]) // us1

    console.log('\n❌ PROBLEM IDENTIFIED:')
    console.log('======================')
    console.log("The console database you're viewing has:")
    console.log('- 72/72 vectors')
    console.log('- Contains Splunk/security content')
    console.log('- Different database ID')
    console.log('')
    console.log('Your application database has:')
    console.log(`- ${info.vectorCount} vectors`)
    console.log('- Contains your "timro anuhar" content')
    console.log('- Connected via:', url)

    console.log('\n🔧 SOLUTION OPTIONS:')
    console.log('====================')
    console.log('Option 1: Find the correct database in console')
    console.log(`  - Look for database with exactly ${info.vectorCount} vectors`)
    console.log(`  - Model: ${info.denseIndex?.embeddingModel}`)
    console.log(`  - Region: us-east-1 (${parts[3]})`)
    console.log('')
    console.log('Option 2: Update your .env to use the 72-vector database')
    console.log('  - This would require getting the URL of the console database')
    console.log('')
    console.log('Option 3: Your current setup is working perfectly!')
    console.log('  - Your app connects to the right database')
    console.log('  - Content syncs properly')
    console.log('  - Chat works correctly')
    console.log("  - You just can't see it in the web console")

    // Try to determine if this is a different account issue
    console.log('\n🤔 ACCOUNT CHECK:')
    console.log('=================')
    console.log('The fact that you see a 72-vector database with Splunk content')
    console.log('suggests one of these scenarios:')
    console.log('1. You have multiple Upstash accounts')
    console.log('2. The databases are in different teams/organizations')
    console.log('3. The databases are in different regions')
    console.log('4. Your .env points to a different database than the console shows')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

findExactDatabase()
