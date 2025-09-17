# Stack Auth Removal Guide

## Problem
Your application has Stack Auth environment variables configured but Stack Auth is not actually implemented, causing WebSocket connection failures to Knock.app API.

## Status: ✅ Local .env updated - Stack Auth variables commented out

## Solution: Remove Stack Auth Environment Variables

### In Vercel Dashboard:
1. Go to your project in Vercel Dashboard
2. Navigate to Settings > Environment Variables
3. Remove these variables:
   - `NEXT_PUBLIC_STACK_PROJECT_ID`
   - `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
   - `STACK_SECRET_SERVER_KEY`

### In Local Environment:
Remove or comment out these lines from your `.env` file:
```
# NEXT_PUBLIC_STACK_PROJECT_ID=6dc689d7-d3ef-4bc6-95e9-509303edc675
# NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_4vmrgtj2krhaggs65xk9ze3cz43b6azjf8gbcn59szwkr  
# STACK_SECRET_SERVER_KEY=ssk_y2b2ggjf4qkt160h99bzqjn5d2e6bv590wgcma96b9qfg
```

### Redeploy
After removing the environment variables:
1. Trigger a new deployment in Vercel
2. The WebSocket errors should disappear

## Why This Fixes It
Stack Auth internally uses Knock.app for notifications. When the environment variables are present, the browser tries to establish WebSocket connections to Knock, but since Stack Auth isn't actually initialized in your app, these connections fail repeatedly.