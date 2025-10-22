'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Mic, Volume2, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type VoiceState = 'intro' | 'listening' | 'processing' | 'speaking' | 'ended'

interface ChatGPTStyleVoiceChatProps {
  className?: string
}

export const ChatGPTStyleVoiceChat: React.FC<ChatGPTStyleVoiceChatProps> = ({ className }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('intro')
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Check browser support
  React.useEffect(() => {
    const checkSupport = () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsSupported(false)
      }
    }
    checkSupport()
  }, [])

  // Main voice chat handler
  const handleVoiceAction = useCallback(async () => {
    if (voiceState === 'intro') {
      // Start voice conversation
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
    } else if (voiceState === 'speaking') {
      // Interrupt AI
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      setVoiceState('listening')
      startRecording()
    }
  }, [voiceState])

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
          // No speech detected, start listening again
          setTimeout(() => startRecording(), 1000)
        }
      }

      mediaRecorder.start()

      // Auto-stop after 10 seconds to process
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 10000)
    } catch (err) {
      console.error('Recording error:', err)
      setError('Recording failed')
    }
  }, [])

  // Process user speech
  const processUserSpeech = useCallback(async (audioBlob: Blob) => {
    setVoiceState('processing')

    try {
      // Transcribe audio
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
      const aiMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, aiMessage])

      // Play AI response
      if (audioUrl) {
        setVoiceState('speaking')
        const audio = new Audio(audioUrl)
        currentAudioRef.current = audio

        audio.onended = () => {
          currentAudioRef.current = null
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
      setError(err instanceof Error ? err.message : 'Voice processing failed')
      setVoiceState('listening')
      setTimeout(() => startRecording(), 2000)
    }
  }, [])

  // End conversation
  const endConversation = useCallback(() => {
    // Stop all audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }

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
  }, [])

  // Show conversation summary when ended
  const ConversationSummary = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Conversation Summary</h2>
        <button
          onClick={() => {
            setVoiceState('intro')
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
            setVoiceState('intro')
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
          <Mic className="w-16 h-16 mx-auto mb-4 opacity-50" />
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
    <div
      className={cn(
        'flex flex-col h-full bg-gradient-to-b from-gray-900 to-black text-white',
        className,
      )}
    >
      {/* Main Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Status Text */}
        <div className="text-center mb-12 max-w-md">
          {voiceState === 'intro' ? (
            <div>
              <h2 className="text-3xl font-light text-white mb-6">
                Introducing voice conversations
              </h2>
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 flex-shrink-0 mt-1">
                    <div className="w-4 h-4 bg-white rounded-full opacity-30"></div>
                  </div>
                  <div>
                    <div className="font-medium text-white mb-1">Just start talking</div>
                    <div className="text-gray-400 text-sm">
                      Now you can have spoken conversations with AI.
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 flex-shrink-0 mt-1">
                    <div className="w-4 h-4 bg-white rounded-full opacity-30"></div>
                  </div>
                  <div>
                    <div className="font-medium text-white mb-1">Hands-free</div>
                    <div className="text-gray-400 text-sm">
                      Chat without having to look at your screen.
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 flex-shrink-0 mt-1">
                    <div className="w-4 h-4 bg-white rounded-full opacity-30"></div>
                  </div>
                  <div>
                    <div className="font-medium text-white mb-1">Chats are saved</div>
                    <div className="text-gray-400 text-sm">
                      View voice transcriptions in your history. Audio clips aren't stored.
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 flex-shrink-0 mt-1">
                    <div className="w-4 h-4 bg-white rounded-full opacity-30"></div>
                  </div>
                  <div>
                    <div className="font-medium text-white mb-1">Language is auto-detected</div>
                    <div className="text-gray-400 text-sm">
                      You can specify a preferred language in Settings for a more accurate
                      detection.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : voiceState === 'listening' ? (
            <div>
              <h3 className="text-2xl font-light text-white mb-2">I'm listening...</h3>
              <p className="text-gray-400">Go ahead and speak</p>
            </div>
          ) : voiceState === 'processing' ? (
            <div>
              <h3 className="text-2xl font-light text-white mb-2">Thinking...</h3>
              <p className="text-gray-400">Processing your message</p>
            </div>
          ) : voiceState === 'speaking' ? (
            <div>
              <h3 className="text-2xl font-light text-white mb-2">Speaking...</h3>
              <p className="text-gray-400">Tap to interrupt</p>
            </div>
          ) : null}
        </div>

        {/* Voice Button */}
        <div className="relative">
          <button
            onClick={handleVoiceAction}
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300',
              voiceState === 'intro'
                ? 'bg-white text-black hover:bg-gray-100'
                : voiceState === 'listening'
                  ? 'bg-white text-black'
                  : voiceState === 'processing'
                    ? 'bg-orange-500 text-white'
                    : voiceState === 'speaking'
                      ? 'bg-white text-black'
                      : 'bg-white text-black',
            )}
          >
            {voiceState === 'intro' ? (
              <Mic className="w-8 h-8" />
            ) : voiceState === 'listening' ? (
              <div className="flex space-x-1">
                <div className="w-1 h-4 bg-black rounded-full animate-pulse"></div>
                <div
                  className="w-1 h-6 bg-black rounded-full animate-pulse"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="w-1 h-3 bg-black rounded-full animate-pulse"
                  style={{ animationDelay: '0.4s' }}
                ></div>
                <div
                  className="w-1 h-5 bg-black rounded-full animate-pulse"
                  style={{ animationDelay: '0.6s' }}
                ></div>
              </div>
            ) : voiceState === 'processing' ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : voiceState === 'speaking' ? (
              <Volume2 className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          {/* Ripple effect */}
          {(voiceState === 'listening' || voiceState === 'processing') && (
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-white/20 animate-ping"></div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-6 text-center">
        {voiceState === 'intro' ? (
          <button
            onClick={handleVoiceAction}
            className="w-full bg-white text-black py-3 px-6 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={endConversation}
            className="text-gray-400 hover:text-white text-sm underline hover:no-underline"
          >
            End conversation
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-900/50 border-t border-red-800 text-red-200 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  )
}
