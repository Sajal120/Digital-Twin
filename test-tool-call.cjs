#!/usr/bin/env node

// Test tool call functionality
const { spawn } = require('child_process')

console.log('Testing tool call with and without Next.js server...')

const server = spawn('node', ['/Users/sajalbasnet/cms-twin-portfolio/mcp-server.cjs'], {
  stdio: ['pipe', 'pipe', 'pipe'],
})

let responses = []

server.stdout.on('data', (data) => {
  const lines = data
    .toString()
    .split('\n')
    .filter((line) => line.trim())
  lines.forEach((line) => {
    try {
      const response = JSON.parse(line)
      responses.push(response)

      if (response.error) {
        console.log('❌ Error response:', JSON.stringify(response.error, null, 2))
      } else {
        console.log('✅ Success response ID:', response.id)
      }
    } catch (e) {
      console.log('❌ Invalid JSON:', line)
    }
  })
})

// Test tool call
console.log('Sending tools/call request...')
const toolCallRequest =
  JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'ask_digital_twin',
      arguments: {
        question: 'What are the key skills?',
      },
    },
  }) + '\n'

server.stdin.write(toolCallRequest)

// Clean up after 5 seconds
setTimeout(() => {
  console.log(`\n📊 Test completed. Received ${responses.length} responses.`)
  server.kill()
  process.exit(0)
}, 5000)
