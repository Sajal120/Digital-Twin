import { NextRequest, NextResponse } from 'next/server'
import { googleService } from '@/lib/google-service'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    console.log('🔍 Meeting API - Session check:', {
      hasSession: !!session,
      hasUser: !!(session?.user),
      hasAccessToken: !!((session as any)?.accessToken)
    })
    
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please sign in with Google to book meetings',
          authUrl: '/api/auth/signin/google'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, params } = body

    switch (action) {
      case 'create_meeting':
        const { title, description, timeString, attendeeEmails = [] } = params
        
        // Parse the time from natural language
        const { start, end } = googleService.parseDateTime(timeString || 'next Monday afternoon')
        
        const result = await googleService.createMeeting(
          title || 'Meeting with Sajal - Digital Twin Portfolio Discussion',
          description || `Hi! Let's discuss my experience, projects, and potential collaboration opportunities. 

Looking forward to sharing my work on:
- AI-powered portfolio chatbot with advanced RAG capabilities
- Full-stack development experience with Next.js, React, and modern technologies
- My internship experience at Aubot and achievements in QA process improvement
- Future opportunities in AI, Development, Security, and Support

Feel free to ask me anything about my technical background, projects, or career goals!

Best regards,
Sajal`,
          start,
          end,
          attendeeEmails
        )

        return NextResponse.json(result)

      case 'get_upcoming':
        const events = await googleService.getUpcomingEvents(params?.limit || 5)
        return NextResponse.json({ success: true, events })

      case 'send_email':
        const { to, subject, message } = params
        const emailResult = await googleService.sendEmail(
          to,
          subject || 'Meeting Follow-up - Digital Twin Portfolio',
          message || `Hi there!

Thank you for your interest in connecting with me. I'm excited to discuss my background and experience, including:

🤖 My flagship AI-powered portfolio chatbot built with Next.js, React, and advanced RAG technology
💼 My internship experience at Aubot where I improved QA processes by 30%
🚀 My passion for AI, Development, Security, and Support in the IT sector

I'm always open to discussing potential collaborations and sharing insights about modern web development and AI integration.

Let's schedule a meeting to chat more!

Best regards,
Sajal
Digital Twin Portfolio: http://localhost:3000`
        )

        return NextResponse.json(emailResult)

      default:
        return NextResponse.json(
          { 
            error: 'Unknown action',
            availableActions: ['create_meeting', 'get_upcoming', 'send_email']
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Meeting API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please make sure you have signed in with Google and granted calendar permissions',
        debug: {
          errorType: error?.constructor?.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        }
      },
      { status: 500 }
    )
  }
}