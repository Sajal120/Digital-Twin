/**
 * Tool Use RAG Extension
 * =====================
 *
 * Advanced RAG pattern that allows the LLM to access external tools and APIs
 * when the knowledge base doesn't contain sufficient information.
 *
 * Features:
 * - Tool Discovery: LLM identifies when external tools are needed
 * - API Integration: Access to GitHub, LinkedIn, and other professional APIs
 * - Dynamic Tool Selection: Choose appropriate tools based on query type
 * - Result Integration: Combine external data with RAG results
 * - Error Handling: Graceful fallbacks when tools fail
 */

import Groq from 'groq-sdk'
import { githubService, generateGitHubEnhancedResponse } from '@/lib/github-integration'
import type { VectorResult } from './llm-enhanced-rag'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, any>
  category: 'github' | 'linkedin' | 'web' | 'api' | 'data'
  requiresAuth: boolean
  enabled: boolean
}

export interface ToolResult {
  toolName: string
  success: boolean
  data?: any
  error?: string
  executionTime: number
  source?: string
}

export interface ToolUseDecision {
  shouldUseTool: boolean
  toolName?: string
  reasoning: string
  confidence: number
  parameters?: Record<string, any>
}

export interface ToolEnhancedResult {
  response: string
  toolsUsed: ToolResult[]
  ragResults: VectorResult[]
  metadata: {
    originalQuery: string
    toolDecision: ToolUseDecision
    totalExecutionTime: number
    synthesisStrategy: string
  }
}

/**
 * Available Tools Registry
 * ========================
 *
 * Registry of external tools and APIs that can be accessed
 */
export const AVAILABLE_TOOLS: Record<string, ToolDefinition> = {
  github_profile: {
    name: 'github_profile',
    description:
      'Fetch GitHub profile information including repositories, contributions, and stats',
    parameters: { username: 'string' },
    category: 'github',
    requiresAuth: false,
    enabled: true,
  },

  github_repositories: {
    name: 'github_repositories',
    description:
      'Get detailed information about GitHub repositories including languages, stars, and commits',
    parameters: { username: 'string', repo: 'string' },
    category: 'github',
    requiresAuth: false,
    enabled: true,
  },

  github_contributions: {
    name: 'github_contributions',
    description: 'Fetch GitHub contribution activity and commit history',
    parameters: { username: 'string', timeframe: 'string' },
    category: 'github',
    requiresAuth: false,
    enabled: true,
  },

  linkedin_profile: {
    name: 'linkedin_profile',
    description: 'Access LinkedIn profile information (requires LinkedIn API access)',
    parameters: { profile_id: 'string' },
    category: 'linkedin',
    requiresAuth: true,
    enabled: false, // Disabled by default due to API restrictions
  },

  web_search: {
    name: 'web_search',
    description: 'Search the web for current information about topics not in knowledge base',
    parameters: { query: 'string', num_results: 'number' },
    category: 'web',
    requiresAuth: false,
    enabled: false, // Can be enabled with search API
  },

  portfolio_website: {
    name: 'portfolio_website',
    description: 'Fetch current information from portfolio website or blog',
    parameters: { url: 'string', section: 'string' },
    category: 'web',
    requiresAuth: false,
    enabled: true,
  },

  real_time_data: {
    name: 'real_time_data',
    description: 'Get real-time data like current date, time, or recent updates',
    parameters: { data_type: 'string' },
    category: 'data',
    requiresAuth: false,
    enabled: true,
  },
}

/**
 * Tool Use RAG Pipeline
 * =====================
 *
 * Main pipeline that decides when to use tools and integrates results
 */
export async function toolUseRAG(
  query: string,
  vectorSearchFunction: (query: string) => Promise<VectorResult[]>,
  ragResults?: VectorResult[],
  enabledTools: string[] = ['github_profile', 'github_repositories', 'real_time_data'],
): Promise<ToolEnhancedResult> {
  const startTime = Date.now()

  try {
    console.log('🛠️ Tool Use RAG: Analyzing query for tool requirements...')

    // Step 1: Get RAG results if not provided
    const ragData = ragResults || (await vectorSearchFunction(query))
    console.log(`📊 Found ${ragData.length} RAG results`)

    // Step 2: Analyze if tools are needed
    const toolDecision = await decideTool(query, ragData, enabledTools)
    console.log(
      `🎯 Tool decision: ${toolDecision.shouldUseTool ? toolDecision.toolName : 'No tool needed'} (${Math.round(toolDecision.confidence * 100)}% confidence)`,
    )
    console.log(`🔍 Tool decision reasoning: ${toolDecision.reasoning}`)

    let toolResults: ToolResult[] = []

    // Step 3: Execute tool if needed
    if (toolDecision.shouldUseTool && toolDecision.toolName) {
      console.log(`⚡ Executing tool: ${toolDecision.toolName}`)
      const toolResult = await executeTool(
        toolDecision.toolName,
        toolDecision.parameters || {},
        query,
      )
      console.log(`✅ Tool execution result: ${toolResult.success ? 'SUCCESS' : 'FAILED'}`)
      if (toolResult.data) {
        console.log(
          `📊 Tool data length: ${typeof toolResult.data === 'string' ? toolResult.data.length : 'non-string'}`,
        )
      }
      toolResults.push(toolResult)

      // Check if we need additional tools based on first result
      const additionalTool = await shouldUseAdditionalTool(query, toolResult, enabledTools)
      if (
        additionalTool.shouldUseTool &&
        additionalTool.toolName &&
        additionalTool.toolName !== toolDecision.toolName
      ) {
        console.log(`⚡ Executing additional tool: ${additionalTool.toolName}`)
        const additionalResult = await executeTool(
          additionalTool.toolName,
          additionalTool.parameters || {},
          query,
        )
        toolResults.push(additionalResult)
      }
    }

    // Step 4: Synthesize RAG + Tool results
    console.log('🧠 Synthesizing RAG results with tool data...')

    // For GitHub queries, return tool results directly since they're already formatted
    if (toolResults.length > 0) {
      const githubToolResults = toolResults.filter(
        (t) => t.toolName === 'github_repositories' || t.toolName === 'github_profile',
      )

      if (githubToolResults.length > 0 && githubToolResults[0].success) {
        console.log('🎯 Returning GitHub tool result directly')
        return {
          response:
            typeof githubToolResults[0].data === 'string'
              ? githubToolResults[0].data
              : JSON.stringify(githubToolResults[0].data),
          toolsUsed: toolResults,
          ragResults: ragData,
          metadata: {
            originalQuery: query,
            toolDecision,
            totalExecutionTime: Date.now() - startTime,
            synthesisStrategy: 'direct_tool_result',
          },
        }
      }
    }

    const synthesizedResponse = await synthesizeToolAndRAG(
      query,
      ragData,
      toolResults,
      toolDecision,
    )

    return {
      response: synthesizedResponse,
      toolsUsed: toolResults,
      ragResults: ragData,
      metadata: {
        originalQuery: query,
        toolDecision,
        totalExecutionTime: Date.now() - startTime,
        synthesisStrategy: toolResults.length > 0 ? 'tool_enhanced' : 'rag_only',
      },
    }
  } catch (error) {
    console.error('Tool Use RAG failed:', error)

    // Fallback to RAG-only response
    const ragData = ragResults || (await vectorSearchFunction(query))
    const fallbackResponse =
      ragData
        .map((result) => result.data || result.metadata?.content)
        .filter(Boolean)
        .join('\n\n') || "I don't have specific information about that topic."

    return {
      response: fallbackResponse,
      toolsUsed: [],
      ragResults: ragData,
      metadata: {
        originalQuery: query,
        toolDecision: {
          shouldUseTool: false,
          reasoning: 'Error in tool processing',
          confidence: 0,
        },
        totalExecutionTime: Date.now() - startTime,
        synthesisStrategy: 'fallback_rag',
      },
    }
  }
}

/**
 * Tool Decision Logic
 * ==================
 *
 * Analyzes query and RAG results to decide if external tools are needed
 */
async function decideTool(
  query: string,
  ragResults: VectorResult[],
  enabledTools: string[],
): Promise<ToolUseDecision> {
  // Fast GitHub tool detection - avoid slow LLM processing
  const queryLower = query.toLowerCase()

  // Explicit GitHub keywords that ALWAYS need tools
  const explicitGitHubTerms = ['github', 'repositories', 'repos', 'repository']
  const hasExplicitGitHub = explicitGitHubTerms.some((term) => queryLower.includes(term))

  // Project questions that need real data
  const projectTerms = ['projects', 'project']
  const actionWords = ['show', 'what', 'your', 'have', 'list', 'tell', 'display']
  const hasProjectQuery =
    projectTerms.some((term) => queryLower.includes(term)) &&
    actionWords.some((word) => queryLower.includes(word))

  // Exclude general conversation
  const generalTerms = [
    'hello',
    'hi ',
    'how are',
    'who are you',
    'about yourself',
    'background',
    'experience',
    'skills',
    'technologies',
    'specialize',
  ]
  const isGeneralQuery = generalTerms.some((term) => queryLower.includes(term))

  const needsGitHubTool = (hasExplicitGitHub || hasProjectQuery) && !isGeneralQuery

  if (needsGitHubTool) {
    console.log('⚡ Fast GitHub tool selection')

    if (queryLower.includes('profile') || queryLower.includes('about your github')) {
      return {
        shouldUseTool: true,
        toolName: 'github_profile',
        reasoning: 'GitHub profile query detected',
        confidence: 0.9,
        parameters: { username: 'Sajal120' },
      }
    }

    return {
      shouldUseTool: true,
      toolName: 'github_repositories',
      reasoning: 'GitHub repositories query detected',
      confidence: 0.9,
      parameters: { username: 'Sajal120', limit: 6 },
    }
  }

  // Skip LLM processing for faster responses - return no tool needed
  return {
    shouldUseTool: false,
    reasoning: 'Fast heuristic: RAG results sufficient',
    confidence: 0.7,
  }
}

/**
 * Tool Execution
 * ==============
 *
 * Executes the specified tool with given parameters
 */
async function executeTool(
  toolName: string,
  parameters: Record<string, any>,
  originalQuery: string,
): Promise<ToolResult> {
  const startTime = Date.now()

  try {
    switch (toolName) {
      case 'github_profile':
        return await executeGitHubProfile(parameters, originalQuery)

      case 'github_repositories':
        return await executeGitHubRepositories(parameters, originalQuery)

      case 'github_contributions':
        return await executeGitHubContributions(parameters, originalQuery)

      case 'real_time_data':
        return await executeRealTimeData(parameters, originalQuery)

      case 'portfolio_website':
        return await executePortfolioWebsite(parameters, originalQuery)

      default:
        return {
          toolName,
          success: false,
          error: `Tool '${toolName}' not implemented`,
          executionTime: Date.now() - startTime,
        }
    }
  } catch (error) {
    return {
      toolName,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime,
    }
  }
}

/**
 * GitHub Profile Tool
 * ==================
 */
async function executeGitHubProfile(
  parameters: Record<string, any>,
  query: string,
): Promise<ToolResult> {
  const startTime = Date.now()
  const username = parameters.username || 'Sajal120'

  try {
    // Real GitHub API call
    console.log(`🔗 Fetching GitHub profile for: ${username}`)

    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Portfolio-RAG-Bot/1.0',
        // Add GitHub token if available for higher rate limits
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`)
    }

    const profileData = await response.json()

    // Fetch additional repository data for languages
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Portfolio-RAG-Bot/1.0',
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      },
    )

    let topRepositories: string[] = []
    let languages: string[] = []

    if (reposResponse.ok) {
      const repos = await reposResponse.json()
      topRepositories = repos
        .filter((repo: any) => !repo.fork && repo.name)
        .slice(0, 5)
        .map((repo: any) => repo.name)

      // Extract unique languages
      const repoLanguages = repos
        .map((repo: any) => repo.language)
        .filter((lang: string) => lang !== null)
      languages = [...new Set(repoLanguages)] as string[]
    }

    const enhancedProfileData = {
      username: profileData.login,
      name: profileData.name || 'Sajal Basnet',
      bio:
        profileData.bio || 'Software Developer focused on AI, Development, Security, and Support',
      public_repos: profileData.public_repos,
      followers: profileData.followers,
      following: profileData.following,
      location: profileData.location || 'Auburn, Sydney, NSW',
      company: profileData.company,
      blog: profileData.blog,
      twitter_username: profileData.twitter_username,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at,
      avatar_url: profileData.avatar_url,
      html_url: profileData.html_url,
      languages: languages.length > 0 ? languages : ['Python', 'JavaScript', 'TypeScript', 'Java'],
      top_repositories: topRepositories,
      profile_views: 'Not available via API',
    }

    return {
      toolName: 'github_profile',
      success: true,
      data: await githubService.generateProfileResponse(),
      executionTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      toolName: 'github_profile',
      success: false,
      error: error instanceof Error ? error.message : 'GitHub API error',
      executionTime: Date.now() - startTime,
      data: "I'm having trouble accessing my GitHub profile right now, but you can check it out directly at https://github.com/Sajal120",
    }
  }
}

/**
 * GitHub Repositories Tool
 * ========================
 */
async function executeGitHubRepositories(
  parameters: Record<string, any>,
  query: string,
): Promise<ToolResult> {
  const startTime = Date.now()
  const username = parameters.username || 'Sajal120'

  try {
    console.log('🔍 Fetching real GitHub repositories...')

    // Use the GitHub service to get real repository data
    const repositoriesResponse = await githubService.generateRepositoriesResponse(8)

    return {
      toolName: 'github_repositories',
      success: true,
      data: repositoriesResponse,
      executionTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      toolName: 'github_repositories',
      success: false,
      error: error instanceof Error ? error.message : 'GitHub API error',
      executionTime: Date.now() - startTime,
      data: "I'm having trouble accessing my repositories right now, but you can check them out directly at https://github.com/Sajal120?tab=repositories",
    }
  }
}

/**
 * GitHub Contributions Tool
 * =========================
 */
async function executeGitHubContributions(
  parameters: Record<string, any>,
  query: string,
): Promise<ToolResult> {
  const startTime = Date.now()

  try {
    const mockContributionData = {
      total_contributions_this_year: 245,
      longest_streak: 18,
      current_streak: 5,
      most_active_day: 'Tuesday',
      recent_activity: [
        'Committed to cms-twin-portfolio 2 days ago',
        'Created new repository: ai-tools-collection 1 week ago',
        'Updated automation-scripts 2 weeks ago',
      ],
      contribution_graph: 'High activity in AI and web development projects',
    }

    return {
      toolName: 'github_contributions',
      success: true,
      data: mockContributionData,
      executionTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      toolName: 'github_contributions',
      success: false,
      error: error instanceof Error ? error.message : 'Contributions data error',
      executionTime: Date.now() - startTime,
    }
  }
}

/**
 * Real-time Data Tool
 * ===================
 */
async function executeRealTimeData(
  parameters: Record<string, any>,
  query: string,
): Promise<ToolResult> {
  const startTime = Date.now()

  try {
    const now = new Date()
    const realTimeData = {
      current_date: now.toISOString().split('T')[0],
      current_time: now.toLocaleTimeString(),
      current_year: now.getFullYear(),
      current_month: now.toLocaleString('default', { month: 'long' }),
      timezone: 'Australia/Sydney',
      recent_updates: [
        'Portfolio chatbot enhanced with advanced RAG patterns (December 2024)',
        'Completed Software Developer Internship at Aubot (March 2024)',
        'Built AI-powered portfolio website (December 2024)',
      ],
    }

    return {
      toolName: 'real_time_data',
      success: true,
      data: realTimeData,
      executionTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      toolName: 'real_time_data',
      success: false,
      error: error instanceof Error ? error.message : 'Real-time data error',
      executionTime: Date.now() - startTime,
    }
  }
}

/**
 * Portfolio Website Tool
 * ======================
 */
async function executePortfolioWebsite(
  parameters: Record<string, any>,
  query: string,
): Promise<ToolResult> {
  const startTime = Date.now()

  try {
    const portfolioData = {
      latest_projects: [
        'AI-Powered Portfolio Chatbot - Advanced conversational AI with RAG system',
        'Multi-hop RAG Implementation - Complex query handling with multi-step searches',
        'Hybrid Search Engine - Combining vector and keyword search methods',
      ],
      current_focus: 'Advanced RAG patterns, AI development, and intelligent system design',
      technologies: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'AI/ML'],
      status: 'Actively developing AI systems and seeking software development opportunities',
    }

    return {
      toolName: 'portfolio_website',
      success: true,
      data: portfolioData,
      executionTime: Date.now() - startTime,
      source: 'https://portfolio.sajalbasnet.com',
    }
  } catch (error) {
    return {
      toolName: 'portfolio_website',
      success: false,
      error: error instanceof Error ? error.message : 'Portfolio data error',
      executionTime: Date.now() - startTime,
    }
  }
}

/**
 * Additional Tool Decision
 * =======================
 *
 * Decides if additional tools are needed based on first tool result
 */
async function shouldUseAdditionalTool(
  query: string,
  firstToolResult: ToolResult,
  enabledTools: string[],
): Promise<ToolUseDecision> {
  if (!firstToolResult.success) {
    return {
      shouldUseTool: false,
      reasoning: 'First tool failed, not attempting additional tools',
      confidence: 0,
    }
  }

  // Simple logic: if we used GitHub profile, might need repositories too
  if (
    firstToolResult.toolName === 'github_profile' &&
    enabledTools.includes('github_repositories')
  ) {
    const needsRepos = /\b(project|repository|repos|code|development)\b/i.test(query)
    if (needsRepos) {
      return {
        shouldUseTool: true,
        toolName: 'github_repositories',
        reasoning: 'Query mentions projects/repositories, need detailed repo information',
        confidence: 0.8,
        parameters: { username: 'Sajal120' },
      }
    }
  }

  return {
    shouldUseTool: false,
    reasoning: 'Additional tools not needed',
    confidence: 0.5,
  }
}

/**
 * Synthesis Function
 * ==================
 *
 * Combines RAG results with tool results into coherent response
 */
async function synthesizeToolAndRAG(
  query: string,
  ragResults: VectorResult[],
  toolResults: ToolResult[],
  toolDecision: ToolUseDecision,
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    // Simple concatenation fallback
    let response = ''

    // For GitHub tools, prioritize tool results over RAG results
    if (toolResults.length > 0) {
      const githubToolResults = toolResults.filter(
        (t) => t.toolName === 'github_repositories' || t.toolName === 'github_profile',
      )

      if (githubToolResults.length > 0) {
        // Return GitHub tool data directly - it's already formatted
        return githubToolResults
          .filter((result) => result.success)
          .map((result) =>
            typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2),
          )
          .join('\n\n')
      }

      const toolContent = toolResults
        .filter((result) => result.success)
        .map((result) =>
          typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2),
        )
        .join('\n\n')
      response += toolContent ? `\n\n${toolContent}` : ''
    }

    if (ragResults.length > 0) {
      const ragContent = ragResults
        .map((result) => result.data || result.metadata?.content)
        .filter(Boolean)
        .join('\n')
      response += response ? `\n\n${ragContent}` : ragContent
    }

    return response || "I don't have specific information about that topic."
  }

  // Prepare context
  const ragContext =
    ragResults.length > 0
      ? ragResults
          .map((result) => result.data || result.metadata?.content || 'No content')
          .filter((content) => content !== 'No content')
          .join('\n')
      : 'No RAG results available'

  const toolContext = toolResults
    .filter((result) => result.success)
    .map(
      (result) =>
        `${result.toolName}: ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}`,
    )
    .join('\n\n')

  const synthesisPrompt = `
You are Sajal Basnet responding to a question using both your knowledge base and external tool data.

Question: "${query}"

Your knowledge base information:
${ragContext}

External tool data:
${toolContext}

Synthesize this information into a natural response as Sajal:
- Combine knowledge base and tool data logically
- Give preference to more recent/accurate tool data when relevant
- Keep response under 100 words (2-3 sentences)
- Sound conversational and natural
- Use "I" statements
- Focus on directly answering the question

Response:`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: synthesisPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.6,
      max_tokens: 200,
    })

    const synthesizedResponse = completion.choices[0]?.message?.content?.trim()

    if (synthesizedResponse && synthesizedResponse.length > 10) {
      return synthesizedResponse
    }
  } catch (error) {
    console.error('Tool-RAG synthesis failed:', error)
  }

  // Fallback synthesis
  if (ragContext !== 'No RAG results available') {
    return ragContext
  }

  if (toolResults.length > 0) {
    const successfulTool = toolResults.find((result) => result.success)
    if (successfulTool?.data) {
      return `Based on current information: ${JSON.stringify(successfulTool.data).slice(0, 200)}...`
    }
  }

  return "I don't have specific information about that topic right now."
}

/**
 * Tool Health Check
 * =================
 *
 * Checks if tools are available and working
 */
export async function checkToolHealth(toolNames?: string[]): Promise<Record<string, boolean>> {
  const toolsToCheck = toolNames || Object.keys(AVAILABLE_TOOLS)
  const healthStatus: Record<string, boolean> = {}

  for (const toolName of toolsToCheck) {
    try {
      const result = await executeTool(toolName, {}, 'health-check')
      healthStatus[toolName] = result.success
    } catch {
      healthStatus[toolName] = false
    }
  }

  return healthStatus
}
