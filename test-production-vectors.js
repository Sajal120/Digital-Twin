#!/usr/bin/env node

/**
 * Test what the production API is actually retrieving
 */

import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function testProductionRetrieval() {
  console.log('🧪 Testing Production Vector Retrieval\n')

  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  })

  // Test the same query production is using
  const query = 'What university did Sajal graduate from?'
  console.log(`Query: "${query}"\n`)

  const results = await index.query({
    data: query,
    topK: 5,
    includeMetadata: true,
    includeData: true,
  })

  console.log(`Found ${results.length} results\n`)

  results.forEach((result, i) => {
    console.log(`--- Result ${i + 1} (Score: ${result.score}) ---`)
    console.log(`ID: ${result.id}`)
    console.log(`Metadata keys: ${Object.keys(result.metadata || {}).join(', ')}`)

    if (result.data) {
      console.log(`Has 'data' field: ${typeof result.data} (length: ${result.data.length})`)
      console.log(`Data preview: ${result.data.substring(0, 100)}...`)
    } else {
      console.log(`No 'data' field`)
    }

    if (result.metadata?.fullText) {
      console.log(`Has 'fullText': YES (length: ${result.metadata.fullText.length})`)
      console.log(`FullText preview: ${result.metadata.fullText.substring(0, 100)}...`)
    } else {
      console.log(`Has 'fullText': NO`)
    }

    if (result.metadata?.text) {
      console.log(`Has 'text': YES (length: ${result.metadata.text.length})`)
      console.log(`Text preview: ${result.metadata.text.substring(0, 100)}...`)
    } else {
      console.log(`Has 'text': NO`)
    }

    if (result.metadata?.content) {
      console.log(`Has 'content': YES`)
    } else {
      console.log(`Has 'content': NO`)
    }

    console.log('')
  })

  // Check if "Swinburne" appears in ANY result
  const allContent = results
    .map((r) => {
      return r.data || r.metadata?.fullText || r.metadata?.text || r.metadata?.content || ''
    })
    .join(' ')

  if (allContent.toLowerCase().includes('swinburne')) {
    console.log('✅ "Swinburne" FOUND in results!')
  } else {
    console.log('❌ "Swinburne" NOT found in results!')
  }

  if (allContent.toLowerCase().includes('kathmandu')) {
    console.log('⚠️  "Kathmandu" still found (old data)')
  } else {
    console.log('✅ "Kathmandu" not found (clean)')
  }
}

testProductionRetrieval().catch(console.error)
