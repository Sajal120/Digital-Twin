import { NextRequest, NextResponse } from 'next/server'
import {
  enhancedRAGQuery,
  contextAwareRAG,
  type VectorResult,
  type InterviewContextType,
} from '@/lib/llm-enhanced-rag'
import { Index } from '@upstash/vector'

/**
 * Enhanced RAG Comparison API
 * ==========================
 *
 * A/B test endpoint to compare basic RAG vs LLM-enhanced RAG responses.
 * This helps evaluate the improvements from LLM enhancement.
 */

interface ComparisonResult {
  question: string
  results: {
    basic: {
      response: string
      processingTime: number
    }
    enhanced: {
      response: string
      processingTime: number
      enhancedQuery: string
      interviewContext?: string
    }
  }
  totalComparisonTime: number
  improvement_indicators: {
    response_length_increase: string
    specificity_improvement: boolean
    interview_readiness: boolean
    structure_improvement: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, interviewType, includeAnalysis = true } = body

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    const startTime = Date.now()
    console.log(`🔄 Starting A/B comparison for: "${question}"`)

    // Run both approaches in parallel for fair comparison
    const [basicResult, enhancedResult] = await Promise.all([
      // Basic RAG approach
      (async () => {
        const basicStart = Date.now()
        try {
          // Note: We're creating a mock function since generatePortfolioResponse isn't exported
          // In a real implementation, you'd need to extract the basic logic
          const basicResponse = await generateBasicRAGResponse(question)
          return {
            response: basicResponse,
            processingTime: Date.now() - basicStart,
          }
        } catch (error) {
          console.error('Basic RAG failed:', error)
          return {
            response: 'Basic RAG processing failed',
            processingTime: Date.now() - basicStart,
          }
        }
      })(),

      // Enhanced RAG approach
      (async () => {
        const enhancedStart = Date.now()
        try {
          const enhancedResponse = await generateEnhancedRAGResponse(question, interviewType)
          return {
            response: enhancedResponse.response,
            processingTime: Date.now() - enhancedStart,
            enhancedQuery: enhancedResponse.metadata.enhancedQuery,
            interviewContext: enhancedResponse.metadata.interviewContext,
          }
        } catch (error) {
          console.error('Enhanced RAG failed:', error)
          return {
            response: 'Enhanced RAG processing failed',
            processingTime: Date.now() - enhancedStart,
            enhancedQuery: question,
            interviewContext: 'error',
          }
        }
      })(),
    ])

    const totalTime = Date.now() - startTime

    // Analyze improvements if requested
    let improvementAnalysis = {}
    if (includeAnalysis) {
      improvementAnalysis = analyzeImprovement(basicResult.response, enhancedResult.response)
    }

    const comparisonResult: ComparisonResult = {
      question,
      results: {
        basic: basicResult,
        enhanced: enhancedResult,
      },
      totalComparisonTime: totalTime,
      improvement_indicators: improvementAnalysis as any,
    }

    console.log(`✅ Comparison completed in ${totalTime}ms`)

    return NextResponse.json(comparisonResult)
  } catch (error) {
    console.error('Comparison API Error:', error)
    return NextResponse.json(
      {
        error: 'Comparison failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * Basic RAG Response Generation
 * ============================
 *
 * Simplified version of basic RAG for comparison testing
 */
async function generateBasicRAGResponse(question: string): Promise<string> {
  try {
    // Check if Upstash Vector is available
    if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
      return 'Vector database not configured for basic RAG comparison.'
    }

    // Initialize Upstash Vector client
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    })

    // Simple vector search with original query
    const vectorResults = await index.query({
      data: question.toLowerCase(),
      topK: 3,
      includeMetadata: true,
      includeData: true,
    })

    if (vectorResults && vectorResults.length > 0) {
      const bestMatch = vectorResults[0]

      if (bestMatch.score >= 0.5) {
        // Return raw content from best match
        return (
          (bestMatch.data as string) ||
          (bestMatch.metadata?.content as string) ||
          "Found relevant information but couldn't extract content."
        )
      }
    }

    return "I don't have specific information about that topic in my knowledge base."
  } catch (error) {
    console.error('Basic RAG response failed:', error)
    return 'Basic RAG processing encountered an error.'
  }
}

/**
 * Enhanced RAG Response Generation
 * ================================
 *
 * Uses the LLM-enhanced pipeline for comparison
 */
async function generateEnhancedRAGResponse(
  question: string,
  interviewType?: InterviewContextType,
): Promise<{ response: string; metadata: any }> {
  // Vector search function
  const vectorSearchFunction = async (query: string): Promise<VectorResult[]> => {
    try {
      const index = new Index({
        url: process.env.UPSTASH_VECTOR_REST_URL!,
        token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
      })

      const vectorResults = await index.query({
        data: query,
        topK: 5,
        includeMetadata: true,
        includeData: true,
      })

      return vectorResults.map((result) => ({
        score: result.score,
        data: result.data as string,
        metadata: result.metadata,
      }))
    } catch (error) {
      console.error('Vector search failed in enhanced comparison:', error)
      return []
    }
  }

  // Use context-aware enhanced RAG
  if (interviewType) {
    return await contextAwareRAG(question, vectorSearchFunction, interviewType)
  } else {
    return await enhancedRAGQuery(question, vectorSearchFunction, 'General Interview')
  }
}

/**
 * Response Quality Analysis
 * ========================
 *
 * Analyzes the improvement between basic and enhanced responses
 */
function analyzeImprovement(basicResponse: string, enhancedResponse: string) {
  const basicLength = basicResponse.length
  const enhancedLength = enhancedResponse.length

  // Calculate length increase percentage
  const lengthIncrease = (((enhancedLength - basicLength) / basicLength) * 100).toFixed(1)

  // Simple heuristics to detect improvements
  const hasSpecificExamples =
    enhancedResponse.includes('example') ||
    enhancedResponse.includes('specifically') ||
    enhancedResponse.includes('achieved') ||
    /\d+%|\$\d+|\d+ (years?|months?|projects?)/.test(enhancedResponse)

  const hasInterviewStructure =
    enhancedResponse.includes('situation') ||
    enhancedResponse.includes('task') ||
    enhancedResponse.includes('action') ||
    enhancedResponse.includes('result') ||
    enhancedResponse.includes("I'm particularly proud") ||
    enhancedResponse.includes('What I love about')

  const hasConfidentTone =
    enhancedResponse.includes("I've") ||
    enhancedResponse.includes('My experience') ||
    enhancedResponse.includes("I'm excited") ||
    enhancedResponse.includes('I successfully')

  return {
    response_length_increase: `+${lengthIncrease}%`,
    specificity_improvement: hasSpecificExamples,
    interview_readiness: hasInterviewStructure,
    structure_improvement: hasConfidentTone,
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    name: 'Enhanced RAG Comparison API',
    description: 'Compare basic RAG vs LLM-enhanced RAG responses',
    usage: {
      method: 'POST',
      body: {
        question: 'string (required)',
        interviewType: 'technical | behavioral | executive | general (optional)',
        includeAnalysis: 'boolean (optional, default: true)',
      },
    },
    example: {
      question: 'What are my key strengths?',
      interviewType: 'behavioral',
      includeAnalysis: true,
    },
  })
}
