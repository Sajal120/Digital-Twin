// Test the new console database explicitly
import { Index } from '@upstash/vector'

async function testNewDatabase() {
  try {
    console.log('🔄 TESTING NEW CONSOLE DATABASE')
    console.log('==============================')

    const newUrl = 'https://massive-martin-33486-us1-vector.upstash.io'
    const newToken =
      'ABgFMG1hc3NpdmUtbWFydGluLTMzNDg2LXVzMWFkbWluWlRVNE1XVTNaV010TW1abFppMDBNRFV5TFRreE1HUXRaREkzWlRrNU1HTmtNVE14'

    console.log('🔗 Connecting to:', newUrl)
    console.log('Token length:', newToken.length)
    console.log('')

    // Connect to the new database
    const index = new Index({
      url: newUrl,
      token: newToken,
    })

    // Get database info
    console.log('📊 Getting database info...')
    const info = await index.info()
    console.log('✅ Connected successfully!')
    console.log('Vector Count:', info.vectorCount, '(Should be 72!)')
    console.log('Model:', info.denseIndex?.embeddingModel)
    console.log('Dimensions:', info.dimension)
    console.log('')

    if (info.vectorCount === 72) {
      console.log('🎉 SUCCESS! Connected to the 72-vector console database!')

      // Test search
      console.log('🔍 Testing search for "timro anuhar"...')
      const searchResults = await index.query({
        data: 'timro anuhar',
        topK: 5,
        includeMetadata: true,
      })

      if (searchResults && searchResults.length > 0) {
        console.log('✅ Search results:')
        searchResults.forEach((result, i) => {
          console.log(
            `  ${i + 1}. ${result.id} - "${result.metadata?.title}" (${result.score.toFixed(3)})`,
          )
        })

        // Check if we found your content
        const yourContent = searchResults.find(
          (r) => r.metadata?.title === 'timro anuhar' || r.id === 'cms_chunk_9',
        )

        if (yourContent) {
          console.log('\n🎯 PERFECT! Your content is already in this database!')
          console.log('You should now be able to search for it in the console!')
        } else {
          console.log('\n📥 Need to sync your content to this database...')
          // We'll sync in the next step
        }
      } else {
        console.log('❌ No search results found')
      }
    } else {
      console.log('❌ This database has', info.vectorCount, 'vectors, not 72')
      console.log('❌ This might not be the right database')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\nPossible issues:')
    console.log('- Wrong URL or token')
    console.log("- Database doesn't exist")
    console.log('- Network/permission issues')
  }
}

testNewDatabase()
