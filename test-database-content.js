#!/usr/bin/env node

/**
 * Quick test to verify Upstash has CORRECT data
 */

import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function testDatabase() {
  console.log('🧪 Testing Upstash Vector Database\n')

  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  })

  try {
    // Get database info
    const info = await index.info()
    console.log(`📊 Vector count: ${info.vectorCount}`)
    console.log(`📐 Dimensions: ${info.denseIndex?.embeddingModel}\n`)

    // Test education query
    console.log('🎓 Testing education query...')
    const eduResults = await index.query({
      data: 'Where did Sajal study? What university and degree?',
      topK: 3,
      includeMetadata: true,
    })

    console.log(`\nTop ${eduResults.length} results:\n`)

    eduResults.forEach((result, i) => {
      console.log(`Result ${i + 1}:`)
      console.log(`  ID: ${result.id}`)
      console.log(`  Score: ${result.score}`)
      console.log(`  Section: ${result.metadata?.section || 'unknown'}`)
      if (result.metadata?.text) {
        const text = result.metadata.text.substring(0, 200)
        console.log(`  Content preview: ${text}...`)
      }
      console.log('')
    })

    // Check if mentions Swinburne
    const allText = eduResults
      .map((r) => r.metadata?.text || r.metadata?.fullText || '')
      .join(' ')
      .toLowerCase()

    if (allText.includes('swinburne')) {
      console.log('✅ SUCCESS: Database mentions Swinburne!')
    } else {
      console.log('❌ ERROR: Database does NOT mention Swinburne')
    }

    if (allText.includes('kathmandu')) {
      console.log('⚠️  WARNING: Still mentions Kathmandu (old data)')
    } else {
      console.log('✅ CLEAN: No mention of Kathmandu (old data removed)')
    }

    // Test work experience
    console.log('\n💼 Testing work experience query...')
    const workResults = await index.query({
      data: 'What companies has Sajal worked for?',
      topK: 3,
      includeMetadata: true,
    })

    const workText = workResults
      .map((r) => r.metadata?.text || r.metadata?.fullText || '')
      .join(' ')
      .toLowerCase()

    const companies = ['kimpton', 'aubot', 'edgedvr']
    const found = companies.filter((c) => workText.includes(c))

    console.log(`\nCompanies found: ${found.join(', ')}`)
    if (found.length === 3) {
      console.log('✅ All correct companies found!')
    } else {
      console.log(`⚠️  Only found ${found.length}/3 companies`)
    }

    console.log('\n🎉 Database test complete!')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testDatabase()
