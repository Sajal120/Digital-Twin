import { NextRequest, NextResponse } from 'next/server'
import { EmbeddingManager } from '@/utilities/embeddingManager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, chunkIds } = body

    const embeddingManager = EmbeddingManager.getInstance()

    switch (operation) {
      case 'regenerate_all':
        const allResult = await embeddingManager.regenerateAllEmbeddings()
        return NextResponse.json(allResult)

      case 'bulk_process':
        if (!chunkIds || !Array.isArray(chunkIds)) {
          return NextResponse.json(
            { error: 'chunkIds array is required for bulk processing' },
            { status: 400 },
          )
        }
        const bulkResult = await embeddingManager.bulkProcessContentChunks(chunkIds)
        return NextResponse.json(bulkResult)

      case 'single_process':
        const { chunkId } = body
        if (!chunkId) {
          return NextResponse.json(
            { error: 'chunkId is required for single processing' },
            { status: 400 },
          )
        }
        const success = await embeddingManager.processContentChunk(chunkId)
        return NextResponse.json({ success })

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported: regenerate_all, bulk_process, single_process' },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('Embedding operation error:', error)
    return NextResponse.json({ error: 'Failed to process embedding operation' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const operation = url.searchParams.get('operation')
    const query = url.searchParams.get('query')
    const limit = parseInt(url.searchParams.get('limit') || '5')

    const embeddingManager = EmbeddingManager.getInstance()

    switch (operation) {
      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'query parameter is required for search' },
            { status: 400 },
          )
        }
        const results = await embeddingManager.searchSimilarContent(query, limit)
        return NextResponse.json(results)

      default:
        return NextResponse.json({ error: 'Invalid operation. Supported: search' }, { status: 400 })
    }
  } catch (error) {
    console.error('Embedding search error:', error)
    return NextResponse.json({ error: 'Failed to process embedding search' }, { status: 500 })
  }
}
