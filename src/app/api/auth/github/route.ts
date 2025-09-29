import { NextRequest, NextResponse } from 'next/server'
import { githubService } from '@/lib/github-service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  try {
    if (action === 'login') {
      // Generate state for CSRF protection
      const state = `github-oauth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const authUrl = githubService.getOAuthUrl(state)
      
      // Store state in session/cookie for verification (implement as needed)
      // For now, we'll redirect directly
      return NextResponse.redirect(authUrl)
    }

    return NextResponse.json(
      { 
        error: 'Invalid action', 
        availableActions: ['login'],
        usage: 'Use ?action=login to start GitHub OAuth flow'
      }, 
      { status: 400 }
    )
  } catch (error) {
    console.error('GitHub OAuth error:', error)
    return NextResponse.json(
      { error: 'GitHub authentication failed' },
      { status: 500 }
    )
  }
}