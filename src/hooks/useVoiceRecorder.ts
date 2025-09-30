'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface VoiceRecorderOptions {
  onTranscriptionReceived?: (text: string) => void
  onAudioDataReceived?: (audioBlob: Blob) => void
  onError?: (error: string) => void
  continuous?: boolean
  interimResults?: boolean
}

interface AudioRecorderState {
  isRecording: boolean
  isSupported: boolean
  error: string | null
  transcript: string
  interimTranscript: string
  retryCount: number
  maxRetries: number
}

export const useVoiceRecorder = (options: VoiceRecorderOptions = {}) => {
  const {
    onTranscriptionReceived,
    onAudioDataReceived,
    onError,
    continuous = false,
    interimResults = true,
  } = options

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isSupported: typeof window !== 'undefined' && 'webkitSpeechRecognition' in window,
    error: null,
    transcript: '',
    interimTranscript: '',
    retryCount: 0,
    maxRetries: 3,
  })

  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const isUserStoppedRef = useRef<boolean>(false)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) {
      setState((prev) => ({
        ...prev,
        isSupported: false,
        error: 'Speech recognition not supported in this browser',
      }))
      return
    }

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setState((prev) => ({ ...prev, isRecording: true, error: null }))
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setState((prev) => ({
        ...prev,
        transcript: prev.transcript + finalTranscript,
        interimTranscript,
      }))

      if (finalTranscript && onTranscriptionReceived) {
        onTranscriptionReceived(finalTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      // Handle different types of speech recognition errors
      let errorMessage = ''
      let shouldNotify = true

      switch (event.error) {
        case 'aborted':
          errorMessage = 'Voice recognition was stopped'
          shouldNotify = false // Don't show error for user-initiated stops
          break
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking again.'
          break
        case 'audio-capture':
          errorMessage = 'Microphone access is required for voice input'
          break
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow access and try again.'
          break
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.'
          break
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not available'
          break
        default:
          errorMessage = `Speech recognition error: ${event.error}`
      }

      setState((prev) => ({
        ...prev,
        isRecording: false,
        error: shouldNotify ? errorMessage : null,
      }))

      if (shouldNotify) {
        onError?.(errorMessage)
      }
    }

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isRecording: false }))

      // If this wasn't a user-initiated stop and we're in continuous mode,
      // try to restart automatically
      if (!isUserStoppedRef.current && continuous && state.retryCount < state.maxRetries) {
        restartTimeoutRef.current = setTimeout(() => {
          setState((prev) => ({ ...prev, retryCount: prev.retryCount + 1 }))
          try {
            recognitionRef.current?.start()
            setState((prev) => ({ ...prev, isRecording: true }))
          } catch (error) {
            onError?.(`Failed to restart recognition: ${error}`)
          }
        }, 100) // Brief delay before restart
      }

      // Reset user stopped flag
      isUserStoppedRef.current = false
    }

    recognitionRef.current = recognition

    return () => {
      if (recognition) {
        recognition.stop()
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
    }
  }, [continuous, interimResults, onTranscriptionReceived, onError])

  // Initialize media recorder for audio capture
  const setupMediaRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []
        onAudioDataReceived?.(audioBlob)
      }

      mediaRecorderRef.current = mediaRecorder
      return true
    } catch (error) {
      const errorMessage = `Microphone access denied: ${error}`
      setState((prev) => ({ ...prev, error: errorMessage }))
      onError?.(errorMessage)
      return false
    }
  }, [onAudioDataReceived, onError])

  const startRecording = useCallback(async () => {
    if (!state.isSupported) {
      onError?.('Speech recognition not supported')
      return false
    }

    // Setup media recorder if needed
    if (!mediaRecorderRef.current) {
      const success = await setupMediaRecorder()
      if (!success) return false
    }

    try {
      // Clear previous transcripts and reset retry count
      setState((prev) => ({
        ...prev,
        transcript: '',
        interimTranscript: '',
        error: null,
        retryCount: 0,
      }))

      // Start speech recognition
      recognitionRef.current?.start()

      // Start audio recording
      if (mediaRecorderRef.current?.state === 'inactive') {
        mediaRecorderRef.current.start(1000) // Collect data every second
      }

      return true
    } catch (error) {
      // Handle automatic retry for certain errors
      if (state.retryCount < state.maxRetries) {
        setState((prev) => ({ ...prev, retryCount: prev.retryCount + 1 }))

        // Retry after a short delay
        setTimeout(() => {
          startRecording()
        }, 1000)

        return true
      }

      const errorMessage = `Failed to start recording after ${state.maxRetries} attempts: ${error}`
      setState((prev) => ({ ...prev, error: errorMessage, retryCount: 0 }))
      onError?.(errorMessage)
      return false
    }
  }, [state.isSupported, state.retryCount, state.maxRetries, setupMediaRecorder, onError])

  const stopRecording = useCallback(() => {
    try {
      // Mark as user-initiated stop
      isUserStoppedRef.current = true

      // Clear any pending restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = null
      }

      // Stop speech recognition
      recognitionRef.current?.stop()

      // Stop audio recording
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }

      return true
    } catch (error) {
      const errorMessage = `Failed to stop recording: ${error}`
      setState((prev) => ({ ...prev, error: errorMessage }))
      onError?.(errorMessage)
      return false
    }
  }, [onError])

  const clearTranscript = useCallback(() => {
    setState((prev) => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
    }))
  }, [])

  return {
    ...state,
    startRecording,
    stopRecording,
    clearTranscript,
  }
}
