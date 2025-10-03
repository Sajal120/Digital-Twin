/**
 * Conversation Context Management
 * ==============================
 *
 * Enhanced contextual RAG system with advanced conversation history management,
 * improved follow-up handling, and sophisticated context awareness.
 *
 * Features:
 * - Persistent Conversation History
 * - Advanced Topic Modeling and Tracking
 * - Context-Enhanced Query Processing with Entity Recognition
 * - Intelligent Follow-up Question Recognition
 * - Multi-turn Conversation Understanding
 * - User Intent Tracking and Profiling
 * - Conversation Branching and Context Switching
 */

import OpenAI from 'openai'
import { parseAnalysisResponse, parseTopicsResponse, safeJsonParse } from './json-utils'

// Initialize OpenAI client (more reliable than Groq, no rate limits)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    interviewType?: string
    agenticDecision?: string
    topicsTouched?: string[]
    entities?: string[]
    intent?: string
    confidence?: number
    followUpTo?: string // ID of message this follows up on
    ragPattern?: string // RAG pattern used for this response
  }
}

export interface ConversationContext {
  sessionId: string
  messages: ConversationMessage[]
  topicsDiscussed: string[]
  entitiesTracked: Map<string, EntityInfo>
  interviewFocus: string
  userProfile?: {
    preferredResponseStyle?: 'concise' | 'detailed' | 'story-based'
    experienceLevel?: 'junior' | 'mid' | 'senior'
    industries?: string[]
    interests?: string[]
    questionPatterns?: string[]
  }
  conversationFlow: ConversationBranch[]
  lastInteractionTime: Date
  contextSummary?: string
  totalInteractions: number
  averageResponseTime?: number
}

export interface EntityInfo {
  name: string
  type: 'technology' | 'company' | 'project' | 'skill' | 'person' | 'concept'
  mentions: number
  lastMentioned: Date
  context: string[]
  confidence: number
}

export interface ConversationBranch {
  branchId: string
  startMessageId: string
  topic: string
  depth: number
  isActive: boolean
  subBranches?: string[]
}

export interface ContextEnhancedQuery {
  enhancedQuery: string
  originalQuery: string
  isFollowUp: boolean
  contextUsed: string
  entities: string[]
  intent: string
  confidence: number
  relevantHistory: ConversationMessage[]
  branchContext?: ConversationBranch
}

export class ConversationMemory {
  private contexts = new Map<string, ConversationContext>()
  private messageIndex = new Map<string, ConversationMessage>()

  /**
   * Initialize or retrieve conversation context with enhanced features
   */
  getOrCreateContext(sessionId: string, interviewType: string = 'general'): ConversationContext {
    if (!this.contexts.has(sessionId)) {
      this.contexts.set(sessionId, {
        sessionId,
        messages: [],
        topicsDiscussed: [],
        entitiesTracked: new Map(),
        interviewFocus: interviewType,
        conversationFlow: [],
        lastInteractionTime: new Date(),
        totalInteractions: 0,
      })
    }

    const context = this.contexts.get(sessionId)!
    context.lastInteractionTime = new Date()
    return context
  }

  /**
   * Add message with enhanced metadata and analysis
   */
  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: ConversationMessage['metadata'],
  ): Promise<string> {
    const context = this.getOrCreateContext(sessionId)
    const messageId = `${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Enhanced message analysis for user messages
    let enhancedMetadata = metadata || {}
    if (role === 'user') {
      const analysis = await this.analyzeUserMessage(content, context)
      enhancedMetadata = {
        ...enhancedMetadata,
        entities: analysis.entities,
        intent: analysis.intent,
        confidence: analysis.confidence,
        followUpTo: analysis.followUpTo,
      }
    }

    const message: ConversationMessage = {
      id: messageId,
      role,
      content,
      timestamp: new Date(),
      metadata: enhancedMetadata,
    }

    context.messages.push(message)
    this.messageIndex.set(messageId, message)
    context.totalInteractions++

    // Enhanced memory management
    if (context.messages.length > 50) {
      await this.compressConversationHistory(context)
    }

    // Update entities and topics
    if (role === 'user') {
      await this.updateEntitiesAndTopics(context, content, enhancedMetadata.entities || [])
      await this.updateConversationFlow(context, message)
    }

    // Update user profile based on interaction patterns
    await this.updateUserProfile(context, message)

    return messageId
  }

  /**
   * Advanced User Message Analysis
   * ==============================
   */
  private async analyzeUserMessage(
    message: string,
    context: ConversationContext,
  ): Promise<{
    entities: string[]
    intent: string
    confidence: number
    followUpTo?: string
  }> {
    if (!process.env.OPENAI_API_KEY) {
      return {
        entities: this.extractSimpleEntities(message),
        intent: this.classifySimpleIntent(message),
        confidence: 0.6,
      }
    }

    const recentMessages = context.messages
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')
    const recentTopics = context.topicsDiscussed.slice(-5).join(', ')

    const analysisPrompt = `
Analyze this user message in conversation context:

Message: "${message}"
Recent conversation:
${recentMessages}
Recent topics: ${recentTopics}

Extract:
1. Entities (technologies, companies, projects, skills, concepts mentioned)
2. Intent (what the user is trying to accomplish)
3. Follow-up detection (is this referencing a previous message?)

Return JSON:
{
  "entities": ["entity1", "entity2"],
  "intent": "ask_about_experience|request_details|seek_advice|general_inquiry|follow_up",
  "confidence": 85,
  "followUpTo": "message_id or null",
  "reasoning": "brief explanation"
}

Analysis:`

    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: analysisPrompt }],
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        max_tokens: 300,
      })

      const responseContent = completion.choices[0]?.message?.content?.trim()
      if (responseContent) {
        return parseAnalysisResponse(responseContent)
      }
    } catch (error) {
      console.error('Message analysis failed:', error)
    }

    // Fallback analysis
    return {
      entities: this.extractSimpleEntities(message),
      intent: this.classifySimpleIntent(message),
      confidence: 0.5,
    }
  }

  /**
   * Simple Entity Extraction (fallback)
   */
  private extractSimpleEntities(message: string): string[] {
    const techEntities = [
      'python',
      'java',
      'javascript',
      'react',
      'nextjs',
      'ai',
      'ml',
      'github',
      'api',
    ]
    const companyEntities = ['aubot', 'edgedvr', 'kimpton']
    const skillEntities = ['development', 'programming', 'web development', 'automation']

    const allEntities = [...techEntities, ...companyEntities, ...skillEntities]
    const messageLower = message.toLowerCase()

    return allEntities.filter((entity) => messageLower.includes(entity))
  }

  /**
   * Simple Intent Classification (fallback)
   */
  private classifySimpleIntent(message: string): string {
    const messageLower = message.toLowerCase()

    if (messageLower.includes('tell me about') || messageLower.includes('what is')) {
      return 'ask_about_experience'
    }
    if (
      messageLower.includes('more') ||
      messageLower.includes('detail') ||
      messageLower.includes('example')
    ) {
      return 'request_details'
    }
    if (
      messageLower.includes('how') ||
      messageLower.includes('advice') ||
      messageLower.includes('should')
    ) {
      return 'seek_advice'
    }
    if (
      messageLower.includes('that') ||
      messageLower.includes('it') ||
      messageLower.includes('this')
    ) {
      return 'follow_up'
    }

    return 'general_inquiry'
  }

  /**
   * Enhanced Entity and Topic Management
   */
  private async updateEntitiesAndTopics(
    context: ConversationContext,
    message: string,
    entities: string[],
  ): Promise<void> {
    // Update entity tracking
    for (const entity of entities) {
      const existing = context.entitiesTracked.get(entity.toLowerCase())
      if (existing) {
        existing.mentions++
        existing.lastMentioned = new Date()
        existing.context.push(message.slice(0, 100))
        if (existing.context.length > 5) {
          existing.context = existing.context.slice(-5)
        }
      } else {
        context.entitiesTracked.set(entity.toLowerCase(), {
          name: entity,
          type: this.classifyEntityType(entity),
          mentions: 1,
          lastMentioned: new Date(),
          context: [message.slice(0, 100)],
          confidence: 0.8,
        })
      }
    }

    // Enhanced topic extraction
    await this.updateTopicsDiscussed(context, message)
  }

  /**
   * Entity Type Classification
   */
  private classifyEntityType(entity: string): EntityInfo['type'] {
    const techKeywords = ['python', 'java', 'javascript', 'react', 'ai', 'ml', 'api', 'database']
    const companyKeywords = ['aubot', 'edgedvr', 'kimpton', 'microsoft', 'google']
    const projectKeywords = ['portfolio', 'chatbot', 'website', 'application', 'system']
    const skillKeywords = ['development', 'programming', 'automation', 'analysis']

    const entityLower = entity.toLowerCase()

    if (techKeywords.some((keyword) => entityLower.includes(keyword))) return 'technology'
    if (companyKeywords.some((keyword) => entityLower.includes(keyword))) return 'company'
    if (projectKeywords.some((keyword) => entityLower.includes(keyword))) return 'project'
    if (skillKeywords.some((keyword) => entityLower.includes(keyword))) return 'skill'

    return 'concept'
  }

  /**
   * Enhanced Topic Extraction with LLM
   */
  private async updateTopicsDiscussed(
    context: ConversationContext,
    message: string,
  ): Promise<void> {
    if (!process.env.OPENAI_API_KEY) {
      // Fallback topic extraction
      const simpleTopics = this.extractSimpleEntities(message)
      simpleTopics.forEach((topic) => {
        if (!context.topicsDiscussed.includes(topic)) {
          context.topicsDiscussed.push(topic)
        }
      })
      return
    }

    try {
      const topicPrompt = `
Extract professional topics from this message:

Message: "${message}"
Previous topics: ${context.topicsDiscussed.slice(-10).join(', ')}

Focus on:
- Technical skills and technologies
- Professional experiences and roles
- Projects and achievements
- Companies and organizations
- Career-related concepts

Return only NEW topics not in previous topics list.
Format as JSON array: ["topic1", "topic2"]
Maximum 3 most important new topics.

Topics:`

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: topicPrompt }],
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        max_tokens: 150,
      })

      const responseContent = completion.choices[0]?.message?.content?.trim()
      if (responseContent) {
        const newTopics = parseTopicsResponse(responseContent)

        newTopics.forEach((topic) => {
          if (
            !context.topicsDiscussed.some(
              (existing) =>
                existing.toLowerCase().includes(topic.toLowerCase()) ||
                topic.toLowerCase().includes(existing.toLowerCase()),
            )
          ) {
            context.topicsDiscussed.push(topic)
          }
        })

        // Keep only last 20 topics for memory efficiency
        if (context.topicsDiscussed.length > 20) {
          context.topicsDiscussed = context.topicsDiscussed.slice(-20)
        }
      }
    } catch (error) {
      console.error('Enhanced topic extraction failed:', error)
    }
  }

  /**
   * Conversation Flow Management
   */
  private async updateConversationFlow(
    context: ConversationContext,
    message: ConversationMessage,
  ): Promise<void> {
    // Detect topic changes and create branches
    const currentBranch = context.conversationFlow.find((branch) => branch.isActive)

    if (!currentBranch) {
      // Start new branch
      const newBranch: ConversationBranch = {
        branchId: `branch-${Date.now()}`,
        startMessageId: message.id,
        topic: message.metadata?.entities?.[0] || 'general',
        depth: 0,
        isActive: true,
      }
      context.conversationFlow.push(newBranch)
    } else {
      // Check if we're switching topics significantly
      const topicChange = await this.detectTopicChange(context, message)
      if (topicChange.isNewTopic) {
        // Deactivate current branch and start new one
        currentBranch.isActive = false
        const newBranch: ConversationBranch = {
          branchId: `branch-${Date.now()}`,
          startMessageId: message.id,
          topic: topicChange.newTopic,
          depth: currentBranch.depth + 1,
          isActive: true,
        }
        context.conversationFlow.push(newBranch)
      }
    }
  }

  /**
   * Topic Change Detection
   */
  private async detectTopicChange(
    context: ConversationContext,
    message: ConversationMessage,
  ): Promise<{ isNewTopic: boolean; newTopic: string; confidence: number }> {
    const recentMessages = context.messages.slice(-3)
    const currentTopics = recentMessages.map((m) => m.metadata?.entities || []).flat()
    const newTopics = message.metadata?.entities || []

    // Simple heuristic: if less than 25% overlap, it's a new topic
    const overlap = newTopics.filter((topic) => currentTopics.includes(topic)).length
    const overlapRatio = newTopics.length > 0 ? overlap / newTopics.length : 0

    const isNewTopic = overlapRatio < 0.25 && newTopics.length > 0
    const newTopic = newTopics[0] || 'general'

    return {
      isNewTopic,
      newTopic,
      confidence: isNewTopic ? 0.8 : 0.3,
    }
  }

  /**
   * User Profile Learning
   */
  private async updateUserProfile(
    context: ConversationContext,
    message: ConversationMessage,
  ): Promise<void> {
    if (!context.userProfile) {
      context.userProfile = {}
    }

    if (message.role === 'user') {
      // Analyze question patterns
      if (!context.userProfile.questionPatterns) {
        context.userProfile.questionPatterns = []
      }

      const messageType = this.classifyMessageType(message.content)
      context.userProfile.questionPatterns.push(messageType)

      // Keep only last 10 patterns
      if (context.userProfile.questionPatterns.length > 10) {
        context.userProfile.questionPatterns = context.userProfile.questionPatterns.slice(-10)
      }

      // Infer preferred response style
      if (message.content.includes('detail') || message.content.includes('comprehensive')) {
        context.userProfile.preferredResponseStyle = 'detailed'
      } else if (message.content.includes('brief') || message.content.includes('quick')) {
        context.userProfile.preferredResponseStyle = 'concise'
      } else if (message.content.includes('example') || message.content.includes('story')) {
        context.userProfile.preferredResponseStyle = 'story-based'
      }

      // Track interests based on entities
      const entities = message.metadata?.entities || []
      if (!context.userProfile.interests) {
        context.userProfile.interests = []
      }
      entities.forEach((entity) => {
        if (!context.userProfile!.interests!.includes(entity)) {
          context.userProfile!.interests!.push(entity)
        }
      })
    }
  }

  /**
   * Message Type Classification
   */
  private classifyMessageType(content: string): string {
    const contentLower = content.toLowerCase()

    if (contentLower.startsWith('what') || contentLower.startsWith('tell me'))
      return 'information_request'
    if (contentLower.startsWith('how') || contentLower.startsWith('can you'))
      return 'how_to_question'
    if (contentLower.includes('example') || contentLower.includes('instance'))
      return 'example_request'
    if (contentLower.includes('more') || contentLower.includes('elaborate')) return 'follow_up'
    if (contentLower.includes('compare') || contentLower.includes('versus')) return 'comparison'

    return 'general_question'
  }

  /**
   * Conversation History Compression
   */
  private async compressConversationHistory(context: ConversationContext): Promise<void> {
    if (!process.env.OPENAI_API_KEY) {
      // Simple compression: keep recent messages and important ones
      const importantMessages = context.messages
        .filter((m) => m.metadata?.confidence && m.metadata.confidence > 0.8)
        .slice(-5)
      const recentMessages = context.messages.slice(-20)

      context.messages = [...importantMessages, ...recentMessages]
        .filter((message, index, array) => array.findIndex((m) => m.id === message.id) === index)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

      return
    }

    try {
      const oldMessages = context.messages.slice(0, -20)
      const messageHistory = oldMessages.map((m) => `${m.role}: ${m.content}`).join('\n')

      const compressionPrompt = `
Summarize this conversation history into key points:

Conversation:
${messageHistory}

Create a concise summary covering:
- Main topics discussed
- Key information shared
- User's interests and question patterns
- Important context for future reference

Summary:`

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: compressionPrompt }],
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        max_tokens: 300,
      })

      const summary = completion.choices[0]?.message?.content?.trim()
      if (summary) {
        context.contextSummary = summary
        // Keep only recent messages
        context.messages = context.messages.slice(-20)
      }
    } catch (error) {
      console.error('Conversation compression failed:', error)
    }
  }

  /**
   * Enhanced Query Enhancement with Context
   */
  async enhanceQueryWithContext(
    sessionId: string,
    currentQuery: string,
  ): Promise<ContextEnhancedQuery> {
    const context = this.contexts.get(sessionId)

    if (!context || context.messages.length === 0) {
      return {
        enhancedQuery: currentQuery,
        originalQuery: currentQuery,
        isFollowUp: false,
        contextUsed: 'No context available',
        entities: [],
        intent: 'general_inquiry',
        confidence: 0.5,
        relevantHistory: [],
      }
    }

    // Get relevant conversation history
    const relevantHistory = await this.getRelevantHistory(context, currentQuery)
    const currentBranch = context.conversationFlow.find((branch) => branch.isActive)

    if (!process.env.OPENAI_API_KEY) {
      return this.enhanceQuerySimple(currentQuery, context, relevantHistory, currentBranch)
    }

    try {
      const entityContext = Array.from(context.entitiesTracked.entries())
        .map(([name, info]) => `${name} (${info.type}, ${info.mentions} mentions)`)
        .slice(-10)
        .join(', ')

      const contextPrompt = `
Enhance this query using rich conversation context:

Current query: "${currentQuery}"
Conversation summary: ${context.contextSummary || 'No summary available'}
Recent relevant messages: ${relevantHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}
Active entities: ${entityContext}
Current topic branch: ${currentBranch?.topic || 'none'}
User interests: ${context.userProfile?.interests?.join(', ') || 'unknown'}

Analyze and enhance:
1. Is this a follow-up question with implicit references?
2. What entities and context should be included?
3. What's the user's intent?
4. How can we make the query more specific for better search?

Return JSON:
{
  "enhancedQuery": "enhanced search query with context",
  "isFollowUp": true/false,
  "contextUsed": "description of context applied",
  "entities": ["entity1", "entity2"],
  "intent": "intent_classification",
  "confidence": 85
}

Enhancement:`

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: contextPrompt }],
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        max_tokens: 400,
      })

      const responseContent = completion.choices[0]?.message?.content?.trim()

      if (responseContent) {
        const result = safeJsonParse(responseContent, {
          enhancedQuery: currentQuery,
          isFollowUp: false,
          contextUsed: 'Context analysis applied',
          entities: [],
          intent: 'general_inquiry',
          confidence: 70,
        })

        return {
          enhancedQuery: result.data?.enhancedQuery || currentQuery,
          originalQuery: currentQuery,
          isFollowUp: result.data?.isFollowUp || false,
          contextUsed: result.data?.contextUsed || 'Context analysis applied',
          entities: result.data?.entities || [],
          intent: result.data?.intent || 'general_inquiry',
          confidence: (result.data?.confidence || 70) / 100,
          relevantHistory,
          branchContext: currentBranch,
        }
      }
    } catch (error) {
      console.error('Enhanced context query failed:', error)
    }

    // Fallback enhancement
    return this.enhanceQuerySimple(currentQuery, context, relevantHistory, currentBranch)
  }

  /**
   * Simple Query Enhancement (fallback)
   */
  private enhanceQuerySimple(
    currentQuery: string,
    context: ConversationContext,
    relevantHistory: ConversationMessage[],
    currentBranch?: ConversationBranch,
  ): ContextEnhancedQuery {
    const hasFollowUpIndicators =
      /\b(that|this|it|them|more|continue|elaborate|expand|detail)\b/i.test(currentQuery)

    if (hasFollowUpIndicators && context.topicsDiscussed.length > 0) {
      const recentTopic = context.topicsDiscussed[context.topicsDiscussed.length - 1]
      return {
        enhancedQuery: `${currentQuery} ${recentTopic}`,
        originalQuery: currentQuery,
        isFollowUp: true,
        contextUsed: `Added recent topic: ${recentTopic}`,
        entities: [recentTopic],
        intent: 'follow_up',
        confidence: 0.7,
        relevantHistory,
        branchContext: currentBranch,
      }
    }

    return {
      enhancedQuery: currentQuery,
      originalQuery: currentQuery,
      isFollowUp: false,
      contextUsed: 'No enhancement needed',
      entities: [],
      intent: 'general_inquiry',
      confidence: 0.6,
      relevantHistory,
      branchContext: currentBranch,
    }
  }

  /**
   * Get Relevant Conversation History
   */
  private async getRelevantHistory(
    context: ConversationContext,
    currentQuery: string,
  ): Promise<ConversationMessage[]> {
    const entities = this.extractSimpleEntities(currentQuery)
    const relevantMessages: ConversationMessage[] = []

    // Get messages that mention similar entities
    for (const message of context.messages.slice(-10)) {
      const messageEntities = message.metadata?.entities || []
      const hasOverlap = entities.some((entity) =>
        messageEntities.some(
          (msgEntity) =>
            msgEntity.toLowerCase().includes(entity.toLowerCase()) ||
            entity.toLowerCase().includes(msgEntity.toLowerCase()),
        ),
      )

      if (hasOverlap) {
        relevantMessages.push(message)
      }
    }

    // If no relevant messages found, return recent messages
    if (relevantMessages.length === 0) {
      return context.messages.slice(-4)
    }

    return relevantMessages.slice(-6) // Return up to 6 relevant messages
  }

  /**
   * Get Enhanced Conversation Summary
   */
  async getContextSummary(sessionId: string): Promise<string> {
    const context = this.contexts.get(sessionId)
    if (!context || context.messages.length === 0) {
      return 'No conversation history'
    }

    if (context.contextSummary) {
      return context.contextSummary
    }

    if (!process.env.OPENAI_API_KEY) {
      const topicsSummary = `Topics discussed: ${context.topicsDiscussed.slice(-5).join(', ')}`
      const entitiesSummary = `Key entities: ${Array.from(context.entitiesTracked.keys()).slice(-5).join(', ')}`
      return `${topicsSummary}\n${entitiesSummary}`
    }

    try {
      const recentMessages = context.messages.slice(-8)
      const messageHistory = recentMessages.map((msg) => `${msg.role}: ${msg.content}`).join('\n')
      const topEntities = Array.from(context.entitiesTracked.entries())
        .sort(([, a], [, b]) => b.mentions - a.mentions)
        .slice(0, 8)
        .map(([name, info]) => `${name} (${info.mentions} mentions)`)
        .join(', ')

      const summaryPrompt = `
Create a comprehensive conversation summary:

Recent conversation:
${messageHistory}

Topics discussed: ${context.topicsDiscussed.join(', ')}
Key entities tracked: ${topEntities}
Interview focus: ${context.interviewFocus}
Total interactions: ${context.totalInteractions}
User interests: ${context.userProfile?.interests?.join(', ') || 'unknown'}

Provide a detailed 3-4 sentence summary focusing on:
- What aspects of Sajal's background have been explored
- User's primary interests and question patterns
- Key themes and areas of focus
- Conversation flow and progression

Summary:`

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: summaryPrompt }],
        model: 'gpt-3.5-turbo',
        temperature: 0.4,
        max_tokens: 250,
      })

      const summary = completion.choices[0]?.message?.content?.trim()

      if (summary) {
        context.contextSummary = summary
        return summary
      }
    } catch (error) {
      console.error('Enhanced context summary generation failed:', error)
    }

    // Enhanced fallback summary
    const recentTopics = context.topicsDiscussed.slice(-5)
    const topEntities = Array.from(context.entitiesTracked.entries())
      .sort(([, a], [, b]) => b.mentions - a.mentions)
      .slice(0, 3)
      .map(([name]) => name)

    return `Conversation in ${context.interviewFocus} context focusing on: ${recentTopics.join(', ')}. Key areas: ${topEntities.join(', ')}. ${context.totalInteractions} interactions total.`
  }

  /**
   * Clean up old conversations with enhanced criteria
   */
  cleanupOldConversations(maxAgeHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)

    for (const [sessionId, context] of this.contexts.entries()) {
      if (context.lastInteractionTime < cutoffTime) {
        // Clean up message index entries
        context.messages.forEach((message) => {
          this.messageIndex.delete(message.id)
        })

        this.contexts.delete(sessionId)
        console.log(`🧹 Cleaned up conversation session: ${sessionId}`)
      }
    }
  }

  /**
   * Enhanced Conversation Statistics
   */
  getStats(): {
    activeConversations: number
    totalMessages: number
    averageMessagesPerConversation: number
    topTopics: string[]
    topEntities: Array<{ name: string; mentions: number; type: string }>
    conversationBranches: number
    userProfiles: number
    averageSessionLength: number
  } {
    const conversations = Array.from(this.contexts.values())
    const totalMessages = conversations.reduce((sum, ctx) => sum + ctx.messages.length, 0)

    // Aggregate entity statistics
    const globalEntities = new Map<string, { mentions: number; type: string }>()
    conversations.forEach((ctx) => {
      ctx.entitiesTracked.forEach((entity, name) => {
        if (globalEntities.has(name)) {
          globalEntities.get(name)!.mentions += entity.mentions
        } else {
          globalEntities.set(name, { mentions: entity.mentions, type: entity.type })
        }
      })
    })

    const topEntities = Array.from(globalEntities.entries())
      .sort(([, a], [, b]) => b.mentions - a.mentions)
      .slice(0, 10)
      .map(([name, info]) => ({ name, mentions: info.mentions, type: info.type }))

    // Topic frequency
    const topicCounts = new Map<string, number>()
    conversations.forEach((ctx) => {
      ctx.topicsDiscussed.forEach((topic) => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      })
    })

    const topTopics = Array.from(topicCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([topic]) => topic)

    // Calculate average session length
    const sessionLengths = conversations
      .filter((ctx) => ctx.messages.length > 1)
      .map((ctx) => {
        const firstMessage = ctx.messages[0]
        const lastMessage = ctx.messages[ctx.messages.length - 1]
        return lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime()
      })

    const averageSessionLength =
      sessionLengths.length > 0
        ? sessionLengths.reduce((sum, length) => sum + length, 0) /
          sessionLengths.length /
          1000 /
          60 // in minutes
        : 0

    return {
      activeConversations: conversations.length,
      totalMessages,
      averageMessagesPerConversation:
        conversations.length > 0 ? totalMessages / conversations.length : 0,
      topTopics,
      topEntities,
      conversationBranches: conversations.reduce(
        (sum, ctx) => sum + ctx.conversationFlow.length,
        0,
      ),
      userProfiles: conversations.filter((ctx) => ctx.userProfile).length,
      averageSessionLength,
    }
  }

  /**
   * Get Message by ID
   */
  getMessage(messageId: string): ConversationMessage | undefined {
    return this.messageIndex.get(messageId)
  }

  /**
   * Get Context by Session ID
   */
  getContext(sessionId: string): ConversationContext | undefined {
    return this.contexts.get(sessionId)
  }
}

// Global enhanced conversation memory instance
export const conversationMemory = new ConversationMemory()
