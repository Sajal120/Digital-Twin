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

IMPORTANT: Only reference accurate information from the provided data. Sajal's actual work experience includes:
- Software Developer Intern at Aubot (Dec 2024 - Mar 2025)  
- VR Developer at edgedVR (Jan 2023 - Dec 2023)
- Hospitality management roles
- Various personal projects in AI/ML and web development

Do NOT mention companies like RASSURE or other organizations unless they appear in the provided data.

Create a natural, conversational response that:
- Directly answers the specific question asked
- Keeps response under 100 words (1-2 paragraphs maximum)  
- Uses conversational, friendly tone like talking to a colleague
- Includes 1-2 specific examples with concrete details and numbers
- Mentions only real companies, technologies, and experiences from the data
- Avoids repetitive information and generic statements
- Sounds like Sajal speaking naturally in first person
- Focuses on the most relevant information for the question

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
