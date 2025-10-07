/**
 * Upstash Redis Client for Phone Call State Management
 * Stores speech data across serverless function invocations
 */

import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://novel-skink-19996.upstash.io',
  token:
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    'AU4cAAIncDJkOTJiM2YwNzdiNTY0NTIwYjJlM2M0YmZkNDVhNGVlOXAyMTk5OTY',
})

// Store speech for 60 seconds (enough time for processing)
export async function storeSpeech(callSid: string, speechResult: string) {
  await redis.set(`phone:speech:${callSid}`, speechResult, { ex: 60 })
  console.log('📦 Stored speech in Redis:', callSid)
}

// Retrieve and delete speech
export async function retrieveSpeech(callSid: string): Promise<string | null> {
  const speech = await redis.get<string>(`phone:speech:${callSid}`)
  if (speech) {
    await redis.del(`phone:speech:${callSid}`)
    console.log('📦 Retrieved and deleted speech from Redis:', callSid)
  }
  return speech
}
