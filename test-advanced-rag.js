#!/usr/bin/env node

/**
 * Advanced RAG Pattern Testing Script
 * ===================================
 * 
 * Tests all advanced RAG patterns with multi-language support and intelligent filtering
 */

import { createServer } from 'http';

const API_URL = 'http://localhost:3000/api/chat';

// Test cases for different RAG patterns and languages
const testCases = [
  // 1. Multi-language detection tests
  {
    name: "Spanish Query - Multi-hop RAG",
    message: "Cuéntame sobre tu experiencia en programación y tus proyectos recientes de IA",
    expectedPattern: "multi_hop",
    expectedLanguage: "es"
  },
  {
    name: "French Query - Technical Comparison",
    message: "Comparez votre expérience avec Python et JavaScript",
    expectedPattern: "hybrid_search",
    expectedLanguage: "fr"
  },
  {
    name: "German Query - Tool Enhanced",
    message: "Zeigen Sie mir Ihre aktuellen GitHub-Projekte",
    expectedPattern: "tool_enhanced",
    expectedLanguage: "de"
  },
  {
    name: "Hindi Query - Complex",
    message: "आपके एआई प्रोजेक्ट्स और तकनीकी अनुभव के बारे में बताएं",
    expectedPattern: "multi_hop",
    expectedLanguage: "hi"
  },
  {
    name: "Nepali Query - Professional",
    message: "तपाईंको काम अनुभव र सीप बारे भन्नुहोस्",
    expectedPattern: "standard_agentic",
    expectedLanguage: "ne"
  },
  
  // 2. Advanced RAG pattern tests
  {
    name: "Advanced Agentic RAG - Follow-up",
    message: "Tell me more about that AI project you mentioned",
    expectedPattern: "advanced_agentic",
    conversationHistory: [
      { role: "user", content: "What AI projects have you worked on?" },
      { role: "assistant", content: "I've been working on an AI-powered portfolio chatbot..." }
    ]
  },
  {
    name: "Multi-hop RAG - Complex Question",
    message: "What programming languages do you know and can you show me examples from your recent projects and explain your experience at Aubot?",
    expectedPattern: "multi_hop"
  },
  {
    name: "Hybrid Search RAG - Technical Comparison",
    message: "Compare your Python vs Java experience and tell me which frameworks you prefer",
    expectedPattern: "hybrid_search"
  },
  {
    name: "Tool-Enhanced RAG - External Data",
    message: "What are your most recent GitHub commits and repository updates?",
    expectedPattern: "tool_enhanced"
  },
  
  // 3. Smart filtering tests
  {
    name: "Technical Query with Filtering",
    message: "Full-stack development experience with React and Node.js",
    expectedPattern: "hybrid_search"
  },
  {
    name: "Career and Experience Query",
    message: "Tell me about your professional background and career progression",
    expectedPattern: "multi_hop"
  }
];

/**
 * Execute test case
 */
async function runTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`📝 Message: "${testCase.message}"`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testCase.message,
        conversationHistory: testCase.conversationHistory || [],
        enhancedMode: true,
        sessionId: `test-${Date.now()}`
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check results
    const results = {
      ✅: [],
      ❌: [],
      ℹ️: []
    };

    // Check RAG pattern
    if (testCase.expectedPattern) {
      if (data.metadata?.ragPattern === testCase.expectedPattern) {
        results.✅.push(`RAG Pattern: ${data.metadata.ragPattern}`);
      } else {
        results.❌.push(`RAG Pattern: Expected '${testCase.expectedPattern}', got '${data.metadata?.ragPattern}'`);
      }
    } else {
      results.ℹ️.push(`RAG Pattern: ${data.metadata?.ragPattern}`);
    }

    // Check language detection
    if (testCase.expectedLanguage) {
      if (data.metadata?.language?.detected === testCase.expectedLanguage) {
        results.✅.push(`Language: ${data.metadata.language.detected}`);
      } else {
        results.❌.push(`Language: Expected '${testCase.expectedLanguage}', got '${data.metadata?.language?.detected}'`);
      }
    } else {
      results.ℹ️.push(`Language: ${data.metadata?.language?.detected || 'en'}`);
    }

    // Additional metadata checks
    if (data.metadata?.resultsFound > 0) {
      results.✅.push(`Results Found: ${data.metadata.resultsFound}`);
    }

    if (data.metadata?.language?.translationUsed) {
      results.ℹ️.push(`Translation Used: ${data.metadata.language.translationUsed}`);
    }

    if (data.metadata?.language?.crossLanguageSearch) {
      results.ℹ️.push(`Cross-language Search: ${data.metadata.language.crossLanguageSearch}`);
    }

    // Display results
    Object.entries(results).forEach(([symbol, items]) => {
      items.forEach(item => console.log(`${symbol} ${item}`));
    });

    // Show response preview
    const preview = data.response.substring(0, 200);
    console.log(`💬 Response Preview: "${preview}${data.response.length > 200 ? '...' : ''}"`);

    return {
      success: results.❌.length === 0,
      metadata: data.metadata
    };

  } catch (error) {
    console.log(`❌ Test Failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Advanced RAG Pattern Testing Suite');
  console.log('=====================================\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log(`🎯 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your advanced RAG system is working perfectly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

/**
 * Check if server is running
 */
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ping', enhancedMode: true })
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server not running! Please start your Next.js dev server:');
    console.log('   npm run dev');
    console.log('   pnpm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running, starting tests...\n');
  await runAllTests();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runAllTests, runTest, testCases };