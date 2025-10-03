#!/usr/bin/env node

/**
 * Fetch specific vectors by ID
 */

import dotenv from 'dotenv'
dotenv.config()

async function fetchVectorById(id) {
  const url = process.env.UPSTASH_VECTOR_REST_URL
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN

  const response = await fetch(`${url}/fetch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ids: [id],
      includeMetadata: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }

  return await response.json()
}

async function inspectEducationVector() {
  console.log('🔍 Inspecting education vector\n')

  try {
    const result = await fetchVectorById('profile_education')
    console.log('Result:', JSON.stringify(result, null, 2))

    if (result.result && result.result[0]) {
      const vector = result.result[0]
      console.log('\n📝 Education Content:')
      console.log(vector.metadata?.fullText || vector.metadata?.text)
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

inspectEducationVector()
