# LinkedIn API Token Setup

## How It Works

Your portfolio fetches YOUR LinkedIn profile data to show to visitors. This requires:
1. You authenticate once with LinkedIn to get your personal access token
2. Store the token in Vercel environment variables
3. The app uses your token to fetch your profile data for all visitors

This is similar to how GitHub works - it fetches YOUR repos using your username.

## Quick Setup (Automated)

Run the helper script:

```bash
node get-linkedin-token.js
```

Follow the prompts to get your token.

## Manual Setup

### Step 1: Get Authorization Code

Visit this URL (replace `YOUR_CLIENT_ID`):

```
https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/api/auth/linkedin/callback&scope=openid%20profile%20email%20r_basicprofile
```

After authorizing, you'll be redirected to:
```
http://localhost:3000/api/auth/linkedin/callback?code=AUTHORIZATION_CODE&state=...
```

Copy the `code` parameter.

### Step 2: Exchange Code for Token

```bash
curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_AUTHORIZATION_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=http://localhost:3000/api/auth/linkedin/callback"
```

### Step 3: Add Token to Vercel

Add this environment variable in Vercel:

```
LINKEDIN_PERSONAL_ACCESS_TOKEN=your_token_here
```

Also add locally to `.env.local`:

```bash
LINKEDIN_PERSONAL_ACCESS_TOKEN=your_token_here
```

## Testing

After setup, users who sign in with Google can ask:
- "What are your LinkedIn certificates?"
- "Tell me about your work experience"
- "Show me your professional background"

The chat will fetch your REAL LinkedIn data!

## Note on Token Expiration

LinkedIn access tokens expire after 60 days. You'll need to regenerate periodically. Consider:
1. Setting a reminder to refresh every 2 months
2. OR using the static fallback data (which is always available)
