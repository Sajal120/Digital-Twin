import { NextRequest, NextResponse } from 'next/server'

// MCP tool definitions - Enhanced with interview context support
const digitalTwinTools = [
  {
    name: 'ask_digital_twin',
    description:
      'Ask questions about professional background, skills, experience, and career goals using the enhanced AI-powered portfolio chatbot with interview-ready responses',
    inputSchema: {
      type: 'object' as const,
      properties: {
        question: {
          type: 'string' as const,
          description: 'Your question about the professional background',
          minLength: 1,
        },
        maxResults: {
          type: 'number' as const,
          description: 'Maximum number of knowledge sources to retrieve (1-10)',
          minimum: 1,
          maximum: 10,
          default: 3,
        },
        interviewType: {
          type: 'string' as const,
          description: 'Interview context for optimized responses',
          enum: ['technical', 'behavioral', 'executive', 'general'],
          default: 'general',
        },
        enhancedMode: {
          type: 'boolean' as const,
          description: 'Use LLM-enhanced RAG for interview-ready responses',
          default: true,
        },
      },
      required: ['question'],
    },
  },
  {
    name: 'compare_rag_approaches',
    description:
      'Compare basic RAG vs LLM-enhanced RAG responses to evaluate improvement in interview readiness and response quality',
    inputSchema: {
      type: 'object' as const,
      properties: {
        question: {
          type: 'string' as const,
          description: 'Question to compare across both RAG approaches',
          minLength: 1,
        },
        interviewType: {
          type: 'string' as const,
          description: 'Interview context for comparison',
          enum: ['technical', 'behavioral', 'executive', 'general'],
          default: 'general',
        },
        includeAnalysis: {
          type: 'boolean' as const,
          description: 'Include improvement analysis in the comparison',
          default: true,
        },
      },
      required: ['question'],
    },
  },
] as const

// Handle digital twin tool calls with enhanced RAG support
async function handleDigitalTwinTool(toolName: string, parameters: any) {
  console.log(`🔧 Handling MCP tool: ${toolName} with parameters:`, parameters)

  if (toolName === 'ask_digital_twin') {
    try {
      const {
        question,
        maxResults = 3,
        interviewType = 'general',
        enhancedMode = true,
      } = parameters

      if (!question) {
        throw new Error('Question is required')
      }

      console.log(`🎯 Processing question for ${interviewType} interview context`)

      // Call enhanced chat API
      const chatResponse = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: question,
            conversationHistory: [],
            interviewType,
            enhancedMode,
          }),
        },
      )

      if (!chatResponse.ok) {
        throw new Error(`Chat API error: ${chatResponse.status}`)
      }

      const data = await chatResponse.json()
      const response = data.response || data.content || "I couldn't generate a response."

      // Enhanced response with metadata
      const responseText =
        enhancedMode && data.enhanced
          ? `**Enhanced Interview Response** (${interviewType} context):\n\n${response}\n\n---\n**Query Enhancement**: "${data.metadata?.enhancedQuery}"\n**Processing Mode**: ${data.enhanced ? 'LLM-Enhanced RAG' : 'Basic RAG'}`
          : response

      return {
        content: [
          {
            type: 'text' as const,
            text: responseText,
          },
        ],
        isError: false,
      }
    } catch (error) {
      console.error('Digital twin tool error:', error)
      return {
        content: [
          {
            type: 'text' as const,
            text:
              error instanceof Error
                ? `Sorry, I encountered an error: ${error.message}`
                : 'Sorry, I encountered an unexpected error.',
          },
        ],
        isError: true,
      }
    }
  }

  if (toolName === 'compare_rag_approaches') {
    try {
      const { question, interviewType = 'general', includeAnalysis = true } = parameters

      if (!question) {
        throw new Error('Question is required for comparison')
      }

      console.log(`📊 Comparing RAG approaches for: "${question}"`)

      // Call comparison API
      const comparisonResponse = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/rag-compare`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question,
            interviewType,
            includeAnalysis,
          }),
        },
      )

      if (!comparisonResponse.ok) {
        throw new Error(`Comparison API error: ${comparisonResponse.status}`)
      }

      const comparisonData = await comparisonResponse.json()

      // Format comparison results
      const formattedComparison = `
**RAG Approach Comparison**
Question: "${comparisonData.question}"
Interview Context: ${interviewType}

**📝 Basic RAG Response** (${comparisonData.results.basic.processingTime}ms):
${comparisonData.results.basic.response}

**✨ Enhanced RAG Response** (${comparisonData.results.enhanced.processingTime}ms):
${comparisonData.results.enhanced.response}

**🎯 Enhanced Query**: "${comparisonData.results.enhanced.enhancedQuery}"

**📈 Improvement Analysis**:
• Response Length: ${comparisonData.improvement_indicators.response_length_increase}
• Specificity: ${comparisonData.improvement_indicators.specificity_improvement ? '✅ Improved' : '❌ No improvement'}
• Interview Readiness: ${comparisonData.improvement_indicators.interview_readiness ? '✅ Interview-ready' : '❌ Basic'}
• Professional Structure: ${comparisonData.improvement_indicators.structure_improvement ? '✅ Professional tone' : '❌ Basic response'}

**⚡ Total Comparison Time**: ${comparisonData.totalComparisonTime}ms
      `

      return {
        content: [
          {
            type: 'text' as const,
            text: formattedComparison,
          },
        ],
        isError: false,
      }
    } catch (error) {
      console.error('Comparison tool error:', error)
      return {
        content: [
          {
            type: 'text' as const,
            text:
              error instanceof Error
                ? `Sorry, comparison failed: ${error.message}`
                : 'Sorry, I encountered an error during comparison.',
          },
        ],
        isError: true,
      }
    }
  }

  throw new Error(`Unknown tool: ${toolName}`)
}

// MCP Protocol Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('MCP Request:', body.method)

    switch (body.method) {
      case 'initialize':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'portfolio-digital-twin-mcp',
              version: '1.0.0',
            },
          },
        })

      case 'tools/list':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            tools: digitalTwinTools,
          },
        })

      case 'tools/call':
        const { name: toolName, arguments: parameters } = body.params
        console.log(`🔧 MCP Tool called: ${toolName}`)

        try {
          const result = await handleDigitalTwinTool(toolName, parameters)
          return NextResponse.json({
            jsonrpc: '2.0',
            id: body.id,
            result,
          })
        } catch (error) {
          console.error('MCP tool execution error:', error)
          return NextResponse.json({
            jsonrpc: '2.0',
            id: body.id,
            error: {
              code: -32603,
              message: error instanceof Error ? error.message : 'Tool execution failed',
            },
          })
        }

      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          error: {
            code: -32601,
            message: `Method not found: ${body.method}`,
          },
        })
    }
  } catch (error) {
    console.error('MCP handler error:', error)
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error',
      },
    })
  }
}

// Handle GET requests for basic info
export async function GET() {
  return NextResponse.json({
    name: 'portfolio-digital-twin-mcp',
    version: '1.0.0',
    description:
      'A Digital Twin MCP server that answers questions about professional background using the existing portfolio chatbot',
    tools: digitalTwinTools,
    status: 'ready',
  })
}
