'use client'

import React from 'react'
import { Mic, Volume2, Loader2 } from 'lucide-react'
import { useInteractiveVoiceChat } from '@/hooks/useInteractiveVoiceChat'
import { cn } from '@/lib/utils'

interface ChatGPTStyleVoiceChatProps {
  className?: string
}

export const ChatGPTStyleVoiceChat: React.FC<ChatGPTStyleVoiceChatProps> = ({ className }) => {
  const voiceChat = useInteractiveVoiceChat({
    onError: (error) => console.error('Voice chat error:', error),
  })

  // Handle click on the voice button or anywhere to interrupt
  const handleMainClick = () => {
    if (!voiceChat.isActive) {
      voiceChat.startConversation()
    } else if (voiceChat.isSpeaking) {
      voiceChat.interruptAI()
    }
  }

  if (!voiceChat.isSupported) {
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

  return (
    <div
      className={cn('flex flex-col h-full max-w-xl mx-auto', className)}
      onClick={voiceChat.isSpeaking ? handleMainClick : undefined}
      style={{ cursor: voiceChat.isSpeaking ? 'pointer' : 'default' }}
    >
      {/* Minimal Header */}
      <div className="text-center p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
        <h2 className="text-xl font-semibold text-gray-800">🎙️ Voice Chat</h2>
        <p className="text-sm text-gray-600 mt-1">
          {voiceChat.isActive ? 'Listening...' : 'Ready to chat'}
        </p>
      </div>

      {/* Main Voice Interface - ChatGPT Style */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Single Large Voice Button */}
        <div className="relative mb-8">
          <button
            onClick={handleMainClick}
            disabled={!voiceChat.isSupported}
            className={cn(
              'w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl',
              !voiceChat.isActive
                ? 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
                : voiceChat.isListening
                  ? 'bg-green-500 animate-pulse scale-110'
                  : voiceChat.isProcessing
                    ? 'bg-orange-500 animate-pulse'
                    : voiceChat.isSpeaking
                      ? 'bg-purple-500 animate-pulse cursor-pointer'
                      : 'bg-gray-500',
              !voiceChat.isSupported && 'opacity-50 cursor-not-allowed',
            )}
          >
            {!voiceChat.isActive ? (
              <Mic className="w-12 h-12 text-white" />
            ) : voiceChat.isListening ? (
              <div className="w-6 h-6 bg-white rounded-full animate-bounce"></div>
            ) : voiceChat.isProcessing ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            ) : voiceChat.isSpeaking ? (
              <Volume2 className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white opacity-50" />
            )}
          </button>

          {/* Ripple effect for listening */}
          {voiceChat.isListening && (
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-green-400 animate-ping opacity-25"></div>
          )}
        </div>

        {/* Status Text */}
        <div className="text-center mb-6">
          {!voiceChat.isActive ? (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Voice Chat Mode</h3>
              <p className="text-gray-600 leading-relaxed">
                Click the microphone to start our conversation.
                <br />
                I'll automatically listen again after I respond!
              </p>
            </div>
          ) : voiceChat.isListening ? (
            <div>
              <h3 className="text-xl font-semibold text-green-600 mb-1">I'm listening...</h3>
              <p className="text-sm text-gray-600">Go ahead and speak!</p>
            </div>
          ) : voiceChat.isProcessing ? (
            <div>
              <h3 className="text-xl font-semibold text-orange-600 mb-1">Hmm...</h3>
              <p className="text-sm text-gray-600">Let me think about that...</p>
            </div>
          ) : voiceChat.isSpeaking ? (
            <div>
              <h3 className="text-xl font-semibold text-purple-600 mb-1">I'm responding...</h3>
              <p className="text-sm text-gray-600">Tap anywhere to interrupt me</p>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold text-gray-600 mb-1">Ready</h3>
              <p className="text-sm text-gray-600">Speak anytime!</p>
            </div>
          )}
        </div>

        {/* Recent Messages - Minimal */}
        {voiceChat.messages.length > 0 && (
          <div className="w-full max-w-md space-y-3 max-h-48 overflow-y-auto">
            {voiceChat.messages.slice(-2).map((message) => (
              <div
                key={message.id}
                className={cn(
                  'p-3 rounded-xl text-sm border',
                  message.role === 'user'
                    ? 'bg-blue-50 border-blue-200 text-blue-800 ml-6'
                    : 'bg-gray-50 border-gray-200 text-gray-800 mr-6',
                )}
              >
                <p className="leading-relaxed">{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {voiceChat.error && (
        <div className="p-3 bg-red-50 border-t border-red-200 text-red-700 text-sm text-center">
          {voiceChat.error}
        </div>
      )}

      {/* Simple Footer */}
      <div className="p-4 border-t bg-gray-50 text-center">
        {voiceChat.isActive ? (
          <button
            onClick={voiceChat.endConversation}
            className="text-sm text-red-600 hover:text-red-800 underline hover:no-underline"
          >
            End Conversation
          </button>
        ) : (
          <p className="text-xs text-gray-500">💡 One button to start, then just talk naturally</p>
        )}
      </div>
    </div>
  )
}
