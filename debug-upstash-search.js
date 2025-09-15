// Debug the exact search terms and check database content
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function debugUpstashSearch() {
  try {
    console.log('🔍 DEBUGGING UPSTASH SEARCH ISSUE')
    console.log('================================')

    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Check database info
    const info = await index.info()
    console.log('📊 Database Info:')
    console.log('Vector Count:', info.vectorCount)
    console.log('Model:', info.denseIndex?.embeddingModel)
    console.log('')

    // Test the exact search terms from your console
    console.log('🧪 TESTING YOUR EXACT SEARCHES:')
    console.log('==============================')

    const searches = [
      'anuhar', // What you typed in console
      'timro anuhar', // Full term
      'timro', // Just first part
      'ramro xa', // Content
      'aaaa', // Simple test
    ]

    for (const searchTerm of searches) {
      console.log(`\n🔍 Searching for: "${searchTerm}"`)
      try {
        const results = await index.query({
          data: searchTerm,
          topK: 3,
          includeMetadata: true,
        })

        if (results && results.length > 0) {
          console.log(`✅ Found ${results.length} results:`)
          results.forEach((result, i) => {
            console.log(`  ${i + 1}. ID: ${result.id}`)
            console.log(`     Score: ${result.score.toFixed(3)}`)
            console.log(`     Title: "${result.metadata?.title || 'No title'}"`)
            console.log(`     Content: "${result.metadata?.content?.substring(0, 50)}..."`)
            console.log('')
          })
        } else {
          console.log('❌ No results found')
        }
      } catch (error) {
        console.log(`❌ Error searching: ${error.message}`)
      }
    }

    // Check if cms_chunk_9 exists
    console.log('🔬 CHECKING SPECIFIC VECTORS:')
    console.log('============================')

    try {
      const specificVector = await index.fetch(['cms_chunk_9'])
      if (specificVector && specificVector.length > 0) {
        console.log('✅ cms_chunk_9 exists in database')
      } else {
        console.log('❌ cms_chunk_9 NOT found in database')
      }
    } catch (error) {
      console.log('❌ Error fetching cms_chunk_9:', error.message)
    }

    // Try to find any vectors that contain "timro"
    console.log('\n🔍 SEARCHING FOR ANY VECTORS WITH NEPALI CONTENT:')
    console.log('==============================================')

    const nepaliTerms = ['nepali', 'mero', 'naam', 'ho', 'sajal', 'ramro']

    for (const term of nepaliTerms) {
      const results = await index.query({
        data: term,
        topK: 2,
        includeMetadata: true,
      })

      if (results && results.length > 0) {
        const hasNepali = results.find(
          (r) =>
            r.metadata?.content?.toLowerCase().includes('timro') ||
            r.metadata?.title?.toLowerCase().includes('timro'),
        )

        if (hasNepali) {
          console.log(`✅ Found Nepali content via "${term}":`)
          console.log(`   ID: ${hasNepali.id}`)
          console.log(`   Title: "${hasNepali.metadata?.title}"`)
          console.log(`   Content: "${hasNepali.metadata?.content}"`)
          break
        }
      }
    }
  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

debugUpstashSearch()
