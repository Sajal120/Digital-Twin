/**
 * LinkedIn OAuth Initiation Route
 * ===============================
 * 
 * This route redirects users to LinkedIn for authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { linkedinOAuthService } from '@/lib/linkedin-service'

export async function GET(request: NextRequest) {
  try {
    // Check if LinkedIn OAuth is configured
    if (!linkedinOAuthService.isConfigured()) {
      return NextResponse.json(
        {
          error: 'LinkedIn OAuth not configured',
          message: 'LinkedIn integration requires LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables'
        },
        { status: 500 }
      )
    }

    // Generate state for security
    const state = `linkedin-auth-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    // Get authorization URL
    const authUrl = linkedinOAuthService.getAuthorizationUri(state)
    
    // Store state in cookie for verification (optional security measure)
    const response = NextResponse.redirect(authUrl)
    response.cookies.set('linkedin-oauth-state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600, // 10 minutes
      sameSite: 'lax'
    })
    
    return response
  } catch (error) {
    console.error('LinkedIn OAuth initiation error:', error)
    
    return NextResponse.json(
      {
        error: 'OAuth initiation failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Handle POST request to get auth URL without redirect
export async function POST(request: NextRequest) {
  try {
    if (!linkedinOAuthService.isConfigured()) {
      return NextResponse.json(
        {
          error: 'LinkedIn OAuth not configured',
          configured: false
        },
        { status: 500 }
      )
    }

    const state = `linkedin-auth-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const authUrl = linkedinOAuthService.getAuthorizationUri(state)
    
    return NextResponse.json({
      authUrl,
      state,
      configured: true
    })
  } catch (error) {
    console.error('LinkedIn OAuth URL generation error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to generate auth URL',
        configured: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}