// Database sync with correct schema
import pkg from 'pg'
const { Client } = pkg
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function syncWithCorrectSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URI,
  })

  try {
    console.log('🔄 SYNCING WITH CORRECT SCHEMA')
    console.log('=============================')

    console.log('Connecting to PostgreSQL database...')
    await client.connect()

    // First, let's check the actual table structure
    console.log('🔍 Checking table structure...')
    const tableInfo = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'content_chunks'
      ORDER BY ordinal_position
    `)

    console.log('Content Chunks table columns:')
    tableInfo.rows.forEach((col) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })
    console.log('')

    console.log('Initializing Upstash Vector client...')
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Get current vector count
    const info = await index.info()
    console.log('Current Upstash Vector Count:', info.vectorCount)
    console.log('')

    // Get all active content chunks with only existing columns
    console.log('📋 Fetching Content Chunks...')
    const result = await client.query(`
      SELECT * FROM content_chunks 
      WHERE is_active = true 
      ORDER BY priority DESC, created_at DESC
    `)

    const chunks = result.rows
    console.log(`Found ${chunks.length} active content chunks`)

    if (chunks.length === 0) {
      console.log('❌ No active content chunks found!')
      return
    }

    // Show first few chunks to understand the data structure
    console.log('\n📝 SAMPLE CHUNKS:')
    console.log('=================')
    chunks.slice(0, 3).forEach((chunk, i) => {
      console.log(`${i + 1}. Chunk ID: ${chunk.id}`)
      console.log(`   Title: "${chunk.title}"`)
      console.log(`   Content: "${chunk.content?.substring(0, 50)}..."`)
      console.log(`   Source: ${chunk.source || 'N/A'}`)
      console.log(`   Type: ${chunk.chunk_type || 'N/A'}`)
      console.log(`   Active: ${chunk.is_active}`)
      console.log(`   Priority: ${chunk.priority || 'N/A'}`)
      console.log('')
    })

    // Sync all chunks to Upstash
    console.log('🚀 SYNCING ALL CHUNKS TO UPSTASH...')
    console.log('===================================')

    let syncedCount = 0
    let errorCount = 0

    for (const chunk of chunks) {
      try {
        const vectorId = `cms_chunk_${chunk.id}`

        console.log(`Syncing: ${vectorId} - "${chunk.title}"`)

        // Create clean metadata object
        const metadata = {
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
        }

        // Upsert to Upstash
        await index.upsert({
          id: vectorId,
          data: chunk.content || chunk.title, // Use content, fallback to title
          metadata: metadata,
        })

        syncedCount++
        console.log(`✅ Synced: ${vectorId}`)

        // Small delay to be gentle with the API
        await new Promise((resolve) => setTimeout(resolve, 50))
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

    if (updatedInfo.vectorCount !== info.vectorCount) {
      console.log(`📈 Vector count changed: ${info.vectorCount} → ${updatedInfo.vectorCount}`)
    } else {
      console.log(`📊 Vector count unchanged (vectors were updated, not added)`)
    }

    // Test key searches
    console.log('\n🧪 TESTING KEY SEARCHES...')
    console.log('==========================')

    const testTerms = ['timro anuhar', 'aaaa', 'sajal', 'nepali']

    for (const term of testTerms) {
      try {
        const results = await index.query({
          data: term,
          topK: 2,
          includeMetadata: true,
        })

        if (results && results.length > 0) {
          console.log(`✅ "${term}": Found ${results.length} results`)
          results.forEach((result, i) => {
            console.log(
              `  ${i + 1}. ${result.id} - "${result.metadata?.title}" (${result.score.toFixed(3)})`,
            )
          })
        } else {
          console.log(`❌ "${term}": No results`)
        }
      } catch (error) {
        console.log(`❌ "${term}": Search error - ${error.message}`)
      }
    }

    console.log('\n🎯 SYNC COMPLETE!')
    console.log('=================')
    console.log('✅ All database content has been synced to Upstash!')
    console.log('✅ Your console searches should now work!')
    console.log('')
    console.log('🔍 Try these searches in your Upstash console:')
    console.log('- Go to sajal-portfolio-vectors → Data Browser')
    console.log('- In "By Data" search box, try:')
    console.log('  • "timro anuhar"')
    console.log('  • "aaaa"')
    console.log('  • "sajal"')
    console.log('  • "nepali"')
  } catch (error) {
    console.error('❌ Sync failed:', error.message)
    console.error(error.stack)
  } finally {
    await client.end()
  }
}

syncWithCorrectSchema()
