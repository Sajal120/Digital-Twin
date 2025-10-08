import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LoadingAnimationProps {
  onComplete: () => void
}

const LoadingAnimation = ({ onComplete }: LoadingAnimationProps) => {
  const [progress, setProgress] = useState(0)

  const content = {
    name: 'Sajal Basnet',
    subtitle: 'AI & IT Enthusiast',
    status_messages: [
      'Initializing development environment...',
      'Loading AI-enhanced tools...',
      'Configuring security protocols...',
      'Setting up IT infrastructure...',
      'Optimizing system performance...',
      'Ready to innovate...',
    ],
  }

  // Get status message based on progress
  const getStatusMessage = (progress: number) => {
    const messages = content.status_messages
    const progressPercentage = Math.floor(progress / (100 / messages.length))
    const index = Math.min(progressPercentage, messages.length - 1)
    return messages[index] || messages[0]
  }

  useEffect(() => {
    const duration = 3000 // 3 seconds
    const interval = 30 // Update every 30ms
    const steps = duration / interval
    const increment = 100 / steps
    let currentProgress = 0

    const timer = setInterval(() => {
      currentProgress += increment
      if (currentProgress >= 100) {
        currentProgress = 100
        clearInterval(timer)
        setTimeout(() => {
          onComplete()
        }, 500)
      }
      setProgress(Math.round(currentProgress))
    }, interval)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: progress >= 100 ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden"
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-20 grid-rows-20 w-full h-full">
          {[...Array(400)].map((_, i) => (
            <div
              key={i}
              className="border border-blue-400/20"
              style={{
                animationDelay: `${Math.random() * 3}s`,
                animation: `pulse 3s infinite ${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Logo/Name */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-12"
        >
          <h1 className="text-7xl md:text-9xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {content.name}
            </span>
          </h1>
          <div className="relative">
            <p className="text-2xl text-gray-400 font-light tracking-wider">{content.subtitle}</p>
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-pink-500/20 opacity-20 blur-xl rounded-full" />
          </div>
        </motion.div>

        {/* Progress bar container */}
        <div className="w-full max-w-md mx-auto mb-8">
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Percentage */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.3 }}
          className="text-4xl font-bold text-white mb-6"
        >
          {progress}%
        </motion.div>

        {/* Status message */}
        <motion.div
          key={progress}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="text-gray-400 text-sm"
        >
          {getStatusMessage(progress)}
        </motion.div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-10 left-10 w-20 h-20 border-l-2 border-t-2 border-blue-400/30" />
      <div className="absolute top-10 right-10 w-20 h-20 border-r-2 border-t-2 border-purple-400/30" />
      <div className="absolute bottom-10 left-10 w-20 h-20 border-l-2 border-b-2 border-purple-400/30" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-r-2 border-b-2 border-pink-400/30" />
    </motion.div>
  )
}

export default LoadingAnimation
