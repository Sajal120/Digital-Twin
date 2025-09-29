/**
 * Simple RAG Pattern Test
 * =======================
 * 
 * Tests the enhanced RAG patterns with multi-language support
 */

const testAdvancedRAG = async () => {
  const testCases = [
    {
      name: "Spanish Multi-hop Query",
      message: "Cuéntame sobre tu experiencia en programación y proyectos de IA",
      expectedPattern: "multi_hop"
    },
    {
      name: "English Technical Comparison", 
      message: "Compare your Python vs Java experience",
      expectedPattern: "hybrid_search"
    },
    {
      name: "Complex English Query",
      message: "Tell me about your AI projects and recent GitHub contributions",
      expectedPattern: "multi_hop"
    }
  ];

  console.log('🚀 Testing Advanced RAG Patterns');
  console.log('=================================\n');

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Message: "${testCase.message}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testCase.message,
          enhancedMode: true,
          sessionId: `test-${Date.now()}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Pattern Used: ${data.metadata?.ragPattern}`);
        console.log(`🌍 Language: ${data.metadata?.language?.detected || 'en'}`);
        console.log(`📊 Results: ${data.metadata?.resultsFound || 0}`);
        console.log(`💬 Response: "${data.response.substring(0, 100)}..."`);
      } else {
        console.log('❌ Request failed:', response.status);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    console.log('---\n');
  }
};

// Check if server is running first
const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ping', enhancedMode: true })
    });
    return response.ok;
  } catch {
    return false;
  }
};

const main = async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server not running! Please start: npm run dev');
    return;
  }
  
  console.log('✅ Server detected, running tests...\n');
  await testAdvancedRAG();
};

main().catch(console.error);