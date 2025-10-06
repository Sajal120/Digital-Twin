/**
 * Omni-Channel Conversation Manager
 * Unifies conversation context across chat, voice, and phone channels
 * Integrates with existing MCP server architecture
 */

export interface ConversationChannel {
  id: string
  type: 'chat' | 'voice' | 'phone'
  platform: string
  sessionId: string
  startTime: Date
  lastActivity: Date
  status: 'active' | 'paused' | 'ended'
}

export interface UnifiedConversationContext {
  userId: string
  channels: ConversationChannel[]
  currentChannel: ConversationChannel
  conversationHistory: ConversationTurn[]
  professionalProfile: ProfessionalProfile
  relationshipContext: RelationshipContext
  preferences: UserPreferences
}

export interface ConversationTurn {
  id: string
  channelId: string
  channelType: 'chat' | 'voice' | 'phone'
  timestamp: Date
  userInput: string
  aiResponse: string
  context: any
  metadata: {
    audioProcessed?: boolean
    confidence?: number
    keywords?: string[]
    sentiment?: string
    intent?: string
  }
}

export interface ProfessionalProfile {
  personalInfo: {
    name: string
    title: string
    expertise: string[]
    experience: string
  }
  conversationStyle: {
    tone: 'professional' | 'casual' | 'technical'
    depth: 'overview' | 'detailed' | 'expert'
    pace: 'quick' | 'moderate' | 'thoughtful'
  }
  relationships: {
    type: 'recruiter' | 'colleague' | 'networking' | 'client' | 'unknown'
    history: string[]
    preferences: string[]
  }
}

export interface RelationshipContext {
  callerType: 'recruiter' | 'colleague' | 'networking' | 'client' | 'unknown'
  relationshipHistory: string[]
  previousInteractions: number
  lastInteractionDate?: Date
  interests: string[]
  conversationGoals: string[]
}

export interface UserPreferences {
  communicationStyle: 'formal' | 'conversational' | 'technical'
  topicPreferences: string[]
  responseLength: 'brief' | 'moderate' | 'detailed'
  followUpStyle: 'questions' | 'statements' | 'mixed'
}

/**
 * Omni-Channel Conversation Manager Class
 */
export class OmniChannelManager {
  private conversations = new Map<string, UnifiedConversationContext>()
  private mcpServerUrl: string
  private baseUrl: string

  constructor() {
    this.mcpServerUrl = process.env.NEXTAUTH_URL || 'https://www.sajal-app.online'
    this.baseUrl = this.mcpServerUrl
  }

  /**
   * Initialize or retrieve unified conversation context
   */
  async getUnifiedContext(
    userId: string,
    channelType: 'chat' | 'voice' | 'phone',
    sessionId: string,
    platform: string,
  ): Promise<UnifiedConversationContext> {
    console.log(`🌐 Getting unified context for ${userId} on ${channelType}`)

    let context = this.conversations.get(userId)

    if (!context) {
      // Create new unified context
      context = await this.createUnifiedContext(userId, channelType, sessionId, platform)
    } else {
      // Update current channel
      context = await this.updateCurrentChannel(context, channelType, sessionId, platform)
    }

    this.conversations.set(userId, context)
    return context
  }

  /**
   * Create new unified conversation context
   */
  private async createUnifiedContext(
    userId: string,
    channelType: 'chat' | 'voice' | 'phone',
    sessionId: string,
    platform: string,
  ): Promise<UnifiedConversationContext> {
    console.log(`🆕 Creating unified context for new user: ${userId}`)

    const channel: ConversationChannel = {
      id: `${channelType}_${sessionId}`,
      type: channelType,
      platform,
      sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      status: 'active',
    }

    // Load professional profile from MCP server
    const professionalProfile = await this.loadProfessionalProfile()

    // Initialize relationship context
    const relationshipContext = await this.analyzeRelationshipContext(userId, channelType)

    return {
      userId,
      channels: [channel],
      currentChannel: channel,
      conversationHistory: [],
      professionalProfile,
      relationshipContext,
      preferences: this.getDefaultPreferences(channelType),
    }
  }

  /**
   * Update current channel in existing context
   */
  private async updateCurrentChannel(
    context: UnifiedConversationContext,
    channelType: 'chat' | 'voice' | 'phone',
    sessionId: string,
    platform: string,
  ): Promise<UnifiedConversationContext> {
    console.log(`🔄 Updating channel for ${context.userId}: ${channelType}`)

    const newChannel: ConversationChannel = {
      id: `${channelType}_${sessionId}`,
      type: channelType,
      platform,
      sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      status: 'active',
    }

    // Add new channel if not exists
    const existingChannel = context.channels.find((c) => c.id === newChannel.id)
    if (!existingChannel) {
      context.channels.push(newChannel)
    }

    // Update current channel
    context.currentChannel = newChannel

    // Update relationship context based on channel switch
    context.relationshipContext = await this.updateRelationshipContext(
      context.relationshipContext,
      channelType,
      context.conversationHistory,
    )

    return context
  }

  /**
   * Add conversation turn to unified context
   */
  async addConversationTurn(
    userId: string,
    userInput: string,
    aiResponse: string,
    metadata: any = {},
  ): Promise<void> {
    const context = this.conversations.get(userId)
    if (!context) return

    const turn: ConversationTurn = {
      id: `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channelId: context.currentChannel.id,
      channelType: context.currentChannel.type,
      timestamp: new Date(),
      userInput,
      aiResponse,
      context: { channel: context.currentChannel },
      metadata,
    }

    context.conversationHistory.push(turn)
    context.currentChannel.lastActivity = new Date()

    // Keep last 20 turns for performance
    if (context.conversationHistory.length > 20) {
      context.conversationHistory = context.conversationHistory.slice(-20)
    }

    // Update preferences based on conversation
    context.preferences = await this.updatePreferences(context.preferences, turn)

    this.conversations.set(userId, context)
  }

  /**
   * Generate unified response using MCP server
   */
  async generateUnifiedResponse(
    userId: string,
    userInput: string,
    additionalContext: any = {},
  ): Promise<{
    response: string
    source: string
    context: any
    suggestions: string[]
  }> {
    const context = this.conversations.get(userId)
    if (!context) {
      throw new Error('No unified context found for user')
    }

    console.log(`🤖 Generating unified response for ${context.currentChannel.type} channel`)
    console.log(`📝 User input: "${userInput}"`)

    // PHONE OPTIMIZATION: Always use AI for natural, context-aware responses
    // Quick answers disabled - AI provides better, more specific responses

    // Prepare enhanced context for MCP server
    const enhancedContext = {
      userId,
      currentChannel: context.currentChannel.type,
      platform: context.currentChannel.platform,
      conversationHistory: context.conversationHistory.slice(-8), // Last 8 turns
      professionalProfile: context.professionalProfile,
      relationshipContext: context.relationshipContext,
      preferences: context.preferences,
      omniChannelData: {
        totalChannels: context.channels.length,
        channelHistory: context.channels.map((c) => c.type),
        crossChannelContext: this.getCrossChannelContext(context),
      },
      ...additionalContext,
    }

    // DETECT LANGUAGE for multi-language support (same as chat route)
    let detectedLanguage = 'en'
    let languageContext: any = null

    if (additionalContext.enableMultiLanguage) {
      console.log('🌍 Detecting language for multi-language support...')
      if (additionalContext.deepgramLanguage) {
        console.log(`🎙️ Deepgram hint available: ${additionalContext.deepgramLanguage}`)
      }
      try {
        const { detectLanguageContext } = await import('@/lib/multi-language-rag')
        languageContext = await detectLanguageContext(userInput, additionalContext.deepgramLanguage)
        detectedLanguage = languageContext.detectedLanguage
        console.log(
          `🌍 Detected language: ${detectedLanguage} (${languageContext.preferredResponseLanguage})`,
        )

        // Add language context to enhanced context
        enhancedContext.detectedLanguage = detectedLanguage
        enhancedContext.languageContext = languageContext
      } catch (error) {
        console.error('❌ Language detection failed:', error)
        // Continue with English as default
      }
    }

    // CHECK REDIS CACHE FIRST (10x faster!)
    try {
      const { getCachedResponse, setCachedResponse, isCommonGreeting, cacheCommonGreeting } =
        await import('@/lib/redis-cache')

      const channel = additionalContext.phoneCall ? 'phone' : 'chat'
      const cached = await getCachedResponse(userInput, channel, detectedLanguage)

      if (cached) {
        console.log(`⚡ CACHE HIT! Returning cached response (instant)`)
        return {
          response: cached.response,
          source: 'redis_cache',
          context: { ...enhancedContext, detectedLanguage, cached: true },
          suggestions: [], // Cached responses don't have suggestions
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Cache check failed, continuing without cache:', cacheError)
    }

    // ALWAYS USE MCP - Full AI intelligence for ALL channels including phone
    // NO FALLBACKS - MCP must work at any cost
    try {
      console.log('🤖 Using MCP server for intelligent response with RAG + database')
      console.log('📝 Question:', userInput)
      console.log('📊 Context channels:', enhancedContext.currentChannel)
      if (detectedLanguage !== 'en') {
        console.log(`🌍 Response will be in: ${detectedLanguage}`)
      }

      const mcpTimeout = additionalContext.phoneCall ? 15000 : 20000 // 15s for phone, 20s for web
      const mcpResponse = (await Promise.race([
        this.callMCPServer(userInput, enhancedContext),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('MCP timeout after ' + mcpTimeout + 'ms')), mcpTimeout),
        ),
      ])) as { success: boolean; response: string; suggestions?: string[] }

      if (mcpResponse.success && mcpResponse.response) {
        console.log('✅ MCP SUCCESS - Response length:', mcpResponse.response.length)
        console.log('📝 MCP Response preview:', mcpResponse.response.substring(0, 100))

        // Apply multi-language response generation if needed
        let finalResponse = mcpResponse.response
        if (additionalContext.enableMultiLanguage && detectedLanguage !== 'en' && languageContext) {
          console.log(`🌍 Generating ${detectedLanguage} response...`)
          try {
            const { generateMultiLanguageResponse } = await import('@/lib/multi-language-rag')
            const multiLangResult = await generateMultiLanguageResponse(
              { response: mcpResponse.response, metadata: {} },
              languageContext,
              userInput,
              userId,
              context.conversationHistory || [],
            )
            finalResponse = multiLangResult.response
            console.log(`✅ Multi-language response generated (${finalResponse.length} chars)`)
          } catch (error) {
            console.error('❌ Multi-language generation failed:', error)
            // Fall back to English response
          }
        }

        // CACHE THE RESPONSE for future speed
        try {
          const { setCachedResponse, isCommonGreeting, cacheCommonGreeting } = await import(
            '@/lib/redis-cache'
          )
          const channel = additionalContext.phoneCall ? 'phone' : 'chat'

          if (isCommonGreeting(userInput)) {
            // Common greetings get 1 hour cache
            await cacheCommonGreeting(userInput, finalResponse, channel, detectedLanguage)
            console.log('💾 Cached common greeting (1 hour TTL)')
          } else {
            // Regular responses get 5 minute cache
            await setCachedResponse(userInput, finalResponse, channel, detectedLanguage, 300)
            console.log('💾 Cached response (5 min TTL)')
          }
        } catch (cacheError) {
          console.warn('⚠️ Failed to cache response:', cacheError)
        }

        return {
          response: finalResponse,
          source: 'mcp_unified',
          context: { ...enhancedContext, detectedLanguage },
          suggestions: mcpResponse.suggestions || [],
        }
      } else {
        console.error('❌ MCP returned unsuccessful response:', mcpResponse)
        throw new Error('MCP response unsuccessful')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('🚨 MCP FAILED:', errorMessage)
      console.error('🚨 MCP Error details:', error)
      console.error('🚨 MCP Stack:', error instanceof Error ? error.stack : 'No stack')
      console.error('🚨 User input was:', userInput)
      console.warn('⚠️ MCP failed - using Chat API (same RAG system as web chat)...')
    }

    // Use Chat API - SAME architecture as web chat (no special phone fallback)
    // This gives us the full RAG system: multi-hop, agentic, hybrid search, tool use
    console.log('🌐 Using Chat API (full RAG system like web chat)')
    console.log('📝 Question:', userInput)
    console.log('🎯 Phone optimized: Brief responses, natural conversation')

    try {
      const timeoutMs = additionalContext.phoneCall ? 6000 : 10000 // 6s for phone (fast mode!), 10s for others
      const chatResponse = await Promise.race([
        this.callChatAPI(userInput, enhancedContext),
        new Promise<any>((_, reject) =>
          setTimeout(
            () => reject(new Error('Chat API timeout after ' + timeoutMs + 'ms')),
            timeoutMs,
          ),
        ),
      ])

      console.log('✅ Chat API SUCCESS:', chatResponse.response.substring(0, 100))
      return {
        response: chatResponse.response,
        source: 'chat_unified',
        context: enhancedContext,
        suggestions: chatResponse.suggestions || [],
      }
    } catch (error) {
      console.error('❌ Chat API also failed')
      throw new Error(
        'AI generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      )
    }
  }

  /**
   * DISABLED: Quick answers removed - always use MCP for accurate information
   */
  private lastQuestionTopic: string | null = null

  private getQuickPhoneAnswer(question: string): string | null {
    // ALWAYS use MCP/AI - no hardcoded responses
    console.log('🚫 Quick answers DISABLED - forcing MCP/AI for accuracy')
    return null

    /* OLD HARDCODED LOGIC DISABLED
    const normalizedQuestion = question
      .toLowerCase()
      .trim()
      .replace(/[?.!,]/g, '')
    console.log('🔍 Quick answer check for:', normalizedQuestion)

    // Experience/work questions - ULTRA AGGRESSIVE matching for instant response
    if (
      normalizedQuestion.match(
        /(exp|work|job|career|do|role|position|background|about|company|companies)/,
      )
    ) {
      console.log('⚡ INSTANT answer: experience')
      this.lastQuestionTopic = 'experience'
      return 'I work at Kimpton. I interned at Aubot doing software development, and at edgedVR doing VR development.'
    }

    // Education questions
    if (
      normalizedQuestion.match(
        /(education|study|degree|master|university|school|graduate|swinburne)/,
      )
    ) {
      console.log('⚡ INSTANT answer: education')
      this.lastQuestionTopic = 'education'
      return 'Masters in Software Development from Swinburne University. Graduated May 2024.'
    }

    // Tech/skills questions
    if (
      normalizedQuestion.match(
        /(tech|skill|language|framework|tool|stack|know|use|program|code|can)/,
      )
    ) {
      console.log('⚡ INSTANT answer: skills')
      this.lastQuestionTopic = 'skills'
      return 'React, Python, JavaScript, Node.js, AWS, Terraform. Into AI, machine learning, and security.'
    }

    // Location questions
    if (normalizedQuestion.match(/\b(where|location|live|based|located|from)\b/)) {
      console.log('⚡ Quick answer: location')
      this.lastQuestionTopic = 'location'
      return "I'm based in Auburn, Sydney. Originally from Nepal though."
    }

    // Interest/passion questions - expanded patterns
    if (
      normalizedQuestion.match(
        /\b(interest|passion|focus|specialize|want|goal|career goal|passionate about|like|enjoy|what are you interested)\b/,
      )
    ) {
      console.log('⚡ Quick answer: interests')
      this.lastQuestionTopic = 'interests'
      return "I'm really passionate about AI and machine learning, security, software development, and data analysis. That's what I'm focusing on at Kimpton."
    }

    // About/intro questions - expanded patterns
    if (
      normalizedQuestion.match(
        /\b(who are you|about yourself|tell me about|introduce|your name|who is this|yourself|who am i talking to|who am i speaking)\b/,
      )
    ) {
      console.log('⚡ Quick answer: intro')
      this.lastQuestionTopic = 'intro'
      return "I'm Sajal Basnet, software developer working at Kimpton. I'm into AI, security, and development. Got my Masters from Swinburne and I'm based in Sydney."
    }

    // Follow-up questions - use last topic for context
    if (
      normalizedQuestion.match(
        /\b(tell me more|more about|what else|anything else|elaborate|details|can you expand)\b/,
      )
    ) {
      if (this.lastQuestionTopic === 'experience') {
        return "At Aubot, I worked on software development. At edgedVR, I did VR development. Now at Kimpton, I'm applying my tech skills while pursuing AI opportunities."
      } else if (this.lastQuestionTopic === 'education') {
        console.log('⚡ Quick answer: follow-up on education')
        return 'I graduated top 15% from Swinburne, made it into the Golden Key International Honour Society. Focused on full-stack development and cloud systems.'
      } else if (this.lastQuestionTopic === 'skills') {
        console.log('⚡ Quick answer: follow-up on skills')
        return "I've built projects with React and Python, worked with AWS cloud infrastructure, and I'm learning more about machine learning and AI technologies."
      }
    }

    // Default answer for very short or unclear questions (prevent gibberish)
    if (normalizedQuestion.length < 10 || !normalizedQuestion.match(/[a-z]{3,}/)) {
      console.log('⚡ Quick answer: default (unclear question)')
      return "I'm Sajal, a software developer working at Kimpton. Got my Masters from Swinburne. What would you like to know?"
    }

    // END OF DISABLED CODE */
  }

  /**
   * Direct Groq API call for phone (ultra-fast, no middleware)
   */

  /**
   * Call MCP server with unified context
   */
  private async callMCPServer(userInput: string, context: any) {
    console.log('🚀 Calling MCP server...')
    const startTime = Date.now()

    // Create AbortController for timeout
    const controller = new AbortController()
    const fetchTimeout = context.phoneCall ? 15000 : 20000 // Match outer timeout - 15s for phone, 20s for web
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeout)

    try {
      const response = await fetch(`${this.mcpServerUrl}/api/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `omni_${context.userId}_${Date.now()}`,
          method: 'tools/call',
          params: {
            name: 'ask_digital_twin',
            arguments: {
              question: userInput,
              omniChannelContext: context,
              enhancedMode: true,
              maxResults: 8, // Increased for better context
            },
          },
        }),
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      console.log(`🔍 MCP fetch completed in ${duration}ms`)

      if (!response.ok) {
        console.error(`❌ MCP server returned ${response.status}`)
        throw new Error(`MCP server error: ${response.status}`)
      }

      const data = await response.json()
      const totalDuration = Date.now() - startTime
      console.log(`✅ MCP total time: ${totalDuration}ms`)

      if (data.result?.content?.[0]?.text) {
        console.log('📝 MCP response length:', data.result.content[0].text.length)
        return {
          success: true,
          response: this.cleanResponseForChannel(
            data.result.content[0].text,
            context.currentChannel,
          ),
          suggestions: this.extractSuggestions(data.result.content[0].text),
        }
      }

      console.error('❌ MCP invalid response structure:', data)
      throw new Error('Invalid MCP response structure')
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutSeconds = context.phoneCall ? 15 : 20
        console.error(`⏱️ MCP fetch aborted after ${timeoutSeconds}s`)
        throw new Error('MCP fetch timeout')
      }
      throw error
    }
  }

  /**
   * Call chat API with unified context
   */
  private async callChatAPI(userInput: string, context: any) {
    // Build conversation history with system instruction for accurate identity
    // Phone calls need special brief instructions
    const isPhoneCall =
      context.currentChannel === 'phone' ||
      context.phoneCall ||
      context.responseStyle === 'concise_phone'

    const conversationHistory = [
      {
        role: 'system',
        content: isPhoneCall
          ? `PHONE CALL - Be conversational but concise (15-25 words). Answer the ACTUAL question asked.

YOU ARE SAJAL BASNET:
- CURRENT: Software Developer at Kimpton
- PAST: Aubot (software dev intern), edgedVR (VR dev intern)
- EDUCATION: Masters in Software Development, Swinburne University, May 2024, GPA 3.688
- SKILLS: React, Python, JavaScript, Node.js, AWS, Terraform, MySQL, MongoDB
- INTERESTS: AI, machine learning, security, cloud architecture
- LOCATION: Sydney, Australia (originally from Nepal)

CRITICAL RULES:
1. ANSWER THE ACTUAL QUESTION - don't give generic responses
2. Use RAG context intelligently when relevant
3. Be specific with names: Kimpton, Aubot, edgedVR, Swinburne
4. Sound natural and conversational
5. If asked about projects/experience, mention SPECIFIC work
6. If asked about skills, give EXAMPLES of what you've built

INTELLIGENT RESPONSES:
Q: "What do you do?" → "I'm a software developer at Kimpton, working on full-stack applications with React and Python."
Q: "Tell me about your experience" → "I work at Kimpton doing full-stack dev. Previously interned at Aubot building software and edgedVR doing VR development."
Q: "What's your education?" → "Masters in Software Development from Swinburne University, graduated May 2024 with a 3.688 GPA."
Q: "What projects have you built?" → "Built a digital twin chatbot, worked on VR experiences at edgedVR, and developed full-stack apps with React and Python."
Q: "What are you passionate about?" → "I'm really into AI and machine learning. Also interested in security and cloud architecture."

ALWAYS: Answer what they actually asked. Use context from conversation. Be helpful and engaging.`
          : `You're Sajal Basnet. Speak naturally and conversationally.

KEY FACTS (prefer conversation context over this):
- Current: Assistant Bar Manager at Kimpton Margot Hotel (Oracle Micros POS, Deputy systems)
- Recent: Software Developer Intern at Aubot (Dec 2024-Mar 2025, Python/Java)
- Past: VR Developer at edgedVR (2022-2023, JavaScript, VR)
- Education: Masters, Swinburne University, May 2024, GPA 3.688
- Skills: React, Python, JavaScript, Node.js, AWS, Terraform
- Interests: AI, machine learning, security, full-stack development
- Location: Sydney, Australia

Speak in first person. Be specific and conversational. Sound human!`,
      },
      ...(context.conversationHistory?.slice(-5) || []), // 5 turns for better context
    ]

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), isPhoneCall ? 5000 : 10000)

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: userInput,
          user_id: context.userId,
          role: 'user',
          content: userInput,
          enhancedMode: true,
          phoneOptimized: isPhoneCall, // Enable fast mode for phone
          omniChannelContext: context,
          conversationHistory: conversationHistory,
          model: isPhoneCall ? 'gpt-3.5-turbo' : 'gpt-4', // Use faster model for phone calls
          systemInstruction: isPhoneCall
            ? 'PHONE: 10-15 words. MUST say company names. NO "I like" or "currently making". DIRECT: "I work at Kimpton", "Masters from Swinburne", "I use React".'
            : 'Use accurate profile info. Speak naturally in first person. Show enthusiasm for AI and tech.',
        }),
      })
      clearTimeout(timeout)

      if (!response.ok) throw new Error('Chat API error')

      const data = await response.json()
      return {
        response: this.cleanResponseForChannel(
          data.response || data.content,
          context.currentChannel,
        ),
        suggestions: [],
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Clean response based on channel requirements
   */
  private cleanResponseForChannel(response: string, channel: string): string {
    let cleaned = response
      // MULTI-PASS CLEANING: Do markdown removal FIRST to prevent partial patterns
      // Pass 1: Remove markdown formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Pass 2: Remove ALL metadata patterns (including partially cleaned)
      .replace(/Enhanced Interview Response[^:]*:\.?\s*/gi, '')
      .replace(/\(general context\):\.?\s*/gi, '')
      .replace(/\(specific context\):\.?\s*/gi, '')
      .replace(/---\s*\*\*[^*]+\*\*:[^\n]+/g, '')
      .replace(/Query Enhancement[:\*\*:]*[^\n.]*\.?\s*/gi, '')
      .replace(/Processing Mode[:\*\*:]*[^\n.]*\.?\s*/gi, '')
      .replace(/Context Mode[:\*\*:]*[^\n.]*\.?\s*/gi, '')
      .replace(/Source[:\*\*:]*[^\n.]*\.?\s*/gi, '')
      .replace(/Response Type[:\*\*:]*[^\n.]*\.?\s*/gi, '')
      // Pass 2.5: Fix grammar issues in greetings
      .replace(/^Hello\s+this\s+Sajal\s+Basnet/gi, "Hello, I'm Sajal Basnet")
      .replace(/^Hi\s+this\s+Sajal\s+Basnet/gi, "Hi, I'm Sajal Basnet")
      .replace(/^This\s+is\s+Sajal\s+Basnet/gi, "I'm Sajal Basnet")
      .replace(
        /^Sajal\s+Basnet\s+(?:is\s+)?a\s+(?:senior\s+)?software\s+(?:engineer|developer)/gi,
        "I'm Sajal Basnet, a full-stack software developer",
      )
      // Pass 3: Remove bullet points and listing patterns
      .replace(/\s*-\s+[^,\n]+?,\s*/g, ' ')
      .replace(/\s*-\s+[^,\n]+?\.\s*/g, '. ')
      .replace(/,\s*-\s+/g, ', ')
      // Pass 4: Catch remaining asterisk fragments
      .replace(/\*\*+/g, '')
      .replace(/\*+/g, '')
      // Remove separators
      .replace(/---+/g, '')
      .replace(/___+/g, '')
      .trim()

    if (channel === 'phone' || channel === 'voice') {
      // Additional aggressive cleaning for voice channels
      cleaned = cleaned
        .replace(/\n\n+/g, '. ') // Replace paragraphs with pauses
        .replace(/\n/g, '. ') // Replace newlines with pauses
        .replace(/\s+-\.\s*/g, ' ') // Remove "-. " artifacts
        .replace(/\s+-\s*$/g, '') // Remove trailing " -"
        .replace(/\.\s*\./g, '.') // Remove duplicate periods
        .replace(/,\s*,/g, ',') // Remove duplicate commas
        .replace(/\s+/g, ' ') // Remove extra spaces
        .trim()

      // PHONE SPECIFIC: Remove generic fluff phrases
      cleaned = cleaned
        .replace(
          /^(I can help you|Let me tell you|I'd be happy to|Allow me to|I'm here to help).*?[.!]/i,
          '',
        )
        .replace(
          /(how can I help|what would you like to know|is there anything else|feel free to ask).*?[.!]/gi,
          '',
        )
        .replace(/\bwith (software development|technology|programming|coding)\b/gi, '')
        .trim()

      // PHONE SPECIFIC: Smart truncation - Keep complete sentences, max 3 sentences or 40 words
      const sentences = cleaned.split(/\.\s+/).filter((s) => s.trim().length > 3)
      if (sentences.length > 3) {
        cleaned = sentences.slice(0, 3).join('. ') + '.'
      } else if (sentences.length > 0) {
        cleaned = sentences.join('. ') + (cleaned.endsWith('.') ? '' : '.')
      }

      // Word limit: 40 words maximum (allows complete thoughts)
      const words = cleaned.split(/\s+/).filter((w) => w.length > 0)
      if (words.length > 40) {
        // Find last complete sentence within 40 words
        let truncated = ''
        let wordCount = 0
        for (const sentence of sentences) {
          const sentenceWords = sentence.split(/\s+/).length
          if (wordCount + sentenceWords <= 40) {
            truncated += sentence + '. '
            wordCount += sentenceWords
          } else {
            break
          }
        }
        cleaned = truncated.trim() || words.slice(0, 40).join(' ') + '.'
      }

      // Truncate overly long responses for natural phone conversation
      if (cleaned.length > 300) {
        const sentences = cleaned.split(/\.\s+/)
        let truncated = ''
        for (const sentence of sentences) {
          if ((truncated + sentence).length < 280) {
            truncated += sentence + '. '
          } else {
            break
          }
        }
        cleaned = truncated.trim()
      }

      // DON'T add "I'm Sajal Basnet" prefix if already present
      // Phone handler will manage natural greeting appropriately
    } else {
      // Standard cleaning for other channels
      cleaned = cleaned.replace(/\n\n+/g, '\n\n').replace(/\s+/g, ' ').trim()
    }

    return cleaned
  }

  /**
   * Extract follow-up suggestions from response
   */
  private extractSuggestions(response: string): string[] {
    // Basic suggestion extraction logic
    const suggestions = []
    if (response.includes('project')) suggestions.push('Tell me about specific projects')
    if (response.includes('technical')) suggestions.push('Discuss technical skills')
    if (response.includes('experience')) suggestions.push('Share work experience')
    if (response.includes('career')) suggestions.push('Explore career goals')
    return suggestions
  }

  /**
   * Load professional profile - minimal fallback, prefer MCP data
   */
  private async loadProfessionalProfile(): Promise<ProfessionalProfile> {
    // Minimal profile - MCP database has the accurate, detailed information
    return {
      personalInfo: {
        name: 'Sajal Basnet',
        title: 'Software Developer & AI Engineer',
        expertise: ['Software Development', 'AI/ML', 'VR Development', 'Full-Stack'],
        experience: 'See MCP database for accurate, up-to-date work experience details.',
      },
      conversationStyle: {
        tone: 'professional',
        depth: 'detailed',
        pace: 'thoughtful',
      },
      relationships: {
        type: 'unknown',
        history: [],
        preferences: [],
      },
    }
  }

  /**
   * Analyze relationship context
   */
  private async analyzeRelationshipContext(
    userId: string,
    channelType: string,
  ): Promise<RelationshipContext> {
    return {
      callerType: channelType === 'phone' ? 'recruiter' : 'unknown',
      relationshipHistory: [],
      previousInteractions: 0,
      interests: [],
      conversationGoals: ['professional_introduction', 'skill_assessment'],
    }
  }

  /**
   * Update relationship context
   */
  private async updateRelationshipContext(
    current: RelationshipContext,
    channelType: string,
    history: ConversationTurn[],
  ): Promise<RelationshipContext> {
    // Analyze conversation for relationship updates
    const recentTurns = history.slice(-5)
    const allText = recentTurns
      .map((t) => `${t.userInput} ${t.aiResponse}`)
      .join(' ')
      .toLowerCase()

    // Update caller type based on conversation
    if (
      allText.includes('recruiter') ||
      allText.includes('hiring') ||
      allText.includes('position')
    ) {
      current.callerType = 'recruiter'
    } else if (
      allText.includes('colleague') ||
      allText.includes('team') ||
      allText.includes('work together')
    ) {
      current.callerType = 'colleague'
    } else if (
      allText.includes('network') ||
      allText.includes('connect') ||
      allText.includes('coffee')
    ) {
      current.callerType = 'networking'
    }

    return current
  }

  /**
   * Get default preferences based on channel
   */
  private getDefaultPreferences(channelType: string): UserPreferences {
    const basePreferences = {
      topicPreferences: ['professional_background', 'technical_skills'],
      followUpStyle: 'mixed' as const,
    }

    switch (channelType) {
      case 'phone':
        return {
          ...basePreferences,
          communicationStyle: 'formal',
          responseLength: 'moderate',
        }
      case 'voice':
        return {
          ...basePreferences,
          communicationStyle: 'conversational',
          responseLength: 'brief',
        }
      case 'chat':
        return {
          ...basePreferences,
          communicationStyle: 'technical',
          responseLength: 'detailed',
        }
      default:
        return {
          ...basePreferences,
          communicationStyle: 'conversational',
          responseLength: 'moderate',
        }
    }
  }

  /**
   * Update preferences based on conversation patterns
   */
  private async updatePreferences(
    current: UserPreferences,
    turn: ConversationTurn,
  ): Promise<UserPreferences> {
    // Analyze user input for preference updates
    const userInput = turn.userInput.toLowerCase()

    // Update communication style
    if (
      userInput.includes('technical') ||
      userInput.includes('specific') ||
      userInput.includes('detail')
    ) {
      current.communicationStyle = 'technical'
      current.responseLength = 'detailed'
    } else if (userInput.length < 20) {
      current.responseLength = 'brief'
    }

    return current
  }

  /**
   * Get cross-channel context
   */
  private getCrossChannelContext(context: UnifiedConversationContext): any {
    return {
      channelsUsed: context.channels.map((c) => c.type),
      conversationStartTime: Math.min(...context.channels.map((c) => c.startTime.getTime())),
      totalConversationTime:
        Date.now() - Math.min(...context.channels.map((c) => c.startTime.getTime())),
      mostActiveChannel: context.channels.reduce((prev, current) =>
        current.lastActivity > prev.lastActivity ? current : prev,
      ).type,
    }
  }

  /**
   * Get conversation summary for handoffs
   */
  getConversationSummary(userId: string): string {
    const context = this.conversations.get(userId)
    if (!context) return 'No conversation history'

    const recentTurns = context.conversationHistory.slice(-3)
    const topics = recentTurns.map((t) => t.userInput).join(', ')

    return `Recent discussion: ${topics}. Current focus: ${context.relationshipContext.callerType} conversation on ${context.currentChannel.type}.`
  }
}

// Singleton instance
export const omniChannelManager = new OmniChannelManager()
