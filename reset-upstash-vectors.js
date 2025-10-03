#!/usr/bin/env node

/**
 * RESET Upstash Vector Database - Delete ALL old wrong data
 */

import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function resetDatabase() {
  console.log('🗑️  RESETTING UPSTASH VECTOR DATABASE')
  console.log('====================================\n')

  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  })

  try {
    // Get current info
    const info = await index.info()
    console.log(`📊 Current vector count: ${info.vectorCount}`)
    console.log('🔍 Fetching ALL vectors...\n')

    // Search with very broad terms to find all vectors
    const searches = ['sajal', 'experience', 'education', 'project', 'skill', 'timro', 'aaaa']
    const allVectorIds = new Set()

    for (const term of searches) {
      try {
        const results = await index.query({
          data: term,
          topK: 50,
          includeMetadata: true,
        })

        results.forEach((result) => {
          allVectorIds.add(result.id)
        })
      } catch (error) {
        console.log(`⚠️  Search for "${term}" failed:`, error.message)
      }
    }

    console.log(`Found ${allVectorIds.size} unique vectors\n`)

    // Delete each vector
    console.log('🗑️  Deleting vectors...')
    let deleted = 0

    for (const id of allVectorIds) {
      try {
        await index.delete(id)
        deleted++
        console.log(`   ✅ Deleted: ${id}`)
      } catch (error) {
        console.log(`   ❌ Failed to delete ${id}:`, error.message)
      }
    }

    console.log(`\n✅ Deleted ${deleted} vectors`)

    // Check final count
    const finalInfo = await index.info()
    console.log(`📊 Final vector count: ${finalInfo.vectorCount}\n`)

    if (finalInfo.vectorCount > 0) {
      console.log('⚠️  Warning: Some vectors remain. You may need to delete them manually.')
    } else {
      console.log('🎉 Database is completely clean!\n')
      console.log('Now run: node sync-correct-profile.js')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

resetDatabase()
