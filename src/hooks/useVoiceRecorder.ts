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
    isSupported: typeof window !== 'undefined' && 'mediaDevices' in navigator, // Check for microphone support instead
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
  const iosPollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // No Web Speech API initialization - using Deepgram for all platforms

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

  // Use Deepgram cloud transcription for ALL platforms (web + phone)
  const startDeepgramRecording = useCallback(async () => {
    console.log('� Starting Deepgram cloud transcription (multi-language)')

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      })
      audioStreamRef.current = stream

      // Force UI states to show "listening"
      setState((prev) => ({
        ...prev,
        isRecording: true,
        isAudioCaptureActive: true,
        isSpeechDetected: true,
        isSoundDetected: true,
        error: null,
      }))

      // Setup MediaRecorder for Deepgram
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('� MediaRecorder stopped, sending to Deepgram...')

        if (audioChunksRef.current.length === 0) {
          console.warn('⚠️ No audio chunks recorded')
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        console.log('� Audio blob created:', audioBlob.size, 'bytes')

        // Clear for next recording
        audioChunksRef.current = []

        // Send to Deepgram API
        try {
          const formData = new FormData()
          formData.append('audio', audioBlob)

          console.log('📤 Sending to Deepgram...')
          const response = await fetch('/api/chat/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Deepgram API error: ${response.status}`)
          }

          const result = await response.json()
          console.log('✅ Deepgram transcription result:', result)

          if (result.transcript) {
            // Update state with transcript
            setState((prev) => ({
              ...prev,
              transcript: prev.transcript + result.transcript,
              interimTranscript: '',
            }))

            onTranscriptionReceived?.(result.transcript)
          }
        } catch (error) {
          console.error('❌ Deepgram transcription error:', error)
          setState((prev) => ({
            ...prev,
            error: 'Transcription failed. Please try again.',
          }))
          onError?.('Transcription failed. Please try again.')
        } finally {
          // Clear states after transcription
          setState((prev) => ({
            ...prev,
            isSpeechDetected: false,
            isSoundDetected: false,
          }))
        }
      }

      mediaRecorderRef.current = mediaRecorder

      // Start recording in chunks (3 seconds each for near real-time)
      mediaRecorder.start(3000)
      console.log('� MediaRecorder started with 3s chunks for Deepgram transcription')

      return true
    } catch (error) {
      console.error('❌ Deepgram recording error:', error)
      setState((prev) => ({
        ...prev,
        error: 'Microphone access denied',
        isRecording: false,
      }))
      onError?.(
        'Microphone access denied. Please allow microphone access in your browser settings.',
      )
      return false
    }
  }, [onTranscriptionReceived, onError])

  const startRecording = useCallback(async () => {
    // Use Deepgram cloud transcription for ALL platforms (web + phone)
    if (!state.isSupported) {
      const message = '🎤 Microphone not available. Please check browser permissions.'
      onError?.(message)
      return false
    }

    // Always use Deepgram for consistent multi-language support
    return startDeepgramRecording()

    // Deepgram handles everything - no additional logic needed
  }, [state.isSupported, state.retryCount, state.maxRetries, setupMediaRecorder, onError])

  const stopRecording = useCallback(() => {
    try {
      console.log('🛑 Stopping Deepgram recording...')
      isUserStoppedRef.current = true

      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = null
      }

      if (iosPollingIntervalRef.current) {
        clearInterval(iosPollingIntervalRef.current)
        iosPollingIntervalRef.current = null
      }

      // Stop MediaRecorder (Deepgram)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
        console.log('✅ MediaRecorder stopped')
      }

      // Clean up audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
        audioContextRef.current = null
        analyserRef.current = null
      }

      // Stop all audio tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
        console.log('✅ Audio stream stopped')
      }

      // Reset states
      setState((prev) => ({
        ...prev,
        isRecording: false,
        isAudioCaptureActive: false,
        isSoundDetected: false,
        isSpeechDetected: false,
      }))

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
