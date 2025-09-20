/**
 * Direct GitHub Integration Service
 * ================================
 *
 * This service directly fetches real data from Sajal120's GitHub profile
 * and integrates it into chat responses for a more authentic experience.
 */

export interface GitHubRepository {
  name: string
  description: string
  language: string
  stars: number
  forks: number
  updated_at: string
  html_url: string
  topics: string[]
  size: number
  private: boolean
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
  updated_at: string
  avatar_url: string
  html_url: string
}

class GitHubService {
  private readonly username = 'Sajal120'
  private readonly baseUrl = 'https://api.github.com'
  private readonly headers: HeadersInit

  constructor() {
    this.headers = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Portfolio-Chat-Bot',
    }

    // Add token if available (for higher rate limits)
    if (process.env.GITHUB_TOKEN) {
      this.headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    }
  }

  /**
   * Fetch user profile information
   */
  async getProfile(): Promise<GitHubProfile | null> {
    try {
      console.log('🔍 Fetching GitHub profile for:', this.username)

      const response = await fetch(`${this.baseUrl}/users/${this.username}`, {
        headers: this.headers,
        next: { revalidate: 300 }, // Cache for 5 minutes
      })

      if (!response.ok) {
        console.error('GitHub API error:', response.status, response.statusText)
        return null
      }

      const data = await response.json()
      console.log('✅ Successfully fetched GitHub profile')

      return {
        name: data.name || this.username,
        bio: data.bio || '',
        location: data.location || '',
        email: data.email,
        blog: data.blog || '',
        company: data.company,
        followers: data.followers || 0,
        following: data.following || 0,
        public_repos: data.public_repos || 0,
        created_at: data.created_at || '',
        updated_at: data.updated_at || '',
        avatar_url: data.avatar_url || '',
        html_url: data.html_url || `https://github.com/${this.username}`,
      }
    } catch (error) {
      console.error('Failed to fetch GitHub profile:', error)
      return null
    }
  }

  /**
   * Fetch user repositories
   */
  async getRepositories(limit: number = 10): Promise<GitHubRepository[]> {
    try {
      console.log('🔍 Fetching GitHub repositories for:', this.username)

      const response = await fetch(
        `${this.baseUrl}/users/${this.username}/repos?sort=updated&per_page=${limit}&type=public`,
        {
          headers: this.headers,
          next: { revalidate: 300 }, // Cache for 5 minutes
        },
      )

      if (!response.ok) {
        console.error('GitHub API error:', response.status, response.statusText)
        return []
      }

      const data = await response.json()
      console.log(`✅ Successfully fetched ${data.length} repositories`)

      return data.map(
        (repo: any): GitHubRepository => ({
          name: repo.name || '',
          description: repo.description || 'No description available',
          language: repo.language || 'Unknown',
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          updated_at: repo.updated_at || '',
          html_url: repo.html_url || '',
          topics: repo.topics || [],
          size: repo.size || 0,
          private: repo.private || false,
        }),
      )
    } catch (error) {
      console.error('Failed to fetch GitHub repositories:', error)
      return []
    }
  }

  /**
   * Get a specific repository by name
   */
  async getRepository(repoName: string): Promise<GitHubRepository | null> {
    try {
      console.log('🔍 Fetching specific repository:', repoName)

      const response = await fetch(`${this.baseUrl}/repos/${this.username}/${repoName}`, {
        headers: this.headers,
        next: { revalidate: 300 },
      })

      if (!response.ok) {
        console.error('GitHub API error:', response.status, response.statusText)
        return null
      }

      const repo = await response.json()
      console.log('✅ Successfully fetched repository:', repoName)

      return {
        name: repo.name || '',
        description: repo.description || 'No description available',
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        updated_at: repo.updated_at || '',
        html_url: repo.html_url || '',
        topics: repo.topics || [],
        size: repo.size || 0,
        private: repo.private || false,
      }
    } catch (error) {
      console.error('Failed to fetch repository:', error)
      return null
    }
  }

  /**
   * Generate a formatted response about GitHub profile
   */
  async generateProfileResponse(): Promise<string> {
    const profile = await this.getProfile()

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
  async generateRepositoriesResponse(limit: number = 6): Promise<string> {
    const repos = await this.getRepositories(limit)

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
  async searchRepositories(query: string): Promise<GitHubRepository[]> {
    const repos = await this.getRepositories(20) // Get more repos for searching
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
  async generateProjectResponse(query: string): Promise<string> {
    const relevantRepos = await this.searchRepositories(query)

    if (relevantRepos.length === 0) {
      const allRepos = await this.getRepositories(5)
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
export const githubService = new GitHubService()

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
export async function generateGitHubEnhancedResponse(query: string): Promise<string> {
  try {
    // Check what type of GitHub info is being requested
    const queryLower = query.toLowerCase()

    if (queryLower.includes('profile') || queryLower.includes('about your github')) {
      return await githubService.generateProfileResponse()
    }

    if (queryLower.includes('repositories') || queryLower.includes('all projects')) {
      return await githubService.generateRepositoriesResponse(8)
    }

    // Check for specific technology queries
    const techQuery = extractTechQuery(query)
    if (techQuery) {
      return await githubService.generateProjectResponse(techQuery)
    }

    // General project/GitHub query
    if (isGitHubQuery(query)) {
      return await githubService.generateRepositoriesResponse(6)
    }

    return '' // Return empty if not a GitHub query
  } catch (error) {
    console.error('GitHub integration error:', error)
    return `I'm having trouble accessing my GitHub data right now, but you can check out my projects directly at https://github.com/Sajal120`
  }
}
