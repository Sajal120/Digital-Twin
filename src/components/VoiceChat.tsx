'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  MessageSquare,
  Phone,
  Briefcase,
  Code,
  Users,
  Target,
  Settings,
} from 'lucide-react'
import { useVoiceChat, InteractionType } from '@/hooks/useVoiceChat'
import { cn } from '@/lib/utils'

interface VoiceChatComponentProps {
  className?: string
  defaultInteractionType?: InteractionType
  showTranscript?: boolean
  showControls?: boolean
  autoStartListening?: boolean
}

const interactionTypeConfig = {
  general: {
    icon: MessageSquare,
    label: 'General Chat',
    description: 'Casual professional conversation',
    color: 'bg-blue-500',
  },
  hr_screening: {
    icon: Phone,
    label: 'HR Screening',
    description: 'Interview screening call',
    color: 'bg-green-500',
  },
  technical_interview: {
    icon: Code,
    label: 'Technical Interview',
    description: 'Technical assessment and deep-dive',
    color: 'bg-purple-500',
  },
  networking: {
    icon: Users,
    label: 'Networking',
    description: 'Professional networking conversation',
    color: 'bg-orange-500',
  },
  career_coaching: {
    icon: Target,
    label: 'Career Coaching',
    description: 'Career guidance and planning',
    color: 'bg-teal-500',
  },
}

export const VoiceChatComponent: React.FC<VoiceChatComponentProps> = ({
  className,
  defaultInteractionType = 'general',
  showTranscript = true,
  showControls = true,
  autoStartListening = false,
}) => {
  const [showSettings, setShowSettings] = useState(false)
  const [textInput, setTextInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const voiceChat = useVoiceChat({
    interactionType: defaultInteractionType,
    autoPlayResponses: true,
    onError: (error) => {
      console.error('Voice chat error:', error)
    },
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [voiceChat.messages])

  // Auto-start listening if enabled
  useEffect(() => {
    if (autoStartListening && voiceChat.isSupported) {
      voiceChat.startListening()
    }
  }, [autoStartListening, voiceChat.isSupported])

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim()) {
      voiceChat.sendTextMessage(textInput.trim())
      setTextInput('')
    }
  }

  const toggleListening = () => {
    if (voiceChat.isListening) {
      voiceChat.stopListening()
    } else {
      voiceChat.startListening()
    }
  }

  const toggleAudio = () => {
    if (voiceChat.audioPlayerState.isPlaying) {
      voiceChat.pauseAudio()
    } else {
      voiceChat.resumeAudio()
    }
  }

  const currentConfig = interactionTypeConfig[voiceChat.currentInteractionType]
  const IconComponent = currentConfig.icon

  return (
    <div
      className={cn(
        'flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className={cn('p-2 rounded-full text-white', currentConfig.color)}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{currentConfig.label}</h2>
            <p className="text-sm text-gray-600">{currentConfig.description}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {showControls && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {voiceChat.audioPlayerState.isPlaying && (
            <div className="flex items-center space-x-1 text-sm text-blue-600">
              <Volume2 className="w-4 h-4" />
              <span>Speaking...</span>
            </div>
          )}

          {voiceChat.isProcessing && (
            <div className="flex items-center space-x-1 text-sm text-orange-600">
              <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-medium text-gray-900 mb-3">Interaction Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(interactionTypeConfig).map(([type, config]) => {
              const TypeIcon = config.icon
              return (
                <button
                  key={type}
                  onClick={() => voiceChat.setInteractionType(type as InteractionType)}
                  className={cn(
                    'flex items-center space-x-2 p-3 rounded-lg text-left transition-colors',
                    voiceChat.currentInteractionType === type
                      ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                      : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700',
                  )}
                >
                  <TypeIcon className="w-4 h-4" />
                  <div>
                    <div className="font-medium text-sm">{config.label}</div>
                    <div className="text-xs opacity-75">{config.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {voiceChat.messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <IconComponent className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">
              Ready to start your {currentConfig.label.toLowerCase()}
            </p>
            <p className="text-sm mt-1">
              Click the microphone to begin speaking, or type a message below
            </p>
          </div>
        )}

        {voiceChat.messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[80%] p-3 rounded-lg',
                message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900',
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs opacity-75">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                {message.role === 'assistant' && (
                  <button
                    onClick={() => voiceChat.playMessageAudio(message.id)}
                    className="ml-2 p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Real-time transcript */}
        {showTranscript && (voiceChat.transcript || voiceChat.interimTranscript) && (
          <div className="flex justify-end">
            <div className="max-w-[80%] p-3 rounded-lg bg-blue-100 border-2 border-dashed border-blue-300">
              <p className="text-blue-900">
                {voiceChat.transcript}
                <span className="opacity-60">{voiceChat.interimTranscript}</span>
              </p>
              <span className="text-xs text-blue-600">Live transcript...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {voiceChat.error && (
        <div className="p-3 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          <strong>Error:</strong> {voiceChat.error}
        </div>
      )}

      {/* Audio Detection Status - PROMINENT DISPLAY */}
      {voiceChat.isListening && (
        <div className="p-4 border-t border-b border-gray-200">
          <div className="flex flex-col items-center justify-center space-y-3">
            {/* Main status */}
            <div className="text-lg font-bold text-red-600 animate-pulse">
              🎤 LISTENING - SPEAK NOW
            </div>

            {/* Audio detection indicators - LARGE & CLEAR */}
            <div className="flex items-center justify-center space-x-4 text-base font-semibold">
              {voiceChat.isAudioCaptureActive ? (
                <div className="px-4 py-2 rounded-lg border-2 border-green-500 text-green-600">
                  🔊 AUDIO ACTIVE ✅
                </div>
              ) : (
                <div className="px-4 py-2 rounded-lg border-2 border-orange-500 text-orange-600 animate-pulse">
                  ⚠️ NO AUDIO DETECTED ❌
                </div>
              )}

              {voiceChat.isSoundDetected && (
                <div className="px-3 py-1 rounded-lg border border-blue-500 text-blue-600 animate-pulse">
                  👂 SOUND DETECTED
                </div>
              )}

              {voiceChat.isSpeechDetected && (
                <div className="px-3 py-1 rounded-lg border border-purple-500 text-purple-600 animate-pulse">
                  🗣️ SPEECH RECOGNIZED
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        {/* Text Input */}
        <form onSubmit={handleSendText} className="mb-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a message or use voice..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={voiceChat.isProcessing}
            />
            <button
              type="submit"
              disabled={!textInput.trim() || voiceChat.isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </form>

        {/* Voice Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Main mic button */}
            <button
              onClick={toggleListening}
              disabled={!voiceChat.isSupported || voiceChat.isProcessing}
              className={cn(
                'p-4 rounded-full transition-all duration-200 shadow-lg',
                voiceChat.isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white scale-110'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105',
                (!voiceChat.isSupported || voiceChat.isProcessing) &&
                  'opacity-50 cursor-not-allowed',
              )}
            >
              {voiceChat.isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Audio controls */}
            {voiceChat.audioPlayerState.isPlaying && (
              <button
                onClick={toggleAudio}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}

            {/* Stop audio */}
            {voiceChat.audioPlayerState.isPlaying && (
              <button
                onClick={voiceChat.stopAudio}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status and controls */}
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            {!voiceChat.isSupported && <span className="text-red-600">Voice not supported</span>}

            {voiceChat.messages.length > 0 && (
              <button
                onClick={voiceChat.clearConversation}
                className="text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
