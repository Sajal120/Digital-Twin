// Test GitHub Integration in Chatbot
console.log('🧪 Testing GitHub Integration in Digital Twin Chatbot...\n')

const API_BASE = 'http://localhost:3000'

async function testGitHubInChatbot() {
  const tests = [
    {
      name: 'Basic GitHub repositories query',
      message: 'tell me your github repositories',
      expectKeywords: ['repositories', 'Digital-Twin', 'portfolio-app', 'github.com/Sajal120']
    },
    {
      name: 'GitHub profile query',
      message: 'Show me your GitHub profile',
      expectKeywords: ['GitHub profile', 'public repos', 'followers', 'github.com']
    },
    {
      name: 'Programming languages query',
      message: 'What programming languages do you use?',
      expectKeywords: ['programming languages', 'repositories', 'TypeScript', 'C#']
    },
    {
      name: 'Recent coding activity',
      message: 'Show me your recent GitHub activity',
      expectKeywords: ['GitHub activity', 'recent', 'commits', 'projects']
    },
    {
      name: 'Specific technology query',
      message: 'Show me your TypeScript projects',
      expectKeywords: ['TypeScript', 'projects', 'repositories']
    }
  ]

  let passedTests = 0
  let totalTests = tests.length

  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`)
    console.log(`📝 Query: "${test.message}"`)

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: test.message,
          enhancedMode: true
        }),
      })

      if (!response.ok) {
        console.log(`❌ API Error: ${response.status}`)
        const errorText = await response.text()
        console.log(`Error details: ${errorText}`)
        continue
      }

      const data = await response.json()
      const responseText = data.response || data.content || JSON.stringify(data)
      
      console.log(`💬 Response preview: "${responseText.substring(0, 150)}..."`)

      // Check if response contains expected keywords
      const foundKeywords = test.expectKeywords.filter(keyword => 
        responseText.toLowerCase().includes(keyword.toLowerCase())
      )

      if (foundKeywords.length > 0) {
        console.log(`✅ PASS - Found keywords: ${foundKeywords.join(', ')}`)
        passedTests++
      } else {
        console.log(`❌ FAIL - Missing expected keywords: ${test.expectKeywords.join(', ')}`)
        console.log(`🔍 Full response: ${responseText}`)
      }

    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`)
    }
  }

  console.log(`\n📊 TEST SUMMARY`)
  console.log(`================`)
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${passedTests}`)
  console.log(`Failed: ${totalTests - passedTests}`)
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)

  if (passedTests === totalTests) {
    console.log(`\n🎉 ALL TESTS PASSED! GitHub integration is working perfectly!`)
  } else if (passedTests > 0) {
    console.log(`\n⚠️  PARTIAL SUCCESS - GitHub integration is working but some queries may need improvement`)
  } else {
    console.log(`\n❌ ALL TESTS FAILED - GitHub integration may not be working properly`)
  }

  return { passed: passedTests, total: totalTests }
}

// Test direct GitHub API endpoints
async function testGitHubAPIEndpoints() {
  console.log(`\n🔧 Testing Direct GitHub API Endpoints...`)
  
  const endpoints = [
    {
      name: 'GitHub Profile',
      method: 'POST',
      url: `${API_BASE}/api/github`,
      body: { action: 'profile' }
    },
    {
      name: 'GitHub Repositories',
      method: 'POST', 
      url: `${API_BASE}/api/github`,
      body: { action: 'repositories', params: { limit: 3 } }
    },
    {
      name: 'OAuth URL Generation',
      method: 'GET',
      url: `${API_BASE}/api/github?action=oauth_url`
    }
  ]

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint.name}`)
    
    try {
      const options = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      }
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body)
      }

      const response = await fetch(endpoint.url, options)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${endpoint.name}: Working`)
        
        // Show some key data
        if (data.data && data.data.name) {
          console.log(`   📊 Profile: ${data.data.name} (${data.data.publicRepos || data.data.public_repos} repos)`)
        }
        if (data.data && Array.isArray(data.data)) {
          console.log(`   📊 Found ${data.data.length} repositories`)
        }
        if (data.oauth_url) {
          console.log(`   🔗 OAuth URL generated successfully`)
        }
      } else {
        console.log(`❌ ${endpoint.name}: Failed (${response.status})`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.message}`)
    }
  }
}

async function runAllTests() {
  console.log(`🚀 Starting GitHub Integration Tests for Digital Twin Chatbot`)
  console.log(`=============================================================\n`)
  
  // Test chatbot integration
  const chatResults = await testGitHubInChatbot()
  
  // Test direct API endpoints
  await testGitHubAPIEndpoints()
  
  console.log(`\n🏁 FINAL RESULTS`)
  console.log(`==================`)
  console.log(`✅ GitHub integration test completed`)
  console.log(`📊 Chat Integration: ${chatResults.passed}/${chatResults.total} tests passed`)
  
  if (chatResults.passed === chatResults.total) {
    console.log(`\n🎯 STATUS: GitHub integration is FULLY WORKING in your chatbot!`)
    console.log(`\n💡 Try asking your chatbot:`)
    console.log(`   • "Tell me your GitHub repositories"`)
    console.log(`   • "What programming languages do you use?"`) 
    console.log(`   • "Show me your recent GitHub activity"`)
    console.log(`   • "Tell me about your TypeScript projects"`)
  } else {
    console.log(`\n⚠️  STATUS: GitHub integration needs attention`)
  }
}

runAllTests().catch(console.error)