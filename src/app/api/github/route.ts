import { NextRequest, NextResponse } from 'next/server'
import { githubService } from '@/lib/github-service'
import { generateGitHubEnhancedResponse } from '@/lib/github-integration'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, query, accessToken, params = {} } = body

    if (!action) {
      return NextResponse.json(
        { 
          error: 'Action is required',
          availableActions: [
            'profile', 'repositories', 'activity', 
            'languages', 'search', 'enhanced_response'
          ]
        },
        { status: 400 }
      )
    }

    switch (action) {
      case 'profile':
        const profile = await githubService.getProfile(accessToken)
        return NextResponse.json({
          success: true,
          data: profile
        })

      case 'repositories':
        const limit = params.limit || 10
        const repos = await githubService.getRepositories(accessToken, undefined, limit)
        return NextResponse.json({
          success: true,
          data: repos
        })

      case 'activity':
        const activityLimit = params.limit || 10
        const activities = await githubService.getRecentActivity(accessToken, undefined, activityLimit)
        return NextResponse.json({
          success: true,
          data: activities
        })

      case 'languages':
        const languages = await githubService.getLanguageStats(accessToken)
        return NextResponse.json({
          success: true,
          data: languages
        })

      case 'commits':
        const commitStats = await githubService.getCommitStats(accessToken)
        return NextResponse.json({
          success: true,
          data: commitStats
        })

      case 'enhanced_response':
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for enhanced response' },
            { status: 400 }
          )
        }
        const response = await generateGitHubEnhancedResponse(query, accessToken)
        return NextResponse.json({
          success: true,
          response,
          metadata: {
            authenticated: !!accessToken,
            query_type: 'github'
          }
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('GitHub action error:', error)
    return NextResponse.json(
      {
        error: 'GitHub API request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')
  
  if (action === 'oauth_url') {
    const state = searchParams.get('state') || `github-${Date.now()}`
    const oauthUrl = githubService.getOAuthUrl(state)
    
    return NextResponse.json({
      success: true,
      oauth_url: oauthUrl,
      instructions: 'Visit the oauth_url to authenticate with GitHub'
    })
  }

  return NextResponse.json({
    message: 'GitHub Actions API',
    usage: {
      'GET ?action=oauth_url': 'Get GitHub OAuth URL',
      'POST with action': 'Execute GitHub actions (profile, repositories, etc.)'
    },
    availableActions: [
      'profile', 'repositories', 'activity', 
      'languages', 'commits', 'enhanced_response'
    ]
  })
}