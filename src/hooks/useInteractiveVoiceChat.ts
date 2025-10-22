// Interactive Voice Chat Hook - Like Phone System
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface InteractiveVoiceChatOptions {
  onError?: (error: string) => void
}

interface VoiceChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  audioUrl?: string
}

type ConversationState = 'idle' | 'active' | 'listening' | 'processing' | 'speaking'

export const useInteractiveVoiceChat = (options: InteractiveVoiceChatOptions = {}) => {
  const { onError } = options

  const [messages, setMessages] = useState<VoiceChatMessage[]>([])
  const [conversationState, setConversationState] = useState<ConversationState>('idle')
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const thinkingAudioRef = useRef<HTMLAudioElement | null>(null)

  // Thinking sound URL (same as phone system)
  const THINKING_SOUND_URL =
    'https://brxp5nmtsramnrr1.public.blob.vercel-storage.com/phone-audio/thinking_natural.mp3'
  const conversationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clear error after 5 seconds
  const clearError = useCallback(() => {
    setTimeout(() => setError(null), 5000)
  }, [])

  // Play thinking sound (like phone system)
  const playThinkingSound = useCallback(() => {
    try {
      // Stop any existing thinking sound
      if (thinkingAudioRef.current) {
        thinkingAudioRef.current.pause()
        thinkingAudioRef.current.currentTime = 0
      }

      // Create and play new thinking sound
      const audio = new Audio(THINKING_SOUND_URL)
      audio.volume = 0.6 // Slightly quieter for web
      audio.play().catch(console.error)
      thinkingAudioRef.current = audio

      console.log('🤔 Playing thinking sound...')
    } catch (err) {
      console.error('Failed to play thinking sound:', err)
    }
  }, [THINKING_SOUND_URL])

  // Stop thinking sound
  const stopThinkingSound = useCallback(() => {
    if (thinkingAudioRef.current) {
      thinkingAudioRef.current.pause()
      thinkingAudioRef.current.currentTime = 0
      thinkingAudioRef.current = null
      console.log('⏹️ Stopped thinking sound')
    }
  }, [])

  // Start conversation mode
  const startConversation = useCallback(async () => {
    try {
      setError(null)
      setConversationState('active')

      // Get microphone permission and keep stream alive
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      streamRef.current = stream
      console.log('🎙️ Conversation mode activated - Ready to listen')

      // Start first listening session
      setTimeout(() => {
        startListening()
      }, 1000) // 1 second delay before first listen
    } catch (err) {
      console.error('Conversation start error:', err)
      setError('Microphone access denied')
      setConversationState('idle')
      clearError()
      onError?.('Failed to start conversation')
    }
  }, [onError, clearError])

  // Start listening for speech
  const startListening = useCallback(() => {
    if (
      !streamRef.current ||
      conversationState === 'processing' ||
      conversationState === 'speaking'
    ) {
      return
    }

    try {
      setConversationState('listening')

      // Use compatible format
      const options = { mimeType: 'audio/webm' }
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/mp4'
      }
      if (!MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/wav'
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, options)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType })

        if (audioBlob.size > 1000 && conversationState !== 'idle') {
          await processUserSpeech(audioBlob)
        } else if (conversationState !== 'idle') {
          // No speech detected, restart listening after a delay
          setTimeout(() => {
            if (conversationState === 'active') {
              startListening()
            }
          }, 2000)
        }
      }

      mediaRecorder.start()

      // Auto-stop recording after 10 seconds of recording (to detect speech)
      silenceTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 10000)

      console.log('👂 Listening for speech...')
    } catch (err) {
      console.error('Listening error:', err)
      setError('Failed to start listening')
      clearError()
    }
  }, [conversationState, clearError])

  // Process user speech
  const processUserSpeech = useCallback(
    async (audioBlob: Blob) => {
      setConversationState('processing')

      // Play thinking sound immediately for natural conversation feel
      playThinkingSound()

      try {
        // Transcribe
        const formData = new FormData()
        formData.append('audio', audioBlob)

        const transcribeResponse = await fetch('/api/chat/transcribe', {
          method: 'POST',
          body: formData,
        })

        if (!transcribeResponse.ok) {
          throw new Error('Transcription failed')
        }

        const transcribeData = await transcribeResponse.json()
        const transcript = transcribeData.transcript || transcribeData.text || ''

        if (!transcript.trim()) {
          // No speech, go back to listening
          setConversationState('active')
          setTimeout(() => startListening(), 1000)
          return
        }

        // Add user message
        const userMessage: VoiceChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: transcript,
          timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, userMessage])
        console.log('👤 User said:', transcript)

        // Get AI response
        const chatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: transcript }],
            voice_chat: true,
          }),
        })

        if (!chatResponse.ok) {
          throw new Error('AI response failed')
        }

        const chatData = await chatResponse.json()
        const aiResponse = chatData.content || chatData.message || 'Sorry, I could not respond.'

        // Generate speech
        const speechResponse = await fetch('/api/voice/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: aiResponse,
            language: transcribeData.detectedLanguage || 'en',
          }),
        })

        if (!speechResponse.ok) {
          throw new Error('Speech generation failed')
        }

        const speechData = await speechResponse.json()
        const audioUrl = speechData.audioUrl

        // Add AI message
        const aiMessage: VoiceChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: Date.now(),
          audioUrl,
        }

        setMessages((prev) => [...prev, aiMessage])

        // Play AI response
        if (audioUrl) {
          playAIResponse(audioUrl)
        } else {
          // No audio, go back to listening
          setConversationState('active')
          setTimeout(() => startListening(), 1000)
        }
      } catch (err) {
        console.error('Processing error:', err)
        // Stop thinking sound on error
        stopThinkingSound()

        setError(err instanceof Error ? err.message : 'Voice processing failed')
        clearError()

        // Go back to listening after error
        setConversationState('active')
        setTimeout(() => startListening(), 2000)
      }
    },
    [clearError, startListening, playThinkingSound, stopThinkingSound],
  )

  // Play AI response
  const playAIResponse = useCallback(
    (audioUrl: string) => {
      try {
        // Stop thinking sound - AI is about to speak
        stopThinkingSound()

        setConversationState('speaking')

        // Stop any existing audio
        if (currentAudioRef.current) {
          currentAudioRef.current.pause()
        }

        const audio = new Audio(audioUrl)
        currentAudioRef.current = audio

        audio.onended = () => {
          currentAudioRef.current = null
          // AI finished speaking, go back to listening
          if (conversationState !== 'idle') {
            setConversationState('active')
            setTimeout(() => startListening(), 1000) // Wait 1 second then listen again
          }
        }

        audio.onerror = () => {
          currentAudioRef.current = null
          setError('Audio playback failed')
          clearError()
          // Go back to listening
          setConversationState('active')
          setTimeout(() => startListening(), 1000)
        }

        audio.play().catch((err) => {
          console.error('Audio play error:', err)
          setConversationState('active')
          setTimeout(() => startListening(), 1000)
        })
      } catch (err) {
        console.error('Audio setup error:', err)
        setConversationState('active')
        setTimeout(() => startListening(), 1000)
      }
    },
    [conversationState, startListening, clearError, stopThinkingSound],
  )

  // Interrupt AI (user starts speaking while AI is talking)
  const interruptAI = useCallback(() => {
    // Stop AI speaking
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }

    // Stop thinking sound if playing
    stopThinkingSound()

    // Immediately start listening
    if (conversationState === 'speaking') {
      setConversationState('active')
      setTimeout(() => startListening(), 500) // Quick transition to listening
    }
  }, [conversationState, startListening, stopThinkingSound])

  // End conversation
  const endConversation = useCallback(() => {
    setConversationState('idle')

    // Stop all audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }

    // Stop thinking sound
    stopThinkingSound()

    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    // Close microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    // Clear timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
    }
    if (conversationTimeoutRef.current) {
      clearTimeout(conversationTimeoutRef.current)
    }

    console.log('🛑 Conversation ended')
  }, [stopThinkingSound])

  // Clear conversation messages
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endConversation()
    }
  }, [endConversation])

  return {
    messages,
    conversationState,
    error,
    isSupported: typeof window !== 'undefined' && 'mediaDevices' in navigator,
    startConversation,
    endConversation,
    interruptAI,
    clearMessages,
    // Derived states for UI
    isActive: conversationState !== 'idle',
    isListening: conversationState === 'listening',
    isProcessing: conversationState === 'processing',
    isSpeaking: conversationState === 'speaking',
  }
}
