// Simple client for the Chat API
// This demonstrates how to interact with the /api/chat endpoint

interface Message {
  id: number
  user_id: string | null
  role: 'system' | 'user' | 'assistant'
  content: string
  created_at: string
}

interface ChatResponse {
  success: boolean
  message: Message
  context: Message[]
  total: number
}

interface MessagesResponse {
  success: boolean
  messages: Message[]
  total: number
}

export class ChatClient {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  /**
   * Send a new chat message and get context
   */
  async sendMessage(data: {
    user_id?: string
    role: 'system' | 'user' | 'assistant'
    content: string
  }): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * Get recent messages
   */
  async getMessages(
    options: {
      user_id?: string
      limit?: number
    } = {},
  ): Promise<MessagesResponse> {
    const params = new URLSearchParams()

    if (options.user_id) params.append('user_id', options.user_id)
    if (options.limit) params.append('limit', options.limit.toString())

    const response = await fetch(`${this.baseUrl}/api/chat?${params}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }
}

// Example usage:
export async function exampleUsage() {
  const chatClient = new ChatClient()

  try {
    // Send a user message
    const userResponse = await chatClient.sendMessage({
      user_id: 'user123',
      role: 'user',
      content: 'Hello, how are you today?',
    })

    console.log('User message saved:', userResponse.message)
    console.log('Context messages:', userResponse.context)

    // Send an assistant response
    const assistantResponse = await chatClient.sendMessage({
      user_id: 'user123',
      role: 'assistant',
      content: 'Hello! I am doing well, thank you for asking. How can I help you today?',
    })

    console.log('Assistant message saved:', assistantResponse.message)

    // Get recent messages
    const recentMessages = await chatClient.getMessages({
      user_id: 'user123',
      limit: 10,
    })

    console.log('Recent messages:', recentMessages.messages)
  } catch (error) {
    console.error('Chat API error:', error)
  }
}
