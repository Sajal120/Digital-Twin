import { NextRequest, NextResponse } from 'next/server'

// Professional call flow configuration
interface CallFlowConfig {
  greeting: string
  questions: string[]
  responses: Record<string, string>
  followUpActions: string[]
  escalationTriggers: string[]
}

// Call flow types for different professional scenarios
const CALL_FLOWS: Record<string, CallFlowConfig> = {
  recruiter_screening: {
    greeting:
      "Thank you for calling about potential opportunities for Sajal. I'm his AI assistant and I'd be happy to help you learn more about his background and discuss how he might be a good fit for your role.",
    questions: [
      "Could you tell me about the specific role you're recruiting for?",
      'What technologies and skills are you looking for in this position?',
      "What's the company culture like and what are the growth opportunities?",
      "What's the timeline for this hiring process?",
      "Would you like me to share Sajal's portfolio and recent projects?",
    ],
    responses: {
      experience:
        "Sajal has over 5 years of professional software engineering experience, specializing in full-stack development with React, Node.js, and cloud technologies. He's particularly strong in AI integration and has recently built sophisticated systems like this AI-powered portfolio.",
      skills:
        "His core expertise includes TypeScript, React, Next.js, AWS, PostgreSQL, and AI/ML integration with OpenAI and other platforms. He's also experienced in team leadership and mentoring junior developers.",
      availability:
        'Sajal is currently exploring new opportunities and would be available to start within 2-4 weeks depending on the role and transition requirements.',
      projects:
        'His recent work includes building this omni-channel AI assistant, implementing advanced RAG systems, and creating scalable cloud-native applications. I can share his portfolio link with specific project details.',
      culture_fit:
        'Sajal thrives in collaborative environments where he can contribute to technical decisions, mentor team members, and work on innovative projects. He values continuous learning and enjoys solving complex technical challenges.',
    },
    followUpActions: ['schedule_interview', 'send_portfolio', 'share_resume', 'connect_linkedin'],
    escalationTriggers: [
      'executive_level_role',
      'immediate_decision_needed',
      'compensation_discussion',
      'relocation_required',
    ],
  },

  networking_call: {
    greeting:
      "Hello! Thank you for reaching out to connect with Sajal. I'm his AI assistant and I'm here to help facilitate professional connections and share information about his work and expertise.",
    questions: [
      "How did you hear about Sajal's work?",
      'What aspects of his background are you most interested in?',
      'Are you working on any projects where his expertise might be valuable?',
      'Would you like to schedule a time to speak with him directly?',
      "Are there any specific technical areas you'd like to discuss?",
    ],
    responses: {
      background:
        "Sajal is a senior software engineer with a passion for AI integration and full-stack development. He's built some fascinating projects including this AI-powered portfolio system that demonstrates advanced conversational AI capabilities.",
      expertise:
        "His areas of expertise include full-stack web development, cloud architecture, AI/ML integration, team leadership, and system design. He's particularly interested in the intersection of AI and practical business applications.",
      collaboration:
        "Sajal is always interested in connecting with other professionals, sharing knowledge, and exploring potential collaboration opportunities. He's contributed to open-source projects and enjoys technical discussions.",
      availability:
        "I can help arrange a conversation with Sajal directly. He's generally available for professional discussions and networking calls. Would you prefer a phone call, video conference, or meeting in person if you're in the same area?",
    },
    followUpActions: [
      'schedule_networking_call',
      'share_linkedin',
      'send_portfolio',
      'suggest_collaboration',
    ],
    escalationTriggers: [
      'business_partnership',
      'speaking_opportunity',
      'consulting_request',
      'investment_discussion',
    ],
  },

  consultation_call: {
    greeting:
      "Hello! You've reached Sajal Shrestha's AI assistant. I understand you're interested in consulting or technical advisory services. I'd be happy to discuss how Sajal might be able to help with your project or technical challenges.",
    questions: [
      'What type of technical challenge or project are you working on?',
      "What's your current technology stack and what are you trying to achieve?",
      "What's the scope and timeline for this project?",
      'Are you looking for hands-on development, technical advisory, or strategic guidance?',
      "What's your budget range for consulting services?",
    ],
    responses: {
      services:
        "Sajal offers consulting in full-stack development, AI integration, cloud architecture, and team technical leadership. He's particularly strong in helping companies implement AI solutions and modernize their technical infrastructure.",
      approach:
        'His consulting approach focuses on practical, scalable solutions that deliver business value. He combines technical expertise with strategic thinking to help clients achieve their goals efficiently.',
      experience:
        "He's worked with companies ranging from startups to established businesses, helping them implement technical solutions, improve development processes, and integrate AI capabilities into their products.",
      process:
        'The consulting process typically starts with a technical assessment, followed by strategic recommendations, and can include hands-on implementation depending on the engagement scope.',
    },
    followUpActions: [
      'schedule_consultation',
      'send_consulting_info',
      'create_proposal',
      'technical_assessment',
    ],
    escalationTriggers: [
      'large_project_scope',
      'long_term_engagement',
      'enterprise_client',
      'complex_requirements',
    ],
  },

  general_inquiry: {
    greeting:
      "Hello! Thank you for calling. I'm Sajal Shrestha's AI assistant, and I'm here to help answer questions about his professional background, projects, and experience. How can I assist you today?",
    questions: [
      "What would you like to know about Sajal's background?",
      'Are you interested in a particular aspect of his work or experience?',
      'Is this regarding a potential opportunity, collaboration, or general inquiry?',
      'Would you like me to share information about his recent projects?',
      'How can I best help you today?',
    ],
    responses: {
      general:
        "Sajal is a senior software engineer with expertise in full-stack development, AI integration, and cloud technologies. He's passionate about building innovative solutions and has a track record of leading successful technical projects.",
      projects:
        'His recent work includes building this AI-powered portfolio system, implementing advanced search and conversation capabilities, and creating scalable web applications. Each project demonstrates his ability to combine technical excellence with practical business value.',
      contact:
        'I can help facilitate contact with Sajal for professional discussions, or I can provide more detailed information about his background and experience. What would be most helpful for you?',
    },
    followUpActions: [
      'determine_intent',
      'share_portfolio',
      'schedule_call',
      'provide_contact_info',
    ],
    escalationTriggers: ['media_inquiry', 'legal_matter', 'personal_request', 'urgent_matter'],
  },
}

// Main professional call flow handler
export async function POST(request: NextRequest) {
  try {
    const { action, callSid, callType, userInput, context } = await request.json()

    switch (action) {
      case 'classify_call':
        return await handleCallClassification(callSid, userInput, context)

      case 'get_flow_response':
        return await handleFlowResponse(callType, userInput, context)

      case 'check_escalation':
        return await handleEscalationCheck(callType, userInput, context)

      case 'trigger_follow_up':
        return await handleFollowUpAction(callSid, callType, userInput)

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Professional call flow error:', error)
    return NextResponse.json({ error: 'Failed to process call flow request' }, { status: 500 })
  }
}

// Classify incoming call type based on initial input
async function handleCallClassification(
  callSid: string,
  userInput: string,
  context: any,
): Promise<NextResponse> {
  try {
    console.log(`🔍 Classifying call: ${callSid}`)

    const classification = await classifyCallType(userInput, context)

    return NextResponse.json({
      success: true,
      callType: classification.type,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      suggestedFlow: CALL_FLOWS[classification.type]?.greeting,
    })
  } catch (error) {
    console.error('Error classifying call:', error)
    return NextResponse.json(
      {
        error: 'Failed to classify call',
        fallback: {
          callType: 'general_inquiry',
          confidence: 0.5,
          suggestedFlow: CALL_FLOWS.general_inquiry.greeting,
        },
      },
      { status: 200 },
    )
  }
}

// Get appropriate response based on call flow
async function handleFlowResponse(
  callType: string,
  userInput: string,
  context: any,
): Promise<NextResponse> {
  try {
    console.log(`💬 Generating flow response for: ${callType}`)

    const response = await generateFlowResponse(callType, userInput, context)

    return NextResponse.json({
      success: true,
      response: response.text,
      nextActions: response.nextActions,
      followUpQuestions: response.followUpQuestions,
    })
  } catch (error) {
    console.error('Error generating flow response:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate response',
        fallback: {
          response:
            "I apologize, but I'm having trouble processing your request. Could you please repeat or rephrase your question?",
          nextActions: [],
          followUpQuestions: [],
        },
      },
      { status: 200 },
    )
  }
}

// Check if call needs escalation to human
async function handleEscalationCheck(
  callType: string,
  userInput: string,
  context: any,
): Promise<NextResponse> {
  try {
    console.log(`⚡ Checking escalation for: ${callType}`)

    const escalationNeeded = await checkEscalationTriggers(callType, userInput, context)

    return NextResponse.json({
      success: true,
      escalationNeeded: escalationNeeded.required,
      reason: escalationNeeded.reason,
      urgency: escalationNeeded.urgency,
      escalationMessage: escalationNeeded.message,
    })
  } catch (error) {
    console.error('Error checking escalation:', error)
    return NextResponse.json(
      {
        escalationNeeded: false,
        reason: 'Unable to determine escalation need',
      },
      { status: 200 },
    )
  }
}

// Handle follow-up actions after call
async function handleFollowUpAction(
  callSid: string,
  callType: string,
  actionType: string,
): Promise<NextResponse> {
  try {
    console.log(`📬 Triggering follow-up action: ${actionType} for call: ${callSid}`)

    const result = await executeFollowUpAction(callSid, callType, actionType)

    return NextResponse.json({
      success: true,
      action: actionType,
      result: result.message,
      nextSteps: result.nextSteps,
    })
  } catch (error) {
    console.error('Error executing follow-up action:', error)
    return NextResponse.json(
      {
        error: 'Failed to execute follow-up action',
      },
      { status: 500 },
    )
  }
}

// AI-powered call classification
async function classifyCallType(userInput: string, context: any) {
  const classificationPrompt = `
Classify this phone call based on the caller's input and context:

Caller Input: "${userInput}"
Call Context: ${JSON.stringify(context)}

Available Call Types:
1. recruiter_screening - Someone calling about job opportunities
2. networking_call - Professional networking or connection request
3. consultation_call - Business inquiry about consulting/advisory services
4. general_inquiry - General questions about background/experience

Respond with JSON only:
{
  "type": "one_of_the_four_types",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of classification"
}
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional call classifier. Respond only with valid JSON.',
          },
          { role: 'user', content: classificationPrompt },
        ],
        temperature: 0.2,
        max_tokens: 200,
      }),
    })

    const result = await response.json()
    const classification = JSON.parse(result.choices[0]?.message?.content || '{}')

    return {
      type: classification.type || 'general_inquiry',
      confidence: classification.confidence || 0.5,
      reasoning: classification.reasoning || 'Default classification',
    }
  } catch (error) {
    console.error('Error classifying call type:', error)
    return {
      type: 'general_inquiry',
      confidence: 0.5,
      reasoning: 'Classification failed, using default',
    }
  }
}

// Generate contextual response based on call flow
async function generateFlowResponse(callType: string, userInput: string, context: any) {
  const flow = CALL_FLOWS[callType] || CALL_FLOWS.general_inquiry

  const responsePrompt = `
You are Sajal Shrestha's professional AI assistant handling a ${callType} call.

Call Flow Context:
${JSON.stringify(flow)}

User Input: "${userInput}"
Call Context: ${JSON.stringify(context)}

Generate a professional response that:
1. Addresses the user's input appropriately
2. Follows the call flow guidelines
3. Asks relevant follow-up questions
4. Suggests appropriate next actions

Respond with JSON only:
{
  "text": "professional response text",
  "nextActions": ["action1", "action2"],
  "followUpQuestions": ["question1", "question2"]
}
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional AI assistant. Respond only with valid JSON.',
          },
          { role: 'user', content: responsePrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    const result = await response.json()
    const flowResponse = JSON.parse(result.choices[0]?.message?.content || '{}')

    return {
      text:
        flowResponse.text ||
        "Thank you for your inquiry. How can I help you learn more about Sajal's background?",
      nextActions: flowResponse.nextActions || [],
      followUpQuestions: flowResponse.followUpQuestions || [],
    }
  } catch (error) {
    console.error('Error generating flow response:', error)
    return {
      text: "Thank you for calling. How can I assist you with information about Sajal's professional background?",
      nextActions: [],
      followUpQuestions: [],
    }
  }
}

// Check if call needs escalation
async function checkEscalationTriggers(callType: string, userInput: string, context: any) {
  const flow = CALL_FLOWS[callType] || CALL_FLOWS.general_inquiry
  const triggers = flow.escalationTriggers

  const escalationPrompt = `
Check if this call needs escalation to a human based on triggers:

User Input: "${userInput}"
Escalation Triggers: ${JSON.stringify(triggers)}
Call Type: ${callType}

Respond with JSON only:
{
  "required": true/false,
  "reason": "specific reason if escalation needed",
  "urgency": "high/medium/low",
  "message": "message to caller about escalation"
}
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an escalation checker. Respond only with valid JSON.',
          },
          { role: 'user', content: escalationPrompt },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    })

    const result = await response.json()
    const escalation = JSON.parse(result.choices[0]?.message?.content || '{}')

    return {
      required: escalation.required || false,
      reason: escalation.reason || '',
      urgency: escalation.urgency || 'low',
      message: escalation.message || '',
    }
  } catch (error) {
    console.error('Error checking escalation:', error)
    return {
      required: false,
      reason: 'Unable to determine escalation need',
      urgency: 'low',
      message: '',
    }
  }
}

// Execute follow-up actions
async function executeFollowUpAction(callSid: string, callType: string, actionType: string) {
  console.log(`📬 Executing follow-up action: ${actionType}`)

  switch (actionType) {
    case 'schedule_interview':
      return {
        message:
          "I can help schedule an interview. I'll send you Sajal's calendar link and coordinate the timing.",
        nextSteps: ['send_calendar_link', 'coordinate_timing'],
      }

    case 'send_portfolio':
      return {
        message:
          "I'll send you Sajal's portfolio link with his latest projects and technical achievements.",
        nextSteps: ['email_portfolio_link'],
      }

    case 'schedule_networking_call':
      return {
        message:
          "I'll coordinate a time for you and Sajal to connect directly for a professional discussion.",
        nextSteps: ['send_scheduling_options'],
      }

    case 'create_proposal':
      return {
        message:
          "I'll prepare a consulting proposal based on your requirements and have Sajal review it.",
        nextSteps: ['draft_proposal', 'schedule_follow_up'],
      }

    case 'technical_assessment':
      return {
        message:
          "I'll arrange for Sajal to conduct a technical assessment of your project requirements.",
        nextSteps: ['schedule_technical_call'],
      }

    default:
      return {
        message: "I'll make sure Sajal follows up on this conversation appropriately.",
        nextSteps: ['manual_follow_up'],
      }
  }
}

// Handle GET for service status
export async function GET() {
  return NextResponse.json({
    service: 'professional-call-flows',
    status: 'ready',
    availableFlows: Object.keys(CALL_FLOWS),
    features: [
      'call_classification',
      'contextual_responses',
      'escalation_detection',
      'follow_up_automation',
    ],
  })
}
