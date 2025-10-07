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
  // Audio detection state
  isAudioCaptureActive: boolean
  isSoundDetected: boolean
  isSpeechDetected: boolean
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
    isAudioCaptureActive: false,
    isSoundDetected: false,
    isSpeechDetected: false,
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
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)

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

    // iOS needs continuous mode to properly detect speech
    recognition.continuous = isIOS.current ? true : continuous
    recognition.interimResults = true // Always true for better feedback
    recognition.lang = 'en-US'
    recognition.maxAlternatives = isIOS.current ? 3 : 1 // More alternatives on iOS

    console.log('🔧 Speech recognition configured:', {
      continuous: recognition.continuous,
      interimResults: recognition.interimResults,
      lang: recognition.lang,
      maxAlternatives: recognition.maxAlternatives,
      platform: isIOS.current ? 'iOS' : 'Other',
    })

    recognition.onstart = () => {
      console.log('�️ Speech recognition STARTED')
      setState((prev) => ({ ...prev, isRecording: true, error: null }))

      // iOS: Set audio as "ready" but not "active" until speech detected
      if (isIOS.current) {
        console.log('🍎 iOS - waiting for speech detection (onspeechstart or onresult)')
      }
    }

    recognition.onaudiostart = () => {
      console.log('🔊 Audio capture STARTED - browser is receiving sound from microphone')
      setState((prev) => ({ ...prev, isAudioCaptureActive: true }))
    }

    recognition.onaudioend = () => {
      console.log('🔇 Audio capture ENDED - browser stopped receiving sound')
      setState((prev) => ({ ...prev, isAudioCaptureActive: false }))
    }

    recognition.onsoundstart = () => {
      console.log('👂 Sound detected by microphone')
      setState((prev) => ({ ...prev, isSoundDetected: true }))
    }

    recognition.onsoundend = () => {
      console.log('🤫 Sound ended (silence detected)')
      setState((prev) => ({ ...prev, isSoundDetected: false }))
    }

    recognition.onspeechstart = () => {
      console.log('🗣️ Speech detected - processing...')
      setState((prev) => ({
        ...prev,
        isSpeechDetected: true,
        isAudioCaptureActive: true, // Set active when speech starts
      }))
    }

    recognition.onspeechend = () => {
      console.log('💬 Speech ended')
      // iOS: Don't immediately clear speech detection, let onresult handle it
      if (!isIOS.current) {
        setState((prev) => ({
          ...prev,
          isSpeechDetected: false,
          isAudioCaptureActive: prev.isRecording,
        }))
      } else {
        console.log('🍎 iOS - keeping speech detected state for onresult')
      }
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

      const hasSpeech = !!(finalTranscript || interimTranscript)
      console.log('🗣️ Setting speech detected state:', {
        hasSpeech,
        finalLength: finalTranscript.length,
        interimLength: interimTranscript.length,
        isIOS: isIOS.current,
      })

      setState((prev) => ({
        ...prev,
        transcript: prev.transcript + finalTranscript,
        interimTranscript,
        // FORCE BOTH to true when ANY transcript received
        isAudioCaptureActive: true,
        isSpeechDetected: true, // ALWAYS true when onresult fires
      }))

      console.log('✅ State updated - should show SPEAKING DETECTED now!')

      if (finalTranscript && onTranscriptionReceived) {
        console.log('✅ Sending final transcript to callback:', finalTranscript)
        onTranscriptionReceived(finalTranscript)

        // iOS: In continuous mode, clear detection quickly after sending to be ready for next speech
        if (isIOS.current) {
          console.log('🍎 iOS - clearing speech indicator after transcript sent')
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              isSpeechDetected: false,
            }))
          }, 500)
        }
      } else if (!isIOS.current && finalTranscript) {
        // Android: Clear after shorter delay
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isSpeechDetected: false,
          }))
        }, 500)
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

  // Monitor audio levels to verify microphone is actually capturing sound
  const startAudioLevelMonitoring = useCallback(
    (stream: MediaStream) => {
      // SKIP audio monitoring on iOS - it interferes with Web Speech API
      if (isIOS.current) {
        console.log(
          '🍎 iOS detected - relying on speech recognition events (onspeechstart/onresult)',
        )
        // For iOS, we rely on onspeechstart and onresult events
        // Don't set audio active here - let it show only when speech detected
        return
      }

      try {
        // Create audio context and analyser (Android only)
        console.log('🤖 Android - starting audio level monitoring')
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        const microphone = audioContext.createMediaStreamSource(stream)

        analyser.fftSize = 256
        microphone.connect(analyser)

        audioContextRef.current = audioContext
        analyserRef.current = analyser

        // Monitor audio levels
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        let lastAudioDetectedTime = Date.now()

        const checkAudioLevel = () => {
          if (!analyserRef.current) return

          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length

          // If we detect audio above threshold
          if (average > 5) {
            lastAudioDetectedTime = Date.now()
            if (!state.isAudioCaptureActive) {
              console.log('🔊 Audio level detected via analyser:', average)
              setState((prev) => ({ ...prev, isAudioCaptureActive: true }))
            }
          }

          // If no audio for 2 seconds, mark as inactive
          if (Date.now() - lastAudioDetectedTime > 2000 && state.isAudioCaptureActive) {
            console.log('🔇 No audio levels detected')
            setState((prev) => ({ ...prev, isAudioCaptureActive: false }))
          }

          // Continue monitoring while recording
          if (state.isRecording) {
            requestAnimationFrame(checkAudioLevel)
          }
        }

        checkAudioLevel()
        console.log('✅ Audio level monitoring started (Android)')
      } catch (error) {
        console.error('❌ Failed to start audio monitoring:', error)
        // Fallback: assume audio is active
        setState((prev) => ({ ...prev, isAudioCaptureActive: true }))
      }
    },
    [state.isRecording, state.isAudioCaptureActive],
  )

  // Initialize media recorder for audio capture
  const setupMediaRecorder = useCallback(async () => {
    try {
      console.log('📱 Requesting microphone access...')
      console.log('🔧 Device info:', {
        isMobile: isMobile.current,
        isIOS: isIOS.current,
        userAgent: navigator.userAgent,
      })

      // Platform-specific audio constraints
      const audioConstraints: MediaStreamConstraints = {
        audio: isIOS.current
          ? // iOS Safari: Simple constraints work best
            {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : isMobile.current
            ? // Android: More aggressive constraints
              ({
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: { ideal: 16000 },
                channelCount: { ideal: 1 },
              } as any)
            : // Desktop: High quality
              {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100,
                channelCount: 1,
              },
      }

      console.log('🎤 Requesting getUserMedia with constraints:', audioConstraints)
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints)

      // Store stream reference
      audioStreamRef.current = stream

      const audioTracks = stream.getAudioTracks()
      console.log('✅ Microphone access granted')
      console.log(
        '🎵 Audio tracks:',
        audioTracks.map((track) => ({
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings(),
        })),
      )

      // Start audio level monitoring
      startAudioLevelMonitoring(stream)

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
      hasAudioStream: !!audioStreamRef.current,
    })

    // FORCE: Resume audio context on Android (critical!)
    // Skip on iOS - not needed and may interfere
    if (
      !isIOS.current &&
      audioContextRef.current &&
      audioContextRef.current.state === 'suspended'
    ) {
      console.log('🔓 Resuming suspended audio context (Android)...')
      await audioContextRef.current.resume()
      console.log('✅ Audio context resumed:', audioContextRef.current.state)
    }

    // Verify audio stream is active
    if (audioStreamRef.current) {
      const tracks = audioStreamRef.current.getAudioTracks()
      tracks.forEach((track) => {
        console.log('🎵 Audio track status:', {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        })
        // Force enable track (but be gentle on iOS)
        if (!track.enabled) {
          console.log('⚡ Enabling audio track')
          track.enabled = true
        }
      })
    }

    // Verify speech recognition is ready
    if (!recognitionRef.current) {
      console.error('❌ Speech recognition not initialized!')
      const errorMsg = 'Speech recognition failed to initialize. Please refresh the page.'
      setState((prev) => ({ ...prev, error: errorMsg }))
      onError?.(errorMsg)
      return false
    } // iOS-specific: Check if we're in a secure context (HTTPS)
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

        if (isIOS.current) {
          console.log('🍎 iOS - speech recognition started, waiting for voice input...')
        }
      } else {
        console.error('❌ Recognition ref is null!')
        throw new Error('Speech recognition not initialized')
      } // Start audio recording
      if (mediaRecorderRef.current?.state === 'inactive') {
        mediaRecorderRef.current.start(1000) // Collect data every second
        console.log('🔴 MediaRecorder started (for audio capture)')
      } // Verify speech recognition actually started after a brief delay
      setTimeout(() => {
        if (!state.isRecording) {
          console.error('⚠️ WARNING: Speech recognition did not trigger onstart event!')
          console.log('   This usually means:')
          console.log('   1. Browser blocked speech recognition')
          console.log('   2. Microphone permission not granted')
          console.log('   3. Speech recognition API not available')
        } else {
          console.log('✅ Speech recognition verified as running')

          // Double-check iOS audio state
          if (isIOS.current && !state.isAudioCaptureActive) {
            console.log('🍎 iOS audio state check - forcing active')
            setState((prev) => ({ ...prev, isAudioCaptureActive: true }))
          }
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

      // Stop audio monitoring and close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
        audioContextRef.current = null
        analyserRef.current = null
        console.log('🔇 Audio monitoring stopped')
      }

      // Stop audio tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
        console.log('🛑 Audio stream stopped')
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
