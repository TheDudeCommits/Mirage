import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load contract ABI
const abiPath = path.join(__dirname, '../contracts/deployments/ContentAuthenticityRegistry.abi.json');
let CONTRACT_ABI: any[] = [];

// Try to load ABI, but don't fail if it doesn't exist yet
try {
  if (fs.existsSync(abiPath)) {
    CONTRACT_ABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  }
} catch (error) {
  console.warn('⚠️ Contract ABI not found. Deploy contract first.');
}

// Contract address (update after deployment)
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS || '0x64594731c7611C24E045188768BFfb1Ed1Ff71E7';

// RPC Provider
const provider = new ethers.JsonRpcProvider(
  process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
);

// Wallet for server-side transactions (optional)
const serverWallet = process.env.SERVER_PRIVATE_KEY
  ? new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, provider)
  : null;

/**
 * Get contract instance
 */
function getContract(wallet?: ethers.Wallet) {
  if (CONTRACT_ABI.length === 0) {
    throw new Error('Contract ABI not loaded. Please deploy contract first.');
  }
  
  const signer = wallet || serverWallet || provider;
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Register verification on blockchain
 */
export async function registerVerificationOnChain(
  contentHash: string,
  ipfsCid: string,
  isAuthentic: boolean,
  confidenceScore: number,
  detectionType: 0 | 1 | 2 | 3, // TEXT=0, IMAGE=1, VIDEO=2, VOICE=3
  userWallet?: ethers.Wallet
) {
  const wallet = userWallet || serverWallet;
  
  if (!wallet) {
    throw new Error('No wallet available for transaction');
  }

  const contract = getContract(wallet);

  console.log('📝 Registering verification on blockchain...');
  console.log(`   Content Hash: ${contentHash}`);
  console.log(`   IPFS CID: ${ipfsCid}`);
  console.log(`   Authentic: ${isAuthentic}`);
  console.log(`   Score: ${confidenceScore}`);

  // Get current verification fee
  const verificationFee = await contract.verificationFee();

  const tx = await contract.registerVerification(
    contentHash,
    ipfsCid,
    isAuthentic,
    Math.round(confidenceScore), // Ensure it's an integer
    detectionType,
    { value: verificationFee }
  );

  console.log(`⏳ Transaction sent: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`✅ Verified on blockchain! Block: ${receipt.blockNumber}`);

  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    contractAddress: CONTRACT_ADDRESS
  };
}

/**
 * Get verification from blockchain
 */
export async function getVerificationFromChain(contentHash: string) {
  const contract = getContract();
  
  const isVerified = await contract.isVerified(contentHash);
  
  if (!isVerified) {
    return null;
  }

  const verification = await contract.getVerification(contentHash);
  
  return {
    contentHash: verification.contentHash,
    ipfsCid: verification.ipfsCid,
    verifier: verification.verifier,
    timestamp: Number(verification.timestamp),
    isAuthentic: verification.isAuthentic,
    confidenceScore: Number(verification.confidenceScore),
    detectionType: Number(verification.detectionType)
  };
}

/**
 * Get user's verification history
 */
export async function getUserVerifications(userAddress: string) {
  const contract = getContract();
  
  const hashes = await contract.getUserVerifications(userAddress);
  
  const verifications = [];
  for (const hash of hashes) {
    const verification = await contract.getVerification(hash);
    verifications.push({
      contentHash: verification.contentHash,
      ipfsCid: verification.ipfsCid,
      timestamp: Number(verification.timestamp),
      isAuthentic: verification.isAuthentic,
      confidenceScore: Number(verification.confidenceScore),
      detectionType: Number(verification.detectionType)
    });
  }
  
  return verifications;
}

/**
 * Check if content is already verified
 */
export async function isContentVerified(contentHash: string): Promise<boolean> {
  const contract = getContract();
  return await contract.isVerified(contentHash);
}

/**
 * Get verification fee
 */
export async function getVerificationFee(): Promise<string> {
  const contract = getContract();
  const fee = await contract.verificationFee();
  return ethers.formatEther(fee);
}

