'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, X, Pause, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'ended'

interface ChatGPTStyleVoiceChatProps {
  className?: string
}

export const ChatGPTStyleVoiceChat: React.FC<ChatGPTStyleVoiceChatProps> = ({ className }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const thinkingAudioRef = useRef<HTMLAudioElement | null>(null)

  // Thinking sound URL (same as phone system)
  const THINKING_SOUND_URL =
    'https://brxp5nmtsramnrr1.public.blob.vercel-storage.com/phone-audio/thinking_natural.mp3'

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsSupported(false)
      }
    }
    checkSupport()
  }, [])

  // Play thinking sound (like phone system)
  const playThinkingSound = useCallback(() => {
    try {
      if (thinkingAudioRef.current) {
        thinkingAudioRef.current.pause()
        thinkingAudioRef.current.currentTime = 0
      }

      const audio = new Audio(THINKING_SOUND_URL)
      audio.volume = 0.6
      audio.play().catch(console.error)
      thinkingAudioRef.current = audio
    } catch (err) {
      console.error('Failed to play thinking sound:', err)
    }
  }, [])

  // Stop thinking sound
  const stopThinkingSound = useCallback(() => {
    if (thinkingAudioRef.current) {
      thinkingAudioRef.current.pause()
      thinkingAudioRef.current.currentTime = 0
      thinkingAudioRef.current = null
    }
  }, [])

  // Start voice chat
  const startVoiceChat = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      setVoiceState('listening')
      startRecording()
    } catch (err) {
      setError('Microphone access denied')
      console.error('Voice chat error:', err)
    }
  }, [])

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    try {
      const options = { mimeType: 'audio/webm' }
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/mp4'
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
        if (audioBlob.size > 1000) {
          await processUserSpeech(audioBlob)
        } else {
          // No speech detected, continue listening
          if (voiceState === 'listening') {
            setTimeout(() => startRecording(), 1000)
          }
        }
      }

      mediaRecorder.start()

      // Auto-stop after 10 seconds for processing
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 10000)
    } catch (err) {
      console.error('Recording error:', err)
      setError('Recording failed')
    }
  }, [voiceState])

  // Process user speech (using phone system architecture)
  const processUserSpeech = useCallback(
    async (audioBlob: Blob) => {
      setVoiceState('processing')
      playThinkingSound() // Play thinking sound immediately

      try {
        // Transcribe using same API as phone system
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
          // No speech, continue listening
          stopThinkingSound()
          setVoiceState('listening')
          setTimeout(() => startRecording(), 1000)
          return
        }

        // Add user message
        const userMessage: VoiceMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: transcript,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, userMessage])

        // Get AI response using same system as phone
        const chatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: transcript }],
            voice_chat: true,
            phoneOptimized: false, // Web voice chat gets fuller responses
          }),
        })

        if (!chatResponse.ok) {
          throw new Error('AI response failed')
        }

        const chatData = await chatResponse.json()
        const aiResponse = chatData.content || chatData.message || 'Sorry, I could not respond.'

        // Generate speech using same API as phone system
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
        const aiMessage: VoiceMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, aiMessage])

        // Stop thinking sound and play AI response
        stopThinkingSound()

        if (audioUrl) {
          setVoiceState('speaking')
          const audio = new Audio(audioUrl)
          currentAudioRef.current = audio

          audio.onended = () => {
            currentAudioRef.current = null
            // Auto-continue listening after AI speaks
            setVoiceState('listening')
            setTimeout(() => startRecording(), 1000)
          }

          audio.onerror = () => {
            currentAudioRef.current = null
            setVoiceState('listening')
            setTimeout(() => startRecording(), 1000)
          }

          audio.play().catch(() => {
            setVoiceState('listening')
            setTimeout(() => startRecording(), 1000)
          })
        } else {
          setVoiceState('listening')
          setTimeout(() => startRecording(), 1000)
        }
      } catch (err) {
        console.error('Processing error:', err)
        stopThinkingSound()
        setError(err instanceof Error ? err.message : 'Voice processing failed')
        setVoiceState('listening')
        setTimeout(() => startRecording(), 2000)
      }
    },
    [playThinkingSound, stopThinkingSound],
  )

  // End conversation
  const endConversation = useCallback(() => {
    // Stop all audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    stopThinkingSound()

    // Stop recording
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    // Close microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setVoiceState('ended')
  }, [stopThinkingSound])

  // Interrupt AI (tap to cancel speaking)
  const interruptAI = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    stopThinkingSound()
    setVoiceState('listening')
    setTimeout(() => startRecording(), 500)
  }, [stopThinkingSound])

  // Conversation Summary Component
  const ConversationSummary = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Conversation Summary</h2>
        <button
          onClick={() => {
            setVoiceState('idle')
            setMessages([])
            setError(null)
          }}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No conversation to show</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'p-4 rounded-lg max-w-[80%]',
                message.role === 'user'
                  ? 'bg-blue-500 text-white ml-auto'
                  : 'bg-gray-100 text-gray-900',
              )}
            >
              <p className="leading-relaxed">{message.content}</p>
              <p className="text-xs mt-2 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <button
          onClick={() => {
            setVoiceState('idle')
            setMessages([])
            setError(null)
          }}
          className="w-full bg-blue-500 text-white py-3 px-6 rounded-full font-medium hover:bg-blue-600 transition-colors"
        >
          Start New Conversation
        </button>
      </div>
    </div>
  )

  if (!isSupported) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-8', className)}>
        <div className="text-center text-gray-500">
          <MicOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Voice Chat Not Supported</h3>
          <p className="text-sm">Your browser doesn't support voice recording.</p>
        </div>
      </div>
    )
  }

  if (voiceState === 'ended') {
    return <ConversationSummary />
  }

  return (
    <div className={cn('flex flex-col h-full bg-black text-white', className)}>
      {/* Main Voice Interface - ChatGPT Style */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Voice Orb - Large Circle */}
        <div className="relative mb-8">
          {/* Main Circle */}
          <div
            className={cn(
              'w-64 h-64 rounded-full flex items-center justify-center transition-all duration-300',
              voiceState === 'idle'
                ? 'bg-white'
                : voiceState === 'listening'
                  ? 'bg-white'
                  : voiceState === 'processing'
                    ? 'bg-white animate-pulse'
                    : voiceState === 'speaking'
                      ? 'bg-white'
                      : 'bg-white',
            )}
          >
            {/* Speaking Animation - Blob Shape */}
            {voiceState === 'speaking' && (
              <div className="absolute inset-4">
                <div
                  className="w-full h-full bg-gray-200 rounded-full animate-pulse"
                  style={{
                    borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                    animation: 'blob 2s infinite',
                  }}
                />
              </div>
            )}
          </div>

          {/* Small dot for speaking */}
          {voiceState === 'speaking' && (
            <div className="absolute bottom-4 left-8 w-4 h-4 bg-white rounded-full opacity-80" />
          )}
        </div>

        {/* Status Text */}
        <div className="text-center mb-12">
          {voiceState === 'idle' ? (
            <p className="text-gray-400 text-lg">Tap to start talking</p>
          ) : voiceState === 'listening' ? (
            <div>
              <div className="flex items-center justify-center space-x-1 mb-2">
                <Mic className="w-5 h-5" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div
                    className="w-2 h-2 bg-white rounded-full animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-white rounded-full animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-white rounded-full animate-pulse"
                    style={{ animationDelay: '0.6s' }}
                  ></div>
                </div>
              </div>
              <p className="text-white text-lg">Listening</p>
            </div>
          ) : voiceState === 'processing' ? (
            <div>
              <MicOff className="w-6 h-6 mx-auto mb-2 opacity-60" />
              <p className="text-gray-400 text-lg">Tap to cancel</p>
            </div>
          ) : voiceState === 'speaking' ? (
            <div>
              <MicOff className="w-6 h-6 mx-auto mb-2 opacity-60" />
              <p className="text-gray-400 text-lg">Tap to cancel</p>
            </div>
          ) : null}
        </div>

        {/* Touch Area - Full Screen for interruption */}
        {(voiceState === 'processing' || voiceState === 'speaking') && (
          <div className="absolute inset-0 cursor-pointer" onClick={interruptAI} />
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-6 flex items-center justify-center space-x-8">
        {/* AI Control Button (left) */}
        <button className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded opacity-30" />
        </button>

        {/* Main Action Button (center) */}
        <button
          onClick={voiceState === 'idle' ? startVoiceChat : undefined}
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-all',
            voiceState === 'idle'
              ? 'bg-white text-black hover:bg-gray-100'
              : 'bg-red-500 text-white hover:bg-red-600',
          )}
        >
          {voiceState === 'idle' ? (
            <Mic className="w-8 h-8" />
          ) : (
            <X className="w-8 h-8" onClick={endConversation} />
          )}
        </button>

        {/* Pause Button (right) */}
        {voiceState === 'speaking' ? (
          <button
            onClick={interruptAI}
            className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center"
          >
            <Pause className="w-6 h-6 text-white" />
          </button>
        ) : (
          <button className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center opacity-30">
            <Volume2 className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-900/50 border-t border-red-800 text-red-200 text-sm text-center">
          {error}
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          50% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
          100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
        }
      `}</style>
    </div>
  )
}
