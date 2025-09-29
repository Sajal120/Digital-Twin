'use client'

import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { LogIn, LogOut, User, Chrome, Loader2 } from 'lucide-react'

interface GoogleAuthButtonProps {
  callbackUrl?: string
  className?: string
}

export function GoogleAuthButton({ callbackUrl = '/#ai-chat', className = '' }: GoogleAuthButtonProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      await signIn('google', { callbackUrl })
    } catch (error) {
      console.error('Sign-in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign-out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className={`flex items-center space-x-2 px-4 py-2 text-gray-500 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  if (session?.user) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="text-sm">
            <p className="font-medium text-gray-800">{session.user.name}</p>
            <p className="text-gray-500 text-xs">{session.user.email}</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSignOut}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </motion.button>
      </div>
    )
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleSignIn}
      disabled={isLoading}
      className={`flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-gray-700 font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      ) : (
        <Chrome className="w-4 h-4 text-blue-500" />
      )}
      <span className="text-sm">{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
    </motion.button>
  )
}