// Test to show exactly what content should be searchable in Upstash console
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function showSearchableContent() {
  try {
    console.log('🔍 UPSTASH CONSOLE SEARCH GUIDE')
    console.log('=====================================')

    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Test various search terms that should work in Upstash console
    const searchTerms = ['timro anuhar', 'ramro xa', 'nepali', 'aaaa', 'sajal', 'mero naam']

    console.log('\n📝 TRY THESE SEARCHES IN YOUR UPSTASH CONSOLE:')
    console.log(
      'Go to: https://console.upstash.com/vector/361687cd-d05e-4885-ad1e-065f0ca78ed/databrowser',
    )
    console.log('In the "By Data" search box, try these terms:\n')

    for (const term of searchTerms) {
      console.log(`🔍 Search term: "${term}"`)

      const results = await index.query({
        data: term,
        topK: 3,
        includeMetadata: true,
      })

      if (results && results.length > 0) {
        console.log(`   ✅ Should return ${results.length} results:`)
        results.forEach((result, i) => {
          console.log(
            `      ${i + 1}. ID: ${result.id} | Score: ${result.score.toFixed(3)} | Title: ${result.metadata?.title}`,
          )
        })
      } else {
        console.log(`   ❌ No results found`)
      }
      console.log('')
    }

    console.log('\n🔧 TROUBLESHOOTING:')
    console.log('1. Make sure you are in the DATA BROWSER tab (not Overview)')
    console.log('2. Use the "By Data" search box (not "By Metadata")')
    console.log('3. Try searching for content words like "timro", "ramro", "nepali"')
    console.log('4. DON\'T search for IDs like "cms_chunk_9" - that won\'t work')
    console.log('')

    console.log('📊 DATABASE STATUS:')
    const info = await index.info()
    console.log(`   Total Vectors: ${info.vectorCount}`)
    console.log(`   Embedding Model: ${info.denseIndex?.embeddingModel}`)
    console.log(`   Similarity Function: ${info.similarityFunction}`)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

showSearchableContent()
