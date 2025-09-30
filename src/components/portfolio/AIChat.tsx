'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Shield,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Settings,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'
import { useVoiceChat, InteractionType } from '@/hooks/useVoiceChat'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isVoice?: boolean
}

const interactionTypes = [
  { value: 'general' as InteractionType, label: 'General Chat', icon: '💬' },
  { value: 'hr_screening' as InteractionType, label: 'HR Screening', icon: '📞' },
  { value: 'technical_interview' as InteractionType, label: 'Technical Interview', icon: '💻' },
  { value: 'networking' as InteractionType, label: 'Networking', icon: '🤝' },
  { value: 'career_coaching' as InteractionType, label: 'Career Coaching', icon: '🎯' },
]

export function AIChat() {
  const { data: session, status } = useSession()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [currentInteractionType, setCurrentInteractionType] = useState<InteractionType>('general')

  // Voice chat integration
  const voiceChat = useVoiceChat({
    interactionType: currentInteractionType,
    autoPlayResponses: true,
    onError: (error) => {
      console.error('Voice chat error:', error)

      // Show user-friendly error messages for common issues
      if (error.includes('Microphone permission denied')) {
        // Don't show this as a blocking error, user can still type
        console.warn('Microphone permission needed for voice features')
      } else if (error.includes('not supported')) {
        console.warn('Voice features not supported in this browser')
      } else if (error.includes('Network error')) {
        console.warn('Network issue affecting voice features')
      }
    },
  })

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: session?.user
        ? `Hi ${session.user.name}! I'm Sajal, and I'm excited to chat with you about my background and experience. Feel free to ask me anything about my work, skills, projects, or how we might collaborate together. You can type your questions or use the voice feature to have a natural conversation. What would you like to know?`
        : "Hi! I'm Sajal, and I'm excited to chat with you about my background and experience. Sign in with Google for a personalized experience, or feel free to ask me anything about my work, skills, projects, or how we might collaborate together. You can type your questions or use the voice feature to have a natural conversation. What would you like to know?",
      role: 'assistant',
      timestamp: new Date('2024-01-01T12:00:00'), // Fixed timestamp to prevent hydration mismatch
    },
  ])

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sync voice messages with regular messages
  useEffect(() => {
    if (voiceChat.messages.length > 0) {
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
      }
    }
  }, [voiceChat.messages, messages])

  // Handle voice interaction type changes
  const handleInteractionTypeChange = (type: InteractionType) => {
    setCurrentInteractionType(type)
    voiceChat.setInteractionType(type)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          enhancedMode: true,
          interviewType: 'general', // You can change this to: 'technical', 'behavioral', 'executive'
          user: session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
              }
            : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true, // Explicitly set to ensure consistency
    })
  }

  return (
    <section id="ai-chat" className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h2 className="text-4xl font-bold">Chat with Sajal</h2>
            <Mic className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 mb-6">
            Ask me anything about Sajal&apos;s background, skills, experience, or projects!
            <br />
            <span className="text-purple-600 font-medium">
              ✨ Now with Voice AI - Type or Speak naturally!
            </span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card border rounded-xl shadow-lg overflow-hidden"
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Sajal Basnet</h3>
                  <p className="text-sm text-blue-100">
                    Ask me about my background (Text or Voice)
                  </p>
                </div>
              </div>

              {/* Voice Controls */}
              <div className="flex items-center space-x-2">
                {/* Voice Status Indicators */}
                {voiceChat.isListening && (
                  <div className="flex items-center space-x-1 text-sm bg-red-500/20 px-2 py-1 rounded">
                    <Mic className="w-4 h-4 text-red-200" />
                    <span className="text-red-200">Listening...</span>
                  </div>
                )}

                {voiceChat.audioPlayerState.isPlaying && (
                  <div className="flex items-center space-x-1 text-sm bg-green-500/20 px-2 py-1 rounded">
                    <Volume2 className="w-4 h-4 text-green-200" />
                    <span className="text-green-200">Speaking...</span>
                  </div>
                )}

                {voiceChat.isProcessing && (
                  <div className="flex items-center space-x-1 text-sm bg-orange-500/20 px-2 py-1 rounded">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-200" />
                    <span className="text-orange-200">Processing...</span>
                  </div>
                )}

                {/* Settings Button */}
                <button
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  title="Voice Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Auth Section */}
              <div className="flex items-center space-x-2">
                {status === 'unauthenticated' && (
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-200" />
                    <span className="text-xs text-blue-200">Sign in for personalized chat</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Voice Settings Panel */}
          {showVoiceSettings && (
            <div className="bg-gray-50 border-b px-4 py-3">
              <h4 className="font-medium text-gray-900 mb-3">Voice Interaction Type</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {interactionTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleInteractionTypeChange(type.value)}
                    className={`flex items-center space-x-2 p-2 rounded-lg text-left transition-colors text-sm ${
                      currentInteractionType === type.value
                        ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                        : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-600">
                Current mode:{' '}
                <strong>
                  {interactionTypes.find((t) => t.value === currentInteractionType)?.label}
                </strong>
              </div>
            </div>
          )}

          {/* Auth Bar - Show when not authenticated */}
          {status === 'unauthenticated' && (
            <div className="bg-blue-50 border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-700">
                  Sign in with Google for a personalized chat experience
                </p>
                <GoogleAuthButton callbackUrl="/#ai-chat" className="text-xs" />
              </div>
            </div>
          )}

          {/* User Info Bar - Show when authenticated */}
          {status === 'authenticated' && session?.user && (
            <div className="bg-green-50 border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm text-green-700">
                    Welcome, {session.user.name}! Enjoy your personalized chat experience.
                  </p>
                </div>
                <GoogleAuthButton callbackUrl="/" className="text-xs" />
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex space-x-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-line">{message.content}</div>
                    <div className="flex items-center justify-between mt-1">
                      <p
                        className={`text-xs ${
                          message.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                        }`}
                      >
                        {isMounted ? formatTime(message.timestamp) : ''}
                        {message.isVoice && (
                          <span className="ml-2 px-1 py-0.5 bg-purple-500/20 text-purple-700 rounded text-xs">
                            🎙️ Voice
                          </span>
                        )}
                      </p>
                      {message.role === 'assistant' && (
                        <button
                          onClick={() =>
                            voiceChat.playMessageAudio(message.id.replace('voice_', ''))
                          }
                          className="ml-2 p-1 rounded hover:bg-gray-200 transition-colors"
                          title="Play audio"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {/* Real-time voice transcript */}
            {(voiceChat.transcript || voiceChat.interimTranscript) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-end"
              >
                <div className="max-w-[80%] flex space-x-2">
                  <div className="flex-1"></div>
                  <div className="bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg px-4 py-2">
                    <div className="text-blue-900 text-sm">
                      {voiceChat.transcript}
                      <span className="opacity-60">{voiceChat.interimTranscript}</span>
                    </div>
                    <p className="text-xs text-blue-600">🎙️ Live transcript...</p>
                  </div>
                </div>
              </motion.div>
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Form with Voice Controls */}
          <div className="border-t p-4">
            {/* Voice Support Warning */}
            {!voiceChat.isSupported && (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  🎙️ Voice input not supported in this browser. Please use Chrome, Safari, Firefox,
                  or Edge for voice features.
                </p>
              </div>
            )}

            {/* Voice Error Display */}
            {voiceChat.error && voiceChat.error.includes('Microphone permission') && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-700">
                    🎙️ Microphone access needed for voice features
                  </p>
                  <button
                    onClick={() => voiceChat.startListening()}
                    className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-red-800"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {voiceChat.error && voiceChat.error.includes('Network error') && (
              <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-orange-700">🌐 Connection issue with voice service</p>
                  <button
                    onClick={() => voiceChat.startListening()}
                    className="text-xs bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded text-orange-800"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Text Input Row */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about my experience, skills, projects... or use voice"
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                  disabled={isLoading || voiceChat.isListening}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading || voiceChat.isListening}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Voice Controls Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Main Voice Button */}
                  <button
                    type="button"
                    onClick={() =>
                      voiceChat.isListening ? voiceChat.stopListening() : voiceChat.startListening()
                    }
                    disabled={!voiceChat.isSupported || isLoading}
                    className={`p-3 rounded-full transition-all duration-200 shadow-lg ${
                      voiceChat.isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white scale-110'
                        : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
                    } ${(!voiceChat.isSupported || isLoading) && 'opacity-50 cursor-not-allowed'}`}
                    title={voiceChat.isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {voiceChat.isListening ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>

                  {/* Audio Control Buttons */}
                  {voiceChat.audioPlayerState.isPlaying && (
                    <button
                      type="button"
                      onClick={voiceChat.pauseAudio}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
                      title="Pause audio"
                    >
                      <VolumeX className="w-4 h-4" />
                    </button>
                  )}

                  {/* Voice Status Text */}
                  <div className="text-sm text-gray-600">
                    {voiceChat.isListening && (
                      <span className="text-red-600 font-medium">🎙️ Listening...</span>
                    )}
                    {voiceChat.isProcessing && (
                      <span className="text-orange-600 font-medium">⚡ Processing...</span>
                    )}
                    {voiceChat.audioPlayerState.isPlaying && (
                      <span className="text-blue-600 font-medium">🔊 Speaking...</span>
                    )}
                    {!voiceChat.isListening &&
                      !voiceChat.isProcessing &&
                      !voiceChat.audioPlayerState.isPlaying &&
                      voiceChat.isSupported && (
                        <span className="text-gray-500">Click mic to speak or type below</span>
                      )}
                    {voiceChat.error && voiceChat.error.includes('No speech detected') && (
                      <span className="text-amber-600 font-medium">
                        🎙️ No speech detected - try again
                      </span>
                    )}
                  </div>
                </div>

                {/* Clear Conversation */}
                <div className="flex items-center space-x-2">
                  {(messages.length > 1 || voiceChat.messages.length > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMessages([messages[0]]) // Keep initial message
                        voiceChat.clearConversation()
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Clear Chat
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Sample Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold mb-4 text-center">
            Try asking about (Text or Voice):
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              'What technologies do you specialize in?',
              'Tell me about your recent projects',
              "What's your experience with AI/ML?",
              'How can I contact you?',
              'What companies have you worked for?',
              'What are your key achievements?',
            ].map((question, index) => (
              <button
                key={index}
                onClick={() => setInputValue(question)}
                className="text-left p-3 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
              >
                "{question}"
              </button>
            ))}
          </div>

          {/* Voice Features Info */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
            <h4 className="font-semibold text-purple-900 mb-2">🎙️ Voice AI Features</h4>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-purple-800">
              <div>
                <strong>• Real-time Speech Recognition</strong> - Speak naturally and see live
                transcription
              </div>
              <div>
                <strong>• Professional Voice Responses</strong> - High-quality AI voice synthesis
              </div>
              <div>
                <strong>• Multiple Interaction Types</strong> - HR screening, technical interviews,
                networking
              </div>
              <div>
                <strong>• Context-Aware Conversations</strong> - Remembers conversation history
              </div>
            </div>
            <div className="mt-3 text-xs text-purple-600">
              💡 <strong>Tip:</strong> Click the settings icon in the chat header to choose
              different conversation modes like HR Screening or Technical Interview for specialized
              responses.
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
