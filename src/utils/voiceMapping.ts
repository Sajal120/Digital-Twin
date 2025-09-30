// Voice ID mapping for different languages
export interface VoiceMapping {
  [language: string]: string
}

export class VoiceMapper {
  private static voiceMapping: VoiceMapping = {
    en: process.env.ELEVENLABS_VOICE_ID_ENGLISH || process.env.ELEVENLABS_VOICE_ID || '',
    ne: process.env.ELEVENLABS_VOICE_ID_NEPALI || process.env.ELEVENLABS_VOICE_ID || '',
    hi: process.env.ELEVENLABS_VOICE_ID_HINDI || process.env.ELEVENLABS_VOICE_ID || '',
    es: process.env.ELEVENLABS_VOICE_ID_SPANISH || process.env.ELEVENLABS_VOICE_ID || '',
    zh: process.env.ELEVENLABS_VOICE_ID_CHINESE || process.env.ELEVENLABS_VOICE_ID || '',
  }

  static getVoiceIdForLanguage(language: string): string {
    // Get specific voice ID for language, fallback to default
    const voiceId =
      this.voiceMapping[language] ||
      this.voiceMapping['en'] ||
      process.env.ELEVENLABS_VOICE_ID ||
      ''

    if (!voiceId) {
      throw new Error(`No voice ID configured for language: ${language}`)
    }

    return voiceId
  }

  static getSupportedLanguages(): string[] {
    return Object.keys(this.voiceMapping).filter((lang) => this.voiceMapping[lang])
  }

  static isLanguageSupported(language: string): boolean {
    return language in this.voiceMapping && !!this.voiceMapping[language]
  }

  static getAllVoiceIds(): VoiceMapping {
    return { ...this.voiceMapping }
  }

  // Update voice mapping (useful for runtime configuration)
  static updateVoiceMapping(language: string, voiceId: string): void {
    this.voiceMapping[language] = voiceId
  }
}

// Utility functions for easy import
export const getVoiceIdForLanguage = (language: string) =>
  VoiceMapper.getVoiceIdForLanguage(language)
export const getSupportedVoiceLanguages = () => VoiceMapper.getSupportedLanguages()
export const isVoiceLanguageSupported = (language: string) =>
  VoiceMapper.isLanguageSupported(language)
