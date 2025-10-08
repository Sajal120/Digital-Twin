'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Code, Briefcase, GraduationCap, Heart } from 'lucide-react'
import { useAIControl } from '@/contexts/AIControlContext'

export function AboutPanel() {
  const { activeComponents, toggleComponent, setMode, currentMode } = useAIControl()

  if (!activeComponents.about || currentMode !== 'about') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotateY: -15 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0.8, opacity: 0, rotateY: 15 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 p-8"
          style={{ perspective: '1000px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
            >
              About Me
            </motion.h2>
            <motion.button
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => {
                toggleComponent('about', false)
                setMode('chat')
              }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </motion.button>
          </div>

          {/* Profile Image Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center mb-8 gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500/50 shadow-lg shadow-purple-500/30"
            >
              <img
                src="/profile-avatar.png"
                alt="Sajal Basnet"
                className="w-full h-full object-contain p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20"
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent"
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>
            <div>
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Sajal Basnet
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-purple-300"
              >
                Full-Stack Developer & IT Specialist
              </motion.p>
            </div>
          </motion.div>

          {/* Story Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:border-purple-500/30 transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Heart className="w-6 h-6 text-pink-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white">My Story</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Versatile IT professional with comprehensive expertise across software development,
              security analysis, and IT support. Master of Software Development from Swinburne
              University (Sep 2022 – May 2024) with a GPA of 3.688/4.0. Member of Golden Key
              International Honour Society – Top 15%. From full-stack development with modern
              frameworks to implementing enterprise security solutions, I leverage AI tools to
              enhance every aspect of my work.
            </p>
          </motion.div>

          {/* Background Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* Experience */}
            <motion.div
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.5, type: 'spring' }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-lg rounded-2xl border border-blue-500/20 hover:border-blue-400/50 transition-all"
            >
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Briefcase className="w-10 h-10 text-blue-400 mb-4" />
              </motion.div>
              <h4 className="text-xl font-bold text-white mb-2">Experience</h4>
              <p className="text-gray-300 text-sm">
                3+ years building scalable applications, security analysis, and IT support for
                enterprise solutions
              </p>
            </motion.div>

            {/* Technical Skills */}
            <motion.div
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.6, type: 'spring' }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 hover:border-purple-400/50 transition-all"
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Code className="w-10 h-10 text-purple-400 mb-4" />
              </motion.div>
              <h4 className="text-xl font-bold text-white mb-2">Technical Skills</h4>
              <p className="text-gray-300 text-sm">
                45+ skills including React, Next.js, TypeScript, Python, AI Tools, Security
                Analysis, Cloud & IT Support
              </p>
            </motion.div>

            {/* Education */}
            <motion.div
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.7, type: 'spring' }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-lg rounded-2xl border border-green-500/20 hover:border-green-400/50 transition-all"
            >
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <GraduationCap className="w-10 h-10 text-green-400 mb-4" />
              </motion.div>
              <h4 className="text-xl font-bold text-white mb-2">Education</h4>
              <p className="text-gray-300 text-sm">
                Master of Software Development, Swinburne University (GPA: 3.688/4.0) - Golden Key
                Society Top 15%
              </p>
            </motion.div>
          </div>

          {/* Mission Statement */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="p-6 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 backdrop-blur-lg rounded-2xl border border-white/10 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Mission & Vision</h3>
            <p className="text-gray-200 leading-relaxed relative z-10">
              My mission is to leverage technology to solve real-world problems across development,
              security, and IT operations. I actively seek opportunities in IT Support, Software
              Development, and Security Analysis. Whether it's developing AI-powered applications,
              conducting security audits, or providing expert IT support, I'm driven by the impact I
              can make through diverse technical expertise and continuous innovation.
            </p>
          </motion.div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-purple-500/30 rounded-full"
                initial={{
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%',
                }}
                animate={{
                  y: [
                    Math.random() * 100 + '%',
                    Math.random() * 100 + '%',
                    Math.random() * 100 + '%',
                  ],
                  x: [
                    Math.random() * 100 + '%',
                    Math.random() * 100 + '%',
                    Math.random() * 100 + '%',
                  ],
                }}
                transition={{
                  duration: 10 + Math.random() * 10,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
