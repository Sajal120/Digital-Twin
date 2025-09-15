#!/usr/bin/env node

// Simple test of MCP server
const { spawn } = require('child_process')

const server = spawn('node', ['/Users/sajalbasnet/cms-twin-portfolio/mcp-server.cjs'], {
  stdio: ['pipe', 'pipe', 'pipe'],
})

// Test tools/list
const request =
  JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  }) + '\n'

server.stdin.write(request)
server.stdin.end()

server.stdout.on('data', (data) => {
  console.log('Response:', data.toString())
})

server.stderr.on('data', (data) => {
  console.log('Stderr:', data.toString())
})

// Kill after 2 seconds
setTimeout(() => {
  server.kill()
}, 2000)
