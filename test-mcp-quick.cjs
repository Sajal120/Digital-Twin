#!/usr/bin/env node

// Quick test of MCP server
const { spawn } = require('child_process')

const server = spawn('node', ['/Users/sajalbasnet/cms-twin-portfolio/mcp-server.cjs'], {
  stdio: ['pipe', 'pipe', 'pipe'],
})

// Test initialize
const initRequest =
  JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0' },
    },
  }) + '\n'

server.stdin.write(initRequest)

// Test tools/list
const toolsRequest =
  JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  }) + '\n'

setTimeout(() => {
  server.stdin.write(toolsRequest)
}, 100)

let responseBuffer = ''
server.stdout.on('data', (data) => {
  responseBuffer += data.toString()
  const lines = responseBuffer.split('\n')

  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim()) {
      try {
        const response = JSON.parse(lines[i])
        console.log('Response:', JSON.stringify(response, null, 2))
      } catch (e) {
        console.log('Raw response:', lines[i])
      }
    }
  }
  responseBuffer = lines[lines.length - 1]
})

server.stderr.on('data', (data) => {
  console.error('Server stderr:', data.toString())
})

// Clean up after 3 seconds
setTimeout(() => {
  server.kill()
  process.exit(0)
}, 3000)
