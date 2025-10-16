const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { run } = hre;

async function main() {
  console.log("🔍 Starting contract verification...\n");

  // Get contract address from command line argument or latest deployment
  const args = process.argv.slice(2);
  let contractAddress = args[0];
  let networkName = args[1] || "baseSepolia";

  if (!contractAddress) {
    // Try to read from latest deployment file
    const deploymentsDir = path.join(__dirname, "../deployments");
    
    if (fs.existsSync(deploymentsDir)) {
      const files = fs.readdirSync(deploymentsDir)
        .filter(f => f.endsWith('.json') && !f.includes('abi'))
        .sort()
        .reverse();
      
      if (files.length > 0) {
        const latestDeployment = JSON.parse(
          fs.readFileSync(path.join(deploymentsDir, files[0]), 'utf8')
        );
        contractAddress = latestDeployment.contractAddress;
        networkName = latestDeployment.network;
        console.log(`📄 Using latest deployment: ${files[0]}`);
      }
    }
  }

  if (!contractAddress) {
    console.error("❌ No contract address provided and no deployment found.");
    console.log("\nUsage:");
    console.log("  npm run verify <CONTRACT_ADDRESS> [NETWORK]");
    console.log("\nExample:");
    console.log("  npm run verify 0x1234... baseSepolia");
    process.exit(1);
  }

  console.log(`📍 Contract address: ${contractAddress}`);
  console.log(`🌐 Network: ${networkName}\n`);

  try {
    console.log("⏳ Verifying contract on block explorer...");
    console.log("This may take a minute...\n");

    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // ContentAuthenticityRegistry has no constructor args
      network: networkName,
    });

    console.log("\n✅ Contract verified successfully!");
    console.log(`🔗 View on explorer:`);
    
    if (networkName === "baseSepolia") {
      console.log(`   https://sepolia.basescan.org/address/${contractAddress}#code`);
    } else if (networkName === "base") {
      console.log(`   https://basescan.org/address/${contractAddress}#code`);
    }
    
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract is already verified!");
      if (networkName === "baseSepolia") {
        console.log(`🔗 https://sepolia.basescan.org/address/${contractAddress}#code`);
      } else if (networkName === "base") {
        console.log(`🔗 https://basescan.org/address/${contractAddress}#code`);
      }
    } else {
      console.error("\n❌ Verification failed:", error.message);
      console.log("\nTroubleshooting:");
      console.log("1. Ensure BASESCAN_API_KEY is set in .env.local");
      console.log("2. Wait a few minutes after deployment before verifying");
      console.log("3. Check that the contract address is correct");
      console.log("4. Verify the network is correct");
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

