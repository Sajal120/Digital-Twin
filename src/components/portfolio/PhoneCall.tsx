'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, PhoneCall as PhoneCallIcon, Clock, Sparkles, MessageSquare } from 'lucide-react'

export function PhoneCall() {
  const [isCallMenuOpen, setIsCallMenuOpen] = useState(false)
  const phoneNumber = '+61278044137'
  const formattedNumber = '+61 2 7804 4137'

  const handleCallClick = () => {
    // Create tel: link for mobile devices
    window.location.href = `tel:${phoneNumber}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                📞 Call My AI Assistant
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Speak directly with my AI-powered assistant. Available 24/7 for professional
                inquiries, technical discussions, and career conversations.
              </p>
            </motion.div>
          </div>

          {/* Main Call Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl border p-8"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left Side - Call Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Direct AI Phone Line</h3>
                    <p className="text-gray-600">Professional AI Assistant</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Available 24/7 - Never miss your call</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Sparkles className="w-4 h-4" />
                    <span>AI-powered with complete professional knowledge</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <MessageSquare className="w-4 h-4" />
                    <span>Intelligent conversation & automatic follow-up</span>
                  </div>
                </div>

                {/* Phone Number Display */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Call this number:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-mono font-bold text-gray-900">
                      {formattedNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(phoneNumber)}
                      className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side - Call Actions */}
              <div className="space-y-6">
                {/* Main Call Button */}
                <motion.button
                  onClick={handleCallClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <PhoneCallIcon className="w-6 h-6 group-hover:animate-pulse" />
                    <span className="text-lg font-semibold">Call Now</span>
                  </div>
                  <p className="text-sm mt-2 opacity-90">Tap to call from mobile device</p>
                </motion.button>

                {/* What to Expect */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What to expect:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Professional AI greeting</li>
                    <li>• Intelligent conversation about my background</li>
                    <li>• Technical skills and project discussions</li>
                    <li>• Automatic follow-up with portfolio links</li>
                  </ul>
                </div>

                {/* Alternative Options */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Or choose another way to connect:</p>
                  <div className="flex space-x-3">
                    <a
                      href="#ai-chat"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors text-center"
                    >
                      💬 Text Chat
                    </a>
                    <a
                      href="/voice"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors text-center"
                    >
                      🎤 Voice AI
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Call Types Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 grid md:grid-cols-3 gap-6"
          >
            <div className="bg-white rounded-lg border p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Recruiter Calls</h3>
              <p className="text-sm text-gray-600">
                Professional screening, skills assessment, and opportunity discussions
              </p>
            </div>

            <div className="bg-white rounded-lg border p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Networking</h3>
              <p className="text-sm text-gray-600">
                Professional connections, collaboration opportunities, and knowledge sharing
              </p>
            </div>

            <div className="bg-white rounded-lg border p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Consultations</h3>
              <p className="text-sm text-gray-600">
                Technical advisory, project discussions, and business inquiries
              </p>
            </div>
          </motion.div>

          {/* Technical Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-8 text-white"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">🤖 AI Technology Showcase</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                This phone system demonstrates advanced AI integration with Twilio Voice API, OpenAI
                conversation models, and omni-channel communication architecture.
              </p>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="font-medium">Real-time AI</div>
                  <div className="text-blue-200">Voice Processing</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="font-medium">Professional</div>
                  <div className="text-blue-200">Call Routing</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="font-medium">Automatic</div>
                  <div className="text-blue-200">Transcription</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="font-medium">Smart</div>
                  <div className="text-blue-200">Follow-up</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
