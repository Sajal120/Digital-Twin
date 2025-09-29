/**
 * LinkedIn OAuth Callback Route
 * =============================
 * 
 * This route handles the OAuth callback from LinkedIn after user authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { linkedinOAuthService } from '@/lib/linkedin-service'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        new URL(`/?linkedin_error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || 'Authentication failed')}`, request.url)
      )
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?linkedin_error=missing_parameters&message=Missing authorization code or state', request.url)
      )
    }

    // Optional: Verify state matches what we stored (if using cookies)
    const storedState = request.cookies.get('linkedin-oauth-state')?.value
    if (storedState && storedState !== state) {
      console.warn('LinkedIn OAuth state mismatch')
      // Continue anyway for now, but in production you might want to reject this
    }

    try {
      // Exchange code for access token
      const accessToken = await linkedinOAuthService.getAccessToken(code)
      
      // Get user profile data
      const profile = await linkedinOAuthService.getProfile(accessToken)
      
      // Get email if available
      const email = await linkedinOAuthService.getEmailAddress(accessToken)
      
      // Create success response
      const response = NextResponse.redirect(
        new URL(`/?linkedin_success=true&name=${encodeURIComponent(profile.firstName + ' ' + profile.lastName)}`, request.url)
      )
      
      // Store profile data in cookies (you might want to store in database instead)
      response.cookies.set('linkedin-profile', JSON.stringify({
        id: profile.id,
        name: `${profile.firstName} ${profile.lastName}`,
        headline: profile.headline,
        email: email,
        profilePicture: profile.profilePicture,
        publicProfileUrl: profile.publicProfileUrl,
        authenticated: true,
        authenticatedAt: new Date().toISOString()
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600 * 24, // 24 hours
        sameSite: 'lax'
      })

      // Store access token securely (consider using database or encrypted cookies in production)
      response.cookies.set('linkedin-token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600, // 1 hour
        sameSite: 'lax'
      })

      // Clear state cookie
      response.cookies.delete('linkedin-oauth-state')
      
      return response
      
    } catch (tokenError) {
      console.error('LinkedIn token exchange failed:', tokenError)
      return NextResponse.redirect(
        new URL(`/?linkedin_error=token_exchange_failed&message=${encodeURIComponent('Failed to authenticate with LinkedIn')}`, request.url)
      )
    }
    
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error)
    
    return NextResponse.redirect(
      new URL(`/?linkedin_error=callback_error&message=${encodeURIComponent('Authentication callback failed')}`, request.url)
    )
  }
}