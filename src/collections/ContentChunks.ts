import type { CollectionConfig } from 'payload'
import { Index } from '@upstash/vector'

export const ContentChunks: CollectionConfig = {
  slug: 'content-chunks',
  labels: {
    singular: 'Content Chunk',
    plural: 'Content Chunks',
  },
  admin: {
    description: 'Manage AI content chunks with metadata and vector embeddings',
    defaultColumns: ['title', 'source', 'chunkType', 'lastEmbeddingUpdate'],
    useAsTitle: 'title',
    group: 'Portfolio Admin',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Descriptive title for this content chunk',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        description: 'The actual content text that gets embedded and searched',
        rows: 10,
      },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'Portfolio Data', value: 'portfolio_data' },
        { label: 'Experience', value: 'experience' },
        { label: 'Skills', value: 'skills' },
        { label: 'Projects', value: 'projects' },
        { label: 'Education', value: 'education' },
        { label: 'Achievements', value: 'achievements' },
        { label: 'About Me', value: 'about_me' },
        { label: 'Contact Info', value: 'contact_info' },
        { label: 'Custom Content', value: 'custom' },
        { label: 'FAQ', value: 'faq' },
      ],
    },
    {
      name: 'chunkType',
      type: 'select',
      required: true,
      options: [
        { label: 'Informational', value: 'informational' },
        { label: 'Conversational', value: 'conversational' },
        { label: 'Technical', value: 'technical' },
        { label: 'Personal', value: 'personal' },
        { label: 'Professional', value: 'professional' },
        { label: 'FAQ Answer', value: 'faq_answer' },
      ],
      defaultValue: 'informational',
    },
    {
      name: 'keywords',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'keyword',
          type: 'text',
          required: true,
        },
      ],
      admin: {
        description: 'Keywords that should trigger this content in chat responses',
      },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 5,
      min: 1,
      max: 10,
      admin: {
        description: 'Priority for search results (1 = lowest, 10 = highest)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this chunk should be used in chat responses',
      },
    },
    {
      name: 'embedding',
      type: 'group',
      fields: [
        {
          name: 'vectorId',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Vector database ID for this content',
          },
        },
        {
          name: 'lastEmbeddingUpdate',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'When embedding was last generated/updated',
          },
        },
        {
          name: 'embeddingModel',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'AI model used for embedding generation',
          },
        },
        {
          name: 'embeddingDimensions',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Number of dimensions in the embedding vector',
          },
        },
        {
          name: 'similarityThreshold',
          type: 'number',
          defaultValue: 0.7,
          min: 0,
          max: 1,
          admin: {
            description: 'Minimum similarity score for this chunk to be relevant',
          },
        },
      ],
    },
    {
      name: 'usage',
      type: 'group',
      fields: [
        {
          name: 'retrievalCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of times this chunk has been retrieved',
          },
        },
        {
          name: 'lastRetrieved',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'When this chunk was last used in a response',
          },
        },
        {
          name: 'avgSimilarityScore',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Average similarity score when retrieved',
          },
        },
        {
          name: 'userFeedback',
          type: 'array',
          fields: [
            {
              name: 'userId',
              type: 'text',
            },
            {
              name: 'rating',
              type: 'select',
              options: [
                { label: 'Helpful', value: 'helpful' },
                { label: 'Somewhat Helpful', value: 'somewhat_helpful' },
                { label: 'Not Helpful', value: 'not_helpful' },
              ],
            },
            {
              name: 'comment',
              type: 'textarea',
            },
            {
              name: 'timestamp',
              type: 'date',
            },
          ],
          admin: {
            readOnly: true,
            description: 'User feedback on this content chunk',
          },
        },
      ],
    },
    {
      name: 'metadata',
      type: 'group',
      fields: [
        {
          name: 'sourceUrl',
          type: 'text',
          admin: {
            description: 'URL or reference to original source (if applicable)',
          },
        },
        {
          name: 'tags',
          type: 'array',
          fields: [
            {
              name: 'tag',
              type: 'text',
              required: true,
            },
          ],
          admin: {
            description: 'Additional tags for categorization',
          },
        },
        {
          name: 'language',
          type: 'select',
          options: [
            { label: 'English', value: 'en' },
            { label: 'Spanish', value: 'es' },
            { label: 'French', value: 'fr' },
            { label: 'German', value: 'de' },
          ],
          defaultValue: 'en',
        },
        {
          name: 'contentLength',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Character length of the content',
          },
        },
        {
          name: 'wordCount',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Word count of the content',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-calculate content metrics
        if (data.content) {
          data.metadata = data.metadata || {}
          data.metadata.contentLength = data.content.length
          data.metadata.wordCount = data.content.split(/\s+/).length
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        console.log(`Content chunk ${operation}:`, doc.title)

        // Auto-sync to Upstash when content is created or updated
        try {
          // Only sync if the chunk is active
          if (!doc.isActive) {
            console.log(`Skipping Upstash sync for inactive chunk: ${doc.title}`)
            return
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
              chunk_type: doc.chunkType,
              data_source: doc.source,
              keywords: doc.keywords?.map((k: any) => k.keyword) || [],
              created_at: doc.createdAt,
              updated_at: doc.updatedAt,
              priority: doc.priority || 1,
              auto_synced: true,
              sync_timestamp: new Date().toISOString(),
            },
          })

          console.log(`✓ Auto-synced "${doc.title}" to Upstash`)

          // Update the embedding metadata in the document
          if (operation === 'create' || !doc.embedding?.vectorId) {
            // This would normally update the document, but we'll avoid infinite loops
            // by just logging for now
            console.log(`Vector ID set: ${vectorId}`)
          }
        } catch (error: any) {
          console.error(`✗ Failed to auto-sync "${doc.title}" to Upstash:`, error?.message || error)
          // Don't fail the save operation if sync fails
        }
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        try {
          console.log('Removing content chunk from Upstash, ID:', id)

          // Initialize Upstash Vector client
          const index = new Index({
            url: process.env.UPSTASH_VECTOR_REST_URL!,
            token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
          })

          const vectorId = `cms_chunk_${id}`

          // Remove from Upstash
          await index.delete(vectorId)

          console.log(`✓ Removed ${vectorId} from Upstash`)
        } catch (error: any) {
          console.error(`✗ Failed to remove chunk from Upstash:`, error?.message || error)
          // Don't fail the delete operation if Upstash removal fails
        }
      },
    ],
  },
  timestamps: true,
}
