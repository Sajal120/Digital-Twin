#!/usr/bin/env node

// Test MCP server responses
const { spawn } = require('child_process')

console.log('Testing MCP server...')

const server = spawn('node', ['/Users/sajalbasnet/cms-twin-portfolio/mcp-server.cjs'], {
  stdio: ['pipe', 'pipe', 'pipe'],
})

let responses = []
let responseTimeout

server.stdout.on('data', (data) => {
  const lines = data
    .toString()
    .split('\n')
    .filter((line) => line.trim())
  lines.forEach((line) => {
    try {
      const response = JSON.parse(line)
      responses.push(response)
      console.log('✅ Valid JSON response:', JSON.stringify(response, null, 2))
    } catch (e) {
      console.log('❌ Invalid JSON:', line)
    }
  })
})

server.stderr.on('data', (data) => {
  console.log('Stderr output:', data.toString())
})

// Test 1: Initialize
console.log('Sending initialize request...')
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

// Test 2: Tools list
setTimeout(() => {
  console.log('Sending tools/list request...')
  const toolsRequest =
    JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    }) + '\n'
  server.stdin.write(toolsRequest)
}, 500)

// Clean up after 3 seconds
setTimeout(() => {
  console.log(`\n📊 Test completed. Received ${responses.length} responses.`)
  server.kill()
  process.exit(0)
}, 3000)
