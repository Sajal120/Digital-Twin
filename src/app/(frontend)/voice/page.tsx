import React from 'react'
import { VoiceChatComponent } from '@/components/VoiceChat'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Voice AI Assistant | Digital Twin',
  description: 'Professional voice AI for interview practice and career conversations',
}

export default function VoiceChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Professional Voice AI Assistant</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Practice interviews, networking conversations, and get career coaching with your
            AI-powered professional digital twin.
          </p>
        </div>

        {/* Quick Start Guide */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Use Voice AI</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Choose Interaction Type</h3>
                  <p className="text-gray-600">
                    Select HR screening, technical interview, networking, or career coaching
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Start Speaking</h3>
                  <p className="text-gray-600">
                    Click the microphone and speak naturally, or type your message
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Get Responses</h3>
                  <p className="text-gray-600">
                    Receive professional, context-aware responses with automatic audio playback
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Chat Component */}
        <div className="max-w-4xl mx-auto">
          <VoiceChatComponent
            className="h-[600px]"
            defaultInteractionType="general"
            showTranscript={true}
            showControls={true}
          />
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time speech recognition and transcription</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Professional voice synthesis responses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Context-aware conversation with your professional profile</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Multiple interaction types for different scenarios</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Conversation history and message replay</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Professional coaching and feedback</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-gray-50 rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Requirements</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                • <strong>Browser:</strong> Chrome, Safari, Firefox, or Edge with microphone
                permissions
              </p>
              <p>
                • <strong>Audio:</strong> Working microphone and speakers/headphones
              </p>
              <p>
                • <strong>Connection:</strong> Stable internet connection for real-time processing
              </p>
              <p>
                • <strong>Privacy:</strong> Voice data is processed securely and not stored
                permanently
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
