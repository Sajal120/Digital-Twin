#!/bin/bash
# Auto-accept database schema prompts and start the dev server

echo "Starting development server with automatic schema push..."

# Start the dev server and automatically respond to prompts
(
  sleep 5  # Wait for server to start
  # Send "yes" responses to any prompts about table creation
  for i in {1..10}; do
    echo "yes"
    sleep 2
  done
) | pnpm dev