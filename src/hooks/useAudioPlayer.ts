'use client'

import { useState, useRef, useCallback } from 'react'

interface AudioPlayerOptions {
  onPlayStart?: () => void
  onPlayEnd?: () => void
  onError?: (error: string) => void
  volume?: number
  playbackRate?: number
}

interface AudioPlayerState {
  isPlaying: boolean
  isLoading: boolean
  duration: number
  currentTime: number
  error: string | null
  volume: number
  playbackRate: number
}

export const useAudioPlayer = (options: AudioPlayerOptions = {}) => {
  const { onPlayStart, onPlayEnd, onError, volume = 1, playbackRate = 1 } = options

  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    duration: 0,
    currentTime: 0,
    error: null,
    volume,
    playbackRate,
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Create audio element if it doesn't exist
  const ensureAudioElement = useCallback(() => {
    if (!audioRef.current) {
      try {
        const audio = new Audio()
        audio.volume = state.volume
        audio.playbackRate = state.playbackRate

        audio.onloadstart = () => {
          setState((prev) => ({ ...prev, isLoading: true, error: null }))
        }

        audio.onloadedmetadata = () => {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            duration: audio.duration || 0,
          }))
        }

        audio.onplay = () => {
          setState((prev) => ({ ...prev, isPlaying: true }))
          onPlayStart?.()
        }

        audio.onpause = () => {
          setState((prev) => ({ ...prev, isPlaying: false }))
        }

        audio.onended = () => {
          setState((prev) => ({
            ...prev,
            isPlaying: false,
            currentTime: 0,
          }))
          onPlayEnd?.()
        }

        audio.ontimeupdate = () => {
          setState((prev) => ({ ...prev, currentTime: audio.currentTime }))
        }

        audio.onerror = (event) => {
          // Log for debugging but don't always show to user
          console.info('Audio element event:', event)

          // Check if this is a common browser restriction
          const target = (event as Event)?.target as HTMLAudioElement
          const networkState = target?.networkState

          let errorMessage = 'Audio playback issue'
          let shouldNotifyUser = true

          // Common browser audio restrictions - don't show to user
          if (networkState === 3) {
            // NETWORK_NO_SOURCE
            errorMessage = 'Audio source not available'
            shouldNotifyUser = false
          }

          setState((prev) => ({
            ...prev,
            isPlaying: false,
            isLoading: false,
            error: shouldNotifyUser ? errorMessage : null,
          }))

          // Only call onError for issues user should know about
          if (shouldNotifyUser) {
            onError?.(errorMessage)
          }
        }

        audioRef.current = audio
      } catch (error) {
        console.error('Failed to create audio element:', error)
        const errorMessage = 'Audio not supported in this browser'
        setState((prev) => ({ ...prev, error: errorMessage }))
        onError?.(errorMessage)
      }
    }
    return audioRef.current
  }, [state.volume, state.playbackRate, onPlayStart, onPlayEnd, onError])

  // Play audio from URL
  const playFromUrl = useCallback(
    async (url: string) => {
      try {
        console.log('🎵 playFromUrl called with:', url.substring(0, 100))

        const audio = ensureAudioElement()

        if (!audio) {
          throw new Error('Failed to create audio element')
        }

        // Stop current playback
        if (state.isPlaying) {
          audio.pause()
          audio.currentTime = 0
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }))

        console.log('🎵 Setting audio.src to:', url.substring(0, 100))
        audio.src = url

        // Check if audio can be played (autoplay policy)
        try {
          const playPromise = audio.play()

          if (playPromise !== undefined) {
            await playPromise
          }

          return true
        } catch (playError) {
          // Handle autoplay restriction gracefully
          const error = playError as Error
          if (error.name === 'NotAllowedError') {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: 'Audio blocked by browser. Click to enable sound.',
            }))
            // Don't call onError for autoplay restrictions as it's expected
            return false
          } else {
            throw playError
          }
        }
      } catch (error) {
        const err = error as Error
        const errorMessage = `Audio playback failed: ${err.message || error}`
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          isLoading: false,
          error: errorMessage,
        }))

        // Only call onError for unexpected errors, not autoplay restrictions
        if (!err.message?.includes('blocked') && !err.message?.includes('NotAllowedError')) {
          onError?.(errorMessage)
        }
        return false
      }
    },
    [ensureAudioElement, state.isPlaying, onError],
  )

  // Play audio from blob
  const playFromBlob = useCallback(
    async (blob: Blob) => {
      try {
        console.log('🎵 playFromBlob called with blob:', {
          size: blob.size,
          type: blob.type,
        })

        const url = URL.createObjectURL(blob)
        console.log('🎵 Created object URL:', url)

        const success = await playFromUrl(url)

        // Clean up object URL after playback
        if (success && audioRef.current) {
          audioRef.current.onended = () => {
            URL.revokeObjectURL(url)
            setState((prev) => ({
              ...prev,
              isPlaying: false,
              currentTime: 0,
            }))
            onPlayEnd?.()
          }
        }

        return success
      } catch (error) {
        const errorMessage = `Failed to play audio from blob: ${error}`
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          isLoading: false,
          error: errorMessage,
        }))
        onError?.(errorMessage)
        return false
      }
    },
    [playFromUrl, onPlayEnd, onError],
  )

  // Play text using TTS API
  const playText = useCallback(
    async (text: string, voice = 'alloy') => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))

        // Use Cartesia for voice cloning - 95% cheaper than ElevenLabs with your voice
        const provider = 'cartesia' // Cartesia: $0.025/1K chars with your cloned voice

        console.log('🎵 Requesting TTS:', {
          text: text.substring(0, 50),
          voice,
          provider,
          requestUrl: '/api/voice/speech',
          bodyData: {
            text: text.substring(0, 50) + '...',
            voice: 'cartesia',
            provider,
            language: 'auto',
          },
        })

        const response = await fetch('/api/voice/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            voice: 'cartesia', // Always use Cartesia voice ID for cloned voice
            provider,
            language: 'auto',
          }),
        })

        console.log('🎵 TTS Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('🚨 TTS API Error:', errorText)
          throw new Error(`TTS API error: ${response.status} - ${errorText}`)
        }

        // Check content type
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('audio')) {
          throw new Error(`Invalid audio response: ${contentType}`)
        }

        const audioBlob = await response.blob()

        // Check if we got a valid audio blob
        if (audioBlob.size === 0) {
          throw new Error('Received empty audio response')
        }

        // Check if the blob is actually audio
        if (!audioBlob.type.includes('audio')) {
          throw new Error(`Invalid audio format: ${audioBlob.type}`)
        }

        return await playFromBlob(audioBlob)
      } catch (error) {
        const errorMessage = `Failed to play text: ${error}`
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          isLoading: false,
          error: errorMessage,
        }))
        onError?.(errorMessage)
        return false
      }
    },
    [playFromBlob, onError],
  )

  const pause = useCallback(() => {
    if (audioRef.current && state.isPlaying) {
      audioRef.current.pause()
      return true
    }
    return false
  }, [state.isPlaying])

  const resume = useCallback(async () => {
    if (audioRef.current && !state.isPlaying) {
      try {
        await audioRef.current.play()
        return true
      } catch (error) {
        const errorMessage = `Failed to resume audio: ${error}`
        setState((prev) => ({ ...prev, error: errorMessage }))
        onError?.(errorMessage)
        return false
      }
    }
    return false
  }, [state.isPlaying, onError])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }))
      return true
    }
    return false
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setState((prev) => ({ ...prev, volume: clampedVolume }))
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume
    }
  }, [])

  const setPlaybackRate = useCallback((newRate: number) => {
    const clampedRate = Math.max(0.25, Math.min(4, newRate))
    setState((prev) => ({ ...prev, playbackRate: clampedRate }))
    if (audioRef.current) {
      audioRef.current.playbackRate = clampedRate
    }
  }, [])

  const seek = useCallback(
    (time: number) => {
      if (audioRef.current && state.duration > 0) {
        const clampedTime = Math.max(0, Math.min(state.duration, time))
        audioRef.current.currentTime = clampedTime
        setState((prev) => ({ ...prev, currentTime: clampedTime }))
      }
    },
    [state.duration],
  )

  return {
    ...state,
    playFromUrl,
    playFromBlob,
    playText,
    pause,
    resume,
    stop,
    setVolume,
    setPlaybackRate,
    seek,
  }
}
