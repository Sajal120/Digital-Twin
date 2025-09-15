import { NextRequest, NextResponse } from 'next/server'

// MCP tool definitions
const digitalTwinTools = [
  {
    name: 'ask_digital_twin',
    description:
      'Ask questions about professional background, skills, experience, and career goals using the existing portfolio chatbot',
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
      },
      required: ['question'],
    },
  },
] as const

// Handle digital twin tool calls by proxying to existing chat API
async function handleDigitalTwinTool(toolName: string, parameters: any) {
  if (toolName !== 'ask_digital_twin') {
    throw new Error(`Unknown tool: ${toolName}`)
  }

  try {
    const question = parameters.question
    if (!question) {
      throw new Error('Question is required')
    }

    // Call your existing chat API
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
        }),
      },
    )

    if (!chatResponse.ok) {
      throw new Error(`Chat API error: ${chatResponse.status}`)
    }

    const data = await chatResponse.json()
    const response = data.response || data.content || "I couldn't generate a response."

    return {
      content: [
        {
          type: 'text' as const,
          text: response,
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
