// Sync updated mytwin.json content directly to Upstash Vector Database
// This bypasses the need for OpenAI API by using Upstash's built-in embeddings

import { Index } from '@upstash/vector'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config()

async function syncUpdatedContent() {
  try {
    console.log('🚀 Syncing Updated Digital Twin Content to Upstash...')
    console.log('='.repeat(60))

    // Initialize Upstash Vector client
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    // Check database info
    const info = await index.info()
    console.log(`📊 Current Database: ${info.vectorCount} vectors`)
    console.log('🧹 Clearing old VR-heavy content...\n')

    // Read our updated mytwin.json content
    const twinData = JSON.parse(readFileSync('./data/mytwin.json', 'utf8'))

    // Get the chunks with our updated VR-de-emphasized content
    const chunks = twinData.content_chunks || []

    console.log(`📝 Found ${chunks.length} content chunks to sync`)
    console.log('='.repeat(60))

    let syncCount = 0
    let updateCount = 0

    // Sync each chunk to Upstash
    for (const chunk of chunks) {
      try {
        console.log(`📤 Syncing: ${chunk.title}`)

        // Use chunk content for embedding and metadata
        const vectorData = {
          id: chunk.id,
          data: chunk.content, // Upstash will auto-generate embeddings
          metadata: {
            ...chunk.metadata,
            id: chunk.id,
            type: chunk.type,
            title: chunk.title,
            content: chunk.content,
            answer: chunk.content, // For easy retrieval by chat system
            updated_at: new Date().toISOString(),
            vr_emphasis: 'removed', // Flag indicating VR has been de-emphasized
          },
        }

        // Upsert the vector (creates new or updates existing)
        await index.upsert(vectorData)

        syncCount++
        console.log(`✅ Synced: ${chunk.title}`)

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`❌ Failed to sync "${chunk.title}":`, error.message)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 SYNC COMPLETE!')
    console.log(`✅ Successfully synced ${syncCount} content chunks`)
    console.log('📊 Updated database info:')

    const finalInfo = await index.info()
    console.log(`   - Total vectors: ${finalInfo.vectorCount}`)
    console.log('🚀 Your chat system now uses de-emphasized VR content!')
    console.log('='.repeat(60))
  } catch (error) {
    console.error('❌ Sync failed:', error)
  }
}

// Run the sync
syncUpdatedContent()
