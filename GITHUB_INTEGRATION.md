# GitHub Integration Setup

## Environment Variables

Add these to your `.env.local` file for enhanced GitHub integration:

```bash
# Optional: GitHub Personal Access Token for higher rate limits
# Generate at: https://github.com/settings/tokens
# Permissions needed: public_repo (for public repositories)
GITHUB_TOKEN=your_github_token_here

# Your GitHub username (already configured)
GITHUB_USERNAME=Sajal120
```

## Benefits of GitHub Token

With a GitHub token, you get:
- **Higher rate limits**: 5000 requests/hour vs 60 requests/hour
- **More detailed data**: Access to some additional repository information
- **Better reliability**: Reduced chance of rate limiting

## Without GitHub Token

The system works without a token but with limitations:
- **Lower rate limits**: 60 requests/hour per IP
- **Basic data only**: Public repository information only
- **May hit limits**: With multiple users testing

## Real Data Integration

Your RAG system now fetches real data from your GitHub profile:

### GitHub Profile Data
- Real repository count, followers, following
- Actual bio, location, company information
- Recent repository activity
- Programming languages used

### Repository Information
- Actual repository names and descriptions
- Real star counts, fork counts, and activity
- Programming language breakdown
- Most recent updates

### Recent Activity
- Recent commits and pushes
- Repository creation events
- Stars and forks received
- Pull request activity

## Testing

Test the real GitHub integration:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me your GitHub repositories",
    "enhancedMode": true,
    "sessionId": "github-test"
  }'
```

You should now see real data from https://github.com/Sajal120 instead of mock data!

## Fallback Behavior

If GitHub API is unavailable:
- Falls back to cached/mock data
- Shows helpful error messages
- Continues to provide basic responses
- Maintains system stability

## Rate Limits

- **Without token**: 60 requests/hour
- **With token**: 5000 requests/hour
- **Cached responses**: Reduces API calls
- **Smart batching**: Multiple data points per request