import type { CollectionConfig } from 'payload'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  labels: {
    singular: 'Audit Log',
    plural: 'Audit Logs',
  },
  admin: {
    description: 'Track all admin actions and system changes for security auditing',
    defaultColumns: ['action', 'user', 'resource', 'timestamp'],
    useAsTitle: 'action',
    group: 'Portfolio Admin',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: () => false, // Audit logs should never be updated
    delete: ({ req: { user } }) => Boolean(user) && (user as any)?.role === 'admin', // Only admins can delete audit logs
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        // Content Management Actions
        { label: 'Content Created', value: 'content_created' },
        { label: 'Content Updated', value: 'content_updated' },
        { label: 'Content Deleted', value: 'content_deleted' },
        { label: 'Content Published', value: 'content_published' },
        { label: 'Content Unpublished', value: 'content_unpublished' },

        // Embedding Operations
        { label: 'Embeddings Generated', value: 'embeddings_generated' },
        { label: 'Embeddings Updated', value: 'embeddings_updated' },
        { label: 'Embeddings Deleted', value: 'embeddings_deleted' },
        { label: 'Vector Search Performed', value: 'vector_search' },

        // Database Operations
        { label: 'Database Query Executed', value: 'db_query' },
        { label: 'Database Backup Created', value: 'db_backup' },
        { label: 'Database Restored', value: 'db_restore' },
        { label: 'Migration Executed', value: 'db_migration' },

        // User Management
        { label: 'User Login', value: 'user_login' },
        { label: 'User Logout', value: 'user_logout' },
        { label: 'User Created', value: 'user_created' },
        { label: 'User Updated', value: 'user_updated' },
        { label: 'User Deleted', value: 'user_deleted' },
        { label: 'Password Changed', value: 'password_changed' },
        { label: 'Role Changed', value: 'role_changed' },

        // Security Actions
        { label: 'Failed Login Attempt', value: 'failed_login' },
        { label: 'Account Locked', value: 'account_locked' },
        { label: 'Account Unlocked', value: 'account_unlocked' },
        { label: 'Security Settings Changed', value: 'security_changed' },
        { label: 'API Key Generated', value: 'api_key_generated' },
        { label: 'API Key Revoked', value: 'api_key_revoked' },

        // System Operations
        { label: 'System Configuration Changed', value: 'system_config' },
        { label: 'Cache Cleared', value: 'cache_cleared' },
        { label: 'Maintenance Mode Enabled', value: 'maintenance_enabled' },
        { label: 'Maintenance Mode Disabled', value: 'maintenance_disabled' },
      ],
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who performed the action',
      },
    },
    {
      name: 'resource',
      type: 'group',
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Portfolio Content', value: 'portfolio-content' },
            { label: 'Content Chunk', value: 'content-chunks' },
            { label: 'Message', value: 'messages' },
            { label: 'User', value: 'users' },
            { label: 'System Setting', value: 'system' },
            { label: 'Database', value: 'database' },
            { label: 'API Endpoint', value: 'api' },
          ],
        },
        {
          name: 'id',
          type: 'text',
          admin: {
            description: 'ID of the resource that was affected',
          },
        },
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'Human-readable identifier for the resource',
          },
        },
      ],
    },
    {
      name: 'details',
      type: 'group',
      fields: [
        {
          name: 'changes',
          type: 'json',
          admin: {
            description: 'Before/after values for updates, or relevant operation details',
          },
        },
        {
          name: 'reason',
          type: 'textarea',
          admin: {
            description: 'Optional reason or comment for the action',
          },
        },
        {
          name: 'metadata',
          type: 'json',
          admin: {
            description: 'Additional context or metadata about the action',
          },
        },
      ],
    },
    {
      name: 'request',
      type: 'group',
      fields: [
        {
          name: 'ip',
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
        {
          name: 'method',
          type: 'select',
          options: [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'PATCH', value: 'PATCH' },
            { label: 'DELETE', value: 'DELETE' },
          ],
        },
        {
          name: 'endpoint',
          type: 'text',
          admin: {
            description: 'API endpoint or admin URL',
          },
        },
        {
          name: 'sessionId',
          type: 'text',
          admin: {
            description: 'Session identifier',
          },
        },
      ],
    },
    {
      name: 'severity',
      type: 'select',
      required: true,
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
      ],
      defaultValue: 'low',
      admin: {
        description: 'Security/operational severity of the action',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
        { label: 'Partial', value: 'partial' },
        { label: 'Warning', value: 'warning' },
      ],
      defaultValue: 'success',
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
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          // Ensure timestamp is always set for new audit logs
          data.timestamp = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'create') {
          console.log(`Audit log created: ${doc.action} by ${doc.user?.email || 'system'}`)
        }
      },
    ],
  },
  timestamps: true,
}
