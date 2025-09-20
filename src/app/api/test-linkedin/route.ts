import { NextRequest, NextResponse } from 'next/server'
import { linkedinService } from '@/lib/linkedin-integration'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing LinkedIn service directly...')

    const { type = 'profile' } = await request.json()

    let response: string

    if (type === 'experience') {
      response = await linkedinService.generateExperienceResponse()
    } else if (type === 'skills') {
      response = await linkedinService.generateSkillsResponse()
    } else if (type === 'certificates') {
      response = await linkedinService.generateCertificatesResponse()
    } else if (type === 'search') {
      response = await linkedinService.searchExperience('Python')
    } else {
      response = await linkedinService.generateProfileResponse()
    }

    return NextResponse.json({
      success: true,
      data: response,
      type: type,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('LinkedIn service test error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 },
    )
  }
}
