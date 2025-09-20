import { NextRequest, NextResponse } from 'next/server'
import { githubService } from '@/lib/github-integration'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing GitHub service directly...')

    const { type = 'repositories' } = await request.json()

    let response: string

    if (type === 'profile') {
      response = await githubService.generateProfileResponse()
    } else {
      response = await githubService.generateRepositoriesResponse(6)
    }

    return NextResponse.json({
      success: true,
      data: response,
      type: type,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GitHub service test error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 },
    )
  }
}
