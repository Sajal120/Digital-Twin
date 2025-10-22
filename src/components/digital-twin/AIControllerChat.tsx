'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Bot,
  User,
  Loader2,
  X,
  Minimize2,
  Settings,
  Phone,
  Mic,
  MicOff,
  Volume2,
  Square,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

import { useAIControl, detectIntent } from '@/contexts/AIControlContext'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isVoice?: boolean
  isClickableHistory?: boolean
  resumeSessionId?: string
}

export function AIControllerChat() {
  const { data: session } = useSession()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [isVoiceConversationActive, setIsVoiceConversationActive] = useState(false)
  const [conversationMemory, setConversationMemory] = useState<
    Array<{ transcript: string; response: string; timestamp: Date }>
  >([])
  const [conversationSummary, setConversationSummary] = useState('')
  const [sessionId, setSessionId] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const localAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Get context first
  const {
    setMode,
    setVoiceState,
    setLastAIMessage,
    processAIIntent,
    setEmotionalTone,
    voiceState,
    chatMode,
    setChatMode,
    toggleComponent,
  } = useAIControl()

  // Separate message histories for each chat mode
  const [aiControlMessages, setAiControlMessages] = useState<Message[]>([
    {
      id: '1',
      content: session?.user
        ? `Hi ${session.user.name}! 🤖 I'll show you visual content instead of text descriptions. Use the quick buttons below or just ask me to show you something!`
        : "Hi! 🤖 I'll show you visual content instead of text descriptions. Use the quick buttons below or just ask me to show you something!",
      role: 'assistant',
      timestamp: new Date(),
    },
  ])

  const [plainChatMessages, setPlainChatMessages] = useState<Message[]>([
    {
      id: '1',
      content: session?.user
        ? `Hi ${session.user.name}! 💬 I'm here to answer your questions with detailed responses. Feel free to ask me anything about my background, experience, or interests!`
        : "Hi! 💬 I'm here to answer your questions with detailed responses. Feel free to ask me anything about my background, experience, or interests!",
      role: 'assistant',
      timestamp: new Date(),
    },
  ])

  const [voiceChatMessages, setVoiceChatMessages] = useState<Message[]>([
    {
      id: '1',
      content: session?.user
        ? `Hi ${session.user.name}! 🎙️ Let's have a voice conversation! Press the mic button to start talking.`
        : "Hi! 🎙️ Let's have a voice conversation! Press the mic button to start talking.",
      role: 'assistant',
      timestamp: new Date(),
      isVoice: true,
    },
  ])

  // Voice chat removed - no longer needed

  // Use the appropriate messages based on current chat mode
  const messages =
    chatMode === 'ai_control'
      ? aiControlMessages
      : chatMode === 'plain_chat'
        ? plainChatMessages
        : voiceChatMessages

  const setMessages =
    chatMode === 'ai_control'
      ? setAiControlMessages
      : chatMode === 'plain_chat'
        ? setPlainChatMessages
        : setVoiceChatMessages

  useEffect(() => {
    setIsMounted(true)

    // Cleanup on unmount
    return () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
    }
  }, [mediaRecorder])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Keyboard shortcuts for voice chat
  useEffect(() => {
    if (chatMode !== 'voice_chat') return

    const handleKeyPress = (event: KeyboardEvent) => {
      // Spacebar to toggle recording (like push-to-talk)
      if (event.code === 'Space' && !event.repeat && !isLoading && !isPlaying) {
        event.preventDefault()
        if (isRecording) {
          stopRecording()
        } else {
          startRecording()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [chatMode, isRecording, isLoading, isPlaying])

  const handleAIResponse = (content: string, isAIControl: boolean = false) => {
    setLastAIMessage(content)

    // Only process intents in AI Control mode
    if (chatMode === 'ai_control' || isAIControl) {
      // Detect intent from AI response or user message
      const intent = detectIntent(content)
      if (intent) {
        console.log('🎯 Detected intent from AI:', intent)
        // Auto-hide chat and show content in AI Control mode - give time to read response
        setTimeout(() => {
          processAIIntent(intent)
        }, 1500)
      }

      // Set emotional tone based on content
      if (
        content.includes('exciting') ||
        content.includes('amazing') ||
        content.includes('great')
      ) {
        setEmotionalTone('excited')
      } else if (
        content.includes('skill') ||
        content.includes('technical') ||
        content.includes('expertise')
      ) {
        setEmotionalTone('focused')
      } else if (
        content.includes('pleasure') ||
        content.includes('nice') ||
        content.includes('hello')
      ) {
        setEmotionalTone('calm')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Detect intent in AI Control mode and provide brief response
    if (chatMode === 'ai_control') {
      const intent = detectIntent(inputValue)
      if (intent) {
        console.log('🎯 Detected intent from user:', intent)

        // Provide brief response based on intent type
        let briefResponse = ''
        switch (intent.type) {
          case 'show_projects':
            briefResponse = 'Here are my projects! ✨'
            break
          case 'show_skills':
            briefResponse = 'Check out my skills! 🚀'
            break
          case 'show_resume':
            briefResponse = 'Here are my projects! ✨'
            break
          case 'show_contact':
            briefResponse = "Let's connect! 📧"
            break
          case 'show_about':
            briefResponse = "Here's my story! 👋"
            break
          default:
            briefResponse = 'Here you go! ✨'
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: briefResponse,
          role: 'assistant',
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        handleAIResponse(inputValue, true)
        setIsLoading(false)
        return
      }
    }

    // For Plain Chat mode, ALWAYS call API - no brief responses

    // For Plain Chat mode OR AI Control mode without intent, get detailed response from API
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          enhancedMode: chatMode !== 'ai_control', // Force enhanced mode for Plain Chat
          interviewType: chatMode !== 'ai_control' ? 'general' : 'brief',
          user: session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
              }
            : undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      // Only process intents and auto-hide in AI Control mode
      if (chatMode === 'ai_control') {
        handleAIResponse(data.response, true)
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting right now. Please try again.",
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const unlockAudio = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      gainNode.gain.value = 0
      oscillator.frequency.value = 440
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.01)
      return true
    } catch (error) {
      console.log('⚠️ Audio unlock failed:', error)
      return false
    }
  }

  // Helper function to render message content with clickable links
  const renderMessageContent = (content: string) => {
    // Convert markdown links [text](url) to clickable HTML
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts: (string | React.ReactNode)[] = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }

      // Add the clickable link
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {match[1]}
        </a>,
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }

    return parts.length > 0 ? parts : content
  }

  const handlePhoneCall = () => {
    // Australian phone number - Twilio integration
    window.open('tel:+61278044137')
  }

  const startVoiceConversation = () => {
    console.log('🎙️ Starting NEW voice conversation...')

    // Always create new session ID for new conversations
    const newSessionId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)

    setIsVoiceConversationActive(true)

    // Always clear memory and summary for new conversations
    setConversationMemory([])
    setConversationSummary('')

    console.log('✨ New voice conversation started with session:', newSessionId)
  }

  const continueVoiceConversation = () => {
    console.log('🔄 Continuing existing voice conversation...')
    setIsVoiceConversationActive(true)
  }

  const endVoiceConversation = async () => {
    console.log('🛑 Ending voice conversation...')
    setIsVoiceConversationActive(false)

    // Stop any ongoing recording or playback
    if (isRecording) stopRecording()
    if (isPlaying) stopAISpeech()

    // Only generate conversation summary if there are actual conversation turns
    if (conversationMemory.length > 0) {
      console.log('📝 Generating history for conversation with', conversationMemory.length, 'turns')
      await generateConversationSummary()
    } else {
      console.log('🗑️ No conversation turns - skipping history generation')
    }
  }

  // Voice recording functions following phone backend architecture
  const startRecording = async () => {
    try {
      console.log('🎙️ Starting voice recording...')

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      // Create MediaRecorder with WebM format (widely supported)
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      })

      const audioChunks: BlobPart[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      recorder.onstop = async () => {
        console.log('🔊 Processing recorded audio...')
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        await processVoiceMessage(audioBlob)

        // Stop all tracks to free up microphone
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      }

      setMediaRecorder(recorder)
      setIsRecording(true)
      recorder.start()

      console.log('✅ Recording started successfully')
    } catch (error) {
      console.error('❌ Voice recording error:', error)
      alert('Microphone access denied or not available. Please check your browser settings.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('🛑 Stopping recording...')
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const processVoiceMessage = async (audioBlob: Blob) => {
    try {
      setIsLoading(true)
      console.log('🎤 Processing voice message...', audioBlob.size, 'bytes')

      // Step 1: Transcribe audio using Deepgram (faster and more accurate)
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      console.log('🎤 Transcribing with Deepgram...')
      const transcribeResponse = await fetch('/api/voice/deepgram-transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed')
      }

      const transcribeData = await transcribeResponse.json()
      const transcript =
        transcribeData.transcription || transcribeData.transcript || transcribeData.text || ''

      if (!transcript.trim()) {
        throw new Error('No speech detected')
      }

      console.log('💬 Transcript:', transcript)

      // During active voice conversation, don't show text - just store in memory
      if (!isVoiceConversationActive) {
        // Add user message to voice chat only if not in active conversation
        const userMessage: Message = {
          id: Date.now().toString(),
          content: transcript,
          role: 'user',
          timestamp: new Date(),
          isVoice: true,
        }
        setVoiceChatMessages((prev) => [...prev, userMessage])
      }

      // Step 2: Get AI response using MCP (following phone architecture)
      console.log('🤖 Getting AI response...')
      const chatResponse = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `voice_${Date.now()}`,
          method: 'tools/call',
          params: {
            name: 'ask_digital_twin',
            arguments: {
              question: transcript,
              interviewType: 'general',
              enhancedMode: true,
              maxResults: 3,
            },
          },
        }),
      })

      let aiResponseText = "I'm sorry, I didn't understand that. Could you try again?"

      if (chatResponse.ok) {
        const chatData = await chatResponse.json()
        if (chatData.result?.content?.[0]?.text) {
          aiResponseText = chatData.result.content[0].text
            // Remove all MCP metadata and formatting
            .replace(/\*\*Enhanced Interview Response\*\*[^:]*:[^\n]*\n?/gi, '')
            .replace(/Query Enhancement:[^\n]*\n?/gi, '')
            .replace(/Processing Mode:[^\n]*\n?/gi, '')
            .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
            .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
            .replace(/---[^\n]*\n?/g, '') // Remove dividers
            .replace(/^\s*\n+/gm, '') // Remove empty lines at start
            .replace(/\n\s*\n+/g, '. ') // Replace multiple newlines with periods
            .replace(/\n/g, '. ') // Replace single newlines with periods
            .replace(/\.\s*\./g, '.') // Remove duplicate periods
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
        }
      }

      // Store in conversation memory during active conversation
      if (isVoiceConversationActive) {
        setConversationMemory((prev) => [
          ...prev,
          {
            transcript,
            response: aiResponseText,
            timestamp: new Date(),
          },
        ])
      } else {
        // Add AI response to voice chat only if not in active conversation
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponseText,
          role: 'assistant',
          timestamp: new Date(),
          isVoice: true,
        }
        setVoiceChatMessages((prev) => [...prev, aiMessage])
      }

      // Step 3: Generate speech using TTS API (following phone architecture)
      console.log('🔊 Generating speech...')
      await generateAndPlaySpeech(aiResponseText)
    } catch (error) {
      console.error('❌ Voice processing error:', error)

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I had trouble processing your voice message. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        isVoice: true,
      }

      setVoiceChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to stop AI speech
  const stopAISpeech = () => {
    if (currentAudioRef.current) {
      console.log('🛑 Stopping AI speech...')
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
      setIsPlaying(false)
    }
  }

  const generateAndPlaySpeech = async (text: string) => {
    try {
      setIsPlaying(true)
      console.log('� Generating speech with Cartesia cloned voice:', text.substring(0, 50) + '...')

      // Use Cartesia TTS API with your cloned voice
      const ttsResponse = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!ttsResponse.ok) {
        throw new Error('Cartesia TTS generation failed')
      }

      // Get audio blob and play it
      const audioBlob = await ttsResponse.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      const audio = new Audio(audioUrl)
      currentAudioRef.current = audio // Store reference for stopping

      audio.onended = () => {
        setIsPlaying(false)
        currentAudioRef.current = null
        URL.revokeObjectURL(audioUrl)
        console.log('✅ Cartesia speech playback completed')
      }

      audio.onerror = () => {
        setIsPlaying(false)
        currentAudioRef.current = null
        URL.revokeObjectURL(audioUrl)
        console.error('❌ Speech playback failed')
      }

      await audio.play()
      console.log('✅ Speech playback started')
    } catch (error) {
      console.error('❌ Speech generation error:', error)
      setIsPlaying(false)
    }
  }

  const resumeConversation = async (sessionId: string) => {
    try {
      console.log('🔄 Resuming conversation with session:', sessionId)

      // Set the session ID to resume
      setSessionId(sessionId)

      // Load the conversation data from memory API
      const response = await fetch(`/api/voice/memory?sessionId=${sessionId}`, {
        method: 'GET',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.found && data.memory) {
          // Restore the conversation memory
          setConversationMemory(data.memory)
          setConversationSummary(data.summary || '')
          console.log('📦 Loaded conversation memory:', data.memory.length, 'turns')
        }
      }

      // Start voice conversation mode immediately without clearing messages
      setIsVoiceConversationActive(true)

      console.log('✅ Conversation resumed successfully')
    } catch (error) {
      console.error('❌ Failed to resume conversation:', error)
    }
  }

  const generateConversationSummary = async () => {
    try {
      console.log('📝 Generating conversation summary...')

      // Use the actual conversation history instead of AI summary
      const conversationHistory = conversationMemory
        .map((turn, index) => `👤 You: ${turn.transcript}\n🤖 Me: ${turn.response}`)
        .join('\n\n')

      setConversationSummary(conversationHistory)

      // Save to memory API
      try {
        await fetch('/api/voice/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save',
            sessionId,
            summary: conversationHistory,
            memory: conversationMemory,
            turnCount: conversationMemory.length,
          }),
        })
        console.log('💾 Conversation history saved to memory')
      } catch (error) {
        console.error('❌ Failed to save conversation to memory:', error)
      }

      // Add conversation history to voice chat messages
      const historyMessage: Message = {
        id: Date.now().toString(),
        content: `📝 ${conversationHistory}`,
        role: 'assistant',
        timestamp: new Date(),
        isVoice: false,
        isClickableHistory: true,
        resumeSessionId: sessionId,
      }
      setVoiceChatMessages((prev) => {
        // Remove any existing history for this session and add the new one
        const filtered = prev.filter((msg) => msg.resumeSessionId !== sessionId)
        return [...filtered, historyMessage]
      })
    } catch (error) {
      console.error('❌ Failed to generate conversation summary:', error)
    }
  }

  const loadPreviousConversation = async (sessionId: string) => {
    try {
      console.log('📋 Loading previous conversation...', sessionId)

      const response = await fetch(`/api/voice/memory?sessionId=${sessionId}`, {
        method: 'GET',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.found && data.summary) {
          // Add previous conversation history to messages
          const previousMessage: Message = {
            id: 'previous_' + Date.now().toString(),
            content: `� Previous Conversation (${new Date(data.timestamp).toLocaleDateString()}):\n\n${data.summary}\n\n`,
            role: 'assistant',
            timestamp: new Date(),
            isVoice: false,
            isClickableHistory: true,
            resumeSessionId: sessionId,
          }
          setVoiceChatMessages((prev) => {
            const hasExisting = prev.some((msg) => msg.resumeSessionId === sessionId)
            return hasExisting ? prev : [...prev, previousMessage]
          })
          setConversationSummary(data.summary)
          console.log('✅ Previous conversation loaded successfully')
        } else {
          console.log('🗑️ No previous conversation found for session:', sessionId)
        }
      }
    } catch (error) {
      console.error('❌ Failed to load previous conversation:', error)
    }
  }

  // Load conversation history when switching to voice chat mode
  useEffect(() => {
    if (chatMode === 'voice_chat' && !isVoiceConversationActive && sessionId) {
      // Only load if we have a sessionId but haven't started a new conversation
      if (conversationMemory.length === 0 && !conversationSummary) {
        loadPreviousConversation(sessionId)
      }
    }
  }, [
    chatMode,
    sessionId,
    isVoiceConversationActive,
    conversationMemory.length,
    conversationSummary,
  ])

  // Spacebar functionality for voice recording
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        chatMode === 'voice_chat' &&
        isVoiceConversationActive &&
        event.code === 'Space' &&
        !event.repeat &&
        !isLoading
      ) {
        event.preventDefault()
        if (isRecording) {
          stopRecording()
        } else if (isPlaying) {
          stopAISpeech()
        } else {
          startRecording()
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        chatMode === 'voice_chat' &&
        isVoiceConversationActive &&
        event.code === 'Space' &&
        isRecording
      ) {
        event.preventDefault()
        stopRecording()
      }
    }

    if (chatMode === 'voice_chat' && isVoiceConversationActive) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [
    chatMode,
    isVoiceConversationActive,
    isRecording,
    isPlaying,
    isLoading,
    startRecording,
    stopRecording,
    stopAISpeech,
  ])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Chat window */}
      <motion.div
        className={`relative w-full max-w-4xl bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden mobile-vh-fix ${chatMode === 'voice_chat' ? 'h-[calc(100vh-12rem)]' : 'h-[85vh] sm:h-[80vh] md:h-[80vh]'}`}
        style={{
          height:
            chatMode === 'voice_chat' ? 'calc(100vh - 12rem)' : 'min(85vh, calc(100vh - 4rem))',
          maxHeight: chatMode === 'voice_chat' ? 'calc(100vh - 10rem)' : 'calc(100vh - 2rem)',
        }}
        initial={{ y: 50 }}
        animate={{ y: 0 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div
              className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-lg"
              animate={{
                boxShadow:
                  voiceState === 'speaking'
                    ? ['0 0 0 0 rgba(255,255,255,0.4)', '0 0 0 20px rgba(255,255,255,0)']
                    : '0 0 0 0 rgba(255,255,255,0)',
              }}
              transition={{ duration: 1.5, repeat: voiceState === 'speaking' ? Infinity : 0 }}
            >
              <Bot className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h3 className="font-bold text-white text-xl">Sajal's Digital Twin</h3>
              <p className="text-blue-100 text-sm">
                {voiceState === 'listening' && '🎙️ Listening...'}
                {voiceState === 'speaking' && '🔊 Speaking...'}
                {voiceState === 'processing' && '⚡ Processing...'}
                {voiceState === 'idle' && '💬 Ready to chat'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Phone Call Button */}
            <button
              onClick={handlePhoneCall}
              className="p-2 bg-green-500/80 hover:bg-green-600 rounded-lg transition-colors"
              title="Call +61 2 7804 4137"
            >
              <Phone className="w-5 h-5 text-white" />
            </button>

            {/* Chat Mode Toggle */}
            <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setChatMode('ai_control')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  chatMode === 'ai_control'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
                title="AI Control: Brief responses + instant UI visualization"
              >
                🤖 AI Control
              </button>
              <button
                onClick={() => setChatMode('plain_chat')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  chatMode === 'plain_chat'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
                title="Plain Chat: Detailed text responses + no UI changes"
              >
                💬 Plain Chat
              </button>
              <button
                onClick={() => setChatMode('voice_chat')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  chatMode === 'voice_chat'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
                title="Voice Chat: Talk and listen - mobile optimized"
              >
                🎙️ Voice Chat
              </button>
            </div>

            <button
              onClick={() => setMode('landing')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Messages - Hidden during active voice conversation */}
        {!(chatMode === 'voice_chat' && isVoiceConversationActive) && (
          <div
            className={`h-[calc(100%-160px)] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent ${chatMode === 'voice_chat' ? 'pb-80' : 'pb-20'}`}
          >
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex space-x-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <motion.div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
                          : message.isClickableHistory
                            ? 'bg-gradient-to-br from-green-600/20 to-blue-600/20 backdrop-blur-lg text-white border border-green-400/30 cursor-pointer hover:from-green-600/30 hover:to-blue-600/30 transition-all'
                            : 'bg-white/10 backdrop-blur-lg text-white border border-white/10'
                      }`}
                      animate={{
                        boxShadow:
                          message.role === 'assistant'
                            ? [
                                '0 0 0 rgba(147, 51, 234, 0)',
                                '0 0 20px rgba(147, 51, 234, 0.3)',
                                '0 0 0 rgba(147, 51, 234, 0)',
                              ]
                            : undefined,
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      onClick={
                        message.isClickableHistory && message.resumeSessionId
                          ? () => resumeConversation(message.resumeSessionId!)
                          : undefined
                      }
                    >
                      <div
                        className={`text-sm whitespace-pre-line ${message.isClickableHistory ? 'max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/50 scrollbar-track-transparent' : ''}`}
                      >
                        {message.isVoice && (
                          <span className="inline-flex items-center gap-1 text-xs opacity-75 mb-1">
                            {message.role === 'user' ? '🎙️' : '🔊'} Voice
                          </span>
                        )}
                        {renderMessageContent(message.content)}
                        {message.isClickableHistory && (
                          <div className="mt-2 text-xs opacity-70 italic">
                            👆 Click to continue this conversation
                          </div>
                        )}
                      </div>
                      {message.isVoice &&
                        chatMode === 'voice_chat' &&
                        message.role === 'assistant' && (
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">🔊 Voice message</span>
                            <button
                              onClick={() => generateAndPlaySpeech(message.content)}
                              disabled={isPlaying || isLoading}
                              className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors disabled:opacity-50"
                              title="Replay with your Cartesia cloned voice"
                            >
                              {isPlaying ? '🔊 Playing...' : '🔁 Replay'}
                            </button>
                          </div>
                        )}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-4 py-3 border border-white/10">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Quick Action Buttons - Different for each mode - Only show when messages are few and not in voice chat */}
        {messages.length <= 2 && chatMode !== 'voice_chat' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 left-0 right-0 px-6"
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
              <p className="text-white/70 text-sm mb-3 text-center">
                {chatMode === 'ai_control' ? 'Quick Actions:' : 'Quick Questions:'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {chatMode === 'ai_control' ? (
                  // AI Control Mode: Visual action buttons
                  <>
                    <button
                      onClick={() => {
                        setInputValue('show me about section')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      About
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('show me your experience')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Experience
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('show me your skills')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Skills
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('show me your projects')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Projects
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('show me your contact')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Contact
                    </button>
                  </>
                ) : (
                  // Plain Chat Mode: Question buttons
                  <>
                    <button
                      onClick={() => {
                        setInputValue('What are your key skills and technical expertise?')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      💡 Skills
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('Tell me about your professional experience and background')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      💼 Experience
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('What projects have you worked on recently?')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      🚀 Projects
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('How can I get in touch with you?')
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                        handleSubmit(fakeEvent)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      📧 Contact
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Input */}
        <div
          className={`fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent safe-area-inset-bottom z-50 ${chatMode === 'voice_chat' && !isVoiceConversationActive ? 'pb-8' : ''}`}
        >
          {chatMode === 'voice_chat' ? (
            // Voice Chat Mode - Pure Voice Interface
            <div className="flex flex-col items-center space-y-4">
              {!isVoiceConversationActive ? (
                // Start Conversation Mode
                <>
                  <div className="text-center mb-4">
                    <p className="text-white/90 text-lg font-medium mb-2">🎙️ Voice Conversation</p>
                    <p className="text-white/60 text-sm">
                      Start a natural voice conversation. No text will be shown during our chat.
                      <br />
                      I'll remember everything and give you the conversation history when done.
                      <br />
                      <br />
                      <span className="text-white/80 font-medium">
                        💡 Tip: Press Space Bar or Click on Mic to talk
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-3">
                    <motion.button
                      onClick={startVoiceConversation}
                      className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-full text-white font-medium transition-all shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      🎤 Start New Conversation
                    </motion.button>

                    {conversationSummary && (
                      <motion.button
                        onClick={continueVoiceConversation}
                        className="px-6 py-2 bg-blue-500/80 hover:bg-blue-600 rounded-full text-white text-sm transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        🔄 Continue Previous Conversation
                      </motion.button>
                    )}
                  </div>
                </>
              ) : (
                // Active Conversation Mode
                <>
                  {/* Voice Status */}
                  <div className="text-center">
                    <p className="text-white/70 text-sm">
                      {isRecording
                        ? '🎙️ Listening... Speak now! (Release Space to stop)'
                        : isLoading
                          ? '⚡ Processing with Deepgram + Cartesia...'
                          : isPlaying
                            ? '🔊 AI is speaking... (Space/Click to stop)'
                            : '🎯 Press Space or Click Mic to talk'}
                    </p>
                  </div>

                  {/* Mic Button */}
                  <motion.button
                    type="button"
                    onClick={
                      isRecording ? stopRecording : isPlaying ? stopAISpeech : startRecording
                    }
                    disabled={isLoading}
                    className={`p-6 rounded-full transition-all shadow-lg ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : isPlaying
                          ? 'bg-orange-500 hover:bg-orange-600'
                          : isLoading
                            ? 'bg-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                    } disabled:opacity-50`}
                    whileHover={{ scale: isLoading ? 1 : 1.05 }}
                    whileTap={{ scale: isLoading ? 1 : 0.95 }}
                  >
                    {isRecording ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <MicOff className="w-8 h-8 text-white" />
                      </motion.div>
                    ) : isLoading ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : isPlaying ? (
                      <Square className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </motion.button>

                  {/* End Conversation Button */}
                  <motion.button
                    onClick={endVoiceConversation}
                    className="mt-4 px-6 py-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white text-sm transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🛑 End Conversation
                  </motion.button>
                </>
              )}
            </div>
          ) : (
            // Text Chat Mode - Standard Input
            <form onSubmit={handleSubmit} className="flex items-center space-x-2 sm:space-x-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all text-sm sm:text-base"
                disabled={isLoading}
              />

              <motion.button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
