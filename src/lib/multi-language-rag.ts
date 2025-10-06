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
import {
  findConversationTemplate,
  getTemplateResponse,
  getBasicResponse,
} from './natural-language-templates'
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

    console.log(`🔍 Detecting language for: "${message}"`)

    // MULTI-LANGUAGE DETECTION - Support for 20+ languages
    // Keywords that are distinctive to each language
    const languagePatterns = {
      hi: {
        name: 'Hindi',
        flag: '🇮🇳',
        keywords: [
          'kya',
          'kaam',
          'karte',
          'aap',
          'tum',
          'hai',
          'ho',
          'kaise',
          'kahan',
          'kaun',
          'batao',
          'mujhe',
          'mera',
          'tumhara',
          'kab',
          'kyun',
        ],
      },
      ne: {
        name: 'Nepali',
        flag: '🇳🇵',
        keywords: [
          'timro',
          'kun',
          'malai',
          'tapai',
          'huncha',
          'cha',
          'gareko',
          'garne',
          'kaha',
          'kahile',
          'kina',
        ],
      },
      zh: {
        name: 'Chinese',
        flag: '🇨🇳',
        keywords: [
          '你好',
          '你',
          '我',
          '是',
          '的',
          '什么',
          '怎么',
          '哪里',
          '谁',
          '为什么',
          'ni hao',
          'ni',
          'wo',
          'shi',
          'de',
          'shenme',
          'zenme',
        ],
      },
      es: {
        name: 'Spanish',
        flag: '🇪🇸',
        keywords: [
          'hola',
          'que',
          'como',
          'donde',
          'cuando',
          'por',
          'para',
          'tu',
          'yo',
          'el',
          'la',
          'gracias',
          'por favor',
          'habla',
          'hablas',
        ],
      },
      fr: {
        name: 'French',
        flag: '🇫🇷',
        keywords: [
          'bonjour',
          'comment',
          'quoi',
          'ou',
          'qui',
          'pourquoi',
          'tu',
          'vous',
          'je',
          'le',
          'la',
          'merci',
          'parle',
          'parlez',
        ],
      },
      tl: {
        name: 'Filipino/Tagalog',
        flag: '🇵🇭',
        keywords: [
          'kumusta',
          'ano',
          'paano',
          'saan',
          'sino',
          'bakit',
          'ikaw',
          'ako',
          'salamat',
          'trabaho',
          'gawa',
          'nag',
        ],
      },
      id: {
        name: 'Indonesian',
        flag: '🇮🇩',
        keywords: [
          'halo',
          'apa',
          'bagaimana',
          'dimana',
          'siapa',
          'mengapa',
          'kamu',
          'saya',
          'terima kasih',
          'kerja',
          'bekerja',
        ],
      },
      th: {
        name: 'Thai',
        flag: '🇹🇭',
        keywords: [
          'สวัสดี',
          'คุณ',
          'ฉัน',
          'อะไร',
          'ที่ไหน',
          'ทำไม',
          'sawasdee',
          'khun',
          'chan',
          'arai',
          'tee nai',
          'tam mai',
        ],
      },
      vi: {
        name: 'Vietnamese',
        flag: '🇻🇳',
        keywords: [
          'xin chào',
          'bạn',
          'tôi',
          'gì',
          'ở đâu',
          'tại sao',
          'làm',
          'việc',
          'cảm ơn',
          'xin',
          'chao',
        ],
      },
      ar: {
        name: 'Arabic',
        flag: '🇸🇦',
        keywords: [
          'مرحبا',
          'أنت',
          'أنا',
          'ماذا',
          'أين',
          'لماذا',
          'marhaba',
          'anta',
          'ana',
          'madha',
          'ayna',
          'limadha',
        ],
      },
      ja: {
        name: 'Japanese',
        flag: '🇯🇵',
        keywords: [
          'こんにちは',
          'あなた',
          '私',
          '何',
          'どこ',
          'なぜ',
          'konnichiwa',
          'anata',
          'watashi',
          'nani',
          'doko',
          'naze',
        ],
      },
      ko: {
        name: 'Korean',
        flag: '🇰🇷',
        keywords: [
          '안녕하세요',
          '당신',
          '나',
          '무엇',
          '어디',
          '왜',
          'annyeong',
          'dangsin',
          'na',
          'mueot',
          'eodi',
          'wae',
        ],
      },
      pt: {
        name: 'Portuguese',
        flag: '🇧🇷',
        keywords: [
          'ola',
          'olá',
          'como',
          'que',
          'onde',
          'quando',
          'por',
          'tu',
          'voce',
          'você',
          'eu',
          'obrigado',
          'fala',
        ],
      },
      ru: {
        name: 'Russian',
        flag: '🇷🇺',
        keywords: [
          'привет',
          'ты',
          'я',
          'что',
          'где',
          'почему',
          'privet',
          'ty',
          'ya',
          'chto',
          'gde',
          'pochemu',
        ],
      },
      de: {
        name: 'German',
        flag: '��',
        keywords: [
          'hallo',
          'wie',
          'was',
          'wo',
          'wer',
          'warum',
          'du',
          'ich',
          'danke',
          'sprechen',
          'sprichst',
        ],
      },
      it: {
        name: 'Italian',
        flag: '🇮🇹',
        keywords: [
          'ciao',
          'come',
          'cosa',
          'dove',
          'chi',
          'perche',
          'tu',
          'io',
          'grazie',
          'parla',
          'parli',
        ],
      },
    }

    // Check each language for keyword matches
    let bestMatch = { lang: 'en', count: 0, name: 'English', flag: '🇬🇧' }

    for (const [langCode, langData] of Object.entries(languagePatterns)) {
      const matches = langData.keywords.filter((keyword) =>
        messageLower.includes(keyword.toLowerCase()),
      ).length

      if (matches > bestMatch.count) {
        bestMatch = { lang: langCode, count: matches, name: langData.name, flag: langData.flag }
      }
    }

    // Require at least 2 matches for short messages, 1 match for longer messages
    const wordCount = message.split(/\s+/).length
    const requiredMatches = wordCount >= 10 ? 1 : 2

    if (bestMatch.count >= requiredMatches) {
      console.log(
        `${bestMatch.flag} ${bestMatch.name} detected: ${bestMatch.count} keywords matched (required: ${requiredMatches})`,
      )
      return {
        detectedLanguage: bestMatch.lang,
        confidence: 0.95,
        translatedQuery: message,
        culturalContext: ['friendly'],
        preferredResponseLanguage: bestMatch.lang,
        needsTranslation: false,
      }
    }

    // Default to English if no language detected
    console.log(`🇬🇧 English detected (default) - no Hindi/Nepali patterns found`)
    return {
      detectedLanguage: 'en',
      confidence: 0.8,
      culturalContext: ['professional'],
      preferredResponseLanguage: 'en',
      needsTranslation: false,
    }
  } catch (error) {
    console.error('Language detection failed:', error)
    return {
      detectedLanguage: 'en',
      confidence: 0.8,
      culturalContext: ['professional'],
      preferredResponseLanguage: 'en',
      needsTranslation: false,
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
  conversationHistory: any[] = [],
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
              templateUsed: template.context,
            },
          }
        }
      }
    }

    // Generate contextual response
    let finalResponse = ragResult.response
    let translationUsed = false

    if (languageContext.detectedLanguage !== 'en' && languageContext.confidence > 0.7) {
      console.log(`🌍 Generating ${languageContext.detectedLanguage} response`)

      const languageNames: Record<string, string> = {
        hi: 'Hindi/Hinglish',
        ne: 'Nepali',
        zh: 'Chinese (Mandarin)',
        es: 'Spanish',
        fr: 'French',
        tl: 'Filipino/Tagalog',
        id: 'Indonesian',
        th: 'Thai',
        vi: 'Vietnamese',
        ar: 'Arabic',
        ja: 'Japanese',
        ko: 'Korean',
        pt: 'Portuguese',
        ru: 'Russian',
        de: 'German',
        it: 'Italian',
      }

      const langName =
        languageNames[languageContext.detectedLanguage] || languageContext.detectedLanguage

      const responsePrompt = `You are Sajal Basnet (software developer with Masters from Swinburne University, Sydney) responding to someone in ${langName}.

User asked: "${originalMessage}"
Context: ${ragResult.response.substring(0, 200)}

Reply in natural ${langName}:
- Keep it conversational and friendly (1-2 sentences max)
- Use natural grammar and common phrases
- Be professional but warm
- Answer the question directly

Response:`

      try {
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
      } catch (error) {
        console.error(`Error generating ${langName} response:`, error)
        // Fallback to English if translation fails
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
        crossLanguageSearch: languageContext.needsTranslation || false,
      },
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
        crossLanguageSearch: false,
      },
    }
  }
}

/**
 * Enhanced Query Processing for Multi-Language Support
 */
export async function processMultiLanguageQuery(
  message: string,
  contextEnhanced: any,
  sessionId: string,
): Promise<{
  languageContext: LanguageContext
  selectedPattern: {
    pattern:
      | 'advanced_agentic'
      | 'multi_hop'
      | 'hybrid_search'
      | 'tool_enhanced'
      | 'standard_agentic'
    searchQuery: string
    reasoning: string
  }
  enhancedQuery: string
}> {
  // Step 1: Detect language and context
  const languageContext = await detectLanguageContext(message)
  console.log(
    `🌍 Language detected: ${languageContext.detectedLanguage} (confidence: ${languageContext.confidence})`,
  )

  // Step 2: Select appropriate RAG pattern
  const selectedPattern = {
    pattern: 'standard_agentic' as const,
    searchQuery: message,
    reasoning: `Standard agentic RAG for ${languageContext.detectedLanguage} query`,
  }

  // Step 3: Enhance query for better search
  const enhancedQuery = languageContext.needsTranslation ? selectedPattern.searchQuery : message

  return {
    languageContext,
    selectedPattern,
    enhancedQuery,
  }
}

/**
 * Smart Filtering for Multi-Language Results
 */
export async function applySmartFiltering(
  results: VectorResult[],
  languageContext: LanguageContext,
  originalQuery: string,
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
