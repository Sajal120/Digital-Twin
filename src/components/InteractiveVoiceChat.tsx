'use client'

import React from 'react'
import { MessageCircle, Phone, PhoneOff, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { useInteractiveVoiceChat } from '@/hooks/useInteractiveVoiceChat'
import { cn } from '@/lib/utils'

interface InteractiveVoiceChatProps {
  className?: string
}

export const InteractiveVoiceChat: React.FC<InteractiveVoiceChatProps> = ({ className }) => {
  const voiceChat = useInteractiveVoiceChat({
    onError: (error) => console.error('Interactive voice chat error:', error),
  })

  if (!voiceChat.isSupported) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-8', className)}>
        <div className="text-center text-gray-500">
          <PhoneOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Voice Chat Not Supported</h3>
          <p className="text-sm">Your browser doesn't support voice recording.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full max-w-2xl mx-auto', className)}>
      {/* Header */}
      <div className="text-center p-6 border-b bg-gradient-to-r from-emerald-50 to-blue-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {voiceChat.isActive ? '🗣️ Interactive Voice Chat' : '💬 Voice Chat Mode'}
        </h2>
        <p className="text-gray-600 text-sm">
          {voiceChat.isActive
            ? 'Conversation active - Speak anytime to chat with me!'
            : 'Click "Start Talking" to begin our interactive conversation'}
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
        {/* Conversation Status */}
        {!voiceChat.isActive && voiceChat.messages.length === 0 && (
          <div className="text-center text-gray-500 mt-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready for Interactive Chat!</h3>
            <p className="text-sm max-w-md mx-auto leading-relaxed">
              This works like a phone call - once you start, just speak naturally. I'll listen,
              respond, and keep the conversation going!
            </p>
          </div>
        )}

        {/* Active Conversation Status */}
        {voiceChat.isActive && (
          <div className="text-center mb-6">
            <div
              className={cn(
                'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300',
                voiceChat.isListening
                  ? 'bg-green-500 animate-pulse'
                  : voiceChat.isProcessing
                    ? 'bg-blue-500'
                    : voiceChat.isSpeaking
                      ? 'bg-purple-500'
                      : 'bg-gray-400',
              )}
            >
              {voiceChat.isListening && (
                <div className="text-white animate-bounce">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              )}
              {voiceChat.isProcessing && <Loader2 className="w-8 h-8 text-white animate-spin" />}
              {voiceChat.isSpeaking && <Volume2 className="w-8 h-8 text-white animate-pulse" />}
              {voiceChat.conversationState === 'active' && <Phone className="w-8 h-8 text-white" />}
            </div>

            <div className="text-center">
              {voiceChat.isListening && (
                <div>
                  <p className="text-lg font-semibold text-green-600 mb-1">👂 Listening...</p>
                  <p className="text-sm text-gray-600">Speak now, I'm listening!</p>
                </div>
              )}
              {voiceChat.isProcessing && (
                <div>
                  <p className="text-lg font-semibold text-blue-600 mb-1">🤖 Processing...</p>
                  <p className="text-sm text-gray-600">Understanding what you said...</p>
                </div>
              )}
              {voiceChat.isSpeaking && (
                <div>
                  <p className="text-lg font-semibold text-purple-600 mb-1">🗣️ Speaking...</p>
                  <p className="text-sm text-gray-600">
                    I'm responding to you
                    <button
                      onClick={voiceChat.interruptAI}
                      className="ml-2 text-xs underline hover:no-underline"
                    >
                      (interrupt me)
                    </button>
                  </p>
                </div>
              )}
              {voiceChat.conversationState === 'active' &&
                !voiceChat.isListening &&
                !voiceChat.isProcessing &&
                !voiceChat.isSpeaking && (
                  <div>
                    <p className="text-lg font-semibold text-gray-600 mb-1">⏸️ Ready</p>
                    <p className="text-sm text-gray-600">Conversation active - speak anytime!</p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Messages */}
        {voiceChat.messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[80%] p-4 rounded-2xl shadow-sm',
                message.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md',
              )}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs opacity-75">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Display */}
      {voiceChat.error && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          <strong>Error:</strong> {voiceChat.error}
        </div>
      )}

      {/* Controls */}
      <div className="p-6 border-t bg-white">
        <div className="flex items-center justify-center space-x-4">
          {/* Main Control Button */}
          {!voiceChat.isActive ? (
            <button
              onClick={voiceChat.startConversation}
              className="flex items-center space-x-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all duration-200 shadow-lg hover:scale-105"
            >
              <Phone className="w-6 h-6" />
              <span className="font-semibold">Start Talking</span>
            </button>
          ) : (
            <button
              onClick={voiceChat.endConversation}
              className="flex items-center space-x-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-200 shadow-lg hover:scale-105"
            >
              <PhoneOff className="w-6 h-6" />
              <span className="font-semibold">End Conversation</span>
            </button>
          )}

          {/* Interrupt Button - Only show when AI is speaking */}
          {voiceChat.isSpeaking && (
            <button
              onClick={voiceChat.interruptAI}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-colors"
            >
              <VolumeX className="w-4 h-4" />
              <span className="text-sm">Interrupt</span>
            </button>
          )}

          {/* Clear Messages */}
          {voiceChat.messages.length > 0 && (
            <button
              onClick={voiceChat.clearMessages}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline hover:no-underline transition-colors"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-xs text-gray-500 space-y-1">
          {!voiceChat.isActive ? (
            <>
              <p>
                💡 <strong>How it works:</strong> Click "Start Talking" to begin
              </p>
              <p>🔄 Once active, just speak naturally - no need to click anything!</p>
              <p>⚡ You can interrupt me anytime while I'm speaking</p>
            </>
          ) : (
            <>
              <p>
                🎙️ <strong>Conversation Active:</strong> Speak anytime, I'm always listening
              </p>
              <p>🛑 You can interrupt me while I'm speaking to ask something new</p>
              <p>📞 Click "End Conversation" when you're done chatting</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
