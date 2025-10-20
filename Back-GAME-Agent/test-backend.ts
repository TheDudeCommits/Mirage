/**
 * Test script to verify backend integration without Twitter
 * This tests that the AI detection backend is working
 */

import axios from 'axios';

const TEXT_DETECTOR_URL = 'http://localhost:5001/api/detect';

async function testBackend() {
  console.log('🧪 Testing AI Detection Backend...\n');
  
  const testTexts = [
    "The quick brown fox jumps over the lazy dog.",
    "In the realm of artificial intelligence, machine learning algorithms continuously evolve to optimize predictive analytics and enhance decision-making capabilities.",
    "I love pizza! It's my favorite food."
  ];

  for (let i = 0; i < testTexts.length; i++) {
    const text = testTexts[i];
    console.log(`\n📝 Test ${i + 1}: "${text.substring(0, 50)}..."`);
    
    try {
      const response = await axios.post(
        TEXT_DETECTOR_URL,
        { text: text },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 
        }
      );

      console.log('✅ Response:', response.data);
      
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Backend not running! Start it with:');
        console.error('   cd Back-AI-Text-Detector && python main.py');
      } else {
        console.error('❌ Error:', error.message);
      }
    }
  }
}

testBackend().catch(console.error);

