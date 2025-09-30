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

      audio.onerror = () => {
        const errorMessage = 'Failed to play audio'
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          isLoading: false,
          error: errorMessage,
        }))
        onError?.(errorMessage)
      }

      audioRef.current = audio
    }
    return audioRef.current
  }, [state.volume, state.playbackRate, onPlayStart, onPlayEnd, onError])

  // Play audio from URL
  const playFromUrl = useCallback(
    async (url: string) => {
      try {
        const audio = ensureAudioElement()

        // Stop current playback
        if (state.isPlaying) {
          audio.pause()
          audio.currentTime = 0
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }))

        audio.src = url
        await audio.play()

        return true
      } catch (error) {
        const errorMessage = `Failed to play audio from URL: ${error}`
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
    [ensureAudioElement, state.isPlaying, onError],
  )

  // Play audio from blob
  const playFromBlob = useCallback(
    async (blob: Blob) => {
      try {
        const url = URL.createObjectURL(blob)
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

        const response = await fetch('/api/voice/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, voice }),
        })

        if (!response.ok) {
          throw new Error(`TTS API error: ${response.status}`)
        }

        const audioBlob = await response.blob()
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
