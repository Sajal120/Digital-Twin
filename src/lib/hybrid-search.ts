/**
 * Hybrid Search Engine
 * ===================
 *
 * Advanced RAG pattern that combines vector similarity search with keyword/semantic
 * search for improved retrieval accuracy and coverage.
 *
 * Features:
 * - Vector Search: Dense embeddings for semantic similarity
 * - Keyword Search: Traditional text matching for specific terms
 * - BM25 Scoring: Statistical ranking for text relevance
 * - Result Fusion: Intelligent combination of different search methods
 * - Adaptive Weighting: Dynamic balance between search approaches
 */

import type { VectorResult } from './llm-enhanced-rag'
import Groq from 'groq-sdk'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export interface HybridResult extends VectorResult {
  searchMethod: 'vector' | 'keyword' | 'semantic' | 'hybrid'
  keywordMatches?: string[]
  semanticScore?: number
  combinedScore: number
  relevanceExplanation?: string
}

export interface SearchResults {
  results: HybridResult[]
  metadata: {
    vectorResults: number
    keywordResults: number
    semanticResults: number
    fusionStrategy: string
    searchTime: number
    queryEnhanced: boolean
  }
}

export interface SearchStrategy {
  useVector: boolean
  useKeyword: boolean
  useSemantic: boolean
  vectorWeight: number
  keywordWeight: number
  semanticWeight: number
  maxResults: number
  fusionMethod: 'RRF' | 'weighted' | 'cascade' | 'adaptive'
}

/**
 * Hybrid Search Pipeline
 * ======================
 *
 * Executes multiple search strategies and intelligently combines results
 */
export async function hybridSearch(
  query: string,
  vectorSearchFunction: (query: string) => Promise<VectorResult[]>,
  keywordSearchFunction?: (query: string) => Promise<VectorResult[]>,
  options: Partial<SearchStrategy> = {},
): Promise<SearchResults> {
  const startTime = Date.now()

  // Configure search strategy
  const strategy: SearchStrategy = {
    useVector: true,
    useKeyword: !!keywordSearchFunction,
    useSemantic: true,
    vectorWeight: 0.6,
    keywordWeight: 0.3,
    semanticWeight: 0.1,
    maxResults: 10,
    fusionMethod: 'weighted',
    ...options,
  }

  console.log(`🔍 Hybrid Search: ${query}`)
  console.log(
    `📊 Strategy: V${strategy.vectorWeight} K${strategy.keywordWeight} S${strategy.semanticWeight}`,
  )

  try {
    // Step 1: Query Enhancement for better search
    const enhancedQuery = await enhanceQueryForHybridSearch(query)

    // Step 2: Parallel search execution
    const searchPromises: Promise<{ method: string; results: VectorResult[] }>[] = []

    // Vector Search
    if (strategy.useVector) {
      searchPromises.push(
        vectorSearchFunction(enhancedQuery.vectorQuery || query)
          .then((results) => ({ method: 'vector', results }))
          .catch((error) => {
            console.error('Vector search failed:', error)
            return { method: 'vector', results: [] }
          }),
      )
    }

    // Keyword Search (if function provided)
    if (strategy.useKeyword && keywordSearchFunction) {
      searchPromises.push(
        keywordSearchFunction(enhancedQuery.keywordQuery || query)
          .then((results) => ({ method: 'keyword', results }))
          .catch((error) => {
            console.error('Keyword search failed:', error)
            return { method: 'keyword', results: [] }
          }),
      )
    }

    // Semantic Search (enhanced vector search with expanded terms)
    if (strategy.useSemantic) {
      const semanticQuery = enhancedQuery.semanticQuery || query
      searchPromises.push(
        vectorSearchFunction(semanticQuery)
          .then((results) => ({ method: 'semantic', results }))
          .catch((error) => {
            console.error('Semantic search failed:', error)
            return { method: 'semantic', results: [] }
          }),
      )
    }

    // Execute all searches in parallel
    const searchResults = await Promise.all(searchPromises)

    // Step 3: Process and enhance results
    const processedResults = await processSearchResults(searchResults, query, strategy)

    // Step 4: Fusion - combine results intelligently
    const fusedResults = await fuseResults(processedResults, strategy)

    // Step 5: Re-rank and filter
    const finalResults = await reRankResults(fusedResults, query, strategy.maxResults)

    console.log(
      `✨ Hybrid Search Complete: ${finalResults.length} results in ${Date.now() - startTime}ms`,
    )

    return {
      results: finalResults,
      metadata: {
        vectorResults: searchResults.find((r) => r.method === 'vector')?.results.length || 0,
        keywordResults: searchResults.find((r) => r.method === 'keyword')?.results.length || 0,
        semanticResults: searchResults.find((r) => r.method === 'semantic')?.results.length || 0,
        fusionStrategy: strategy.fusionMethod,
        searchTime: Date.now() - startTime,
        queryEnhanced: !!enhancedQuery,
      },
    }
  } catch (error) {
    console.error('Hybrid search failed:', error)

    // Fallback to simple vector search
    const fallbackResults = await vectorSearchFunction(query)
    const hybridResults: HybridResult[] = fallbackResults.map((result) => ({
      ...result,
      searchMethod: 'vector',
      combinedScore: result.score,
    }))

    return {
      results: hybridResults,
      metadata: {
        vectorResults: fallbackResults.length,
        keywordResults: 0,
        semanticResults: 0,
        fusionStrategy: 'fallback',
        searchTime: Date.now() - startTime,
        queryEnhanced: false,
      },
    }
  }
}

/**
 * Query Enhancement for Hybrid Search
 * ===================================
 *
 * Enhances the query for different search methods
 */
async function enhanceQueryForHybridSearch(query: string): Promise<{
  vectorQuery?: string
  keywordQuery?: string
  semanticQuery?: string
}> {
  if (!process.env.GROQ_API_KEY) {
    return {
      vectorQuery: query,
      keywordQuery: query,
      semanticQuery: `${query} experience skills background`,
    }
  }

  const enhancementPrompt = `
Enhance this query for different search methods:

Original query: "${query}"

Create optimized versions for:
1. Vector search - semantic similarity and context
2. Keyword search - specific terms and exact matches  
3. Semantic search - expanded concepts and related terms

For Sajal Basnet's professional information, consider:
- Technical skills and technologies
- Work experience and roles
- Projects and achievements
- Education and certifications

Return JSON:
{
  "vectorQuery": "optimized for semantic vector search",
  "keywordQuery": "optimized for exact keyword matching",
  "semanticQuery": "expanded with synonyms and related concepts"
}

Enhanced queries:`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: enhancementPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
      max_tokens: 300,
    })

    const responseContent = completion.choices[0]?.message?.content?.trim()

    if (responseContent) {
      const enhanced = JSON.parse(responseContent)
      return {
        vectorQuery: enhanced.vectorQuery || query,
        keywordQuery: enhanced.keywordQuery || query,
        semanticQuery: enhanced.semanticQuery || query,
      }
    }
  } catch (error) {
    console.error('Query enhancement failed:', error)
  }

  // Fallback enhancement
  return {
    vectorQuery: query,
    keywordQuery: query,
    semanticQuery: `${query} experience skills background`,
  }
}

/**
 * Search Results Processing
 * ========================
 *
 * Processes raw search results and adds hybrid metadata
 */
async function processSearchResults(
  searchResults: Array<{ method: string; results: VectorResult[] }>,
  query: string,
  strategy: SearchStrategy,
): Promise<HybridResult[]> {
  const allResults: HybridResult[] = []

  for (const searchResult of searchResults) {
    const { method, results } = searchResult

    for (const result of results) {
      // Extract keywords for keyword matching analysis
      const keywordMatches = await extractKeywordMatches(query, result)

      // Calculate semantic score if not vector search
      const semanticScore =
        method !== 'vector' ? await calculateSemanticScore(query, result) : result.score

      // Create hybrid result
      const hybridResult: HybridResult = {
        ...result,
        searchMethod: method as 'vector' | 'keyword' | 'semantic',
        keywordMatches,
        semanticScore,
        combinedScore: result.score, // Will be recalculated in fusion
      }

      allResults.push(hybridResult)
    }
  }

  return allResults
}

/**
 * Extract Keyword Matches
 * =======================
 *
 * Identifies which keywords from the query match the content
 */
async function extractKeywordMatches(query: string, result: VectorResult): Promise<string[]> {
  const content = result.data || result.metadata?.content || result.metadata?.title || ''
  if (!content) return []

  // Simple keyword extraction
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .filter(
      (word) =>
        !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(
          word,
        ),
    )

  const contentLower = content.toLowerCase()
  const matches = queryWords.filter((word) => contentLower.includes(word))

  return matches
}

/**
 * Calculate Semantic Score
 * =======================
 *
 * Estimates semantic relevance for non-vector results
 */
async function calculateSemanticScore(query: string, result: VectorResult): Promise<number> {
  const content = result.data || result.metadata?.content || ''
  if (!content) return 0

  // Simple heuristic based on keyword overlap and content length
  const keywordMatches = await extractKeywordMatches(query, result)
  const keywordScore = keywordMatches.length / Math.max(query.split(' ').length, 1)

  // Content relevance (longer content might be more comprehensive)
  const contentScore = Math.min(content.length / 500, 1) * 0.3

  return Math.min(keywordScore * 0.7 + contentScore, 1)
}

/**
 * Result Fusion
 * =============
 *
 * Intelligently combines results from different search methods
 */
async function fuseResults(
  results: HybridResult[],
  strategy: SearchStrategy,
): Promise<HybridResult[]> {
  console.log(`🔀 Fusing ${results.length} results using ${strategy.fusionMethod} method`)

  switch (strategy.fusionMethod) {
    case 'weighted':
      return fuseWithWeightedScoring(results, strategy)
    case 'RRF':
      return fuseWithRRF(results, strategy)
    case 'cascade':
      return fuseWithCascade(results, strategy)
    case 'adaptive':
      return fuseWithAdaptiveStrategy(results, strategy)
    default:
      return fuseWithWeightedScoring(results, strategy)
  }
}

/**
 * Weighted Score Fusion
 * =====================
 *
 * Combines scores using weighted averages
 */
function fuseWithWeightedScoring(
  results: HybridResult[],
  strategy: SearchStrategy,
): HybridResult[] {
  const fusedResults = results.map((result) => {
    let combinedScore = 0
    let weightSum = 0

    // Vector score
    if (result.searchMethod === 'vector') {
      combinedScore += result.score * strategy.vectorWeight
      weightSum += strategy.vectorWeight
    }

    // Keyword score (based on keyword matches)
    if (result.searchMethod === 'keyword') {
      const keywordScore = (result.keywordMatches?.length || 0) / 10
      combinedScore += keywordScore * strategy.keywordWeight
      weightSum += strategy.keywordWeight
    }

    // Semantic score
    if (result.searchMethod === 'semantic') {
      const semanticScore = result.semanticScore || result.score
      combinedScore += semanticScore * strategy.semanticWeight
      weightSum += strategy.semanticWeight
    }

    // Normalize by weight sum
    const finalScore = weightSum > 0 ? combinedScore / weightSum : result.score

    return {
      ...result,
      combinedScore: Math.max(0, Math.min(1, finalScore)),
      searchMethod: 'hybrid' as const,
    }
  })

  // Remove duplicates based on content similarity
  return deduplicateResults(fusedResults)
}

/**
 * Reciprocal Rank Fusion (RRF)
 * ============================
 *
 * Fusion method that works well when relevance scores aren't comparable
 */
function fuseWithRRF(
  results: HybridResult[],
  strategy: SearchStrategy,
  k: number = 60,
): HybridResult[] {
  // Group results by search method
  const groupedResults = new Map<string, HybridResult[]>()

  for (const result of results) {
    const method = result.searchMethod
    if (!groupedResults.has(method)) {
      groupedResults.set(method, [])
    }
    groupedResults.get(method)!.push(result)
  }

  // Sort each group by score and assign ranks
  for (const [method, methodResults] of groupedResults) {
    methodResults.sort((a, b) => b.score - a.score)
  }

  // Calculate RRF scores
  const rrfResults = new Map<string, HybridResult>()

  for (const [method, methodResults] of groupedResults) {
    methodResults.forEach((result, index) => {
      const contentKey = result.data || result.metadata?.content || `${index}-${method}`
      const rank = index + 1
      const rrfScore = 1 / (k + rank)

      if (rrfResults.has(contentKey)) {
        const existing = rrfResults.get(contentKey)!
        existing.combinedScore += rrfScore
      } else {
        rrfResults.set(contentKey, {
          ...result,
          combinedScore: rrfScore,
          searchMethod: 'hybrid',
        })
      }
    })
  }

  return Array.from(rrfResults.values()).sort((a, b) => b.combinedScore - a.combinedScore)
}

/**
 * Cascade Fusion
 * ==============
 *
 * Uses results from higher-priority methods first, falls back to others
 */
function fuseWithCascade(results: HybridResult[], strategy: SearchStrategy): HybridResult[] {
  const priorityOrder: Array<'vector' | 'keyword' | 'semantic'> = ['vector', 'keyword', 'semantic']
  const cascadeResults: HybridResult[] = []
  const seenContent = new Set<string>()

  for (const method of priorityOrder) {
    const methodResults = results
      .filter((result) => result.searchMethod === method)
      .sort((a, b) => b.score - a.score)

    for (const result of methodResults) {
      const contentKey = result.data || result.metadata?.content || ''
      if (contentKey && !seenContent.has(contentKey)) {
        seenContent.add(contentKey)
        cascadeResults.push({
          ...result,
          combinedScore: result.score,
          searchMethod: 'hybrid',
        })

        if (cascadeResults.length >= strategy.maxResults) {
          break
        }
      }
    }

    if (cascadeResults.length >= strategy.maxResults) {
      break
    }
  }

  return cascadeResults
}

/**
 * Adaptive Fusion Strategy
 * ========================
 *
 * Chooses fusion method based on query and results characteristics
 */
async function fuseWithAdaptiveStrategy(
  results: HybridResult[],
  strategy: SearchStrategy,
): Promise<HybridResult[]> {
  // Analyze results distribution
  const methodCounts = {
    vector: results.filter((r) => r.searchMethod === 'vector').length,
    keyword: results.filter((r) => r.searchMethod === 'keyword').length,
    semantic: results.filter((r) => r.searchMethod === 'semantic').length,
  }

  // Choose strategy based on result distribution
  if (methodCounts.vector > methodCounts.keyword * 2) {
    // Vector dominates - use cascade
    console.log('🎯 Adaptive: Using cascade (vector dominates)')
    return fuseWithCascade(results, strategy)
  } else if (methodCounts.keyword > 0 && methodCounts.vector > 0) {
    // Balanced results - use RRF
    console.log('🎯 Adaptive: Using RRF (balanced results)')
    return fuseWithRRF(results, strategy)
  } else {
    // Default to weighted
    console.log('🎯 Adaptive: Using weighted (default)')
    return fuseWithWeightedScoring(results, strategy)
  }
}

/**
 * Result Deduplication
 * ===================
 *
 * Removes duplicate results based on content similarity
 */
function deduplicateResults(results: HybridResult[]): HybridResult[] {
  const deduplicated: HybridResult[] = []
  const seenContent = new Set<string>()

  for (const result of results.sort((a, b) => b.combinedScore - a.combinedScore)) {
    const content = result.data || result.metadata?.content || result.metadata?.title || ''

    // Simple deduplication based on content similarity
    const contentKey = content.slice(0, 100).toLowerCase().trim()

    if (contentKey && !seenContent.has(contentKey)) {
      seenContent.add(contentKey)
      deduplicated.push(result)
    }
  }

  return deduplicated
}

/**
 * Result Re-ranking
 * =================
 *
 * Final re-ranking based on relevance and quality signals
 */
async function reRankResults(
  results: HybridResult[],
  query: string,
  maxResults: number,
): Promise<HybridResult[]> {
  // Sort by combined score
  const sorted = results.sort((a, b) => b.combinedScore - a.combinedScore)

  // Apply quality filters
  const filtered = sorted.filter((result) => {
    // Must have some content
    const hasContent = result.data || result.metadata?.content
    if (!hasContent) return false

    // Must have reasonable score
    if (result.combinedScore < 0.1) return false

    return true
  })

  // Return top results
  return filtered.slice(0, maxResults)
}

/**
 * Simple Keyword Search Implementation
 * ===================================
 *
 * Basic keyword search for when no external keyword search is available
 */
export async function simpleKeywordSearch(
  query: string,
  vectorResults: VectorResult[],
): Promise<VectorResult[]> {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)

  const keywordResults: VectorResult[] = []

  for (const result of vectorResults) {
    const content = (result.data || result.metadata?.content || '').toLowerCase()

    let keywordScore = 0
    let matchCount = 0

    for (const word of queryWords) {
      if (content.includes(word)) {
        matchCount++
        // Boost score for exact matches
        keywordScore += content.split(word).length - 1
      }
    }

    if (matchCount > 0) {
      keywordResults.push({
        ...result,
        score: Math.min(keywordScore / queryWords.length / 3, 1), // Normalize
      })
    }
  }

  return keywordResults.sort((a, b) => b.score - a.score)
}

/**
 * Search Strategy Recommendations
 * ===============================
 *
 * Recommends optimal search strategy based on query type
 */
export async function recommendSearchStrategy(query: string): Promise<SearchStrategy> {
  // Simple heuristic-based recommendations
  const queryLower = query.toLowerCase()

  // Technical queries benefit from keyword search
  const isTechnical = /\b(python|java|react|javascript|ai|ml|database|api|framework)\b/i.test(query)

  // Broad questions benefit from vector search
  const isBroad = /\b(tell me about|what are|how do you|experience with|background)\b/i.test(query)

  // Specific questions benefit from hybrid
  const isSpecific = /\b(specific|example|project|achievement|skill)\b/i.test(query)

  if (isTechnical) {
    return {
      useVector: true,
      useKeyword: true,
      useSemantic: false,
      vectorWeight: 0.4,
      keywordWeight: 0.6,
      semanticWeight: 0,
      maxResults: 8,
      fusionMethod: 'weighted',
    }
  }

  if (isBroad) {
    return {
      useVector: true,
      useKeyword: false,
      useSemantic: true,
      vectorWeight: 0.7,
      keywordWeight: 0,
      semanticWeight: 0.3,
      maxResults: 10,
      fusionMethod: 'cascade',
    }
  }

  if (isSpecific) {
    return {
      useVector: true,
      useKeyword: true,
      useSemantic: true,
      vectorWeight: 0.5,
      keywordWeight: 0.3,
      semanticWeight: 0.2,
      maxResults: 6,
      fusionMethod: 'RRF',
    }
  }

  // Default balanced strategy
  return {
    useVector: true,
    useKeyword: true,
    useSemantic: true,
    vectorWeight: 0.6,
    keywordWeight: 0.3,
    semanticWeight: 0.1,
    maxResults: 8,
    fusionMethod: 'adaptive',
  }
}
