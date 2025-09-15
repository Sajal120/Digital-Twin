// Verify if sajal-portfolio-vectors is the correct database
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function verifyDatabase() {
  try {
    console.log('🔍 VERIFYING YOUR DATABASE CONNECTION')
    console.log('===================================')

    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Get current database info
    const info = await index.info()
    console.log('📊 YOUR ACTUAL DATABASE INFO:')
    console.log('URL:', process.env.UPSTASH_VECTOR_REST_URL)
    console.log('Vector Count:', info.vectorCount)
    console.log('Model:', info.denseIndex?.embeddingModel)
    console.log('Dimensions:', info.dimension)
    console.log('')

    // Test if this database contains your content
    console.log('🧪 TESTING FOR YOUR CONTENT:')
    console.log('============================')

    const searches = ['timro anuhar', 'aaaa', 'sajal', 'nepali']

    let foundContent = false

    for (const term of searches) {
      try {
        const results = await index.query({
          data: term,
          topK: 3,
          includeMetadata: true,
        })

        if (results && results.length > 0) {
          console.log(`✅ Search "${term}" found ${results.length} results:`)
          results.forEach((result, i) => {
            console.log(
              `  ${i + 1}. ID: ${result.id} | Score: ${result.score.toFixed(3)} | Title: "${result.metadata?.title}"`,
            )

            // Check for your specific content
            if (result.id === 'cms_chunk_9' || result.metadata?.title === 'timro anuhar') {
              console.log(`     🎯 FOUND YOUR CONTENT: ${result.id}`)
              foundContent = true
            }
          })
          console.log('')
        }
      } catch (error) {
        console.log(`❌ Error searching "${term}":`, error.message)
      }
    }

    // Try to fetch your specific vectors
    console.log('🎯 CHECKING SPECIFIC VECTORS:')
    console.log('=============================')

    const specificIds = ['cms_chunk_9', 'cms_chunk_8', 'cms_chunk_7', 'cms_chunk_6']

    for (const id of specificIds) {
      try {
        const vector = await index.fetch([id])
        if (vector && vector.length > 0) {
          console.log(`✅ Found ${id}: exists in database`)
          foundContent = true
        } else {
          console.log(`❌ ${id}: not found`)
        }
      } catch (error) {
        console.log(`❌ ${id}: error fetching`)
      }
    }

    console.log('\n🎯 CONCLUSION:')
    console.log('==============')

    if (foundContent) {
      console.log('✅ YES! This IS your correct database!')
      console.log('✅ sajal-portfolio-vectors contains your content')
      console.log('✅ The vector count difference might be due to:')
      console.log('   - Additional migrated content')
      console.log('   - System-generated vectors')
      console.log('   - Multiple sync operations')
      console.log('')
      console.log('🎯 YOUR SEARCHES SHOULD WORK IN THE CONSOLE!')
      console.log('Try searching in sajal-portfolio-vectors for:')
      console.log('- "timro anuhar"')
      console.log('- "aaaa"')
      console.log('- "sajal"')
    } else {
      console.log('❌ This database does NOT contain your content')
      console.log('❌ There might be a configuration issue')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

verifyDatabase()
