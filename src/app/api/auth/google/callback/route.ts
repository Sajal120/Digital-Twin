import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // This route is handled by NextAuth.js automatically
  // Redirect to the NextAuth callback handler
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  if (!code) {
    return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url))
  }

  // Build the NextAuth callback URL
  const callbackUrl = new URL('/api/auth/callback/google', request.url)
  callbackUrl.searchParams.set('code', code)
  if (state) callbackUrl.searchParams.set('state', state)

  return NextResponse.redirect(callbackUrl)
}