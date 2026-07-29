const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { run } = hre;
const {
  explorerAddressUrl,
  normalizeContractAddress,
  normalizeNetworkName,
} = require("./verify-input");

function readLatestDeployment() {
  const deploymentsDir = path.resolve(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    throw new Error("No deployments directory found");
  }

  const files = fs.readdirSync(deploymentsDir, { withFileTypes: true })
    .filter((entry) =>
      entry.isFile() &&
      /^[A-Za-z0-9._-]+\.json$/.test(entry.name) &&
      !entry.name.includes("abi")
    )
    .map((entry) => entry.name)
    .sort()
    .reverse();

  const latestFile = files[0];
  if (!latestFile) {
    throw new Error("No deployment file found");
  }

  const deploymentPath = path.resolve(deploymentsDir, latestFile);
  if (path.dirname(deploymentPath) !== deploymentsDir) {
    throw new Error("Unsafe deployment path");
  }
  const stat = fs.statSync(deploymentPath);
  if (!stat.isFile() || stat.size > 64 * 1024) {
    throw new Error("Invalid deployment file");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  return {
    contractAddress: normalizeContractAddress(deployment.contractAddress),
    networkName: normalizeNetworkName(deployment.network),
    fileName: latestFile,
  };
}

async function main() {
  console.log("🔍 Starting contract verification...\n");

  const args = process.argv.slice(2);
  if (args.length > 2) {
    throw new Error("Usage: npm run verify <CONTRACT_ADDRESS> [base|baseSepolia]");
  }

  let contractAddress: string;
  let networkName: "base" | "baseSepolia";
  if (args[0] === undefined) {
    const deployment = readLatestDeployment();
    contractAddress = deployment.contractAddress;
    networkName = deployment.networkName;
    console.log(`📄 Using latest deployment: ${deployment.fileName}`);
  } else {
    contractAddress = normalizeContractAddress(args[0]);
    networkName = normalizeNetworkName(args[1] ?? "baseSepolia");
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
    
    console.log(`   ${explorerAddressUrl(networkName, contractAddress)}`);
    
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract is already verified!");
      console.log(`🔗 ${explorerAddressUrl(networkName, contractAddress)}`);
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
