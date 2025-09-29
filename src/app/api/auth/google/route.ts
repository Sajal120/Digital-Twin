import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  try {
    if (action === 'login') {
      // Redirect to NextAuth Google sign-in, then back to homepage
      const callbackUrl = searchParams.get('callbackUrl') || '/'
      const signInUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`
      return NextResponse.redirect(new URL(signInUrl, request.url))
    }

    if (action === 'session') {
      // Get current session
      const session = await getServerSession(authOptions)
      return NextResponse.json({ session })
    }

    if (action === 'logout') {
      // Redirect to NextAuth sign-out
      return NextResponse.redirect(new URL('/api/auth/signout', request.url))
    }

    return NextResponse.json(
      { 
        error: 'Invalid action', 
        availableActions: ['login', 'session', 'logout'],
        usage: 'Use ?action=login to start Google OAuth flow'
      }, 
      { status: 400 }
    )
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.json(
      { error: 'Google authentication failed' },
      { status: 500 }
    )
  }
}