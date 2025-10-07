'use client'

import { motion } from 'framer-motion'
import { useAIControl } from '@/contexts/AIControlContext'
import { useEffect, useState } from 'react'

export function FuturisticBackground() {
  const { currentTheme, emotionalTone, backgroundIntensity, voiceState } = useAIControl()
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])

  // Generate particles on mount
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }))
    setParticles(newParticles)
  }, [])

  // Theme color mapping
  const themeColors = {
    default: {
      primary: 'rgba(59, 130, 246, 0.3)', // blue
      secondary: 'rgba(147, 51, 234, 0.3)', // purple
    },
    calm_blue: {
      primary: 'rgba(59, 130, 246, 0.4)',
      secondary: 'rgba(14, 165, 233, 0.4)',
    },
    energetic_purple: {
      primary: 'rgba(168, 85, 247, 0.4)',
      secondary: 'rgba(236, 72, 153, 0.4)',
    },
    warm_orange: {
      primary: 'rgba(251, 146, 60, 0.4)',
      secondary: 'rgba(239, 68, 68, 0.4)',
    },
    tech_green: {
      primary: 'rgba(34, 197, 94, 0.4)',
      secondary: 'rgba(16, 185, 129, 0.4)',
    },
  }

  const colors = themeColors[currentTheme] || themeColors.default

  // Emotional tone affects brightness
  const toneIntensity = {
    neutral: 0.5,
    excited: 0.8,
    calm: 0.3,
    focused: 0.6,
  }

  const intensity = toneIntensity[emotionalTone] * (backgroundIntensity / 100)

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Gradient orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)`,
          top: '10%',
          left: '10%',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
          opacity: [intensity * 0.6, intensity * 0.9, intensity * 0.6],
        }}
        transition={{
          duration: voiceState === 'speaking' ? 2 : 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)`,
          bottom: '10%',
          right: '10%',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -50, 0],
          y: [0, -30, 0],
          opacity: [intensity * 0.6, intensity * 0.9, intensity * 0.6],
        }}
        transition={{
          duration: voiceState === 'speaking' ? 2.5 : 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Voice energy ripples - only visible when speaking */}
      {voiceState === 'speaking' && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`ripple-${i}`}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{
                borderColor: colors.primary,
              }}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{
                scale: [0, 3],
                opacity: [0.8, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, intensity, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'linear',
          }}
        />
      ))}

      {/* Grid overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${colors.primary} 1px, transparent 1px),
            linear-gradient(90deg, ${colors.primary} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.05,
        }}
        animate={{
          opacity: [0.03, 0.08, 0.03],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Listening state visual feedback */}
      {voiceState === 'listening' && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.primary}, transparent)`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  )
}
