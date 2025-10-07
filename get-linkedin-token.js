#!/usr/bin/env node

/**
 * LinkedIn Personal Access Token Generator
 * =========================================
 *
 * This script helps you get your personal LinkedIn access token
 * to fetch your own profile data for your portfolio.
 *
 * Run: node get-linkedin-token.js
 */

const readline = require('readline')
const https = require('https')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) })
        } catch (e) {
          resolve({ status: res.statusCode, data: data })
        }
      })
    })

    req.on('error', reject)
    if (postData) req.write(postData)
    req.end()
  })
}

async function main() {
  console.log('\n=== LinkedIn Personal Access Token Setup ===\n')

  // Get credentials
  const clientId = await question('Enter your LINKEDIN_CLIENT_ID: ')
  const clientSecret = await question('Enter your LINKEDIN_CLIENT_SECRET: ')
  const redirectUri =
    (await question(
      'Enter redirect URI (default: http://localhost:3000/api/auth/linkedin/callback): ',
    )) || 'http://localhost:3000/api/auth/linkedin/callback'

  // Generate authorization URL
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email%20r_basicprofile`

  console.log('\n📋 Step 1: Visit this URL in your browser:\n')
  console.log(authUrl)
  console.log('\n')

  const authCode = await question(
    'After authorizing, paste the "code" parameter from the redirect URL: ',
  )

  console.log('\n⏳ Exchanging authorization code for access token...\n')

  // Exchange code for token
  const postData = new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode.trim(),
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    redirect_uri: redirectUri.trim(),
  }).toString()

  try {
    const response = await makeRequest(
      {
        hostname: 'www.linkedin.com',
        path: '/oauth/v2/accessToken',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      postData,
    )

    if (response.status === 200 && response.data.access_token) {
      console.log('✅ Success! Your LinkedIn access token:\n')
      console.log(response.data.access_token)
      console.log('\n📝 Add this to your Vercel environment variables:')
      console.log(`LINKEDIN_PERSONAL_ACCESS_TOKEN=${response.data.access_token}`)
      console.log('\n⚠️  Note: This token expires in', response.data.expires_in, 'seconds')
      console.log('You may need to regenerate it periodically.\n')
    } else {
      console.error('❌ Error:', response.data)
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }

  rl.close()
}

main().catch(console.error)
