// Sync your PayloadCMS content to the 72-vector console database
import pkg from 'pg'
const { Client } = pkg
import { Index } from '@upstash/vector'

async function syncToConsoleDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URI,
  })

  try {
    console.log('🚀 SYNCING TO CONSOLE DATABASE')
    console.log('=============================')

    // Connect to console database
    const consoleUrl = 'https://massive-martin-33486-us1-vector.upstash.io'
    const consoleToken =
      'ABgFMG1hc3NpdmUtbWFydGluLTMzNDg2LXVzMWFkbWluWlRVNE1XVTNaV010TW1abFppMDBNRFV5TFRreE1HUXRaREkzWlRrNU1HTmtNVE14'

    console.log('🔗 Connecting to console database...')
    const index = new Index({
      url: consoleUrl,
      token: consoleToken,
    })

    const info = await index.info()
    console.log('✅ Connected! Vector count before sync:', info.vectorCount)
    console.log('')

    // Get your content from PayloadCMS database
    console.log('📋 Getting your content from PayloadCMS...')
    await client.connect()

    const result = await client.query(`
      SELECT * FROM content_chunks 
      WHERE is_active = true 
      ORDER BY priority DESC, created_at DESC
    `)

    const chunks = result.rows
    console.log(`Found ${chunks.length} content chunks to sync`)
    console.log('')

    if (chunks.length === 0) {
      console.log('❌ No content found to sync!')
      return
    }

    // Show what we're syncing
    console.log('📝 CONTENT TO SYNC:')
    console.log('==================')
    chunks.forEach((chunk, i) => {
      console.log(`${i + 1}. "${chunk.title}" (ID: ${chunk.id})`)
      console.log(`   Content: "${chunk.content?.substring(0, 50)}..."`)
      console.log('')
    })

    // Sync each chunk
    console.log('🔄 SYNCING TO CONSOLE DATABASE...')
    console.log('=================================')

    let syncedCount = 0
    let errorCount = 0

    for (const chunk of chunks) {
      try {
        const vectorId = `cms_chunk_${chunk.id}`

        console.log(`Syncing: ${vectorId} - "${chunk.title}"`)

        // Upsert to console database
        await index.upsert({
          id: vectorId,
          data: chunk.content || chunk.title,
          metadata: {
            source: 'payloadcms',
            title: chunk.title || 'Untitled',
            content: chunk.content || '',
            answer: chunk.content || '',
            chunk_id: chunk.id,
            chunk_type: chunk.chunk_type || 'conversational',
            data_source: chunk.source || 'custom',
            created_at: chunk.created_at,
            updated_at: chunk.updated_at,
            priority: chunk.priority || 1,
            auto_synced: true,
            sync_timestamp: new Date().toISOString(),
          },
        })

        syncedCount++
        console.log(`✅ Synced: ${vectorId}`)

        // Small delay to be gentle
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        errorCount++
        console.error(`❌ Failed to sync "${chunk.title}":`, error.message)
      }
    }

    console.log('\n📊 SYNC RESULTS:')
    console.log('================')
    console.log(`✅ Successfully synced: ${syncedCount} chunks`)
    console.log(`❌ Failed to sync: ${errorCount} chunks`)

    // Check updated vector count
    const updatedInfo = await index.info()
    console.log(`📈 Vector count: ${info.vectorCount} → ${updatedInfo.vectorCount}`)

    // Test search for your content
    console.log('\n🧪 TESTING SEARCH AFTER SYNC:')
    console.log('=============================')

    const testTerms = ['timro anuhar', 'sajal', 'aaaa']

    for (const term of testTerms) {
      try {
        const results = await index.query({
          data: term,
          topK: 3,
          includeMetadata: true,
        })

        console.log(`\n🔍 Search "${term}":`)
        if (results && results.length > 0) {
          results.forEach((result, i) => {
            console.log(
              `  ${i + 1}. ${result.id} - "${result.metadata?.title}" (${result.score.toFixed(3)})`,
            )
          })

          // Check for your specific content
          const yourContent = results.find((r) => r.id?.startsWith('cms_chunk_'))
          if (yourContent) {
            console.log(`  🎯 Found your content: ${yourContent.id}`)
          }
        } else {
          console.log('  ❌ No results')
        }
      } catch (error) {
        console.log(`  ❌ Search error: ${error.message}`)
      }
    }

    console.log('\n🎉 SYNC COMPLETE!')
    console.log('=================')
    console.log('✅ Your content has been synced to the console database!')
    console.log('✅ Updated your .env to use the console database!')
    console.log('')
    console.log('🔍 NOW TRY IN YOUR UPSTASH CONSOLE:')
    console.log('===================================')
    console.log('1. Go to sajal-portfolio-vectors → Data Browser')
    console.log('2. Search for "timro anuhar"')
    console.log('3. You should see cms_chunk_9 in the results!')
    console.log('')
    console.log('🎯 Your app and console are now using the same database!')
  } catch (error) {
    console.error('❌ Sync failed:', error.message)
    console.error(error.stack)
  } finally {
    if (client._connected) {
      await client.end()
    }
  }
}

syncToConsoleDatabase()
