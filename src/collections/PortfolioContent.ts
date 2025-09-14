import type { CollectionConfig } from 'payload'

export const PortfolioContent: CollectionConfig = {
  slug: 'portfolio-content',
  labels: {
    singular: 'Portfolio Content',
    plural: 'Portfolio Content',
  },
  admin: {
    description:
      'Manage all portfolio content including personal info, experience, skills, and projects',
    defaultColumns: ['title', 'section', 'updatedAt'],
    useAsTitle: 'title',
    group: 'Portfolio Admin',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: () => true, // Public read for frontend
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Title for this content section',
      },
    },
    {
      name: 'section',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Personal Information',
          value: 'personal',
        },
        {
          label: 'About Me',
          value: 'about',
        },
        {
          label: 'Experience',
          value: 'experience',
        },
        {
          label: 'Skills',
          value: 'skills',
        },
        {
          label: 'Projects',
          value: 'projects',
        },
        {
          label: 'Education',
          value: 'education',
        },
        {
          label: 'Achievements',
          value: 'achievements',
        },
        {
          label: 'Contact',
          value: 'contact',
        },
      ],
      admin: {
        description: 'Which section of the portfolio this content belongs to',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this content is currently active on the portfolio',
      },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Display order (higher numbers appear first)',
      },
    },
    {
      name: 'content',
      type: 'group',
      fields: [
        // Personal Information Fields
        {
          name: 'personalInfo',
          type: 'group',
          admin: {
            condition: (data) => data?.section === 'personal',
          },
          fields: [
            {
              name: 'fullName',
              type: 'text',
              required: true,
            },
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'tagline',
              type: 'text',
            },
            {
              name: 'location',
              type: 'text',
            },
            {
              name: 'email',
              type: 'email',
            },
            {
              name: 'phone',
              type: 'text',
            },
            {
              name: 'website',
              type: 'text',
            },
            {
              name: 'profileImage',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
        // About Me Fields
        {
          name: 'aboutMe',
          type: 'group',
          admin: {
            condition: (data) => data?.section === 'about',
          },
          fields: [
            {
              name: 'summary',
              type: 'richText',
              required: true,
            },
            {
              name: 'highlights',
              type: 'array',
              fields: [
                {
                  name: 'highlight',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        // Experience Fields
        {
          name: 'experience',
          type: 'group',
          admin: {
            condition: (data) => data?.section === 'experience',
          },
          fields: [
            {
              name: 'position',
              type: 'text',
              required: true,
            },
            {
              name: 'company',
              type: 'text',
              required: true,
            },
            {
              name: 'companyUrl',
              type: 'text',
            },
            {
              name: 'location',
              type: 'text',
            },
            {
              name: 'startDate',
              type: 'date',
              required: true,
            },
            {
              name: 'endDate',
              type: 'date',
            },
            {
              name: 'current',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'description',
              type: 'richText',
              required: true,
            },
            {
              name: 'achievements',
              type: 'array',
              fields: [
                {
                  name: 'achievement',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'technologies',
              type: 'array',
              fields: [
                {
                  name: 'technology',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        // Skills Fields
        {
          name: 'skills',
          type: 'group',
          admin: {
            condition: (data) => data?.section === 'skills',
          },
          fields: [
            {
              name: 'category',
              type: 'text',
              required: true,
            },
            {
              name: 'skillList',
              type: 'array',
              required: true,
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'level',
                  type: 'select',
                  options: [
                    { label: 'Beginner', value: 'beginner' },
                    { label: 'Intermediate', value: 'intermediate' },
                    { label: 'Advanced', value: 'advanced' },
                    { label: 'Expert', value: 'expert' },
                  ],
                  defaultValue: 'intermediate',
                },
                {
                  name: 'yearsOfExperience',
                  type: 'number',
                },
              ],
            },
          ],
        },
        // Projects Fields
        {
          name: 'project',
          type: 'group',
          admin: {
            condition: (data) => data?.section === 'projects',
          },
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
            {
              name: 'description',
              type: 'richText',
              required: true,
            },
            {
              name: 'shortDescription',
              type: 'text',
              maxLength: 200,
            },
            {
              name: 'technologies',
              type: 'array',
              required: true,
              fields: [
                {
                  name: 'technology',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'projectUrl',
              type: 'text',
            },
            {
              name: 'githubUrl',
              type: 'text',
            },
            {
              name: 'demoUrl',
              type: 'text',
            },
            {
              name: 'images',
              type: 'array',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'caption',
                  type: 'text',
                },
              ],
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'startDate',
              type: 'date',
            },
            {
              name: 'endDate',
              type: 'date',
            },
            {
              name: 'status',
              type: 'select',
              options: [
                { label: 'Completed', value: 'completed' },
                { label: 'In Progress', value: 'in-progress' },
                { label: 'On Hold', value: 'on-hold' },
                { label: 'Planned', value: 'planned' },
              ],
              defaultValue: 'completed',
            },
          ],
        },
        // Education Fields
        {
          name: 'education',
          type: 'group',
          admin: {
            condition: (data) => data?.section === 'education',
          },
          fields: [
            {
              name: 'institution',
              type: 'text',
              required: true,
            },
            {
              name: 'degree',
              type: 'text',
              required: true,
            },
            {
              name: 'field',
              type: 'text',
            },
            {
              name: 'startDate',
              type: 'date',
              required: true,
            },
            {
              name: 'endDate',
              type: 'date',
            },
            {
              name: 'current',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'gpa',
              type: 'text',
            },
            {
              name: 'honors',
              type: 'array',
              fields: [
                {
                  name: 'honor',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'description',
              type: 'richText',
            },
          ],
        },
        // Achievements Fields
        {
          name: 'achievement',
          type: 'group',
          admin: {
            condition: (data) => data?.section === 'achievements',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'description',
              type: 'richText',
              required: true,
            },
            {
              name: 'date',
              type: 'date',
              required: true,
            },
            {
              name: 'organization',
              type: 'text',
            },
            {
              name: 'certificateUrl',
              type: 'text',
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
        // Contact Fields
        {
          name: 'contact',
          type: 'group',
          admin: {
            condition: (data) => data?.section === 'contact',
          },
          fields: [
            {
              name: 'socialLinks',
              type: 'array',
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  options: [
                    { label: 'LinkedIn', value: 'linkedin' },
                    { label: 'GitHub', value: 'github' },
                    { label: 'Twitter', value: 'twitter' },
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'YouTube', value: 'youtube' },
                    { label: 'Portfolio', value: 'portfolio' },
                    { label: 'Other', value: 'other' },
                  ],
                  required: true,
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'username',
                  type: 'text',
                },
              ],
            },
            {
              name: 'availableForWork',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'preferredContactMethod',
              type: 'select',
              options: [
                { label: 'Email', value: 'email' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'Phone', value: 'phone' },
              ],
              defaultValue: 'email',
            },
          ],
        },
      ],
    },
    {
      name: 'metadata',
      type: 'group',
      fields: [
        {
          name: 'keywords',
          type: 'array',
          fields: [
            {
              name: 'keyword',
              type: 'text',
              required: true,
            },
          ],
          admin: {
            description: 'Keywords for AI chat system to better match user queries',
          },
        },
        {
          name: 'chatContext',
          type: 'textarea',
          admin: {
            description: 'Additional context for AI chat responses related to this content',
          },
        },
        {
          name: 'lastEmbeddingUpdate',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'When embeddings were last generated for this content',
          },
        },
        {
          name: 'embeddingId',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Vector database embedding ID',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        // TODO: Trigger embedding regeneration when content changes
        console.log(`Portfolio content ${operation}:`, doc.title)
      },
    ],
  },
  timestamps: true,
}
