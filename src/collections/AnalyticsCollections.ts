import type { CollectionConfig } from 'payload'

export const ChatAnalytics: CollectionConfig = {
  slug: 'chat-analytics',
  labels: {
    singular: 'Chat Analytics',
    plural: 'Chat Analytics',
  },
  admin: {
    description: 'System analytics and performance metrics for the AI chat system',
    defaultColumns: ['metricType', 'value', 'timestamp'],
    useAsTitle: 'metricType',
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
      name: 'metricType',
      type: 'select',
      required: true,
      options: [
        // Chat Analytics
        { label: 'Total Conversations', value: 'total_conversations' },
        { label: 'Total Messages', value: 'total_messages' },
        { label: 'Daily Active Users', value: 'daily_active_users' },
        { label: 'Average Session Duration', value: 'avg_session_duration' },
        { label: 'Messages per Session', value: 'messages_per_session' },
        { label: 'User Satisfaction', value: 'user_satisfaction' },
        { label: 'Response Accuracy', value: 'response_accuracy' },

        // System Health
        { label: 'Database Connection Status', value: 'db_connection_status' },
        { label: 'API Response Time', value: 'api_response_time' },
        { label: 'Error Rate', value: 'error_rate' },
        { label: 'Storage Usage', value: 'storage_usage' },
        { label: 'Memory Usage', value: 'memory_usage' },
        { label: 'CPU Usage', value: 'cpu_usage' },

        // Vector Database Performance
        { label: 'Vector Search Time', value: 'vector_search_time' },
        { label: 'Embedding Generation Time', value: 'embedding_generation_time' },
        { label: 'Vector Database Size', value: 'vector_db_size' },
        { label: 'Search Success Rate', value: 'search_success_rate' },

        // Content Performance
        { label: 'Most Retrieved Content', value: 'most_retrieved_content' },
        { label: 'Content Hit Rate', value: 'content_hit_rate' },
        { label: 'Popular Topics', value: 'popular_topics' },
        { label: 'Search Query Success', value: 'search_query_success' },
      ],
    },
    {
      name: 'value',
      type: 'json',
      required: true,
      admin: {
        description: 'Metric value (can be number, string, or complex object)',
      },
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'period',
      type: 'select',
      required: true,
      options: [
        { label: 'Real-time', value: 'realtime' },
        { label: 'Hourly', value: 'hourly' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ],
      defaultValue: 'daily',
    },
    {
      name: 'metadata',
      type: 'group',
      fields: [
        {
          name: 'source',
          type: 'text',
          admin: {
            description: 'Source of the metric (e.g., chat-api, database, system)',
          },
        },
        {
          name: 'userId',
          type: 'text',
          admin: {
            description: 'User ID if metric is user-specific',
          },
        },
        {
          name: 'sessionId',
          type: 'text',
          admin: {
            description: 'Session ID if metric is session-specific',
          },
        },
        {
          name: 'additionalData',
          type: 'json',
          admin: {
            description: 'Any additional metadata for the metric',
          },
        },
      ],
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
        description: 'Tags for filtering and categorizing metrics',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Ensure timestamp is set
        if (!data.timestamp) {
          data.timestamp = new Date().toISOString()
        }
        return data
      },
    ],
  },
  timestamps: true,
}

export const SystemLogs: CollectionConfig = {
  slug: 'system-logs',
  labels: {
    singular: 'System Log',
    plural: 'System Logs',
  },
  admin: {
    description: 'Real-time system logs and operational data',
    defaultColumns: ['level', 'message', 'source', 'createdAt'],
    useAsTitle: 'message',
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
      name: 'level',
      type: 'select',
      required: true,
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
        { label: 'Error', value: 'error' },
        { label: 'Debug', value: 'debug' },
        { label: 'Critical', value: 'critical' },
      ],
      defaultValue: 'info',
    },
    {
      name: 'message',
      type: 'text',
      required: true,
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'Chat API', value: 'chat-api' },
        { label: 'Database', value: 'database' },
        { label: 'Vector Database', value: 'vector-db' },
        { label: 'Authentication', value: 'auth' },
        { label: 'File System', value: 'filesystem' },
        { label: 'External API', value: 'external-api' },
        { label: 'Admin Operations', value: 'admin-ops' },
        { label: 'System', value: 'system' },
      ],
    },
    {
      name: 'details',
      type: 'json',
      admin: {
        description: 'Detailed log information (error stack, request data, etc.)',
      },
    },
    {
      name: 'userId',
      type: 'text',
      admin: {
        description: 'User ID if log is related to a specific user action',
      },
    },
    {
      name: 'requestId',
      type: 'text',
      admin: {
        description: 'Request ID for tracking related operations',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        description: 'IP address of the request',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'User agent string',
      },
    },
  ],
  timestamps: true,
}
