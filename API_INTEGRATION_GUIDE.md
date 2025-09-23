# Complete API Integration Guide for Digital Twin Chatbot

This guide provides comprehensive steps to integrate GitHub, LinkedIn, and Google APIs into your chatbot, enabling deep personal profile interactions and automated actions like email sending and meeting booking.

## 🎯 Overview

Your chatbot will gain the following capabilities:
- **GitHub Integration**: Fetch and discuss repositories, commits, activity, profile details
- **LinkedIn Integration**: Access profile data, posts, connections, and professional updates
- **Google Integration**: Send emails via Gmail API and book meetings via Google Calendar/Meet

## 📋 Prerequisites

- Node.js 18+ (already installed)
- Your existing Digital Twin portfolio project
- API accounts for GitHub, LinkedIn, and Google

---

## 🔧 Part 1: GitHub Integration

### Step 1: Create GitHub OAuth App or Personal Access Token

#### Option A: Personal Access Token (Simpler)
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Set expiration (recommend 90 days for testing, longer for production)
4. Select scopes:
   - `read:user` - Read user profile data
   - `repo` - Access to public and private repositories
   - `user:email` - Access to user email addresses
   - `read:org` - Read organization membership
5. Generate and copy the token (save it securely!)

#### Option B: OAuth App (More secure for production)
1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/applications/new)
2. Fill in:
   - **Application name**: "Digital Twin Chatbot"
   - **Homepage URL**: `http://localhost:3000` (or your domain)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
3. Register application and note Client ID and Client Secret

### Step 2: Add Environment Variables

Add to your `.env.local` file:

```bash
# GitHub Integration
GITHUB_TOKEN=ghp_your_personal_access_token_here
# OR for OAuth
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here

# Your GitHub username for API calls
GITHUB_USERNAME=Sajal120
```

### Step 3: Install GitHub Dependencies

```bash
pnpm add @octokit/rest @octokit/auth-token
# For OAuth flow (if using OAuth)
pnpm add @octokit/auth-oauth-app
```

### Step 4: Create GitHub Service

Create `src/lib/github-service.ts`:

```typescript
import { Octokit } from '@octokit/rest'

export class GitHubService {
  private octokit: Octokit

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    })
  }

  async getProfile(username: string = process.env.GITHUB_USERNAME!) {
    try {
      const { data } = await this.octokit.rest.users.getByUsername({
        username,
      })
      return {
        name: data.name,
        bio: data.bio,
        location: data.location,
        company: data.company,
        blog: data.blog,
        publicRepos: data.public_repos,
        followers: data.followers,
        following: data.following,
        createdAt: data.created_at,
      }
    } catch (error) {
      console.error('GitHub profile fetch error:', error)
      throw new Error('Failed to fetch GitHub profile')
    }
  }

  async getRepositories(username: string = process.env.GITHUB_USERNAME!, limit: number = 10) {
    try {
      const { data } = await this.octokit.rest.repos.listForUser({
        username,
        sort: 'updated',
        per_page: limit,
      })
      
      return data.map(repo => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        url: repo.html_url,
        updatedAt: repo.updated_at,
        topics: repo.topics,
      }))
    } catch (error) {
      console.error('GitHub repositories fetch error:', error)
      throw new Error('Failed to fetch GitHub repositories')
    }
  }

  async getRecentCommits(username: string = process.env.GITHUB_USERNAME!, limit: number = 5) {
    try {
      const { data } = await this.octokit.rest.activity.listPublicEventsForUser({
        username,
        per_page: 30,
      })

      const commits = data
        .filter(event => event.type === 'PushEvent')
        .slice(0, limit)
        .map(event => ({
          repo: event.repo.name,
          message: (event.payload as any).commits?.[0]?.message || 'No message',
          date: event.created_at,
          url: `https://github.com/${event.repo.name}`,
        }))

      return commits
    } catch (error) {
      console.error('GitHub commits fetch error:', error)
      throw new Error('Failed to fetch recent commits')
    }
  }

  async getLanguageStats(username: string = process.env.GITHUB_USERNAME!) {
    try {
      const repos = await this.getRepositories(username, 50)
      const languages: { [key: string]: number } = {}
      
      repos.forEach(repo => {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1
        }
      })

      return Object.entries(languages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([language, count]) => ({ language, count }))
    } catch (error) {
      console.error('GitHub language stats error:', error)
      throw new Error('Failed to fetch language statistics')
    }
  }
}

export const githubService = new GitHubService()
```

### Step 5: Update Chat Route for GitHub Integration

Add to your `src/app/api/chat/route.ts` (find the appropriate place in your existing enhanced response function):

```typescript
import { githubService } from '@/lib/github-service'

// Add this function to your existing file
async function handleGitHubQuery(query: string, type: 'profile' | 'repos' | 'commits' | 'languages' | 'general') {
  try {
    switch (type) {
      case 'profile':
        const profile = await githubService.getProfile()
        return `Here's my GitHub profile information:
        
**${profile.name}** (${profile.company || 'Independent Developer'})
📍 ${profile.location || 'Remote'}
📝 ${profile.bio || 'Full-stack developer passionate about creating innovative solutions'}

**Stats**: ${profile.publicRepos} public repos • ${profile.followers} followers • ${profile.following} following

${profile.blog ? `🌐 Website: ${profile.blog}` : ''}
📅 GitHub member since ${new Date(profile.createdAt).toLocaleDateString()}`

      case 'repos':
        const repos = await githubService.getRepositories()
        const repoList = repos.slice(0, 5).map(repo => 
          `• **${repo.name}** - ${repo.description || 'No description'} 
          ${repo.language ? `(${repo.language})` : ''} ⭐ ${repo.stars} 🍴 ${repo.forks}`
        ).join('\n')
        
        return `Here are my recent GitHub repositories:\n\n${repoList}\n\nYou can see all my repos at: https://github.com/${process.env.GITHUB_USERNAME}`

      case 'commits':
        const commits = await githubService.getRecentCommits()
        const commitList = commits.map(commit => 
          `• **${commit.repo}**: "${commit.message}" (${new Date(commit.date).toLocaleDateString()})`
        ).join('\n')
        
        return `Here's my recent coding activity:\n\n${commitList}\n\nI'm actively contributing to these projects and always working on something new!`

      case 'languages':
        const languages = await githubService.getLanguageStats()
        const langList = languages.map(lang => `• ${lang.language}: ${lang.count} repositories`).join('\n')
        
        return `My programming language expertise based on GitHub repositories:\n\n${langList}\n\nI'm always learning new technologies and expanding my skill set!`

      default:
        return `I can tell you about my GitHub profile, repositories, recent commits, or programming languages. What specifically would you like to know?`
    }
  } catch (error) {
    console.error('GitHub query error:', error)
    return `I'm having trouble accessing my GitHub data right now. You can check out my profile directly at https://github.com/${process.env.GITHUB_USERNAME}`
  }
}

// Add GitHub query detection to your existing chat logic
function detectGitHubQuery(message: string) {
  const githubKeywords = {
    profile: ['github profile', 'github account', 'github stats', 'github info'],
    repos: ['github repos', 'repositories', 'github projects', 'code projects', 'github code'],
    commits: ['recent commits', 'latest commits', 'github activity', 'recent code', 'coding activity'],
    languages: ['programming languages', 'github languages', 'coding languages', 'tech stack from github'],
  }

  for (const [type, keywords] of Object.entries(githubKeywords)) {
    if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
      return type as 'profile' | 'repos' | 'commits' | 'languages'
    }
  }

  if (message.toLowerCase().includes('github')) {
    return 'general'
  }

  return null
}
```

---

## 💼 Part 2: LinkedIn Integration

### Step 1: Create LinkedIn App

1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Click "Create app"
3. Fill in app details:
   - **App name**: "Digital Twin Chatbot"
   - **LinkedIn Page**: Your LinkedIn page (see detailed steps below)
   - **App logo**: Upload a logo (optional)

### LinkedIn Page Setup Options

#### Option A: Use Your Personal LinkedIn Profile (Recommended for Personal Projects)
If this chatbot represents you personally:
1. Go to your LinkedIn profile: `https://linkedin.com/in/your-username`
2. Copy this URL to use as your "LinkedIn Page" in the app setup
3. This is sufficient for personal Digital Twin chatbots

#### Option B: Create a LinkedIn Company Page (For Business/Professional Services)
If you want to create a dedicated business presence:

**Step 1: Create LinkedIn Company Page**
1. Go to [LinkedIn Pages](https://www.linkedin.com/company/setup/new/)
2. Choose page type:
   - **Small business** (1-200 employees) - Most common choice
   - **Medium to large business** (200+ employees)
   - **Showcase page** (for specific products/services)
   - **Educational institution** (schools/universities only)
3. Fill in company details:
   - **Page name**: "Digital Twin Solutions" or your preferred business name
   - **LinkedIn public URL**: Choose a custom URL like `linkedin.com/company/your-business-name`
   - **Website**: Your portfolio website URL
   - **Industry**: "Information Technology and Services" or "Computer Software"
   - **Company size**: Choose appropriate size
   - **Company type**: "Privately Held" (most common for solo projects)
   - **Headquarters location**: Your city and country

**Step 2: Complete Your Company Page**
1. **Add logo**: Upload a square logo (400x400px recommended)
2. **Add cover image**: Upload a banner image (1536x768px)
3. **Company description**: Write about your Digital Twin service
   ```
   Digital Twin Solutions provides AI-powered personal assistant chatbots that integrate with GitHub, LinkedIn, and Google services to create intelligent digital representations of professionals and their work.
   ```
4. **Add specialties**: List relevant skills like "AI Development", "Chatbot Solutions", "API Integration"

**Step 3: Verify Your Page**
1. LinkedIn may require phone verification
2. Some features need at least 150 followers to activate
3. You'll need to be listed as an employee of this company on your personal profile

**Quick Setup Recommendation:**
For your Digital Twin chatbot, I recommend **Option A** (using your personal profile) because:
- ✅ Faster setup (no page creation needed)
- ✅ Immediate access to LinkedIn Developer tools
- ✅ More appropriate for personal portfolio projects
- ✅ No follower requirements or verification delays

**How to Find Your Personal LinkedIn Profile URL:**
1. Go to your LinkedIn profile
2. Click "Edit public profile & URL" on the right side
3. Copy the URL (something like `https://linkedin.com/in/your-name-12345`)
4. Use this URL in your LinkedIn app setup
4. **LinkedIn Page field**: 
   - If using personal profile: Paste your personal LinkedIn URL
   - If using company page: Paste your company page URL
5. Select products:
   - **Sign In with LinkedIn using OpenID Connect** ✅ (Required)
   - **Share on LinkedIn** (if you want posting capability)
   - **Advertising API** (optional, for advanced features)
6. Review and create app
7. Note your **Client ID** and **Client Secret**

**Important Notes:**
- LinkedIn may take 1-2 business days to approve your app
- Some API features require additional verification
- Personal profile apps have different permissions than company page apps

### Step 2: Configure App Settings

1. In your app settings, add redirect URLs:
   - `http://localhost:3000/api/auth/linkedin/callback`
   - Your production domain callback URL
2. Request access to additional products if needed:
   - **Marketing Developer Platform** (for more data access)

### Step 3: Add LinkedIn Environment Variables

Add to your `.env.local`:

```bash
# LinkedIn Integration
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback

# Your LinkedIn profile URL or ID
LINKEDIN_PROFILE_URL=https://linkedin.com/in/your-profile
```

### Step 4: Install LinkedIn Dependencies

```bash
pnpm add linkedin-api-client
# For OAuth handling
pnpm add simple-oauth2
```

### Step 5: Create LinkedIn Service

Create `src/lib/linkedin-service.ts`:

```typescript
import { AuthorizationCode } from 'simple-oauth2'

export class LinkedInService {
  private client: AuthorizationCode

  constructor() {
    this.client = new AuthorizationCode({
      client: {
        id: process.env.LINKEDIN_CLIENT_ID!,
        secret: process.env.LINKEDIN_CLIENT_SECRET!,
      },
      auth: {
        tokenHost: 'https://www.linkedin.com',
        tokenPath: '/oauth/v2/accessToken',
        authorizePath: '/oauth/v2/authorization',
      },
    })
  }

  getAuthorizationUri(state: string = 'random-state') {
    return this.client.authorizeURL({
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
      scope: 'openid profile email w_member_social',
      state,
    })
  }

  async getAccessToken(code: string) {
    try {
      const result = await this.client.getToken({
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
      })
      return result.token.access_token
    } catch (error) {
      console.error('LinkedIn token error:', error)
      throw new Error('Failed to get LinkedIn access token')
    }
  }

  async getProfile(accessToken: string) {
    try {
      const response = await fetch('https://api.linkedin.com/v2/people/~', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status}`)
      }

      const profile = await response.json()
      
      // Get profile picture
      const pictureResponse = await fetch(
        'https://api.linkedin.com/v2/people/~/profilePicture(displayImage~:playableStreams)',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      let profilePicture = null
      if (pictureResponse.ok) {
        const pictureData = await pictureResponse.json()
        profilePicture = pictureData['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
      }

      return {
        id: profile.id,
        firstName: profile.localizedFirstName,
        lastName: profile.localizedLastName,
        headline: profile.localizedHeadline,
        profilePicture,
      }
    } catch (error) {
      console.error('LinkedIn profile fetch error:', error)
      throw new Error('Failed to fetch LinkedIn profile')
    }
  }

  async getCompanyInfo(accessToken: string, companyId: string) {
    try {
      const response = await fetch(`https://api.linkedin.com/v2/organizations/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`LinkedIn company API error: ${response.status}`)
      }

      const company = await response.json()
      return {
        name: company.localizedName,
        industry: company.localizedWebsite,
        size: company.staffCount,
      }
    } catch (error) {
      console.error('LinkedIn company fetch error:', error)
      throw new Error('Failed to fetch company information')
    }
  }

  // Static method for basic profile info without token (for public data)
  getStaticProfileInfo() {
    return {
      profileUrl: process.env.LINKEDIN_PROFILE_URL,
      summary: `Visit my LinkedIn profile for detailed professional information, work history, and connections.`,
    }
  }
}

export const linkedinService = new LinkedInService()
```

### Step 6: Create LinkedIn OAuth Routes

Create `src/app/api/auth/linkedin/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { linkedinService } from '@/lib/linkedin-service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  if (action === 'login') {
    const authUri = linkedinService.getAuthorizationUri()
    return NextResponse.redirect(authUri)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
```

Create `src/app/api/auth/linkedin/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { linkedinService } from '@/lib/linkedin-service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 })
  }

  try {
    const accessToken = await linkedinService.getAccessToken(code)
    const profile = await linkedinService.getProfile(accessToken)
    
    // Store token securely (implement your storage logic)
    // For now, we'll just return the profile data
    
    return NextResponse.json({
      success: true,
      profile,
      message: 'LinkedIn connected successfully'
    })
  } catch (error) {
    console.error('LinkedIn callback error:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate with LinkedIn' },
      { status: 500 }
    )
  }
}
```

---

## 📧 Part 3: Google Integration (Gmail + Calendar/Meet)

### Step 1: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Gmail API**
   - **Google Calendar API**
   - **Google People API** (optional, for contacts)

### Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - Your production domain callback
5. Download the JSON file (client_secret.json)

### Step 3: Set Up OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** (for testing) or **Internal** (for organization use)
3. Fill in required fields:
   - **App name**: "Digital Twin Chatbot"
   - **User support email**: Your email
   - **Authorized domains**: Your domain
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`

### Step 4: Add Google Environment Variables

Add to your `.env.local`:

```bash
# Google Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Your email for sending from
GOOGLE_USER_EMAIL=your.email@gmail.com
```

### Step 5: Install Google Dependencies

```bash
pnpm add googleapis google-auth-library
```

### Step 6: Create Google Service

Create `src/lib/google-service.ts`:

```typescript
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export class GoogleService {
  private oauth2Client: OAuth2Client
  private gmail: any
  private calendar: any

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  getAuthUrl(scopes: string[] = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    })
  }

  async getTokenFromCode(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)
      return tokens
    } catch (error) {
      console.error('Google token error:', error)
      throw new Error('Failed to get Google access token')
    }
  }

  setTokens(tokens: any) {
    this.oauth2Client.setCredentials(tokens)
  }

  async sendEmail(to: string, subject: string, body: string, html: boolean = false) {
    try {
      const emailContent = [
        `To: ${to}`,
        `Subject: ${subject}`,
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
        message: 'Email sent successfully'
      }
    } catch (error) {
      console.error('Gmail send error:', error)
      throw new Error('Failed to send email')
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
      const event = {
        summary: title,
        description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: attendeeEmails.map(email => ({ email })),
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
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
      }

      const result = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
      })

      const meetLink = result.data.conferenceData?.entryPoints?.[0]?.uri || null

      return {
        success: true,
        eventId: result.data.id,
        meetLink,
        eventUrl: result.data.htmlLink,
        message: 'Meeting created successfully'
      }
    } catch (error) {
      console.error('Calendar create error:', error)
      throw new Error('Failed to create meeting')
    }
  }

  async getUpcomingEvents(maxResults: number = 10) {
    try {
      const result = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      })

      return result.data.items?.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        meetLink: event.conferenceData?.entryPoints?.[0]?.uri,
        description: event.description,
      })) || []
    } catch (error) {
      console.error('Calendar list error:', error)
      throw new Error('Failed to get upcoming events')
    }
  }
}

export const googleService = new GoogleService()
```

### Step 7: Create Google OAuth Routes

Create `src/app/api/auth/google/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { googleService } from '@/lib/google-service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  if (action === 'login') {
    const authUrl = googleService.getAuthUrl()
    return NextResponse.redirect(authUrl)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
```

Create `src/app/api/auth/google/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { googleService } from '@/lib/google-service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 })
  }

  try {
    const tokens = await googleService.getTokenFromCode(code)
    
    // Store tokens securely (implement your storage logic)
    // For now, we'll return success
    
    return NextResponse.json({
      success: true,
      message: 'Google services connected successfully'
    })
  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate with Google' },
      { status: 500 }
    )
  }
}
```

---

## 🔧 Part 4: Enhanced Chat Integration

### Step 1: Create Unified API Actions

Create `src/app/api/actions/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { githubService } from '@/lib/github-service'
import { googleService } from '@/lib/google-service'
import { linkedinService } from '@/lib/linkedin-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, params, tokens } = body

    // Set Google tokens if provided
    if (tokens?.google) {
      googleService.setTokens(tokens.google)
    }

    switch (action) {
      case 'send_email':
        const { to, subject, message } = params
        const emailResult = await googleService.sendEmail(to, subject, message)
        return NextResponse.json(emailResult)

      case 'book_meeting':
        const { title, description, startTime, endTime, attendees } = params
        const meetingResult = await googleService.createMeeting(
          title,
          description,
          new Date(startTime),
          new Date(endTime),
          attendees
        )
        return NextResponse.json(meetingResult)

      case 'get_github_profile':
        const profile = await githubService.getProfile()
        return NextResponse.json({ success: true, data: profile })

      case 'get_github_repos':
        const repos = await githubService.getRepositories(undefined, params?.limit || 10)
        return NextResponse.json({ success: true, data: repos })

      case 'get_linkedin_info':
        const linkedinInfo = linkedinService.getStaticProfileInfo()
        return NextResponse.json({ success: true, data: linkedinInfo })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### Step 2: Update Your Chat Route

Add these functions to your existing `src/app/api/chat/route.ts`:

```typescript
// Add these imports at the top
import { githubService } from '@/lib/github-service'
import { googleService } from '@/lib/google-service'
import { linkedinService } from '@/lib/linkedin-service'

// Add this function to detect and handle special actions
async function detectAndHandleSpecialActions(message: string, userTokens?: any) {
  const lowerMessage = message.toLowerCase()
  
  // Email sending detection
  if (lowerMessage.includes('send email') || lowerMessage.includes('email')) {
    const emailMatch = message.match(/send email to ([\w\.-]+@[\w\.-]+\.\w+)/i)
    if (emailMatch) {
      const email = emailMatch[1]
      return {
        action: 'send_email',
        response: `I can help you send an email to ${email}. However, I need you to authenticate with Google first. Please visit /api/auth/google?action=login to connect your Gmail account.`,
        needsAuth: !userTokens?.google
      }
    }
    return {
      action: 'email_info',
      response: "I can help you send emails! Just say something like 'send email to john@example.com' and I'll guide you through the process."
    }
  }

  // Meeting booking detection
  if (lowerMessage.includes('book meeting') || lowerMessage.includes('schedule meeting') || lowerMessage.includes('book with you')) {
    return {
      action: 'book_meeting',
      response: "I'd be happy to help you book a meeting! I can create Google Meet sessions and send calendar invites. To get started, please authenticate with Google at /api/auth/google?action=login. Then tell me your preferred date, time, and what you'd like to discuss!",
      needsAuth: !userTokens?.google
    }
  }

  // GitHub queries
  if (lowerMessage.includes('github')) {
    try {
      let githubType = 'general'
      if (lowerMessage.includes('profile')) githubType = 'profile'
      else if (lowerMessage.includes('repo')) githubType = 'repos'
      else if (lowerMessage.includes('commit')) githubType = 'commits'
      else if (lowerMessage.includes('language')) githubType = 'languages'

      const githubResponse = await handleGitHubQuery(message, githubType as any)
      return {
        action: 'github_query',
        response: githubResponse
      }
    } catch (error) {
      return {
        action: 'github_error',
        response: `I had trouble accessing my GitHub data. You can check out my profile directly at https://github.com/${process.env.GITHUB_USERNAME}`
      }
    }
  }

  // LinkedIn queries
  if (lowerMessage.includes('linkedin')) {
    const linkedinInfo = linkedinService.getStaticProfileInfo()
    return {
      action: 'linkedin_query',
      response: `You can find my professional background and connections on LinkedIn: ${linkedinInfo.profileUrl}\n\n${linkedinInfo.summary}\n\nFor detailed work history, recommendations, and professional updates, LinkedIn is the best place to connect with me professionally!`
    }
  }

  return null
}

// Update your main response generation function
async function generateEnhancedPortfolioResponse(
  query: string, 
  conversationHistory: any[], 
  interviewType: InterviewContextType, 
  sessionId: string,
  userTokens?: any
) {
  // Check for special actions first
  const specialAction = await detectAndHandleSpecialActions(query, userTokens)
  if (specialAction) {
    return {
      response: specialAction.response,
      metadata: {
        action: specialAction.action,
        needsAuth: specialAction.needsAuth || false,
        ragPattern: 'action_based'
      }
    }
  }

  // Continue with your existing RAG logic...
  // (keep your existing implementation)
}
```

---

## 🚀 Part 5: Testing and Usage

### Step 1: Test GitHub Integration

```bash
# Start your development server
pnpm dev

# Test GitHub queries
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me your GitHub profile", "enhancedMode": true}'

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are your recent GitHub repositories?", "enhancedMode": true}'
```

### Step 2: Test Google Integration

1. Visit `http://localhost:3000/api/auth/google?action=login` to authenticate
2. After authentication, test email and meeting features:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "send email to test@example.com", "enhancedMode": true}'

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "book a meeting with me next Tuesday at 2 PM", "enhancedMode": true}'
```

### Step 3: Test LinkedIn Integration

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about your LinkedIn profile", "enhancedMode": true}'
```

---

## 🔒 Part 6: Security and Production Considerations

### Token Storage (Important!)

For production, implement secure token storage:

1. **Database Storage**: Store encrypted tokens in your database
2. **Session Management**: Link tokens to user sessions
3. **Token Refresh**: Implement automatic token refresh
4. **Expiration Handling**: Handle expired tokens gracefully

### Rate Limiting

Add rate limiting to prevent API abuse:

```typescript
// Add to your API routes
const RATE_LIMITS = {
  github: 5000, // requests per hour
  google: 100,  // requests per hour
  linkedin: 500, // requests per hour
}
```

### Error Handling

Implement robust error handling for all API calls and provide fallback responses when external services are unavailable.

---

## 📚 Part 7: Advanced Features

### Webhook Integration

Set up webhooks for real-time updates:

1. **GitHub Webhooks**: Get notified of new commits, issues, releases
2. **Google Calendar Webhooks**: Get notified of calendar changes
3. **LinkedIn Updates**: Monitor profile changes (limited API)

### Analytics and Monitoring

Track API usage and performance:

```typescript
// Add to your services
async function logAPIUsage(service: string, endpoint: string, success: boolean) {
  // Log to your analytics system
  console.log(`${service} ${endpoint}: ${success ? 'SUCCESS' : 'FAILED'}`)
}
```

### Caching Strategy

Implement caching for frequently requested data:

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Cache GitHub data for 5 minutes
async function getCachedGitHubProfile() {
  const cached = await redis.get('github:profile')
  if (cached) return cached
  
  const profile = await githubService.getProfile()
  await redis.setex('github:profile', 300, JSON.stringify(profile))
  return profile
}
```

---

## ✅ Final Checklist

- [ ] GitHub Personal Access Token or OAuth app created
- [ ] LinkedIn Developer App created and configured
- [ ] Google Cloud project with Gmail and Calendar APIs enabled
- [ ] OAuth consent screens configured for all services
- [ ] Environment variables added to `.env.local`
- [ ] All dependencies installed
- [ ] Services created and tested
- [ ] Chat route updated with new integrations
- [ ] Authentication flows working
- [ ] Error handling implemented
- [ ] Security considerations addressed

## 🎯 Usage Examples

Once everything is set up, your chatbot will respond to:

- **"Show me your GitHub repositories"** → Lists recent repos with stats
- **"What's your recent coding activity?"** → Shows latest commits
- **"Send an email to john@example.com"** → Initiates email sending process
- **"Book a meeting with me next Friday"** → Creates calendar invite with Meet link
- **"Tell me about your LinkedIn profile"** → Shares professional information
- **"What programming languages do you use?"** → Shows GitHub language stats

Your Digital Twin chatbot is now a comprehensive personal assistant that can discuss your professional background and take real actions on your behalf!