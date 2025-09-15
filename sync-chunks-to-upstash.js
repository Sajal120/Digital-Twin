// Check PayloadCMS Content Chunks and sync with Upstash
import { getPayload } from 'payload'
import configPromise from './src/payload.config.ts'
import { Index } from '@upstash/vector'

async function syncContentChunksToUpstash() {
  try {
    console.log('Initializing Payload and Upstash...')

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Initialize Upstash Vector client
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    console.log('Fetching Content Chunks from PayloadCMS...')

    // Get all active content chunks
    const { docs: chunks } = await payload.find({
      collection: 'content-chunks',
      where: {
        active: {
          equals: true,
        },
      },
      limit: 100,
    })

    console.log(`Found ${chunks.length} active content chunks in PayloadCMS:`)

    chunks.forEach((chunk) => {
      console.log(`- ${chunk.title}: "${chunk.keywords}" -> "${chunk.content.substring(0, 80)}..."`)
    })

    if (chunks.length === 0) {
      console.log('No active content chunks found in PayloadCMS.')
      console.log('You can add them via: http://localhost:3000/admin/collections/content-chunks')
      return
    }

    console.log('\nSyncing to Upstash Vector database...')

    // Sync each chunk to Upstash
    for (const chunk of chunks) {
      try {
        const vectorId = `cms_chunk_${chunk.id}`

        console.log(`Syncing "${chunk.title}" to Upstash...`)

        // Upsert to Upstash with the content as data and metadata
        await index.upsert({
          id: vectorId,
          data: chunk.content, // This will be embedded by Upstash
          metadata: {
            source: 'payloadcms',
            title: chunk.title,
            keywords: chunk.keywords,
            content: chunk.content,
            answer: chunk.content, // For easy retrieval
            chunk_id: chunk.id,
            created_at: chunk.createdAt,
            priority: chunk.priority || 1,
          },
        })

        console.log(`✓ Synced "${chunk.title}"`)
      } catch (error) {
        console.error(`✗ Failed to sync "${chunk.title}":`, error.message)
      }
    }

    console.log('\n✅ Sync completed!')
    console.log('Your PayloadCMS Content Chunks are now available in Upstash vector search.')
  } catch (error) {
    console.error('Sync failed:', error)
  }
}

syncContentChunksToUpstash()
