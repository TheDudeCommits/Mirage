import { ethers } from 'ethers';
import { 
  uploadDetectionToIPFS, 
  generateContentHash, 
  type AIDetectionMetadata 
} from './ipfs.js';
import { 
  registerVerificationOnChain, 
  isContentVerified,
  getVerificationFromChain 
} from './blockchain.js';

/**
 * Content type mapping for smart contract
 */
const DetectionTypeMap = {
  'text': 0,
  'image': 1,
  'video': 2,
  'voice': 3
} as const;

export interface DetectionInput {
  content: string | Buffer;
  contentType: 'text' | 'image' | 'video' | 'voice';
  detectionResult: {
    isAuthentic: boolean;      // true = Human, false = AI-generated
    confidenceScore: number;    // 0-100
    aiProbability: number;      // 0-100
    label: string;              // e.g., "AI-Generated", "Human", "Likely AI"
  };
  detectionDetails: {
    modelUsed: string;
    processingTime: number;
  };
  userAddress: string;
  imageAnalysis?: {
    classification: string;
    heatmapBase64?: string;
    detailedScores: Record<string, number>;
  };
}

export interface VerificationResult {
  success: boolean;
  contentHash: string;
  ipfsCid: string;
  ipfsUrl: string;
  blockchainTx?: {
    txHash: string;
    blockNumber: number;
    gasUsed: string;
    contractAddress: string;
    explorerUrl: string;
  };
  verification: {
    isAuthentic: boolean;
    confidenceScore: number;
    detectionType: string;
    verifier: string;
    timestamp: number;
  };
}

/**
 * Complete workflow: AI Detection → IPFS → Blockchain
 */
export async function verifyAndStoreContent(
  input: DetectionInput
): Promise<VerificationResult> {
  console.log('\n🚀 Starting Complete Verification Workflow...\n');

  try {
    // Step 1: Generate content hash
    console.log('1️⃣ Generating content hash...');
    const contentHash = generateContentHash(input.content);
    console.log(`   ✅ Content Hash: ${contentHash}\n`);

    // Step 2: Check if already verified
    console.log('2️⃣ Checking if content is already verified...');
    const alreadyVerified = await isContentVerified(contentHash);
    
    if (alreadyVerified) {
      console.log('   ℹ️  Content already verified on blockchain');
      const existingVerification = await getVerificationFromChain(contentHash);
      
      return {
        success: true,
        contentHash,
        ipfsCid: existingVerification!.ipfsCid,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${existingVerification!.ipfsCid}`,
        verification: {
          isAuthentic: existingVerification!.isAuthentic,
          confidenceScore: existingVerification!.confidenceScore,
          detectionType: input.contentType,
          verifier: existingVerification!.verifier,
          timestamp: existingVerification!.timestamp
        }
      };
    }
    console.log('   ✅ Content not yet verified\n');

    // Step 3: Prepare metadata for IPFS
    console.log('3️⃣ Preparing metadata for IPFS...');
    const metadata: AIDetectionMetadata = {
      contentHash,
      contentType: input.contentType,
      detectionResult: input.detectionResult,
      detectionDetails: {
        ...input.detectionDetails,
        timestamp: Date.now()
      },
      userInfo: {
        walletAddress: input.userAddress
      },
      imageAnalysis: input.imageAnalysis,
      originalContent: {
        snippet: typeof input.content === 'string' 
          ? input.content.substring(0, 200) 
          : '[Binary content]',
        size: typeof input.content === 'string' 
          ? input.content.length 
          : input.content.length,
        format: input.contentType
      }
    };
    console.log('   ✅ Metadata prepared\n');

    // Step 4: Upload to IPFS via Pinata
    console.log('4️⃣ Uploading to IPFS (Pinata)...');
    const ipfsCid = await uploadDetectionToIPFS(metadata);
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;
    console.log(`   ✅ Uploaded to IPFS: ${ipfsCid}`);
    console.log(`   🔗 View at: ${ipfsUrl}\n`);

    // Step 5: Register on blockchain
    console.log('5️⃣ Registering verification on blockchain...');
    const detectionType = DetectionTypeMap[input.contentType];
    
    // Create wallet from private key (or use user's wallet in production)
    const provider = new ethers.JsonRpcProvider(
      process.env.BASE_SEPOLIA_RPC_URL
    );
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    
    const blockchainResult = await registerVerificationOnChain(
      contentHash,
      ipfsCid,
      input.detectionResult.isAuthentic,
      input.detectionResult.confidenceScore,
      detectionType,
      wallet
    );

    const explorerUrl = `https://sepolia.basescan.org/tx/${blockchainResult.txHash}`;
    console.log(`   ✅ Transaction confirmed!`);
    console.log(`   🔗 View on Basescan: ${explorerUrl}\n`);

    // Step 6: Return complete result
    console.log('✅ Verification Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Content: ${input.detectionResult.isAuthentic ? 'Human-Generated ✨' : 'AI-Generated 🤖'}`);
    console.log(`   Confidence: ${input.detectionResult.confidenceScore}%`);
    console.log(`   IPFS: ${ipfsCid}`);
    console.log(`   Blockchain: ${blockchainResult.txHash}`);
    console.log(`   Gas Used: ${blockchainResult.gasUsed}\n`);

    return {
      success: true,
      contentHash,
      ipfsCid,
      ipfsUrl,
      blockchainTx: {
        ...blockchainResult,
        explorerUrl
      },
      verification: {
        isAuthentic: input.detectionResult.isAuthentic,
        confidenceScore: input.detectionResult.confidenceScore,
        detectionType: input.contentType,
        verifier: wallet.address,
        timestamp: Date.now()
      }
    };

  } catch (error: any) {
    console.error('\n❌ Verification workflow failed:', error.message);
    throw new Error(`Verification failed: ${error.message}`);
  }
}

/**
 * Get existing verification details (IPFS + Blockchain)
 */
export async function getCompleteVerification(contentHash: string) {
  console.log(`\n🔍 Fetching verification for: ${contentHash}\n`);

  // Get blockchain record
  const blockchainRecord = await getVerificationFromChain(contentHash);
  
  if (!blockchainRecord) {
    throw new Error('Verification not found on blockchain');
  }

  // Get IPFS data
  const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${blockchainRecord.ipfsCid}`;

  return {
    blockchain: blockchainRecord,
    ipfs: {
      cid: blockchainRecord.ipfsCid,
      url: ipfsUrl
    },
    explorerUrl: `https://sepolia.basescan.org/address/${process.env.VITE_CONTRACT_ADDRESS}`
  };
}

