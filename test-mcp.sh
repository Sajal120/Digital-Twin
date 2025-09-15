#!/bin/bash

# Test script for MCP server
echo "Testing MCP server..."

# Start MCP server in background
node /Users/sajalbasnet/cms-twin-portfolio/mcp-server.cjs &
MCP_PID=$!

# Give it time to start
sleep 1

# Send test request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | nc localhost 8080 || echo "Failed to connect"

# Clean up
kill $MCP_PID 2>/dev/null