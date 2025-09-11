import type { CollectionConfig } from 'payload'

export const Messages: CollectionConfig = {
  slug: 'messages',
  admin: {
    description: 'Chat messages stored in Neon Postgres database (read-only view)',
    useAsTitle: 'content',
    defaultColumns: ['role', 'content', 'user_id', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => false, // Disable create in admin - use API instead
    update: () => false, // Read-only
    delete: () => false, // Read-only
  },
  fields: [
    {
      name: 'user_id',
      type: 'text',
      label: 'User ID',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'System', value: 'system' },
        { label: 'User', value: 'user' },
        { label: 'Assistant', value: 'assistant' },
      ],
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Message Content',
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
