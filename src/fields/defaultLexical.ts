import type { TextFieldSingleValidation } from 'payload'
import {
  BoldFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  lexicalEditor,
  UnderlineFeature,
  type LinkFields,
} from '@payloadcms/richtext-lexical'
import { isBuildTime } from '@/lib/build-utils'

// Create build-time safe Lexical editor configuration
const createLexicalConfig = () => {
  const basicFeatures = [
    ParagraphFeature(),
    UnderlineFeature(),
    BoldFeature(),
    ItalicFeature(),
  ]

  // During build time, only include basic features to avoid collection validation
  if (isBuildTime()) {
    console.log('🔧 Using build-time Lexical editor (no LinkFeature)')
    return basicFeatures
  }

  // Runtime configuration with full LinkFeature
  return [
    ...basicFeatures,
    LinkFeature({
      enabledCollections: ['pages', 'posts'],
      fields: ({ defaultFields }) => {
        const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
          if ('name' in field && field.name === 'url') return false
          return true
        })

        return [
          ...defaultFieldsWithoutUrl,
          {
            name: 'url',
            type: 'text',
            admin: {
              condition: (_data, siblingData) => siblingData?.linkType !== 'internal',
            },
            label: ({ t }) => t('fields:enterURL'),
            required: true,
            validate: ((value, options) => {
              if ((options?.siblingData as LinkFields)?.linkType === 'internal') {
                return true // no validation needed, as no url should exist for internal links
              }
              return value ? true : 'URL is required'
            }) as TextFieldSingleValidation,
          },
        ]
      },
    }),
  ]
}

export const defaultLexical = lexicalEditor({
  features: createLexicalConfig(),
})
