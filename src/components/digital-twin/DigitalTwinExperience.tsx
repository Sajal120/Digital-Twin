'use client'

import { useAIControl } from '@/contexts/AIControlContext'
import { LandingScreen } from './LandingScreen'
import { AIControllerChat } from './AIControllerChat'
import { FuturisticBackground } from './FuturisticBackground'
import { AnimatedProjects } from './AnimatedProjects'
import { AnimatedSkills } from './AnimatedSkills'
import { ResumePanel } from './ResumePanel'
import { ContactTransform } from './ContactTransform'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot } from 'lucide-react'

function PortfolioModeView() {
  const { setMode } = useAIControl()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center p-8"
    >
      <div className="text-center text-white">
        <h2 className="text-4xl font-bold mb-4">Traditional Portfolio View</h2>
        <p className="text-gray-300 mb-8">
          This will be your traditional portfolio layout. For now, use the chat mode to explore!
        </p>
        <button
          onClick={() => setMode('chat')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Open AI Chat
        </button>
      </div>
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

        {(currentMode === 'chat' ||
          currentMode === 'projects' ||
          currentMode === 'skills' ||
          currentMode === 'resume' ||
          currentMode === 'contact') && (
          <motion.div
            key="chat-interface"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AIControllerChat />
          </motion.div>
        )}

        {currentMode === 'portfolio' && <PortfolioModeView key="portfolio" />}
      </AnimatePresence>

      {/* Overlay components that appear on top of chat */}
      <AnimatedProjects />
      <AnimatedSkills />
      <ResumePanel />
      <ContactTransform />

      {/* Floating Chat Icon - appears when viewing content overlays */}
      {(activeComponents.projects ||
        activeComponents.skills ||
        activeComponents.resume ||
        activeComponents.about ||
        activeComponents.contact) && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            // Go back to pure chat mode and hide all overlays
            setMode('chat')
            toggleComponent('projects', false)
            toggleComponent('skills', false)
            toggleComponent('resume', false)
            toggleComponent('about', false)
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
