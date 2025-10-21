'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Bot,
  User,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  Settings,
  Phone,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useVoiceChat, InteractionType } from '@/hooks/useVoiceChat'
import { useAIControl, detectIntent } from '@/contexts/AIControlContext'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isVoice?: boolean
}

export function AIControllerChat() {
  const { data: session } = useSession()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [currentInteractionType, setCurrentInteractionType] = useState<InteractionType>('general')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const localAudioRef = useRef<HTMLAudioElement | null>(null)

  // Get context first
  const {
    setMode,
    setVoiceState,
    setLastAIMessage,
    processAIIntent,
    setEmotionalTone,
    voiceState,
    chatMode,
    setChatMode,
    toggleComponent,
  } = useAIControl()

  // Separate message histories for each chat mode
  const [aiControlMessages, setAiControlMessages] = useState<Message[]>([
    {
      id: '1',
      content: session?.user
        ? `Hi ${session.user.name}! 🤖 I'll show you visual content instead of text descriptions. Use the quick buttons below or just ask me to show you something!`
        : "Hi! 🤖 I'll show you visual content instead of text descriptions. Use the quick buttons below or just ask me to show you something!",
      role: 'assistant',
      timestamp: new Date(),
    },
  ])

  const [plainChatMessages, setPlainChatMessages] = useState<Message[]>([
    {
      id: '1',
      content: session?.user
        ? `Hi ${session.user.name}! 💬 I'll answer your questions with detailed text responses. No UI changes - just pure conversation about my background, skills, projects, and experience.`
        : "Hi! 💬 I'll answer your questions with detailed text responses. No UI changes - just pure conversation about my background, skills, projects, and experience.",
      role: 'assistant',
      timestamp: new Date(),
    },
  ])

  const [voiceChatMessages, setVoiceChatMessages] = useState<Message[]>([
    {
      id: '1',
      content: session?.user
        ? `Hi ${session.user.name}! 🎙️ Ready for voice chat!`
        : 'Hi! 🎙️ Ready for voice chat!',
      role: 'assistant',
      timestamp: new Date(),
    },
  ])

  // Use the appropriate messages based on current chat mode
  const messages =
    chatMode === 'ai_control'
      ? aiControlMessages
      : chatMode === 'plain_chat'
        ? plainChatMessages
        : voiceChatMessages

  const setMessages =
    chatMode === 'ai_control'
      ? setAiControlMessages
      : chatMode === 'plain_chat'
        ? setPlainChatMessages
        : setVoiceChatMessages

  // Voice chat integration
  const voiceChat = useVoiceChat({
    interactionType: currentInteractionType,
    autoPlayResponses: true,
    onError: (error) => {
      const browserAudioErrors = [
        'blocked by browser',
        'NotAllowedError',
        'no supported source was found',
        'Audio source not available',
      ]
      const isBrowserAudioIssue = browserAudioErrors.some((err) =>
        error.toLowerCase().includes(err.toLowerCase()),
      )
      if (!isBrowserAudioIssue) {
        console.error('Voice chat error:', error)
      }
    },
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Sync voice state with context
  useEffect(() => {
    if (voiceChat.isListening) {
      setVoiceState('listening')
    } else if (voiceChat.isSpeaking || voiceChat.audioPlayerState.isPlaying) {
      setVoiceState('speaking')
    } else if (voiceChat.isProcessing) {
      setVoiceState('processing')
    } else {
      setVoiceState('idle')
    }
  }, [
    voiceChat.isListening,
    voiceChat.isSpeaking,
    voiceChat.isProcessing,
    voiceChat.audioPlayerState.isPlaying,
    setVoiceState,
  ])

  // Sync voice messages - Skip in voice chat mode since we don't display text
  useEffect(() => {
    if (voiceChat.messages.length > 0 && chatMode !== 'voice_chat') {
      const latestVoiceMessage = voiceChat.messages[voiceChat.messages.length - 1]
      const existingMessage = messages.find((m) => m.id === `voice_${latestVoiceMessage.id}`)

      if (!existingMessage) {
        const newMessage: Message = {
          id: `voice_${latestVoiceMessage.id}`,
          content: latestVoiceMessage.content,
          role: latestVoiceMessage.role,
          timestamp: new Date(latestVoiceMessage.timestamp),
          isVoice: true,
        }
        setMessages((prev) => [...prev, newMessage])

        if (newMessage.role === 'assistant') {
          handleAIResponse(newMessage.content)
        }
      }
    }
  }, [voiceChat.messages, chatMode])

  const handleAIResponse = (content: string, isAIControl: boolean = false) => {
    setLastAIMessage(content)

    // Only process intents in AI Control mode
    if (chatMode === 'ai_control' || isAIControl) {
      // Detect intent from AI response or user message
      const intent = detectIntent(content)
      if (intent) {
        console.log('🎯 Detected intent from AI:', intent)
        // Auto-hide chat and show content in AI Control mode - give time to read response
        setTimeout(() => {
          processAIIntent(intent)
        }, 1500)
      }

      // Set emotional tone based on content
      if (
        content.includes('exciting') ||
        content.includes('amazing') ||
        content.includes('great')
      ) {
        setEmotionalTone('excited')
      } else if (
        content.includes('skill') ||
        content.includes('technical') ||
        content.includes('expertise')
      ) {
        setEmotionalTone('focused')
      } else if (
        content.includes('pleasure') ||
        content.includes('nice') ||
        content.includes('hello')
      ) {
        setEmotionalTone('calm')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    // Prevent text input in voice chat mode
    if (chatMode === 'voice_chat') {
      console.log('🎙️ Voice Chat Mode: Text input disabled')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Detect intent in AI Control mode and provide brief response
    if (chatMode === 'ai_control') {
      const intent = detectIntent(inputValue)
      if (intent) {
        console.log('🎯 Detected intent from user:', intent)

        // Provide brief response based on intent type
        let briefResponse = ''
        switch (intent.type) {
          case 'show_projects':
            briefResponse = 'Here are my projects! ✨'
            break
          case 'show_skills':
            briefResponse = 'Check out my skills! 🚀'
            break
          case 'show_resume':
            briefResponse = 'Here are my projects! ✨'
            break
          case 'show_contact':
            briefResponse = "Let's connect! 📧"
            break
          case 'show_about':
            briefResponse = "Here's my story! 👋"
            break
          default:
            briefResponse = 'Here you go! ✨'
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: briefResponse,
          role: 'assistant',
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        handleAIResponse(inputValue, true)
        setIsLoading(false)
        return
      }
    }

    // For Plain Chat mode, ALWAYS call API - no brief responses

    // For Plain Chat mode OR AI Control mode without intent, get detailed response from API
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          enhancedMode: chatMode !== 'ai_control', // Force enhanced mode for Plain Chat and Voice Chat
          interviewType: chatMode !== 'ai_control' ? 'general' : 'brief',
          user: session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
              }
            : undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      // Only process intents and auto-hide in AI Control mode
      if (chatMode === 'ai_control') {
        handleAIResponse(data.response, true)
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting right now. Please try again.",
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const unlockAudio = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      gainNode.gain.value = 0
      oscillator.frequency.value = 440
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.01)
      return true
    } catch (error) {
      console.log('⚠️ Audio unlock failed:', error)
      return false
    }
  }

  const stopVoice = () => {
    voiceChat.stopListening()
    voiceChat.stopAudio()
    setVoiceState('idle')
  }

  // Helper function to render message content with clickable links
  const renderMessageContent = (content: string) => {
    // Convert markdown links [text](url) to clickable HTML
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts: (string | React.ReactNode)[] = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }

      // Add the clickable link
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {match[1]}
        </a>,
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }

    return parts.length > 0 ? parts : content
  }

  const handlePhoneCall = () => {
    window.location.href = 'tel:+61278044137'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Chat window */}
      <motion.div
        className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden
        h-[85vh] sm:h-[80vh] md:h-[80vh] mobile-vh-fix"
        style={{
          height: 'min(85vh, calc(100vh - 4rem))', // Mobile friendly height
          maxHeight: 'calc(100vh - 2rem)', // Tighter constraints on mobile
        }}
        initial={{ y: 50 }}
        animate={{ y: 0 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div
              className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-lg"
              animate={{
                boxShadow:
                  voiceState === 'speaking'
                    ? ['0 0 0 0 rgba(255,255,255,0.4)', '0 0 0 20px rgba(255,255,255,0)']
                    : '0 0 0 0 rgba(255,255,255,0)',
              }}
              transition={{ duration: 1.5, repeat: voiceState === 'speaking' ? Infinity : 0 }}
            >
              <Bot className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h3 className="font-bold text-white text-xl">Sajal's Digital Twin</h3>
              <p className="text-blue-100 text-sm">
                {voiceState === 'listening' && '🎙️ Listening...'}
                {voiceState === 'speaking' && '🔊 Speaking...'}
                {voiceState === 'processing' && '⚡ Processing...'}
                {voiceState === 'idle' && '💬 Ready to chat'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Phone Call Button */}
            <button
              onClick={handlePhoneCall}
              className="p-2 bg-green-500/80 hover:bg-green-600 rounded-lg transition-colors"
              title="Call +61 2 7804 4137"
            >
              <Phone className="w-5 h-5 text-white" />
            </button>

            {/* Chat Mode Toggle */}
            <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setChatMode('ai_control')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  chatMode === 'ai_control'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
                title="AI Control: Brief responses + instant UI visualization"
              >
                🤖 AI Control
              </button>
              <button
                onClick={() => setChatMode('plain_chat')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  chatMode === 'plain_chat'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
                title="Plain Chat: Detailed text responses + no UI changes"
              >
                💬 Plain Chat
              </button>
              <button
                onClick={() => setChatMode('voice_chat')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  chatMode === 'voice_chat'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
                title="Voice Chat: Voice-only conversation, no text input"
              >
                🎙️ Voice Chat
              </button>
            </div>

            <button
              onClick={() => setMode('landing')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Messages - Hidden in Voice Chat mode */}
        {chatMode !== 'voice_chat' && (
          <div className="h-[calc(100%-180px)] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex space-x-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <motion.div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
                          : 'bg-white/10 backdrop-blur-lg text-white border border-white/10'
                      }`}
                      animate={{
                        boxShadow:
                          message.role === 'assistant'
                            ? [
                                '0 0 0 rgba(147, 51, 234, 0)',
                                '0 0 20px rgba(147, 51, 234, 0.3)',
                                '0 0 0 rgba(147, 51, 234, 0)',
                              ]
                            : undefined,
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <p className="text-sm whitespace-pre-line">
                        {renderMessageContent(message.content)}
                      </p>
                      {message.isVoice && (
                        <span className="text-xs opacity-70 mt-1 block">🎙️ Voice</span>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-4 py-3 border border-white/10">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Voice Chat Mode - Show voice status instead of messages */}
        {chatMode === 'voice_chat' && (
          <div className="h-[calc(100%-180px)] flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                {voiceChat.isListening ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Mic className="w-12 h-12 text-white" />
                  </motion.div>
                ) : voiceChat.audioPlayerState.isPlaying || voiceState === 'speaking' ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <Volume2 className="w-12 h-12 text-white" />
                  </motion.div>
                ) : (
                  <Mic className="w-12 h-12 text-white opacity-50" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Voice Chat Mode</h3>
              <p className="text-white/70 mb-4">
                {voiceChat.isListening
                  ? '🎙️ Listening... Speak now'
                  : voiceChat.audioPlayerState.isPlaying || voiceState === 'speaking'
                    ? '🔊 AI is speaking...'
                    : voiceChat.isProcessing
                      ? '⚡ Processing your message...'
                      : 'Click the microphone to start talking'}
              </p>
            </div>
          </div>
        )}

        {/* Quick Action Buttons - Different for each mode - Only show when messages are few and not in voice chat */}
        {chatMode !== 'voice_chat' && messages.length <= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 left-0 right-0 px-6"
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
              <p className="text-white/70 text-sm mb-3 text-center">
                {chatMode === 'ai_control' ? 'Quick Actions:' : 'Quick Questions:'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {chatMode === 'ai_control' ? (
                  // AI Control Mode: Visual action buttons
                  <>
                    <button
                      onClick={() => {
                        setInputValue('show me about section')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      About
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('show me your experience')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Experience
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('show me your skills')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Skills
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('show me your projects')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Projects
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('show me your contact')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Contact
                    </button>
                  </>
                ) : (
                  // Plain Chat Mode: Question buttons
                  <>
                    <button
                      onClick={() => {
                        setInputValue('What are your key skills and technical expertise?')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      💡 Skills
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('Tell me about your professional experience and background')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      💼 Experience
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('What projects have you worked on recently?')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      🚀 Projects
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('How can I get in touch with you?')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      📧 Contact
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent safe-area-inset-bottom">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2 sm:space-x-3">
            {/* Voice Buttons - Only show in Voice Chat mode */}
            {chatMode === 'voice_chat' && (
              <>
                {/* Mic Button */}
                <motion.button
                  type="button"
                  onClick={async () => {
                    await unlockAudio()
                    if (voiceChat.isListening) {
                      voiceChat.stopListening()
                    } else {
                      // CRITICAL: Stop any playing audio before starting mic to prevent feedback loop
                      if (voiceChat.audioPlayerState.isPlaying || voiceState === 'speaking') {
                        console.log('🛑 Stopping audio before mic recording to prevent feedback')
                        voiceChat.stopAudio()
                        stopVoice()
                        // Stop local audio if playing
                        if (localAudioRef.current) {
                          localAudioRef.current.pause()
                          localAudioRef.current.currentTime = 0
                          localAudioRef.current = null
                        }
                        // Wait for audio to fully stop
                        await new Promise((resolve) => setTimeout(resolve, 200))
                      }
                      voiceChat.startListening()
                    }
                  }}
                  disabled={
                    !isMounted ||
                    !voiceChat.isSupported ||
                    voiceChat.audioPlayerState.isPlaying ||
                    voiceState === 'speaking'
                  }
                  className={`p-3 sm:p-4 rounded-full transition-all ${
                    voiceChat.isListening
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                  } disabled:opacity-50`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {voiceChat.isListening ? (
                    <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                </motion.button>

                {/* Play/Stop Voice Button - Always visible next to Mic */}
                <motion.button
                  type="button"
                  onClick={async () => {
                    await unlockAudio()

                    // CRITICAL: Check if audio is actually playing using localAudioRef
                    const isActuallyPlaying = localAudioRef.current && !localAudioRef.current.paused

                    if (
                      isActuallyPlaying ||
                      voiceChat.audioPlayerState.isPlaying ||
                      voiceState === 'speaking'
                    ) {
                      // Currently playing - stop it
                      console.log('⏹️ Stopping voice playback')
                      voiceChat.stopAudio()
                      setVoiceState('idle') // Set to idle immediately
                      stopVoice()
                      // Stop local audio if playing
                      if (localAudioRef.current) {
                        localAudioRef.current.pause()
                        localAudioRef.current.currentTime = 0
                        localAudioRef.current.src = '' // Clear the source to prevent replay
                        localAudioRef.current = null
                      }
                    } else {
                      // CRITICAL: Stop any existing audio before starting new playback
                      if (localAudioRef.current) {
                        console.log('🧹 Cleaning up existing audio before new playback')
                        localAudioRef.current.pause()
                        localAudioRef.current.currentTime = 0
                        localAudioRef.current.src = ''
                        localAudioRef.current = null
                      }

                      // Not playing - start playing last assistant message
                      // CRITICAL: Stop mic if it's recording to prevent feedback
                      if (voiceChat.isListening) {
                        console.log('🛑 Stopping mic before playing voice to prevent feedback')
                        voiceChat.stopListening()
                        await new Promise((resolve) => setTimeout(resolve, 200))
                      }

                      // Find last assistant message and play it
                      const lastAssistantMessage = messages
                        .slice()
                        .reverse()
                        .find((m) => m.role === 'assistant')

                      if (lastAssistantMessage) {
                        console.log('▶️ Playing last assistant message')
                        // Trigger text-to-speech for the message
                        setVoiceState('speaking')
                        // The voiceChat will automatically play via autoPlayResponses
                        // Or we can manually trigger TTS via the API
                        const playAudio = async () => {
                          try {
                            const response = await fetch('/api/voice/speech', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                text: lastAssistantMessage.content,
                                voice: 'alloy',
                                provider: 'elevenlabs',
                                language: 'auto',
                              }),
                            })

                            if (response.ok) {
                              const audioBlob = await response.blob()
                              const audioUrl = URL.createObjectURL(audioBlob)
                              const audio = new Audio(audioUrl)
                              localAudioRef.current = audio

                              audio.onended = () => {
                                setVoiceState('idle')
                                URL.revokeObjectURL(audioUrl)
                                localAudioRef.current = null
                              }

                              audio.onerror = () => {
                                setVoiceState('idle')
                                URL.revokeObjectURL(audioUrl)
                                localAudioRef.current = null
                              }

                              await audio.play()
                            } else {
                              setVoiceState('idle')
                            }
                          } catch (error) {
                            console.error('Failed to play audio:', error)
                            setVoiceState('idle')
                          }
                        }
                        playAudio()
                      }
                    }
                  }}
                  disabled={
                    !isMounted ||
                    messages.filter((m) => m.role === 'assistant').length === 0 ||
                    voiceChat.isListening
                  }
                  className={`p-3 sm:p-4 rounded-full transition-all ${
                    voiceChat.audioPlayerState.isPlaying || voiceState === 'speaking'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  } disabled:opacity-50`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={
                    voiceChat.audioPlayerState.isPlaying || voiceState === 'speaking'
                      ? 'Stop Voice'
                      : 'Play Last Response'
                  }
                >
                  {voiceChat.audioPlayerState.isPlaying || voiceState === 'speaking' ? (
                    <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                </motion.button>
              </>
            )}

            {/* Text input and submit - Hidden in Voice Chat mode */}
            {chatMode !== 'voice_chat' && (
              <>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything... or use voice"
                  className="flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all text-sm sm:text-base"
                  disabled={isLoading || voiceChat.isListening}
                />

                <motion.button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading || voiceChat.isListening}
                  className="p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </motion.button>
              </>
            )}

            {/* Voice Chat mode - Show larger voice status */}
            {chatMode === 'voice_chat' && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white/70 text-sm">
                  {voiceChat.isListening
                    ? '🎙️ Listening...'
                    : voiceChat.audioPlayerState.isPlaying || voiceState === 'speaking'
                      ? '🔊 AI Speaking...'
                      : voiceChat.isProcessing
                        ? '⚡ Processing...'
                        : 'Use microphone to speak'}
                </p>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}
