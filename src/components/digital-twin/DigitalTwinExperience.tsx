'use client'

import { useState } from 'react'
import { useAIControl } from '@/contexts/AIControlContext'
import { LandingScreen } from './LandingScreen'
import { AIControllerChat } from './AIControllerChat'
import { FuturisticBackground } from './FuturisticBackground'
import { AnimatedProjects } from './AnimatedProjects'
import { AnimatedSkills } from './AnimatedSkills'
import { ResumePanel } from './ResumePanel'
import { ContactTransform } from './ContactTransform'
import { AboutPanel } from './AboutPanel'
import { ExperiencePanel } from './ExperiencePanel'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot } from 'lucide-react'
import LoadingAnimation from '@/components/portfolio/LoadingAnimation'
import TraditionalPortfolio from '@/components/portfolio/TraditionalPortfolio'
import TraditionalNavigation from '@/components/portfolio/TraditionalNavigation'

function PortfolioModeView() {
  const [showLoading, setShowLoading] = useState(true)
  const { setMode } = useAIControl()

  if (showLoading) {
    return <LoadingAnimation onComplete={() => setShowLoading(false)} />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="relative"
    >
      <TraditionalNavigation />
      <TraditionalPortfolio />

      {/* Floating back to AI button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setMode('chat')}
        className="fixed bottom-24 right-8 z-50 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all"
        title="Back to AI Chat"
      >
        <Bot className="w-8 h-8 text-white" />
      </motion.button>
    </motion.div>
  )
}

export function DigitalTwinExperience() {
  const { currentMode, activeComponents, setMode, toggleComponent } = useAIControl()

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Futuristic animated background */}
      <FuturisticBackground />

      {/* Main content based on mode */}
      <AnimatePresence mode="wait">
        {currentMode === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LandingScreen />
          </motion.div>
        )}

        {currentMode === 'chat' && (
          <motion.div
            key="chat-interface"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <AIControllerChat />
          </motion.div>
        )}

        {currentMode === 'portfolio' && <PortfolioModeView key="portfolio" />}
      </AnimatePresence>

      {/* Overlay components that appear on top of chat */}
      <AboutPanel />
      <ExperiencePanel />
      <AnimatedProjects />
      <AnimatedSkills />
      <ResumePanel />
      <ContactTransform />

      {/* Floating Chat Icon - appears when viewing content overlays */}
      {(activeComponents.projects ||
        activeComponents.skills ||
        activeComponents.resume ||
        activeComponents.about ||
        activeComponents.experience ||
        activeComponents.contact) && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            // Restore chat and hide all content overlays
            setMode('chat')
            toggleComponent('projects', false)
            toggleComponent('skills', false)
            toggleComponent('resume', false)
            toggleComponent('about', false)
            toggleComponent('experience', false)
            toggleComponent('contact', false)
          }}
          className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all"
          title="Back to Chat"
        >
          <Bot className="w-8 h-8 text-white" />
        </motion.button>
      )}
    </div>
  )
}
