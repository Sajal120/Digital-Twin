// Test GitHub OAuth integration
console.log('🧪 Testing GitHub Integration...')

async function testGitHubOAuth() {
  try {
    // Test 1: Get OAuth URL
    console.log('\n1. Testing OAuth URL generation...')
    const oauthResponse = await fetch('http://localhost:3000/api/github?action=oauth_url')
    if (oauthResponse.ok) {
      const data = await oauthResponse.json()
      console.log('✅ OAuth URL generated:', data.oauth_url)
    } else {
      console.log('❌ OAuth URL failed:', oauthResponse.status)
    }

    // Test 2: Test public GitHub profile access (no auth needed)
    console.log('\n2. Testing public GitHub profile access...')
    const profileResponse = await fetch('http://localhost:3000/api/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'profile'
      })
    })
    
    if (profileResponse.ok) {
      const data = await profileResponse.json()
      console.log('✅ Public profile data:', JSON.stringify(data, null, 2))
    } else {
      console.log('❌ Profile fetch failed:', profileResponse.status)
      const error = await profileResponse.text()
      console.log('Error:', error)
    }

    // Test 3: Test GitHub repositories (public)
    console.log('\n3. Testing public repositories...')
    const reposResponse = await fetch('http://localhost:3000/api/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'repositories',
        params: { limit: 3 }
      })
    })
    
    if (reposResponse.ok) {
      const data = await reposResponse.json()
      console.log('✅ Repository data:', JSON.stringify(data, null, 2))
    } else {
      console.log('❌ Repositories fetch failed:', reposResponse.status)
      const error = await reposResponse.text()
      console.log('Error:', error)
    }

    // Test 4: Test chat integration with GitHub query
    console.log('\n4. Testing chat integration...')
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me your GitHub profile',
        enhancedMode: true
      })
    })
    
    if (chatResponse.ok) {
      const data = await chatResponse.json()
      console.log('✅ Chat response:', data.response || data)
    } else {
      console.log('❌ Chat integration failed:', chatResponse.status)
      const error = await chatResponse.text()
      console.log('Error:', error)
    }

    console.log('\n🎉 GitHub integration tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testGitHubOAuth()