import { NextRequest, NextResponse } from 'next/server'
import { githubService } from '@/lib/github-service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('GitHub OAuth error:', error, searchParams.get('error_description'))
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/?github_error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code provided' },
      { status: 400 }
    )
  }

  try {
    // Exchange code for access token
    const accessToken = await githubService.getAccessToken(code)
    
    // Get user profile to verify token works
    const profile = await githubService.getProfile(accessToken)
    
    // In a real application, you would:
    // 1. Store the token securely in your database
    // 2. Create or update user session
    // 3. Link the GitHub account to your user system
    
    // For now, we'll just redirect to success page with basic info
    const successUrl = new URL('/', process.env.NEXT_PUBLIC_SERVER_URL!)
    successUrl.searchParams.set('github_connected', 'true')
    successUrl.searchParams.set('github_user', profile.name || 'GitHub User')
    
    // Note: In production, don't pass tokens in URL parameters!
    // This is just for demo purposes. Store tokens securely in your database.
    console.log('🎉 GitHub OAuth successful for:', profile.name)
    console.log('📊 Profile info:', {
      name: profile.name,
      company: profile.company,
      location: profile.location,
      publicRepos: profile.publicRepos,
      followers: profile.followers
    })

    // You can store the token in a secure cookie or database here
    // For demo, we'll just log success and redirect
    
    return NextResponse.redirect(successUrl.toString())
    
  } catch (error) {
    console.error('GitHub OAuth callback error:', error)
    
    const errorUrl = new URL('/', process.env.NEXT_PUBLIC_SERVER_URL!)
    errorUrl.searchParams.set('github_error', 'authentication_failed')
    
    return NextResponse.redirect(errorUrl.toString())
  }
}

// Handle POST requests for programmatic token exchange
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    const accessToken = await githubService.getAccessToken(code)
    const profile = await githubService.getProfile(accessToken)
    
    return NextResponse.json({
      success: true,
      message: 'GitHub authentication successful',
      profile: {
        name: profile.name,
        username: profile.htmlUrl?.split('/').pop(),
        company: profile.company,
        location: profile.location,
        publicRepos: profile.publicRepos,
        followers: profile.followers,
      }
      // Note: Don't return the actual token in production!
      // Store it securely in your database instead
    })
    
  } catch (error) {
    console.error('GitHub token exchange error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to authenticate with GitHub',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}