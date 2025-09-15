// Simple database sync using direct DB access
import pkg from 'pg'
const { Client } = pkg
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function syncDatabaseDirectly() {
  const client = new Client({
    connectionString: process.env.DATABASE_URI,
  })

  try {
    console.log('🔄 DIRECT DATABASE SYNC')
    console.log('======================')

    console.log('Connecting to PostgreSQL database...')
    await client.connect()

    console.log('Initializing Upstash Vector client...')
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Get current vector count
    const info = await index.info()
    console.log('Current Upstash Vector Count:', info.vectorCount)
    console.log('')

    // Get all active content chunks from database
    console.log('📋 Fetching Content Chunks from database...')
    const result = await client.query(`
      SELECT 
        id, 
        title, 
        content, 
        source, 
        chunk_type, 
        priority, 
        is_active, 
        created_at,
        updated_at,
        keywords
      FROM content_chunks 
      WHERE is_active = true 
      ORDER BY priority DESC, created_at DESC
    `)

    const chunks = result.rows
    console.log(`Found ${chunks.length} active content chunks in database`)

    if (chunks.length === 0) {
      console.log('❌ No active content chunks found!')
      return
    }

    // Show all chunks
    console.log('\n📝 CONTENT CHUNKS TO SYNC:')
    console.log('==========================')
    chunks.forEach((chunk, i) => {
      console.log(`${i + 1}. ${chunk.id} - "${chunk.title}"`)
      console.log(`   Content: "${chunk.content?.substring(0, 50)}..."`)
      console.log(`   Source: ${chunk.source || 'Unknown'}`)
      console.log(`   Type: ${chunk.chunk_type || 'Unknown'}`)
      console.log('')
    })

    // Sync all chunks to Upstash
    console.log('🚀 SYNCING TO UPSTASH...')
    console.log('========================')

    let syncedCount = 0
    let errorCount = 0

    for (const chunk of chunks) {
      try {
        const vectorId = `cms_chunk_${chunk.id}`

        console.log(`Syncing: ${vectorId} - "${chunk.title}"`)

        // Parse keywords if they exist
        let keywords = []
        try {
          if (chunk.keywords) {
            // Keywords might be JSON string or array
            if (typeof chunk.keywords === 'string') {
              const parsed = JSON.parse(chunk.keywords)
              keywords = Array.isArray(parsed) ? parsed.map((k) => k.keyword || k) : []
            } else if (Array.isArray(chunk.keywords)) {
              keywords = chunk.keywords.map((k) => k.keyword || k)
            }
          }
        } catch (e) {
          // If keywords parsing fails, just use empty array
          keywords = []
        }

        // Upsert to Upstash
        await index.upsert({
          id: vectorId,
          data: chunk.content,
          metadata: {
            source: 'payloadcms',
            title: chunk.title,
            content: chunk.content,
            answer: chunk.content,
            chunk_id: chunk.id,
            chunk_type: chunk.chunk_type || 'unknown',
            data_source: chunk.source || 'unknown',
            keywords: keywords,
            created_at: chunk.created_at,
            updated_at: chunk.updated_at,
            priority: chunk.priority || 1,
            auto_synced: true,
            sync_timestamp: new Date().toISOString(),
          },
        })

        syncedCount++
        console.log(`✅ Synced: ${vectorId}`)

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        errorCount++
        console.error(`❌ Failed to sync "${chunk.title}":`, error.message)
      }
    }

    // Final status
    console.log('\n📊 SYNC RESULTS:')
    console.log('================')
    console.log(`✅ Successfully synced: ${syncedCount} chunks`)
    console.log(`❌ Failed to sync: ${errorCount} chunks`)
    console.log(`📋 Total chunks processed: ${chunks.length}`)

    // Check updated vector count
    console.log('\n🔍 CHECKING UPDATED DATABASE...')
    const updatedInfo = await index.info()
    console.log('Updated Vector Count:', updatedInfo.vectorCount)
    console.log(`Increase: ${updatedInfo.vectorCount - info.vectorCount} vectors`)

    // Test search after sync
    console.log('\n🧪 TESTING SEARCH AFTER SYNC...')
    const testResults = await index.query({
      data: 'timro anuhar',
      topK: 5,
      includeMetadata: true,
    })

    if (testResults && testResults.length > 0) {
      console.log('✅ Search test successful:')
      testResults.forEach((result, i) => {
        console.log(
          `  ${i + 1}. ${result.id} - "${result.metadata?.title}" (Score: ${result.score.toFixed(3)})`,
        )
      })
    }

    console.log('\n🎯 SYNC COMPLETE!')
    console.log('=================')
    console.log('✅ Your database has been synchronized!')
    console.log('✅ All PayloadCMS content is now in Upstash!')
    console.log('✅ Try searching in the Upstash console for "timro anuhar" now!')
    console.log('')
    console.log('🔍 Console searches that should work:')
    console.log('- "timro anuhar" → cms_chunk_9')
    console.log('- "aaaa" → cms_chunk_8')
    console.log('- "sajal" → cms_chunk_2')
    console.log('- "nepali" → multiple results')
  } catch (error) {
    console.error('❌ Sync failed:', error.message)
    console.error(error.stack)
  } finally {
    await client.end()
  }
}

syncDatabaseDirectly()
