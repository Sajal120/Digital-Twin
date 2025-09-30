import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Validate required environment variables
const requiredEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
}

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key)

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars)
  console.error('🔧 Please check your Vercel environment variables')
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/', // Always redirect to homepage after sign out
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        // Store the access token in the JWT token
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('🔍 NextAuth redirect:', { url, baseUrl })
      
      // Always redirect to homepage with chat section anchor after sign-in
      if (url === `${baseUrl}/chat` || url.includes('/chat')) {
        console.log('🔄 Redirecting from /chat to homepage with chat anchor')
        return `${baseUrl}/#ai-chat`
      }
      
      // After Google sign-in, redirect to homepage with chat section
      if (url.startsWith('/')) {
        // If it's just the base URL, add chat anchor
        if (url === '/') {
          return `${baseUrl}/#ai-chat`
        }
        return `${baseUrl}${url}`
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      // Default redirect to homepage with chat section
      return `${baseUrl}/#ai-chat`
    },
  },
  session: {
    strategy: 'jwt',
  },
}