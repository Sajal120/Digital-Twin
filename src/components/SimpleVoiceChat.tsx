'use client'

import React from 'react'
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { useSimpleVoiceChat } from '@/hooks/useSimpleVoiceChat'
import { cn } from '@/lib/utils'

interface SimpleVoiceChatProps {
  className?: string
}

export const SimpleVoiceChat: React.FC<SimpleVoiceChatProps> = ({ className }) => {
  const voiceChat = useSimpleVoiceChat({
    onError: (error) => console.error('Voice chat error:', error),
  })

  const handleMicClick = () => {
    if (voiceChat.isRecording) {
      voiceChat.stopRecording()
    } else if (!voiceChat.isProcessing && !voiceChat.isSpeaking) {
      voiceChat.startRecording()
    }
  }

  if (!voiceChat.isSupported) {
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

  return (
    <div className={cn('flex flex-col h-full max-w-2xl mx-auto', className)}>
      {/* Header */}
      <div className="text-center p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎙️ Voice Chat Mode</h2>
        <p className="text-gray-600">
          Click the microphone to start our conversation. I'll automatically listen again after I
          respond!
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
        {voiceChat.messages.length === 0 && (
          <div className="text-center text-gray-500 mt-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <Mic className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to Chat!</h3>
            <p className="text-sm">Click the microphone below to start speaking</p>
          </div>
        )}

        {voiceChat.messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[80%] p-4 rounded-2xl shadow-sm',
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md',
              )}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs opacity-75">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                {message.role === 'assistant' && message.audioUrl && (
                  <button
                    onClick={() => voiceChat.playAudio(message.audioUrl!)}
                    className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                    title="Replay message"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Display */}
      <div className="px-6 py-3 border-t bg-gray-50">
        {voiceChat.error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>Error:</strong> {voiceChat.error}
          </div>
        )}

        <div className="flex items-center justify-center">
          {voiceChat.isRecording && (
            <div className="flex items-center space-x-3 text-red-600 animate-pulse">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-medium">🎤 Recording... (click to stop)</span>
            </div>
          )}

          {voiceChat.isProcessing && (
            <div className="flex items-center space-x-3 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-medium">🤖 Processing your message...</span>
            </div>
          )}

          {voiceChat.isSpeaking && (
            <div className="flex items-center space-x-3 text-green-600">
              <Volume2 className="w-4 h-4" />
              <span className="font-medium">🗣️ I'm responding to you...</span>
              <button
                onClick={voiceChat.stopAudio}
                className="text-xs underline hover:no-underline"
              >
                (click to stop)
              </button>
            </div>
          )}

          {!voiceChat.isRecording && !voiceChat.isProcessing && !voiceChat.isSpeaking && (
            <div className="text-gray-500 text-sm">
              🔴 Ready to listen - Click mic or wait 2 seconds
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-t bg-white">
        <div className="flex items-center justify-center space-x-4">
          {/* Main microphone button */}
          <button
            onClick={handleMicClick}
            disabled={voiceChat.isProcessing}
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg',
              voiceChat.isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white scale-110 animate-pulse'
                : voiceChat.isProcessing
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105',
            )}
            title={
              voiceChat.isRecording
                ? 'Stop recording'
                : voiceChat.isProcessing
                  ? 'Processing...'
                  : 'Start recording'
            }
          >
            {voiceChat.isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : voiceChat.isRecording ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          {/* Stop speaking button */}
          {voiceChat.isSpeaking && (
            <button
              onClick={voiceChat.stopAudio}
              className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors"
              title="Stop AI speaking"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          )}

          {/* Clear conversation */}
          {voiceChat.messages.length > 0 && (
            <button
              onClick={voiceChat.clearConversation}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline hover:no-underline transition-colors"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-xs text-gray-500 space-y-1">
          <p>
            💡 <strong>How to use:</strong> Click microphone → Speak → I'll respond with voice
          </p>
          <p>🔄 I'll automatically listen again after speaking (or click mic anytime)</p>
          <p>🛑 Click microphone while recording to stop early</p>
        </div>
      </div>
    </div>
  )
}
