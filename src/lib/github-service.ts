import { Octokit } from '@octokit/rest'
import { createOAuthAppAuth } from '@octokit/auth-oauth-app'

export class GitHubService {
  private octokit: Octokit
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID!
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET!
    
    // Initialize Octokit with OAuth app authentication
    this.octokit = new Octokit({
      authStrategy: createOAuthAppAuth,
      auth: {
        clientType: 'oauth-app',
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      },
    })
  }

  /**
   * Get OAuth authorization URL for user authentication
   */
  getOAuthUrl(state?: string) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/github/callback`,
      scope: 'read:user user:email repo',
      state: state || 'github-oauth'
    })

    return `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string) {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
        }).toString(),
      })

      if (!response.ok) {
        throw new Error(`GitHub OAuth error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`)
      }

      return data.access_token
    } catch (error) {
      console.error('GitHub token exchange error:', error)
      throw new Error('Failed to get GitHub access token')
    }
  }

  /**
   * Create authenticated Octokit instance with user token
   */
  getAuthenticatedClient(accessToken: string) {
    return new Octokit({
      auth: accessToken,
    })
  }

  /**
   * Get user profile (requires authenticated token)
   */
  async getProfile(accessToken?: string, username?: string) {
    try {
      const client = accessToken ? this.getAuthenticatedClient(accessToken) : this.octokit
      
      if (accessToken) {
        // Get authenticated user's profile
        const { data } = await client.rest.users.getAuthenticated()
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
          email: data.email,
          avatarUrl: data.avatar_url,
          htmlUrl: data.html_url,
        }
      } else {
        // Get public profile by username
        const targetUsername = username || process.env.GITHUB_USERNAME!
        const { data } = await client.rest.users.getByUsername({
          username: targetUsername,
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
          avatarUrl: data.avatar_url,
          htmlUrl: data.html_url,
        }
      }
    } catch (error) {
      console.error('GitHub profile fetch error:', error)
      throw new Error('Failed to fetch GitHub profile')
    }
  }

  /**
   * Get repositories for a user
   */
  async getRepositories(accessToken?: string, username?: string, limit: number = 10) {
    try {
      const client = accessToken ? this.getAuthenticatedClient(accessToken) : this.octokit
      const targetUsername = username || process.env.GITHUB_USERNAME!

      let data
      if (accessToken) {
        // Get authenticated user's repos (includes private)
        const response = await client.rest.repos.listForAuthenticatedUser({
          sort: 'updated',
          per_page: limit,
        })
        data = response.data
      } else {
        // Get public repos for specified user
        const response = await client.rest.repos.listForUser({
          username: targetUsername,
          sort: 'updated',
          per_page: limit,
        })
        data = response.data
      }
      
      return data.map(repo => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        url: repo.html_url,
        updatedAt: repo.updated_at,
        topics: repo.topics,
        isPrivate: repo.private,
        defaultBranch: repo.default_branch,
      }))
    } catch (error) {
      console.error('GitHub repositories fetch error:', error)
      throw new Error('Failed to fetch GitHub repositories')
    }
  }

  /**
   * Get recent activity/events for a user
   */
  async getRecentActivity(accessToken?: string, username?: string, limit: number = 10) {
    try {
      const client = accessToken ? this.getAuthenticatedClient(accessToken) : this.octokit
      const targetUsername = username || process.env.GITHUB_USERNAME!

      const { data } = await client.rest.activity.listPublicEventsForUser({
        username: targetUsername,
        per_page: Math.min(limit * 3, 30), // Get more to filter for relevant events
      })

      const activities = data
        .filter(event => event.type && ['PushEvent', 'CreateEvent', 'PullRequestEvent', 'IssuesEvent'].includes(event.type))
        .slice(0, limit)
        .map(event => {
          let description = ''
          let action = ''

          switch (event.type) {
            case 'PushEvent':
              const commits = (event.payload as any).commits || []
              action = 'pushed commits'
              description = commits[0]?.message || 'Code changes'
              break
            case 'CreateEvent':
              action = 'created'
              description = `${(event.payload as any).ref_type}: ${(event.payload as any).ref || 'repository'}`
              break
            case 'PullRequestEvent':
              action = (event.payload as any).action
              description = (event.payload as any).pull_request?.title || 'Pull request'
              break
            case 'IssuesEvent':
              action = (event.payload as any).action
              description = (event.payload as any).issue?.title || 'Issue'
              break
          }

          return {
            type: event.type,
            action,
            repo: event.repo.name,
            description,
            date: event.created_at,
            url: `https://github.com/${event.repo.name}`,
          }
        })

      return activities
    } catch (error) {
      console.error('GitHub activity fetch error:', error)
      throw new Error('Failed to fetch recent GitHub activity')
    }
  }

  /**
   * Get language statistics from repositories
   */
  async getLanguageStats(accessToken?: string, username?: string) {
    try {
      const repos = await this.getRepositories(accessToken, username, 50)
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

  /**
   * Get commit statistics for a user
   */
  async getCommitStats(accessToken?: string, username?: string) {
    try {
      const client = accessToken ? this.getAuthenticatedClient(accessToken) : this.octokit
      const targetUsername = username || process.env.GITHUB_USERNAME!

      // Get recent commits from the user's activity
      const { data } = await client.rest.activity.listPublicEventsForUser({
        username: targetUsername,
        per_page: 100,
      })

      const pushEvents = data.filter(event => event.type === 'PushEvent')
      const totalCommits = pushEvents.reduce((total, event) => {
        return total + ((event.payload as any).commits?.length || 0)
      }, 0)

      // Get unique repositories committed to
      const reposWithCommits = new Set(pushEvents.map(event => event.repo.name))

      return {
        totalCommits,
        recentCommits: Math.min(totalCommits, 50),
        repositoriesWithCommits: reposWithCommits.size,
        lastCommitDate: pushEvents[0]?.created_at || null,
      }
    } catch (error) {
      console.error('GitHub commit stats error:', error)
      throw new Error('Failed to fetch commit statistics')
    }
  }
}

// Export singleton instance
export const githubService = new GitHubService()