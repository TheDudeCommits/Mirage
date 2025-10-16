# 🔍 How to View Your Verifications

## Quick Links

### Your Smart Contract
**Address**: `0x64594731c7611C24E045188768BFfb1Ed1Ff71E7`  
**View on Basescan**: https://sepolia.basescan.org/address/0x64594731c7611C24E045188768BFfb1Ed1Ff71E7

### Your Wallet  
**Address**: `0xb81fD84c761179BB0211Cb07e2f5bDfbEF611A4e`  
**View on Basescan**: https://sepolia.basescan.org/address/0xb81fD84c761179BB0211Cb07e2f5bDfbEF611A4e

---

## 📊 View Verification Data

### On IPFS (Detailed Metadata)

Click these links to see the full AI detection data stored on IPFS:

**Test 1 - AI-Generated Text**
```
https://gateway.pinata.cloud/ipfs/bafkreihvod47cg3ritzdwge32cma6s5pzhy3tzgi5ii4xbisqbvmm3xy5a
```

**Test 2 - Human Text**
```
https://gateway.pinata.cloud/ipfs/bafkreie3z4pei2twtomafxm222mhie6lxzodapzqgwh53t55qnk4y77a54
```

**Test 3 - AI-Generated Image**
```
https://gateway.pinata.cloud/ipfs/bafkreihiakrdm6lm2yw56dybmt65mk2ebjvebl4vbdfcwrqe4njglopbw4
```

### On Blockchain (Verification Proof)

Click these to see the immutable blockchain records:

**Test 1 Transaction**
```
https://sepolia.basescan.org/tx/0x6e869101cf5d8ea16646fe551b4b3128d852c5d7d1ededdada81da1ac123a5d4
```

**Test 2 Transaction**
```
https://sepolia.basescan.org/tx/0xf85d2d4dbff621900a94c86537adf81753920cc53912578a319a865cfe716e8f
```

**Test 3 Transaction**
```
https://sepolia.basescan.org/tx/0xd5b6f56d6143d1bd3507fd1a009e63f8180ea57a0313bd523405fd6345badcf7
```

---

## 🔎 How to Read the Data

### IPFS Data Structure
When you open an IPFS link, you'll see JSON data like:

```json
{
  "contentHash": "0x590526...",           // Unique content identifier
  "contentType": "text",                  // Type: text, image, video, voice
  "detectionResult": {
    "isAuthentic": false,                 // false = AI, true = Human
    "confidenceScore": 92,                // 0-100 confidence
    "aiProbability": 92,                  // Likelihood it's AI
    "label": "AI-Generated"               // Human-readable label
  },
  "detectionDetails": {
    "modelUsed": "GPT-Detector-v2",       // Which AI model detected it
    "processingTime": 145,                // Milliseconds
    "timestamp": 1729064907000            // Unix timestamp
  },
  "userInfo": {
    "walletAddress": "0xb81fD84c..."     // Who verified it
  },
  "originalContent": {
    "snippet": "First 200 chars...",      // Content preview
    "size": 287,                          // Size in bytes
    "format": "text"                      // Format type
  }
}
```

### Blockchain Transaction
On Basescan, you'll see:
- **Status**: ✅ Success
- **Block**: Block number where it was recorded
- **From**: Your wallet address
- **To**: Smart contract address
- **Gas Used**: How much gas was consumed
- **Logs**: Event data showing the verification details

---

## 💻 Query Programmatically

### Get Verification by Content Hash

```typescript
import { getCompleteVerification } from './server/verification-workflow';

const contentHash = '0x59052689e73749c904a1b620316d9390dc9b36dc829f30cefc6e9b0898d3dc45';
const verification = await getCompleteVerification(contentHash);

console.log(verification);
// {
//   blockchain: {
//     contentHash: '0x590526...',
//     ipfsCid: 'bafkrei...',
//     verifier: '0xb81fD84c...',
//     timestamp: 1729064907,
//     isAuthentic: false,
//     confidenceScore: 92,
//     detectionType: 0
//   },
//   ipfs: {
//     cid: 'bafkrei...',
//     url: 'https://gateway.pinata.cloud/ipfs/...'
//   },
//   explorerUrl: 'https://sepolia.basescan.org/address/...'
// }
```

### Get All Verifications for a User

```typescript
import { getUserVerifications } from './server/blockchain';

const userAddress = '0xb81fD84c761179BB0211Cb07e2f5bDfbEF611A4e';
const verifications = await getUserVerifications(userAddress);

verifications.forEach(v => {
  console.log(`Content: ${v.isAuthentic ? 'Human' : 'AI'}`);
  console.log(`Confidence: ${v.confidenceScore}%`);
  console.log(`IPFS: ${v.ipfsCid}`);
  console.log(`Time: ${new Date(v.timestamp * 1000)}`);
  console.log('---');
});
```

### Check if Content is Already Verified

```typescript
import { isContentVerified } from './server/blockchain';
import { generateContentHash } from './server/ipfs';

const content = "Some content to check...";
const hash = generateContentHash(content);
const isVerified = await isContentVerified(hash);

if (isVerified) {
  console.log('This content has already been verified!');
  const details = await getVerificationFromChain(hash);
  console.log('Verdict:', details.isAuthentic ? 'Human' : 'AI');
}
```

---

## 🌐 Public Access

All verification data is **publicly accessible**:

- ✅ Anyone can view IPFS data (it's decentralized)
- ✅ Anyone can query the blockchain
- ✅ All transactions are transparent
- ✅ No authentication needed to view

This ensures **complete transparency** while maintaining **immutability**.

---

## 📱 Share Verifications

You can share verification proof by sending:

1. **IPFS Link**: Shows full detection data
   ```
   https://gateway.pinata.cloud/ipfs/bafkrei...
   ```

2. **Blockchain Link**: Shows immutable proof
   ```
   https://sepolia.basescan.org/tx/0x6e8691...
   ```

3. **Content Hash**: For programmatic lookups
   ```
   0x59052689e73749c904a1b620316d9390dc9b36dc829f30cefc6e9b0898d3dc45
   ```

---

## 🔐 Data Integrity

### How to Verify Data Hasn't Been Tampered

1. **Check IPFS CID**: The CID is a cryptographic hash of the content. If the content changes, the CID changes.

2. **Verify Blockchain Record**: Once on the blockchain, the data is immutable. The transaction hash proves the verification happened.

3. **Match Content Hash**: Hash your original content and compare it with the stored `contentHash` to verify it's the same content.

```typescript
import { generateContentHash } from './server/ipfs';

const originalContent = "Your original content...";
const myHash = generateContentHash(originalContent);
const storedHash = "0x59052689..."; // From blockchain

if (myHash === storedHash) {
  console.log('✅ Content matches! Verification is authentic.');
} else {
  console.log('❌ Content has been modified!');
}
```

---

## 🎯 Use Cases

### 1. Verify News Articles
```
User submits article → AI detects → Store on IPFS → Record on blockchain
→ Anyone can verify if article is AI-generated
```

### 2. Authenticate Images
```
Upload image → Run detection → Get verification badge
→ Proof the image is real/AI-generated
```

### 3. Content Moderation
```
Detect AI spam → Store proof → Ban if confidence > 90%
→ Transparent moderation with proof
```

### 4. Academic Integrity
```
Student submits essay → Check authenticity → Store result
→ Verifiable proof of originality
```

---

## 📞 Support

- **View Contract Code**: Check `contracts/src/ContentAuthenticityRegistry.sol`
- **Test Script**: Run `npx tsx test-complete-workflow.ts`
- **Documentation**: See `COMPLETE_INTEGRATION_SUCCESS.md`

---

**Built with**: Solidity, Hardhat, Pinata IPFS, Base Sepolia  
**Last Updated**: October 16, 2025


