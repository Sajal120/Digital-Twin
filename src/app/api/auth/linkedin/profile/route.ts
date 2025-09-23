/**
 * LinkedIn Profile API Route
 * ==========================
 * 
 * This route provides LinkedIn profile data for authenticated users
 */

import { NextRequest, NextResponse } from 'next/server'
import { linkedinOAuthService } from '@/lib/linkedin-service'

export async function GET(request: NextRequest) {
  try {
    // Check for stored access token
    const accessToken = request.cookies.get('linkedin-token')?.value
    const storedProfile = request.cookies.get('linkedin-profile')?.value

    // If no token, return static profile info
    if (!accessToken) {
      const staticInfo = linkedinOAuthService.getStaticProfileInfo()
      
      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile)
          return NextResponse.json({
            ...parsedProfile,
            static: false,
            tokenExpired: true,
            message: 'Cached profile data (token expired)'
          })
        } catch (parseError) {
          console.warn('Failed to parse stored profile:', parseError)
        }
      }
      
      return NextResponse.json({
        ...staticInfo,
        static: true,
        authenticated: false,
        message: 'Static profile information'
      })
    }

    // Validate token first
    const isValidToken = await linkedinOAuthService.validateToken(accessToken)
    if (!isValidToken) {
      // Token expired or invalid, return cached data if available
      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile)
          return NextResponse.json({
            ...parsedProfile,
            static: false,
            tokenExpired: true,
            message: 'Cached profile data (token expired)'
          })
        } catch (parseError) {
          console.warn('Failed to parse stored profile:', parseError)
        }
      }
      
      const response = NextResponse.json({
        ...linkedinOAuthService.getStaticProfileInfo(),
        static: true,
        authenticated: false,
        tokenExpired: true,
        message: 'Token expired, showing static information'
      })
      
      // Clear expired token
      response.cookies.delete('linkedin-token')
      return response
    }

    try {
      // Get fresh profile data
      const profile = await linkedinOAuthService.getProfile(accessToken)
      const email = await linkedinOAuthService.getEmailAddress(accessToken)
      
      const profileData = {
        id: profile.id,
        name: `${profile.firstName} ${profile.lastName}`,
        firstName: profile.firstName,
        lastName: profile.lastName,
        headline: profile.headline,
        email: email,
        profilePicture: profile.profilePicture,
        publicProfileUrl: profile.publicProfileUrl,
        industry: profile.industry,
        summary: profile.summary,
        authenticated: true,
        static: false,
        freshData: true,
        authenticatedAt: new Date().toISOString()
      }

      // Update cached profile data
      const response = NextResponse.json(profileData)
      response.cookies.set('linkedin-profile', JSON.stringify(profileData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600 * 24, // 24 hours
        sameSite: 'lax'
      })
      
      return response
      
    } catch (apiError) {
      console.error('LinkedIn API call failed:', apiError)
      
      // Fall back to cached data if API fails
      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile)
          return NextResponse.json({
            ...parsedProfile,
            static: false,
            apiError: true,
            message: 'Using cached data due to API error'
          })
        } catch (parseError) {
          console.warn('Failed to parse stored profile:', parseError)
        }
      }
      
      return NextResponse.json({
        ...linkedinOAuthService.getStaticProfileInfo(),
        static: true,
        authenticated: false,
        apiError: true,
        message: 'API error, showing static information'
      })
    }
    
  } catch (error) {
    console.error('LinkedIn profile endpoint error:', error)
    
    return NextResponse.json(
      {
        error: 'Profile fetch failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        static: true,
        authenticated: false
      },
      { status: 500 }
    )
  }
}

// Handle logout/disconnect
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'LinkedIn account disconnected'
    })
    
    // Clear all LinkedIn-related cookies
    response.cookies.delete('linkedin-token')
    response.cookies.delete('linkedin-profile')
    response.cookies.delete('linkedin-oauth-state')
    
    return response
    
  } catch (error) {
    console.error('LinkedIn disconnect error:', error)
    
    return NextResponse.json(
      {
        error: 'Disconnect failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}