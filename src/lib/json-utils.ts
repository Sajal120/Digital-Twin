/**
 * Utility functions for safely parsing JSON from LLM responses
 */

export interface ParsedJsonResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Safely parse JSON from a string that might be in markdown format or contain extra text
 * @param response - The response string from an LLM
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T = any>(response: string, fallback?: T): ParsedJsonResult<T> {
  if (!response?.trim()) {
    return {
      success: false,
      error: 'Empty response',
      data: fallback,
    }
  }

  const trimmed = response.trim()

  // Try direct JSON parsing first
  try {
    const parsed = JSON.parse(trimmed)
    return {
      success: true,
      data: parsed,
    }
  } catch (directError) {
    // If direct parsing fails, try to extract JSON from markdown or text
    
    // Try to find JSON code block (```json ... ```)
    const jsonCodeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonCodeBlockMatch) {
      try {
        const parsed = JSON.parse(jsonCodeBlockMatch[1].trim())
        return {
          success: true,
          data: parsed,
        }
      } catch (codeBlockError) {
        console.warn('Failed to parse JSON from code block:', codeBlockError)
      }
    }

    // Try to find any JSON object {} in the text
    const jsonObjectMatch = trimmed.match(/\{[\s\S]*\}/)
    if (jsonObjectMatch) {
      try {
        const parsed = JSON.parse(jsonObjectMatch[0])
        return {
          success: true,
          data: parsed,
        }
      } catch (objectError) {
        console.warn('Failed to parse JSON object from text:', objectError)
      }
    }

    // Try to find any JSON array [] in the text
    const jsonArrayMatch = trimmed.match(/\[[\s\S]*\]/)
    if (jsonArrayMatch) {
      try {
        const parsed = JSON.parse(jsonArrayMatch[0])
        return {
          success: true,
          data: parsed,
        }
      } catch (arrayError) {
        console.warn('Failed to parse JSON array from text:', arrayError)
      }
    }

    // If all parsing attempts fail, return fallback
    return {
      success: false,
      error: `Failed to parse JSON: ${directError instanceof Error ? directError.message : String(directError)}`,
      data: fallback,
    }
  }
}

/**
 * Extract JSON from markdown-formatted text with specific patterns
 * @param response - The response string from an LLM
 * @param expectedType - Expected type: 'object' or 'array'
 * @returns Extracted JSON or null
 */
export function extractJsonFromMarkdown<T = any>(
  response: string,
  expectedType: 'object' | 'array' = 'object'
): T | null {
  if (!response?.trim()) return null

  const patterns = expectedType === 'array' 
    ? [
        /```(?:json)?\s*(\[[\s\S]*?\])\s*```/,  // Array in code block
        /(\[[\s\S]*?\])/,                        // Any array
      ]
    : [
        /```(?:json)?\s*(\{[\s\S]*?\})\s*```/,  // Object in code block
        /(\{[\s\S]*?\})/,                        // Any object
      ]

  for (const pattern of patterns) {
    const match = response.match(pattern)
    if (match) {
      try {
        return JSON.parse(match[1].trim())
      } catch (error) {
        console.warn(`Failed to parse JSON with pattern ${pattern}:`, error)
      }
    }
  }

  return null
}

/**
 * Clean up common formatting issues in LLM JSON responses
 * @param jsonString - The JSON string to clean
 * @returns Cleaned JSON string
 */
export function cleanJsonString(jsonString: string): string {
  return jsonString
    .trim()
    // Remove markdown code block markers
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```$/, '')
    // Remove common prefixes/suffixes
    .replace(/^Here's the JSON:?\s*/i, '')
    .replace(/^The JSON is:?\s*/i, '')
    .replace(/^Response:?\s*/i, '')
    // Clean up extra whitespace
    .trim()
}

/**
 * Parse analysis response with fallback
 */
export function parseAnalysisResponse(
  response: string,
  fallback = {
    entities: [] as string[],
    intent: 'general_inquiry',
    confidence: 0.6,
    followUpTo: undefined as string | undefined,
  }
) {
  const result = safeJsonParse(response, fallback)
  if (!result.success) {
    console.warn('Failed to parse analysis response, using fallback')
  }
  
  return {
    entities: result.data?.entities || fallback.entities,
    intent: result.data?.intent || fallback.intent,
    confidence: (result.data?.confidence || fallback.confidence * 100) / 100,
    followUpTo: result.data?.followUpTo || fallback.followUpTo,
  }
}

/**
 * Parse topics array response with fallback
 */
export function parseTopicsResponse(response: string): string[] {
  const result = safeJsonParse<string[]>(response, [])
  
  if (result.success && Array.isArray(result.data)) {
    return result.data.filter(topic => typeof topic === 'string' && topic.trim())
  }
  
  // Try to extract topics from text if JSON parsing fails
  const lines = response.split('\n')
  const topics: string[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    // Look for bullet points or numbered items
    const topicMatch = trimmed.match(/^[-*•]\s*(.+)$|^\d+\.\s*(.+)$/)
    if (topicMatch) {
      const topic = (topicMatch[1] || topicMatch[2])?.trim()
      if (topic && !topics.includes(topic)) {
        topics.push(topic)
      }
    }
  }
  
  return topics
}

/**
 * Parse language detection response with fallback
 */
export function parseLanguageDetectionResponse(
  response: string,
  fallback = {
    language: 'en',
    confidence: 0.8,
    translatedQuery: null,
  }
) {
  const result = safeJsonParse(response, fallback)
  
  return {
    language: result.data?.language || fallback.language,
    confidence: result.data?.confidence || fallback.confidence,
    translatedQuery: result.data?.translatedQuery || fallback.translatedQuery,
  }
}

/**
 * Parse search plan response with fallback
 */
export function parseSearchPlanResponse(
  response: string,
  fallback = {
    strategy: 'sequential' as 'single' | 'sequential' | 'parallel' | 'iterative',
    steps: [] as Array<{
      stepNumber: number
      query: string
      reasoning: string
      dependsOn?: number[]
    }>,
    synthesisApproach: 'Combine results logically',
  }
) {
  const result = safeJsonParse(response, fallback)
  
  const strategy = result.data?.strategy || fallback.strategy
  const validStrategies = ['single', 'sequential', 'parallel', 'iterative']
  
  return {
    strategy: validStrategies.includes(strategy) ? strategy as typeof fallback.strategy : fallback.strategy,
    steps: Array.isArray(result.data?.steps) ? result.data.steps : fallback.steps,
    synthesisApproach: result.data?.synthesisApproach || fallback.synthesisApproach,
  }
}

/**
 * Parse query enhancement response with fallback
 */
export function parseQueryEnhancementResponse(
  response: string,
  originalQuery: string,
  fallback?: {
    vectorQuery?: string
    keywordQuery?: string
    semanticQuery?: string
  }
) {
  const result = safeJsonParse(response, fallback)
  
  return {
    vectorQuery: result.data?.vectorQuery || fallback?.vectorQuery || originalQuery,
    keywordQuery: result.data?.keywordQuery || fallback?.keywordQuery || originalQuery,
    semanticQuery: result.data?.semanticQuery || fallback?.semanticQuery || originalQuery,
  }
}