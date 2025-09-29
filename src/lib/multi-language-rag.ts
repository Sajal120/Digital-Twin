/**
 * Multi-Language RAG Processing
 * ============================
 *
 * Enhanced RAG system with multi-language support for natural conversation
 * in English, Hindi, and Nepali with proper context management.
 */

import Groq from 'groq-sdk'
import { parseLanguageDetectionResponse, safeJsonParse } from './json-utils'
import { conversationToneManager, type ToneContext } from './conversation-tone-manager'
import { findConversationTemplate, getTemplateResponse, getBasicResponse } from './natural-language-templates'
import type { VectorResult } from './llm-enhanced-rag'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export interface LanguageContext {
  detectedLanguage: string
  confidence: number
  translatedQuery?: string
  culturalContext: string[]
  preferredResponseLanguage: string
  needsTranslation?: boolean
}

export interface MultiLanguageRAGResult {
  response: string
  originalLanguage: string
  responseLanguage: string
  translationUsed: boolean
  searchLanguage: string
  metadata: {
    languageDetection: LanguageContext
    ragPattern: string
    searchResults: number
    crossLanguageSearch: boolean
    templateUsed?: string
  }
}

/**
 * Language Detection and Context Analysis
 */
export async function detectLanguageContext(message: string): Promise<LanguageContext> {
  try {
    // Quick rule-based detection for common patterns
    const messageLower = message.toLowerCase()
    
    // Hindi patterns - most common Hindi words and phrases
    if (messageLower.includes('kaise ho') || messageLower.includes('kese ho') || 
        messageLower.includes('bhai') || messageLower.includes('aap') ||
        messageLower.includes('kya hai') || messageLower.includes('batao') ||
        messageLower.includes('hindi mein') || messageLower.includes('indian language') ||
        /\b(kuch|kaam|time|project|complete)\b/.test(messageLower)) {
      return {
        detectedLanguage: 'hi',
        confidence: 0.95,
        translatedQuery: message, // Keep original for context
        culturalContext: ['casual', 'friendly'],
        preferredResponseLanguage: 'hi',
        needsTranslation: false
      }
    }
    
    // Nepali patterns - common Nepali words and phrases
    if (messageLower.includes('nepali') || messageLower.includes('nepalese') ||
        messageLower.includes('kasto cha') || messageLower.includes('ke cha') ||
        messageLower.includes('timro') || messageLower.includes('hajur') ||
        messageLower.includes('k xa') || messageLower.includes('k cha') ||
        messageLower.includes('thikai xa') || messageLower.includes('malai') ||
        messageLower.includes('timilai') || messageLower.includes('nepal') || 
        messageLower.includes('kathmandu')) {
      return {
        detectedLanguage: 'ne',
        confidence: 0.95,
        translatedQuery: message, // Keep original for context
        culturalContext: ['professional', 'nepali'],
        preferredResponseLanguage: 'ne',
        needsTranslation: false
      }
    }
    
    // Default to English
    return {
      detectedLanguage: 'en',
      confidence: 0.8,
      culturalContext: ['professional'],
      preferredResponseLanguage: 'en',
      needsTranslation: false
    }
    
  } catch (error) {
    console.error('Language detection failed:', error)
    return {
      detectedLanguage: 'en',
      confidence: 0.8,
      culturalContext: ['professional'],
      preferredResponseLanguage: 'en',
      needsTranslation: false
    }
  }
}

/**
 * Multi-Language Response Generation
 */
export async function generateMultiLanguageResponse(
  ragResult: any,
  languageContext: LanguageContext,
  originalMessage: string,
  sessionId: string = 'default-session',
  conversationHistory: any[] = []
): Promise<MultiLanguageRAGResult> {
  try {
    // Check for pre-built templates first for common phrases
    if (languageContext.detectedLanguage !== 'en') {
      const template = findConversationTemplate(originalMessage)
      if (template) {
        const templateResponse = getTemplateResponse(template, languageContext.detectedLanguage)
        if (templateResponse) {
          console.log('✅ Using natural language template')
          return {
            response: templateResponse,
            originalLanguage: languageContext.detectedLanguage,
            responseLanguage: languageContext.detectedLanguage,
            translationUsed: false,
            searchLanguage: languageContext.detectedLanguage,
            metadata: {
              languageDetection: languageContext,
              ragPattern: 'template_response',
              searchResults: 0,
              crossLanguageSearch: false,
              templateUsed: template.context
            }
          }
        }
      }
    }
    
    // Generate contextual response
    let finalResponse = ragResult.response
    let translationUsed = false

    if (languageContext.detectedLanguage !== 'en' && languageContext.confidence > 0.7) {
      console.log(`🌍 Generating ${languageContext.detectedLanguage} response`)
      
      let responsePrompt = ''
      
      if (languageContext.detectedLanguage === 'hi') {
        responsePrompt = `You are Sajal Basnet responding naturally to a friend in Hinglish.

User asked: "${originalMessage}"
Context: ${ragResult.response.substring(0, 200)}

Reply in natural Hinglish:
- Mix Hindi and English naturally
- Keep it short and friendly (1-2 sentences max)
- Use "main", "hun", "karta hun", "bhai" naturally  
- Don't be formal or robotic
- Match the casual tone

Response:`
        
      } else if (languageContext.detectedLanguage === 'ne') {
        responsePrompt = `You are Sajal Basnet responding in natural Nepali.

User asked: "${originalMessage}" 
Context: ${ragResult.response.substring(0, 200)}

Reply in natural Nepali:
- Use proper Nepali grammar
- Keep it conversational (1-2 sentences max)
- Use "ma", "chu", "garchu", "huncha" correctly
- Be friendly and natural

Response:`
      }
      
      if (responsePrompt) {
        const response = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: responsePrompt }],
          max_tokens: 150,
          temperature: 0.7,
        })

        const generatedText = response.choices[0].message.content
        if (generatedText) {
          finalResponse = cleanQuotes(generatedText.trim())
          translationUsed = true
        }
      }
    }

    return {
      response: finalResponse,
      originalLanguage: languageContext.detectedLanguage,
      responseLanguage: languageContext.detectedLanguage,
      translationUsed,
      searchLanguage: languageContext.detectedLanguage,
      metadata: {
        languageDetection: languageContext,
        ragPattern: ragResult.metadata?.ragPattern || 'unknown',
        searchResults: ragResult.metadata?.resultsFound || 0,
        crossLanguageSearch: languageContext.needsTranslation || false
      }
    }
  } catch (error) {
    console.error('Multi-language response generation failed:', error)
    return {
      response: ragResult.response,
      originalLanguage: 'en',
      responseLanguage: 'en',
      translationUsed: false,
      searchLanguage: 'en',
      metadata: {
        languageDetection: languageContext,
        ragPattern: ragResult.metadata?.ragPattern || 'unknown',
        searchResults: ragResult.metadata?.resultsFound || 0,
        crossLanguageSearch: false
      }
    }
  }
}

/**
 * Enhanced Query Processing for Multi-Language Support
 */
export async function processMultiLanguageQuery(
  message: string,
  contextEnhanced: any,
  sessionId: string
): Promise<{
  languageContext: LanguageContext
  selectedPattern: {
    pattern: 'advanced_agentic' | 'multi_hop' | 'hybrid_search' | 'tool_enhanced' | 'standard_agentic'
    searchQuery: string
    reasoning: string
  }
  enhancedQuery: string
}> {
  // Step 1: Detect language and context
  const languageContext = await detectLanguageContext(message)
  console.log(`🌍 Language detected: ${languageContext.detectedLanguage} (confidence: ${languageContext.confidence})`)

  // Step 2: Select appropriate RAG pattern
  const selectedPattern = {
    pattern: 'standard_agentic' as const,
    searchQuery: message,
    reasoning: `Standard agentic RAG for ${languageContext.detectedLanguage} query`
  }

  // Step 3: Enhance query for better search  
  const enhancedQuery = languageContext.needsTranslation ? 
    selectedPattern.searchQuery : message

  return {
    languageContext,
    selectedPattern,
    enhancedQuery
  }
}

/**
 * Smart Filtering for Multi-Language Results
 */
export async function applySmartFiltering(
  results: VectorResult[],
  languageContext: LanguageContext,
  originalQuery: string
): Promise<VectorResult[]> {
  if (results.length === 0) return results

  try {
    // For now, just return the top results
    // Can be enhanced with actual filtering logic later
    return results.slice(0, 5)
  } catch (error) {
    console.error('Smart filtering failed:', error)
    return results.slice(0, 5)
  }
}

/**
 * Clean up quotation marks and extra formatting
 */
function cleanQuotes(text: string): string {
  return text
    .replace(/^["'"\u201C\u201D\u2018\u2019]+|["'"\u201C\u201D\u2018\u2019]+$/g, '')
    .replace(/^"(.+)"$/s, '$1')
    .replace(/^'(.+)'$/s, '$1')
    .trim()
}