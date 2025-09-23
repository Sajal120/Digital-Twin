/**
 * GitHub Integration Service with OAuth Support
 * ============================================
 *
 * This service integrates GitHub data into chat responses using both:
 * 1. OAuth authentication for personalized responses
 * 2. Public API access for general profile information
 */

import { githubService as githubOAuthService } from './github-service'

export interface GitHubRepository {
  name: string
  description: string
  language: string
  stars: number
  forks: number
  updated_at: string
  html_url: string
  topics: string[]
  size?: number
  private?: boolean
}

export interface GitHubProfile {
  name: string
  bio: string
  location: string
  email: string | null
  blog: string
  company: string | null
  followers: number
  following: number
  public_repos: number
  created_at: string
  updated_at?: string
  avatar_url: string
  html_url: string
}

class GitHubIntegrationService {
  private readonly username = process.env.GITHUB_USERNAME || 'Sajal120'
  private readonly baseUrl = 'https://api.github.com'
  private readonly headers: HeadersInit

  constructor() {
    this.headers = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Digital-Twin-Portfolio-Bot',
    }
  }

  /**
   * Fetch user profile using OAuth service or public API
   */
  async getProfile(accessToken?: string): Promise<GitHubProfile | null> {
    try {
      console.log('🔍 Fetching GitHub profile for:', this.username)

      if (accessToken) {
        // Use OAuth service for authenticated requests
        const profile = await githubOAuthService.getProfile(accessToken)
        if (!profile) return null
        
        return {
          name: profile.name || this.username,
          bio: profile.bio || '',
          location: profile.location || '',
          email: profile.email || null,
          blog: profile.blog || '',
          company: profile.company,
          followers: profile.followers || 0,
          following: profile.following || 0,
          public_repos: profile.publicRepos || 0,
          created_at: profile.createdAt || '',
          avatar_url: profile.avatarUrl || '',
          html_url: profile.htmlUrl || `https://github.com/${this.username}`,
        }
      } else {
        // Use public API for non-authenticated requests  
        const profile = await githubOAuthService.getProfile(undefined, this.username)
        if (!profile) return null
        
        return {
          name: profile.name || this.username,
          bio: profile.bio || '',
          location: profile.location || '',
          email: null, // Email not available in public API
          blog: profile.blog || '',
          company: profile.company,
          followers: profile.followers || 0,
          following: profile.following || 0,
          public_repos: profile.publicRepos || 0,
          created_at: profile.createdAt || '',
          avatar_url: profile.avatarUrl || '',
          html_url: profile.htmlUrl || `https://github.com/${this.username}`,
        }
      }
    } catch (error) {
      console.error('Failed to fetch GitHub profile:', error)
      return null
    }
  }
  /**
   * Fetch user repositories using OAuth service or public API
   */
  async getRepositories(limit: number = 10, accessToken?: string): Promise<GitHubRepository[]> {
    try {
      console.log('🔍 Fetching GitHub repositories for:', this.username)

      const repos = await githubOAuthService.getRepositories(accessToken, this.username, limit)
      console.log(`✅ Successfully fetched ${repos.length} repositories`)

      return repos.map((repo: any) => ({
        name: repo.name,
        description: repo.description || 'No description available',
        language: repo.language || 'Unknown',
        stars: repo.stars,
        forks: repo.forks,
        updated_at: repo.updatedAt,
        html_url: repo.url,
        topics: repo.topics || [],
        size: 0, // Not available in new service
        private: repo.isPrivate || false,
      }))
    } catch (error) {
      console.error('Failed to fetch GitHub repositories:', error)
      return []
    }
  }

  /**
   * Get recent GitHub activity
   */
  async getRecentActivity(limit: number = 5, accessToken?: string): Promise<any[]> {
    try {
      console.log('🔍 Fetching GitHub activity for:', this.username)
      const activities = await githubOAuthService.getRecentActivity(accessToken, this.username, limit)
      console.log(`✅ Successfully fetched ${activities.length} activities`)
      return activities
    } catch (error) {
      console.error('Failed to fetch GitHub activity:', error)
      return []
    }
  }

  /**
   * Get programming language statistics
   */
  async getLanguageStats(accessToken?: string) {
    try {
      const stats = await githubOAuthService.getLanguageStats(accessToken, this.username)
      return stats
    } catch (error) {
      console.error('Failed to fetch language stats:', error)
      return []
    }
  }

  /**
   * Generate a formatted response about GitHub profile
   */
  async generateProfileResponse(accessToken?: string): Promise<string> {
    const profile = await this.getProfile(accessToken)

    if (!profile) {
      return "I'm having trouble accessing my GitHub profile right now, but you can check it out directly at https://github.com/Sajal120"
    }

    return `Here's my current GitHub profile information:

**${profile.name}** (@${this.username})
${profile.bio ? `Bio: ${profile.bio}` : ''}
${profile.location ? `Location: ${profile.location}` : ''}
${profile.company ? `Company: ${profile.company}` : ''}

**Stats:**
• ${profile.public_repos} public repositories
• ${profile.followers} followers
• ${profile.following} following
${profile.blog ? `• Website: ${profile.blog}` : ''}

I'm actively developing and maintaining projects on GitHub. You can check out my complete profile at ${profile.html_url}

Would you like to see details about any specific projects or repositories?`
  }

  /**
   * Generate a formatted response about repositories
   */
  async generateRepositoriesResponse(limit: number = 6, accessToken?: string): Promise<string> {
    const repos = await this.getRepositories(limit, accessToken)

    if (repos.length === 0) {
      return "I'm having trouble accessing my repositories right now, but you can check them out directly at https://github.com/Sajal120?tab=repositories"
    }

    let response = `Here are my most recently updated GitHub projects:\n\n`

    repos.slice(0, limit).forEach((repo, index) => {
      const lastUpdated = new Date(repo.updated_at).toLocaleDateString()
      const topicsStr = repo.topics.length > 0 ? `\n  Topics: ${repo.topics.join(', ')}` : ''

      response += `**${index + 1}. ${repo.name}**
  ${repo.description}
  Language: ${repo.language} | ⭐ ${repo.stars} | 🍴 ${repo.forks}
  Last updated: ${lastUpdated}${topicsStr}
  🔗 ${repo.html_url}

`
    })

    response += `\nView all my projects at: https://github.com/Sajal120?tab=repositories

Would you like more details about any specific project?`

    return response
  }

  /**
   * Search for relevant repositories based on a query
   */
  async searchRepositories(query: string, accessToken?: string): Promise<GitHubRepository[]> {
    const repos = await this.getRepositories(20, accessToken) // Get more repos for searching
    const queryLower = query.toLowerCase()

    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(queryLower) ||
        repo.description.toLowerCase().includes(queryLower) ||
        repo.language.toLowerCase().includes(queryLower) ||
        repo.topics.some((topic) => topic.toLowerCase().includes(queryLower)),
    )
  }

  /**
   * Generate response for specific project queries
   */
  async generateProjectResponse(query: string, accessToken?: string): Promise<string> {
    const relevantRepos = await this.searchRepositories(query, accessToken)

    if (relevantRepos.length === 0) {
      const allRepos = await this.getRepositories(5, accessToken)
      return `I couldn't find specific projects matching "${query}", but here are some of my recent projects:\n\n${await this.formatRepositoryList(allRepos)}`
    }

    if (relevantRepos.length === 1) {
      const repo = relevantRepos[0]
      const lastUpdated = new Date(repo.updated_at).toLocaleDateString()

      return `Here's information about **${repo.name}**:

${repo.description}

**Details:**
• Language: ${repo.language}
• Stars: ⭐ ${repo.stars}
• Forks: 🍴 ${repo.forks}
• Last updated: ${lastUpdated}
${repo.topics.length > 0 ? `• Topics: ${repo.topics.join(', ')}` : ''}

🔗 View the project: ${repo.html_url}

This project demonstrates my expertise in ${repo.language} development${repo.topics.length > 0 ? ` and work with ${repo.topics.join(', ')}` : ''}.`
    }

    return `I found ${relevantRepos.length} projects related to "${query}":\n\n${await this.formatRepositoryList(relevantRepos.slice(0, 5))}`
  }

  /**
   * Generate response about recent coding activity
   */
  async generateActivityResponse(limit: number = 5, accessToken?: string): Promise<string> {
    const activities = await this.getRecentActivity(limit, accessToken)

    if (activities.length === 0) {
      return "I'm having trouble accessing my recent GitHub activity right now, but you can check it out directly at https://github.com/Sajal120"
    }

    let response = `Here's my recent GitHub activity:\n\n`

    activities.forEach((activity, index) => {
      const date = new Date(activity.date).toLocaleDateString()
      response += `**${index + 1}. ${activity.repo}**
  ${activity.action}: ${activity.description}
  Date: ${date}
  🔗 ${activity.url}

`
    })

    response += `\nStay updated with my latest work at: https://github.com/Sajal120`
    return response
  }

  /**
   * Generate response about programming languages
   */
  async generateLanguageStatsResponse(accessToken?: string): Promise<string> {
    const stats = await this.getLanguageStats(accessToken)

    if (stats.length === 0) {
      return "I'm having trouble accessing my language statistics right now, but I work with various programming languages and technologies."
    }

    let response = `Here are my programming languages based on GitHub repositories:\n\n`

    stats.forEach((stat, index) => {
      response += `**${index + 1}. ${stat.language}** - ${stat.count} repositories\n`
    })

    response += `\nI'm always learning new technologies and expanding my skill set! You can see my code across different languages at https://github.com/Sajal120`
    return response
  }

  /**
   * Helper method to format repository list
   */
  private async formatRepositoryList(repos: GitHubRepository[]): Promise<string> {
    return repos
      .map((repo, index) => {
        const lastUpdated = new Date(repo.updated_at).toLocaleDateString()
        return `**${index + 1}. ${repo.name}**
${repo.description}
Language: ${repo.language} | ⭐ ${repo.stars} | Last updated: ${lastUpdated}
🔗 ${repo.html_url}`
      })
      .join('\n\n')
  }
}

// Export singleton instance
export const githubIntegration = new GitHubIntegrationService()

// Backward compatibility export
export const githubService = githubIntegration

/**
 * Helper functions for use in chat responses
 */

/**
 * Check if a query is asking about GitHub/projects
 */
export function isGitHubQuery(query: string): boolean {
  const gitHubKeywords = [
    'github',
    'repository',
    'repositories',
    'repos',
    'repo',
    'projects',
    'project',
    'code',
    'coding',
    'programming',
    'development',
    'dev',
    'git',
    'source code',
    'commits',
    'portfolio',
    'work samples',
    'examples',
  ]

  const queryLower = query.toLowerCase()
  return gitHubKeywords.some((keyword) => queryLower.includes(keyword))
}

/**
 * Check if query is asking about specific technologies/languages
 */
export function extractTechQuery(query: string): string | null {
  const techKeywords = [
    'python',
    'java',
    'javascript',
    'typescript',
    'react',
    'nextjs',
    'next.js',
    'html',
    'css',
    'tailwind',
    'node',
    'nodejs',
    'api',
    'database',
    'sql',
    'ai',
    'machine learning',
    'ml',
    'tensorflow',
    'web development',
  ]

  const queryLower = query.toLowerCase()
  const foundTech = techKeywords.find((tech) => queryLower.includes(tech))

  return foundTech || null
}

/**
 * Generate enhanced response with real GitHub data
 */
export async function generateGitHubEnhancedResponse(query: string, accessToken?: string): Promise<string> {
  try {
    // Check what type of GitHub info is being requested
    const queryLower = query.toLowerCase()

    if (queryLower.includes('profile') || queryLower.includes('about your github')) {
      return await githubIntegration.generateProfileResponse(accessToken)
    }

    if (queryLower.includes('repositories') || queryLower.includes('all projects')) {
      return await githubIntegration.generateRepositoriesResponse(8, accessToken)
    }

    if (queryLower.includes('activity') || queryLower.includes('recent commits') || queryLower.includes('recent work')) {
      return await githubIntegration.generateActivityResponse(5, accessToken)
    }

    if (queryLower.includes('languages') || queryLower.includes('programming languages') || queryLower.includes('tech stack')) {
      return await githubIntegration.generateLanguageStatsResponse(accessToken)
    }

    // Check for specific technology queries
    const techQuery = extractTechQuery(query)
    if (techQuery) {
      return await githubIntegration.generateProjectResponse(techQuery, accessToken)
    }

    // General project/GitHub query
    if (isGitHubQuery(query)) {
      return await githubIntegration.generateRepositoriesResponse(6, accessToken)
    }

    return '' // Return empty if not a GitHub query
  } catch (error) {
    console.error('GitHub integration error:', error)
    return `I'm having trouble accessing my GitHub data right now, but you can check out my projects directly at https://github.com/Sajal120`
  }
}
