import { NextRequest, NextResponse } from 'next/server'
import { ChatDatabase } from '@/utilities/database'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Index } from '@upstash/vector'
import {
  enhancedRAGQuery,
  contextAwareRAG,
  agenticRAG,
  type VectorResult,
  type InterviewContextType,
} from '@/lib/llm-enhanced-rag'
import { advancedAgenticRAG } from '@/lib/advanced-agentic-rag'
import { multiHopRAG } from '@/lib/multi-hop-rag'
import { hybridSearch, recommendSearchStrategy } from '@/lib/hybrid-search'
import { toolUseRAG, checkToolHealth } from '@/lib/tool-use-rag'
import { conversationMemory } from '@/lib/conversation-context'
import { generateGitHubEnhancedResponse, isGitHubQuery } from '@/lib/github-integration'
import { generateLinkedInEnhancedResponse, isLinkedInQuery } from '@/lib/linkedin-integration'
import { smartLLMWithTools } from '@/lib/smart-llm-tools'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { googleService } from '@/lib/google-service'
import { processMultiLanguageQuery, generateMultiLanguageResponse, applySmartFiltering } from '@/lib/multi-language-rag'

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    if (!process.env.DATABASE_URL && !process.env.DATABASE_URI) {
      console.error('❌ No database URL available in environment')
      return NextResponse.json(
        {
          error: 'Database connection not available',
          response: "Sorry, I'm having trouble connecting right now. Please try again later.",
        },
        { status: 500 },
      )
    }

    // Initialize table if needed (only on first use)
    try {
      await ChatDatabase.initializeTable()
    } catch (dbError) {
      console.error('Database initialization error:', dbError)
      // Continue with fallback response instead of failing completely
    }

    const body = await request.json()
    let { user_id, role, content } = body
    const {
      message,
      conversationHistory,
      interviewType,
      sessionId = 'default-session',
      enhancedMode = !!process.env.GROQ_API_KEY,
      githubToken, // OAuth token for GitHub integration
      user, // Google auth user information
      tokens, // Object containing various OAuth tokens
    } = body

    // Handle both old format (user_id, role, content) and new portfolio format (message, conversationHistory)
    if (message && !content) {
      content = message
      role = 'user'
      user_id = user_id || 'portfolio-visitor'
    }

    // Validate required fields
    if (!role || !content) {
      return NextResponse.json({ error: 'Role and content are required' }, { status: 400 })
    }

    // Validate role
    if (!['system', 'user', 'assistant'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be one of: system, user, assistant' },
        { status: 400 },
      )
    }

    // Try to insert the user message into database, but continue if it fails
    let userMessage = null
    try {
      userMessage = await ChatDatabase.insertMessage({
        user_id,
        role,
        content,
      })
    } catch (dbError) {
      console.error('Failed to insert user message:', dbError)
      // Continue without database - we'll still provide a response
    }

    // Generate AI response using enhanced or basic RAG
    let aiResponse = ''
    let responseMetadata = null

    if (enhancedMode && process.env.GROQ_API_KEY) {
      console.log('🚀 Using Enhanced RAG with LLM processing...')
      const enhancedResult = await generateEnhancedPortfolioResponse(
        content.toLowerCase(),
        conversationHistory || [],
        interviewType as InterviewContextType,
        sessionId,
        githubToken || tokens?.github,
        request,
      )
      aiResponse = enhancedResult.response
      responseMetadata = enhancedResult.metadata
    } else {
      console.log('📝 Using Basic RAG fallback...')
      aiResponse = await generatePortfolioResponse(content.toLowerCase(), conversationHistory || [], githubToken || tokens?.github, request)
    }

    // Try to insert the AI response into the database, but continue if it fails
    let assistantMessage = null
    try {
      assistantMessage = await ChatDatabase.insertMessage({
        user_id,
        role: 'assistant',
        content: aiResponse,
      })
    } catch (dbError) {
      console.error('Failed to insert assistant message:', dbError)
      // Continue without database - we still have the response
    }

    // For portfolio format, return enhanced response
    if (message) {
      return NextResponse.json({
        response: aiResponse,
        timestamp: new Date().toISOString(),
        enhanced: enhancedMode && !!responseMetadata,
        metadata: responseMetadata,
      })
    }

    // For original format, try to get recent messages, fallback to current conversation
    let recentMessages = []
    try {
      recentMessages = await ChatDatabase.getRecentMessages(20, user_id)
    } catch (dbError) {
      console.error('Failed to get recent messages:', dbError)
      // Fallback to just the current conversation
      recentMessages = [
        { user_id, role, content, timestamp: new Date() },
        { user_id, role: 'assistant', content: aiResponse, timestamp: new Date() },
      ].filter(Boolean)
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage || {
        user_id,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      },
      context: recentMessages,
      total: recentMessages.length,
      enhanced: enhancedMode && !!responseMetadata,
      metadata: responseMetadata,
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        response: "Sorry, I'm having trouble connecting right now. Please try again later.",
      },
      { status: 500 },
    )
  }
}

/**
 * Meeting Booking and Action Detection
 * ===================================
 * 
 * Detects when user wants to book a meeting or perform special actions
 */
async function detectAndHandleSpecialActions(message: string, conversationHistory: any[], request?: NextRequest) {
  const lowerMessage = message.toLowerCase()
  
  try {
    // Check if user is authenticated with Google for meeting booking
    const session = await getServerSession(authOptions)
    const isAuthenticated = !!(session && session.user)

    // Check for meeting confirmation first (standalone confirmation messages)
    const isStandaloneConfirmation = (
      lowerMessage.includes('confirm the meeting') ||
      lowerMessage.includes('yes, book it') ||
      lowerMessage.includes('go ahead and schedule') ||
      lowerMessage.includes('proceed with booking') ||
      (lowerMessage.includes('confirm') && lowerMessage.includes('meeting')) ||
      (lowerMessage.includes('yes') && (lowerMessage.includes('meeting') || lowerMessage.includes('book'))) ||
      lowerMessage.includes('book it') ||
      lowerMessage.includes('schedule it')
    )

    // Handle standalone confirmations
    if (isStandaloneConfirmation && isAuthenticated) {
      try {
        // Get the user's email from session
        const userEmail = session.user?.email || 'anonymous@example.com'
        const userName = session.user?.name || 'Anonymous User'
        
        // For confirmations, we need to use the original request time, not the confirmation message
        // Check if we have conversation history to get the original request
        let originalRequest = message // fallback to current message
        if (conversationHistory && conversationHistory.length > 0) {
          // Look for the most recent message that contains a date/time request
          for (let i = conversationHistory.length - 1; i >= 0; i--) {
            const historyMessage = conversationHistory[i];
            if (historyMessage.role === 'user' && 
                (historyMessage.content.includes('book') || historyMessage.content.includes('meeting')) &&
                (historyMessage.content.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/) || 
                 historyMessage.content.includes('am') || historyMessage.content.includes('pm') ||
                 historyMessage.content.includes('tomorrow') || historyMessage.content.includes('monday') ||
                 historyMessage.content.includes('tuesday') || historyMessage.content.includes('wednesday') ||
                 historyMessage.content.includes('thursday') || historyMessage.content.includes('friday'))) {
              originalRequest = historyMessage.content;
              console.log('🕐 Found original request in history:', originalRequest);
              break;
            }
          }
        }
        
        // Parse time from the original request, not the confirmation message
        const { start, end } = googleService.parseDateTime(originalRequest)
        console.log('🕐 Confirmation using parsed time:', { originalRequest, start: start.toLocaleString(), end: end.toLocaleString() });
        
        // Create meeting description with user's request
        const meetingDescription = `Meeting Request from Portfolio Visitor

**Requested by:** ${userName} (${userEmail})
**Original Request:** "${message}"

**Meeting Purpose:** Discussion about Sajal's background and experience

**Topics to Cover:**
- AI-powered portfolio chatbot with advanced RAG capabilities
- Full-stack development experience with Next.js, React, and modern technologies
- Internship experience at Aubot and achievements in QA process improvement
- Future opportunities in AI, Development, Security, and Support

**Meeting requested through:** Digital Twin Portfolio Chatbot
**Portfolio URL:** ${request?.url?.split('/api')[0] || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}

Feel free to ask me anything about my technical background, projects, or career goals!

Best regards,
Sajal Basnet`

        const meetingResult = await googleService.createMeeting(
          `Portfolio Meeting: ${userName} & Sajal Basnet`,
          meetingDescription,
          start,
          end,
          [userEmail, 'basnetsajal120@gmail.com'] // Invite both the user and the organizer
        )
        
        // Send you a separate email notification about the meeting request
        try {
          await googleService.sendEmail(
            'basnetsajal120@gmail.com',
            `New Meeting Request: ${userName}`,
            `Hi Sajal,

You have a new meeting request from your Digital Twin Portfolio!

**Meeting Details:**
👤 **Visitor:** ${userName} (${userEmail})
📅 **Requested Time:** ${start.toLocaleString()}
💬 **Their Original Request:** "${originalRequest}"
🔗 **Meet Link:** ${meetingResult.meetLink}
📎 **Calendar Event:** ${meetingResult.eventUrl}

**What they want to discuss:**
Based on their request, they're interested in learning more about your work, particularly your AI portfolio chatbot, development experience, and career opportunities.

**Next Steps:**
- The meeting has been automatically added to your calendar
- ${userName} will receive a calendar invite
- You can prepare talking points about your projects and experience

**Portfolio Context:**
This meeting was booked through your AI-powered portfolio chatbot, demonstrating the effectiveness of your automated lead generation system!

Best regards,
Your Digital Twin Assistant`
          )
        } catch (emailError) {
          console.error('Failed to send notification email to Sajal:', emailError)
          // Continue even if email fails
        }

        if (meetingResult.success) {
          return {
            action: 'meeting_created',
            response: `🎉 Perfect! Your meeting has been confirmed and booked!

📅 **Meeting Confirmed:**
📝 **Title:** Portfolio Meeting: ${userName} & Sajal Basnet
⏰ **Time:** ${new Date(meetingResult.startTime).toLocaleString()}
🔗 **Google Meet Link:** [Join Meeting](${meetingResult.meetLink})
📎 **Calendar Event:** [View in Calendar](${meetingResult.eventUrl})

**📧 Meeting Organization:**
👨‍💼 **Organizer:** Sajal Basnet (basnetsajal120@gmail.com) - Meeting host & receives calendar invite
👤 **Attendee:** You (${userEmail}) - Will receive calendar invite

**📩 Notifications Sent:**
✅ Calendar invite sent to you (${userEmail})
✅ Calendar invite sent to Sajal (basnetsajal120@gmail.com)
✅ Meeting notification email sent to Sajal with your request details
✅ Sajal will prepare for your discussion based on: "${originalRequest}"

**What we'll discuss:**
- My AI-powered portfolio chatbot project
- Full-stack development experience
- My achievements at Aubot (30% QA improvement)
- Career opportunities in AI, Development, Security & Support
- Your specific questions and interests

You'll receive a calendar invite shortly from Sajal. I'm looking forward to our conversation! 🚀

Feel free to ask me anything before our meeting!`,
            meetingData: meetingResult
          }
        } else {
          throw new Error('Failed to create meeting')
        }
        
      } catch (error) {
        console.error('Meeting creation error:', error)
        return {
          action: 'meeting_error',
          response: `I encountered an issue while trying to book the meeting. This might be due to:

1. **Calendar permissions** - Please make sure you've granted calendar access
2. **Invalid date/time** - Could you specify a clearer date and time?

Please try:
- "Book a meeting for Monday at 2 PM"
- "Schedule a meeting for next Wednesday afternoon"  
- "Book a meeting for tomorrow at 10 AM"

You can also try signing in again with Google to refresh permissions: /api/auth/signin/google

I'm here to help once we get this sorted out! 😊`
        }
      }
    }

    // Meeting booking detection - Two-step process
    if (lowerMessage.includes('book meeting') || 
        lowerMessage.includes('schedule meeting') || 
        lowerMessage.includes('book with you') ||
        lowerMessage.includes('book a meeting') ||
        lowerMessage.includes('meeting with you')) {
      
      if (!isAuthenticated) {
        return {
          action: 'book_meeting_auth_needed',
          response: `I'd be happy to help you book a meeting! 🗓️ 

To schedule a meeting, I can create a Google Calendar event with a Meet link and send you the details. 

**To get started:**
1. Click the "Sign in with Google" button to authenticate
2. Grant calendar permissions 
3. Then tell me your preferred date and time!

Once authenticated, I can:
✅ Create calendar events with Google Meet links
✅ Send calendar invites
✅ Schedule meetings based on your preferences

What would you like to discuss in our meeting? I'm excited to share my experience with:
- AI-powered portfolio chatbot development
- Full-stack development with Next.js and React
- My internship experience at Aubot
- Future opportunities in AI, Development, Security, and Support`,
          needsAuth: true,
          authUrl: '/api/auth/signin/google'
        }
      }

      // If not a confirmation, show the initial confirmation dialog
      // First request - show confirmation dialog
      const userEmail = session.user?.email || 'anonymous@example.com'
      const userName = session.user?.name || 'Anonymous User'
      
      // Parse the requested time to show in confirmation
      const { start, end } = googleService.parseDateTime(message || 'next Monday afternoon')
      
      return {
        action: 'meeting_confirmation_needed',
        response: `📅 I'd be happy to schedule a meeting for you!

**Meeting Details to Confirm:**
👤 **Your Name:** ${userName}
📧 **Your Email:** ${userEmail}
⏰ **Proposed Time:** ${start.toLocaleString()} - ${end.toLocaleString()}
🎯 **Your Request:** "${message}"

**Meeting Agenda:**
- Discussion about Sajal's AI-powered portfolio chatbot
- Full-stack development experience and technical skills
- Career opportunities and potential collaboration
- Q&A about projects and achievements

**What will happen when you confirm:**
1. ✅ Calendar event will be created with Google Meet link
2. ✅ You'll receive a calendar invite from Sajal
3. ✅ Sajal will receive a notification with your meeting request
4. ✅ Meeting reminders will be set automatically

**To confirm and book this meeting, please reply with:**
- "Yes, book it"
- "Confirm the meeting"  
- "Go ahead and schedule it"

**To modify the time, say something like:**
- "Actually, can we do Tuesday at 3 PM instead?"
- "Tomorrow at 10 AM would be better"

Would you like me to proceed with booking this meeting? 🚀`,
        needsConfirmation: true,
        proposedTime: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      }
    }

    // Email detection and sending - More flexible patterns
    if (lowerMessage.includes('send email') || 
        lowerMessage.includes('email me') || 
        lowerMessage.includes('send an email') ||
        lowerMessage.includes('send you an email') ||
        lowerMessage.includes('send you email') ||
        lowerMessage.includes('email you') ||
        lowerMessage.includes('send email to you') ||
        (lowerMessage.includes('send') && lowerMessage.includes('email')) ||
        (lowerMessage.includes('email') && (lowerMessage.includes('to you') || lowerMessage.includes('you')))) {
      
      if (!isAuthenticated) {
        return {
          action: 'email_auth_needed',
          response: `I'd be happy to help you send an email! 📧

To send emails, I need access to your Gmail account.

**To get started:**
1. Click the "Sign in with Google" button to authenticate
2. Grant Gmail permissions 
3. Then tell me what you'd like to say!

Once authenticated, I can send emails on your behalf through Gmail.

What would you like to include in your email?`,
          needsAuth: true,
          authUrl: '/api/auth/signin/google'
        }
      }

      // If authenticated, send the email
      try {
        const emailResult = await googleService.sendEmail(
          'basnetsajal120@gmail.com', // Your email
          'Message from Digital Twin Portfolio Visitor',
          `Hello Sajal,

Someone visited your AI-powered Digital Twin portfolio and wanted to reach out!

**Message:** ${message}

**Context:** This message was sent through your portfolio chatbot's email integration.

**About your portfolio:** The visitor was impressed with:
- Your AI-powered portfolio chatbot with advanced RAG capabilities
- Your full-stack development experience with Next.js and React
- Your internship achievements at Aubot (30% QA process improvement)
- Your focus on AI, Development, Security, and Support

They're interested in connecting with you!

Best regards,
Your Digital Twin Chatbot
Portfolio: ${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}`
        )

        if (emailResult.success) {
          return {
            action: 'email_sent',
            response: `📧 Email sent successfully!

**Email Details:**
📤 **To:** basnetsajal120@gmail.com
📝 **Subject:** Message from Digital Twin Portfolio Visitor
✅ **Status:** Delivered successfully

Your message has been sent to Sajal! He typically responds within 24 hours.

**What was sent:**
- Your message: "${message}"
- Context about your interest in his work
- Information about his portfolio and achievements

Feel free to continue exploring the portfolio or ask me more questions! 🚀`,
            emailData: emailResult
          }
        } else {
          throw new Error('Failed to send email')
        }
        
      } catch (error) {
        console.error('Email sending error:', error)
        return {
          action: 'email_error',
          response: `I encountered an issue while trying to send the email. This might be due to:

1. **Gmail permissions** - Please make sure you've granted email access
2. **Authentication expired** - Try signing in again with Google

Please try:
- Signing in again with Google: /api/auth/signin/google
- Making sure you granted Gmail permissions during sign-in

I'm here to help once we get this sorted out! 📧`
        }
      }
    }

  } catch (error) {
    console.error('Special action detection error:', error)
    return null
  }

  return null
}

/**
 * Advanced Portfolio Response Generation
 * ====================================
 *
 * Uses the most advanced RAG pipeline with all patterns integrated
 */
async function generateEnhancedPortfolioResponse(
  message: string,
  conversationHistory: any[],
  interviewType?: InterviewContextType,
  sessionId: string = 'default-session',
  githubToken?: string,
  request?: NextRequest,
): Promise<{ response: string; metadata: any }> {
  try {
    // First, check for special actions like meeting booking
    console.log('🔍 Checking for special actions...')
    const specialAction = await detectAndHandleSpecialActions(message, conversationHistory, request)
    if (specialAction) {
      console.log(`🎯 Special action detected: ${specialAction.action}`)
      return {
        response: specialAction.response,
        metadata: {
          action: specialAction.action,
          needsAuth: specialAction.needsAuth || false,
          ragPattern: 'special_action',
          meetingData: specialAction.meetingData,
          authUrl: specialAction.authUrl
        }
      }
    }

    // Check if Upstash Vector is available
    if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
      console.log('Upstash credentials not available, falling back to basic response')
      const basicResponse = await generatePortfolioResponse(message, conversationHistory, undefined, request)
      return {
        response: basicResponse,
        metadata: {
          originalQuery: message,
          enhancedQuery: message,
          resultsFound: 0,
          fallbackUsed: true,
          ragPattern: 'basic_fallback',
        },
      }
    }

    // Initialize conversation context and get enhanced query
    console.log('📝 Processing with enhanced conversation context...')
    const messageId = await conversationMemory.addMessage(sessionId, 'user', message, {
      interviewType: interviewType || 'general',
    })

    const contextEnhanced = await conversationMemory.enhanceQueryWithContext(sessionId, message)
    console.log(`💡 Context enhancement: ${contextEnhanced.isFollowUp ? 'Follow-up' : 'New'} query`)
    console.log(`🔍 Enhanced query: "${contextEnhanced.enhancedQuery}"`)

    // Multi-language processing
    console.log('🌍 Processing multi-language query...')
    
    const multiLanguageResult = await processMultiLanguageQuery(
      message,
      contextEnhanced,
      sessionId
    )
    
    console.log(`🌍 Language: ${multiLanguageResult.languageContext.detectedLanguage}`)
    console.log(`🎯 Selected pattern: ${multiLanguageResult.selectedPattern.pattern}`)
    console.log(`🔍 Search query: "${multiLanguageResult.enhancedQuery}"`)

    // Create vector search function with smart filtering
    const vectorSearchFunction = async (query: string): Promise<VectorResult[]> => {
      try {
        console.log(`🔎 Vector search: "${query}"`)

        // Initialize Upstash Vector client
        const index = new Index({
          url: process.env.UPSTASH_VECTOR_REST_URL!,
          token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
        })

        // Query vector database
        const vectorResults = await index.query({
          data: query,
          topK: 12, // Increased for better filtering
          includeMetadata: true,
          includeData: true,
        })

        // Convert to our VectorResult format
        const results = vectorResults.map((result) => ({
          score: result.score,
          data: result.data as string,
          metadata: result.metadata,
        }))

        // Apply smart filtering based on language and context
        return await applySmartFiltering(
          results,
          multiLanguageResult.languageContext,
          query
        )
      } catch (error) {
        console.error('Vector search failed:', error)
        return []
      }
    }

    // Use the selected RAG pattern from multi-language analysis
    const ragPattern = multiLanguageResult.selectedPattern.pattern
    const searchQuery = multiLanguageResult.selectedPattern.searchQuery

    console.log(`🎯 Executing RAG pattern: ${ragPattern}`)

    let result: any
    let ragPatternUsed = ragPattern

    switch (ragPattern) {
      case 'advanced_agentic':
        console.log('🧠 Using Advanced Agentic RAG with sophisticated planning...')
        result = await advancedAgenticRAG(searchQuery, contextEnhanced, vectorSearchFunction, sessionId)
        break

      case 'multi_hop':
        console.log('🔄 Using Multi-hop RAG for complex query...')
        const multiHopResult = await multiHopRAG(
          searchQuery,
          vectorSearchFunction,
          interviewType || 'general',
          3,
        )
        result = {
          response: multiHopResult.finalResponse,
          metadata: {
            originalQuery: message,
            enhancedQuery: searchQuery,
            ragPattern: 'multi_hop',
            searchSteps: multiHopResult.totalSteps,
            resultsFound: multiHopResult.searchSteps.reduce(
              (sum, step) => sum + step.results.length,
              0,
            ),
          },
        }
        break

      case 'hybrid_search':
        console.log('🔍 Using Hybrid Search for comprehensive coverage...')
        const strategy = await recommendSearchStrategy(searchQuery)
        const hybridResults = await hybridSearch(
          searchQuery,
          vectorSearchFunction,
          undefined,
          strategy,
        )

        // Synthesize response from hybrid results
        const hybridResponse =
          hybridResults.results.length > 0
            ? hybridResults.results
                .map((r) => r.data || r.metadata?.content)
                .filter(Boolean)
                .slice(0, 3)
                .join('\n\n')
            : "I don't have specific information about that topic."

        result = {
          response: hybridResponse,
          metadata: {
            originalQuery: message,
            enhancedQuery: searchQuery,
            ragPattern: 'hybrid_search',
            fusionStrategy: hybridResults.metadata.fusionStrategy,
            resultsFound: hybridResults.results.length,
          },
        }
        break

      case 'tool_enhanced':
        console.log('🛠️ Using Smart LLM with External Tools...')
        // Get RAG results first
        const ragResults = await vectorSearchFunction(searchQuery)

        // Get LinkedIn access token if available
        const linkedinToken = request?.cookies.get('linkedin-token')?.value

        const smartResult = await smartLLMWithTools(
          searchQuery,
          ragResults,
          conversationHistory || [],
          linkedinToken,
        )
        result = {
          response: smartResult.response,
          metadata: {
            originalQuery: message,
            enhancedQuery: searchQuery,
            ragPattern: 'smart_llm_tools',
            toolsUsed: smartResult.toolsCalled.map((t) => t.tool),
            toolResults: smartResult.toolsCalled.filter((t) => t.success),
            reasoning: smartResult.reasoning,
            executionTime: smartResult.executionTime,
            resultsFound: ragResults.length,
          },
        }
        break

      default:
        console.log('🤖 Using Standard Agentic RAG...')
        const agenticResult = await agenticRAG(
          message,
          conversationHistory,
          vectorSearchFunction,
          interviewType || 'general',
          sessionId,
        )
        result = agenticResult
        ragPatternUsed = 'standard_agentic'
        break
    }

    // Add assistant response to conversation memory
    await conversationMemory.addMessage(sessionId, 'assistant', result.response, {
      ragPattern: ragPatternUsed,
      confidence: result.finalConfidence || result.metadata?.confidence,
    })

    // Generate multi-language response if needed
    const multiLanguageResponse = await generateMultiLanguageResponse(
      result,
      multiLanguageResult.languageContext,
      message,
      sessionId,
      conversationHistory
    )

    // Final cleanup to ensure no quotes in response
    let cleanResponse = multiLanguageResponse.response
    if (cleanResponse) {
      cleanResponse = cleanResponse
        .replace(/^["'"\u201C\u201D\u2018\u2019]+|["'"\u201C\u201D\u2018\u2019]+$/g, '')
        .replace(/^"(.+)"$/s, '$1')
        .replace(/^'(.+)'$/s, '$1')
        .replace(/^[\u201C\u201D](.+)[\u201C\u201D]$/s, '$1')
        .trim()
    }

    return {
      response: cleanResponse,
      metadata: {
        ...result.metadata,
        ragPattern: ragPatternUsed,
        language: {
          detected: multiLanguageResponse.originalLanguage,
          response: multiLanguageResponse.responseLanguage,
          translationUsed: multiLanguageResponse.translationUsed,
          searchLanguage: multiLanguageResponse.searchLanguage,
          crossLanguageSearch: multiLanguageResponse.metadata.crossLanguageSearch
        },
        contextEnhanced: {
          isFollowUp: contextEnhanced.isFollowUp,
          entities: contextEnhanced.entities,
          intent: contextEnhanced.intent,
          confidence: contextEnhanced.confidence,
        },
        conversationStats: conversationMemory.getStats(),
      },
    }
  } catch (error) {
    console.error('Advanced portfolio response failed:', error)

    // Fallback to basic response
    const basicResponse = await generatePortfolioResponse(message, conversationHistory, undefined, request)
    return {
      response: basicResponse,
      metadata: {
        originalQuery: message,
        enhancedQuery: message,
        resultsFound: 0,
        fallbackUsed: true,
        ragPattern: 'error_fallback',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * RAG Pattern Selection
 * ====================
 *
 * Intelligently selects the best RAG pattern based on query characteristics
 */
async function selectRAGPattern(
  message: string,
  contextEnhanced: any,
  sessionId: string,
): Promise<
  'advanced_agentic' | 'multi_hop' | 'hybrid_search' | 'tool_enhanced' | 'standard_agentic'
> {
  const messageLower = message.toLowerCase()

  // Check for tool requirements - Force tool use for GitHub and LinkedIn queries
  const needsGitHub = /\b(github|repository|repos|code|projects|commits)\b/i.test(message)
  const needsLinkedIn =
    /\b(linkedin|professional|work experience|career|employment|job history|aubot|kimpton|edgedvr|work at|experience at|certificates|certifications|credentials)\b/i.test(message)
  const needsRealTime = /\b(current|recent|latest|now|today|this year)\b/i.test(message)

  if (needsGitHub || needsLinkedIn || needsRealTime) {
    console.log('🔧 FORCING tool_enhanced pattern for external data query')
    return 'tool_enhanced'
  }

  // Check for complex multi-part questions
  const isComplex =
    messageLower.includes('and also') ||
    (messageLower.includes('tell me about') && contextEnhanced.entities.length > 2) ||
    messageLower.includes('comprehensive') ||
    messageLower.includes('everything about')

  if (isComplex) {
    return 'multi_hop'
  }

  // Check for comparison or hybrid search needs
  const needsHybrid =
    /\b(compare|versus|vs|different|types of|various)\b/i.test(message) ||
    contextEnhanced.entities.length > 3

  if (needsHybrid) {
    return 'hybrid_search'
  }

  // Check conversation complexity for advanced agentic
  const conversationStats = conversationMemory.getStats()
  const isAdvancedConversation =
    contextEnhanced.isFollowUp &&
    contextEnhanced.confidence > 0.8 &&
    conversationStats.topTopics.length > 3

  if (isAdvancedConversation) {
    return 'advanced_agentic'
  }

  // Default to standard agentic
  return 'standard_agentic'
}

async function generatePortfolioResponse(
  message: string,
  conversationHistory: any[],
  githubToken?: string,
  request?: NextRequest,
): Promise<string> {
  try {
    // First, try vector search from Upstash (only if environment variables are available)
    if (process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN) {
      console.log(`Searching vector database for: "${message}"`)

      try {
        // Initialize Upstash Vector client
        console.log('Initializing Upstash Vector client...')
        const index = new Index({
          url: process.env.UPSTASH_VECTOR_REST_URL!,
          token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
        })

        // Query vector database - Upstash handles embedding generation automatically
        console.log(`Searching vector database for: "${message}"`)
        const vectorResults = await index.query({
          data: message,
          topK: 3,
          includeMetadata: true,
          includeData: true, // Include the actual vector data
        })

        console.log('Vector search results:', JSON.stringify(vectorResults, null, 2))

        // Check if we have results
        if (vectorResults && vectorResults.length > 0) {
          const bestMatch = vectorResults[0]
          console.log(`Found vector match with score: ${bestMatch.score}`)

          // Check score threshold (adjust based on your data quality)
          if (bestMatch.score >= 0.5) {
            // Try different metadata field names that might contain the answer
            if (bestMatch.metadata) {
              console.log('Metadata:', JSON.stringify(bestMatch.metadata, null, 2))

              // Try various common field names from your Upstash data
              const possibleAnswerFields = [
                'answer',
                'content',
                'response',
                'text',
                'message',
                'description',
                'summary',
                'details',
              ]

              for (const field of possibleAnswerFields) {
                if (bestMatch.metadata[field]) {
                  console.log(`Using vector result from metadata field: ${field}`)
                  return bestMatch.metadata[field] as string
                }
              }

              // If we have a title and content type, generate a contextual response
              if (bestMatch.metadata.title && bestMatch.metadata.content_type) {
                const title = bestMatch.metadata.title
                const contentType = bestMatch.metadata.content_type
                const keywords = Array.isArray(bestMatch.metadata.keywords)
                  ? bestMatch.metadata.keywords
                  : []

                console.log(`Generating response from metadata: ${title} (${contentType})`)

                // Generate contextual response based on the matched content
                if (keywords.length > 0) {
                  return `Based on my ${contentType} experience with "${title}", I work with technologies like ${keywords.join(', ')}. This project demonstrates my expertise in these areas.`
                } else {
                  return `I have experience with "${title}" in the ${contentType} domain. This demonstrates my expertise in this area.`
                }
              }
            }

            // If no metadata content found, try the vector data itself
            if (bestMatch.data) {
              console.log('Using vector data field')
              return bestMatch.data as string
            }
          } else {
            console.log(`Score ${bestMatch.score} below threshold 0.5`)
          }
        } else {
          console.log('No vector results found')
        }
      } catch (vectorError) {
        console.error('Vector search exception:', vectorError)
        console.log('Vector search unavailable, falling back to database')
      }
    } else {
      console.log('Upstash credentials not available, skipping vector search')
    }

    // Fallback to direct database query (only if DATABASE_URL is available)
    if (process.env.DATABASE_URL) {
      const messageLower = message.toLowerCase().trim()
      console.log(`Looking for content matching: "${messageLower}"`)

      try {
        // Direct database query for testing
        const { Pool } = await import('pg')
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        })

        const query = `
          SELECT cc.content, ck.keyword 
          FROM content_chunks cc 
          JOIN content_chunks_keywords ck ON cc.id = ck._parent_id 
          WHERE cc.is_active = true 
          AND LOWER(ck.keyword) = $1
          LIMIT 1
        `

        const result = await pool.query(query, [messageLower])

        if (result.rows.length > 0) {
          console.log(`Found content for keyword: "${result.rows[0].keyword}"`)
          pool.end()
          return result.rows[0].content
        }

        // Try partial matches
        const partialQuery = `
          SELECT cc.content, ck.keyword 
          FROM content_chunks cc 
          JOIN content_chunks_keywords ck ON cc.id = ck._parent_id 
          WHERE cc.is_active = true 
          AND $1 LIKE '%' || LOWER(ck.keyword) || '%'
          ORDER BY LENGTH(ck.keyword) DESC
          LIMIT 1
        `

        const partialResult = await pool.query(partialQuery, [messageLower])

        if (partialResult.rows.length > 0) {
          console.log(`Found partial content for keyword: "${partialResult.rows[0].keyword}"`)
          pool.end()
          return partialResult.rows[0].content
        }

        pool.end()
        console.log(`No database content found for: "${messageLower}"`)
      } catch (error) {
        console.error('Database error:', error)
      }
    }
  } catch (error) {
    console.error('Error in generatePortfolioResponse:', error)
  }

  // Fallback to the existing keyword-based responses
  console.log('Using fallback keyword-based responses')
  return await getKeywordBasedResponse(message, conversationHistory, githubToken, request)
}

// Extract the keyword-based responses into a separate function for better organization
async function getKeywordBasedResponse(
  message: string,
  conversationHistory: any[],
  githubToken?: string,
  request?: NextRequest,
): Promise<string> {
  // Check if this is a GitHub/project-related query first
  if (isGitHubQuery(message)) {
    console.log('🔍 Detected GitHub query, fetching real data...')
    const githubResponse = await generateGitHubEnhancedResponse(message, githubToken)
    if (githubResponse) {
      console.log('✅ Using real GitHub data for response')
      return githubResponse
    }
  }

  // Check if this is a LinkedIn/professional-related query
  if (isLinkedInQuery(message)) {
    console.log('🔍 Detected LinkedIn query, fetching professional data...')
    
    // Get LinkedIn access token from cookies if available
    const linkedinToken = request?.cookies.get('linkedin-token')?.value
    
    const linkedinResponse = await generateLinkedInEnhancedResponse(message, linkedinToken)
    if (linkedinResponse) {
      console.log('✅ Using LinkedIn data for response')
      return linkedinResponse
    }
  }

  // Fast responses for common questions to improve performance  // Achievements - prioritize this before other matches
  if (
    message.includes('achievements') ||
    message.includes('accomplishments') ||
    message.includes('key achievements')
  ) {
    return `I'm proud of several key achievements that demonstrate my growth in AI, Development, Security, and Support:

Technical Achievements:
&bull; Successfully completed a Software Developer Internship at Aubot, where I maintained Python and Java codebases, executed automation scripts, and contributed to quality assurance processes in an agile environment
&bull; Developed cross-platform web applications with focus on performance optimization and user experience, achieving 20% load time improvements
&bull; Built this comprehensive AI-powered portfolio chatbot from scratch, demonstrating advanced conversational AI, database integration, and modern web development skills

Professional Growth:
&bull; Transitioned from hospitality management to tech development, showing adaptability and commitment to career change
&bull; Gained expertise in system management through Oracle Micros POS and Deputy systems, developing valuable IT operations skills
&bull; Successfully collaborated in agile development teams and contributed to enterprise-level software projects

Learning & Innovation:
&bull; Continuously expanding knowledge in AI and machine learning technologies
&bull; Building practical applications that solve real problems rather than just theoretical projects
&bull; Developing expertise across multiple domains: full-stack development, AI systems, and cloud technologies

I'm particularly proud that each role has contributed to my goal of specializing in intelligent, secure applications while building strong technical support capabilities. My diverse background gives me a unique perspective on technology implementation and user experience.`
  }
  // Greetings
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return `Hello! Great to meet you! I'm Sajal, and I'm really excited you're interested in learning more about my work and background.

I'm a developer focused on AI, Development, Security, and Support, based in Auburn, Sydney. I love building intelligent systems that solve real problems, and I'm passionate about integrating cutting-edge technologies with practical applications.

What would you like to know about me? I'd be happy to chat about my professional experience at companies like Aubot and edgedVR, the technologies I work with including Python, Java, and AI frameworks, my current projects like this AI-powered chatbot, or how we might work together if you're looking to collaborate.

Feel free to ask me anything specific like "What's your experience with AI/ML?" or "Tell me about your recent projects" or "What companies have you worked for?" I'm here to chat and answer any questions you might have!`
  }

  // React definition specific - Use enhanced RAG instead of hardcoded response
  if (
    message.includes('what is react') ||
    message.includes('react ky') ||
    message.includes('react definition') ||
    (message.includes('react') && !message.includes('project') && !message.includes('experience'))
  ) {
    // Let enhanced RAG handle this instead of hardcoded response
    return "I work extensively with React in my projects, including this portfolio chatbot! It's a JavaScript library for building user interfaces that I use with Next.js for full-stack development."
  }

  // Node.js specific question
  if (message.includes('node') && !message.includes('node.js')) {
    return 'I use Node.js regularly for backend development and APIs. This portfolio chatbot runs on Next.js which is built on Node.js!'
  }

  // React projects specific
  if (message.includes('react project') || message.includes('react projects')) {
    return `Great question! I've been working with React quite a bit. My main React project right now is this AI-powered portfolio website that you're chatting with!

This entire portfolio is built with React (specifically Next.js 15 with React 19), featuring:
&bull; Interactive AI chat system with real-time messaging
&bull; Modern component architecture with TypeScript
&bull; Responsive design with Tailwind CSS
&bull; Database integration for storing chat conversations
&bull; Smooth animations and professional UI components

I'm also planning some other React projects including a task management app and a VR content showcase platform that builds on my edgedVR experience.

What I love about React is how it lets you build complex, interactive user interfaces with reusable components. Combined with modern tools like Next.js, it's perfect for creating full-stack applications like this chatbot.

Would you like to know more about the technical details of how I built this portfolio, or are you interested in React development in general?`
  }

  // Kimpton Margot specific
  if (
    message.includes('kimpton margot') ||
    message.includes('kimpton') ||
    message.includes('margot')
  ) {
    return `At Kimpton Margot Hotel, I work as an Assistant Bar Manager, which might seem different from my tech focus, but it's actually taught me valuable skills that translate well to IT operations!

I manage operations using Oracle Micros POS and Deputy systems daily. This has given me hands-on experience with:
&bull; System administration and troubleshooting
&bull; Inventory management and data tracking
&bull; Process optimization and workflow efficiency
&bull; Customer service and problem-solving under pressure

What's interesting is how this role has strengthened my IT support skills. Managing these enterprise systems, handling data integrity, and ensuring smooth operations during busy periods has taught me a lot about system reliability and user experience.

The multitasking and problem-solving skills I've developed here are directly applicable to technical support roles, and the experience with enterprise software systems adds to my overall IT expertise.

It's also helped me understand how technology impacts business operations from a user perspective, which makes me a better developer and support specialist.`
  }

  // Python and Java specific
  if (
    (message.includes('python') && message.includes('java')) ||
    message.includes('python and java')
  ) {
    return `I gained solid experience with both Python and Java during my Software Developer Internship at Aubot! Here's what I worked on:

Python Experience:
&bull; Maintained existing Python codebases for educational technology platforms
&bull; Wrote automation scripts for data processing and quality assurance
&bull; Handled data integration and content management tasks
&bull; Worked with Python libraries for web scraping and data manipulation

Java Experience:
&bull; Maintained Java applications and contributed to bug fixes
&bull; Collaborated on enterprise-level Java projects in an agile environment
&bull; Gained experience with object-oriented programming principles
&bull; Worked on code review and quality assurance processes

This internship was really valuable because I got to work with both languages in a professional setting, handling real production code rather than just personal projects. The agile development environment taught me best practices for collaborative coding, version control, and code quality.

Both languages have their strengths - Python for its simplicity and powerful libraries, Java for its robustness and enterprise-level capabilities. Having experience with both makes me more versatile as a developer.

Are you interested in a specific aspect of my Python or Java experience?`
  }

  // Companies worked for
  if (
    message.includes('companies') ||
    message.includes('worked for') ||
    message.includes('employer')
  ) {
    return `I've had diverse professional experiences that have prepared me for a career in software development:

Most recently, I completed a Software Developer Internship at Aubot (Remote, Melbourne) from December 2024 to March 2025. This was hands-on experience maintaining Python and Java codebases, building automation scripts, and working in agile development cycles. I improved QA processes by 30% and worked with educational platforms serving 15,000+ users.

I also have some contract experience in web development, including work on cross-platform applications and performance optimization projects. This taught me valuable skills in JavaScript, responsive design, and user experience.

Currently, I work as an Assistant Bar Manager at Kimpton Margot Hotel, where I manage Oracle Micros POS and Deputy systems. While this isn't tech-focused, it's given me solid experience with enterprise software, data management, and working under pressure - skills that translate well to IT support and operations roles.

I'm actively building my portfolio with AI projects, including this chatbot system, to demonstrate my passion for intelligent software development and prepare for my next role in tech.`
  }

  // AI/ML specific
  if (
    message.includes('ai') ||
    message.includes('machine learning') ||
    message.includes('ml') ||
    message.includes('artificial intelligence')
  ) {
    return `AI is definitely one of my main focus areas! I'm actively building my expertise in this field and working on practical AI applications.

Right now, I'm developing this AI-powered portfolio chatbot that you're talking to - it's a comprehensive project that demonstrates conversational AI, natural language processing, and intelligent response systems. I'm building it with modern web technologies and integrating advanced AI features that go beyond basic chatbots.

I work with frameworks like TensorFlow and have experience with Python for AI development, which I've been building on since my internship at Aubot where I worked extensively with Python scripts and data handling.

What excites me most about AI is its potential to enhance user experiences and solve real-world problems. I'm particularly interested in conversational AI, intelligent automation, and AI-powered security solutions.

I'm constantly learning through hands-on projects, online courses, and experimenting with new AI tools and APIs. My goal is to become proficient in building AI systems that are not just technically impressive, but actually useful and secure for business applications.

AI, combined with my focus on Security and Support, positions me well for the growing demand for intelligent, secure systems in the IT industry.`
  }

  // General experience/work/career
  if (message.includes('experience') || message.includes('work') || message.includes('career')) {
    return `I'm building my career with a focused approach on four key IT sectors: AI, Development, Security, and Support. My experience combines hands-on development work with emerging technologies.

I recently completed a Software Developer Internship at Aubot where I worked with Python and Java, focusing on code maintenance, script execution, and bug verification. This experience gave me solid exposure to agile development practices and quality assurance processes.

I also have experience in web development, where I worked on cross-platform applications and performance optimization. This work taught me valuable skills in JavaScript, user experience design, and responsive development.

Currently, I'm developing this AI-powered portfolio chatbot as a major project that showcases my capabilities in AI and full-stack development. I'm particularly passionate about integrating AI features that solve real problems and enhance user experiences.

My goal is to specialize in building secure, intelligent applications while providing excellent technical support. I'm always working on projects that help me grow in these areas and stay current with the latest technologies.`
  }

  // VR Development specific - keep brief and focus on transferable skills
  if (
    message.includes('vr development') ||
    message.includes('vr developer') ||
    message.includes('virtual reality') ||
    (message.includes('vr') && !message.includes('what is vr'))
  ) {
    return `I have some experience with VR development from a contract role at edgedVR, where I worked on cross-platform applications and performance optimization.

The key transferable skills I gained:
&bull; JavaScript and web application development
&bull; Cross-platform optimization (desktop, mobile, web)
&bull; Performance tuning and asset management
&bull; User experience design and testing
&bull; Working with complex technical requirements

This experience taught me valuable problem-solving skills for building responsive applications that work across different devices and platforms - skills I now apply to my current web development and AI projects.

I'm currently focusing more on AI development, full-stack web applications, and data analysis - areas where I see the most career opportunities right now.`
  }

  // Technologies specialization specific - Use consistent data
  if (
    message.includes('specialize in') ||
    message.includes('specialize') ||
    message.includes('technologies') ||
    (message.includes('what') && (message.includes('tech') || message.includes('language')))
  ) {
    return `I specialize in modern full-stack development with a focus on four key areas: AI, Development, Security, and Support.

**Core Technologies:**
• **Languages**: TypeScript, Python, JavaScript, C#, PHP, Java
• **Frontend**: React, Next.js, Vue.js, HTML/CSS, Tailwind CSS  
• **Backend**: Node.js, Express, Python frameworks, REST APIs
• **Databases**: PostgreSQL, MongoDB, SQL databases
• **AI/ML**: TensorFlow, Natural Language Processing, Conversational AI
• **Cloud & DevOps**: AWS, Docker, CI/CD pipelines

**Real Projects** (you can see these on my GitHub):
• **Digital-Twin** - TypeScript application
• **portfolio-app** - This AI-powered chatbot system
• **XC3** - Python cloud management tool  
• **my-digital-portfolio** - Cyber security demonstrator
• **Marketplace-Website** - PHP e-commerce platform

I'm particularly focused on building intelligent, secure applications that solve real problems. Want to see specific examples of my work? Ask about my GitHub projects!`
  }

  // Skills - improved matching for variations
  if (
    message.includes('skill') || // catches "skill", "skills", "whats you skill"
    message.includes('tech stack') ||
    message.includes('what can you do') ||
    message.includes('what do you know') ||
    message.includes('capabilities')
  ) {
    return `My technical skills are focused on four key IT sectors: AI, Development, Security, and Support. Here's what I work with:

Programming & Development:
I'm proficient in Python and Java from my internship at Aubot, where I maintained codebases and executed automation scripts. I also work with modern web technologies including JavaScript, HTML/CSS, and frameworks like React and Next.js for building this portfolio chatbot.

AI & Machine Learning:
I'm actively developing AI applications, including this conversational chatbot system. I work with TensorFlow for AI development and I'm constantly expanding my knowledge in natural language processing, conversational AI, and intelligent automation.

Web Development & APIs:
I have experience building full-stack applications like this portfolio chatbot, working with React, Next.js, and API development. I understand responsive design, database integration, and creating user-friendly interfaces.

System Management & Support:
My current role managing Oracle Micros POS and Deputy systems has taught me valuable skills in system administration, inventory management, and process optimization - all crucial for IT support roles.

Security & Best Practices:
I focus on secure coding practices, data handling, and system reliability. My experience with agile development and quality assurance ensures I build robust, secure applications.

I'm continuously learning and building projects that strengthen these skills, particularly in AI integration and security-focused development.`
  }

  // Projects - This will now be handled by GitHub integration above, but keep as fallback
  if (
    message.includes('projects') ||
    message.includes('portfolio') ||
    message.includes('work samples')
  ) {
    // Try to get real GitHub data
    const githubResponse = await generateGitHubEnhancedResponse(message, githubToken)
    if (githubResponse) {
      return (
        githubResponse +
        "\n\nThis AI-powered portfolio chatbot you're talking to is also one of my recent projects, built with Next.js, React, and AI integration!"
      )
    }

    // Fallback to static response
    return `I'm really excited about the projects I'm working on! You can check out my complete portfolio on GitHub at github.com/Sajal120.

My current major project is this AI-powered portfolio chatbot that you're chatting with right now! It's a comprehensive full-stack application that demonstrates my skills in AI, web development, and user experience design. I'm building it with advanced conversational AI features, database integration, and modern web technologies.

During my internship at Aubot, I worked on maintaining Python and Java codebases, executing automation scripts, and implementing quality assurance processes. This experience taught me a lot about enterprise-level development practices and agile methodologies.

I also built a cross-platform web application that focused on performance optimization and user experience design, reducing load times by 20% and improving user satisfaction across desktop and mobile devices.

I'm constantly working on new projects that help me grow in my focus areas of AI, Development, Security, and Support. Each project teaches me something new about building robust, intelligent systems that solve real problems.

Would you like to know more about any specific project or the technologies I use?`
  }

  // Contact/collaboration
  if (
    message.includes('contact') ||
    message.includes('hire') ||
    message.includes('work together') ||
    message.includes('reach')
  ) {
    return `I'd love to connect! I'm based in Auburn, Sydney, NSW, and I'm always open to discussing opportunities in AI, Development, Security, and Support.

The best way to reach me is through email - I usually respond within 24 hours. You can also check out my work on GitHub at github.com/Sajal120 where I showcase my development projects and code samples.

I'm particularly interested in opportunities that involve:
&bull; AI and machine learning applications
&bull; Full-stack development projects
&bull; Security-focused software solutions
&bull; Technical support and system optimization
&bull; Innovative projects that combine multiple technologies

Whether you're looking for someone to join your team, collaborate on a project, or need technical consultation, I'm always excited to discuss how my skills in AI, Development, Security, and Support can add value to your organization.

I'm especially passionate about building intelligent, secure systems that solve real business problems. Feel free to reach out if you'd like to chat about potential opportunities or just discuss technology!`
  }

  // Education/learning/background
  if (
    message.includes('education') ||
    message.includes('background') ||
    message.includes('learning')
  ) {
    return `I'm a strong believer in continuous learning! My background has been shaped by several years in software development with a focus on staying current with emerging technologies. I'm largely self-directed in my learning, especially when it comes to modern web frameworks, programming languages, and software architecture.

I regularly take online courses and tutorials to stay sharp, and I make it a point to read tech blogs, documentation, and industry publications. But honestly, the best learning happens when I'm building hands-on projects and experimenting with new technologies.

I'm active in developer communities and enjoy sharing knowledge with others. I find that teaching and mentoring other developers is one of the best ways to solidify my own understanding and give back to the community.

I've had opportunities to speak at local meetups and contribute to open-source projects, which keeps me connected to the broader tech community. I'm always working on side projects to explore new technologies and build things that interest me.

My approach has always been to combine strong technical skills with a genuine passion for learning and helping others grow in their careers. The tech field moves so fast, but that's what keeps it exciting and challenging!`
  }

  // Technical definitions handled by Enhanced RAG - these are fallbacks only
  /*
  if (message.includes('what is postgresql') || message.includes('postgres definition')) {
    return `PostgreSQL (often called Postgres) is a powerful, open-source relational database management system. It's known for its reliability, feature robustness, and performance.

Key features:
&bull; ACID compliance for reliable transactions
&bull; Support for JSON, arrays, and custom data types
&bull; Advanced indexing and query optimization
&bull; Strong data integrity and security features
&bull; Excellent for both small and enterprise applications

I use PostgreSQL with Neon for this portfolio's database, storing chat messages and user interactions. It's perfect for applications that need reliable data storage with complex queries!`
  }

  if (message.includes('what is python') || message.includes('python definition')) {
    return `Python is a high-level, interpreted programming language known for its simplicity and readability. It's one of the most popular languages for beginners and professionals alike.

Key strengths:
&bull; Clean, readable syntax that's easy to learn
&bull; Huge standard library and ecosystem (pip packages)
&bull; Great for web development, data science, AI/ML, automation
&bull; Cross-platform compatibility
&bull; Strong community support

I gained solid Python experience during my internship at Aubot, where I maintained codebases, wrote automation scripts, and handled data processing tasks. Python's versatility makes it perfect for everything from web backends to AI applications!`
  }

  if (message.includes('what is java') || message.includes('java definition')) {
    return `Java is a robust, object-oriented programming language that's been a cornerstone of enterprise development for decades. It's known for its "write once, run anywhere" philosophy.

Key features:
&bull; Platform independence through the Java Virtual Machine (JVM)
&bull; Strong object-oriented programming principles
&bull; Automatic memory management with garbage collection
&bull; Excellent for large-scale enterprise applications
&bull; Rich ecosystem with frameworks like Spring

I worked with Java during my Aubot internship, maintaining enterprise applications and learning best practices for large-scale software development. Java's reliability and performance make it great for business-critical applications!`
  }

  if (message.includes('what is html') || message.includes('html definition')) {
    return `HTML (HyperText Markup Language) is the standard markup language for creating web pages. It provides the basic structure and content of websites.

Key concepts:
&bull; Uses tags to define elements like headings, paragraphs, links
&bull; Semantic markup for accessibility and SEO
&bull; Forms the foundation of all web content
&bull; Works together with CSS for styling and JavaScript for interactivity
&bull; Constantly evolving with new HTML5 features

I use HTML extensively in my web development projects. Even when working with React, understanding HTML fundamentals is crucial for creating accessible, well-structured web applications!`
  }

  if (message.includes('what is css') || message.includes('css definition')) {
    return `CSS (Cascading Style Sheets) is the language used to style and layout web pages. It controls how HTML elements look and are positioned on the page.

Key features:
&bull; Separation of content (HTML) from presentation (CSS)
&bull; Responsive design with media queries
&bull; Animations and transitions
&bull; Flexible layout systems (Flexbox, Grid)
&bull; Modern features like custom properties (CSS variables)

While I often use Tailwind CSS for rapid development, understanding core CSS principles is essential. This portfolio uses CSS concepts through Tailwind classes for responsive design, animations, and professional styling!`
  }

  // Technical term definitions
  if (message.includes('what is javascript') || message.includes('javascript definition')) {
    return `JavaScript is a versatile programming language that's essential for web development. Originally created for making web pages interactive, it's now used for both frontend and backend development.

Key features:
&bull; Dynamic and interpreted language
&bull; Runs in browsers and on servers (Node.js)
&bull; Event-driven and asynchronous programming
&bull; Object-oriented and functional programming support
&bull; Huge ecosystem with npm packages

I use JavaScript extensively in my projects, especially with React and Next.js for building interactive web applications like this portfolio chatbot. It's the foundation of modern web development!`
  }

  if (message.includes('what is typescript') || message.includes('typescript definition')) {
    return `TypeScript is a strongly typed programming language that builds on JavaScript by adding static type definitions. It's developed and maintained by Microsoft.

Key benefits:
&bull; Catches errors at compile time instead of runtime
&bull; Better code completion and refactoring in IDEs
&bull; Makes large codebases more maintainable
&bull; Compiles to clean, readable JavaScript
&bull; Great for team collaboration

I use TypeScript in all my modern projects, including this portfolio website. It makes development much more reliable and helps catch bugs before they reach production!`
  }

  if (message.includes('what is next.js') || message.includes('nextjs definition')) {
    return `Next.js is a React framework that provides additional features and optimizations for production web applications. It's built by Vercel and is extremely popular for modern web development.

Key features:
&bull; Server-side rendering (SSR) and static site generation (SSG)
&bull; Built-in routing system
&bull; API routes for backend functionality
&bull; Automatic code splitting and optimization
&bull; Great developer experience with hot reloading

This entire portfolio website is built with Next.js 15! It's perfect for full-stack applications where you want both frontend and backend functionality in one framework.`
  }

  if (message.includes('what is tailwind') || message.includes('tailwind css')) {
    return `Tailwind CSS is a utility-first CSS framework that provides low-level utility classes to build custom designs without writing custom CSS.

Key benefits:
&bull; Rapid development with utility classes
&bull; Consistent design system
&bull; Responsive design made easy
&bull; Small bundle size with purging unused styles
&bull; Highly customizable

I use Tailwind CSS for styling this portfolio website. Instead of writing custom CSS, I use classes like 'bg-blue-500', 'p-4', 'flex' to build responsive, professional interfaces quickly!`
  }

  if (message.includes('what is present4d') || message.includes('present4d definition')) {
    return `Present4D is a VR content creation platform I used briefly for developing virtual reality experiences during a contract role.

I used it to create cross-platform applications that work on VR headsets, web browsers, and mobile devices. This experience taught me valuable skills in JavaScript, performance optimization, and user experience design that I now apply to my current web development projects.

While interesting to work with, I'm now focusing more on AI development, full-stack web applications, and data analysis where I see better career opportunities!`
  }

  if (message.includes('what is vr') || message.includes('virtual reality definition')) {
    return `Virtual Reality (VR) is technology that creates immersive, computer-generated environments that users can interact with through special headsets and controllers.

I have some experience with VR development from a contract role, which taught me valuable skills in JavaScript, cross-platform development, and user experience design.

While VR is interesting technology, I'm currently focusing more on AI development, web applications, and data analysis - areas with stronger job market opportunities right now!`
  }

  if (message.includes('what is agile') || message.includes('agile development')) {
    return `Agile is a software development methodology that emphasizes iterative development, collaboration, and flexibility. It's widely used in modern software teams for faster, more responsive development.

Key principles:
&bull; Short development cycles (sprints)
&bull; Regular collaboration between developers and stakeholders
&bull; Adaptive planning and continuous improvement
&bull; Working software over comprehensive documentation
&bull; Responding to change over following a rigid plan

I experienced agile development during my internship at Aubot, where I participated in sprints, collaborated on QA processes, and contributed to iterative development cycles. It's an excellent approach for delivering quality software quickly!`
  }

  if (message.includes('what is api') || message.includes('api definition')) {
    return `API (Application Programming Interface) is a set of protocols and tools that allows different software applications to communicate with each other. It defines how requests and responses should be formatted.

Key concepts:
&bull; RESTful APIs for web services
&bull; JSON data format for data exchange
&bull; HTTP methods (GET, POST, PUT, DELETE)
&bull; Authentication and security protocols
&bull; Documentation for developers to understand usage

I built the API for this chatbot using Next.js API routes! It handles chat messages, database interactions, and returns responses. APIs are essential for connecting frontend applications with backend services and databases.`
  }

  if (message.includes('what is tensorflow') || message.includes('tensorflow definition')) {
    return `TensorFlow is an open-source machine learning framework developed by Google. It's one of the most popular platforms for building and deploying AI models.

Key features:
&bull; Support for deep learning and neural networks
&bull; Works with Python, JavaScript, and other languages
&bull; Can run on CPUs, GPUs, and mobile devices
&bull; Extensive ecosystem with TensorFlow Lite, TensorFlow.js
&bull; Great for both research and production

I'm expanding my knowledge in TensorFlow for AI development, particularly for building intelligent systems and machine learning applications that can be integrated into web platforms like this chatbot!`
  }

  // About me / who are you
  if (
    message.includes('about me') ||
    message.includes('tell me about yourself') ||
    message.includes('who are you')
  ) {
    return `I'm Sajal, a developer focused on building my expertise in AI, Development, Security, and Support for the IT industry. I'm based in Auburn, Sydney, NSW, and I'm passionate about creating intelligent, secure software solutions.

What drives me is the intersection of emerging technologies with practical business applications. I love building systems that not only work well technically but also solve real problems for users and organizations.

I'm currently developing this AI-powered portfolio chatbot as a showcase project, demonstrating my capabilities in conversational AI, full-stack development, and user experience design. It represents my commitment to staying at the forefront of AI technology while maintaining focus on security and robust development practices.

My experience spans from traditional development work to cutting-edge VR applications, giving me a unique perspective on how different technologies can be integrated to create compelling user experiences.

I'm actively seeking opportunities in the IT sector where I can apply my growing expertise in AI, contribute to secure software development, and provide excellent technical support. The goal is to build a career that combines innovation with practical impact.

What would you like to know more about my journey or aspirations?`
  }

  // Context-aware follow-up responses
  if (
    message.includes('yes') ||
    message.includes('yeah') ||
    message.includes('sure') ||
    message.includes('tell me more') ||
    message.includes('more details')
  ) {
    // Check conversation history for context
    const lastMessage = conversationHistory[conversationHistory.length - 1]?.content || ''

    if (
      lastMessage.includes('technical details') ||
      lastMessage.includes('how I built this portfolio')
    ) {
      return `Great! Let me dive into the technical details of how I built this AI-powered portfolio:

Technology Stack:
&bull; Next.js 15 with React 19 - for the frontend framework
&bull; TypeScript - for type safety and better development experience
&bull; Tailwind CSS - for responsive, modern styling
&bull; PostgreSQL with Neon - for database storage of chat messages
&bull; Custom AI chat API - built with keyword-based response matching
&bull; Framer Motion - for smooth animations and transitions

Architecture:
&bull; Component-based React architecture with reusable UI components
&bull; API routes for handling chat messages and database operations
&bull; Real-time chat interface with message history
&bull; Responsive design that works on desktop and mobile
&bull; Professional portfolio sections showcasing my work

Key Features:
&bull; Intelligent chatbot with contextual responses
&bull; Database integration for persistent chat history
&bull; Modern UI with smooth animations
&bull; Professional portfolio presentation
&bull; Clean, maintainable codebase

This project really showcases my full-stack development skills and my ability to integrate AI features into practical applications!`
    }

    if (lastMessage.includes('React development') || lastMessage.includes('interested in React')) {
      return `Awesome! React development is really exciting. Here's what I think makes React great for modern web development:

Why I Love React:
&bull; Component Reusability - write once, use everywhere
&bull; Strong Community - huge ecosystem of libraries and tools
&bull; Performance - Virtual DOM makes updates super efficient
&bull; Developer Experience - great debugging tools and error messages
&bull; Flexibility - works for small widgets or large applications

My React Development Approach:
&bull; Start with create-next-app for full-stack applications
&bull; Use TypeScript for better code quality and autocomplete
&bull; Implement responsive design with Tailwind CSS
&bull; Follow component composition patterns
&bull; Focus on accessibility and user experience

Practical Tips:
&bull; Master hooks like useState, useEffect, and custom hooks
&bull; Learn state management (Context API, Redux, or Zustand)
&bull; Understand component lifecycle and optimization
&bull; Practice with real projects like portfolio sites or small apps

Are you just getting started with React, or are you looking to level up your existing React skills?`
    }

    return `Great! I'd be happy to elaborate on whatever interests you most. What specific aspect would you like me to dive deeper into? Whether it's technical details, project experiences, or anything else - just let me know!`
  }

  // Thanks
  if (message.includes('thanks') || message.includes('thank you')) {
    return `You're very welcome! I'm really glad I could help and share more about my background with you. 

If you have any other questions about my experience, projects, or anything else, feel free to ask anytime. I love talking about technology and the work I do!

And if you're interested in potentially working together or just want to continue the conversation, don't hesitate to reach out. I'm always excited to connect with people who are passionate about technology and innovation.`
  }

  */

  // Default response for unrecognized queries
  return `That's a great question! I'd love to tell you more about whatever you're curious about.

I can chat about my professional experience at companies like Aubot, edgedVR, and Kimpton Margot Hotel, the technical skills and programming expertise I've developed in Python, Java, and AI technologies, my current AI and machine learning projects including this chatbot, recent applications and systems I've built, how to get in touch if you're interested in working together, or my background, education, and learning philosophy.

Try asking me something like "What's your experience with Python and Java?" or "Tell me about your AI projects" or "What companies have you worked for?" or "What are your key achievements?"

What aspect of my background interests you most? I'm here to chat and share whatever would be most helpful for you to know!`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get recent messages from Neon Postgres
    const messages = await ChatDatabase.getRecentMessages(limit, user_id || undefined)

    return NextResponse.json({
      success: true,
      messages,
      total: messages.length,
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
