// Get specific vectors and content to test in Upstash console
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function getTestVectors() {
  try {
    console.log('🧪 SPECIFIC VECTORS TO TEST IN UPSTASH CONSOLE')
    console.log('============================================')

    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Get specific vectors to test
    const testIds = ['cms_chunk_9', 'cms_chunk_8', 'cms_chunk_7', 'cms_chunk_6', 'cms_chunk_2']

    console.log('📋 VECTORS TO LOOK FOR IN CONSOLE:')
    console.log('=================================')

    for (const id of testIds) {
      try {
        // Search for content that should return this specific vector
        const searchResults = await index.query({
          data: id.includes('9')
            ? 'timro anuhar'
            : id.includes('8')
              ? 'aaaa'
              : id.includes('7')
                ? 'nepali vasa'
                : id.includes('6')
                  ? 'mero naam'
                  : 'sajal',
          topK: 5,
          includeMetadata: true,
        })

        // Find this specific vector in results
        const thisVector = searchResults.find((r) => r.id === id)
        if (thisVector) {
          console.log(`✅ Vector ID: ${id}`)
          console.log(`   📝 Title: "${thisVector.metadata?.title}"`)
          console.log(`   💬 Content: "${thisVector.metadata?.content}"`)
          console.log(`   🔍 Search for: "${thisVector.metadata?.title}"`)
          console.log(`   📊 Expected Score: ~${thisVector.score.toFixed(3)}`)
          console.log('')
        }
      } catch (error) {
        console.log(`❌ ${id}: Error getting vector`)
      }
    }

    console.log('🎯 TEST THESE SEARCHES IN UPSTASH CONSOLE:')
    console.log('=========================================')
    console.log('Go to Data Browser → "By Data" search box → try these:')
    console.log('')

    const testSearches = [
      { term: 'timro anuhar', expectId: 'cms_chunk_9', expectTitle: 'timro anuhar' },
      { term: 'ramro xa', expectId: 'cms_chunk_9', expectTitle: 'timro anuhar' },
      { term: 'aaaa', expectId: 'cms_chunk_8', expectTitle: 'aaaa' },
      { term: 'nepali vasa', expectId: 'cms_chunk_7', expectTitle: 'nepali vasa' },
      { term: 'sajal', expectId: 'cms_chunk_2', expectTitle: 'Personal Identity' },
      { term: 'mero naam', expectId: 'cms_chunk_6', expectTitle: 'nepali convo' },
    ]

    testSearches.forEach((test, i) => {
      console.log(`${i + 1}. Search: "${test.term}"`)
      console.log(`   → Should return: ${test.expectId}`)
      console.log(`   → With title: "${test.expectTitle}"`)
      console.log('')
    })

    console.log('🔬 MANUAL VERIFICATION:')
    console.log('======================')
    console.log('If the searches work, you should see results that look like:')
    console.log('┌─────────────────┬─────────┬──────────────────┐')
    console.log('│ ID              │ Score   │ Title            │')
    console.log('├─────────────────┼─────────┼──────────────────┤')
    console.log('│ cms_chunk_9     │ 0.845   │ timro anuhar     │')
    console.log('│ cms_chunk_8     │ 0.707   │ aaaa             │')
    console.log('│ cms_chunk_7     │ 0.706   │ nepali vasa      │')
    console.log('└─────────────────┴─────────┴──────────────────┘')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

getTestVectors()
