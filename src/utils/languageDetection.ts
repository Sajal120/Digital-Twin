// Language Detection Utility for Voice Cloning
export interface LanguageDetectionResult {
  language: string
  confidence: number
  script?: string
}

interface LanguageConfig {
  patterns: RegExp[]
  chars: RegExp
  commonWords?: string[]
  script?: string
}

export class LanguageDetector {
  private static languagePatterns: Record<string, LanguageConfig> = {
    // Latin-based languages
    en: {
      patterns: [/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi],
      chars: /^[a-zA-Z\s.,!?;:'"()-]*$/,
      commonWords: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
    },
    es: {
      patterns: [/\b(el|la|los|las|y|o|pero|en|con|de|para|por)\b/gi],
      chars: /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s.,!?;:'"()-]*$/,
      commonWords: ['el', 'la', 'los', 'las', 'y', 'o', 'pero', 'en', 'con', 'de'],
    },
    fr: {
      patterns: [/\b(le|la|les|et|ou|mais|dans|avec|de|pour|par)\b/gi],
      chars: /^[a-zA-ZàáâäçéèêëïîôùûüÿÀÁÂÄÇÉÈÊËÏÎÔÙÛÜŸ\s.,!?;:'"()-]*$/,
      commonWords: ['le', 'la', 'les', 'et', 'ou', 'mais', 'dans', 'avec', 'de'],
    },
    de: {
      patterns: [/\b(der|die|das|und|oder|aber|in|mit|von|für|bei)\b/gi],
      chars: /^[a-zA-ZäöüßÄÖÜ\s.,!?;:'"()-]*$/,
      commonWords: ['der', 'die', 'das', 'und', 'oder', 'aber', 'in', 'mit', 'von'],
    },

    // Script-based languages
    hi: {
      patterns: [/[\u0900-\u097F]/g], // Devanagari script
      chars: /[\u0900-\u097F]/,
      script: 'devanagari',
    },
    ne: {
      patterns: [/[\u0900-\u097F]/g], // Devanagari script (same as Hindi)
      chars: /[\u0900-\u097F]/,
      script: 'devanagari',
      commonWords: ['र', 'छ', 'हो', 'को', 'मा', 'ले', 'लाई', 'बाट'],
    },
    zh: {
      patterns: [/[\u4E00-\u9FFF]/g], // Chinese characters
      chars: /[\u4E00-\u9FFF]/,
      script: 'chinese',
    },
    ja: {
      patterns: [/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g], // Hiragana, Katakana, Kanji
      chars: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
      script: 'japanese',
    },
    ko: {
      patterns: [/[\uAC00-\uD7AF]/g], // Hangul
      chars: /[\uAC00-\uD7AF]/,
      script: 'korean',
    },
    ar: {
      patterns: [/[\u0600-\u06FF]/g], // Arabic script
      chars: /[\u0600-\u06FF]/,
      script: 'arabic',
    },
    ru: {
      patterns: [/[\u0400-\u04FF]/g], // Cyrillic script
      chars: /[\u0400-\u04FF]/,
      script: 'cyrillic',
    },
  }

  static detect(text: string): LanguageDetectionResult {
    const cleanText = text.trim().toLowerCase()

    if (!cleanText) {
      return { language: 'en', confidence: 0 }
    }

    const results: Array<{ lang: string; score: number; confidence: number }> = []

    // Check each language
    for (const [lang, config] of Object.entries(this.languagePatterns)) {
      let score = 0
      let matches = 0

      // Script-based detection (high confidence)
      if (config.script) {
        const scriptMatches = (text.match(config.patterns[0]) || []).length
        if (scriptMatches > 0) {
          score += scriptMatches * 10
          matches += scriptMatches

          // Special handling for Nepali vs Hindi
          if (lang === 'ne' && config.commonWords) {
            const nepaliWords = config.commonWords.filter((word: string) =>
              cleanText.includes(word),
            ).length
            score += nepaliWords * 5
          }
        }
      }

      // Pattern-based detection (medium confidence)
      else if (config.patterns) {
        for (const pattern of config.patterns) {
          const patternMatches = (cleanText.match(pattern) || []).length
          score += patternMatches * 3
          matches += patternMatches
        }
      }

      // Common words detection (high confidence for Latin scripts)
      if (config.commonWords && !config.script) {
        const wordMatches = config.commonWords.filter((word: string) =>
          cleanText.includes(word.toLowerCase()),
        ).length
        score += wordMatches * 5
        matches += wordMatches
      }

      if (score > 0) {
        const confidence = Math.min((score / text.length) * 100, 100)
        results.push({ lang, score, confidence })
      }
    }

    // Sort by score and get the best match
    results.sort((a, b) => b.score - a.score)

    if (results.length === 0) {
      return { language: 'en', confidence: 50 } // Default to English
    }

    const best = results[0]
    const config = this.languagePatterns[best.lang]

    return {
      language: best.lang,
      confidence: Math.min(best.confidence, 95),
      script: config?.script,
    }
  }

  static getModelForLanguage(language: string): string {
    // English works better with monolingual model
    if (language === 'en') {
      return 'eleven_monolingual_v1'
    }

    // All other languages require multilingual model
    return 'eleven_multilingual_v1'
  }

  static getSupportedLanguages(): string[] {
    return Object.keys(this.languagePatterns)
  }

  static isLanguageSupported(language: string): boolean {
    return language in this.languagePatterns
  }
}

// Utility functions for easy import
export const detectLanguage = (text: string) => LanguageDetector.detect(text)
export const getModelForLanguage = (language: string) =>
  LanguageDetector.getModelForLanguage(language)
export const getSupportedLanguages = () => LanguageDetector.getSupportedLanguages()
export const isLanguageSupported = (language: string) =>
  LanguageDetector.isLanguageSupported(language)
