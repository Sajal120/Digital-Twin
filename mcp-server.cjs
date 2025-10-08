#!/usr/bin/env node

/**
 * Direct MCP Server for Claude Desktop
 * This server communicates directly with Claude Desktop via STDIO
 * and proxies requests to the Next.js MCP endpoint
 */

const http = require('http')
const https = require('https')

class MCPServer {
  constructor() {
    this.requestId = 0
    this.serverUrl = process.env.MCP_SERVER_URL || 'http://localhost:3000'
    this.isHttps = this.serverUrl.startsWith('https')
  }

  // Send JSON-RPC response
  sendResponse(id, result, error = null) {
    const response = {
      jsonrpc: '2.0',
      id,
      ...(error ? { error } : { result }),
    }
    process.stdout.write(JSON.stringify(response) + '\n')
  }

  // Check if Next.js server is running
  async checkServer() {
    return new Promise((resolve) => {
      const client = this.isHttps ? https : http
      const url = `${this.serverUrl}/api/mcp`
      const req = client.get(url, (res) => {
        resolve(true)
      })
      req.on('error', () => resolve(false))
      req.setTimeout(5000, () => {
        req.destroy()
        resolve(false)
      })
    })
  }

  // Proxy request to Next.js MCP endpoint
  async proxyToNextJS(method, params = {}) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        jsonrpc: '2.0',
        id: ++this.requestId,
        method,
        params,
      })

      const urlObj = new URL(this.serverUrl)
      const client = this.isHttps ? https : http

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (this.isHttps ? 443 : 80),
        path: '/api/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 30000, // 30 second timeout for AI processing
      }

      const req = client.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            const response = JSON.parse(data)
            // Check for errors in the response
            if (response.error) {
              reject(new Error(response.error.message || 'API returned an error'))
            } else {
              resolve(response.result || response)
            }
          } catch (error) {
            reject(
              new Error(
                `Failed to parse response: ${error.message}. Data: ${data.substring(0, 200)}`,
              ),
            )
          }
        })
      })

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`))
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout - server took too long to respond'))
      })

      req.write(postData)
      req.end()
    })
  }

  // Handle incoming MCP requests
  async handleRequest(request) {
    const { id, method, params } = request

    // Validate that we have required fields
    if (typeof id === 'undefined' || !method) {
      return // Ignore malformed requests silently
    }

    try {
      // Handle different MCP methods
      switch (method) {
        case 'initialize':
          // Always return initialize immediately - don't check Next.js server yet
          this.sendResponse(id, {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'portfolio-digital-twin-mcp',
              version: '1.0.0',
            },
          })
          break

        case 'tools/list':
          // Return tools list immediately - check server only when tools are called
          this.sendResponse(id, {
            tools: [
              {
                name: 'ask_digital_twin',
                description:
                  'Ask questions about professional background, skills, experience, and career goals using the existing portfolio chatbot',
                inputSchema: {
                  type: 'object',
                  properties: {
                    question: {
                      type: 'string',
                      description: 'Your question about the professional background',
                      minLength: 1,
                    },
                    maxResults: {
                      type: 'number',
                      description: 'Maximum number of knowledge sources to retrieve (1-10)',
                      minimum: 1,
                      maximum: 10,
                      default: 3,
                    },
                  },
                  required: ['question'],
                },
              },
            ],
          })
          break

        case 'tools/call':
          // Check server availability before calling tools
          const serverRunning = await this.checkServer()
          if (!serverRunning) {
            this.sendResponse(id, null, {
              code: -32603,
              message: `MCP server not reachable at ${this.serverUrl}. Please check the server is running.`,
            })
            return
          }

          try {
            const callResult = await this.proxyToNextJS('tools/call', params)
            this.sendResponse(id, callResult)
          } catch (error) {
            this.sendResponse(id, null, {
              code: -32603,
              message: `Failed to execute tool: ${error.message}`,
            })
          }
          break

        default:
          this.sendResponse(id, null, {
            code: -32601,
            message: `Method not found: ${method}`,
          })
      }
    } catch (error) {
      // Only send error response if we have a valid id
      if (typeof id !== 'undefined') {
        this.sendResponse(id, null, {
          code: -32603,
          message: error.message,
        })
      }
    }
  }

  // Start the server
  start() {
    // Remove debug logging to avoid interfering with Claude Desktop
    // console.error('Digital Twin MCP Server starting...')

    let buffer = ''

    process.stdin.on('data', (chunk) => {
      buffer += chunk.toString()

      // Process complete JSON-RPC messages
      let newlineIndex
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)

        if (line) {
          try {
            const request = JSON.parse(line)
            this.handleRequest(request)
          } catch (error) {
            // Silent error handling - don't output to console as it interferes with MCP
            // console.error('Failed to parse request:', error.message)
          }
        }
      }
    })

    process.stdin.on('end', () => {
      // console.error('MCP Server shutting down...')
      process.exit(0)
    })

    // Handle process termination
    process.on('SIGINT', () => {
      // console.error('MCP Server interrupted')
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      // console.error('MCP Server terminated')
      process.exit(0)
    })

    // console.error('Digital Twin MCP Server ready')
  }
}

// Start the server
const server = new MCPServer()
server.start()
