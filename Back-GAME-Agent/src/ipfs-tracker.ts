import axios from 'axios';
import crypto from 'crypto';

// Pinata configuration from environment
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

interface VerificationMetadata {
  tweetId: string;
  tweetText: string;
  tweetAuthor: string;
  classification: string;
  confidence: number;
  timestamp: number;
  contentHash: string;
  agentVersion: string;
  detectionModel: string;
}

/**
 * Get Pinata authentication headers
 */
function getPinataHeaders() {
  // Use JWT if available
  if (process.env.PINATA_JWT) {
    return {
      'Authorization': `Bearer ${process.env.PINATA_JWT}`,
      'Content-Type': 'application/json'
    };
  }
  // Fallback to API Key + Secret
  else if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
    return {
      'pinata_api_key': process.env.PINATA_API_KEY,
      'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY,
      'Content-Type': 'application/json'
    };
  }
  // No credentials - skip IPFS
  return null;
}

/**
 * Generate content hash for the tweet text
 */
export function generateContentHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

/**
 * Upload verification metadata to IPFS via Pinata
 */
export async function uploadVerificationToIPFS(
  metadata: VerificationMetadata
): Promise<string | null> {
  try {
    const headers = getPinataHeaders();
    
    // Skip if no Pinata credentials
    if (!headers) {
      console.log('ℹ️  IPFS tracking disabled (no Pinata credentials)');
      return null;
    }

    const data = {
      pinataContent: metadata,
      pinataMetadata: {
        name: `verification-${metadata.tweetId}`,
        keyvalues: {
          type: 'twitter-verification',
          tweetId: metadata.tweetId,
          classification: metadata.classification,
          timestamp: metadata.timestamp.toString()
        }
      },
      pinataOptions: {
        cidVersion: 1
      }
    };

    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
      data,
      { headers, timeout: 10000 }
    );

    const ipfsCid = response.data.IpfsHash;
    console.log(`📌 Uploaded to IPFS: ${ipfsCid}`);
    console.log(`🔗 View at: ${PINATA_GATEWAY}/${ipfsCid}`);
    
    return ipfsCid;
    
  } catch (error: any) {
    console.error('❌ Failed to upload to IPFS:', error.message);
    // Don't throw - IPFS tracking is optional
    return null;
  }
}

/**
 * Fetch verification data from IPFS
 */
export async function fetchVerificationFromIPFS(
  ipfsCid: string
): Promise<VerificationMetadata | null> {
  try {
    const response = await axios.get(
      `${PINATA_GATEWAY}/${ipfsCid}`,
      { timeout: 10000 }
    );
    
    return response.data as VerificationMetadata;
    
  } catch (error: any) {
    console.error(`❌ Failed to fetch from IPFS (${ipfsCid}):`, error.message);
    return null;
  }
}

/**
 * Pin existing IPFS content to ensure persistence
 */
export async function pinToIPFS(ipfsCid: string): Promise<boolean> {
  try {
    const headers = getPinataHeaders();
    
    if (!headers) {
      return false;
    }

    await axios.post(
      `${PINATA_API_URL}/pinning/pinByHash`,
      {
        hashToPin: ipfsCid,
        pinataMetadata: {
          name: `pinned-${ipfsCid}`
        }
      },
      { headers, timeout: 10000 }
    );

    console.log(`📌 Pinned to IPFS: ${ipfsCid}`);
    return true;
    
  } catch (error: any) {
    console.error('❌ Failed to pin to IPFS:', error.message);
    return false;
  }
}

/**
 * Create verification metadata object
 */
export function createVerificationMetadata(
  tweetId: string,
  tweetText: string,
  tweetAuthor: string,
  classification: string,
  confidence: number
): VerificationMetadata {
  const contentHash = generateContentHash(tweetText);
  
  return {
    tweetId,
    tweetText: tweetText.substring(0, 500), // Limit text length
    tweetAuthor,
    classification,
    confidence,
    timestamp: Date.now(),
    contentHash,
    agentVersion: '1.0.0',
    detectionModel: 'desklib/ai-text-detector-v1.01'
  };
}

