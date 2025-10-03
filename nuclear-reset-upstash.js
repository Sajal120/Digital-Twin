#!/usr/bin/env node

/**
 * NUCLEAR OPTION: Reset entire Upstash index using REST API
 */

import dotenv from 'dotenv'
dotenv.config()

async function nuclearReset() {
  const url = process.env.UPSTASH_VECTOR_REST_URL
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN

  console.log('☢️  NUCLEAR RESET: Deleting ALL vectors\n')

  try {
    // Use the reset endpoint to delete ALL data
    const response = await fetch(`${url}/reset`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Reset failed:', error)
      process.exit(1)
    }

    const result = await response.json()
    console.log('✅ Database reset successful!')
    console.log('Result:', result)

    // Check info
    const infoResponse = await fetch(`${url}/info`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const info = await infoResponse.json()
    console.log('\n📊 Current vector count:', info.result?.vectorCount || 0)

    console.log('\n🎉 Database is now completely empty!')
    console.log('Now run: node sync-correct-profile.js\n')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

nuclearReset()
