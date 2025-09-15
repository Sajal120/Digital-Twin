#!/usr/bin/env node

const { spawn } = require('child_process')
const http = require('http')

// Check if Next.js server is running
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/api/mcp', (res) => {
      resolve(true)
    })
    req.on('error', () => {
      resolve(false)
    })
    req.setTimeout(5000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function startBridge() {
  const serverRunning = await checkServer()

  if (!serverRunning) {
    console.error('Error: Next.js server not running on localhost:3000')
    console.error('Please start the server with: pnpm dev')
    process.exit(1)
  }

  console.log('Next.js server is running, starting MCP bridge...')

  // Start mcp-remote bridge
  const bridge = spawn('npx', ['-y', 'mcp-remote', 'http://localhost:3000/api/mcp'], {
    stdio: 'inherit',
  })

  bridge.on('close', (code) => {
    console.log(`MCP bridge exited with code ${code}`)
    process.exit(code)
  })

  bridge.on('error', (err) => {
    console.error('Failed to start MCP bridge:', err)
    process.exit(1)
  })
}

startBridge()
