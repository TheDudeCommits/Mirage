/**
 * Complete Workflow Test: AI Detection → IPFS → Blockchain
 * 
 * This script demonstrates the full content authenticity verification flow:
 * 1. Detect if content is AI-generated or human
 * 2. Upload detection metadata to IPFS (Pinata)
 * 3. Store verification record on blockchain (Base Sepolia)
 */

import dotenv from 'dotenv';
import { verifyAndStoreContent } from './server/verification-workflow.ts';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Test wallet address (from .env.local)
const TEST_WALLET = '0xb81fD84c761179BB0211Cb07e2f5bDfbEF611A4e';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║     🤖 Content Authenticity Verification System Test 🤖      ║');
console.log('║                                                              ║');
console.log('║  Workflow: AI Detection → IPFS Storage → Blockchain         ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

/**
 * Test Case 1: AI-Generated Text
 */
async function testAIGeneratedText() {
  console.log('\n' + '='.repeat(70));
  console.log('📝 TEST 1: AI-Generated Text Detection');
  console.log('='.repeat(70));

  const aiGeneratedText = `
Artificial intelligence has become increasingly sophisticated in recent years,
with large language models capable of generating human-like text across various
domains. These models can write essays, answer questions, and engage in 
conversations with remarkable fluency and coherence.
  `.trim();

  const input = {
    content: aiGeneratedText,
    contentType: 'text',
    detectionResult: {
      isAuthentic: false,        // AI-generated
      confidenceScore: 92,
      aiProbability: 92,
      label: 'AI-Generated'
    },
    detectionDetails: {
      modelUsed: 'GPT-Detector-v2',
      processingTime: 145
    },
    userAddress: TEST_WALLET
  };

  try {
    const result = await verifyAndStoreContent(input);
    
    console.log('\n✅ SUCCESS! Content verified and stored.\n');
    console.log('📋 Result Summary:');
    console.log('   Content Hash:', result.contentHash);
    console.log('   IPFS CID:', result.ipfsCid);
    console.log('   IPFS URL:', result.ipfsUrl);
    console.log('   Transaction:', result.blockchainTx?.txHash);
    console.log('   Explorer:', result.blockchainTx?.explorerUrl);
    console.log('   Verdict:', result.verification.isAuthentic ? 'Human ✨' : 'AI 🤖');
    console.log('   Confidence:', result.verification.confidenceScore + '%');
    
    return result;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  }
}

/**
 * Test Case 2: Human-Generated Text
 */
async function testHumanGeneratedText() {
  console.log('\n' + '='.repeat(70));
  console.log('📝 TEST 2: Human-Generated Text Detection');
  console.log('='.repeat(70));

  const humanText = `
hey whats up? i was thinking about grabbing some coffee later... 
maybe around 3pm? lmk if ur free! btw did you catch that game last night?
absolutely insane ending lol 😂
  `.trim();

  const input = {
    content: humanText,
    contentType: 'text',
    detectionResult: {
      isAuthentic: true,         // Human-generated
      confidenceScore: 88,
      aiProbability: 12,
      label: 'Human'
    },
    detectionDetails: {
      modelUsed: 'GPT-Detector-v2',
      processingTime: 132
    },
    userAddress: TEST_WALLET
  };

  try {
    const result = await verifyAndStoreContent(input);
    
    console.log('\n✅ SUCCESS! Content verified and stored.\n');
    console.log('📋 Result Summary:');
    console.log('   Content Hash:', result.contentHash);
    console.log('   IPFS CID:', result.ipfsCid);
    console.log('   IPFS URL:', result.ipfsUrl);
    console.log('   Transaction:', result.blockchainTx?.txHash);
    console.log('   Explorer:', result.blockchainTx?.explorerUrl);
    console.log('   Verdict:', result.verification.isAuthentic ? 'Human ✨' : 'AI 🤖');
    console.log('   Confidence:', result.verification.confidenceScore + '%');
    
    return result;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  }
}

/**
 * Test Case 3: AI-Generated Image
 */
async function testAIGeneratedImage() {
  console.log('\n' + '='.repeat(70));
  console.log('🖼️  TEST 3: AI-Generated Image Detection');
  console.log('='.repeat(70));

  const input = {
    content: 'image_data_placeholder_12345',  // In production, this would be actual image data
    contentType: 'image',
    detectionResult: {
      isAuthentic: false,        // AI-generated
      confidenceScore: 95,
      aiProbability: 95,
      label: 'AI-Generated (Midjourney/DALL-E)'
    },
    detectionDetails: {
      modelUsed: 'ImageDetector-CNN-v3',
      processingTime: 890
    },
    userAddress: TEST_WALLET,
    imageAnalysis: {
      classification: 'AI-Generated Art',
      detailedScores: {
        'texture_patterns': 0.94,
        'color_distribution': 0.91,
        'edge_coherence': 0.97,
        'noise_analysis': 0.93
      }
    }
  };

  try {
    const result = await verifyAndStoreContent(input);
    
    console.log('\n✅ SUCCESS! Image verified and stored.\n');
    console.log('📋 Result Summary:');
    console.log('   Content Hash:', result.contentHash);
    console.log('   IPFS CID:', result.ipfsCid);
    console.log('   IPFS URL:', result.ipfsUrl);
    console.log('   Transaction:', result.blockchainTx?.txHash);
    console.log('   Explorer:', result.blockchainTx?.explorerUrl);
    console.log('   Verdict:', result.verification.isAuthentic ? 'Real Photo ✨' : 'AI-Generated 🤖');
    console.log('   Confidence:', result.verification.confidenceScore + '%');
    
    return result;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  const results = [];
  
  try {
    console.log('\n⏳ Starting comprehensive workflow tests...\n');
    
    // Test 1: AI-Generated Text
    const test1 = await testAIGeneratedText();
    results.push({ test: 'AI-Generated Text', result: test1 });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Human-Generated Text
    const test2 = await testHumanGeneratedText();
    results.push({ test: 'Human-Generated Text', result: test2 });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3: AI-Generated Image
    const test3 = await testAIGeneratedImage();
    results.push({ test: 'AI-Generated Image', result: test3 });
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n📊 Summary of All Verifications:\n');
    
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.test}`);
      console.log(`   Hash: ${r.result.contentHash}`);
      console.log(`   IPFS: ${r.result.ipfsCid}`);
      console.log(`   TX: ${r.result.blockchainTx?.txHash}`);
      console.log(`   Status: ${r.result.verification.isAuthentic ? 'Human ✨' : 'AI 🤖'} (${r.result.verification.confidenceScore}%)\n`);
    });
    
    console.log('🔗 View your verifications:');
    console.log(`   Contract: https://sepolia.basescan.org/address/${process.env.VITE_CONTRACT_ADDRESS}`);
    console.log(`   Your wallet: https://sepolia.basescan.org/address/${TEST_WALLET}\n`);
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(console.error);

