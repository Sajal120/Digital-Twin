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

  // Detect mobile devices and iOS
  const isMobile = useRef<boolean>(false)
  const isIOS = useRef<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      isMobile.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      )
      isIOS.current = /iPad|iPhone|iPod/.test(navigator.userAgent)
      console.log('Mobile detection:', { isMobile: isMobile.current, isIOS: isIOS.current })
    }
  }, [])

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
    recognition.maxAlternatives = 1 // Get best match only

    console.log('🔧 Speech recognition configured:', {
      continuous: recognition.continuous,
      interimResults: recognition.interimResults,
      lang: recognition.lang,
      maxAlternatives: recognition.maxAlternatives,
    })

    recognition.onstart = () => {
      console.log('🎤 Speech recognition STARTED')
      setState((prev) => ({ ...prev, isRecording: true, error: null }))
    }

    recognition.onaudiostart = () => {
      console.log('🔊 Audio capture STARTED - browser is receiving sound from microphone')
    }

    recognition.onaudioend = () => {
      console.log('🔇 Audio capture ENDED - browser stopped receiving sound')
    }

    recognition.onsoundstart = () => {
      console.log('👂 Sound detected by microphone')
    }

    recognition.onsoundend = () => {
      console.log('🤫 Sound ended (silence detected)')
    }

    recognition.onspeechstart = () => {
      console.log('🗣️ Speech detected - processing...')
    }

    recognition.onspeechend = () => {
      console.log('💬 Speech ended')
    }

    recognition.onresult = (event: any) => {
      console.log('🎤 Speech recognition RESULT received:', {
        resultIndex: event.resultIndex,
        resultsLength: event.results.length,
        isFinal: event.results[event.resultIndex]?.isFinal,
      })

      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        console.log(`   Result ${i}:`, {
          transcript,
          isFinal: event.results[i].isFinal,
          confidence: event.results[i][0].confidence,
        })

        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      console.log('📝 Transcripts:', { finalTranscript, interimTranscript })

      setState((prev) => ({
        ...prev,
        transcript: prev.transcript + finalTranscript,
        interimTranscript,
      }))

      if (finalTranscript && onTranscriptionReceived) {
        console.log('✅ Sending final transcript to callback:', finalTranscript)
        onTranscriptionReceived(finalTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition ERROR:', {
        error: event.error,
        message: event.message,
        timeStamp: event.timeStamp,
      })

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
          console.log('⚠️ No speech detected - user may not be speaking loud enough')
          break
        case 'audio-capture':
          errorMessage = 'Microphone access is required for voice input'
          console.error('⚠️ Audio capture failed - microphone may be in use by another app')
          break
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow access and try again.'
          console.error('⚠️ Permission denied for microphone')
          break
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.'
          console.error('⚠️ Network error - speech recognition requires internet')
          break
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not available'
          console.error('⚠️ Speech recognition service blocked or unavailable')
          break
        default:
          errorMessage = `Speech recognition error: ${event.error}`
          console.error('⚠️ Unknown speech recognition error:', event.error)
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
      console.log('🛑 Speech recognition ENDED', {
        userStopped: isUserStoppedRef.current,
        continuous,
        retryCount: state.retryCount,
      })

      setState((prev) => ({ ...prev, isRecording: false }))

      // If this wasn't a user-initiated stop and we're in continuous mode,
      // try to restart automatically
      if (!isUserStoppedRef.current && continuous && state.retryCount < state.maxRetries) {
        console.log(
          `🔄 Auto-restarting speech recognition (attempt ${state.retryCount + 1}/${state.maxRetries})`,
        )
        restartTimeoutRef.current = setTimeout(() => {
          setState((prev) => ({ ...prev, retryCount: prev.retryCount + 1 }))
          try {
            recognitionRef.current?.start()
            setState((prev) => ({ ...prev, isRecording: true }))
            console.log('✅ Speech recognition restarted successfully')
          } catch (error) {
            console.error('❌ Failed to restart recognition:', error)
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
      console.log('📱 Requesting microphone access...')

      // Mobile-optimized audio constraints
      const audioConstraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Mobile-specific optimizations
          sampleRate: isMobile.current ? 16000 : 44100, // Lower sample rate for mobile
          channelCount: 1, // Mono for better mobile performance
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints)
      console.log('✅ Microphone access granted')

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
    } catch (error: any) {
      let errorMessage = 'Microphone access denied'

      // Mobile-specific error messages
      if (isMobile.current) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage =
            '🎤 Microphone permission denied. Please:\n1. Go to your phone Settings\n2. Find this website\n3. Enable Microphone access'
        } else if (error.name === 'NotFoundError') {
          errorMessage = '🎤 No microphone found on your device'
        } else if (error.name === 'NotReadableError') {
          errorMessage =
            '🎤 Microphone is being used by another app. Please close other apps and try again.'
        } else if (isIOS.current) {
          errorMessage = '🎤 iOS: Please allow microphone access in Settings > Safari > Microphone'
        }
      } else {
        errorMessage = `Microphone access error: ${error.message || error}`
      }

      console.error('❌ Microphone error:', error)
      setState((prev) => ({ ...prev, error: errorMessage }))
      onError?.(errorMessage)
      return false
    }
  }, [onAudioDataReceived, onError])

  const startRecording = useCallback(async () => {
    if (!state.isSupported) {
      const message = isMobile.current
        ? '🎤 Voice input not supported on this mobile browser. Please use Chrome or Safari.'
        : 'Speech recognition not supported'
      onError?.(message)
      return false
    }

    console.log('🎙️ Starting recording...', {
      isMobile: isMobile.current,
      isIOS: isIOS.current,
      hasRecognitionRef: !!recognitionRef.current,
      hasMediaRecorder: !!mediaRecorderRef.current,
    })

    // Verify speech recognition is ready
    if (!recognitionRef.current) {
      console.error('❌ Speech recognition not initialized!')
      const errorMsg = 'Speech recognition failed to initialize. Please refresh the page.'
      setState((prev) => ({ ...prev, error: errorMsg }))
      onError?.(errorMsg)
      return false
    }

    // iOS-specific: Check if we're in a secure context (HTTPS)
    if (isIOS.current && location.protocol !== 'https:' && location.hostname !== 'localhost') {
      const errorMessage = '🔒 HTTPS required for microphone on iOS. Please use https://'
      setState((prev) => ({ ...prev, error: errorMessage }))
      onError?.(errorMessage)
      return false
    }

    // Setup media recorder if needed (requests microphone permission)
    if (!mediaRecorderRef.current) {
      console.log('📱 Setting up media recorder...')
      const success = await setupMediaRecorder()
      if (!success) {
        console.error('❌ Failed to setup media recorder')
        return false
      }
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

      console.log('🎤 Starting speech recognition...', {
        recognitionExists: !!recognitionRef.current,
        recognitionLang: recognitionRef.current?.lang,
        continuous: recognitionRef.current?.continuous,
        interimResults: recognitionRef.current?.interimResults,
      })

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start()
        console.log('✅ Speech recognition start() called')
      } else {
        console.error('❌ Recognition ref is null!')
        throw new Error('Speech recognition not initialized')
      }

      // Start audio recording
      if (mediaRecorderRef.current?.state === 'inactive') {
        mediaRecorderRef.current.start(1000) // Collect data every second
        console.log('🔴 MediaRecorder started (for audio capture)')
      }

      // Verify speech recognition actually started after a brief delay
      setTimeout(() => {
        if (!state.isRecording) {
          console.error('⚠️ WARNING: Speech recognition did not trigger onstart event!')
          console.log('   This usually means:')
          console.log('   1. Browser blocked speech recognition')
          console.log('   2. Microphone permission not granted')
          console.log('   3. Speech recognition API not available')
        } else {
          console.log('✅ Speech recognition verified as running')
        }
      }, 500)

      return true
    } catch (error: any) {
      console.error('❌ Start recording error:', error)

      // Handle iOS-specific errors
      if (isIOS.current && error.message?.includes('not-allowed')) {
        const iosError =
          '🎤 Microphone blocked on iOS. Go to Settings > Safari > Microphone and allow access.'
        setState((prev) => ({ ...prev, error: iosError }))
        onError?.(iosError)
        return false
      }

      // Handle automatic retry for certain errors
      if (state.retryCount < state.maxRetries) {
        console.log(`🔄 Retrying... (${state.retryCount + 1}/${state.maxRetries})`)
        setState((prev) => ({ ...prev, retryCount: prev.retryCount + 1 }))

        // Retry after a short delay
        setTimeout(() => {
          startRecording()
        }, 1000)

        return true
      }

      const errorMessage = `Failed to start recording after ${state.maxRetries} attempts: ${error.message || error}`
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
