// Simple sync script using direct database access
import pkg from 'pg'
const { Client } = pkg
import { Index } from '@upstash/vector'

async function syncContentChunksToUpstash() {
  const client = new Client({
    connectionString: process.env.DATABASE_URI,
  })

  try {
    console.log('Connecting to database...')
    await client.connect()

    console.log('Initializing Upstash Vector client...')
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    console.log('Fetching Content Chunks from database...')

    // Query content chunks directly from database
    const result = await client.query(`
      SELECT id, title, content, source, chunk_type, priority, is_active, created_at
      FROM content_chunks 
      WHERE is_active = true
      ORDER BY priority DESC, created_at DESC
    `)

    const chunks = result.rows

    console.log(`Found ${chunks.length} active content chunks in database:`)

    if (chunks.length === 0) {
      console.log('No active content chunks found.')
      console.log('Add them via: http://localhost:3000/admin/collections/content-chunks')
      return
    }

    chunks.forEach((chunk) => {
      console.log(
        `- ${chunk.title}: [${chunk.chunk_type}] -> "${chunk.content.substring(0, 80)}..."`,
      )
    })

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
            content: chunk.content,
            answer: chunk.content, // For easy retrieval in chat
            chunk_id: chunk.id,
            chunk_type: chunk.chunk_type,
            data_source: chunk.source,
            created_at: chunk.created_at,
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
    console.log('\nTesting vector search...')

    // Test the first chunk
    if (chunks.length > 0) {
      const testQuery = chunks[0].title
      console.log(`Testing search with: "${testQuery}"`)

      const searchResults = await index.query({
        data: testQuery,
        topK: 3,
        includeMetadata: true,
      })

      console.log('Search results:', JSON.stringify(searchResults, null, 2))
    }
  } catch (error) {
    console.error('Sync failed:', error)
  } finally {
    await client.end()
  }
}

syncContentChunksToUpstash()
