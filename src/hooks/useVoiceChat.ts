'use client'

import { useState, useCallback, useRef } from 'react'
import { useVoiceRecorder } from './useVoiceRecorder'
import { useAudioPlayer } from './useAudioPlayer'

export type InteractionType =
  | 'hr_screening'
  | 'technical_interview'
  | 'networking'
  | 'career_coaching'
  | 'general'

interface VoiceChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  audioUrl?: string
  interactionType?: InteractionType
}

interface VoiceChatOptions {
  interactionType?: InteractionType
  onMessageReceived?: (message: VoiceChatMessage) => void
  onError?: (error: string) => void
  autoPlayResponses?: boolean
  saveConversationHistory?: boolean
}

interface VoiceChatState {
  messages: VoiceChatMessage[]
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  currentInteractionType: InteractionType
  conversationId: string
  error: string | null
}

export const useVoiceChat = (options: VoiceChatOptions = {}) => {
  const {
    interactionType = 'general',
    onMessageReceived,
    onError,
    autoPlayResponses = true,
    saveConversationHistory = true,
  } = options

  const [state, setState] = useState<VoiceChatState>({
    messages: [],
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    currentInteractionType: interactionType,
    conversationId: generateConversationId(),
    error: null,
  })

  const conversationHistoryRef = useRef<VoiceChatMessage[]>([])
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Voice recorder hook
  const voiceRecorder = useVoiceRecorder({
    onTranscriptionReceived: handleTranscriptionReceived,
    onError: (error) => {
      // Filter out non-critical errors
      const isCriticalError =
        !error.includes('was stopped') && !error.includes('No speech detected')

      setState((prev) => ({
        ...prev,
        error: isCriticalError ? error : null,
        isListening: false,
      }))

      // Only notify for critical errors
      if (isCriticalError) {
        onError?.(error)
      }
    },
    continuous: false,
    interimResults: true,
  })

  // Audio player hook
  const audioPlayer = useAudioPlayer({
    onPlayStart: () => setState((prev) => ({ ...prev, isSpeaking: true })),
    onPlayEnd: () => setState((prev) => ({ ...prev, isSpeaking: false })),
    onError: (error) => {
      // List of audio errors that are browser-related and shouldn't be shown to users
      const browserAudioErrors = [
        'blocked by browser',
        'NotAllowedError',
        'no supported source was found',
        'Audio source not available',
        'Audio playback issue',
        'NETWORK_NO_SOURCE',
      ]

      // Check if this is a browser-related audio issue
      const isBrowserAudioIssue = browserAudioErrors.some((err) =>
        error.toLowerCase().includes(err.toLowerCase()),
      )

      if (isBrowserAudioIssue) {
        console.info('Audio restricted by browser - this is normal:', error)
        setState((prev) => ({ ...prev, isSpeaking: false }))
        // Don't call onError callback for browser restrictions
        return
      }

      // Only log genuine errors
      setState((prev) => ({ ...prev, error, isSpeaking: false }))
      onError?.(error)
    },
  })

  // Handle transcription from voice recorder
  async function handleTranscriptionReceived(transcript: string) {
    console.log('📝 Transcription received in useVoiceChat:', {
      transcript,
      length: transcript.length,
    })

    if (!transcript.trim()) {
      console.log('⚠️ Empty transcript, skipping...')
      return
    }

    // Add user message
    const userMessage: VoiceChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: transcript.trim(),
      timestamp: Date.now(),
      interactionType: state.currentInteractionType,
    }

    console.log('💬 Creating user message:', userMessage)

    // Update state and conversation history
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isListening: false,
      isProcessing: true,
      error: null,
    }))

    conversationHistoryRef.current.push(userMessage)
    onMessageReceived?.(userMessage)

    console.log('🚀 Processing user message...')
    // Process the message and get AI response
    await processUserMessage(transcript.trim())
  }

  // Process user message and get AI response
  const processUserMessage = useCallback(
    async (message: string) => {
      try {
        console.log('🔄 Processing user message:', message)
        setState((prev) => ({ ...prev, isProcessing: true, error: null }))

        // Prepare conversation context
        const conversationHistory = conversationHistoryRef.current
          .slice(-10) // Last 10 messages for context
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))

        console.log('📤 Calling /api/voice/conversation with:', {
          messageLength: message.length,
          interactionType: state.currentInteractionType,
          historyLength: conversationHistory.length,
        })

        // Call the professional voice conversation API
        const response = await fetch('/api/voice/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            interactionType: state.currentInteractionType,
            conversationHistory,
            context: {
              conversationId: state.conversationId,
              messageCount: conversationHistoryRef.current.length,
            },
          }),
        })

        console.log('📥 API Response status:', response.status)

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        console.log('✅ API Response data:', {
          success: data.success,
          hasAudioUrl: !!data.audioUrl,
        })

        if (!data.success) {
          throw new Error(data.error || 'Failed to get AI response')
        }

        // Create assistant message
        const assistantMessage: VoiceChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
          audioUrl: data.audioUrl,
          interactionType: state.currentInteractionType,
        }

        // Update state and conversation history
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isProcessing: false,
        }))

        conversationHistoryRef.current.push(assistantMessage)
        onMessageReceived?.(assistantMessage)

        // Auto-play response if enabled
        if (autoPlayResponses && data.response) {
          // Stop listening if mic is active to prevent echo
          if (state.isListening) {
            await voiceRecorder.stopRecording()
            setState((prev) => ({ ...prev, isListening: false }))
          }

          try {
            // Use ElevenLabs voice cloning if available, fallback to OpenAI
            await audioPlayer.playText(data.response, 'elevenlabs')
          } catch (audioError) {
            console.warn('Audio playback failed, trying fallback:', audioError)
            // Fallback to OpenAI TTS if ElevenLabs fails
            await audioPlayer.playText(data.response, 'alloy')
          }
        }
      } catch (error) {
        const errorMessage = `Failed to process message: ${error}`
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
        }))
        onError?.(errorMessage)
      }
    },
    [
      state.currentInteractionType,
      state.conversationId,
      state.isListening,
      audioPlayer,
      voiceRecorder,
      autoPlayResponses,
      onMessageReceived,
      onError,
    ],
  )

  // Start voice recording
  const startListening = useCallback(async () => {
    // Stop any current audio playback
    if (audioPlayer.isPlaying) {
      audioPlayer.stop()
    }

    setState((prev) => ({ ...prev, isListening: true, error: null }))
    const success = await voiceRecorder.startRecording()

    if (!success) {
      setState((prev) => ({ ...prev, isListening: false }))

      // Auto-retry for certain errors after a brief delay
      setTimeout(async () => {
        const retrySuccess = await voiceRecorder.startRecording()
        if (retrySuccess) {
          setState((prev) => ({ ...prev, isListening: true, error: null }))
        }
      }, 1500)
    }

    return success
  }, [audioPlayer, voiceRecorder])

  // Stop voice recording
  const stopListening = useCallback(() => {
    setState((prev) => ({ ...prev, isListening: false }))
    return voiceRecorder.stopRecording()
  }, [voiceRecorder])

  // Send text message (for typing interface)
  const sendTextMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return false

      // Add user message
      const userMessage: VoiceChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content: message.trim(),
        timestamp: Date.now(),
        interactionType: state.currentInteractionType,
      }

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }))

      conversationHistoryRef.current.push(userMessage)
      onMessageReceived?.(userMessage)

      // Process the message
      await processUserMessage(message.trim())
      return true
    },
    [state.currentInteractionType, processUserMessage, onMessageReceived],
  )

  // Change interaction type
  const setInteractionType = useCallback((newType: InteractionType) => {
    setState((prev) => ({ ...prev, currentInteractionType: newType }))
  }, [])

  // Clear conversation
  const clearConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      conversationId: generateConversationId(),
      error: null,
    }))
    conversationHistoryRef.current = []
  }, [])

  // Play message audio
  const playMessageAudio = useCallback(
    async (messageId: string) => {
      const message = state.messages.find((msg) => msg.id === messageId)
      if (!message) return false

      if (message.audioUrl) {
        return await audioPlayer.playFromUrl(message.audioUrl)
      } else if (message.role === 'assistant') {
        try {
          // Use ElevenLabs voice cloning for assistant messages
          return await audioPlayer.playText(message.content, 'elevenlabs')
        } catch (error) {
          console.warn('ElevenLabs playback failed, using fallback:', error)
          // Fallback to OpenAI TTS
          return await audioPlayer.playText(message.content, 'alloy')
        }
      }

      return false
    },
    [state.messages, audioPlayer],
  )

  // Get conversation summary
  const getConversationSummary = useCallback(() => {
    const messageCount = state.messages.length
    const userMessages = state.messages.filter((msg) => msg.role === 'user').length
    const assistantMessages = state.messages.filter((msg) => msg.role === 'assistant').length

    return {
      conversationId: state.conversationId,
      interactionType: state.currentInteractionType,
      messageCount,
      userMessages,
      assistantMessages,
      duration: messageCount > 0 ? Date.now() - state.messages[0].timestamp : 0,
    }
  }, [state])

  return {
    // State
    ...state,
    transcript: voiceRecorder.transcript,
    interimTranscript: voiceRecorder.interimTranscript,
    isSupported: voiceRecorder.isSupported,
    // Audio detection state (for visual feedback)
    isAudioCaptureActive: voiceRecorder.isAudioCaptureActive,
    isSoundDetected: voiceRecorder.isSoundDetected,
    isSpeechDetected: voiceRecorder.isSpeechDetected,
    audioPlayerState: {
      isPlaying: audioPlayer.isPlaying,
      isLoading: audioPlayer.isLoading,
      volume: audioPlayer.volume,
    },

    // Actions
    startListening,
    stopListening,
    sendTextMessage,
    setInteractionType,
    clearConversation,
    playMessageAudio,
    getConversationSummary,

    // Audio controls
    pauseAudio: audioPlayer.pause,
    resumeAudio: audioPlayer.resume,
    stopAudio: audioPlayer.stop,
    setVolume: audioPlayer.setVolume,
  }
}

// Utility functions
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
