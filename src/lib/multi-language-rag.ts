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
export async function detectLanguageContext(
  message: string,
  deepgramHint?: string,
): Promise<LanguageContext> {
  try {
    // Quick rule-based detection for common patterns
    const messageLower = message.toLowerCase()

    console.log(`🔍 Detecting language for: "${message}"`)
    if (deepgramHint) {
      console.log(`🎙️ Deepgram detected: ${deepgramHint}`)
    }

    // MULTI-LANGUAGE DETECTION - Support for 20+ languages
    // Keywords that are distinctive to each language
    const languagePatterns = {
      hi: {
        name: 'Hindi',
        flag: '🇮🇳',
        keywords: [
          // Romanized
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
          // Devanagari (for Deepgram transcripts)
          'क्या',
          'काम',
          'करते',
          'आप',
          'तुम',
          'है',
          'हो',
          'कैसे',
          'कहां',
          'कौन',
          'बताओ',
          'मुझे',
          'मेरा',
          'तुम्हारा',
          'कब',
          'क्यों',
          'कर',
          'रहे',
          'खाना',
          'खा',
          'लिया',
          'अच्छा',
          'तुमने',
        ],
      },
      ne: {
        name: 'Nepali',
        flag: '🇳🇵',
        keywords: [
          // Common greetings
          'namaste',
          'namaskar',
          'dhanyabad',
          'dhanyabād',
          // Question words
          'kun',
          'ke',
          'kasto',
          'kahā',
          'kaha',
          'kahile',
          'kati',
          'kina',
          'kasari',
          'kasle',
          'kasko',
          // Pronouns
          'ma',
          'malai',
          'mero',
          'timro',
          'tapai',
          'tapāī',
          'timi',
          'u',
          'usko',
          'hamilai',
          'hami',
          // Verbs (common)
          'cha',
          'chha',
          'छ',
          'huncha',
          'हुन्छ',
          'thiyo',
          'थियो',
          'garnu',
          'garne',
          'gareko',
          'garchan',
          'garchha',
          'गर्छ',
          'bhayo',
          'भयो',
          'bhanne',
          'भन्ने',
          'āunu',
          'aunu',
          'jānu',
          'janu',
          'khānu',
          'khanu',
          'piunu',
          // Common words
          'ramro',
          'राम्रो',
          'sanchai',
          'सञ्चै',
          'thik',
          'ठिक',
          'hajur',
          'होइन',
          'hoina',
          'haina',
          'ho',
          'हो',
          'chaina',
          'छैन',
          'pardaina',
          'पर्दैन',
          'sāth',
          'sath',
          'साथ',
          // Conversational
          'kasto chha',
          'kasto cha',
          'k cha',
          'k chha',
          'ramro chha',
          'thik chha',
          'thikka cha',
          'sanchai chu',
          'tapai lai',
          'malai lai',
          // Common phrases
          'bujhe',
          'bujhnu bhayo',
          'dekhna',
          'sunna',
          'bolna',
          'bolnu',
          'garna',
          'पनि',
          'pani',
          'मात्र',
          'matra',
          'अलि',
          'ali',
          'ekdam',
          'एकदम',
        ],
      },
      zh: {
        name: 'Chinese',
        flag: '🇨🇳',
        keywords: [
          // Common characters
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
          '做',
          '工作',
          '吗',
          '呢',
          '在',
          '有',
          '没有',
          '可以',
          '能',
          '会',
          '要',
          '想',
          '说',
          '吃',
          '喝',
          '去',
          '来',
          '谢谢',
          '对',
          '不',
          // Romanized
          'ni hao',
          'ni',
          'wo',
          'shi',
          'de',
          'shenme',
          'zenme',
          'zuo',
          'gongzuo',
        ],
      },
      es: {
        name: 'Spanish',
        flag: '🇪🇸',
        keywords: [
          'hola',
          'que',
          'qué',
          'como',
          'cómo',
          'estas',
          'estás',
          'donde',
          'dónde',
          'cuando',
          'cuándo',
          'por',
          'para',
          'tu',
          'tú',
          'yo',
          'el',
          'la',
          'usted',
          'gracias',
          'por favor',
          'habla',
          'hablas',
          'eres',
          'soy',
          'bien',
          'mal',
          'trabajo',
          'hacer',
          'haces',
          'si',
          'sí',
          'no',
          'bueno',
          'malo',
          'comer',
          'beber',
          'ir',
          'venir',
          'puedo',
          'puede',
          'quiero',
        ],
      },
      fr: {
        name: 'French',
        flag: '🇫🇷',
        keywords: [
          'bonjour',
          'salut',
          'comment',
          'quoi',
          'ou',
          'où',
          'qui',
          'pourquoi',
          'quand',
          'comment',
          'tu',
          'vous',
          'je',
          'moi',
          'le',
          'la',
          'merci',
          'parle',
          'parlez',
          'travail',
          'travailler',
          'faire',
          'fais',
          'faites',
          'oui',
          'non',
          'bien',
          'mal',
          "s'il vous plaît",
          'sil vous plait',
          'manger',
          'boire',
          'aller',
          'venir',
          'peux',
          'peut',
          'veux',
          'être',
          'suis',
          'es',
          'est',
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
          // Thai script
          'สวัสดี',
          'คุณ',
          'ฉัน',
          'อะไร',
          'ที่ไหน',
          'ทำไม',
          'ทำงาน',
          'อย่างไร',
          'เมื่อไหร่',
          'ใคร',
          'ได้',
          'ไม่',
          'มี',
          'เป็น',
          'ขอบคุณ',
          'ครับ',
          'ค่ะ',
          'ดี',
          'สบายดี',
          'กิน',
          'ดื่ม',
          // Romanized
          'sawasdee',
          'khun',
          'chan',
          'arai',
          'tee nai',
          'tam mai',
          'tamngan',
          'yangrai',
        ],
      },
      vi: {
        name: 'Vietnamese',
        flag: '🇻🇳',
        keywords: [
          'xin chào',
          'chào',
          'bạn',
          'tôi',
          'gì',
          'ở đâu',
          'đâu',
          'tại sao',
          'sao',
          'làm',
          'việc',
          'làm việc',
          'cảm ơn',
          'xin',
          'thế nào',
          'như thế nào',
          'khi nào',
          'ai',
          'có',
          'không',
          'được',
          'là',
          'ăn',
          'uống',
          'đi',
          'đến',
          'tốt',
          'khỏe',
          // Without tones (for text input)
          'chao',
          'ban',
          'toi',
          'cam on',
        ],
      },
      ar: {
        name: 'Arabic',
        flag: '🇸🇦',
        keywords: [
          // Arabic script
          'مرحبا',
          'السلام',
          'أنت',
          'أنا',
          'ماذا',
          'أين',
          'لماذا',
          'كيف',
          'متى',
          'من',
          'عمل',
          'العمل',
          'شغل',
          'هل',
          'نعم',
          'لا',
          'شكرا',
          'شكراً',
          'تشرفنا',
          'جيد',
          'طيب',
          'تمام',
          'أكل',
          'شرب',
          // Romanized
          'marhaba',
          'salam',
          'anta',
          'ana',
          'madha',
          'ayna',
          'limadha',
          'kayf',
          'mata',
          'man',
        ],
      },
      ja: {
        name: 'Japanese',
        flag: '🇯🇵',
        keywords: [
          // Hiragana/Katakana
          'こんにちは',
          'おはよう',
          'あなた',
          '私',
          '何',
          'どこ',
          'なぜ',
          'どう',
          'どうやって',
          'いつ',
          'だれ',
          '誰',
          '仕事',
          '働く',
          'です',
          'ます',
          'ありがとう',
          'はい',
          'いいえ',
          'わかりました',
          '食べる',
          '飲む',
          '行く',
          '来る',
          'よい',
          'いい',
          // Romanized
          'konnichiwa',
          'ohayo',
          'anata',
          'watashi',
          'nani',
          'doko',
          'naze',
          'dou',
          'itsu',
          'dare',
        ],
      },
      ko: {
        name: 'Korean',
        flag: '🇰🇷',
        keywords: [
          // Hangul
          '안녕하세요',
          '안녕',
          '당신',
          '나',
          '저',
          '무엇',
          '뭐',
          '어디',
          '왜',
          '어떻게',
          '언제',
          '누구',
          '일',
          '일하다',
          '하다',
          '있다',
          '없다',
          '감사합니다',
          '고맙습니다',
          '네',
          '아니요',
          '좋아요',
          '좋다',
          '먹다',
          '마시다',
          '가다',
          '오다',
          // Romanized
          'annyeong',
          'annyeonghaseyo',
          'dangsin',
          'na',
          'jeo',
          'mueot',
          'mwo',
          'eodi',
          'wae',
          'eotteoke',
          'eonje',
          'nugu',
        ],
      },
      pt: {
        name: 'Portuguese',
        flag: '🇧🇷',
        keywords: [
          'ola',
          'olá',
          'oi',
          'como',
          'que',
          'quê',
          'onde',
          'quando',
          'por',
          'porquê',
          'porque',
          'tu',
          'voce',
          'você',
          'eu',
          'obrigado',
          'obrigada',
          'fala',
          'falar',
          'trabalho',
          'trabalhar',
          'fazer',
          'faz',
          'sim',
          'não',
          'nao',
          'bem',
          'mal',
          'bom',
          'ruim',
          'comer',
          'beber',
          'ir',
          'vir',
          'posso',
          'pode',
          'quero',
          'está',
          'esta',
          'ser',
        ],
      },
      ru: {
        name: 'Russian',
        flag: '🇷🇺',
        keywords: [
          // Cyrillic
          'привет',
          'здравствуйте',
          'ты',
          'вы',
          'я',
          'что',
          'где',
          'почему',
          'как',
          'когда',
          'кто',
          'работа',
          'работать',
          'делать',
          'да',
          'нет',
          'спасибо',
          'хорошо',
          'плохо',
          'есть',
          'пить',
          'идти',
          'быть',
          'можно',
          'нужно',
          // Romanized
          'privet',
          'zdravstvuyte',
          'ty',
          'vy',
          'ya',
          'chto',
          'gde',
          'pochemu',
          'kak',
          'kogda',
          'kto',
        ],
      },
      de: {
        name: 'German',
        flag: '🇩🇪',
        keywords: [
          'hallo',
          'guten tag',
          'wie',
          'was',
          'wo',
          'wer',
          'warum',
          'wann',
          'du',
          'sie',
          'ich',
          'danke',
          'bitte',
          'arbeit',
          'arbeiten',
          'machen',
          'machst',
          'ja',
          'nein',
          'gut',
          'schlecht',
          'essen',
          'trinken',
          'gehen',
          'kommen',
          'kann',
          'möchte',
          'sein',
          'bin',
          'bist',
          'ist',
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

    // If Deepgram detected a non-English language, use it as a strong hint
    if (deepgramHint && deepgramHint !== 'en' && deepgramHint !== 'unknown') {
      // Map Deepgram language codes to our codes
      const deepgramLangMap: Record<string, string> = {
        es: 'es',
        'es-419': 'es',
        'es-ES': 'es',
        zh: 'zh',
        'zh-CN': 'zh',
        'zh-TW': 'zh',
        hi: 'hi',
        'hi-IN': 'hi',
        ne: 'ne',
        'ne-NP': 'ne',
        fr: 'fr',
        'fr-FR': 'fr',
        fil: 'fil',
        'fil-PH': 'fil',
        id: 'id',
        'id-ID': 'id',
        th: 'th',
        'th-TH': 'th',
        vi: 'vi',
        'vi-VN': 'vi',
        ar: 'ar',
        'ar-SA': 'ar',
        ja: 'ja',
        'ja-JP': 'ja',
        ko: 'ko',
        'ko-KR': 'ko',
        pt: 'pt',
        'pt-BR': 'pt',
        'pt-PT': 'pt',
        ru: 'ru',
        'ru-RU': 'ru',
        de: 'de',
        'de-DE': 'de',
        it: 'it',
        'it-IT': 'it',
      }

      const mappedLang = deepgramLangMap[deepgramHint] || deepgramHint

      // SPECIAL CASE: If Deepgram says Hindi, check if it's actually Nepali
      // (Deepgram doesn't support Nepali, so it transcribes as Hindi)
      if (mappedLang === 'hi' || deepgramHint === 'hi-IN') {
        console.log("🔍 Deepgram detected Hindi, checking if it's actually Nepali...")

        // Check for Nepali-specific keywords
        const nepaliKeywords = languagePatterns.ne.keywords
        const nepaliMatches = nepaliKeywords.filter((keyword) => {
          const keywordLower = keyword.toLowerCase()
          if (keywordLower.includes(' ')) {
            return messageLower.includes(keywordLower)
          }
          const wordBoundaryRegex = new RegExp(`\\b${keywordLower}\\b`, 'i')
          return wordBoundaryRegex.test(message)
        }).length

        // Check for Hindi-specific keywords
        const hindiKeywords = languagePatterns.hi.keywords
        const hindiMatches = hindiKeywords.filter((keyword) => {
          const keywordLower = keyword.toLowerCase()
          if (keywordLower.includes(' ')) {
            return messageLower.includes(keywordLower)
          }
          const wordBoundaryRegex = new RegExp(`\\b${keywordLower}\\b`, 'i')
          return wordBoundaryRegex.test(message)
        }).length

        console.log(`  📊 Nepali keywords: ${nepaliMatches}, Hindi keywords: ${hindiMatches}`)

        // If more Nepali keywords than Hindi, it's Nepali!
        if (nepaliMatches > hindiMatches && nepaliMatches >= 1) {
          console.log('🇳🇵 Actually Nepali! (Deepgram transcribed as Hindi)')
          return {
            detectedLanguage: 'ne',
            confidence: 0.95,
            translatedQuery: message,
            culturalContext: ['friendly'],
            preferredResponseLanguage: 'ne',
            needsTranslation: false,
          }
        }
      }

      const langData = languagePatterns[mappedLang as keyof typeof languagePatterns]

      if (langData) {
        // VERIFICATION: Double-check Deepgram's detection against text patterns
        // This prevents misdetections like Spanish being detected as Russian
        console.log(`🔍 Verifying Deepgram's ${deepgramHint} detection against text patterns...`)

        // Count keyword matches for Deepgram's detected language
        const deepgramMatches = langData.keywords.filter((keyword) => {
          const keywordLower = keyword.toLowerCase()
          // For multi-word keywords, use simple substring match
          if (keywordLower.includes(' ')) {
            return messageLower.includes(keywordLower)
          }
          // For single words, use word boundary regex
          const wordBoundaryRegex = new RegExp(`\\b${keywordLower}\\b`, 'i')
          return wordBoundaryRegex.test(message)
        }).length

        // Check if ANY other language has MORE matches
        let strongerMatch = null
        for (const [langCode, otherLangData] of Object.entries(languagePatterns)) {
          if (langCode === mappedLang) continue // Skip Deepgram's language

          const otherMatches = otherLangData.keywords.filter((keyword) => {
            const keywordLower = keyword.toLowerCase()
            // For multi-word keywords, use simple substring match
            if (keywordLower.includes(' ')) {
              return messageLower.includes(keywordLower)
            }
            // For single words, use word boundary regex
            const wordBoundaryRegex = new RegExp(`\\b${keywordLower}\\b`, 'i')
            return wordBoundaryRegex.test(message)
          }).length

          // If another language has significantly more matches, it's likely the correct one
          if (otherMatches > deepgramMatches && otherMatches >= 2) {
            strongerMatch = { lang: langCode, data: otherLangData, matches: otherMatches }
            break
          }
        }

        if (strongerMatch) {
          console.log(
            `⚠️ Text patterns suggest ${strongerMatch.data.flag} ${strongerMatch.data.name} (${strongerMatch.matches} matches) instead of ${langData.flag} ${langData.name} (${deepgramMatches} matches)`,
          )
          console.log(`🔄 Overriding Deepgram's detection: ${deepgramHint} → ${strongerMatch.lang}`)
          return {
            detectedLanguage: strongerMatch.lang,
            confidence: 0.9, // High confidence from text pattern override
            translatedQuery: message,
            culturalContext: ['friendly'],
            preferredResponseLanguage: strongerMatch.lang,
            needsTranslation: false,
          }
        }

        console.log(
          `✅ Deepgram detection verified: ${langData.flag} ${langData.name} (${deepgramMatches} text matches)`,
        )
        return {
          detectedLanguage: mappedLang,
          confidence: 0.98, // High confidence from Deepgram
          translatedQuery: message,
          culturalContext: ['friendly'],
          preferredResponseLanguage: mappedLang,
          needsTranslation: false,
        }
      }
    }

    for (const [langCode, langData] of Object.entries(languagePatterns)) {
      const matches = langData.keywords.filter((keyword) => {
        // Use whole-word matching to avoid false positives (e.g., "me" in "tell me", "el" in "tell")
        const keywordLower = keyword.toLowerCase()
        // For multi-word keywords (like "por favor"), use simple substring match
        if (keywordLower.includes(' ')) {
          return messageLower.includes(keywordLower)
        }
        // For single words, use word boundary regex to match whole words only
        const wordBoundaryRegex = new RegExp(`\\b${keywordLower}\\b`, 'i')
        return wordBoundaryRegex.test(message)
      }).length

      if (matches > bestMatch.count) {
        bestMatch = { lang: langCode, count: matches, name: langData.name, flag: langData.flag }
      }
    }

    // Require at least 2 matches for short messages (< 10 words), 1 match for longer messages
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
        // AGGRESSIVE TIMEOUT for translation (2s max!)
        const translationPromise = groq.chat.completions.create({
          model: 'llama-3.1-8b-instant', // Fast model
          messages: [{ role: 'user', content: responsePrompt }],
          max_tokens: 100, // Reduced from 150 for speed
          temperature: 0.5, // Lower for faster generation
        })

        const response = await Promise.race([
          translationPromise,
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Groq translation timeout 2s')), 2000),
          ),
        ])

        const generatedText = response.choices[0].message.content
        if (generatedText) {
          finalResponse = cleanQuotes(generatedText.trim())
          translationUsed = true
          console.log(`✅ ${langName} translation completed`)
        }
      } catch (error) {
        console.error(`⚠️ ${langName} translation timeout/failed, using English:`, error)
        // Fallback to English if translation fails or times out
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
