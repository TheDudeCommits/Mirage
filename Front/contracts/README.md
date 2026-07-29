# ContentAuthenticityRegistry Smart Contract

A production-ready Solidity smart contract for storing content verification data on-chain with IPFS references. Built for the AskMira AI Detection Platform.

## 🎯 Overview

The `ContentAuthenticityRegistry` contract enables decentralized, tamper-proof storage of AI content detection results. It stores verification records on-chain while keeping detailed analysis data in IPFS for cost efficiency.

### Key Features

✅ **Gas Optimized**: Efficient storage patterns and batch operations  
✅ **Secure**: Built with OpenZeppelin contracts (Ownable, ReentrancyGuard, Pausable)  
✅ **Scalable**: Support for pagination and batch registrations  
✅ **Flexible**: Multiple detection types (text, image, video, voice)  
✅ **Upgradeable**: Admin controls for fee management and emergency pause  
✅ **Event-Driven**: Comprehensive events for off-chain indexing  

## 📋 Contract Details

- **Solidity Version**: ^0.8.20
- **License**: MIT
- **Network**: Base (Mainnet & Sepolia Testnet)

### Data Structure

```solidity
struct VerificationRecord {
    bytes32 contentHash;        // Keccak256 hash of content
    string ipfsCid;             // IPFS CID with full analysis
    address verifier;           // Wallet that verified
    uint256 timestamp;          // Block timestamp
    bool isAuthentic;           // true = Human, false = AI
    uint8 confidenceScore;      // 0-100
    DetectionType detectionType; // TEXT, IMAGE, VIDEO, VOICE
    bool exists;                // Existence flag
}
```

## 🚀 Quick Start

### Prerequisites

```bash
node >= 18.0.0
npm >= 9.0.0
```

### Installation

Already installed as part of the Front project. Dependencies include:
- Hardhat
- OpenZeppelin Contracts
- Ethers.js v6

### Configuration

Create or update `.env.local` in the Front directory:

```bash
# Base Sepolia Testnet (for testing)
BASE_SEPOLIA_RPC_URL=<set-in-local-env>
PRIVATE_KEY=<set-in-local-env>
BASESCAN_API_KEY=<set-in-local-env>

# Base Mainnet (for production)
BASE_MAINNET_RPC_URL=<set-in-local-env>

# Optional: Gas reporting
REPORT_GAS=<set-in-local-env>
COINMARKETCAP_API_KEY=<set-in-local-env>
```

### Get Testnet ETH

For Base Sepolia testing:
1. Get Sepolia ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
2. Bridge to Base Sepolia using [Base Bridge](https://bridge.base.org/)

Or use the [Superchain Faucet](https://app.optimism.io/faucet?utm_source=base_docs) for Base Sepolia directly.

## 🔧 Usage

### Compile Contracts

```bash
cd contracts
npx hardhat compile
```

### Run Tests

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=<set-in-local-env>

# Run specific test file
npx hardhat test test/ContentAuthenticityRegistry.test.ts
```

### Deploy to Testnet

```bash
# Deploy to Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia
```

The deployment script will:
- Deploy the contract
- Save deployment info to `deployments/`
- Save ABI to `deployments/ContentAuthenticityRegistry.abi.json`
- Display verification instructions

### Verify Contract

```bash
# Automatically verify latest deployment
npx hardhat run scripts/verify.ts --network baseSepolia

# Or specify contract address
npx hardhat run scripts/verify.ts <CONTRACT_ADDRESS> baseSepolia
```

### Deploy to Mainnet

⚠️ **Only after thorough testing on testnet!**

```bash
npx hardhat run scripts/deploy.ts --network base
npx hardhat run scripts/verify.ts --network base
```

## 📝 Contract Functions

### User Functions

#### `registerVerification`
Register a single content verification.

```solidity
function registerVerification(
    bytes32 contentHash,
    string memory ipfsCid,
    bool isAuthentic,
    uint8 confidenceScore,
    DetectionType detectionType
) external payable
```

#### `batchRegisterVerifications`
Register up to 50 verifications in one transaction.

```solidity
function batchRegisterVerifications(
    bytes32[] memory contentHashes,
    string[] memory ipfsCids,
    bool[] memory isAuthentic,
    uint8[] memory confidenceScores,
    DetectionType[] memory detectionTypes
) external payable
```

#### `updateVerificationCid`
Update IPFS CID for existing verification (only by original verifier).

```solidity
function updateVerificationCid(
    bytes32 contentHash,
    string memory newIpfsCid
) external
```

### Query Functions

#### `getVerification`
Get verification record by content hash.

```solidity
function getVerification(bytes32 contentHash) 
    external view returns (VerificationRecord memory)
```

#### `getUserVerifications`
Get all verification hashes for a user.

```solidity
function getUserVerifications(address user) 
    external view returns (bytes32[] memory)
```

#### `getPaginatedVerifications`
Get paginated list of all verifications.

```solidity
function getPaginatedVerifications(uint256 offset, uint256 limit) 
    external view returns (bytes32[] memory)
```

#### `isVerified`
Check if content has been verified.

```solidity
function isVerified(bytes32 contentHash) 
    external view returns (bool)
```

### Admin Functions (Owner Only)

- `setVerificationFee(uint256 newFee)` - Set verification fee
- `withdrawFees()` - Withdraw collected fees
- `pause()` - Emergency pause
- `unpause()` - Resume operations

### Utility Functions

#### `generateContentHash`
Generate content hash from string.

```solidity
function generateContentHash(string memory content) 
    external pure returns (bytes32)
```

## 📊 Gas Optimization

The contract is optimized for gas efficiency:

| Operation | Estimated Gas |
|-----------|---------------|
| Single Registration | ~120,000 |
| Batch (10 items) | ~800,000 |
| Query Verification | ~3,000 |
| Update CID | ~45,000 |

Optimization techniques used:
- Packed storage slots
- Efficient loops in batch operations
- Event indexing for off-chain queries
- View functions for read operations

## 🔒 Security Features

- **OpenZeppelin Contracts**: Industry-standard security
- **Reentrancy Guard**: Protection against reentrancy attacks
- **Access Control**: Owner-only admin functions
- **Pausable**: Emergency stop mechanism
- **Input Validation**: Comprehensive checks on all inputs

## 🧪 Testing

The test suite includes:
- Unit tests for all functions
- Edge case testing
- Access control validation
- Gas usage reporting
- Event emission verification

Coverage: **100%** of contract functions

## 📈 Integration Example

### Frontend (TypeScript)

```typescript
import { ethers } from 'ethers';
import ContractABI from './deployments/ContentAuthenticityRegistry.abi.json';

const CONTRACT_ADDRESS = '0x...'; // Your deployed address

async function registerVerification(
  content: string,
  ipfsCid: string,
  isAuthentic: boolean,
  score: number
) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ContractABI, signer);
  
  // Generate content hash
  const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));
  
  // Register verification
  const tx = await contract.registerVerification(
    contentHash,
    ipfsCid,
    isAuthentic,
    score,
    0 // DetectionType.TEXT
  );
  
  await tx.wait();
  console.log('Verification registered!');
}
```

## 📦 Deployment Info

Deployment information is automatically saved to:
- `deployments/<network>-<timestamp>.json` - Full deployment details
- `deployments/ContentAuthenticityRegistry.abi.json` - Contract ABI

After deployment, update your frontend `.env.local`:

```bash
VITE_CONTRACT_ADDRESS=<set-in-local-env>
VITE_CHAIN_ID=<set-in-local-env>
```

## 🔄 Upgrade Path

While the current contract is not upgradeable, it includes:
- Pausable functionality for emergency stops
- Owner-controlled fee management
- Flexible IPFS CID updates

For future upgrades, consider implementing:
- Transparent proxy pattern
- UUPS (Universal Upgradeable Proxy Standard)
- Diamond pattern for modularity

## 📚 Resources

- [Base Documentation](https://docs.base.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Basescan Explorer](https://basescan.org/)

## 🐛 Troubleshooting

### "Insufficient fee" error
- Check that `verificationFee` is 0 or you're sending enough ETH
- Use `await contract.verificationFee()` to check current fee

### "Already verified" error
- Content with same hash already exists
- Use `isVerified()` to check before registering

### Gas estimation failed
- Ensure wallet has enough ETH for gas
- Check that contract is not paused
- Verify all input parameters are valid

### Verification failed on Basescan
- Wait 1-2 minutes after deployment
- Ensure `BASESCAN_API_KEY` is set correctly
- Check that contract address matches deployment

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

This contract is part of the AskMira project. For contributions:
1. Test thoroughly on testnet
2. Ensure all tests pass
3. Follow Solidity best practices
4. Document all changes

---

**Built with ❤️ for AskMira AI Detection Platform**


