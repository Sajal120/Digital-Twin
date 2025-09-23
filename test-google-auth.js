// Test Google OAuth integration
async function testGoogleAuth() {
  try {
    console.log('Testing Google OAuth integration...')
    
    // Test 1: Check if NextAuth API routes are accessible
    console.log('\n1. Testing NextAuth API routes:')
    
    const authCheck = await fetch('http://localhost:3000/api/auth/providers')
    if (authCheck.ok) {
      const providers = await authCheck.json()
      console.log('✅ NextAuth providers endpoint accessible')
      console.log('Available providers:', Object.keys(providers))
      
      if (providers.google) {
        console.log('✅ Google provider configured')
      } else {
        console.log('❌ Google provider not found')
      }
    } else {
      console.log('❌ NextAuth providers endpoint not accessible')
    }
    
    // Test 2: Check Google OAuth route
    console.log('\n2. Testing custom Google OAuth route:')
    
    const googleRouteCheck = await fetch('http://localhost:3000/api/auth/google?action=session')
    if (googleRouteCheck.ok) {
      const sessionData = await googleRouteCheck.json()
      console.log('✅ Google OAuth route accessible')
      console.log('Session data:', sessionData)
    } else {
      console.log('❌ Google OAuth route not accessible')
    }
    
    // Test 3: Check if main page loads
    console.log('\n3. Testing main application page:')
    
    const mainPageCheck = await fetch('http://localhost:3000/')
    if (mainPageCheck.ok) {
      console.log('✅ Main application page loads successfully')
    } else {
      console.log('❌ Main application page failed to load')
    }
    
    console.log('\n🎉 Test completed! Check the results above.')
    console.log('\nTo test the full OAuth flow:')
    console.log('1. Visit http://localhost:3000 in your browser')
    console.log('2. Navigate to the chat section')
    console.log('3. Click "Sign in with Google"')
    console.log('4. Complete the OAuth flow')
    console.log('\nNote: Make sure to add http://localhost:3000/api/auth/callback/google to your Google Console redirect URIs')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

// Run the test
testGoogleAuth()