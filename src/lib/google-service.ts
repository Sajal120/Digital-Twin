import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'

export class GoogleService {
  private oauth2Client: OAuth2Client
  private gmail: any
  private calendar: any

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/auth/callback/google'
    )

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  async setCredentialsFromSession() {
    try {
      const session = await getServerSession(authOptions)
      console.log('🔍 Google Service - Session check:', {
        hasSession: !!session,
        hasUser: !!(session?.user),
        hasAccessToken: !!((session as any)?.accessToken)
      })
      
      if (session && (session as any).accessToken) {
        // Set the OAuth2 client with the access token from session
        this.oauth2Client.setCredentials({
          access_token: (session as any).accessToken,
        })
        console.log('✅ Google Service - Credentials set successfully')
        return true
      }
      console.log('❌ Google Service - No access token found')
      return false
    } catch (error) {
      console.error('Failed to set credentials from session:', error)
      return false
    }
  }

  async sendEmail(to: string, subject: string, body: string) {
    try {
      const hasCredentials = await this.setCredentialsFromSession()
      if (!hasCredentials) {
        throw new Error('No valid Google credentials found. Please sign in first.')
      }

      const emailContent = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        '',
        body
      ].join('\n')

      const encodedEmail = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      })

      return {
        success: true,
        messageId: result.data.id,
        message: `Email sent successfully to ${to}!`
      }
    } catch (error) {
      console.error('Gmail send error:', error)
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async createMeeting(
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    attendeeEmails: string[] = []
  ) {
    try {
      console.log('🔍 Google Service - Creating meeting:', {
        title,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      })
      
      const hasCredentials = await this.setCredentialsFromSession()
      console.log('🔍 Google Service - Has credentials:', hasCredentials)
      
      if (!hasCredentials) {
        throw new Error('No valid Google credentials found. Please sign in first.')
      }

      // Remove duplicates and filter out empty emails
      const uniqueAttendees = [...new Set(attendeeEmails.filter(email => email && email.includes('@')))]
      console.log('📧 Meeting attendees:', uniqueAttendees)

      const event = {
        summary: title,
        description: description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/New_York', // Adjust timezone as needed
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/New_York', // Adjust timezone as needed
        },
        attendees: uniqueAttendees.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 10 }, // 10 minutes before
          ],
        },
      }

      console.log('🔍 Google Service - Making calendar API call...')
      const result = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
      })

      console.log('✅ Google Service - Calendar event created:', result.data.id)
      const meetLink = result.data.conferenceData?.entryPoints?.[0]?.uri || null

      return {
        success: true,
        eventId: result.data.id,
        meetLink,
        eventUrl: result.data.htmlLink,
        startTime: result.data.start.dateTime,
        endTime: result.data.end.dateTime,
        message: 'Meeting created successfully!'
      }
    } catch (error) {
      console.error('Calendar create error:', error)
      throw new Error(`Failed to create meeting: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getUpcomingEvents(maxResults: number = 10) {
    try {
      const hasCredentials = await this.setCredentialsFromSession()
      if (!hasCredentials) {
        throw new Error('No valid Google credentials found. Please sign in first.')
      }

      const result = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      })

      return result.data.items?.map((event: any) => ({
        id: event.id,
        title: event.summary,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        meetLink: event.conferenceData?.entryPoints?.[0]?.uri,
        description: event.description,
      })) || []
    } catch (error) {
      console.error('Calendar list error:', error)
      throw new Error(`Failed to get upcoming events: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Enhanced method to parse natural language time
  parseDateTime(timeString: string): { start: Date; end: Date } {
    console.log('🕐 Parsing time string:', timeString)
    const now = new Date()
    let startTime = new Date()
    let endTime = new Date()
    
    // Convert to lowercase for easier parsing
    const lowerTimeString = timeString.toLowerCase()
    
    // Default duration (1 hour)
    const defaultDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // Parse specific dates first (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY formats)
    const dateMatch = timeString.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1; // JavaScript months are 0-based
      const year = parseInt(dateMatch[3]);
      startTime = new Date(year, month, day);
      console.log('📅 Parsed specific date:', { day, month: month + 1, year, result: startTime.toDateString() });
    }
    // Parse "tomorrow" or "next day"
    else if (lowerTimeString.includes('tomorrow')) {
      startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
    }
    // Parse "next week" variations
    else if (lowerTimeString.includes('next week')) {
      startTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Next week
    }
    // Parse specific weekdays
    else if (lowerTimeString.includes('monday') || lowerTimeString.includes('mon')) {
      startTime = this.getNextWeekday(1) // Monday
    } else if (lowerTimeString.includes('tuesday') || lowerTimeString.includes('tue')) {
      startTime = this.getNextWeekday(2) // Tuesday
    } else if (lowerTimeString.includes('wednesday') || lowerTimeString.includes('wed')) {
      startTime = this.getNextWeekday(3) // Wednesday
    } else if (lowerTimeString.includes('thursday') || lowerTimeString.includes('thu')) {
      startTime = this.getNextWeekday(4) // Thursday
    } else if (lowerTimeString.includes('friday') || lowerTimeString.includes('fri')) {
      startTime = this.getNextWeekday(5) // Friday
    } else if (lowerTimeString.includes('saturday') || lowerTimeString.includes('sat')) {
      startTime = this.getNextWeekday(6) // Saturday
    } else if (lowerTimeString.includes('sunday') || lowerTimeString.includes('sun')) {
      startTime = this.getNextWeekday(0) // Sunday
    } else {
      // Default to next Monday if no specific day mentioned
      startTime = this.getNextWeekday(1)
    }
    
    // Parse specific times
    let hour = 14; // Default 2 PM
    let minute = 30; // Default :30
    
    // Parse time patterns like "10am", "2pm", "10:30am", "2:30 pm"
    const timeMatch = lowerTimeString.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
    if (timeMatch) {
      hour = parseInt(timeMatch[1])
      minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      
      // Convert to 24-hour format
      if (timeMatch[3].toLowerCase() === 'pm' && hour !== 12) {
        hour += 12
      } else if (timeMatch[3].toLowerCase() === 'am' && hour === 12) {
        hour = 0
      }
    }
    // Parse 24-hour format like "14:30", "10:00"
    else {
      const time24Match = lowerTimeString.match(/(\d{1,2}):(\d{2})/);
      if (time24Match) {
        hour = parseInt(time24Match[1])
        minute = parseInt(time24Match[2])
      }
    }
    
    // Handle timezone mentions (basic support for Sydney/AEST)
    let timezoneOffset = 0; // UTC offset in minutes
    if (lowerTimeString.includes('sydney') || lowerTimeString.includes('aest') || lowerTimeString.includes('aedt')) {
      timezoneOffset = -600; // Sydney is UTC+10 (but we subtract because we're converting TO UTC)
    }
    
    // Set the parsed time
    startTime.setHours(hour, minute, 0, 0)
    
    // Adjust for timezone
    if (timezoneOffset !== 0) {
      startTime = new Date(startTime.getTime() - (timezoneOffset * 60 * 1000))
    }
    
    // Set end time (1 hour later by default)
    endTime = new Date(startTime.getTime() + defaultDuration)
    
    console.log('🕐 Parsed meeting time:', {
      original: timeString,
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      localStart: startTime.toLocaleString(),
      localEnd: endTime.toLocaleString()
    })
    
    return { start: startTime, end: endTime }
  }

  private getNextWeekday(dayOfWeek: number): Date {
    const today = new Date()
    const currentDay = today.getDay()
    const daysUntilTarget = ((dayOfWeek - currentDay + 7) % 7) || 7 // If it's the same day, schedule for next week
    const targetDate = new Date()
    targetDate.setDate(today.getDate() + daysUntilTarget)
    return targetDate
  }
}

export const googleService = new GoogleService()