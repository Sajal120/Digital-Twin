/**
 * LLM-Enhanced RAG System
 * =====================
 *
 * Advanced RAG optimization    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: formattingPrompt }],
      model: 'llama-3.1-8b-instant', // Updated to available model
      temperature: 0.7, // Higher creativity for natural responses
      max_tokens: 150, // Reduced for more concise responses
    })LLM-powered query preprocessing and response post-processing
 * for dramatically improved interview preparation experiences.
 *
 * Features:
 * - Query Enhancement: Transforms user questions into better search queries
 * - Interview Formatting: Converts RAG results into compelling interview responses
 * - Context-Aware Processing: Adapts responses based on interview type
 * - Performance Monitoring: Tracks processing times and token usage
 */

import Groq from 'groq-sdk'
import { conversationMemory, type ConversationMessage } from './conversation-context'
import { ragAnalytics, type RAGPerformanceMetrics } from './rag-analytics'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export interface RAGMetrics {
  queryEnhancementTime: number
  vectorSearchTime: number
  responseFormattingTime: number
  totalTime: number
  tokensUsed?: number
  cacheHitRate?: number
}

export interface VectorResult {
  score: number
  data?: string
  metadata?: Record<string, any>
}

export interface EnhancedRAGResult {
  response: string
  metadata: {
    originalQuery: string
    enhancedQuery: string
    resultsFound: number
    interviewContext?: string
    agenticDecision?: AgenticDecision
    conversationContext?: string
    queryId?: string
  }
  metrics?: RAGMetrics
}

/**
 * Enhanced Query Preprocessing
 * ===========================
 *
 * Transforms user questions into optimized search queries for better vector retrieval.
 *
 * Benefits:
 * - Intent Understanding: Interprets vague questions into specific searches
 * - Context Expansion: Adds relevant synonyms and related terms
 * - Domain Adaptation: Converts generic questions into interview-specific searches
 * - Synonym Enhancement: Expands technical terms to improve matching
 */
export async function enhanceQuery(originalQuery: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    console.warn('Groq API key not configured, returning original query')
    return originalQuery
  }

  const enhancementPrompt = `
You are an interview preparation assistant that improves search queries to find relevant professional information.

Original question: "${originalQuery}"

Transform this into a comprehensive search query that will find relevant professional background data by:
- Adding relevant synonyms and related terms
- Expanding context for interview scenarios  
- Including technical and soft skill variations
- Focusing on achievements and quantifiable results
- Adding industry-specific keywords
- Including experience-related terms

Examples of transformations:
- "What should I highlight?" → "technical achievements, leadership examples, quantified results, key accomplishments, project successes, impact metrics"
- "Tell me about projects" → "software development projects, technical achievements, leadership roles, problem-solving examples, measurable outcomes, project management, team collaboration"
- "My React experience" → "React development, JavaScript frameworks, frontend development, component architecture, state management, performance optimization, web applications"

Return only the enhanced search query (no explanation):
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: enhancementPrompt }],
      model: 'llama-3.1-8b-instant', // Fast model for query enhancement
      temperature: 0.3, // Lower temperature for consistent enhancement
      max_tokens: 150,
    })

    const enhancedQuery = completion.choices[0]?.message?.content?.trim()

    if (!enhancedQuery) {
      console.warn('No enhanced query received from Groq, using original')
      return originalQuery
    }

    console.log(`Query enhanced: "${originalQuery}" → "${enhancedQuery}"`)
    return enhancedQuery
  } catch (error) {
    console.error('Query enhancement failed:', error)
    return originalQuery // Fallback to original query
  }
}

/**
 * Interview-Ready Response Formatting
 * ===================================
 *
 * Transforms raw RAG results into compelling, interview-ready responses.
 *
 * Benefits:
 * - Interview Focus: Structures responses for interview context
 * - STAR Format: Applies Situation-Task-Action-Result methodology
 * - Confidence Building: Adds interview coaching and presentation tips
 * - Personalization: Tailors responses to job requirements
 */
export async function formatForInterview(
  ragResults: VectorResult[],
  originalQuestion: string,
  interviewContext?: string,
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    console.warn('Groq API key not configured, returning basic RAG results')
    return ragResults
      .map(
        (result) =>
          result.data ||
          result.metadata?.content ||
          result.metadata?.title ||
          'No relevant information found',
      )
      .join('\n\n')
  }

  // Extract context from RAG results
  const context = ragResults
    .map((result) => {
      // Try different fields for content
      return (
        result.data ||
        result.metadata?.content ||
        result.metadata?.description ||
        result.metadata?.title ||
        'No content available'
      )
    })
    .filter((content) => content && content !== 'No content available')
    .join('\n\n')

  if (!context) {
    return "I don't have specific information about that topic in my knowledge base. Could you ask about something more specific, like my technical skills, projects, or work experience?"
  }

  const contextualPrompt = interviewContext
    ? `You are preparing someone for a ${interviewContext} interview.`
    : 'You are an expert interview coach preparing someone for a professional interview.'

  const formattingPrompt = `
${contextualPrompt}

Question: "${originalQuestion}"

Professional Background Data:
${context}

IMPORTANT: Only reference accurate information from the provided data. Sajal's key strengths and experience include:
- AI and Machine Learning projects (AI Digital Twin, RAG systems, conversational AI) - PRIMARY FOCUS
- Full-stack development with modern technologies (React, Next.js, Python, JavaScript)
- AI-powered portfolio chatbot (current major project showcasing technical skills)
- Software Developer Intern at Aubot (brief 4-month experience, minimal emphasis)
- Web development contract work with performance optimization
- Personal projects demonstrating AI/ML capabilities and innovation

PRIORITIZE AI/ML expertise, full-stack development skills, and innovative project work. The AI Digital Twin and chatbot projects demonstrate more technical depth than the internship.

IMPORTANT: Do NOT mention "RASSURE" or any specific company names unless they are explicitly mentioned in the provided data (like Aubot, edgedVR, Kimpton). Keep responses generic and applicable to any software development role.

Create a natural, conversational response that:
- Directly answers the specific question asked
- Keeps response under 100 words (1-2 paragraphs maximum)  
- Uses conversational, friendly tone like talking to a colleague
- Includes 1-2 specific examples with concrete details and numbers
- Prioritizes AI/ML projects, chatbot development, and innovative technical work
- Highlights full-stack development and modern technology skills
- Mentions only real companies, technologies, and experiences from the data
- Avoids repetitive information and generic statements
- Sounds like Sajal speaking naturally in first person
- Focuses on technical innovation and AI expertise rather than basic internship tasks
- Emphasizes project ownership and technical leadership

Format as a natural conversation response, not a formal presentation.

Response:
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: formattingPrompt }],
      model: 'llama-3.1-8b-instant', // Updated to available model
      temperature: 0.7, // Higher creativity for natural responses
      max_tokens: 150, // Reduced for more concise responses
    })

    const formattedResponse = completion.choices[0]?.message?.content?.trim()

    if (!formattedResponse) {
      console.warn('No formatted response received from Groq, using raw context')
      return context
    }

    console.log('Response formatted for interview context')
    return formattedResponse
  } catch (error) {
    console.error('Response formatting failed:', error)
    return context // Fallback to raw RAG results
  }
}

/**
 * Complete Enhanced RAG Pipeline
 * ==============================
 *
 * Combines query enhancement, vector search, and response formatting
 * with performance monitoring.
 */
export async function enhancedRAGQuery(
  userQuestion: string,
  vectorSearchFunction: (query: string) => Promise<VectorResult[]>,
  interviewContext?: string,
): Promise<EnhancedRAGResult> {
  const startTime = Date.now()
  const metrics: Partial<RAGMetrics> = {}

  try {
    // Step 1: Enhance the query
    console.log('🔍 Enhancing query for better search...')
    const enhanceStart = Date.now()
    const enhancedQuery = await enhanceQuery(userQuestion)
    metrics.queryEnhancementTime = Date.now() - enhanceStart

    // Step 2: Perform vector search with enhanced query
    console.log('🔎 Searching vector database...')
    const searchStart = Date.now()
    const vectorResults = await vectorSearchFunction(enhancedQuery)
    metrics.vectorSearchTime = Date.now() - searchStart

    // Step 3: Format results for interview context
    console.log('✨ Formatting response for interview...')
    const formatStart = Date.now()
    const interviewResponse = await formatForInterview(
      vectorResults,
      userQuestion,
      interviewContext,
    )
    metrics.responseFormattingTime = Date.now() - formatStart

    metrics.totalTime = Date.now() - startTime

    // Log performance metrics
    console.log('📊 Enhanced RAG Performance:', {
      queryEnhancement: `${metrics.queryEnhancementTime}ms`,
      vectorSearch: `${metrics.vectorSearchTime}ms`,
      responseFormatting: `${metrics.responseFormattingTime}ms`,
      total: `${metrics.totalTime}ms`,
    })

    return {
      response: interviewResponse,
      metadata: {
        originalQuery: userQuestion,
        enhancedQuery: enhancedQuery,
        resultsFound: vectorResults.length,
        interviewContext: interviewContext,
      },
      metrics: metrics as RAGMetrics,
    }
  } catch (error) {
    console.error('Enhanced RAG pipeline failed:', error)

    // Fallback: perform basic search with original query
    const vectorResults = await vectorSearchFunction(userQuestion)
    const basicResponse = vectorResults
      .map((result) => result.data || result.metadata?.content || 'No content')
      .join('\n\n')

    return {
      response:
        basicResponse ||
        "I'm having trouble processing that request right now. Could you try rephrasing your question?",
      metadata: {
        originalQuery: userQuestion,
        enhancedQuery: userQuestion,
        resultsFound: vectorResults.length,
        interviewContext: 'basic-fallback',
      },
      metrics: {
        queryEnhancementTime: 0,
        vectorSearchTime: Date.now() - startTime,
        responseFormattingTime: 0,
        totalTime: Date.now() - startTime,
      },
    }
  }
}

/**
 * Interview Context Configurations
 * ===============================
 *
 * Different configurations for various interview scenarios
 */
export const INTERVIEW_CONTEXTS = {
  technical: {
    name: 'Technical Interview',
    focusAreas: ['technical skills', 'problem solving', 'architecture', 'code quality'],
    responseStyle: 'detailed technical examples with metrics',
    temperature: 0.3,
  },

  behavioral: {
    name: 'Behavioral Interview',
    focusAreas: ['leadership', 'teamwork', 'communication', 'conflict resolution'],
    responseStyle: 'STAR format stories with emotional intelligence',
    temperature: 0.7,
  },

  executive: {
    name: 'Executive Interview',
    focusAreas: ['strategic thinking', 'business impact', 'vision', 'leadership'],
    responseStyle: 'high-level strategic responses with business metrics',
    temperature: 0.5,
  },

  general: {
    name: 'General Interview',
    focusAreas: ['experience', 'achievements', 'skills', 'growth'],
    responseStyle: 'balanced approach with concrete examples',
    temperature: 0.6,
  },
} as const

export type InterviewContextType = keyof typeof INTERVIEW_CONTEXTS

/**
 * Context-Aware Enhanced RAG
 * =========================
 *
 * Applies enhanced RAG with specific interview context configuration
 */
export async function contextAwareRAG(
  question: string,
  vectorSearchFunction: (query: string) => Promise<VectorResult[]>,
  interviewType: InterviewContextType = 'general',
): Promise<EnhancedRAGResult> {
  const context = INTERVIEW_CONTEXTS[interviewType]

  console.log(`🎯 Processing for ${context.name} context`)

  return enhancedRAGQuery(question, vectorSearchFunction, context.name)
}

/**
 * Agentic RAG - Intelligent Search Decision Making
 * ===============================================
 *
 * Phase 1 Enhancement: LLM decides when and how to search based on question analysis.
 * This transforms the system from reactive to proactive by analyzing user intent.
 *
 * Decision Types:
 * - SEARCH: Requires specific information from Sajal's professional data
 * - DIRECT: Can answer conversationally without search
 * - CLARIFY: Question is unclear and needs clarification
 */
export interface AgenticDecision {
  action: 'SEARCH' | 'DIRECT' | 'CLARIFY'
  reasoning: string
  searchQuery?: string
  confidence: number
}

export async function agenticRAG(
  userQuestion: string,
  conversationHistory: any[],
  vectorSearchFunction: (query: string) => Promise<VectorResult[]>,
  interviewType: InterviewContextType = 'general',
  sessionId: string = 'default-session',
): Promise<EnhancedRAGResult> {
  const startTime = Date.now()
  const queryId = `${sessionId}-${Date.now()}`

  try {
    console.log('🤖 Agentic RAG: Analyzing question intent...')

    // Step 1: Get conversation context and enhance query
    const context = conversationMemory.getOrCreateContext(
      sessionId,
      INTERVIEW_CONTEXTS[interviewType].name,
    )

    // Add current user message to context
    conversationMemory.addMessage(sessionId, 'user', userQuestion, {
      interviewType: INTERVIEW_CONTEXTS[interviewType].name,
    })

    // Step 2: Enhance query with conversation context
    const contextEnhancement = await conversationMemory.enhanceQueryWithContext(
      sessionId,
      userQuestion,
    )
    console.log(`💭 Context enhancement: ${contextEnhancement.contextUsed}`)
    console.log(`🔄 Follow-up detected: ${contextEnhancement.isFollowUp}`)

    // Step 3: LLM analyzes if search is needed (using context-enhanced query for analysis)
    const searchDecision = await makeSearchDecision(
      contextEnhancement.enhancedQuery,
      conversationHistory,
      context.topicsDiscussed,
      contextEnhancement.isFollowUp,
    )

    console.log(`🎯 Decision: ${searchDecision.action} (Confidence: ${searchDecision.confidence}%)`)
    console.log(`💭 Reasoning: ${searchDecision.reasoning}`)

    // Step 4: Execute based on decision
    let result: EnhancedRAGResult

    switch (searchDecision.action) {
      case 'SEARCH':
        console.log('🔍 Executing enhanced RAG search...')
        const searchQuery = searchDecision.searchQuery || contextEnhancement.enhancedQuery
        result = await contextAwareRAG(searchQuery, vectorSearchFunction, interviewType)
        break

      case 'DIRECT':
        console.log('💬 Generating direct conversational response...')
        const directResponse = await generateDirectResponse(
          userQuestion,
          searchDecision.reasoning,
          interviewType,
          context.topicsDiscussed,
        )
        result = {
          response: directResponse,
          metadata: {
            originalQuery: userQuestion,
            enhancedQuery: contextEnhancement.enhancedQuery,
            resultsFound: 0,
            agenticDecision: searchDecision,
            interviewContext: INTERVIEW_CONTEXTS[interviewType].name,
            conversationContext: contextEnhancement.contextUsed,
          },
          metrics: {
            queryEnhancementTime: 0,
            vectorSearchTime: 0,
            responseFormattingTime: Date.now() - startTime,
            totalTime: Date.now() - startTime,
          },
        }
        break

      case 'CLARIFY':
        console.log('❓ Requesting clarification...')
        const clarificationResponse = await generateClarificationRequest(
          userQuestion,
          searchDecision.reasoning,
          context.topicsDiscussed,
        )
        result = {
          response: clarificationResponse,
          metadata: {
            originalQuery: userQuestion,
            enhancedQuery: contextEnhancement.enhancedQuery,
            resultsFound: 0,
            agenticDecision: searchDecision,
            interviewContext: 'clarification',
            conversationContext: contextEnhancement.contextUsed,
          },
          metrics: {
            queryEnhancementTime: 0,
            vectorSearchTime: 0,
            responseFormattingTime: Date.now() - startTime,
            totalTime: Date.now() - startTime,
          },
        }
        break

      default:
        // Fallback to regular enhanced RAG
        console.log('🔄 Fallback to standard enhanced RAG...')
        result = await contextAwareRAG(
          contextEnhancement.enhancedQuery,
          vectorSearchFunction,
          interviewType,
        )
        break
    }

    // Step 5: Add assistant response to conversation memory
    conversationMemory.addMessage(sessionId, 'assistant', result.response, {
      agenticDecision: searchDecision.action,
      topicsTouched: result.metadata.agenticDecision ? [] : undefined,
    })

    // Add conversation context to metadata
    result.metadata.conversationContext = contextEnhancement.contextUsed

    // Step 6: Record analytics
    const performanceMetrics: RAGPerformanceMetrics = {
      queryId,
      sessionId,
      timestamp: new Date(),
      originalQuery: userQuestion,
      enhancedQuery: contextEnhancement.enhancedQuery,
      interviewType: INTERVIEW_CONTEXTS[interviewType].name,
      isFollowUp: contextEnhancement.isFollowUp,
      agenticDecision: searchDecision.action,
      agenticConfidence: searchDecision.confidence,
      processingTimeMs: result.metrics?.totalTime || Date.now() - startTime,
      vectorSearchTime: result.metrics?.vectorSearchTime || 0,
      responseFormattingTime: result.metrics?.responseFormattingTime || 0,
      response: result.response,
      responseLength: result.response.length,
      resultsFound: result.metadata.resultsFound,
      modelUsed: 'llama-3.1-8b-instant',
    }

    // Record metrics asynchronously to not slow down response
    ragAnalytics
      .recordQuery(performanceMetrics)
      .catch((error) => console.error('Failed to record analytics:', error))

    // Add query ID to result for feedback tracking
    result.metadata.queryId = queryId

    return result
  } catch (error) {
    console.error('Agentic RAG failed:', error)
    // Fallback to standard enhanced RAG
    const fallbackResult = await contextAwareRAG(userQuestion, vectorSearchFunction, interviewType)

    // Still add to conversation memory on fallback
    conversationMemory.addMessage(sessionId, 'user', userQuestion)
    conversationMemory.addMessage(sessionId, 'assistant', fallbackResult.response)

    return fallbackResult
  }
}

/**
 * Search Decision Analysis
 * =======================
 *
 * Uses LLM to analyze if a question requires database search or can be answered directly
 */
async function makeSearchDecision(
  userQuestion: string,
  conversationHistory: any[],
  topicsDiscussed: string[] = [],
  isFollowUp: boolean = false,
): Promise<AgenticDecision> {
  if (!process.env.GROQ_API_KEY) {
    // Default to search if no LLM available
    return {
      action: 'SEARCH',
      reasoning: 'No LLM available for decision making, defaulting to search',
      confidence: 50,
    }
  }

  const historyContext =
    conversationHistory.length > 0
      ? `Previous conversation: ${conversationHistory
          .slice(-3)
          .map((h) => `${h.role}: ${h.content}`)
          .join('\n')}`
      : 'No previous conversation context'

  const topicsContext =
    topicsDiscussed.length > 0
      ? `Topics already discussed: ${topicsDiscussed.join(', ')}`
      : 'No topics discussed yet'

  const followUpContext = isFollowUp
    ? 'This appears to be a follow-up question referencing previous conversation.'
    : 'This appears to be a new question.'

  const decisionPrompt = `
You are an intelligent assistant analyzing whether a user question requires searching Sajal's professional database or can be answered directly.

Question: "${userQuestion}"
${historyContext}
${topicsContext}
${followUpContext}

Analyze this question and decide:

SEARCH - If you need specific information about:
- Technical skills, projects, work experience, achievements
- Specific companies, roles, technologies Sajal has worked with
- Detailed examples, metrics, or concrete accomplishments
- Past experiences or specific incidents

DIRECT - If you can answer conversationally about:
- General interview advice or tips
- Generic career guidance
- General technology explanations
- Common interview questions preparation
- Motivational or encouraging responses

CLARIFY - If the question is:
- Too vague or ambiguous
- Missing important context
- Could have multiple interpretations
- Needs more specific information to provide a good answer

Return your response in this EXACT JSON format:
{
  "action": "SEARCH|DIRECT|CLARIFY",
  "reasoning": "Brief explanation of why you chose this action",
  "confidence": 85,
  "searchQuery": "enhanced query if action is SEARCH (optional)"
}

Decision:`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: decisionPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3, // Lower temperature for consistent decisions
      max_tokens: 200,
    })

    const responseContent = completion.choices[0]?.message?.content?.trim()

    if (!responseContent) {
      throw new Error('Empty response from LLM')
    }

    // Parse JSON response
    const decision = JSON.parse(responseContent)

    // Validate the decision format
    if (!['SEARCH', 'DIRECT', 'CLARIFY'].includes(decision.action)) {
      throw new Error(`Invalid action: ${decision.action}`)
    }

    return {
      action: decision.action,
      reasoning: decision.reasoning || 'No reasoning provided',
      confidence: Math.max(0, Math.min(100, decision.confidence || 75)),
      searchQuery: decision.searchQuery,
    }
  } catch (error) {
    console.error('Search decision analysis failed:', error)

    // Fallback decision logic based on keywords
    const questionLower = userQuestion.toLowerCase()

    if (
      questionLower.includes('tell me about') ||
      questionLower.includes('experience') ||
      questionLower.includes('project') ||
      questionLower.includes('skill')
    ) {
      return {
        action: 'SEARCH',
        reasoning: 'Fallback: Question appears to ask for specific professional information',
        confidence: 70,
      }
    }

    if (
      questionLower.includes('how to') ||
      questionLower.includes('advice') ||
      questionLower.includes('tip')
    ) {
      return {
        action: 'DIRECT',
        reasoning: 'Fallback: Question appears to ask for general advice',
        confidence: 60,
      }
    }

    return {
      action: 'SEARCH',
      reasoning: 'Fallback: Default to search when uncertain',
      confidence: 50,
    }
  }
}

/**
 * Direct Conversational Response
 * =============================
 *
 * Generates responses that don't require database search
 */
async function generateDirectResponse(
  question: string,
  reasoning: string,
  interviewType: InterviewContextType,
  topicsDiscussed: string[] = [],
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    return "I'd be happy to help with that! Can you be more specific about what you'd like to know?"
  }

  const context = INTERVIEW_CONTEXTS[interviewType]

  const directPrompt = `
You are Sajal's AI interview coach providing direct conversational responses.

Question: "${question}"
Interview Type: ${context.name}
Decision Reasoning: ${reasoning}

Focus Areas for this interview type: ${context.focusAreas.join(', ')}

Provide a helpful, conversational response that:
- Addresses the question directly without needing specific data lookup
- Offers practical interview advice or general guidance
- Maintains an encouraging, professional tone
- Keeps response under 80 words
- Relates to ${context.name} context when relevant

Response:`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: directPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 120,
    })

    return (
      completion.choices[0]?.message?.content?.trim() ||
      "I'd be happy to help with that! Could you provide a bit more context about what specifically you'd like to know?"
    )
  } catch (error) {
    console.error('Direct response generation failed:', error)
    return "I'd be happy to help with interview preparation! What specific area would you like to focus on?"
  }
}

/**
 * Clarification Request Generation
 * ===============================
 *
 * Generates helpful clarification requests for ambiguous questions
 */
async function generateClarificationRequest(
  question: string,
  reasoning: string,
  topicsDiscussed: string[] = [],
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    return "Could you help me understand what specific information you're looking for? I want to give you the most relevant response."
  }

  const clarificationPrompt = `
You are Sajal's AI assistant helping to clarify an ambiguous question.

Original Question: "${question}"
Why clarification is needed: ${reasoning}

Generate a helpful clarification request that:
- Acknowledges the original question
- Explains what additional context would be helpful
- Offers 2-3 specific options or directions they could take
- Maintains a friendly, helpful tone
- Keeps response under 60 words

Clarification Request:`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: clarificationPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.6,
      max_tokens: 100,
    })

    return (
      completion.choices[0]?.message?.content?.trim() ||
      "I'd like to help you with that! Could you be more specific about what aspect you're most interested in?"
    )
  } catch (error) {
    console.error('Clarification request generation failed:', error)
    return "Could you help me understand what specific information you're looking for? I want to give you the most helpful response."
  }
}
