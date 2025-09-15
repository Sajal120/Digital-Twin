// Auto-sync hook for PayloadCMS Content Chunks
import type { CollectionAfterChangeHook } from 'payload'
import { Index } from '@upstash/vector'

const syncToUpstash: CollectionAfterChangeHook = async ({
  doc, // The document that was changed
  req, // Full Express request object
  operation, // 'create' | 'update'
}) => {
  try {
    // Only sync if the chunk is active
    if (!doc.is_active) {
      console.log(`Skipping sync for inactive chunk: ${doc.title}`)
      return doc
    }

    console.log(`Auto-syncing "${doc.title}" to Upstash after ${operation}...`)

    // Initialize Upstash Vector client
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    })

    const vectorId = `cms_chunk_${doc.id}`

    // Upsert to Upstash
    await index.upsert({
      id: vectorId,
      data: doc.content, // This will be embedded by Upstash
      metadata: {
        source: 'payloadcms',
        title: doc.title,
        content: doc.content,
        answer: doc.content, // For easy retrieval in chat
        chunk_id: doc.id,
        chunk_type: doc.chunk_type,
        data_source: doc.source,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        priority: doc.priority || 1,
        auto_synced: true,
      },
    })

    console.log(`✓ Auto-synced "${doc.title}" to Upstash`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`✗ Failed to auto-sync "${doc.title}" to Upstash:`, errorMessage)
    // Don't fail the save operation if sync fails
  }

  return doc
}

export default syncToUpstash
