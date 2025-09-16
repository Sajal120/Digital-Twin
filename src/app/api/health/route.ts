import { NextResponse } from 'next/server'
import { isBuildTime, shouldUseDatabaseConnection } from '@/lib/build-utils'

export async function GET() {
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_URL: !!process.env.VERCEL_URL,
      PORT: process.env.PORT,
      CI: process.env.CI,
      NEXT_PHASE: process.env.NEXT_PHASE,
      BUILD_PHASE: process.env.BUILD_PHASE,
      DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URI: !!process.env.DATABASE_URI,
      UPSTASH_VECTOR_REST_URL: !!process.env.UPSTASH_VECTOR_REST_URL,
      UPSTASH_VECTOR_REST_TOKEN: !!process.env.UPSTASH_VECTOR_REST_TOKEN,
      PAYLOAD_SECRET: !!process.env.PAYLOAD_SECRET,
    }

    const detectionResults = {
      isBuildTime: isBuildTime(),
      shouldUseDatabaseConnection: shouldUseDatabaseConnection(),
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      status: 'healthy',
      environment: envCheck,
      detection: detectionResults,
      message: 'Health check passed',
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}