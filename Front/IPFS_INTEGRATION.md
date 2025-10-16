# IPFS + Blockchain Integration Guide

## 🎯 Overview

This integration combines AI detection with decentralized storage (IPFS) and blockchain verification for permanent, tamper-proof records.

## 📊 Architecture

```
User submits content for detection
         ↓
AI Detection (Backend APIs)
         ↓
Store detailed data on IPFS (cheap, unlimited size)
         ↓
Store reference on Blockchain (expensive, limited size)
         ↓
Permanent verification record
```

## 🔄 Complete Workflow

### Step 1: AI Detection
User uploads content → AI analyzes → Returns result

### Step 2: Store on IPFS
**Endpoint:** `POST /api/detection/prepare-storage`

**Request:**
```json
{
  "content": "The text or base64 image data",
  "detectionResult": {
    "probability": 85,
    "label": "AI-Generated",
    "imageInfo": { ... }
  },
  "detectionType": "text",
  "userAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "contentHash": "0xabc123...",
  "ipfsCid": "QmXXX...",
  "detection": {
    "isAuthentic": false,
    "confidenceScore": 85,
    "aiProbability": 85,
    "label": "AI-Generated"
  },
  "ipfsUrl": "https://ipfs.io/ipfs/QmXXX...",
  "message": "Detection data stored on IPFS. Ready for blockchain verification."
}
```

### Step 3: Register on Blockchain (Frontend)
User signs transaction with their wallet

**Frontend Code:**
```typescript
import { ethers } from 'ethers';
import ContractABI from './contracts/deployments/ContentAuthenticityRegistry.abi.json';

const CONTRACT_ADDRESS = '0x64594731c7611C24E045188768BFfb1Ed1Ff71E7';

async function storeOnBlockchain(contentHash, ipfsCid, detection) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ContractABI, signer);
  
  const detectionType = {
    'text': 0,
    'image': 1,
    'video': 2,
    'voice': 3
  };
  
  const tx = await contract.registerVerification(
    contentHash,
    ipfsCid,
    detection.isAuthentic,
    Math.round(detection.confidenceScore),
    detectionType[detection.contentType]
  );
  
  await tx.wait();
  console.log('✅ Stored on blockchain!', tx.hash);
}
```

### Step 4: Retrieve Verification
**Endpoint:** `GET /api/verification/:contentHash`

**Response:**
```json
{
  "success": true,
  "verification": {
    "contentHash": "0xabc123...",
    "ipfsCid": "QmXXX...",
    "verifier": "0x...",
    "timestamp": 1697500000,
    "isAuthentic": false,
    "confidenceScore": 85
  },
  "ipfsData": { ...full detection data... },
  "ipfsUrl": "https://ipfs.io/ipfs/QmXXX...",
  "basescanUrl": "https://sepolia.basescan.org/tx/..."
}
```

## 📝 Data Stored Where?

### On IPFS (Detailed Data):
```json
{
  "contentHash": "0x...",
  "contentType": "image",
  "detectionResult": {
    "isAuthentic": false,
    "confidenceScore": 85,
    "aiProbability": 85,
    "label": "AI-Generated"
  },
  "detectionDetails": {
    "modelUsed": "CNN-v2",
    "processingTime": 1234,
    "timestamp": 1697500000
  },
  "userInfo": {
    "walletAddress": "0x..."
  },
  "imageAnalysis": {
    "classification": "AI-Generated",
    "heatmapBase64": "data:image/png;base64,...",
    "detailedScores": {
      "styleGAN": 0.92,
      "progan": 0.85
    }
  },
  "originalContent": {
    "snippet": "First 200 chars...",
    "size": 50000,
    "format": "image"
  }
}
```

### On Blockchain (Reference):
- Content hash (32 bytes)
- IPFS CID (46 bytes)
- Verifier address (20 bytes)
- Timestamp (32 bytes)
- Is authentic flag (1 byte)
- Confidence score (1 byte)
- Detection type (1 byte)

**Total: ~133 bytes on-chain, unlimited data on IPFS!**

## 💰 Cost Breakdown

### IPFS Storage:
- Upload: Free (using Infura free tier)
- Pinning: $0 (first 5GB free)
- Storage: Permanent once pinned

### Blockchain Storage:
- Register verification: $0.50-$2 (Base Sepolia)
- Query verification: Free (read-only)
- Update IPFS CID: $0.08-$0.30

## 🔧 Setup Instructions

### 1. Get Infura IPFS Credentials

Visit: https://www.infura.io/
- Create account (free)
- Create new project → Select "IPFS"
- Copy Project ID and API Key

### 2. Update .env.local

```bash
# IPFS Configuration
IPFS_HOST=ipfs.infura.io
IPFS_PROJECT_ID=your_project_id_here
IPFS_API_KEY=your_api_key_here

# Blockchain
VITE_CONTRACT_ADDRESS=0x64594731c7611C24E045188768BFfb1Ed1Ff71E7
VITE_CHAIN_ID=84532
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### 3. Deploy Contract (If Not Done)

```bash
npm run contract:deploy:testnet
```

### 4. Start Server

```bash
npm run dev
```

## 📡 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/detection/prepare-storage` | POST | Upload detection to IPFS |
| `/api/verification/:contentHash` | GET | Get verification from blockchain |
| `/api/user/:address/verifications` | GET | Get user's verification history |
| `/api/verification-fee` | GET | Get current blockchain fee |

## 🧪 Testing

### Test IPFS Upload:
```bash
curl -X POST http://localhost:5000/api/detection/prepare-storage \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test content",
    "detectionResult": {
      "probability": 85,
      "label": "AI-Generated"
    },
    "detectionType": "text",
    "userAddress": "0xYourAddress"
  }'
```

### Test Verification Retrieval:
```bash
curl http://localhost:5000/api/verification/0xYourContentHash
```

## 🎉 Success Indicators

✅ Detection data uploaded to IPFS (get CID)  
✅ Data pinned (permanent storage)  
✅ User signs blockchain transaction  
✅ Verification stored on-chain  
✅ Can retrieve full data anytime  
✅ Tamper-proof permanent record  

## 🚀 Next Steps

1. **Get Infura credentials** (5 minutes)
2. **Update .env.local** with IPFS config
3. **Test IPFS upload** endpoint
4. **Integrate with frontend** detection flow
5. **Add wallet signing** for blockchain storage
6. **Deploy to production** on Base Mainnet

## 📚 Resources

- [IPFS Documentation](https://docs.ipfs.tech/)
- [Infura IPFS](https://www.infura.io/product/ipfs)
- [Base Documentation](https://docs.base.org/)
- [Contract on Basescan](https://sepolia.basescan.org/address/0x64594731c7611C24E045188768BFfb1Ed1Ff71E7)

