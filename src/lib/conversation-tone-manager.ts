/**
 * Conversation Tone and Context Manager
 * ===================================
 * 
 * Manages conversation tone consistency and context switching
 * to prevent jarring transitions between formal and casual responses
 */

import { ConversationContext } from './conversation-context'

export interface ToneContext {
  currentTone: 'casual' | 'professional' | 'friendly' | 'technical'
  language: 'en' | 'hi' | 'ne' | 'mixed'
  relationship: 'friend' | 'interviewer' | 'colleague' | 'stranger'
  conversationStage: 'greeting' | 'discussion' | 'deep_dive' | 'wrap_up'
  userPersonality: 'formal' | 'casual' | 'mixed'
}

export class ConversationToneManager {
  private toneHistory = new Map<string, ToneContext[]>()
  
  /**
   * Analyze user message to determine appropriate tone
   */
  analyzeUserTone(message: string, conversationHistory: any[] = []): ToneContext {
    const messageLower = message.toLowerCase()
    
    // Language detection
    let language: ToneContext['language'] = 'en'
    if (/\b(bhai|kaise|kese|aap|hai|kar|time|project|complete)\b/.test(messageLower)) {
      language = messageLower.includes('english') || messageLower.includes('nepali') ? 'mixed' : 'hi'
    } else if (/\b(nepali|nepalese|kasto|timro|hajur|nepal)\b/.test(messageLower)) {
      language = 'ne'
    }
    
    // Tone detection
    let currentTone: ToneContext['currentTone'] = 'professional'
    if (/\b(bhai|kese ho|kaise ho|yaar|dude)\b/.test(messageLower)) {
      currentTone = 'casual'
    } else if (/\b(background|experience|skills|projects|work)\b/.test(messageLower)) {
      currentTone = 'professional'
    } else if (/\b(hi|hello|how are you|what's up)\b/.test(messageLower)) {
      currentTone = 'friendly'
    } else if (/\b(programming|code|technical|development|api)\b/.test(messageLower)) {
      currentTone = 'technical'
    }
    
    // Relationship detection
    let relationship: ToneContext['relationship'] = 'stranger'
    if (currentTone === 'casual' || language === 'hi') {
      relationship = 'friend'
    } else if (conversationHistory.length > 3) {
      relationship = 'colleague'
    } else if (/\b(interview|position|job|career)\b/.test(messageLower)) {
      relationship = 'interviewer'
    }
    
    // Conversation stage
    let conversationStage: ToneContext['conversationStage'] = 'discussion'
    if (conversationHistory.length === 0 || /\b(hi|hello|hey)\b/.test(messageLower)) {
      conversationStage = 'greeting'
    } else if (conversationHistory.length > 10) {
      conversationStage = 'deep_dive'
    }
    
    // User personality
    let userPersonality: ToneContext['userPersonality'] = 'mixed'
    if (currentTone === 'casual' && language === 'hi') {
      userPersonality = 'casual'
    } else if (currentTone === 'professional') {
      userPersonality = 'formal'
    }
    
    return {
      currentTone,
      language,
      relationship,
      conversationStage,
      userPersonality
    }
  }
  
  /**
   * Get consistent response tone based on conversation history
   */
  getResponseTone(sessionId: string, userTone: ToneContext): ToneContext {
    const history = this.toneHistory.get(sessionId) || []
    
    // If we have history, maintain consistency
    if (history.length > 0) {
      const lastTone = history[history.length - 1]
      
      // Don't switch from casual to professional abruptly
      if (lastTone.currentTone === 'casual' && userTone.currentTone === 'professional') {
        return {
          ...userTone,
          currentTone: 'friendly', // Bridge tone
        }
      }
      
      // Don't switch languages mid-conversation unless user explicitly does
      if (lastTone.language !== 'en' && userTone.language === 'en' && 
          !userTone.currentTone.includes('technical')) {
        return {
          ...userTone,
          language: lastTone.language,
        }
      }
      
      // Maintain relationship context
      if (lastTone.relationship === 'friend') {
        return {
          ...userTone,
          relationship: 'friend',
        }
      }
    }
    
    // Store this tone context
    history.push(userTone)
    if (history.length > 10) history.shift() // Keep last 10 tones
    this.toneHistory.set(sessionId, history)
    
    return userTone
  }
  
  /**
   * Generate tone-appropriate response instructions
   */
  generateResponseInstructions(toneContext: ToneContext, message: string): string {
    let instructions = 'You are Sajal Basnet responding naturally. '
    
    switch (toneContext.language) {
      case 'hi':
        if (toneContext.currentTone === 'casual') {
          instructions += `Respond in casual Hinglish mixing Hindi and English naturally. 
          Use words like "main", "hai", "kar raha hun", "bhai" naturally.
          Keep technical terms in English but use Hindi for casual conversation.
          Match the friendly, casual tone. Don't be overly formal or robotic.
          Keep responses concise and conversational.`
        } else {
          instructions += `Respond in respectful Hindi-English mix, more formal but still friendly.`
        }
        break
        
      case 'ne':
        instructions += `Respond in Nepali naturally and respectfully.
        Use proper Nepali with English technical terms when appropriate.
        Keep it informative but friendly. Use "ma", "cha", "garchu" naturally.`
        break
        
      default:
        if (toneContext.relationship === 'friend') {
          instructions += `Respond in a friendly, casual English tone. 
          You're talking to someone you know well.`
        } else if (toneContext.currentTone === 'professional') {
          instructions += `Respond professionally but warmly. 
          Share your experience and expertise clearly.`
        } else {
          instructions += `Respond in a natural, conversational way.`
        }
    }
    
    // Add conversation stage context
    switch (toneContext.conversationStage) {
      case 'greeting':
        instructions += ' Start with appropriate greeting. '
        break
      case 'deep_dive':
        instructions += ' Provide detailed, thoughtful responses. '
        break
    }
    
    instructions += `

Important guidelines:
- Stay consistent with the established tone and language
- Don't switch between formal and casual abruptly
- Keep information accurate and don't exaggerate
- Match the user's energy level
- Be natural and conversational, not robotic
- Don't repeat the same information in different ways

User's message: "${message}"`
    
    return instructions
  }
}

export const conversationToneManager = new ConversationToneManager()