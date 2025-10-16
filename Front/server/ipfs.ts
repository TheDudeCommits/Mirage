import crypto from 'crypto';
import axios from 'axios';

// Pinata configuration
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

// Pinata authentication headers
const getPinataHeaders = () => {
  // Prefer JWT if available, fallback to API Key + Secret
  if (process.env.PINATA_JWT) {
    return {
      'Authorization': `Bearer ${process.env.PINATA_JWT}`,
      'Content-Type': 'application/json'
    };
  } else if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
    return {
      'pinata_api_key': process.env.PINATA_API_KEY,
      'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY,
      'Content-Type': 'application/json'
    };
  } else {
    throw new Error('Pinata credentials not configured. Please set PINATA_JWT or (PINATA_API_KEY + PINATA_SECRET_API_KEY)');
  }
};

export interface AIDetectionMetadata {
  contentHash: string;
  contentType: 'text' | 'image' | 'video' | 'voice';
  detectionResult: {
    isAuthentic: boolean;
    confidenceScore: number;
    aiProbability: number;
    label: string;
  };
  detectionDetails: {
    modelUsed: string;
    processingTime: number;
    timestamp: number;
  };
  userInfo: {
    walletAddress: string;
    verificationId?: string;
  };
  imageAnalysis?: {
    classification: string;
    heatmapBase64?: string;
    detailedScores: Record<string, number>;
  };
  originalContent?: {
    snippet?: string;
    size: number;
    format: string;
  };
}

/**
 * Upload AI detection metadata to IPFS via Pinata
 */
export async function uploadDetectionToIPFS(
  metadata: AIDetectionMetadata
): Promise<string> {
  try {
    console.log('📤 Uploading detection data to IPFS via Pinata...');
    
    const data = JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `ai-detection-${metadata.contentHash.substring(0, 10)}.json`,
        keyvalues: {
          contentType: metadata.contentType,
          isAuthentic: metadata.detectionResult.isAuthentic.toString(),
          timestamp: metadata.detectionDetails.timestamp.toString()
        }
      },
      pinataOptions: {
        cidVersion: 1
      }
    });
    
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
      data,
      { headers: getPinataHeaders() }
    );
    
    const cid = response.data.IpfsHash;
    console.log(`✅ Uploaded to IPFS via Pinata: ${cid}`);
    console.log(`🔗 Access at: ${PINATA_GATEWAY}/${cid}`);
    
    return cid;
  } catch (error: any) {
    console.error('❌ IPFS upload error:', error.response?.data || error.message);
    throw new Error(`Failed to upload to IPFS: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Fetch AI detection metadata from IPFS via Pinata Gateway
 */
export async function fetchDetectionFromIPFS(
  cid: string
): Promise<AIDetectionMetadata> {
  try {
    console.log(`📥 Fetching from IPFS via Pinata: ${cid}`);
    
    const response = await axios.get(`${PINATA_GATEWAY}/${cid}`);
    
    console.log(`✅ Fetched from IPFS: ${cid}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ IPFS fetch error:', error.message);
    throw new Error(`Failed to fetch from IPFS: ${error.message}`);
  }
}

/**
 * Pin content to ensure it stays on IPFS via Pinata
 */
export async function pinToIPFS(cid: string): Promise<void> {
  try {
    const data = JSON.stringify({
      hashToPin: cid,
      pinataMetadata: {
        name: `pinned-${cid.substring(0, 10)}`
      }
    });
    
    await axios.post(
      `${PINATA_API_URL}/pinning/pinByHash`,
      data,
      { headers: getPinataHeaders() }
    );
    
    console.log(`📌 Pinned to IPFS via Pinata: ${cid}`);
  } catch (error: any) {
    console.error('⚠️ IPFS pin error:', error.response?.data || error.message);
    // Don't throw - pinning is optional
  }
}

/**
 * Generate content hash for blockchain storage
 */
export function generateContentHash(content: string | Buffer): string {
  return '0x' + crypto.createHash('sha256').update(content).digest('hex');
}

