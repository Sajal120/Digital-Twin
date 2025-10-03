/**
 * Advanced Agentic RAG System
 * ===========================
 *
 * Sophisticated LLM-driven RAG system with advanced reasoning, query planning,
 * and intelligent decision-making capabilities.
 *
 * Features:
 * - Advanced Query Analysis with Intent Recognition
 * - Multi-step Reasoning and Planning
 * - Dynamic Strategy Selection
 * - Context-Aware Decision Making
 * - Tool Integration Planning
 * - Feedback Loop Learning
 * - Quality Assessment and Self-Correction
 */

import OpenAI from 'openai'
import type { VectorResult, EnhancedRAGResult } from './llm-enhanced-rag'
import { multiHopRAG, type MultiHopResult } from './multi-hop-rag'
import { hybridSearch, recommendSearchStrategy, type HybridResult } from './hybrid-search'
import { toolUseRAG, type ToolEnhancedResult } from './tool-use-rag'
import type { ContextEnhancedQuery } from './conversation-context'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface AgenticPlan {
  strategy: 'simple' | 'hybrid' | 'multi_hop' | 'tool_enhanced' | 'combined'
  reasoning: string
  confidence: number
  steps: PlanStep[]
  expectedOutcome: string
  fallbackStrategy?: string
  qualityThreshold: number
}

export interface PlanStep {
  stepId: string
  action: 'vector_search' | 'hybrid_search' | 'multi_hop' | 'tool_use' | 'synthesis' | 'validation'
  description: string
  parameters: Record<string, any>
  dependencies: string[]
  expectedResult: string
  priority: 'high' | 'medium' | 'low'
}

export interface ExecutionResult {
  stepId: string
  success: boolean
  result: any
  confidence: number
  executionTime: number
  qualityScore: number
  issues?: string[]
}

export interface AgenticRAGResult {
  response: string
  plan: AgenticPlan
  executionResults: ExecutionResult[]
  finalConfidence: number
  qualityAssessment: QualityAssessment
  metadata: {
    originalQuery: string
    contextUsed: ContextEnhancedQuery
    totalExecutionTime: number
    strategiesAttempted: string[]
    improvementSuggestions?: string[]
  }
}

export interface QualityAssessment {
  relevance: number
  completeness: number
  accuracy: number
  clarity: number
  overall: number
  feedback: string
}

/**
 * Advanced Agentic RAG Pipeline
 * =============================
 *
 * Sophisticated pipeline with planning, execution, and quality assessment
 */
export async function advancedAgenticRAG(
  userQuery: string,
  contextEnhanced: ContextEnhancedQuery,
  vectorSearchFunction: (query: string) => Promise<VectorResult[]>,
  sessionId: string = 'default-session',
): Promise<AgenticRAGResult> {
  const startTime = Date.now()
  const strategiesAttempted: string[] = []

  try {
    console.log('🧠 Advanced Agentic RAG: Creating execution plan...')

    // Step 1: Advanced Query Analysis and Planning
    const plan = await createExecutionPlan(userQuery, contextEnhanced)
    console.log(`📋 Execution plan: ${plan.strategy} strategy with ${plan.steps.length} steps`)
    console.log(`🎯 Expected outcome: ${plan.expectedOutcome}`)

    // Step 2: Execute Plan
    const executionResults = await executePlan(plan, vectorSearchFunction, contextEnhanced)
    strategiesAttempted.push(plan.strategy)

    // Step 3: Quality Assessment
    const qualityAssessment = await assessQuality(
      userQuery,
      executionResults,
      plan.qualityThreshold,
    )

    console.log(`📊 Quality score: ${qualityAssessment.overall.toFixed(2)}/1.0`)

    // Step 4: Self-Correction if Quality is Poor
    let finalResults = executionResults
    let finalPlan = plan

    if (qualityAssessment.overall < plan.qualityThreshold && plan.fallbackStrategy) {
      console.log('🔄 Quality below threshold, attempting fallback strategy...')
      const fallbackPlan = await createFallbackPlan(userQuery, contextEnhanced, plan)
      const fallbackResults = await executePlan(fallbackPlan, vectorSearchFunction, contextEnhanced)

      const fallbackQuality = await assessQuality(userQuery, fallbackResults, plan.qualityThreshold)

      if (fallbackQuality.overall > qualityAssessment.overall) {
        finalResults = fallbackResults
        finalPlan = fallbackPlan
        strategiesAttempted.push(fallbackPlan.strategy)
      }
    }

    // Step 5: Generate Final Response
    const response = await synthesizeFinalResponse(
      userQuery,
      finalResults,
      contextEnhanced,
      finalPlan,
    )

    // Step 6: Final Quality Check
    const finalQuality = await assessResponseQuality(userQuery, response, contextEnhanced)

    return {
      response,
      plan: finalPlan,
      executionResults: finalResults,
      finalConfidence: finalQuality.overall,
      qualityAssessment: finalQuality,
      metadata: {
        originalQuery: userQuery,
        contextUsed: contextEnhanced,
        totalExecutionTime: Date.now() - startTime,
        strategiesAttempted,
        improvementSuggestions: await generateImprovementSuggestions(finalResults, finalQuality),
      },
    }
  } catch (error) {
    console.error('Advanced Agentic RAG failed:', error)

    // Ultimate fallback - simple vector search
    const fallbackResults = await vectorSearchFunction(userQuery)
    const fallbackResponse =
      fallbackResults
        .map((result) => result.data || result.metadata?.content)
        .filter(Boolean)
        .join('\n\n') || "I don't have specific information about that topic."

    return {
      response: fallbackResponse,
      plan: {
        strategy: 'simple',
        reasoning: 'Fallback due to system error',
        confidence: 0.3,
        steps: [],
        expectedOutcome: 'Basic response',
        qualityThreshold: 0.5,
      },
      executionResults: [],
      finalConfidence: 0.3,
      qualityAssessment: {
        relevance: 0.3,
        completeness: 0.2,
        accuracy: 0.3,
        clarity: 0.4,
        overall: 0.3,
        feedback: 'Fallback response due to system error',
      },
      metadata: {
        originalQuery: userQuery,
        contextUsed: contextEnhanced,
        totalExecutionTime: Date.now() - startTime,
        strategiesAttempted: ['fallback'],
      },
    }
  }
}

/**
 * Advanced Execution Plan Creation
 * ===============================
 *
 * Creates sophisticated execution plans based on query analysis
 */
async function createExecutionPlan(
  query: string,
  contextEnhanced: ContextEnhancedQuery,
): Promise<AgenticPlan> {
  if (!process.env.GROQ_API_KEY) {
    // Simple heuristic-based planning
    return createSimplePlan(query, contextEnhanced)
  }

  const planningPrompt = `
Create an execution plan for this query using advanced RAG techniques:

Query: "${query}"
Enhanced Query: "${contextEnhanced.enhancedQuery}"
Context: ${contextEnhanced.contextUsed}
Is Follow-up: ${contextEnhanced.isFollowUp}
Intent: ${contextEnhanced.intent}
Entities: ${contextEnhanced.entities.join(', ')}
Confidence: ${contextEnhanced.confidence}

Available strategies:
1. SIMPLE - Basic vector search for straightforward questions
2. HYBRID - Combine vector + keyword search for better coverage
3. MULTI_HOP - Chain multiple searches for complex questions
4. TOOL_ENHANCED - Use external tools (GitHub, real-time data) when needed
5. COMBINED - Use multiple strategies together

Consider:
- Query complexity and requirements
- Available context and entities
- Need for current information
- Specificity vs. breadth requirements
- User's intent and follow-up context

Return JSON:
{
  "strategy": "simple|hybrid|multi_hop|tool_enhanced|combined",
  "reasoning": "detailed explanation of why this strategy is optimal",
  "confidence": 85,
  "steps": [
    {
      "stepId": "step1",
      "action": "vector_search|hybrid_search|multi_hop|tool_use|synthesis|validation",
      "description": "what this step does",
      "parameters": {"key": "value"},
      "dependencies": [],
      "expectedResult": "what we expect to get",
      "priority": "high|medium|low"
    }
  ],
  "expectedOutcome": "what the final response should achieve",
  "fallbackStrategy": "strategy to use if primary fails",
  "qualityThreshold": 0.7
}

Execution Plan:`

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: planningPrompt }],
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      max_tokens: 800,
    })

    const responseContent = completion.choices[0]?.message?.content?.trim()

    if (responseContent) {
      const planData = JSON.parse(responseContent)

      return {
        strategy: planData.strategy || 'simple',
        reasoning: planData.reasoning || 'No reasoning provided',
        confidence: (planData.confidence || 70) / 100,
        steps: planData.steps || [],
        expectedOutcome: planData.expectedOutcome || 'Provide relevant information',
        fallbackStrategy: planData.fallbackStrategy,
        qualityThreshold: planData.qualityThreshold || 0.7,
      }
    }
  } catch (error) {
    console.error('Execution plan creation failed:', error)
  }

  // Fallback to simple plan
  return createSimplePlan(query, contextEnhanced)
}

/**
 * Simple Plan Creation (fallback)
 */
function createSimplePlan(query: string, contextEnhanced: ContextEnhancedQuery): AgenticPlan {
  const needsGitHub = /\b(github|repository|repos|code|projects)\b/i.test(query)
  const needsComplex = contextEnhanced.entities.length > 2 || contextEnhanced.isFollowUp
  const needsHybrid = /\b(compare|versus|different|types of)\b/i.test(query)

  let strategy: AgenticPlan['strategy'] = 'simple'
  let steps: PlanStep[] = [
    {
      stepId: 'search',
      action: 'vector_search',
      description: 'Basic vector search for relevant information',
      parameters: { query: contextEnhanced.enhancedQuery },
      dependencies: [],
      expectedResult: 'Relevant documents from knowledge base',
      priority: 'high',
    },
  ]

  if (needsGitHub) {
    strategy = 'tool_enhanced'
    steps.push({
      stepId: 'github_tool',
      action: 'tool_use',
      description: 'Fetch GitHub information',
      parameters: { toolName: 'github_profile', username: 'Sajal120' },
      dependencies: [],
      expectedResult: 'Current GitHub profile and repository data',
      priority: 'high',
    })
  } else if (needsComplex) {
    strategy = 'multi_hop'
    steps.push({
      stepId: 'follow_up_search',
      action: 'multi_hop',
      description: 'Multi-step search for complex query',
      parameters: { maxSteps: 2 },
      dependencies: ['search'],
      expectedResult: 'Comprehensive information from multiple searches',
      priority: 'high',
    })
  } else if (needsHybrid) {
    strategy = 'hybrid'
    steps = [
      {
        stepId: 'hybrid_search',
        action: 'hybrid_search',
        description: 'Combined vector and keyword search',
        parameters: { useKeyword: true, fusionMethod: 'adaptive' },
        dependencies: [],
        expectedResult: 'Enhanced search results with better coverage',
        priority: 'high',
      },
    ]
  }

  return {
    strategy,
    reasoning: `Heuristic selection: ${strategy} strategy chosen based on query characteristics`,
    confidence: 0.7,
    steps,
    expectedOutcome: 'Provide relevant and comprehensive information',
    fallbackStrategy: strategy !== 'simple' ? 'simple' : undefined,
    qualityThreshold: 0.6,
  }
}

/**
 * Plan Execution Engine
 * ====================
 */
async function executePlan(
  plan: AgenticPlan,
  vectorSearchFunction: (query: string) => Promise<VectorResult[]>,
  contextEnhanced: ContextEnhancedQuery,
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = []
  const stepResults = new Map<string, any>()

  console.log(`⚡ Executing ${plan.steps.length} steps...`)

  for (const step of plan.steps.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })) {
    const stepStartTime = Date.now()

    try {
      // Check dependencies
      const dependenciesMet = step.dependencies.every((depId) => stepResults.has(depId))
      if (!dependenciesMet) {
        results.push({
          stepId: step.stepId,
          success: false,
          result: null,
          confidence: 0,
          executionTime: 0,
          qualityScore: 0,
          issues: ['Dependencies not met'],
        })
        continue
      }

      console.log(`   🔧 Executing step: ${step.stepId} (${step.action})`)

      let stepResult: any = null
      let confidence = 0.5

      switch (step.action) {
        case 'vector_search':
          stepResult = await vectorSearchFunction(step.parameters.query)
          confidence = stepResult.length > 0 ? 0.8 : 0.3
          break

        case 'hybrid_search':
          const searchResults = await hybridSearch(
            step.parameters.query || contextEnhanced.enhancedQuery,
            vectorSearchFunction,
            undefined, // No separate keyword function
            step.parameters,
          )
          stepResult = searchResults.results
          confidence = searchResults.results.length > 0 ? 0.85 : 0.3
          break

        case 'multi_hop':
          const multiHopResult = await multiHopRAG(
            step.parameters.query || contextEnhanced.enhancedQuery,
            vectorSearchFunction,
            'general',
            step.parameters.maxSteps || 2,
          )
          stepResult = multiHopResult
          confidence = multiHopResult.totalSteps > 1 ? 0.9 : 0.7
          break

        case 'tool_use':
          const toolResult = await toolUseRAG(
            step.parameters.query || contextEnhanced.enhancedQuery,
            vectorSearchFunction,
            undefined,
            [step.parameters.toolName],
          )
          stepResult = toolResult
          confidence = toolResult.toolsUsed.length > 0 ? 0.85 : 0.4
          break

        default:
          throw new Error(`Unknown action: ${step.action}`)
      }

      const qualityScore = await assessStepQuality(step, stepResult, contextEnhanced)

      results.push({
        stepId: step.stepId,
        success: true,
        result: stepResult,
        confidence,
        executionTime: Date.now() - stepStartTime,
        qualityScore,
      })

      stepResults.set(step.stepId, stepResult)
    } catch (error) {
      console.error(`Step ${step.stepId} failed:`, error)

      results.push({
        stepId: step.stepId,
        success: false,
        result: null,
        confidence: 0,
        executionTime: Date.now() - stepStartTime,
        qualityScore: 0,
        issues: [error instanceof Error ? error.message : 'Unknown error'],
      })
    }
  }

  return results
}

/**
 * Step Quality Assessment
 */
async function assessStepQuality(
  step: PlanStep,
  result: any,
  contextEnhanced: ContextEnhancedQuery,
): Promise<number> {
  // Simple quality heuristics
  let score = 0.5

  if (!result) return 0

  switch (step.action) {
    case 'vector_search':
      if (Array.isArray(result)) {
        score = Math.min(result.length / 3, 1) * 0.6 + 0.4
        const avgScore =
          result.reduce((sum: number, r: VectorResult) => sum + r.score, 0) / result.length
        score = (score + avgScore) / 2
      }
      break

    case 'hybrid_search':
      if (Array.isArray(result)) {
        score = Math.min(result.length / 4, 1) * 0.7 + 0.3
        const avgCombinedScore =
          result.reduce((sum: number, r: HybridResult) => sum + r.combinedScore, 0) / result.length
        score = (score + avgCombinedScore) / 2
      }
      break

    case 'multi_hop':
      if (result.totalSteps && result.searchSteps) {
        score = Math.min(result.totalSteps / 2, 1) * 0.5
        const totalResults = result.searchSteps.reduce(
          (sum: number, s: any) => sum + s.results.length,
          0,
        )
        score += Math.min(totalResults / 6, 1) * 0.5
      }
      break

    case 'tool_use':
      if (result.toolsUsed) {
        const successfulTools = result.toolsUsed.filter((t: any) => t.success).length
        score = successfulTools > 0 ? 0.8 : 0.2
      }
      break
  }

  return Math.max(0, Math.min(1, score))
}

/**
 * Overall Quality Assessment
 */
async function assessQuality(
  query: string,
  executionResults: ExecutionResult[],
  threshold: number,
): Promise<QualityAssessment> {
  const successfulSteps = executionResults.filter((r) => r.success)
  const avgConfidence =
    successfulSteps.length > 0
      ? successfulSteps.reduce((sum, r) => sum + r.confidence, 0) / successfulSteps.length
      : 0

  const avgQualityScore =
    successfulSteps.length > 0
      ? successfulSteps.reduce((sum, r) => sum + r.qualityScore, 0) / successfulSteps.length
      : 0

  // Calculate individual metrics
  const relevance = Math.min(avgConfidence * 1.2, 1)
  const completeness = successfulSteps.length / Math.max(executionResults.length, 1)
  const accuracy = avgQualityScore
  const clarity = Math.min(avgConfidence, 1)

  const overall = relevance * 0.3 + completeness * 0.2 + accuracy * 0.3 + clarity * 0.2

  let feedback = 'Good quality response'
  if (overall < 0.4) feedback = 'Poor quality - lacks relevance and completeness'
  else if (overall < 0.6) feedback = 'Moderate quality - could be improved'
  else if (overall < 0.8) feedback = 'Good quality - meets expectations'
  else feedback = 'Excellent quality - comprehensive and accurate'

  return {
    relevance,
    completeness,
    accuracy,
    clarity,
    overall,
    feedback,
  }
}

/**
 * Fallback Plan Creation
 */
async function createFallbackPlan(
  query: string,
  contextEnhanced: ContextEnhancedQuery,
  originalPlan: AgenticPlan,
): Promise<AgenticPlan> {
  // Create a simpler, more reliable plan
  return {
    strategy: 'simple',
    reasoning: `Fallback from ${originalPlan.strategy} - using reliable simple search`,
    confidence: 0.6,
    steps: [
      {
        stepId: 'fallback_search',
        action: 'vector_search',
        description: 'Reliable vector search fallback',
        parameters: { query: query }, // Use original query, not enhanced
        dependencies: [],
        expectedResult: 'Basic relevant information',
        priority: 'high',
      },
    ],
    expectedOutcome: 'Provide at least some relevant information',
    qualityThreshold: 0.4,
  }
}

/**
 * Final Response Synthesis
 */
async function synthesizeFinalResponse(
  query: string,
  executionResults: ExecutionResult[],
  contextEnhanced: ContextEnhancedQuery,
  plan: AgenticPlan,
): Promise<string> {
  const successfulResults = executionResults.filter((r) => r.success)

  if (successfulResults.length === 0) {
    return "I don't have specific information about that topic. Could you try rephrasing your question?"
  }

  if (!process.env.GROQ_API_KEY) {
    // Simple concatenation fallback
    return (
      successfulResults
        .map((r) => extractTextFromResult(r.result))
        .filter(Boolean)
        .join('\n\n') || "I found some information but couldn't process it properly."
    )
  }

  const allInformation = successfulResults
    .map((r) => ({
      stepId: r.stepId,
      information: extractTextFromResult(r.result),
      confidence: r.confidence,
      quality: r.qualityScore,
    }))
    .filter((info) => info.information)

  const informationContext = allInformation
    .map((info) => `Step ${info.stepId}: ${info.information.slice(0, 500)}`)
    .join('\n\n')

  const synthesisPrompt = `
Synthesize a comprehensive response using information from multiple execution steps:

Original question: "${query}"
Enhanced query: "${contextEnhanced.enhancedQuery}"
Execution strategy: ${plan.strategy}
Context: ${contextEnhanced.contextUsed}

Information gathered:
${informationContext}

Create a natural response as Sajal:
- Combine all relevant information logically
- Answer the question directly and completely
- Keep response under 120 words (2-3 sentences)
- Sound conversational and professional
- Use "I" statements naturally
- Prioritize higher quality/confidence information

Response:`

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: synthesisPrompt }],
      model: 'gpt-3.5-turbo',
      temperature: 0.6,
      max_tokens: 250,
    })

    const synthesizedResponse = completion.choices[0]?.message?.content?.trim()

    if (synthesizedResponse && synthesizedResponse.length > 10) {
      return synthesizedResponse
    }
  } catch (error) {
    console.error('Final response synthesis failed:', error)
  }

  // Fallback synthesis
  return (
    allInformation.map((info) => info.information).join(' ') ||
    "I found some relevant information but couldn't synthesize it properly."
  )
}

/**
 * Extract Text from Result
 */
function extractTextFromResult(result: any): string {
  if (!result) return ''

  if (typeof result === 'string') return result

  if (Array.isArray(result)) {
    return result
      .map((item) => item.data || item.metadata?.content || item.metadata?.title || '')
      .filter(Boolean)
      .join('\n')
  }

  if (result.response) return result.response
  if (result.finalResponse) return result.finalResponse
  if (result.data) return JSON.stringify(result.data).slice(0, 200)

  return ''
}

/**
 * Response Quality Assessment
 */
async function assessResponseQuality(
  query: string,
  response: string,
  contextEnhanced: ContextEnhancedQuery,
): Promise<QualityAssessment> {
  // Simple heuristic assessment
  const relevance = response.length > 20 ? 0.8 : 0.3
  const completeness = response.includes('I') && response.length > 50 ? 0.8 : 0.5
  const accuracy = response.includes("I don't") ? 0.4 : 0.8
  const clarity = response.split('.').length > 1 ? 0.8 : 0.6

  const overall = relevance * 0.3 + completeness * 0.2 + accuracy * 0.3 + clarity * 0.2

  return {
    relevance,
    completeness,
    accuracy,
    clarity,
    overall,
    feedback: overall > 0.7 ? 'High quality response' : 'Acceptable quality response',
  }
}

/**
 * Generate Improvement Suggestions
 */
async function generateImprovementSuggestions(
  executionResults: ExecutionResult[],
  qualityAssessment: QualityAssessment,
): Promise<string[]> {
  const suggestions: string[] = []

  const failedSteps = executionResults.filter((r) => !r.success)
  if (failedSteps.length > 0) {
    suggestions.push('Some execution steps failed - consider fallback strategies')
  }

  if (qualityAssessment.relevance < 0.6) {
    suggestions.push('Improve query enhancement to increase relevance')
  }

  if (qualityAssessment.completeness < 0.6) {
    suggestions.push('Consider multi-hop search for more comprehensive results')
  }

  if (qualityAssessment.accuracy < 0.6) {
    suggestions.push('Implement fact-checking or confidence scoring')
  }

  return suggestions
}
