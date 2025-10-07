'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// UI Mode types
export type UIMode =
  | 'landing'
  | 'chat'
  | 'portfolio'
  | 'projects'
  | 'skills'
  | 'resume'
  | 'about'
  | 'contact'
export type Theme = 'default' | 'calm_blue' | 'energetic_purple' | 'warm_orange' | 'tech_green'
export type VoiceState = 'idle' | 'listening' | 'speaking' | 'processing'

// AI Intent types
export interface AIIntent {
  type:
    | 'show_projects'
    | 'show_skills'
    | 'show_resume'
    | 'show_about'
    | 'show_contact'
    | 'change_theme'
    | 'reset'
    | 'switch_mode'
  value?: string | UIMode
  metadata?: Record<string, any>
}

// Component visibility
export interface ActiveComponents {
  chat: boolean
  projects: boolean
  skills: boolean
  resume: boolean
  about: boolean
  contact: boolean
}

// Chat mode for controlling intent detection
export type ChatMode = 'ai_control' | 'plain_chat'

// Context state
interface AIControlState {
  currentMode: UIMode
  currentTheme: Theme
  voiceState: VoiceState
  activeComponents: ActiveComponents
  lastAIMessage: string
  isTransitioning: boolean
  backgroundIntensity: number
  emotionalTone: 'neutral' | 'excited' | 'calm' | 'focused'
  chatMode: ChatMode
}

// Context actions
interface AIControlActions {
  setMode: (mode: UIMode) => void
  setTheme: (theme: Theme) => void
  setVoiceState: (state: VoiceState) => void
  toggleComponent: (component: keyof ActiveComponents, visible: boolean) => void
  setLastAIMessage: (message: string) => void
  processAIIntent: (intent: AIIntent) => void
  resetUI: () => void
  setEmotionalTone: (tone: AIControlState['emotionalTone']) => void
  setBackgroundIntensity: (intensity: number) => void
  setIsTransitioning: (isTransitioning: boolean) => void
  setChatMode: (mode: ChatMode) => void
}

// Context type
type AIControlContextType = AIControlState & AIControlActions

// Initial state
const initialState: AIControlState = {
  currentMode: 'landing',
  currentTheme: 'default',
  voiceState: 'idle',
  activeComponents: {
    chat: false,
    projects: false,
    skills: false,
    resume: false,
    about: false,
    contact: false,
  },
  lastAIMessage: '',
  isTransitioning: false,
  backgroundIntensity: 50,
  emotionalTone: 'neutral',
  chatMode: 'ai_control', // Default to AI Control mode
}

// Create context
const AIControlContext = createContext<AIControlContextType | undefined>(undefined)

// Provider component
export function AIControlProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AIControlState>(initialState)

  const setMode = useCallback((mode: UIMode) => {
    setState((prev) => ({ ...prev, currentMode: mode, isTransitioning: true }))
    setTimeout(() => setState((prev) => ({ ...prev, isTransitioning: false })), 600)
  }, [])

  const setTheme = useCallback((theme: Theme) => {
    setState((prev) => ({ ...prev, currentTheme: theme }))
  }, [])

  const setVoiceState = useCallback((voiceState: VoiceState) => {
    setState((prev) => ({ ...prev, voiceState }))
  }, [])

  const toggleComponent = useCallback((component: keyof ActiveComponents, visible: boolean) => {
    setState((prev) => ({
      ...prev,
      activeComponents: { ...prev.activeComponents, [component]: visible },
    }))
  }, [])

  const setLastAIMessage = useCallback((message: string) => {
    setState((prev) => ({ ...prev, lastAIMessage: message }))
  }, [])

  const setEmotionalTone = useCallback((tone: AIControlState['emotionalTone']) => {
    setState((prev) => ({ ...prev, emotionalTone: tone }))
  }, [])

  const setBackgroundIntensity = useCallback((intensity: number) => {
    setState((prev) => ({ ...prev, backgroundIntensity: intensity }))
  }, [])

  const setIsTransitioning = useCallback((isTransitioning: boolean) => {
    setState((prev) => ({ ...prev, isTransitioning }))
  }, [])

  const setChatMode = useCallback((chatMode: ChatMode) => {
    setState((prev) => ({ ...prev, chatMode }))
  }, [])

  const processAIIntent = useCallback(
    (intent: AIIntent) => {
      console.log('🎛️ Processing AI Intent:', intent)

      switch (intent.type) {
        case 'show_projects':
          setMode('projects')
          toggleComponent('projects', true)
          toggleComponent('chat', false) // Hide chat to show content
          setEmotionalTone('excited')
          break

        case 'show_skills':
          setMode('skills')
          toggleComponent('skills', true)
          toggleComponent('chat', false) // Hide chat to show content
          setEmotionalTone('focused')
          break

        case 'show_resume':
          setMode('resume')
          toggleComponent('resume', true)
          toggleComponent('chat', false) // Hide chat to show content
          setEmotionalTone('focused')
          break

        case 'show_about':
          setMode('about')
          toggleComponent('about', true)
          toggleComponent('chat', false) // Hide chat to show content
          setEmotionalTone('calm')
          break

        case 'show_contact':
          setMode('contact')
          toggleComponent('contact', true)
          toggleComponent('chat', false) // Hide chat to show content
          setEmotionalTone('neutral')
          break

        case 'change_theme':
          if (intent.value && typeof intent.value === 'string') {
            setTheme(intent.value as Theme)
          }
          break

        case 'switch_mode':
          if (intent.value && typeof intent.value === 'string') {
            setMode(intent.value as UIMode)
          }
          break

        case 'reset':
          resetUI()
          break

        default:
          console.warn('Unknown intent type:', intent.type)
      }
    },
    [setMode, toggleComponent, setEmotionalTone, setTheme],
  )

  const resetUI = useCallback(() => {
    setState({
      ...initialState,
      currentMode: 'landing',
    })
  }, [])

  const contextValue: AIControlContextType = {
    ...state,
    setMode,
    setTheme,
    setVoiceState,
    toggleComponent,
    setLastAIMessage,
    processAIIntent,
    resetUI,
    setEmotionalTone,
    setBackgroundIntensity,
    setIsTransitioning,
    setChatMode,
  }

  return <AIControlContext.Provider value={contextValue}>{children}</AIControlContext.Provider>
}

// Hook to use the context
export function useAIControl() {
  const context = useContext(AIControlContext)
  if (context === undefined) {
    throw new Error('useAIControl must be used within an AIControlProvider')
  }
  return context
}

// Intent detection helper
export function detectIntent(message: string): AIIntent | null {
  const lowerMessage = message.toLowerCase()

  // Projects intent
  if (
    lowerMessage.includes('project') ||
    lowerMessage.includes('work') ||
    lowerMessage.includes('portfolio') ||
    lowerMessage.includes('what have you built') ||
    lowerMessage.includes('show me your work')
  ) {
    return { type: 'show_projects' }
  }

  // Skills intent
  if (
    lowerMessage.includes('skill') ||
    lowerMessage.includes('technolog') ||
    lowerMessage.includes('what can you do') ||
    lowerMessage.includes('expertise') ||
    lowerMessage.includes('proficient')
  ) {
    return { type: 'show_skills' }
  }

  // Resume intent
  if (
    lowerMessage.includes('resume') ||
    lowerMessage.includes('cv') ||
    lowerMessage.includes('download') ||
    lowerMessage.includes('curriculum')
  ) {
    return { type: 'show_resume' }
  }

  // About intent
  if (
    lowerMessage.includes('about') ||
    lowerMessage.includes('who are you') ||
    lowerMessage.includes('tell me about yourself') ||
    lowerMessage.includes('background') ||
    lowerMessage.includes('story')
  ) {
    return { type: 'show_about' }
  }

  // Contact intent
  if (
    lowerMessage.includes('contact') ||
    lowerMessage.includes('reach') ||
    lowerMessage.includes('email') ||
    lowerMessage.includes('phone') ||
    lowerMessage.includes('get in touch') ||
    lowerMessage.includes('hire')
  ) {
    return { type: 'show_contact' }
  }

  // Reset intent
  if (
    lowerMessage.includes('reset') ||
    lowerMessage.includes('go back') ||
    lowerMessage.includes('start over') ||
    lowerMessage.includes('home')
  ) {
    return { type: 'reset' }
  }

  return null
}
