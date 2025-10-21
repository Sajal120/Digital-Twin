// Voice Service - Handles different TTS providers including voice cloning
export type VoiceProvider = 'openai' | 'cartesia' | 'murf' | 'resemble'

export interface VoiceConfig {
  provider: VoiceProvider
  voiceId?: string // For cloned voices
  stability?: number // ElevenLabs specific
  similarityBoost?: number // ElevenLabs specific
  speed?: number // OpenAI specific
}

export class VoiceService {
  private static instance: VoiceService
  private defaultConfig: VoiceConfig

  constructor() {
    this.defaultConfig = {
      provider: 'cartesia', // Default to Cartesia for voice cloning
      voiceId: process.env.CARTESIA_VOICE_ID || '', // Your cloned voice ID
      stability: 0.5,
      similarityBoost: 0.8,
    }
  }

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService()
    }
    return VoiceService.instance
  }

  async generateSpeech(text: string, config?: Partial<VoiceConfig>): Promise<ArrayBuffer> {
    const finalConfig = { ...this.defaultConfig, ...config }

    switch (finalConfig.provider) {
      case 'cartesia':
        return this.generateCartesiaSpeech(text, finalConfig)
      case 'openai':
        return this.generateOpenAISpeech(text, finalConfig)
      default:
        throw new Error(`Unsupported voice provider: ${finalConfig.provider}`)
    }
  }

  private async generateCartesiaSpeech(text: string, config: VoiceConfig): Promise<ArrayBuffer> {
    const response = await fetch('/api/voice/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        provider: 'cartesia',
        voice: config.voiceId,
        language: 'auto',
      }),
    })

    if (!response.ok) {
      throw new Error(`Cartesia TTS failed: ${response.statusText}`)
    }

    return response.arrayBuffer()
  }

  private async generateOpenAISpeech(text: string, config: VoiceConfig): Promise<ArrayBuffer> {
    const response = await fetch('/api/voice/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: 'alloy', // OpenAI voice
        speed: config.speed || 1.0,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI TTS failed: ${response.statusText}`)
    }

    return response.arrayBuffer()
  }

  // Set your cloned voice ID
  setClonedVoiceId(voiceId: string) {
    this.defaultConfig.voiceId = voiceId
  }

  // Switch between providers
  setProvider(provider: VoiceProvider) {
    this.defaultConfig.provider = provider
  }

  // Get current config
  getConfig(): VoiceConfig {
    return { ...this.defaultConfig }
  }
}

export const voiceService = VoiceService.getInstance()
