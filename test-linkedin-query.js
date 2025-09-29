// Test LinkedIn Integration
const { generateLinkedInEnhancedResponse, isLinkedInQuery } = require('./src/lib/linkedin-integration.ts');

async function testLinkedInQuery() {
  const testQueries = [
    "how many connections you have in linkedin",
    "how many connections do I have",
    "tell me about your linkedin connections",
    "what's your linkedin profile"
  ];

  for (const query of testQueries) {
    console.log(`\n=== Testing Query: "${query}" ===`);
    console.log(`Is LinkedIn Query: ${isLinkedInQuery(query)}`);
    
    if (isLinkedInQuery(query)) {
      try {
        const response = await generateLinkedInEnhancedResponse(query);
        console.log("Response:");
        console.log(response);
      } catch (error) {
        console.error("Error:", error);
      }
    }
  }
}

testLinkedInQuery();