'use client'

import { motion } from 'framer-motion'
import { Brain, BookOpen, Sparkles } from 'lucide-react'
import { useAIControl } from '@/contexts/AIControlContext'
import { useEffect, useState } from 'react'

export function LandingScreen() {
  const { setMode } = useAIControl()
  const [isMounted, setIsMounted] = useState(false)
  const [particles, setParticles] = useState<
    Array<{ x: number; y: number; yEnd: number; duration: number; delay: number }>
  >([])

  useEffect(() => {
    setIsMounted(true)
    // Generate particles only on client side
    const newParticles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      yEnd: Math.random() * 100,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
        />

        {/* Floating particles - only render on client */}
        {isMounted &&
          particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              initial={{ opacity: 0 }}
              animate={{
                y: [`${particle.y}%`, `${particle.yEnd}%`],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Name with animated glow */}
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6 relative"
            animate={{
              textShadow: [
                '0 0 20px rgba(147, 51, 234, 0.5)',
                '0 0 40px rgba(147, 51, 234, 0.8)',
                '0 0 20px rgba(147, 51, 234, 0.5)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Sajal Basnet
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mb-12"
          >
            <p className="text-2xl md:text-3xl text-gray-300 mb-2 flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <span>Talk to my Digital Twin</span>
              <Sparkles className="w-8 h-8 text-purple-400" />
            </p>
            <p className="text-gray-400 text-lg">
              Experience an AI-powered conversation about my work, skills, and projects
            </p>
          </motion.div>

          {/* Main action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            {/* Talk to Digital Twin button */}
            <motion.button
              onClick={() => setMode('chat')}
              className="group relative px-8 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl text-white text-xl font-semibold overflow-hidden shadow-2xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Animated background glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100"
                animate={{
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />

              <span className="relative flex items-center gap-3">
                <Brain className="w-8 h-8" />
                <span>Talk to My Digital Twin</span>
              </span>

              {/* Ripple effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(147, 51, 234, 0.7)',
                    '0 0 0 20px rgba(147, 51, 234, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </motion.button>

            {/* Explore Portfolio button */}
            <motion.button
              onClick={() => setMode('portfolio')}
              className="group relative px-8 py-6 bg-white/10 backdrop-blur-lg border-2 border-white/30 rounded-2xl text-white text-xl font-semibold hover:bg-white/20 transition-all shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center gap-3">
                <BookOpen className="w-8 h-8" />
                <span>Explore Portfolio Mode</span>
              </span>
            </motion.button>
          </motion.div>

          {/* Hint text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-12 text-gray-400 text-sm"
          >
            <p>✨ Voice-enabled • 🌍 Multi-language • ⚡ Real-time responses</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <p className="text-gray-500 text-sm">Click above to begin your journey</p>
      </motion.div>
    </div>
  )
}
