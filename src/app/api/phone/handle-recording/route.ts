import { NextRequest, NextResponse } from 'next/server'
import { omniChannelManager } from '../../../../lib/omni-channel-manager'
import { voiceService } from '../../../../services/voiceService'
import { phoneAudioCache, createPhoneAudioUrl } from '../../../../lib/phone-audio-cache'

// Escape XML special characters for TwiML
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// STEP 4: Smart Topic Intelligence Functions

// Analyze caller interests based on conversation history
interface CallerInterestAnalysis {
  detectedInterests: string[]
  conversationTone: 'technical' | 'casual' | 'business' | 'recruiter'
  engagementLevel: 'high' | 'medium' | 'low'
  topicPreferences: string[]
  questioningStyle: 'detailed' | 'overview' | 'specific'
}

function analyzeCallerInterests(conversationHistory: any[]): CallerInterestAnalysis {
  console.log('🔍 Analyzing caller interests from conversation history...')

  const interests: string[] = []
  const preferences: string[] = []
  let tone: 'technical' | 'casual' | 'business' | 'recruiter' = 'business'
  let engagement: 'high' | 'medium' | 'low' = 'medium'
  let style: 'detailed' | 'overview' | 'specific' = 'overview'

  if (conversationHistory.length === 0) {
    return {
      detectedInterests: ['introduction', 'background'],
      conversationTone: 'business',
      engagementLevel: 'medium',
      topicPreferences: ['professional_overview'],
      questioningStyle: 'overview',
    }
  }

  // Analyze conversation patterns
  const allText = conversationHistory
    .map((turn) => `${turn.userInput || ''} ${turn.aiResponse || ''}`)
    .join(' ')
    .toLowerCase()

  // Detect technical interests
  if (
    allText.includes('technical') ||
    allText.includes('programming') ||
    allText.includes('development') ||
    allText.includes('code')
  ) {
    interests.push('technical_skills')
    preferences.push('technology_focus')
    tone = 'technical'
  }

  // Detect project interests
  if (
    allText.includes('project') ||
    allText.includes('experience') ||
    allText.includes('work') ||
    allText.includes('built')
  ) {
    interests.push('projects')
    preferences.push('hands_on_experience')
  }

  // Detect career/business interests
  if (
    allText.includes('career') ||
    allText.includes('opportunity') ||
    allText.includes('role') ||
    allText.includes('position')
  ) {
    interests.push('career_goals')
    preferences.push('future_opportunities')
    tone = 'recruiter'
  }

  // Detect collaboration interests
  if (
    allText.includes('team') ||
    allText.includes('collaborate') ||
    allText.includes('work style') ||
    allText.includes('approach')
  ) {
    interests.push('collaboration')
    preferences.push('teamwork_focus')
  }

  // Determine engagement level based on conversation depth
  const avgTurnLength =
    conversationHistory.reduce((sum, turn) => sum + (turn.aiResponse?.length || 0), 0) /
    conversationHistory.length

  engagement = avgTurnLength > 200 ? 'high' : avgTurnLength > 100 ? 'medium' : 'low'

  // Determine questioning style
  if (allText.includes('specific') || allText.includes('detail') || allText.includes('example')) {
    style = 'detailed'
  } else if (
    allText.includes('overview') ||
    allText.includes('general') ||
    allText.includes('tell me about')
  ) {
    style = 'overview'
  } else {
    style = 'specific'
  }

  console.log(
    `📊 Analysis complete: ${interests.length} interests, ${tone} tone, ${engagement} engagement`,
  )

  return {
    detectedInterests: interests.length > 0 ? interests : ['general_professional'],
    conversationTone: tone,
    engagementLevel: engagement,
    topicPreferences: preferences.length > 0 ? preferences : ['balanced_discussion'],
    questioningStyle: style,
  }
}

// Smart topic selection based on analysis
interface SmartTopic {
  focus: string
  prompt: string
  reasoning: string
}

function selectSmartTopic(
  turnCount: number,
  analysis: CallerInterestAnalysis,
  conversationSummary: string,
): SmartTopic {
  console.log(`🎯 Selecting smart topic for turn ${turnCount} based on analysis...`)

  const { detectedInterests, conversationTone, engagementLevel, questioningStyle } = analysis

  // Create contextual prompt base
  const contextPrefix = conversationSummary || ''

  // Smart topic selection logic
  if (turnCount === 1) {
    // Second turn - choose based on caller's apparent focus
    if (detectedInterests.includes('technical_skills') || conversationTone === 'technical') {
      return {
        focus: 'deep_technical_skills',
        prompt: `${contextPrefix}I'd like to dive deeper into your technical expertise. Can you walk me through your programming languages, frameworks, and the specific technologies you're most passionate about working with?`,
        reasoning: 'Caller showed technical interest - diving deep into technical skills',
      }
    } else if (detectedInterests.includes('projects') || questioningStyle === 'detailed') {
      return {
        focus: 'project_showcase',
        prompt: `${contextPrefix}I'm interested in seeing your skills in action. Can you tell me about a recent project you're particularly proud of? What challenges did you face and how did you solve them?`,
        reasoning: 'Caller wants specifics - showcasing concrete project examples',
      }
    } else if (conversationTone === 'recruiter') {
      return {
        focus: 'professional_value_proposition',
        prompt: `${contextPrefix}From a professional standpoint, what unique value do you bring to a team or organization? What sets you apart in your field?`,
        reasoning: 'Recruiter tone detected - focusing on professional value',
      }
    } else {
      return {
        focus: 'technical_skills_overview',
        prompt: `${contextPrefix}Let's explore your technical background. What programming languages and technologies do you work with, and which ones do you enjoy most?`,
        reasoning: 'General business tone - balanced technical overview',
      }
    }
  } else if (turnCount === 2) {
    // Third turn - build on established interest
    if (detectedInterests.includes('career_goals') || conversationTone === 'recruiter') {
      return {
        focus: 'career_aspirations_specific',
        prompt: `${contextPrefix}Based on your background, what type of role or company environment aligns with your career goals? Are you looking for specific challenges or growth opportunities?`,
        reasoning: 'Career focus established - exploring specific aspirations',
      }
    } else if (detectedInterests.includes('technical_skills')) {
      return {
        focus: 'technical_projects_applied',
        prompt: `${contextPrefix}Now that I understand your technical skills, can you share how you've applied these technologies in real projects? What was your most challenging technical implementation?`,
        reasoning: 'Technical interest confirmed - showing applied skills',
      }
    } else {
      return {
        focus: 'recent_achievements',
        prompt: `${contextPrefix}I'd love to hear about your recent professional achievements. What project or accomplishment are you most proud of lately?`,
        reasoning: 'General interest - highlighting recent success',
      }
    }
  } else if (turnCount === 3) {
    // Fourth turn - explore collaboration or future focus
    if (engagementLevel === 'high' && conversationTone === 'technical') {
      return {
        focus: 'technical_leadership',
        prompt: `${contextPrefix}You clearly have strong technical skills. How do you approach mentoring others or leading technical decisions in a team environment?`,
        reasoning: 'High engagement + technical tone - exploring leadership',
      }
    } else if (conversationTone === 'recruiter') {
      return {
        focus: 'ideal_opportunity',
        prompt: `${contextPrefix}Thinking about your next career move, what would an ideal opportunity look like for you? What type of work environment and challenges excite you most?`,
        reasoning: 'Recruiter conversation - defining ideal opportunity',
      }
    } else {
      return {
        focus: 'collaboration_approach',
        prompt: `${contextPrefix}Tell me about your approach to working with teams. How do you handle collaboration, communication, and problem-solving in a group setting?`,
        reasoning: 'Exploring teamwork and collaboration skills',
      }
    }
  } else if (turnCount >= 4) {
    // Later turns - adaptive based on conversation flow
    if (detectedInterests.includes('collaboration') || questioningStyle === 'detailed') {
      return {
        focus: 'problem_solving_methodology',
        prompt: `${contextPrefix}I'm curious about your problem-solving approach. Can you walk me through how you tackle complex challenges, from initial analysis to implementation?`,
        reasoning: 'Detailed questioning style - exploring methodology',
      }
    } else if (conversationTone === 'recruiter' && turnCount === 4) {
      return {
        focus: 'next_steps_discussion',
        prompt: `${contextPrefix}Based on our conversation, do you have any questions about potential opportunities, or is there anything specific you'd like to discuss about your career path?`,
        reasoning: 'Recruiter conversation reaching decision point',
      }
    } else {
      return {
        focus: 'open_discussion',
        prompt: `${contextPrefix}What questions do you have for me? Is there anything specific about my experience, skills, or background you'd like to explore further?`,
        reasoning: 'Opening floor for caller questions and interests',
      }
    }
  }

  // Fallback
  return {
    focus: 'general_discussion',
    prompt: `${contextPrefix}What would you like to know more about regarding my professional background and experience?`,
    reasoning: 'Fallback - general discussion',
  }
}

// STEP 5: Controlled Audio Processing with Smart Fallbacks
interface AudioProcessingResult {
  success: boolean
  transcript?: string
  keywords?: string[]
  confidence?: number
  fallbackReason?: string
}

async function processAudioWithFallback(
  recordingUrl: string,
  duration: number,
): Promise<AudioProcessingResult> {
  try {
    console.log('🎵 Processing audio with controlled recognition...')
    console.log(`⏱️ Duration: ${duration}s, URL: ${recordingUrl.substring(0, 80)}...`)

    // Skip very short recordings (likely accidental)
    if (duration < 2) {
      return {
        success: false,
        fallbackReason: 'Recording too short (less than 2 seconds)',
      }
    }

    // Skip very long recordings (likely hold music or silence)
    if (duration > 30) {
      return {
        success: false,
        fallbackReason: 'Recording too long (over 30 seconds) - likely background noise',
      }
    }

    // Download and transcribe audio
    console.log('📥 Downloading recording for transcription...')
    const audioBuffer = await downloadRecording(recordingUrl)

    if (audioBuffer.length === 0) {
      return {
        success: false,
        fallbackReason: 'Empty audio buffer',
      }
    }

    console.log(`📊 Audio buffer size: ${audioBuffer.length} bytes`)
    const transcript = await transcribeAudio(audioBuffer)

    if (!transcript || transcript.length < 3) {
      return {
        success: false,
        fallbackReason: 'Transcript too short or empty',
      }
    }

    // Basic keyword extraction for context
    const keywords = extractKeywords(transcript)

    console.log('✅ Audio processing completed successfully')
    console.log(`📝 Transcript: ${transcript}`)
    console.log(`🔑 Keywords: ${keywords.join(', ')}`)

    return {
      success: true,
      transcript,
      keywords,
      confidence: transcript.length > 10 ? 0.8 : 0.6,
    }
  } catch (error: any) {
    console.log('❌ Audio processing failed:', error?.message || 'Unknown error')
    return {
      success: false,
      fallbackReason: `Processing error: ${error?.message || 'Unknown error'}`,
    }
  }
}

// Extract basic keywords from transcript for context
function extractKeywords(transcript: string): string[] {
  const keywords: string[] = []
  const text = transcript.toLowerCase()

  // Technical keywords
  const techTerms = [
    'technical',
    'programming',
    'development',
    'code',
    'project',
    'software',
    'engineering',
  ]
  techTerms.forEach((term) => {
    if (text.includes(term)) keywords.push(term)
  })

  // Career keywords
  const careerTerms = ['career', 'job', 'opportunity', 'role', 'position', 'hiring', 'interview']
  careerTerms.forEach((term) => {
    if (text.includes(term)) keywords.push(term)
  })

  // Collaboration keywords
  const collabTerms = ['team', 'collaborate', 'work', 'together', 'experience']
  collabTerms.forEach((term) => {
    if (text.includes(term)) keywords.push(term)
  })

  return [...new Set(keywords)] // Remove duplicates
}

// Handle recorded audio from Twilio and process with AI
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🎙️ Recording webhook called - processing user speech...')

  // TOP-LEVEL ERROR HANDLER: Catch ANY unhandled errors and return TwiML
  try {
    // CRITICAL: Wrap entire processing in timeout to prevent Twilio timeout (11205)
    const processingPromise = (async () => {
      try {
        // Parse Twilio form data
        const formData = await request.formData()
        const webhookData = Object.fromEntries(formData.entries())

        const callSid = webhookData.CallSid as string
        const recordingUrl = webhookData.RecordingUrl as string
        const recordingSid = webhookData.RecordingSid as string
        const duration = webhookData.RecordingDuration as string

        console.log('🎵 Recording received:', {
          callSid,
          recordingSid,
          duration: `${duration}s`,
          recordingUrl,
        })

        // Validate required fields
        if (!callSid) {
          console.error('❌ Missing CallSid')
          throw new Error('Missing required webhook data')
        }

        console.log('🎤 Step 5: Enabling controlled audio recognition with keyword detection...')

        // STEP 5: Controlled audio processing with smart fallbacks
        let userMessage = 'Continue our professional conversation'
        let audioProcessingSuccess = false

        // Get turn count BEFORE attempting transcription
        const unifiedContextPreview = await omniChannelManager.getUnifiedContext(
          callSid,
          'phone',
          callSid,
          'Twilio Voice API',
        )
        const currentTurn = unifiedContextPreview.conversationHistory?.length || 0
        console.log(`🔢 Current turn: ${currentTurn}`)

        // ONLY attempt transcription if this is NOT turn 0 (user has actually spoken)
        if (currentTurn > 0 && recordingUrl && duration && parseInt(duration) > 1) {
          console.log('🔊 Attempting audio transcription for keyword detection...')
          try {
            const audioProcessingResult = await processAudioWithFallback(
              recordingUrl,
              parseInt(duration),
            )
            if (audioProcessingResult.success && audioProcessingResult.transcript) {
              userMessage = audioProcessingResult.transcript
              audioProcessingSuccess = true
              console.log('✅ Audio processing successful:', userMessage.substring(0, 100) + '...')
            } else {
              console.log('⚠️ Audio processing failed, using progressive conversation system')
            }
          } catch (audioError: any) {
            console.log(
              '⚠️ Audio processing error, continuing with progressive system:',
              audioError?.message || 'Unknown error',
            )
          }
        } else if (currentTurn === 0) {
          console.log(
            "👋 Turn 0: Skipping transcription (initial greeting, user hasn't spoken yet)",
          )
        } else {
          console.log('📝 No audio to process, using progressive conversation flow')
        }

        // OMNI-CHANNEL ENHANCEMENT: Get unified conversation context across all channels
        console.log('🌐 Initializing omni-channel conversation context...')
        const unifiedContext = await omniChannelManager.getUnifiedContext(
          callSid, // Using callSid as userId for phone channel
          'phone',
          callSid,
          'Twilio Voice API',
        )

        console.log(
          `👤 Unified context loaded: ${unifiedContext.channels.length} channels, ${unifiedContext.conversationHistory.length} total turns`,
        )
        console.log(`🎯 Relationship type: ${unifiedContext.relationshipContext.callerType}`)
        console.log(
          `📞 Current channel: ${unifiedContext.currentChannel.type} (${unifiedContext.currentChannel.platform})`,
        )

        // Get professional context for AI response (legacy compatibility)
        const conversationContext = {
          callSid,
          conversationType: 'professional_phone_inquiry',
          callerContext: unifiedContext.relationshipContext.callerType,
          conversationHistory: unifiedContext.conversationHistory,
          interviewType:
            unifiedContext.relationshipContext.callerType === 'recruiter'
              ? 'hr_screening'
              : 'professional',
          enhancedMode: true,
          omniChannelData: unifiedContext,
        }

        // STEP 4 IMPROVEMENT: Smart Topic Intelligence - AI chooses best topics based on caller interest
        const turnCount = conversationContext.conversationHistory?.length || 0

        console.log(`🔢 Turn count for CallSid ${callSid}: ${turnCount}`)
        console.log(`📜 Conversation history length: ${unifiedContext.conversationHistory.length}`)

        // If this is turn 0 but we have a recordingSid, something is wrong with history loading
        if (turnCount === 0 && recordingSid) {
          console.warn(
            '⚠️ WARNING: Turn count is 0 but we have a recordingSid - history might not be loading!',
          )
        }

        // Analyze conversation pattern and caller interests
        const smartTopicAnalysis = analyzeCallerInterests(
          conversationContext.conversationHistory || [],
        )
        console.log('🧠 Smart topic analysis:', smartTopicAnalysis)

        let conversationFocus = 'general_background'
        let contextualPrompt = 'Tell me about your professional background and experience'

        // Build context from previous conversation history
        const previousTopics =
          conversationContext.conversationHistory?.map((turn) => turn.userInput) || []
        const conversationSummary =
          previousTopics.length > 0
            ? `Previous discussion covered: ${previousTopics.slice(-2).join(', ')}. `
            : ''

        // STEP 5: Enhanced topic selection with audio recognition integration
        if (turnCount === 0) {
          conversationFocus = 'introduction_overview'
          contextualPrompt =
            'Give me a professional introduction and overview of your background. This is our first interaction, so provide a comprehensive overview.'
        } else {
          // Use AI to determine the best next topic, incorporating audio when available
          const smartTopic = selectSmartTopic(turnCount, smartTopicAnalysis, conversationSummary)
          conversationFocus = smartTopic.focus

          // STEP 5: Use actual user speech when audio processing succeeded
          if (audioProcessingSuccess && userMessage !== 'Continue our professional conversation') {
            contextualPrompt = `The caller said: "${userMessage}". ${smartTopic.prompt} Please respond directly to their question while incorporating the suggested context.`
            console.log('🎙️ Using actual user speech in prompt')
          } else {
            contextualPrompt = smartTopic.prompt
            console.log('📝 Using smart topic prompt (no audio or fallback)')
          }

          console.log(`🎯 Smart topic selected: ${conversationFocus}`)
          console.log(`💡 Interest indicators: ${smartTopicAnalysis.detectedInterests.join(', ')}`)
          console.log(`🔊 Audio success: ${audioProcessingSuccess}`)
        }

        console.log(`🎯 Turn ${turnCount}: Focus on ${conversationFocus}`)
        console.log(`💬 Contextual prompt: ${contextualPrompt}`)

        // OMNI-CHANNEL AI RESPONSE: Generate unified response using enhanced context
        console.log('🤖 Generating omni-channel AI response...')
        console.log(
          `📝 Input type: ${audioProcessingSuccess ? 'ACTUAL SPEECH' : 'Contextual prompt'}`,
        )
        console.log(
          `💬 User said: "${audioProcessingSuccess ? userMessage : 'No audio processed'}"`,
        )

        let aiResponse: any

        // ALWAYS USE OMNI-CHANNEL - 2 fast attempts (no fallbacks!)
        let retryCount = 0
        const maxRetries = 2 // Retry once if first fails
        let lastError: any = null

        while (retryCount < maxRetries) {
          try {
            // Use actual user input if audio was processed, otherwise use contextual prompt
            // CLEAN INPUT: Send EXACTLY what user asked - no extra prompts or context
            // This ensures MCP searches for what they actually asked
            // Example: "education" → searches education, NOT work experience
            const cleanInput = audioProcessingSuccess ? userMessage : contextualPrompt

            console.log(
              `🔄 Attempt ${retryCount + 1}/${maxRetries}: Calling omni-channel with CLEAN input`,
            )
            console.log(`📝 Sending EXACT question to MCP: "${cleanInput}"`)
            console.log(
              `🎯 Audio processed: ${audioProcessingSuccess} (clean=${audioProcessingSuccess})`,
            )

            const unifiedResponse = await omniChannelManager.generateUnifiedResponse(
              callSid,
              cleanInput,
              {
                currentTurn: turnCount,
                phoneCall: true,
                ultraBrief: true,
              },
            )

            console.log('✅ Omni-channel response generated successfully!')
            console.log(`📊 Source: ${unifiedResponse.source}`)
            console.log(`🎯 Response preview: ${unifiedResponse.response.substring(0, 150)}...`)

            // Store conversation turn in omni-channel system
            await omniChannelManager.addConversationTurn(
              callSid,
              cleanInput,
              unifiedResponse.response,
              {
                audioProcessed: audioProcessingSuccess,
                confidence: audioProcessingSuccess ? 0.9 : 0.5,
                keywords: smartTopicAnalysis.detectedInterests,
                channelType: 'phone',
                conversationFocus,
                turnNumber: turnCount,
              },
            )

            aiResponse = {
              response: unifiedResponse.response,
              success: true,
              source: unifiedResponse.source,
              suggestions: unifiedResponse.suggestions,
            }

            // Success - break out of retry loop
            break
          } catch (omniError: any) {
            lastError = omniError
            retryCount++
            console.error(`❌ Omni-channel attempt ${retryCount} failed:`, omniError.message)
            // No delay - retry immediately for speed
          }
        }

        // If AI failed after retries, return TwiML to continue conversation
        if (!aiResponse) {
          console.error('💥 AI FAILED - Asking user to repeat')
          console.error(`Error: ${lastError?.message}`)

          // Return TwiML to ask user to repeat (don't throw!)
          const retryTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    Sorry, could you repeat that?
  </Say>
  <Record 
    action="/api/phone/handle-recording"
    method="POST"
    timeout="10"
    finishOnKey="#"
    maxLength="120"
    playBeep="false"
  />
</Response>`
          return new NextResponse(retryTwiml, {
            status: 200,
            headers: {
              'Content-Type': 'text/xml; charset=utf-8',
              'Cache-Control': 'no-cache',
            },
          })
        }

        console.log('🤖 Enhanced AI Response ready:', aiResponse.response.substring(0, 100) + '...')

        // Create TwiML to speak AI response and continue recording
        // TEMPORARY: Use Twilio voice while fixing audio serving issue
        console.log('🎤 Using Twilio voice for reliable conversation flow')
        console.log('📝 AI Response ready:', aiResponse.response.substring(0, 100) + '...')

        // NATURAL CONVERSATION PROMPTS: Enhanced follow-ups using omni-channel intelligence
        let conversationPrompt = 'Please continue with your questions.'

        if (turnCount === 0) {
          // First interaction - warm professional greeting
          const relationshipType = unifiedContext.relationshipContext.callerType
          if (relationshipType === 'recruiter') {
            conversationPrompt =
              'What specific aspects of my background are most relevant to the opportunity you have in mind?'
          } else if (relationshipType === 'colleague') {
            conversationPrompt =
              'What would you like to know about my experience or how we might collaborate?'
          } else {
            conversationPrompt =
              'What would you like to know more about regarding my technical skills and experience?'
          }
        } else {
          // Use omni-channel suggestions if available, otherwise smart follow-up
          if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
            const suggestion = aiResponse.suggestions[0]
            conversationPrompt = `Would you like me to ${suggestion.toLowerCase()}, or do you have other questions?`
          } else {
            // Generate smart follow-up based on the topic and caller analysis
            const smartPrompt = generateSmartFollowUp(
              conversationFocus,
              smartTopicAnalysis,
              turnCount,
            )
            conversationPrompt = smartPrompt
          }
          console.log(`💬 Natural conversation prompt: ${conversationPrompt}`)
        }

        // FINAL ULTRA-AGGRESSIVE CLEAN: Remove any remaining metadata before voice generation
        aiResponse.response = aiResponse.response
          // First pass: Remove markdown formatting to prevent partial markers
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/#{1,6}\s+/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          // Second pass: Remove metadata patterns (including partially cleaned ones)
          .replace(/Enhanced Interview Response[^:]*:\.?\s*/gi, '')
          .replace(/\(general context\):\.?\s*/gi, '')
          .replace(/\(specific context\):\.?\s*/gi, '')
          .replace(/Query Enhancement[:\*\*:]*[^\n.]*\.?\s*/gi, '')
          .replace(/Processing Mode[:\*\*:]*[^\n.]*\.?\s*/gi, '')
          .replace(/Context Mode[:\*\*:]*[^\n.]*\.?\s*/gi, '')
          .replace(/Source[:\*\*:]*[^\n.]*\.?\s*/gi, '')
          .replace(/Response Type[:\*\*:]*[^\n.]*\.?\s*/gi, '')
          // Third pass: Fix grammar issues in greetings
          .replace(/^Hello\s+this\s+Sajal\s+Basnet/gi, "Hello, I'm Sajal Basnet")
          .replace(/^Hi\s+this\s+Sajal\s+Basnet/gi, "Hi, I'm Sajal Basnet")
          .replace(/^This\s+is\s+Sajal\s+Basnet/gi, "I'm Sajal Basnet")
          .replace(
            /^Sajal\s+Basnet\s+(?:is\s+)?a\s+(?:senior\s+)?software\s+(?:engineer|developer)/gi,
            "I'm Sajal Basnet, a full-stack software developer",
          )
          // Fourth pass: Remove bullet points and excessive listing patterns
          .replace(/\s*-\s+[^,\n]+?,\s*/g, ' ') // Remove "- item," patterns
          .replace(/\s*-\s+[^,\n]+?\.\s*/g, '. ') // Remove "- item." patterns
          .replace(/,\s*-\s+/g, ', ') // Clean up remaining list markers
          // Fifth pass: Catch any remaining ** or * fragments
          .replace(/\*\*+/g, '')
          .replace(/\*+/g, '')
          // Remove separators
          .replace(/---+/g, '')
          .replace(/___+/g, '')
          // Clean up spacing and artifacts
          .replace(/\s+-\.\s*/g, ' ') // Remove "-. " artifacts
          .replace(/\s+-\s*$/g, '') // Remove trailing " -"
          .replace(/\s+\./g, '.')
          .replace(/\.\s*\./g, '.')
          .replace(/,\s*,/g, ',')
          .replace(/\s+/g, ' ')
          .trim()

        // Truncate overly long responses for phone (max 300 chars for natural speech)
        if (aiResponse.response.length > 300) {
          const sentences = aiResponse.response.split(/\.\s+/)
          let truncated = ''
          for (const sentence of sentences) {
            if ((truncated + sentence).length < 280) {
              truncated += sentence + '. '
            } else {
              break
            }
          }
          aiResponse.response = truncated.trim()
          console.log('✂️ Truncated long response for natural phone conversation')
        }

        console.log(
          `🧹 Final cleaned response preview: ${aiResponse.response.substring(0, 100)}...`,
        )

        // CUSTOM VOICE INTEGRATION: Use your ElevenLabs cloned voice for natural conversation
        console.log('🎤 Generating custom voice audio for phone response...')

        let twiml: string

        try {
          // Generate custom voice audio with ElevenLabs directly for speed
          console.log('🔊 Creating audio with your cloned voice...')

          const fullResponse = `${aiResponse.response}`

          // Call ElevenLabs API with AbortController - ULTRA FAST (2s max)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 2000) // 2s hard limit

          const elevenlabsResponse = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
            {
              method: 'POST',
              headers: {
                Accept: 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
              },
              body: JSON.stringify({
                text: fullResponse,
                model_id: 'eleven_turbo_v2_5', // Fastest model
                voice_settings: {
                  stability: 0.65,
                  similarity_boost: 0.85,
                  style: 0.2,
                  use_speaker_boost: true,
                },
                output_format: 'mp3_44100_128', // Higher bitrate for better volume
              }),
              signal: controller.signal,
            },
          )

          clearTimeout(timeoutId)

          if (!elevenlabsResponse.ok) {
            console.error(`❌ ElevenLabs API error: ${elevenlabsResponse.status}`)
            throw new Error(`ElevenLabs failed: ${elevenlabsResponse.status}`)
          }

          const audioBuffer = await elevenlabsResponse.arrayBuffer()

          if (!audioBuffer || audioBuffer.byteLength === 0) {
            console.error('❌ ElevenLabs returned empty audio')
            throw new Error('Empty audio buffer from ElevenLabs')
          }

          // Create audio URL for Twilio to play
          const audioUrl = await createPhoneAudioEndpoint(audioBuffer, fullResponse)

          console.log('✅ ElevenLabs voice audio generated successfully')
          console.log(`🎵 Audio URL: ${audioUrl.substring(0, 60)}...`)

          // TwiML with custom voice audio
          twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Record 
    action="/api/phone/handle-recording"
    method="POST"
    timeout="10"
    finishOnKey="#"
    maxLength="120"
    playBeep="false"
  />
</Response>`

          console.log('✅ Using ElevenLabs voice (your cloned voice)')
        } catch (voiceError: any) {
          console.error('❌ ElevenLabs voice failed:', voiceError.message)
          console.warn('⚠️ Falling back to Twilio Say (will retry ElevenLabs on next turn)')

          // Use Twilio Say as temporary fallback (better than timing out)
          twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">${aiResponse.response.substring(0, 200)}</Say>
  <Record 
    action="/api/phone/handle-recording"
    method="POST"
    timeout="10"
    finishOnKey="#"
    maxLength="120"
    playBeep="false"
  />
</Response>`
          console.log('🔄 Using Twilio voice as temporary fallback')
        }

        // STEP 5: Store conversation history with clean user input
        const storedInput = audioProcessingSuccess ? userMessage : contextualPrompt
        await storeConversationTurn(callSid, {
          userInput: storedInput,
          aiResponse: aiResponse.response,
          timestamp: new Date().toISOString(),
          recordingSid: recordingSid || 'step5_audio_enabled',
          duration,
          audioProcessed: audioProcessingSuccess,
          actualSpeech: audioProcessingSuccess ? userMessage : undefined,
        })

        const totalTime = Date.now() - startTime
        console.log(`✅ TwiML response generated in ${totalTime}ms, returning to Twilio`)
        console.log('📤 TwiML preview:', twiml.substring(0, 200) + '...')

        return new NextResponse(twiml, {
          status: 200,
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        })
      } catch (error) {
        console.error('❌ Recording processing error:', error)
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')

        // Return TwiML to continue conversation (don't throw!)
        const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    I didn't catch that. Could you say it again?
  </Say>
  <Record 
    action="/api/phone/handle-recording"
    method="POST"
    timeout="10"
    finishOnKey="#"
    maxLength="120"
    playBeep="false"
  />
</Response>`
        return new NextResponse(errorTwiml, {
          status: 200,
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        })
      }
    })()

    // Race between processing and timeout (9s: 5s MCP + 4s Groq max)
    try {
      const result = await Promise.race([
        processingPromise,
        new Promise<NextResponse>((_, reject) =>
          setTimeout(() => reject(new Error('Processing timeout after 9s')), 9000),
        ),
      ])
      return result
    } catch (timeoutError) {
      console.error('⏱️ TIMEOUT after 9s - MCP/Groq took too long')
      console.error('Timeout error:', timeoutError)

      // Return intelligent fallback using conversation context (not generic!)
      const timeoutTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    Could you please repeat that?
  </Say>
  <Record 
    action="/api/phone/handle-recording"
    method="POST"
    timeout="10"
    finishOnKey="#"
    maxLength="120"
    playBeep="false"
  />
</Response>`
      return new NextResponse(timeoutTwiml, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }
  } catch (unexpectedError) {
    // TOP-LEVEL CATCH: Handle ANY unhandled errors
    console.error('🚨 UNEXPECTED ERROR in POST handler:', unexpectedError)
    console.error('Stack:', unexpectedError instanceof Error ? unexpectedError.stack : 'No stack')

    // Return TwiML to keep call alive (never return HTTP 500!)
    const emergencyTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    Sorry, let me try again. What would you like to know?
  </Say>
  <Record 
    action="/api/phone/handle-recording"
    method="POST"
    timeout="10"
    finishOnKey="#"
    maxLength="120"
    playBeep="false"
  />
</Response>`
    return new NextResponse(emergencyTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  }
}

// Download recording from Twilio
async function downloadRecording(recordingUrl: string): Promise<Buffer> {
  try {
    console.log('🔐 Checking Twilio credentials...')
    // Add Twilio auth to the URL
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('❌ Missing Twilio credentials in environment')
      throw new Error('Missing Twilio credentials')
    }

    console.log('✅ Twilio credentials found, downloading recording...')
    console.log('📥 Recording URL:', recordingUrl)

    // Create authenticated URL
    const authString = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')

    const response = await fetch(recordingUrl, {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    })

    console.log('📊 Download response status:', response.status, response.statusText)

    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.statusText}`)
    }

    return Buffer.from(await response.arrayBuffer())
  } catch (error) {
    console.error('Error downloading recording:', error)
    throw error
  }
}

// Transcribe audio using Groq Whisper (much faster than OpenAI!)
async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    console.log('� Using Groq Whisper (10x faster than OpenAI)...')

    // Try Groq first (MUCH faster - typically 500ms vs 3-5s)
    if (process.env.GROQ_API_KEY) {
      try {
        const formData = new FormData()
        const uint8Array = new Uint8Array(audioBuffer)
        const audioBlob = new Blob([uint8Array], { type: 'audio/wav' })
        formData.append('file', audioBlob, 'recording.wav')
        formData.append('model', 'whisper-large-v3')
        formData.append('language', 'en')
        formData.append('temperature', '0') // Most accurate transcription
        formData.append('response_format', 'verbose_json')
        formData.append(
          'prompt',
          'Phone interview with Sajal Basnet, software developer. Topics: work experience at Kimpton, Aubot, edgedVR; AI and machine learning interests; security; Masters degree from Swinburne University; skills in React, Python, JavaScript, AWS, Terraform; Sydney location; career goals. Common questions: What do you do? Your experience? Your background? Your education? Your skills? What are you interested in? Tell me about yourself.',
        )

        console.log('📤 Sending to Groq Whisper API (ULTRA FAST)...')
        const groqResponse = (await Promise.race([
          fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: formData,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Groq timeout')), 1200)), // 1.5s timeout for speed
        ])) as Response

        if (groqResponse.ok) {
          const result = await groqResponse.json()
          const transcribedText = result.text || 'Could not transcribe'
          console.log('✅ Groq transcription successful!')
          console.log('🎤 USER SAID:', transcribedText)
          console.log('📊 Confidence:', result.segments?.[0]?.no_speech_prob || 'N/A')
          return transcribedText
        }
      } catch (groqError) {
        console.warn('⚠️ Groq failed, falling back to OpenAI:', groqError)
      }
    }

    // Fallback to OpenAI Whisper if Groq fails
    console.log('🔑 Checking OpenAI API key...')
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ No transcription API available')
      throw new Error('No transcription API key configured')
    }

    console.log('✅ Using OpenAI Whisper fallback...')
    const formData = new FormData()
    const uint8Array = new Uint8Array(audioBuffer)
    const audioBlob = new Blob([uint8Array], { type: 'audio/wav' })
    formData.append('file', audioBlob, 'recording.wav')
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')

    console.log('📤 Sending audio to OpenAI Whisper API...')
    const response = (await Promise.race([
      fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Whisper timeout')), 10000)),
    ])) as Response

    console.log('📊 OpenAI response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ OpenAI API error details:', errorText)
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    return result.text || 'Could not transcribe audio'
  } catch (error) {
    console.error('Error transcribing audio:', error)
    return "I couldn't understand that. Could you please repeat?"
  }
}

// Enhanced conversation storage with professional context
interface ConversationData {
  history: Array<{
    userInput: string
    aiResponse: string
    timestamp: string
    recordingSid?: string
    duration?: string
  }>
  context: any
  interviewType: string
  callerInfo: any
}

const conversationStore = new Map<string, ConversationData>()

// Get conversation context for the call with MCP integration
async function getConversationContext(callSid: string) {
  try {
    console.log(`📋 Getting enhanced conversation context for call: ${callSid}`)

    // Get or initialize conversation data
    let conversationData = conversationStore.get(callSid)
    if (!conversationData) {
      conversationData = {
        history: [],
        context: {},
        interviewType: 'professional_phone_call',
        callerInfo: { source: 'phone', callSid },
      }
      conversationStore.set(callSid, conversationData)
    }

    console.log(`💭 Found ${conversationData.history.length} previous conversation turns`)
    console.log(`🎯 Interview type: ${conversationData.interviewType}`)

    return {
      callSid,
      conversationType: 'professional_phone_inquiry',
      callerContext: 'phone_interview_networking_recruiting',
      conversationHistory: conversationData.history.slice(-8), // Keep last 8 exchanges for rich context
      interviewType: conversationData.interviewType,
      enhancedMode: true, // Always use enhanced mode for phone calls
    }
  } catch (error) {
    console.error('Error getting conversation context:', error)
    return {
      callSid,
      conversationType: 'general',
      callerContext: 'unknown',
      conversationHistory: [],
      interviewType: 'general',
      enhancedMode: true,
    }
  }
}

// Generate smart follow-up questions based on conversation context
function generateSmartFollowUp(
  conversationFocus: string,
  analysis: CallerInterestAnalysis,
  turnCount: number,
): string {
  const { conversationTone, engagementLevel, questioningStyle } = analysis

  console.log(
    `🧠 Generating smart follow-up for: ${conversationFocus}, tone: ${conversationTone}, engagement: ${engagementLevel}`,
  )

  // Adaptive follow-ups based on conversation focus and caller style
  switch (conversationFocus) {
    case 'deep_technical_skills':
      return questioningStyle === 'detailed'
        ? "Which of these technologies would you like me to elaborate on, or are there specific technical challenges you're curious about?"
        : 'What technical areas interest you most for your project or team?'

    case 'project_showcase':
    case 'technical_projects_applied':
      return conversationTone === 'recruiter'
        ? 'How do these project experiences align with the type of work or challenges you have in mind?'
        : "Are there particular aspects of my project approach that you'd like to explore further?"

    case 'professional_value_proposition':
    case 'career_aspirations_specific':
      return engagementLevel === 'high'
        ? "Based on what I've shared, what opportunities or roles do you think might be a strong fit?"
        : 'What questions do you have about my career goals or professional background?'

    case 'technical_leadership':
      return 'Are you looking for someone with technical leadership experience, or would you like to know more about my collaborative approach?'

    case 'ideal_opportunity':
      return 'Does this align with what you have in mind, or would you like to discuss how my background fits your specific needs?'

    case 'collaboration_approach':
      return conversationTone === 'technical'
        ? "How does my collaboration style fit with your team's technical workflow?"
        : 'What collaboration qualities are most important for your team environment?'

    case 'problem_solving_methodology':
      return "Would you like me to walk through a specific example, or are there particular problem-solving challenges you're facing?"

    case 'recent_achievements':
      return 'Which of these achievements resonates most with your current needs or interests?'

    case 'next_steps_discussion':
      return 'What additional information would be helpful for our next conversation, or shall we discuss potential next steps?'

    case 'open_discussion':
      return 'What specific aspects of my background would be most relevant to explore further?'

    default:
      // Adaptive fallback based on conversation tone
      if (conversationTone === 'recruiter') {
        return "How does my background align with what you're looking for, or what other areas should we explore?"
      } else if (conversationTone === 'technical') {
        return "Are there specific technical aspects you'd like me to dive deeper into?"
      } else {
        return 'What would you like to explore next about my professional background?'
      }
  }
}

// Generate AI response using MCP server and enhanced chat system
async function generateAIResponse(userMessage: string, context: any) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.sajal-app.online'

    console.log(
      '🤖 Generating AI response with full MCP integration for:',
      userMessage.substring(0, 100) + '...',
    )
    console.log('📞 Call context:', context.callSid, '| Type:', context.interviewType)
    console.log('💭 Conversation history length:', context.conversationHistory?.length || 0)

    // Try MCP server integration first (most comprehensive)
    try {
      console.log('🔌 Attempting MCP server integration...')
      const mcpResponse = await fetch(`${baseUrl}/api/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `phone_${context.callSid}_${Date.now()}`,
          method: 'tools/call',
          params: {
            name: 'ask_digital_twin',
            arguments: {
              question: userMessage,
              interviewType: context.interviewType || 'general',
              enhancedMode: true,
              maxResults: 5, // More context for phone calls
            },
          },
        }),
      })

      if (mcpResponse.ok) {
        const mcpData = await mcpResponse.json()
        if (mcpData.result?.content?.[0]?.text) {
          console.log('✅ MCP server response successful')
          // Clean up the response for voice (remove markdown formatting and MCP structure)
          let cleanResponse = mcpData.result.content[0].text
            .replace(/\*\*Enhanced Interview Response\*\* \([^)]+\):\s*/g, '') // Remove MCP header
            .replace(/---\s*\*\*[^*]+\*\*:[^\n]+/g, '') // Remove metadata lines
            .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
            .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
            .replace(/---\n/g, '') // Remove dividers
            .replace(/\n\n+/g, '. ') // Replace multiple newlines with periods
            .replace(/\n/g, '. ') // Replace single newlines with periods
            .replace(/\.\s*\./g, '.') // Remove duplicate periods
            .trim()

          // Ensure it starts naturally for phone conversation
          if (!cleanResponse.match(/^(Hello|Hi|I am|I'm|My name is|Thank you)/i)) {
            cleanResponse = `I'm Sajal Basnet. ${cleanResponse}`
          }

          console.log('🎯 Cleaned response preview:', cleanResponse.substring(0, 100) + '...')

          return {
            response: cleanResponse,
            success: true,
            source: 'mcp_server',
          }
        }
      }
    } catch (mcpError: any) {
      console.warn('⚠️ MCP server unavailable, falling back to chat API:', mcpError.message)
    }

    // Fallback to enhanced chat API
    console.log('🔄 Using enhanced chat API as fallback...')
    const chatResponse = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        user_id: `phone_${context.callSid}`,
        role: 'user',
        content: userMessage,
        enhancedMode: true,
        interviewType: context.interviewType || 'general',
        conversationHistory: context.conversationHistory || [],
        context: `Professional phone call via Twilio. Call ID: ${context.callSid}. This is a live phone conversation requiring natural, conversational responses.`,
      }),
    })

    if (!chatResponse.ok) {
      console.error('Chat API error:', chatResponse.status, chatResponse.statusText)
      throw new Error(`Chat API error: ${chatResponse.statusText}`)
    }

    const chatData = await chatResponse.json()
    console.log('✅ Chat API response generated successfully')
    console.log('📊 Enhanced mode active:', chatData.enhanced)

    // Clean up chat response for voice
    let cleanResponse = (chatData.response || chatData.message?.content || chatData.content)
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
      .replace(/\n\n+/g, '. ') // Replace multiple newlines with periods
      .replace(/\n/g, '. ') // Replace single newlines with periods
      .replace(/\.\s*\./g, '.') // Remove duplicate periods
      .trim()

    // Ensure it starts naturally for phone conversation
    if (!cleanResponse.match(/^(Hello|Hi|I am|I'm|My name is|Thank you)/i)) {
      cleanResponse = `I'm Sajal Basnet. ${cleanResponse}`
    }

    console.log('🎯 Chat cleaned response preview:', cleanResponse.substring(0, 100) + '...')

    return {
      response:
        cleanResponse || "I apologize, but I'm having trouble generating a response right now.",
      success: chatData.success !== false,
      source: 'chat_api',
      enhanced: chatData.enhanced,
    }
  } catch (error) {
    console.error('Error generating AI response:', error)
    return {
      response:
        "Thank you for calling. I'm having a technical issue right now, but I'm Sajal Basnet, a software engineer. Could you please repeat your question?",
      success: false,
      source: 'fallback',
    }
  }
} // Generate speech using ElevenLabs custom voice
async function generateCustomVoiceSpeech(text: string): Promise<string | null> {
  try {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'WcXkU7PbsO0uKKBdWJrG' // Your custom voice

    if (!elevenLabsApiKey) {
      console.log('🔇 ElevenLabs API key not found in environment variables')
      console.log('📝 Set ELEVENLABS_API_KEY in Vercel dashboard for custom voice')
      console.log('🔄 Falling back to Twilio voice')
      return null
    }

    console.log(
      '🎤 Generating custom voice speech with ElevenLabs for text:',
      text.substring(0, 100) + '...',
    )
    console.log('🔑 Using voice ID:', voiceId)

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      console.error('ElevenLabs API error:', response.status, response.statusText)
      const errorBody = await response.text()
      console.error('ElevenLabs error details:', errorBody)
      return null
    }

    // Get the audio buffer
    const audioBuffer = await response.arrayBuffer()

    // Convert to base64 for temporary use (not needed with new system)
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`

    // Note: This function is deprecated - use createPhoneAudioEndpoint instead
    console.log('✅ Custom voice speech generated successfully (legacy path)')
    return audioDataUrl // Return data URL as fallback
  } catch (error) {
    console.error('Error generating custom voice speech:', error)
    return null
  }
}

// Create phone-optimized audio endpoint for Twilio
async function createPhoneAudioEndpoint(audioBuffer: ArrayBuffer, text: string): Promise<string> {
  try {
    console.log('📞 Creating phone-optimized audio endpoint for Twilio...')

    // Create unique audio ID
    const audioId = `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Convert to MP3 format (Twilio preferred)
    const mp3Buffer = Buffer.from(audioBuffer)

    // Store audio in shared cache with expiration (5 minutes)
    phoneAudioCache.set(audioId, {
      buffer: mp3Buffer,
      contentType: 'audio/mpeg',
      text: text.substring(0, 100), // For debugging
      timestamp: Date.now(),
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    })

    // Generate audio URL
    const audioUrl = createPhoneAudioUrl(audioId)

    console.log('✅ Phone audio endpoint created:', audioUrl)
    console.log(`🎵 Audio size: ${mp3Buffer.length} bytes`)
    console.log(`📊 Cache status:`, phoneAudioCache.getStatus())

    return audioUrl
  } catch (error) {
    console.error('❌ Error creating phone audio endpoint:', error)
    throw error
  }
}

// Store conversation turn with enhanced context
async function storeConversationTurn(callSid: string, turnData: any) {
  try {
    console.log(`💾 Storing enhanced conversation turn for call: ${callSid}`)

    // Get existing conversation data
    let conversationData = conversationStore.get(callSid) || {
      history: [],
      context: {},
      interviewType: 'professional_phone_call',
      callerInfo: { source: 'phone', callSid },
    }

    // Add new turn
    const newTurn = {
      userInput: turnData.userInput,
      aiResponse: turnData.aiResponse,
      timestamp: turnData.timestamp,
      recordingSid: turnData.recordingSid,
      duration: turnData.duration,
    }

    conversationData.history.push(newTurn)

    // Update context based on conversation content
    if (turnData.userInput) {
      const input = turnData.userInput.toLowerCase()
      if (input.includes('interview') || input.includes('position') || input.includes('role')) {
        conversationData.interviewType = 'technical'
      } else if (input.includes('recruiter') || input.includes('hiring')) {
        conversationData.interviewType = 'hr_screening'
      } else if (
        input.includes('network') ||
        input.includes('coffee') ||
        input.includes('connect')
      ) {
        conversationData.interviewType = 'networking'
      }
    }

    // Store updated conversation data (keep last 15 turns for rich context)
    conversationData.history = conversationData.history.slice(-15)
    conversationStore.set(callSid, conversationData)

    console.log(
      `✅ Stored turn. Total turns: ${conversationData.history.length}, Type: ${conversationData.interviewType}`,
    )

    return Promise.resolve()
  } catch (error) {
    console.error('Error storing conversation turn:', error)
    return Promise.resolve()
  }
} // Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
