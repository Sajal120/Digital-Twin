/**
 * Test Spanish Query Without Quotes
 */

const testSpanishQuery = async () => {
  try {
    console.log('🧪 Testing Spanish query for quote removal...\n');
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Cuéntame sobre tu experiencia en programación y tus proyectos de IA',
        enhancedMode: true,
        sessionId: `test-spanish-${Date.now()}`
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Response received:');
    console.log(`🌍 Language detected: ${data.metadata?.language?.detected}`);
    console.log(`🔄 Translation used: ${data.metadata?.language?.translationUsed}`);
    console.log(`🎯 RAG pattern: ${data.metadata?.ragPattern}`);
    console.log(`📊 Results found: ${data.metadata?.resultsFound}`);
    
    console.log('\n💬 Response content:');
    console.log(data.response);
    
    // Check for quotes
    const hasQuotes = /^["']|["']$/.test(data.response) || 
                     /^".*"$/.test(data.response) || 
                     /^'.*'$/.test(data.response);
                     
    if (hasQuotes) {
      console.log('\n❌ WARNING: Response still contains quotation marks!');
    } else {
      console.log('\n✅ SUCCESS: No quotation marks found in response!');
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
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
  
  console.log('✅ Server detected, running Spanish test...\n');
  await testSpanishQuery();
};

main().catch(console.error);