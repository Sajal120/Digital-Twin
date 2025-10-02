// Shared audio cache for phone system
export interface AudioCacheEntry {
  buffer: Buffer
  contentType: string
  text: string
  timestamp: number
  expires: number
}

// Simple in-memory cache (in production, use Redis or cloud storage)
class PhoneAudioCache {
  private cache = new Map<string, AudioCacheEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  set(audioId: string, entry: AudioCacheEntry): void {
    this.cache.set(audioId, entry)
    console.log(`📁 Cached audio: ${audioId} (${entry.buffer.length} bytes)`)
  }

  get(audioId: string): AudioCacheEntry | undefined {
    const entry = this.cache.get(audioId)

    if (entry && entry.expires < Date.now()) {
      this.cache.delete(audioId)
      console.log(`⏰ Auto-removed expired audio: ${audioId}`)
      return undefined
    }

    return entry
  }

  delete(audioId: string): boolean {
    return this.cache.delete(audioId)
  }

  cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, value] of this.cache.entries()) {
      if (value.expires < now) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`🗑️ Cleaned up ${cleanedCount} expired audio cache entries`)
    }
  }

  getStatus() {
    const now = Date.now()
    const active = Array.from(this.cache.values()).filter((entry) => entry.expires > now).length
    const expired = this.cache.size - active

    return {
      total: this.cache.size,
      active,
      expired,
      cacheIds: Array.from(this.cache.keys()).slice(0, 5), // Show first 5 for debugging
    }
  }

  clear(): void {
    this.cache.clear()
    console.log('🗑️ Cleared all audio cache')
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

// Singleton instance
export const phoneAudioCache = new PhoneAudioCache()

// Helper function to create phone audio URL
export function createPhoneAudioUrl(audioId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.sajal-app.online'
  return `${baseUrl}/api/phone/audio/${audioId}`
}
