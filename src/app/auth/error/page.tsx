'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    switch (error) {
      case 'Configuration':
        setErrorMessage('There is a problem with the server configuration.')
        break
      case 'AccessDenied':
        setErrorMessage('Access denied. You do not have permission to sign in.')
        break
      case 'Verification':
        setErrorMessage('The verification token has expired or has already been used.')
        break
      case 'OAuthAccountNotLinked':
        setErrorMessage('To confirm your identity, sign in with the same account you used originally.')
        break
      case 'OAuthCallback':
        setErrorMessage('There was an error with the OAuth provider.')
        break
      case 'no_code':
        setErrorMessage('No authorization code received from Google.')
        break
      default:
        setErrorMessage('An unexpected error occurred during authentication.')
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        {/* Error Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-8">{errorMessage}</p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 flex items-center justify-center space-x-2 font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl px-6 py-3 flex items-center justify-center space-x-2 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}