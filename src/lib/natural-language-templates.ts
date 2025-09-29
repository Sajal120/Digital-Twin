/**
 * Natural Language Response Templates
 * ==================================
 * 
 * Pre-built natural responses for common conversational patterns
 * to avoid AI-generated broken language responses
 */

export interface LanguageTemplate {
  pattern: RegExp
  responses: {
    nepali?: string
    hindi?: string
    english?: string
  }
  context?: string
}

export const conversationTemplates: LanguageTemplate[] = [
  // Greetings
  {
    pattern: /^(k xa|k cha|kesto xa|kasto cha)$/i,
    responses: {
      nepali: "Ma sanchai chu, dhanyabad! Timi kasto chau?",
      hindi: "Main theek hun, dhanyawad! Tum kaise ho?",
      english: "I'm doing well, thanks! How are you?"
    },
    context: "greeting_response"
  },
  
  {
    pattern: /^(kese ho|kaise ho|kese ho bhai)$/i,
    responses: {
      hindi: "Main theek hun bhai! Tum kaise ho? Kya chal raha hai?",
      english: "I'm doing well, brother! How are you? What's going on?"
    },
    context: "casual_greeting"
  },
  
  // Food/Meal related
  {
    pattern: /(malai thikai chha|khan khanu|khana khayo|khana)/i,
    responses: {
      nepali: "Huss, khana khana ta garna parcha ni! Ma pani khana khanchu. Timi ke khanchau?",
      english: "Yes, we need to eat! I eat too. What do you like to eat?"
    },
    context: "food_conversation"
  },
  
  // Language switch requests
  {
    pattern: /(reply me in nepali|nepalese language|nepali ma reply|nepali bhasha ma)/i,
    responses: {
      nepali: "Huss, ma Nepali ma reply garchu. Ke janna chau?",
      english: "Sure, I'll reply in Nepali. What would you like to know?"
    },
    context: "language_request"
  },
  
  {
    pattern: /(reply me in indian|hindi language|hindi ma reply)/i,
    responses: {
      hindi: "Haan bhai, main Hindi mein reply karunga. Kya jaanna chahte ho?",
      english: "Sure brother, I'll reply in Hindi. What would you like to know?"
    },
    context: "language_request"
  },
  
  // About me - General
  {
    pattern: /(timilai kasto xa|timro bare ma|about yourself|tumhare bare mein)/i,
    responses: {
      nepali: "Ma Sajal Basnet hun. Ma ek software developer hun jo Nepal bata hoon tara ahile Australia ma chu. Programming ra AI ma kaam garchu.",
      hindi: "Main Sajal Basnet hun. Main ek software developer hun jo Nepal se hun lekin abhi Australia mein hun. Programming aur AI mein kaam karta hun.",
      english: "I'm Sajal Basnet. I'm a software developer from Nepal currently in Australia. I work on programming and AI."
    },
    context: "about_me"
  },
  
  // Work/Skills
  {
    pattern: /(kaam|work|skills|programming|developer)/i,
    responses: {
      nepali: "Ma software development garchu. Python, JavaScript, React jasai technologies use garchu. AI ra web development ma ramro experience cha.",
      hindi: "Main software development karta hun. Python, JavaScript, React jaise technologies use karta hun. AI aur web development mein accha experience hai.",
      english: "I do software development. I use technologies like Python, JavaScript, React. I have good experience in AI and web development."
    },
    context: "work_skills"
  },
  
  // Simple acknowledgments
  {
    pattern: /^(thikai xa|thik cha|okay|ok)$/i,
    responses: {
      nepali: "Huncha! Arko ke kura garne?",
      hindi: "Accha! Aur kya baat karni hai?",
      english: "Alright! What else should we talk about?"
    },
    context: "acknowledgment"
  }
]

/**
 * Simple conversation responses for basic patterns
 */
export const basicResponses = {
  nepali: {
    greeting: "Namaste! Ma Sajal hun. Timi kasari chau?",
    howAreYou: "Ma sanchai chu, dhanyabad! Timi kasto chau?",
    aboutWork: "Ma ek software developer hun. Programming ra AI ma kaam garchu.",
    location: "Ma Nepal bata hun tara ahile Australia ma chu.",
    thankYou: "Dhanyabad! Arko ke help chahincha?",
    default: "Ke bhannu khojeko? Ma ramrari bujhina."
  },
  
  hindi: {
    greeting: "Namaste! Main Sajal hun. Tum kaise ho?",
    howAreYou: "Main theek hun bhai! Tum batao, kya chal raha hai?",
    aboutWork: "Main ek software developer hun. Programming aur AI mein kaam karta hun.",
    location: "Main Nepal se hun lekin abhi Australia mein hun.",
    thankYou: "Dhanyawad! Aur koi help chahiye?",
    default: "Kya keh rahe ho? Main samjha nahi."
  },
  
  english: {
    greeting: "Hello! I'm Sajal. How are you?",
    howAreYou: "I'm doing well, thanks! How are you doing?",
    aboutWork: "I'm a software developer. I work on programming and AI.",
    location: "I'm from Nepal but currently in Australia.",
    thankYou: "Thank you! Is there anything else I can help with?",
    default: "I'm not sure what you're asking. Could you clarify?"
  }
}

/**
 * Find matching template for a message
 */
export function findConversationTemplate(message: string): LanguageTemplate | null {
  const normalizedMessage = message.toLowerCase().trim()
  
  for (const template of conversationTemplates) {
    if (template.pattern.test(normalizedMessage)) {
      return template
    }
  }
  
  return null
}

/**
 * Get appropriate response based on detected language and context
 */
export function getTemplateResponse(
  template: LanguageTemplate, 
  detectedLanguage: string
): string | null {
  if (detectedLanguage === 'ne' && template.responses.nepali) {
    return template.responses.nepali
  }
  
  if (detectedLanguage === 'hi' && template.responses.hindi) {
    return template.responses.hindi
  }
  
  if (template.responses.english) {
    return template.responses.english
  }
  
  return null
}

/**
 * Get basic response for simple patterns
 */
export function getBasicResponse(
  type: keyof typeof basicResponses.nepali,
  language: 'nepali' | 'hindi' | 'english'
): string {
  return basicResponses[language][type] || basicResponses.english[type]
}