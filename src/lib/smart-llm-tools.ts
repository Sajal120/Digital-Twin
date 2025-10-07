/**
 * Smart LLM Tool Orchestrator
 * ===========================
 *
 * This system allows the LLM to intelligently decide when and how to use external APIs
 * based on the user's query. The LLM can call multiple tools and combine their results.
 */

import Groq from 'groq-sdk'
import { githubService } from '@/lib/github-integration'
import { linkedinService } from '@/lib/linkedin-integration'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export interface ExternalTool {
  name: string
  description: string
  execute: (params: any) => Promise<string>
  parameters: Record<string, string>
}

export interface ToolCall {
  tool: string
  params: Record<string, any>
  result?: string
  success?: boolean
}

/**
 * Available External APIs/Tools
 */
export const EXTERNAL_TOOLS: Record<string, ExternalTool> = {
  github_repos: {
    name: 'github_repos',
    description: 'Fetch real GitHub repositories with details like languages, descriptions, stars',
    parameters: {
      username: 'GitHub username (default: Sajal120)',
      limit: 'Number of repositories to fetch (default: 6)',
    },
    execute: async (params) => {
      const limit = params.limit || 6
      return await githubService.generateRepositoriesResponse(limit)
    },
  },

  github_profile: {
    name: 'github_profile',
    description: 'Fetch GitHub profile information including stats, bio, followers',
    parameters: {
      username: 'GitHub username (default: Sajal120)',
    },
    execute: async (params) => {
      return await githubService.generateProfileResponse()
    },
  },

  github_search: {
    name: 'github_search',
    description: 'Search for specific projects by technology or keywords',
    parameters: {
      query: 'Technology or keyword to search for (e.g., "python", "typescript")',
    },
    execute: async (params) => {
      const query = params.query || ''
      return await githubService.generateProjectResponse(query)
    },
  },

  linkedin_profile: {
    name: 'linkedin_profile',
    description:
      'Fetch LinkedIn profile information including professional summary, stats, and endorsements',
    parameters: {},
    execute: async (params) => {
      return await linkedinService.generateProfileResponse()
    },
  },

  linkedin_experience: {
    name: 'linkedin_experience',
    description: 'Fetch detailed work experience and career history from LinkedIn',
    parameters: {},
    execute: async (params) => {
      return await linkedinService.generateExperienceResponse()
    },
  },

  linkedin_skills: {
    name: 'linkedin_skills',
    description: 'Fetch professional skills, endorsements, and recommendations from LinkedIn',
    parameters: {},
    execute: async (params) => {
      return await linkedinService.generateSkillsResponse()
    },
  },

  linkedin_certificates: {
    name: 'linkedin_certificates',
    description: 'Fetch certificates, certifications, and credentials from LinkedIn profile',
    parameters: {},
    execute: async (params) => {
      return await linkedinService.generateCertificatesResponse()
    },
  },

  linkedin_search: {
    name: 'linkedin_search',
    description: 'Search for specific experience, companies, or skills in professional background',
    parameters: {
      query: 'Company name, skill, or experience to search for (e.g., "Aubot", "Python")',
    },
    execute: async (params) => {
      const query = params.query || ''
      return await linkedinService.searchExperience(query)
    },
  },
}

/**
 * Smart LLM Tool Orchestrator
 * ===========================
 *
 * The LLM analyzes the query and decides which external tools to call
 */
export async function smartLLMWithTools(
  query: string,
  ragResults: any[] = [],
  conversationHistory: any[] = [],
  accessToken?: string,
): Promise<{
  response: string
  toolsCalled: ToolCall[]
  reasoning: string
  executionTime: number
}> {
  const startTime = Date.now()

  if (!process.env.GROQ_API_KEY) {
    return {
      response: 'Smart LLM tool orchestration requires GROQ_API_KEY to be configured.',
      toolsCalled: [],
      reasoning: 'No LLM available',
      executionTime: Date.now() - startTime,
    }
  }

  try {
    // Step 1: LLM decides which tools to use
    const toolDecision = await decideBestTools(query, ragResults)
    console.log('🧠 LLM Tool Decision:', toolDecision.reasoning)

    let toolsCalled: ToolCall[] = []
    let toolResults: Record<string, string> = {}

    // Step 2: Execute selected tools
    if (toolDecision.tools.length > 0) {
      console.log(`⚡ Executing ${toolDecision.tools.length} external tools...`)

      // Create tools with access token support
      const tools = {
        ...EXTERNAL_TOOLS,
        linkedin_profile: {
          ...EXTERNAL_TOOLS.linkedin_profile,
          execute: async (params: any) =>
            await linkedinService.generateProfileResponse(accessToken),
        },
      }

      for (const toolCall of toolDecision.tools) {
        const tool = tools[toolCall.tool as keyof typeof tools]
        if (tool) {
          try {
            const result = await tool.execute(toolCall.params)
            toolsCalled.push({
              tool: toolCall.tool,
              params: toolCall.params,
              result: result,
              success: true,
            })
            toolResults[toolCall.tool] = result
            console.log(`✅ ${toolCall.tool} executed successfully`)
          } catch (error) {
            console.error(`❌ ${toolCall.tool} failed:`, error)
            toolsCalled.push({
              tool: toolCall.tool,
              params: toolCall.params,
              result: `Error: ${error}`,
              success: false,
            })
          }
        }
      }
    }

    // Step 3: LLM synthesizes final response
    const finalResponse = await synthesizeResponse(
      query,
      ragResults,
      toolResults,
      conversationHistory,
    )

    return {
      response: finalResponse,
      toolsCalled,
      reasoning: toolDecision.reasoning,
      executionTime: Date.now() - startTime,
    }
  } catch (error) {
    console.error('Smart LLM orchestration failed:', error)
    return {
      response:
        'I encountered an issue processing your request. Please try asking in a different way.',
      toolsCalled: [],
      reasoning: `Error: ${error}`,
      executionTime: Date.now() - startTime,
    }
  }
}

/**
 * LLM decides which external tools to use
 */
async function decideBestTools(
  query: string,
  ragResults: any[],
): Promise<{
  tools: Array<{ tool: string; params: Record<string, any> }>
  reasoning: string
}> {
  const availableTools = Object.entries(EXTERNAL_TOOLS)
    .map(([key, tool]) => `${key}: ${tool.description}`)
    .join('\n')

  const ragSummary =
    ragResults.length > 0 ? `Found ${ragResults.length} RAG results` : 'No RAG results available'

  const prompt = `You are Sajal Basnet's AI assistant. Analyze this query and decide which external tools to call.

Query: "${query}"
RAG Context: ${ragSummary}

Available External Tools:
${availableTools}

Guidelines:
1. For GitHub/project questions → use github_repos, github_profile, or github_search
2. For LinkedIn/professional questions → use linkedin_profile, linkedin_experience, linkedin_skills, linkedin_certificates, or linkedin_search
3. For specific technology searches → use github_search or linkedin_search
4. For general questions → no tools needed
5. You can call multiple tools if beneficial (e.g., github_repos + linkedin_experience for comprehensive background)
6. Be smart about parameters (usernames, limits, search terms)

Examples:
- "Show me your projects" → github_repos
- "What's your professional experience?" → linkedin_experience
- "Tell me about your LinkedIn profile" → linkedin_profile
- "What certificates do you have?" → linkedin_certificates
- "Do you have Python experience?" → linkedin_search with query="python"
- "Give me your complete background" → github_repos + linkedin_profile + linkedin_experience
- "Tell me about yourself" → no tools neededRespond in JSON format:
{
  "tools": [
    {"tool": "tool_name", "params": {"param": "value"}},
    {"tool": "another_tool", "params": {"param": "value"}}
  ],
  "reasoning": "Why these tools were selected and how they help answer the query"
}

If no tools are needed, return empty tools array.

Decision:`

  const response = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.3,
    max_tokens: 500,
  })

  const content = response.choices[0]?.message?.content?.trim()

  if (content) {
    try {
      const decision = JSON.parse(content)
      return {
        tools: decision.tools || [],
        reasoning: decision.reasoning || 'No reasoning provided',
      }
    } catch (error) {
      console.error('Failed to parse LLM tool decision:', error)

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const decision = JSON.parse(jsonMatch[0])
          return {
            tools: decision.tools || [],
            reasoning: decision.reasoning || 'No reasoning provided',
          }
        } catch (secondError) {
          console.error('Second JSON parse attempt failed:', secondError)
        }
      }

      // Heuristic fallback based on content analysis
      const tools = []
      const lowerContent = content.toLowerCase()

      if (
        lowerContent.includes('github') ||
        lowerContent.includes('repository') ||
        lowerContent.includes('repo')
      ) {
        tools.push({ tool: 'github_repos', params: {} })
      }
      if (
        lowerContent.includes('project') ||
        lowerContent.includes('work') ||
        lowerContent.includes('experience')
      ) {
        if (!tools.some((t) => t.tool === 'github_repos')) {
          tools.push({ tool: 'github_repos', params: {} })
        }
      }

      return {
        tools,
        reasoning: `Heuristic: ${lowerContent.includes('github') ? 'GitHub repositories query detected' : 'General project query detected'}`,
      }
    }
  }

  // Fallback to heuristic
  const queryLower = query.toLowerCase()

  // GitHub queries
  if (
    queryLower.includes('github') ||
    queryLower.includes('project') ||
    queryLower.includes('repo')
  ) {
    if (queryLower.includes('profile')) {
      return {
        tools: [{ tool: 'github_profile', params: {} }],
        reasoning: 'Heuristic: GitHub profile query detected',
      }
    }
    return {
      tools: [{ tool: 'github_repos', params: { limit: 6 } }],
      reasoning: 'Heuristic: GitHub repositories query detected',
    }
  }

  // LinkedIn queries
  if (
    queryLower.includes('linkedin') ||
    queryLower.includes('professional') ||
    queryLower.includes('work experience') ||
    queryLower.includes('career') ||
    queryLower.includes('certificates') ||
    queryLower.includes('certifications')
  ) {
    if (
      queryLower.includes('certificates') ||
      queryLower.includes('certifications') ||
      queryLower.includes('credentials')
    ) {
      return {
        tools: [{ tool: 'linkedin_certificates', params: {} }],
        reasoning: 'Heuristic: LinkedIn certificates query detected',
      }
    }
    if (queryLower.includes('experience') || queryLower.includes('work')) {
      return {
        tools: [{ tool: 'linkedin_experience', params: {} }],
        reasoning: 'Heuristic: LinkedIn experience query detected',
      }
    }
    if (queryLower.includes('skills') || queryLower.includes('endorsement')) {
      return {
        tools: [{ tool: 'linkedin_skills', params: {} }],
        reasoning: 'Heuristic: LinkedIn skills query detected',
      }
    }
    return {
      tools: [{ tool: 'linkedin_profile', params: {} }],
      reasoning: 'Heuristic: LinkedIn profile query detected',
    }
  }

  return {
    tools: [],
    reasoning: 'Heuristic: No external tools needed for this query',
  }
}

/**
 * LLM synthesizes final response using tool results
 */
async function synthesizeResponse(
  query: string,
  ragResults: any[],
  toolResults: Record<string, string>,
  conversationHistory: any[],
): Promise<string> {
  const toolContext = Object.entries(toolResults)
    .map(([tool, result]) => `${tool}: ${result}`)
    .join('\n\n')

  const ragContext =
    ragResults.length > 0
      ? ragResults
          .map((r) => r.data || r.metadata?.content)
          .filter(Boolean)
          .join('\n')
      : 'No additional context available'

  const prompt = `You are Sajal Basnet responding to a user query. You are speaking as yourself in first person (I, me, my, mine).

User Query: "${query}"

External Tool Results:
${toolContext || 'No external tools were used'}

Additional Context (RAG):
${ragContext}

Guidelines:
1. Always respond in first person - say "I have" not "you have"
2. You are Sajal Basnet, so speak as yourself about your own experience
3. Provide a natural, conversational response 
4. If tool results are available, prioritize that real data
5. Be specific and detailed when you have concrete information
6. Maintain a professional but friendly tone
7. If asked about projects, showcase your real GitHub data
8. Don't mention "tools" or "RAG" - just provide the information naturally

Response:`

  const response = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.4,
    max_tokens: 800,
  })

  return (
    response.choices[0]?.message?.content?.trim() ||
    "I'd be happy to help you with that. Could you please be more specific about what you'd like to know?"
  )
}

/**
 * Quick tool health check
 */
export async function checkToolHealth(): Promise<Record<string, boolean>> {
  const health: Record<string, boolean> = {}

  for (const [toolName, tool] of Object.entries(EXTERNAL_TOOLS)) {
    try {
      // Quick test execution
      if (toolName === 'github_profile' || toolName === 'linkedin_profile') {
        await tool.execute({})
        health[toolName] = true
      } else if (toolName === 'github_repos') {
        await tool.execute({ limit: 1 })
        health[toolName] = true
      } else if (toolName.startsWith('linkedin_')) {
        // LinkedIn tools are always available (using structured data)
        health[toolName] = true
      } else {
        health[toolName] = true // Assume healthy if no test needed
      }
    } catch (error) {
      health[toolName] = false
    }
  }

  return health
}
