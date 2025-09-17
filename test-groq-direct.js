#!/usr/bin/env node

/**
 * Test Groq API Direct
 * ===================
 */

import { config } from 'dotenv';
import Groq from 'groq-sdk';

// Load environment variables
config({ path: '.env.local' });

async function testGroqDirect() {
  try {
    console.log('🧪 Testing Groq API directly...');
    console.log('API Key available:', !!process.env.GROQ_API_KEY);
    console.log('API Key length:', process.env.GROQ_API_KEY?.length);
    
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ No Groq API key found');
      return;
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const testPrompt = `
Create a short, conversational response about Python experience:

Professional Data: "3+ years Python experience at Aubot maintaining 9,500+ coding exercises"

Question: "What's your Python experience?"

Response should be:
- Under 50 words
- Conversational tone
- Include specific numbers
- Sound natural

Response:
    `;

    console.log('Making Groq API call...');
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: testPrompt }],
      model: 'llama-3.1-8b-instant', // Try this smaller but current model
      temperature: 0.7,
      max_tokens: 100,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    
    console.log('✅ Groq API Response:');
    console.log(`"${response}"`);
    console.log(`Length: ${response?.length} characters`);
    
  } catch (error) {
    console.error('❌ Groq test failed:', error.message);
  }
}

testGroqDirect();