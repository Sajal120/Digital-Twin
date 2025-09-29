/**
 * LinkedIn OAuth Service
 * ======================
 * 
 * This service handles LinkedIn OAuth authentication and API calls
 * using the credentials from environment variables.
 */

import { AuthorizationCode } from 'simple-oauth2'

export interface LinkedInProfileAPI {
  id: string
  firstName: string
  lastName: string
  headline?: string
  profilePicture?: string
  industry?: string
  summary?: string
  location?: {
    name: string
  }
  publicProfileUrl?: string
}

export class LinkedInOAuthService {
  private client: AuthorizationCode
  private readonly redirectUri: string

  constructor() {
    // Check if required environment variables are available
    if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
      console.warn('LinkedIn OAuth credentials not found in environment variables')
      this.client = null as any
      this.redirectUri = ''
      return
    }

    this.redirectUri = process.env.LINKEDIN_REDIRECT_URI || 
                      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/linkedin/callback`

    this.client = new AuthorizationCode({
      client: {
        id: process.env.LINKEDIN_CLIENT_ID!,
        secret: process.env.LINKEDIN_CLIENT_SECRET!,
      },
      auth: {
        tokenHost: 'https://www.linkedin.com',
        tokenPath: '/oauth/v2/accessToken',
        authorizePath: '/oauth/v2/authorization',
      },
    })
  }

  /**
   * Check if LinkedIn OAuth is properly configured
   */
  isConfigured(): boolean {
    return !!this.client && !!process.env.LINKEDIN_CLIENT_ID && !!process.env.LINKEDIN_CLIENT_SECRET
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthorizationUri(state: string = 'linkedin-auth-' + Date.now()): string {
    if (!this.isConfigured()) {
      throw new Error('LinkedIn OAuth not configured. Check environment variables.')
    }

    return this.client.authorizeURL({
      redirect_uri: this.redirectUri,
      scope: 'openid profile email w_member_social',
      state,
    })
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('LinkedIn OAuth not configured. Check environment variables.')
    }

    try {
      const result = await this.client.getToken({
        code,
        redirect_uri: this.redirectUri,
      })
      
      return result.token.access_token as string
    } catch (error) {
      console.error('LinkedIn token exchange error:', error)
      throw new Error('Failed to exchange LinkedIn authorization code for token')
    }
  }

  /**
   * Get LinkedIn profile data using access token
   */
  async getProfile(accessToken: string): Promise<LinkedInProfileAPI> {
    try {
      const response = await fetch('https://api.linkedin.com/v2/people/~', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('LinkedIn API Error:', response.status, errorText)
        throw new Error(`LinkedIn API error: ${response.status}`)
      }

      const profile = await response.json()
      
      // Get profile picture if available
      let profilePicture = null
      try {
        const pictureResponse = await fetch(
          'https://api.linkedin.com/v2/people/~/profilePicture(displayImage~:playableStreams)',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'X-Restli-Protocol-Version': '2.0.0'
            },
          }
        )

        if (pictureResponse.ok) {
          const pictureData = await pictureResponse.json()
          profilePicture = pictureData['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
        }
      } catch (pictureError) {
        console.warn('Could not fetch profile picture:', pictureError)
      }

      return {
        id: profile.id,
        firstName: profile.localizedFirstName || profile.firstName?.localized?.['en_US'],
        lastName: profile.localizedLastName || profile.lastName?.localized?.['en_US'],
        headline: profile.localizedHeadline || profile.headline?.localized?.['en_US'],
        profilePicture,
        industry: profile.industryName,
        summary: profile.summary,
        publicProfileUrl: profile.publicProfileUrl
      }
    } catch (error) {
      console.error('LinkedIn profile fetch error:', error)
      throw new Error('Failed to fetch LinkedIn profile data')
    }
  }

  /**
   * Get LinkedIn email address (requires additional scope)
   */
  async getEmailAddress(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch(
        'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          },
        }
      )

      if (!response.ok) {
        console.warn('Could not fetch LinkedIn email:', response.status)
        return null
      }

      const emailData = await response.json()
      return emailData.elements?.[0]?.['handle~']?.emailAddress || null
    } catch (error) {
      console.error('LinkedIn email fetch error:', error)
      return null
    }
  }

  /**
   * Get basic profile information without requiring OAuth
   * (Falls back to static profile data)
   */
  getStaticProfileInfo() {
    return {
      profileUrl: process.env.LINKEDIN_PROFILE_URL || 'https://www.linkedin.com/in/sajal-basnet-7926aa188/',
      summary: `Visit my LinkedIn profile for detailed professional information, work history, and connections.`,
      configured: this.isConfigured()
    }
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.linkedin.com/v2/people/~', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
      })

      return response.ok
    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  }
}

// Export singleton instance
export const linkedinOAuthService = new LinkedInOAuthService()

/**
 * Helper to check if user query is asking for real LinkedIn data
 */
export function requiresLinkedInAuth(query: string): boolean {
  const authKeywords = [
    'latest', 'recent', 'current', 'update', 'real-time',
    'connect with me', 'message me', 'contact me on linkedin',
    'my network', 'my connections', 'recent posts',
    'recent activity', 'live profile'
  ]
  
  const queryLower = query.toLowerCase()
  return authKeywords.some(keyword => queryLower.includes(keyword))
}

/**
 * Generate response that includes OAuth authentication option
 */
export function generateAuthPrompt(): string {
  if (!linkedinOAuthService.isConfigured()) {
    return `LinkedIn integration is available but not configured. The administrator needs to set up LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables.`
  }

  return `For real-time LinkedIn data and to connect directly, you can authenticate with LinkedIn. Would you like me to provide an authentication link?

Alternatively, I can share my static profile information that's regularly updated.`
}