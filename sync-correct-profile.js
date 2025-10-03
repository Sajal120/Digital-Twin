#!/usr/bin/env node

/**
 * Sync Sajal's CORRECT professional profile to Upstash Vector DB
 * This will replace the old WRONG information with accurate data
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Upstash configuration
const UPSTASH_VECTOR_REST_URL = process.env.UPSTASH_VECTOR_REST_URL
const UPSTASH_VECTOR_REST_TOKEN = process.env.UPSTASH_VECTOR_REST_TOKEN
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!UPSTASH_VECTOR_REST_URL || !UPSTASH_VECTOR_REST_TOKEN || !OPENAI_API_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Read the professional profile
const profilePath = path.join(__dirname, 'data', 'professional-profile.md')
const profileContent = fs.readFileSync(profilePath, 'utf-8')

console.log('📝 Read professional profile:', profileContent.length, 'characters')

// Split into chunks for better retrieval
function createChunks(content) {
  const sections = content.split(/\n## /)
  const chunks = []

  sections.forEach((section, index) => {
    if (index === 0) {
      // First section is the title
      chunks.push({
        id: `profile_overview`,
        text: section.trim(),
        metadata: {
          type: 'overview',
          section: 'Personal Information',
        },
      })
    } else {
      const [title, ...body] = section.split('\n')
      const text = `## ${title}\n${body.join('\n')}`

      chunks.push({
        id: `profile_${title.toLowerCase().replace(/\s+/g, '_')}`,
        text: text.trim(),
        metadata: {
          type: 'professional_profile',
          section: title.trim(),
        },
      })
    }
  })

  return chunks
}

// Generate embeddings using OpenAI
async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
      dimensions: 768, // Match Upstash database dimensions
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

// Upsert to Upstash
async function upsertToUpstash(id, vector, metadata) {
  const response = await fetch(`${UPSTASH_VECTOR_REST_URL}/upsert`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_VECTOR_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
      vector,
      metadata,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Upstash upsert failed: ${response.status} ${error}`)
  }

  return await response.json()
}

// Main sync function
async function syncProfile() {
  console.log('🚀 Starting profile sync to Upstash...\n')

  try {
    // Step 1: Create chunks
    console.log('📦 Creating chunks from profile...')
    const chunks = createChunks(profileContent)
    console.log(`✅ Created ${chunks.length} chunks\n`)

    // Step 2: Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`[${i + 1}/${chunks.length}] Processing: ${chunk.id}`)
      console.log(`   Section: ${chunk.metadata.section}`)
      console.log(`   Text length: ${chunk.text.length} chars`)

      // Generate embedding
      console.log('   🔄 Generating embedding...')
      const embedding = await generateEmbedding(chunk.text)
      console.log(`   ✅ Embedding generated (${embedding.length} dimensions)`)

      // Upsert to Upstash
      console.log('   📤 Upserting to Upstash...')
      await upsertToUpstash(chunk.id, embedding, {
        ...chunk.metadata,
        text: chunk.text.substring(0, 1000), // Store first 1000 chars in metadata
        fullText: chunk.text,
        lastUpdated: new Date().toISOString(),
      })
      console.log('   ✅ Upserted successfully\n')

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    console.log('🎉 Profile sync completed successfully!')
    console.log(`📊 Total chunks synced: ${chunks.length}`)
    console.log('\n✅ Your MCP server should now have CORRECT information about you!\n')
  } catch (error) {
    console.error('❌ Sync failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the sync
syncProfile()
