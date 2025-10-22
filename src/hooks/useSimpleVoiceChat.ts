// Simplified Voice Chat Hook - Direct Deepgram integration
'use client'

import { useState, useRef, useCallback } from 'react'

interface SimpleVoiceChatOptions {
  onError?: (error: string) => void
}

interface VoiceChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  audioUrl?: string
}

export const useSimpleVoiceChat = (options: SimpleVoiceChatOptions = {}) => {
  const { onError } = options

  const [messages, setMessages] = useState<VoiceChatMessage[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Clear error after 5 seconds
  const clearError = useCallback(() => {
    setTimeout(() => setError(null), 5000)
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setIsRecording(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Use compatible format for all browsers
      const options = { mimeType: 'audio/webm' }

      // Fallback for Safari
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/mp4'
      }
      if (!MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/wav'
      }

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType })
        stream.getTracks().forEach((track) => track.stop())

        if (audioBlob.size > 1000) {
          // Only process if we have substantial audio
          await transcribeAndRespond(audioBlob)
        } else {
          setError('Recording too short or empty')
          clearError()
        }
        setIsRecording(false)
      }

      mediaRecorder.start()
      console.log('🎤 Recording started with format:', options.mimeType)
    } catch (err) {
      console.error('Recording error:', err)
      setError('Microphone access denied or unavailable')
      setIsRecording(false)
      clearError()
      onError?.('Failed to start recording')
    }
  }, [onError, clearError])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      console.log('🛑 Recording stopped')
    }
  }, [isRecording])

  // Transcribe audio and get response
  const transcribeAndRespond = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true)

      try {
        // Transcribe with Deepgram
        const formData = new FormData()
        formData.append('audio', audioBlob)

        console.log('📤 Sending audio for transcription:', {
          size: audioBlob.size,
          type: audioBlob.type,
        })

        const transcribeResponse = await fetch('/api/chat/transcribe', {
          method: 'POST',
          body: formData,
        })

        if (!transcribeResponse.ok) {
          throw new Error(`Transcription failed: ${transcribeResponse.statusText}`)
        }

        const transcribeData = await transcribeResponse.json()
        const transcript = transcribeData.transcript || transcribeData.text || ''

        if (!transcript.trim()) {
          setError('No speech detected in recording')
          clearError()
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
          throw new Error(`AI response failed: ${chatResponse.statusText}`)
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
          throw new Error(`Speech generation failed: ${speechResponse.statusText}`)
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

        // Play audio response
        if (audioUrl) {
          playAudio(audioUrl)
        }
      } catch (err) {
        console.error('Voice chat error:', err)
        setError(err instanceof Error ? err.message : 'Voice chat failed')
        clearError()
        onError?.(err instanceof Error ? err.message : 'Voice chat failed')
      } finally {
        setIsProcessing(false)
      }
    },
    [onError, clearError],
  )

  // Play audio
  const playAudio = useCallback(
    (audioUrl: string) => {
      try {
        // Stop any currently playing audio
        if (currentAudioRef.current) {
          currentAudioRef.current.pause()
          currentAudioRef.current = null
        }

        const audio = new Audio(audioUrl)
        currentAudioRef.current = audio

        audio.onloadstart = () => setIsSpeaking(true)
        audio.onended = () => {
          setIsSpeaking(false)
          currentAudioRef.current = null
        }
        audio.onerror = () => {
          setIsSpeaking(false)
          currentAudioRef.current = null
          setError('Audio playback failed')
          clearError()
        }

        audio.play().catch((err) => {
          console.error('Audio play error:', err)
          setIsSpeaking(false)
          setError('Audio playback blocked by browser')
          clearError()
        })
      } catch (err) {
        console.error('Audio setup error:', err)
        setError('Audio playback failed')
        clearError()
      }
    },
    [clearError],
  )

  // Stop audio
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
      setIsSpeaking(false)
    }
  }, [])

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([])
    stopAudio()
  }, [stopAudio])

  return {
    messages,
    isRecording,
    isProcessing,
    isSpeaking,
    error,
    isSupported: typeof window !== 'undefined' && 'mediaDevices' in navigator,
    startRecording,
    stopRecording,
    playAudio,
    stopAudio,
    clearConversation,
  }
}
