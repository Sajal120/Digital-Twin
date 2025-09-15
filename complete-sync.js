// Complete vector database sync solution
import { getPayload } from 'payload'
import configPromise from './src/payload.config.ts'
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function completeDatabaseSync() {
  try {
    console.log('🔄 COMPLETE DATABASE SYNCHRONIZATION')
    console.log('===================================')

    // Initialize Payload and Upstash
    console.log('Initializing Payload CMS...')
    const payload = await getPayload({ config: configPromise })

    console.log('Initializing Upstash Vector client...')
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Get current database info
    const info = await index.info()
    console.log('\n📊 Current Upstash Database:')
    console.log('Vector Count:', info.vectorCount)
    console.log('Model:', info.denseIndex?.embeddingModel)
    console.log('')

    // Get ALL content chunks from PayloadCMS
    console.log('📋 Fetching ALL Content Chunks from PayloadCMS...')
    const { docs: allChunks } = await payload.find({
      collection: 'content-chunks',
      limit: 1000, // Get all chunks
      where: {
        isActive: {
          equals: true,
        },
      },
    })

    console.log(`Found ${allChunks.length} active content chunks in PayloadCMS`)

    if (allChunks.length === 0) {
      console.log('❌ No active content chunks found in PayloadCMS!')
      return
    }

    // Show all chunks
    console.log('\n📝 ALL CONTENT CHUNKS:')
    console.log('=====================')
    allChunks.forEach((chunk, i) => {
      console.log(`${i + 1}. ${chunk.id} - "${chunk.title}"`)
      console.log(`   Content: "${chunk.content?.substring(0, 50)}..."`)
      console.log(`   Source: ${chunk.source}`)
      console.log(`   Type: ${chunk.chunkType}`)
      console.log('')
    })

    // Sync all chunks to Upstash
    console.log('🚀 SYNCING ALL CHUNKS TO UPSTASH...')
    console.log('==================================')

    let syncedCount = 0
    let errorCount = 0

    for (const chunk of allChunks) {
      try {
        const vectorId = `cms_chunk_${chunk.id}`

        console.log(`Syncing: ${vectorId} - "${chunk.title}"`)

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
            chunk_type: chunk.chunkType,
            data_source: chunk.source,
            keywords: chunk.keywords?.map((k) => k.keyword) || [],
            created_at: chunk.createdAt,
            updated_at: chunk.updatedAt,
            priority: chunk.priority || 1,
            auto_synced: true,
            sync_timestamp: new Date().toISOString(),
          },
        })

        syncedCount++
        console.log(`✅ Synced: ${vectorId}`)
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
    console.log(`📋 Total chunks processed: ${allChunks.length}`)

    // Check new vector count
    console.log('\n🔍 CHECKING UPDATED DATABASE...')
    const updatedInfo = await index.info()
    console.log('New Vector Count:', updatedInfo.vectorCount)

    // Test search after sync
    console.log('\n🧪 TESTING SEARCH AFTER SYNC...')
    const testResults = await index.query({
      data: 'timro anuhar',
      topK: 3,
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
    console.log('Your database should now have all your PayloadCMS content.')
    console.log('Try searching in the Upstash console for "timro anuhar" now!')
  } catch (error) {
    console.error('❌ Sync failed:', error.message)
    console.error(error.stack)
  }
}

completeDatabaseSync()
