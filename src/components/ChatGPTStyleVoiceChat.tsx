'use client'

import React from 'react'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatGPTStyleVoiceChatProps {
  className?: string
}

export const ChatGPTStyleVoiceChat: React.FC<ChatGPTStyleVoiceChatProps> = ({ className }) => {
  return (
    <div className={cn('flex flex-col h-full bg-gradient-to-b from-gray-50 to-white', className)}>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Voice Chat Coming Soon</h2>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Voice chat feature is currently being rebuilt from scratch. Please use text chat for now
            or call the phone system for voice conversations.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                // Navigate to text chat mode
                const event = new CustomEvent('switchChatMode', { detail: 'text' })
                window.dispatchEvent(event)
              }}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Use Text Chat</span>
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">📞 For voice: Call +61 2 7804 4137</p>
        </div>
      </div>
    </div>
  )
}
