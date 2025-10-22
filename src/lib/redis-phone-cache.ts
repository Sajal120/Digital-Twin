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
export async function storeSpeech(
  callSid: string,
  speechResult: string,
  detectedLanguage?: string,
) {
  const speechData = {
    text: speechResult,
    detectedLanguage: detectedLanguage || 'en',
  }
  await redis.set(`phone:speech:${callSid}`, JSON.stringify(speechData), { ex: 60 })
  console.log('📦 Stored speech in Redis:', callSid)
}

// Retrieve and delete speech
export async function retrieveSpeech(
  callSid: string,
): Promise<{ text: string; detectedLanguage: string } | null> {
  const speechData = await redis.get<string>(`phone:speech:${callSid}`)
  if (speechData) {
    await redis.del(`phone:speech:${callSid}`)
    console.log('📦 Retrieved and deleted speech from Redis:', callSid)

    try {
      return JSON.parse(speechData)
    } catch {
      // Backward compatibility for old format (just text)
      return { text: speechData, detectedLanguage: 'en' }
    }
  }
  return null
}
