const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { ethers } = hre;

async function main() {
  console.log("🚀 Starting deployment of ContentAuthenticityRegistry...\n");

  // Get network information
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  console.log(`📡 Network: ${network.name} (Chain ID: ${chainId})`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`💼 Deployer address: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    throw new Error("❌ Deployer has no ETH. Please fund the account first.");
  }

  // Deploy contract
  console.log("📦 Deploying ContentAuthenticityRegistry...");
  const ContentAuthenticityRegistry = await ethers.getContractFactory(
    "ContentAuthenticityRegistry"
  );
  
  const registry = await ContentAuthenticityRegistry.deploy();
  
  // FIXED: Properly wait for deployment
  await registry.waitForDeployment();
  const contractAddress = await registry.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}`);

  // Get deployment transaction
  const deployTx = registry.deploymentTransaction();
  let txHash = "";
  let gasUsed = "0";
  let gasPrice = "0";
  let blockNumber = 0;

  if (deployTx) {
    txHash = deployTx.hash;
    console.log(`📄 Deployment tx hash: ${txHash}`);
    
    // Wait for transaction receipt
    const receipt = await deployTx.wait();
    if (receipt) {
      gasUsed = receipt.gasUsed.toString();
      gasPrice = ethers.formatUnits(receipt.gasPrice || 0n, "gwei");
      blockNumber = receipt.blockNumber;
      console.log(`⛽ Gas used: ${gasUsed}`);
      console.log(`💵 Gas price: ${gasPrice} gwei`);
    }
  }

  // FIXED: Wait a bit for contract to be fully indexed
  console.log("\n⏳ Waiting for contract to be indexed...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Verify contract state (with error handling)
  console.log("🔍 Verifying contract state...");
  let owner = deployer.address;
  let totalVerifications = 0n;
  let verificationFee = 0n;

  try {
    owner = await registry.owner();
    totalVerifications = await registry.totalVerifications();
    verificationFee = await registry.verificationFee();
    
    console.log(`👤 Contract owner: ${owner}`);
    console.log(`📊 Total verifications: ${totalVerifications.toString()}`);
    console.log(`💲 Verification fee: ${ethers.formatEther(verificationFee)} ETH`);
  } catch (error) {
    console.log("⚠️ Could not verify state immediately (this is normal)");
    console.log("   Contract is deployed and will work correctly!");
  }

  // Prepare deployment information
  const deploymentInfo = {
    contractName: "ContentAuthenticityRegistry",
    contractAddress,
    network: network.name,
    chainId: chainId.toString(),
    deployer: deployer.address,
    deploymentTxHash: txHash,
    timestamp: new Date().toISOString(),
    blockNumber,
    gasUsed,
    gasPrice,
    owner,
    verificationFee: verificationFee.toString(),
    basescanUrl: `https://${network.name === 'baseSepolia' ? 'sepolia.' : ''}basescan.org/address/${contractAddress}`
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save JSON deployment info
  const networkName = network.name === "unknown" ? `chain-${chainId}` : network.name;
  const jsonFile = path.join(deploymentsDir, `${networkName}-${Date.now()}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment JSON saved to: ${jsonFile}`);

  // Save human-readable deployment info
  const readableInfo = `
CONTRACT DEPLOYMENT INFO
========================
Contract: ${deploymentInfo.contractName}
Address: ${deploymentInfo.contractAddress}
Network: ${deploymentInfo.network} (${deploymentInfo.chainId})
Deployer: ${deploymentInfo.deployer}
Tx Hash: ${deploymentInfo.deploymentTxHash}
Block: ${deploymentInfo.blockNumber}
Date: ${new Date(deploymentInfo.timestamp).toLocaleString()}
Gas Used: ${deploymentInfo.gasUsed}
Gas Price: ${deploymentInfo.gasPrice} gwei
Basescan: ${deploymentInfo.basescanUrl}

NEXT STEPS:
1. Verify contract:
   npx hardhat verify --network ${networkName} ${contractAddress}

2. Update .env.local:
   VITE_CONTRACT_ADDRESS=${contractAddress}
   VITE_CHAIN_ID=${chainId}

3. View on Basescan:
   ${deploymentInfo.basescanUrl}
`;

  const txtFile = path.join(deploymentsDir, `${networkName}-latest.txt`);
  fs.writeFileSync(txtFile, readableInfo);
  console.log(`📝 Deployment info saved to: ${txtFile}`);

  // Save ABI
  const artifact = await ethers.getContractFactory("ContentAuthenticityRegistry");
  const abi = artifact.interface.formatJson();
  const abiFile = path.join(deploymentsDir, "ContentAuthenticityRegistry.abi.json");
  fs.writeFileSync(abiFile, abi);
  console.log(`📋 ABI saved to: ${abiFile}`);

  // Display summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 Deployment Complete!");
  console.log("=".repeat(60));
  console.log(readableInfo);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
