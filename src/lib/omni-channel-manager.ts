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

    try {
      // Try MCP server first (most comprehensive)
      const mcpResponse = await this.callMCPServer(userInput, enhancedContext)
      if (mcpResponse.success) {
        return {
          response: mcpResponse.response,
          source: 'mcp_unified',
          context: enhancedContext,
          suggestions: mcpResponse.suggestions || [],
        }
      }
    } catch (error) {
      console.warn('⚠️ MCP server unavailable, using chat API fallback')
    }

    // Fallback to enhanced chat API
    const chatResponse = await this.callChatAPI(userInput, enhancedContext)
    return {
      response: chatResponse.response,
      source: 'chat_unified',
      context: enhancedContext,
      suggestions: chatResponse.suggestions || [],
    }
  }

  /**
   * Call MCP server with unified context
   */
  private async callMCPServer(userInput: string, context: any) {
    const response = await fetch(`${this.mcpServerUrl}/api/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
            maxResults: 8,
          },
        },
      }),
    })

    if (!response.ok) throw new Error('MCP server error')

    const data = await response.json()
    if (data.result?.content?.[0]?.text) {
      return {
        success: true,
        response: this.cleanResponseForChannel(data.result.content[0].text, context.currentChannel),
        suggestions: this.extractSuggestions(data.result.content[0].text),
      }
    }

    throw new Error('Invalid MCP response')
  }

  /**
   * Call chat API with unified context
   */
  private async callChatAPI(userInput: string, context: any) {
    // Build conversation history with system instruction for accurate identity
    const conversationHistory = [
      {
        role: 'system',
        content: `You are Sajal Basnet. ACCURATE INFO ONLY (NO EXAGGERATION):
- Title: Full-Stack Software Developer (NOT senior, NOT 5+ years)
- Education: Masters in Software Development from Swinburne University (GPA 3.688/4.0, Top 15% - Golden Key International Honour Society)
- Location: Auburn, Sydney, NSW, Australia (originally from Nepal)
- Current Focus: AI, Development, Security, Support
- Recent Work: Software Developer Intern at Aubot (12/2024-03/2025), VR Developer at edgedVR (09/2021-03/2022)
- Current Project: Digital Twin Portfolio app with chat and voice features
- Tech Stack: React, Python, JavaScript, PHP, Java, C#, Node.js, AWS, Terraform, MySQL, MongoDB, PostgreSQL
- Languages: English (Proficient), Nepali (Native), Hindi (Basic)

Speak naturally in FIRST PERSON. Vary your responses. Be conversational and authentic.`,
      },
      ...(context.conversationHistory || []),
    ]

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userInput,
        user_id: context.userId,
        role: 'user',
        content: userInput,
        enhancedMode: true,
        omniChannelContext: context,
        conversationHistory: conversationHistory,
        systemInstruction:
          'Use accurate profile info. NO EXAGGERATION. Speak in first person naturally.',
      }),
    })

    if (!response.ok) throw new Error('Chat API error')

    const data = await response.json()
    return {
      response: this.cleanResponseForChannel(data.response || data.content, context.currentChannel),
      suggestions: [],
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
   * Load professional profile from MCP server
   */
  private async loadProfessionalProfile(): Promise<ProfessionalProfile> {
    // ACCURATE professional profile based on actual CV - NO EXAGGERATION
    return {
      personalInfo: {
        name: 'Sajal Basnet',
        title: 'Full-Stack Software Developer',
        expertise: [
          'Full-Stack Development',
          'AI Development',
          'React & JavaScript',
          'Python',
          'Cloud & DevOps',
          'Security',
        ],
        experience:
          'Masters in Software Development graduate from Swinburne University (GPA 3.688/4.0, Top 15%), based in Auburn, Sydney. Software Developer Intern at Aubot and former VR Developer at edgedVR. Currently focused on AI, development, security, and support with hands-on experience in React, Python, JavaScript, AWS, and building a digital twin portfolio with chat and voice features.',
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
