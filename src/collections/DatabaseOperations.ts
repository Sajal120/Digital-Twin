import type { CollectionConfig } from 'payload'

export const DatabaseOperations: CollectionConfig = {
  slug: 'database-operations',
  labels: {
    singular: 'Database Operation',
    plural: 'Database Operations',
  },
  admin: {
    description: 'Track and manage database operations, queries, and maintenance tasks',
    defaultColumns: ['operationType', 'status', 'executedAt', 'duration'],
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
        { label: 'Select Query', value: 'select' },
        { label: 'Insert Operation', value: 'insert' },
        { label: 'Update Operation', value: 'update' },
        { label: 'Delete Operation', value: 'delete' },
        { label: 'Database Backup', value: 'backup' },
        { label: 'Database Restore', value: 'restore' },
        { label: 'Migration', value: 'migration' },
        { label: 'Index Creation', value: 'create_index' },
        { label: 'Performance Analysis', value: 'analyze' },
        { label: 'Data Cleanup', value: 'cleanup' },
        { label: 'Maintenance', value: 'maintenance' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Running', value: 'running' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'pending',
    },
    {
      name: 'sqlQuery',
      type: 'textarea',
      admin: {
        description: 'SQL query or command executed',
        rows: 6,
      },
    },
    {
      name: 'parameters',
      type: 'json',
      admin: {
        description: 'Query parameters or operation configuration',
      },
    },
    {
      name: 'executedAt',
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
      name: 'duration',
      type: 'number',
      admin: {
        description: 'Execution duration in milliseconds',
        readOnly: true,
      },
    },
    {
      name: 'results',
      type: 'group',
      fields: [
        {
          name: 'rowsAffected',
          type: 'number',
          admin: {
            description: 'Number of rows affected by the operation',
            readOnly: true,
          },
        },
        {
          name: 'resultData',
          type: 'json',
          admin: {
            description: 'Query results or operation output',
            readOnly: true,
          },
        },
        {
          name: 'performanceMetrics',
          type: 'json',
          admin: {
            description: 'Performance metrics and statistics',
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'error',
      type: 'group',
      fields: [
        {
          name: 'errorCode',
          type: 'text',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'errorMessage',
          type: 'textarea',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'stackTrace',
          type: 'textarea',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'metadata',
      type: 'group',
      fields: [
        {
          name: 'database',
          type: 'text',
          defaultValue: 'portfolio_db',
        },
        {
          name: 'table',
          type: 'text',
        },
        {
          name: 'operationSource',
          type: 'select',
          options: [
            { label: 'Admin Panel', value: 'admin_panel' },
            { label: 'API Request', value: 'api_request' },
            { label: 'Scheduled Job', value: 'scheduled_job' },
            { label: 'Migration Script', value: 'migration_script' },
            { label: 'Manual Query', value: 'manual_query' },
          ],
          defaultValue: 'admin_panel',
        },
        {
          name: 'requestId',
          type: 'text',
          admin: {
            description: 'Request ID for tracing related operations',
          },
        },
        {
          name: 'sessionId',
          type: 'text',
          admin: {
            description: 'Admin session ID',
          },
        },
      ],
    },
    {
      name: 'executedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who executed this operation',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation: op }) => {
        if (op === 'create') {
          data.executedAt = new Date().toISOString()
        }

        // Calculate duration if both timestamps exist
        if (data.executedAt && data.completedAt) {
          const start = new Date(data.executedAt).getTime()
          const end = new Date(data.completedAt).getTime()
          data.duration = end - start
        }

        return data
      },
    ],
  },
  timestamps: true,
}
