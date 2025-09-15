#!/bin/bash

# Start MCP Bridge for Digital Twin
# This script ensures the Next.js server is running before starting the bridge

# Check if Next.js server is running
if ! curl -s http://localhost:3000/api/mcp > /dev/null; then
    echo "Error: Next.js server not running on localhost:3000"
    echo "Please start the server with: pnpm dev"
    exit 1
fi

echo "Next.js server is running, starting MCP bridge..."

# Start mcp-remote bridge
npx -y mcp-remote http://localhost:3000/api/mcp