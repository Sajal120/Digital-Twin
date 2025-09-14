import type { CollectionConfig } from 'payload'

export const EmbeddingOperations: CollectionConfig = {
  slug: 'embedding-operations',
  labels: {
    singular: 'Embedding Operation',
    plural: 'Embedding Operations',
  },
  admin: {
    description: 'Track and manage vector database embedding operations',
    defaultColumns: ['operationType', 'status', 'startedAt', 'completedAt'],
    useAsTitle: 'operationType',
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
      name: 'operationType',
      type: 'select',
      required: true,
      options: [
        { label: 'Generate All Embeddings', value: 'generate_all' },
        { label: 'Update Single Embedding', value: 'update_single' },
        { label: 'Bulk Regeneration', value: 'bulk_regeneration' },
        { label: 'Delete Embeddings', value: 'delete_embeddings' },
        { label: 'Vector Database Sync', value: 'vector_sync' },
        { label: 'Embedding Migration', value: 'embedding_migration' },
        { label: 'Search Test', value: 'search_test' },
        { label: 'Quality Assessment', value: 'quality_assessment' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Partially Completed', value: 'partial' },
      ],
      defaultValue: 'pending',
    },
    {
      name: 'startedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'progress',
      type: 'group',
      fields: [
        {
          name: 'totalItems',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'processedItems',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'failedItems',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'percentage',
          type: 'number',
          min: 0,
          max: 100,
          defaultValue: 0,
        },
      ],
    },
    {
      name: 'configuration',
      type: 'group',
      fields: [
        {
          name: 'embeddingModel',
          type: 'select',
          options: [
            { label: 'OpenAI text-embedding-ada-002', value: 'text-embedding-ada-002' },
            { label: 'OpenAI text-embedding-3-small', value: 'text-embedding-3-small' },
            { label: 'OpenAI text-embedding-3-large', value: 'text-embedding-3-large' },
            { label: 'Hugging Face Sentence Transformers', value: 'sentence-transformers' },
            { label: 'Custom Model', value: 'custom' },
          ],
          defaultValue: 'text-embedding-ada-002',
        },
        {
          name: 'batchSize',
          type: 'number',
          defaultValue: 10,
          min: 1,
          max: 100,
        },
        {
          name: 'maxRetries',
          type: 'number',
          defaultValue: 3,
          min: 0,
          max: 10,
        },
        {
          name: 'timeout',
          type: 'number',
          defaultValue: 30,
          admin: {
            description: 'Timeout in seconds',
          },
        },
      ],
    },
    {
      name: 'targetContent',
      type: 'group',
      fields: [
        {
          name: 'contentType',
          type: 'select',
          options: [
            { label: 'All Content', value: 'all' },
            { label: 'Content Chunks', value: 'content_chunks' },
            { label: 'Portfolio Content', value: 'portfolio_content' },
            { label: 'Messages', value: 'messages' },
            { label: 'Specific IDs', value: 'specific_ids' },
          ],
          defaultValue: 'all',
        },
        {
          name: 'contentIds',
          type: 'array',
          fields: [
            {
              name: 'id',
              type: 'text',
              required: true,
            },
          ],
          admin: {
            condition: (data) => data?.targetContent?.contentType === 'specific_ids',
            description: 'Specific content IDs to process',
          },
        },
        {
          name: 'filters',
          type: 'json',
          admin: {
            description: 'Additional filters for content selection',
          },
        },
      ],
    },
    {
      name: 'results',
      type: 'group',
      fields: [
        {
          name: 'successfulOperations',
          type: 'array',
          fields: [
            {
              name: 'contentId',
              type: 'text',
            },
            {
              name: 'vectorId',
              type: 'text',
            },
            {
              name: 'processingTime',
              type: 'number',
              admin: {
                description: 'Processing time in milliseconds',
              },
            },
          ],
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'failedOperations',
          type: 'array',
          fields: [
            {
              name: 'contentId',
              type: 'text',
            },
            {
              name: 'error',
              type: 'text',
            },
            {
              name: 'attemptCount',
              type: 'number',
            },
          ],
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'performanceMetrics',
          type: 'json',
          admin: {
            readOnly: true,
            description: 'Performance metrics and statistics',
          },
        },
      ],
    },
    {
      name: 'logs',
      type: 'array',
      fields: [
        {
          name: 'timestamp',
          type: 'date',
          required: true,
        },
        {
          name: 'level',
          type: 'select',
          options: [
            { label: 'Info', value: 'info' },
            { label: 'Warning', value: 'warning' },
            { label: 'Error', value: 'error' },
            { label: 'Debug', value: 'debug' },
          ],
          defaultValue: 'info',
        },
        {
          name: 'message',
          type: 'text',
          required: true,
        },
        {
          name: 'details',
          type: 'json',
        },
      ],
      admin: {
        readOnly: true,
        description: 'Operation logs and messages',
      },
    },
    {
      name: 'initiatedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who initiated this operation',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          data.startedAt = new Date().toISOString()
        }

        // Calculate progress percentage
        if (data.progress?.totalItems && data.progress?.processedItems) {
          data.progress.percentage = Math.round(
            (data.progress.processedItems / data.progress.totalItems) * 100,
          )
        }

        // Set completion time when status changes to completed/failed
        if (data.status === 'completed' || data.status === 'failed') {
          data.completedAt = new Date().toISOString()
        }

        return data
      },
    ],
  },
  timestamps: true,
}
