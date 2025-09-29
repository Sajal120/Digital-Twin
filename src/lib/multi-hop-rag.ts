/**
 * Multi-hop RAG System
 * ====================
 *
 * Advanced RAG pattern that chains multiple searches for complex questions
 * requiring information synthesis from different sources or follow-up searches.
 *
 * Features:
 * - Query Decomposition: Break complex questions into searchable sub-queries
 * - Sequential Search: Chain searches based on previous results
 * - Information Synthesis: Combine results from multiple searches
 * - Search Planning: LLM plans the search strategy
 */

import Groq from 'groq-sdk'
import { parseSearchPlanResponse } from './json-utils'
import type { VectorResult } from './llm-enhanced-rag'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export interface SearchStep {
  stepNumber: number
  query: string
  reasoning: string
  results: VectorResult[]
  confidence: number
}

export interface MultiHopResult {
  originalQuery: string
  searchSteps: SearchStep[]
  finalResponse: string
  totalSteps: number
  metadata: {
    searchPlan: string
    synthesisStrategy: string
    searchTime: number
    totalResults: number
  }
}

export interface SearchPlan {
  strategy: 'single' | 'sequential' | 'parallel' | 'iterative'
  steps: Array<{
    stepNumber: number
    query: string
    reasoning: string
    dependsOn?: number[]
  }>
  synthesisApproach: string
}

/**
 * Multi-hop RAG Pipeline
 * ======================
 *
 * Executes complex search strategies with multiple hops based on LLM planning
 */
export async function multiHopRAG(
  originalQuery: string,
  vectorSearchFunction: (query: string) => Promise<VectorResult[]>,
  interviewType: string = 'general',
  maxSteps: number = 3,
): Promise<MultiHopResult> {
  const startTime = Date.now()

  try {
    console.log('🔍 Multi-hop RAG: Analyzing query complexity...')

    // Step 1: Analyze if multi-hop search is needed
    const complexity = await analyzeQueryComplexity(originalQuery)

    if (complexity.strategy === 'single') {
      console.log('📍 Single-step search sufficient')
      const results = await vectorSearchFunction(originalQuery)
      const response = await synthesizeResults(
        [
          {
            stepNumber: 1,
            query: originalQuery,
            reasoning: 'Simple query requiring single search',
            results,
            confidence: complexity.confidence,
          },
        ],
        originalQuery,
        interviewType,
      )

      return {
        originalQuery,
        searchSteps: [
          {
            stepNumber: 1,
            query: originalQuery,
            reasoning: 'Simple query requiring single search',
            results,
            confidence: complexity.confidence,
          },
        ],
        finalResponse: response,
        totalSteps: 1,
        metadata: {
          searchPlan: 'Single-step search',
          synthesisStrategy: 'Direct response',
          searchTime: Date.now() - startTime,
          totalResults: results.length,
        },
      }
    }

    // Step 2: Generate search plan for complex queries
    console.log('🗺️ Generating multi-step search plan...')
    const searchPlan = await generateSearchPlan(originalQuery, complexity.reasoning)

    // Step 3: Execute search steps
    console.log(`🔄 Executing ${searchPlan.steps.length}-step search plan...`)
    const searchSteps: SearchStep[] = []

    for (const planStep of searchPlan.steps.slice(0, maxSteps)) {
      console.log(`   Step ${planStep.stepNumber}: ${planStep.query}`)

      // Execute search
      const results = await vectorSearchFunction(planStep.query)

      // Evaluate results quality
      const confidence = await evaluateSearchResults(planStep.query, results)

      const searchStep: SearchStep = {
        stepNumber: planStep.stepNumber,
        query: planStep.query,
        reasoning: planStep.reasoning,
        results,
        confidence,
      }

      searchSteps.push(searchStep)

      // Decide if we need additional steps based on results
      if (searchStep.confidence < 0.6 && searchSteps.length < maxSteps) {
        const followUpQuery = await generateFollowUpQuery(originalQuery, searchSteps)
        if (followUpQuery) {
          console.log(`   Follow-up: ${followUpQuery}`)
          const followUpResults = await vectorSearchFunction(followUpQuery)
          const followUpConfidence = await evaluateSearchResults(followUpQuery, followUpResults)

          searchSteps.push({
            stepNumber: searchSteps.length + 1,
            query: followUpQuery,
            reasoning: 'Follow-up search based on insufficient results',
            results: followUpResults,
            confidence: followUpConfidence,
          })
        }
      }
    }

    // Step 4: Synthesize all results
    console.log('🧠 Synthesizing information from multiple searches...')
    const finalResponse = await synthesizeResults(searchSteps, originalQuery, interviewType)

    const totalResults = searchSteps.reduce((sum, step) => sum + step.results.length, 0)

    return {
      originalQuery,
      searchSteps,
      finalResponse,
      totalSteps: searchSteps.length,
      metadata: {
        searchPlan: searchPlan.synthesisApproach,
        synthesisStrategy: searchPlan.synthesisApproach,
        searchTime: Date.now() - startTime,
        totalResults,
      },
    }
  } catch (error) {
    console.error('Multi-hop RAG failed:', error)

    // Fallback to single search
    const fallbackResults = await vectorSearchFunction(originalQuery)
    const fallbackResponse = await synthesizeResults(
      [
        {
          stepNumber: 1,
          query: originalQuery,
          reasoning: 'Fallback single search due to error',
          results: fallbackResults,
          confidence: 0.5,
        },
      ],
      originalQuery,
      interviewType,
    )

    return {
      originalQuery,
      searchSteps: [
        {
          stepNumber: 1,
          query: originalQuery,
          reasoning: 'Fallback single search due to error',
          results: fallbackResults,
          confidence: 0.5,
        },
      ],
      finalResponse: fallbackResponse,
      totalSteps: 1,
      metadata: {
        searchPlan: 'Fallback strategy',
        synthesisStrategy: 'Error recovery',
        searchTime: Date.now() - startTime,
        totalResults: fallbackResults.length,
      },
    }
  }
}

/**
 * Query Complexity Analysis
 * ========================
 *
 * Analyzes if a query requires multi-step search or single search
 */
async function analyzeQueryComplexity(query: string): Promise<{
  strategy: 'single' | 'sequential' | 'parallel' | 'iterative'
  reasoning: string
  confidence: number
}> {
  if (!process.env.GROQ_API_KEY) {
    // Default heuristics without LLM
    const complexityIndicators = [
      'and',
      'also',
      'compare',
      'versus',
      'vs',
      'difference',
      'both',
      'multiple',
      'various',
      'all',
      'overall',
      'comprehensive',
      'complete',
      'how do you',
      'what are your',
      'tell me about your',
    ]

    const isComplex = complexityIndicators.some((indicator) =>
      query.toLowerCase().includes(indicator),
    )

    return {
      strategy: isComplex ? 'sequential' : 'single',
      reasoning: isComplex ? 'Complex query detected by keywords' : 'Simple query detected',
      confidence: 0.7,
    }
  }

  const complexityPrompt = `
Analyze this query to determine if it requires multiple search steps:

Query: "${query}"

Consider if the query:
1. Asks about multiple topics that require separate searches
2. Requires comparison or synthesis of different information
3. Has implicit follow-up questions
4. Needs comprehensive coverage of a broad topic

Strategies:
- SINGLE: Simple, direct question about one specific topic
- SEQUENTIAL: Needs multiple related searches in sequence
- PARALLEL: Can search multiple topics simultaneously
- ITERATIVE: Needs follow-up searches based on initial results

Return JSON:
{
  "strategy": "single|sequential|parallel|iterative",
  "reasoning": "explanation of why this strategy is needed",
  "confidence": 85
}

Analysis:`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: complexityPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 200,
    })

    const responseContent = completion.choices[0]?.message?.content?.trim()
    if (responseContent) {
      const analysis = JSON.parse(responseContent)
      return {
        strategy: analysis.strategy || 'single',
        reasoning: analysis.reasoning || 'No reasoning provided',
        confidence: Math.max(0, Math.min(100, analysis.confidence || 75)) / 100,
      }
    }
  } catch (error) {
    console.error('Query complexity analysis failed:', error)
  }

  // Fallback analysis
  return {
    strategy: 'single',
    reasoning: 'Fallback: treating as single search',
    confidence: 0.5,
  }
}

/**
 * Search Plan Generation
 * =====================
 *
 * Creates a detailed plan for multi-step searches
 */
async function generateSearchPlan(query: string, complexityReasoning: string): Promise<SearchPlan> {
  if (!process.env.GROQ_API_KEY) {
    // Simple fallback plan
    return {
      strategy: 'sequential',
      steps: [
        {
          stepNumber: 1,
          query: query,
          reasoning: 'Primary search for main query',
        },
        {
          stepNumber: 2,
          query: `${query} examples details`,
          reasoning: 'Follow-up search for specific examples',
        },
      ],
      synthesisApproach: 'Combine all results chronologically',
    }
  }

  const planPrompt = `
Create a detailed search plan for this complex query:

Query: "${query}"
Complexity analysis: ${complexityReasoning}

Generate a plan with 2-3 search steps that will comprehensively answer this question.
Each step should search for different aspects or build on previous results.

For Sajal Basnet's professional background, consider searching for:
- Specific skills and technologies
- Work experience and achievements  
- Project examples and details
- Educational background
- Relevant accomplishments

Return JSON:
{
  "strategy": "sequential",
  "steps": [
    {
      "stepNumber": 1,
      "query": "specific search query for step 1",
      "reasoning": "why this search is needed"
    },
    {
      "stepNumber": 2,
      "query": "specific search query for step 2", 
      "reasoning": "why this search is needed"
    }
  ],
  "synthesisApproach": "how to combine the results"
}

Search Plan:`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: planPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
      max_tokens: 400,
    })

    const responseContent = completion.choices[0]?.message?.content?.trim()
    if (responseContent) {
      return parseSearchPlanResponse(responseContent)
    }
  } catch (error) {
    console.error('Search plan generation failed:', error)
  }

  // Fallback plan
  return {
    strategy: 'sequential',
    steps: [
      {
        stepNumber: 1,
        query: query,
        reasoning: 'Primary search for main query',
      },
    ],
    synthesisApproach: 'Use primary search results',
  }
}

/**
 * Search Results Evaluation
 * =========================
 *
 * Evaluates the quality and relevance of search results
 */
async function evaluateSearchResults(query: string, results: VectorResult[]): Promise<number> {
  if (results.length === 0) return 0

  // Simple evaluation based on number and scores
  const avgScore = results.reduce((sum, result) => sum + result.score, 0) / results.length
  const coverageScore = Math.min(results.length / 3, 1) // Ideal 3+ results

  return avgScore * 0.7 + coverageScore * 0.3
}

/**
 * Follow-up Query Generation
 * =========================
 *
 * Generates additional queries when initial results are insufficient
 */
async function generateFollowUpQuery(
  originalQuery: string,
  searchSteps: SearchStep[],
): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) {
    // Simple fallback
    const lastStep = searchSteps[searchSteps.length - 1]
    if (lastStep.results.length === 0) {
      return `${originalQuery} experience background`
    }
    return null
  }

  const stepsSummary = searchSteps
    .map(
      (step) =>
        `Step ${step.stepNumber}: "${step.query}" (${step.results.length} results, confidence: ${step.confidence.toFixed(2)})`,
    )
    .join('\n')

  const followUpPrompt = `
The search results so far are insufficient for this query:

Original query: "${originalQuery}"
Search steps completed:
${stepsSummary}

Generate ONE additional search query that might find the missing information.
Focus on alternative phrasings, related topics, or specific aspects not covered yet.

If no follow-up search would be helpful, respond with "NONE".

Follow-up query:`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: followUpPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 100,
    })

    const responseContent = completion.choices[0]?.message?.content?.trim()

    if (responseContent && responseContent !== 'NONE' && responseContent.length > 5) {
      return responseContent
    }
  } catch (error) {
    console.error('Follow-up query generation failed:', error)
  }

  return null
}

/**
 * Results Synthesis
 * ================
 *
 * Combines information from multiple search steps into coherent response
 */
async function synthesizeResults(
  searchSteps: SearchStep[],
  originalQuery: string,
  interviewType: string,
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    // Simple concatenation fallback
    return (
      searchSteps
        .flatMap((step) => step.results.map((result) => result.data || result.metadata?.content))
        .filter(Boolean)
        .join('\n\n') || "I don't have specific information about that topic."
    )
  }

  // Collect all information
  const allInformation = searchSteps.map((step) => ({
    stepNumber: step.stepNumber,
    query: step.query,
    information: step.results
      .map(
        (result) =>
          result.data || result.metadata?.content || result.metadata?.title || 'No content',
      )
      .filter((info) => info !== 'No content')
      .join('\n'),
    confidence: step.confidence,
  }))

  const informationContext = allInformation
    .filter((info) => info.information.length > 0)
    .map((info) => `Search ${info.stepNumber}: "${info.query}"\nInformation: ${info.information}`)
    .join('\n\n')

  if (!informationContext) {
    return "I don't have specific information about that topic in my knowledge base. Could you ask about something more specific?"
  }

  const synthesisPrompt = `
You are Sajal Basnet responding to a question using information from multiple searches.

Original question: "${originalQuery}"
Interview context: ${interviewType}

Information gathered from searches:
${informationContext}

Synthesize this information into a natural, conversational response as Sajal:
- Combine information from all searches logically
- Answer the original question directly
- Keep response under 100 words (2-3 sentences)
- Sound natural and conversational
- Use "I" statements
- Focus only on the information provided

Response:`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: synthesisPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.6,
      max_tokens: 200,
    })

    const synthesizedResponse = completion.choices[0]?.message?.content?.trim()

    if (synthesizedResponse && synthesizedResponse.length > 10) {
      return synthesizedResponse
    }
  } catch (error) {
    console.error('Results synthesis failed:', error)
  }

  // Fallback synthesis
  const fallbackContent = allInformation
    .map((info) => info.information)
    .filter(Boolean)
    .join(' ')

  return fallbackContent || "I don't have specific information about that topic right now."
}

/**
 * Query Decomposition
 * ==================
 *
 * Breaks complex queries into searchable components
 */
export async function decomposeQuery(query: string): Promise<string[]> {
  if (!process.env.GROQ_API_KEY) {
    // Simple keyword-based decomposition
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 3)

    return keywords.length > 0 ? keywords : [query]
  }

  const decompositionPrompt = `
Break this complex question into 2-3 specific search queries:

Question: "${query}"

Each sub-query should focus on a specific aspect that can be searched independently.
For professional background questions, consider separating:
- Skills and technologies
- Work experience and roles  
- Projects and achievements
- Education and certifications

Return JSON array: ["sub-query 1", "sub-query 2", "sub-query 3"]

Sub-queries:`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: decompositionPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 200,
    })

    const responseContent = completion.choices[0]?.message?.content?.trim()

    if (responseContent) {
      const subQueries = JSON.parse(responseContent)
      if (Array.isArray(subQueries) && subQueries.length > 0) {
        return subQueries.slice(0, 3) // Limit to 3 sub-queries
      }
    }
  } catch (error) {
    console.error('Query decomposition failed:', error)
  }

  // Fallback: return original query
  return [query]
}
