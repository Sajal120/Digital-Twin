/**
 * Conversation Context Management
 * ==============================
 *
 * Phase 1 Enhancement: Track conversation history and maintain context
 * for natural follow-up questions and improved user experience.
 *
 * Features:
 * - Conversation History Tracking
 * - Topic Extraction and Memory
 * - Context-Enhanced Query Processing
 * - Follow-up Question Recognition
 */

import Groq from 'groq-sdk'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    interviewType?: string
    agenticDecision?: string
    topicsTouched?: string[]
  }
}

export interface ConversationContext {
  sessionId: string
  messages: ConversationMessage[]
  topicsDiscussed: string[]
  interviewFocus: string
  userProfile?: {
    preferredResponseStyle?: 'concise' | 'detailed' | 'story-based'
    experienceLevel?: 'junior' | 'mid' | 'senior'
    industries?: string[]
  }
  lastInteractionTime: Date
  contextSummary?: string
}

export class ConversationMemory {
  private contexts = new Map<string, ConversationContext>()

  /**
   * Initialize or retrieve conversation context
   */
  getOrCreateContext(sessionId: string, interviewType: string = 'general'): ConversationContext {
    if (!this.contexts.has(sessionId)) {
      this.contexts.set(sessionId, {
        sessionId,
        messages: [],
        topicsDiscussed: [],
        interviewFocus: interviewType,
        lastInteractionTime: new Date(),
      })
    }

    const context = this.contexts.get(sessionId)!
    context.lastInteractionTime = new Date()
    return context
  }

  /**
   * Add message to conversation context
   */
  addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: ConversationMessage['metadata'],
  ): void {
    const context = this.getOrCreateContext(sessionId)

    const message: ConversationMessage = {
      role,
      content,
      timestamp: new Date(),
      metadata,
    }

    context.messages.push(message)

    // Keep only last 20 messages for memory efficiency
    if (context.messages.length > 20) {
      context.messages = context.messages.slice(-20)
    }

    // Update topics discussed if it's a user message
    if (role === 'user') {
      this.updateTopicsDiscussed(context, content)
    }
  }

  /**
   * Extract and update topics from user messages
   */
  private async updateTopicsDiscussed(
    context: ConversationContext,
    message: string,
  ): Promise<void> {
    if (!process.env.GROQ_API_KEY) return

    try {
      const topicPrompt = `
Analyze this user message and extract the main topics/subjects being discussed:

Message: "${message}"
Previous topics: ${context.topicsDiscussed.join(', ')}

Extract key topics (professional skills, technologies, experiences, projects, etc.) mentioned.
Return only new topics not already in the previous topics list.
Format as a JSON array: ["topic1", "topic2", "topic3"]
Limit to maximum 3 most important new topics.

Topics:`

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: topicPrompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 100,
      })

      const responseContent = completion.choices[0]?.message?.content?.trim()
      if (responseContent) {
        const newTopics = JSON.parse(responseContent)
        if (Array.isArray(newTopics)) {
          // Add new topics, avoiding duplicates
          newTopics.forEach((topic) => {
            if (
              typeof topic === 'string' &&
              !context.topicsDiscussed.some(
                (existing) =>
                  existing.toLowerCase().includes(topic.toLowerCase()) ||
                  topic.toLowerCase().includes(existing.toLowerCase()),
              )
            ) {
              context.topicsDiscussed.push(topic)
            }
          })

          // Keep only last 15 topics for memory efficiency
          if (context.topicsDiscussed.length > 15) {
            context.topicsDiscussed = context.topicsDiscussed.slice(-15)
          }
        }
      }
    } catch (error) {
      console.error('Topic extraction failed:', error)
    }
  }

  /**
   * Get conversation context summary
   */
  async getContextSummary(sessionId: string): Promise<string> {
    const context = this.contexts.get(sessionId)
    if (!context || context.messages.length === 0) {
      return 'No conversation history'
    }

    if (!process.env.GROQ_API_KEY) {
      return `Topics discussed: ${context.topicsDiscussed.join(', ')}`
    }

    try {
      const recentMessages = context.messages.slice(-6) // Last 3 exchanges
      const messageHistory = recentMessages.map((msg) => `${msg.role}: ${msg.content}`).join('\n')

      const summaryPrompt = `
Summarize this conversation context for an interview preparation assistant:

Recent conversation:
${messageHistory}

Topics discussed: ${context.topicsDiscussed.join(', ')}
Interview focus: ${context.interviewFocus}

Provide a brief 2-3 sentence summary focusing on:
- What aspects of Sajal's background have been discussed
- What the user is trying to learn or prepare for
- Key themes or areas of interest

Summary:`

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: summaryPrompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.4,
        max_tokens: 150,
      })

      const summary = completion.choices[0]?.message?.content?.trim()

      if (summary) {
        context.contextSummary = summary
        return summary
      }
    } catch (error) {
      console.error('Context summary generation failed:', error)
    }

    // Fallback summary
    return `Discussing ${context.topicsDiscussed.slice(-3).join(', ')} in ${context.interviewFocus} context`
  }

  /**
   * Enhanced query with conversation context
   */
  async enhanceQueryWithContext(
    sessionId: string,
    currentQuery: string,
  ): Promise<{ enhancedQuery: string; isFollowUp: boolean; contextUsed: string }> {
    const context = this.contexts.get(sessionId)

    if (!context || context.messages.length === 0 || !process.env.GROQ_API_KEY) {
      return {
        enhancedQuery: currentQuery,
        isFollowUp: false,
        contextUsed: 'No context available',
      }
    }

    try {
      const recentMessages = context.messages.slice(-4) // Last 2 exchanges
      const contextSummary = await this.getContextSummary(sessionId)

      const contextPrompt = `
You are enhancing a search query using conversation context.

Current question: "${currentQuery}"
Conversation summary: ${contextSummary}
Recent messages: ${recentMessages.map((m) => `${m.role}: ${m.content}`).join('\n')}
Topics discussed: ${context.topicsDiscussed.join(', ')}

Analyze if this is a follow-up question that references previous conversation.

If it's a follow-up (contains references like "that project", "more about", "tell me about it", etc.):
- Enhance the query by adding specific context from previous discussion
- Make implicit references explicit

If it's a new topic:
- Keep the original query but consider adding related context from topics discussed

Return JSON:
{
  "enhancedQuery": "the enhanced search query",
  "isFollowUp": true/false,
  "contextUsed": "brief description of context applied"
}

Response:`

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: contextPrompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 200,
      })

      const responseContent = completion.choices[0]?.message?.content?.trim()

      if (responseContent) {
        const result = JSON.parse(responseContent)

        return {
          enhancedQuery: result.enhancedQuery || currentQuery,
          isFollowUp: result.isFollowUp || false,
          contextUsed: result.contextUsed || 'Context analysis applied',
        }
      }
    } catch (error) {
      console.error('Context-enhanced query failed:', error)
    }

    // Fallback: basic context enhancement
    const hasFollowUpIndicators = /\b(that|this|it|them|more|continue|elaborate|expand)\b/i.test(
      currentQuery,
    )

    if (hasFollowUpIndicators && context.topicsDiscussed.length > 0) {
      const recentTopic = context.topicsDiscussed[context.topicsDiscussed.length - 1]
      return {
        enhancedQuery: `${currentQuery} ${recentTopic}`,
        isFollowUp: true,
        contextUsed: `Added recent topic: ${recentTopic}`,
      }
    }

    return {
      enhancedQuery: currentQuery,
      isFollowUp: false,
      contextUsed: 'No context enhancement needed',
    }
  }

  /**
   * Clean up old conversations (call periodically)
   */
  cleanupOldConversations(maxAgeHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)

    for (const [sessionId, context] of this.contexts.entries()) {
      if (context.lastInteractionTime < cutoffTime) {
        this.contexts.delete(sessionId)
      }
    }
  }

  /**
   * Get conversation statistics
   */
  getStats(): {
    activeConversations: number
    totalMessages: number
    averageMessagesPerConversation: number
    topTopics: string[]
  } {
    const conversations = Array.from(this.contexts.values())
    const totalMessages = conversations.reduce((sum, ctx) => sum + ctx.messages.length, 0)

    // Count topic frequency
    const topicCounts = new Map<string, number>()
    conversations.forEach((ctx) => {
      ctx.topicsDiscussed.forEach((topic) => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      })
    })

    const topTopics = Array.from(topicCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic]) => topic)

    return {
      activeConversations: conversations.length,
      totalMessages,
      averageMessagesPerConversation:
        conversations.length > 0 ? totalMessages / conversations.length : 0,
      topTopics,
    }
  }
}

// Global conversation memory instance
export const conversationMemory = new ConversationMemory()
