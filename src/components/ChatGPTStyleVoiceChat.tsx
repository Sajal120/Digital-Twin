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

  // Handle the single button click
  const handleButtonClick = () => {
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
      className={cn(
        'flex flex-col h-full bg-gradient-to-b from-gray-900 to-black text-white',
        className,
      )}
    >
      {/* Main Interface - Single Button Centered */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Status Text Above Button */}
        <div className="text-center mb-12">
          {!voiceChat.isActive ? (
            <div>
              <h2 className="text-3xl font-light text-white mb-4">
                Say hello to advanced voice mode
              </h2>
              <div className="space-y-3 text-left max-w-md">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-medium text-white">Natural conversations</div>
                    <div className="text-gray-400 text-sm">
                      Senses and responds to interruptions, humor, and more.
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-medium text-white">Personalized to you</div>
                    <div className="text-gray-400 text-sm">
                      Uses memory and responses tailored to your conversations.
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-medium text-white">You're in control</div>
                    <div className="text-gray-400 text-sm">
                      Audio recordings are not saved, and you can interrupt at any time.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : voiceChat.isListening ? (
            <div>
              <h3 className="text-2xl font-light text-white mb-2">I'm listening...</h3>
              <p className="text-gray-400">Go ahead and speak</p>
            </div>
          ) : voiceChat.isProcessing ? (
            <div>
              <h3 className="text-2xl font-light text-white mb-2">Thinking...</h3>
              <p className="text-gray-400">Processing your message</p>
            </div>
          ) : voiceChat.isSpeaking ? (
            <div>
              <h3 className="text-2xl font-light text-white mb-2">Speaking...</h3>
              <p className="text-gray-400">Tap to interrupt</p>
            </div>
          ) : null}
        </div>

        {/* Single Large Button - ChatGPT Style */}
        <div className="relative">
          <button
            onClick={handleButtonClick}
            disabled={!voiceChat.isSupported}
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300',
              !voiceChat.isActive
                ? 'bg-white text-black hover:bg-gray-100'
                : voiceChat.isListening
                  ? 'bg-white text-black animate-pulse'
                  : voiceChat.isProcessing
                    ? 'bg-orange-500 text-white animate-pulse'
                    : voiceChat.isSpeaking
                      ? 'bg-white text-black animate-pulse cursor-pointer'
                      : 'bg-white text-black',
              !voiceChat.isSupported && 'opacity-50 cursor-not-allowed',
            )}
          >
            {!voiceChat.isActive ? (
              <Mic className="w-8 h-8" />
            ) : voiceChat.isListening ? (
              <div className="flex space-x-1">
                <div className="w-1 h-6 bg-black rounded-full animate-pulse"></div>
                <div
                  className="w-1 h-8 bg-black rounded-full animate-pulse"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="w-1 h-4 bg-black rounded-full animate-pulse"
                  style={{ animationDelay: '0.4s' }}
                ></div>
                <div
                  className="w-1 h-7 bg-black rounded-full animate-pulse"
                  style={{ animationDelay: '0.6s' }}
                ></div>
              </div>
            ) : voiceChat.isProcessing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : voiceChat.isSpeaking ? (
              <Volume2 className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          {/* Ripple effect for active states */}
          {(voiceChat.isListening || voiceChat.isProcessing) && (
            <div className="absolute inset-0 w-24 h-24 rounded-full bg-white/20 animate-ping"></div>
          )}
        </div>
      </div>

      {/* Bottom Instructions/Actions */}
      <div className="p-6 text-center">
        {!voiceChat.isActive ? (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Voice mode can make mistakes — check important info.
            </p>
            <button
              onClick={handleButtonClick}
              className="w-full bg-white text-black py-3 px-6 rounded-full font-medium hover:bg-gray-100 transition-colors"
            >
              Continue
            </button>
          </div>
        ) : (
          <button
            onClick={voiceChat.endConversation}
            className="text-gray-400 hover:text-white text-sm underline hover:no-underline"
          >
            End conversation
          </button>
        )}
      </div>

      {/* Error Display */}
      {voiceChat.error && (
        <div className="p-3 bg-red-900/50 border-t border-red-800 text-red-200 text-sm text-center">
          {voiceChat.error}
        </div>
      )}
    </div>
  )
}
