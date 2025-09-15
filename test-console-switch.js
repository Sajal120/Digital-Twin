// Test connection to console database and sync content
import pkg from 'pg'
const { Client } = pkg
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function switchToConsoleDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URI,
  })

  try {
    console.log('🔄 SWITCHING TO CONSOLE DATABASE')
    console.log('===============================')

    console.log('📋 NEW DATABASE CONFIGURATION:')
    console.log('URL:', process.env.UPSTASH_VECTOR_REST_URL)
    console.log('Token length:', process.env.UPSTASH_VECTOR_REST_TOKEN?.length)
    console.log('')

    // Test connection to new database
    console.log('🔗 Testing connection to console database...')
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Get database info
    const info = await index.info()
    console.log('✅ Connected successfully!')
    console.log('Vector Count:', info.vectorCount)
    console.log('Model:', info.denseIndex?.embeddingModel)
    console.log('Dimensions:', info.dimension)
    console.log('')

    // Test search for your content
    console.log('🔍 Testing search for your content...')
    const searchResults = await index.query({
      data: 'timro anuhar',
      topK: 5,
      includeMetadata: true,
    })

    if (searchResults && searchResults.length > 0) {
      console.log('✅ Found existing content in console database:')
      searchResults.forEach((result, i) => {
        console.log(
          `  ${i + 1}. ${result.id} - "${result.metadata?.title}" (Score: ${result.score.toFixed(3)})`,
        )
      })
      console.log('\n🎉 Your "timro anuhar" content is already in the console database!')
      console.log('🎯 You should now be able to search for it in the Upstash console!')
    } else {
      console.log('❌ Your content not found. Need to sync from PayloadCMS.')

      // Connect to database and sync content
      console.log('\n📋 Syncing content from PayloadCMS...')
      await client.connect()

      const result = await client.query(`
        SELECT * FROM content_chunks 
        WHERE is_active = true 
        ORDER BY priority DESC, created_at DESC
      `)

      const chunks = result.rows
      console.log(`Found ${chunks.length} chunks to sync`)

      let syncedCount = 0
      for (const chunk of chunks) {
        try {
          const vectorId = `cms_chunk_${chunk.id}`

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
          console.log(`✅ Synced: ${vectorId} - "${chunk.title}"`)
        } catch (error) {
          console.error(`❌ Failed to sync "${chunk.title}":`, error.message)
        }
      }

      console.log(`\n📊 Synced ${syncedCount} chunks to console database`)
    }

    // Final verification
    console.log('\n🧪 FINAL VERIFICATION:')
    console.log('======================')

    const finalTest = await index.query({
      data: 'timro anuhar',
      topK: 3,
      includeMetadata: true,
    })

    if (finalTest && finalTest.length > 0 && finalTest[0].metadata?.title === 'timro anuhar') {
      console.log('✅ SUCCESS! Your content is now in the console database!')
      console.log(
        `✅ Found "${finalTest[0].metadata?.title}" with score ${finalTest[0].score.toFixed(3)}`,
      )
      console.log('')
      console.log('🎯 NOW TRY IN YOUR CONSOLE:')
      console.log('===========================')
      console.log('1. Go to sajal-portfolio-vectors → Data Browser')
      console.log('2. Search for "timro anuhar"')
      console.log('3. You should see cms_chunk_9 as the first result!')
      console.log('')
      console.log('🔄 Your application is now using the console database!')
    } else {
      console.log('❌ Something went wrong. Your content may not have synced properly.')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (client._connected) {
      await client.end()
    }
  }
}

switchToConsoleDatabase()
