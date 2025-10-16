const hre = require("hardhat");

async function main() {
  console.log("Testing Hardhat connection...");
  
  try {
    const signers = await hre.ethers.getSigners();
    console.log("Deployer address:", signers[0].address);
    
    const balance = await hre.ethers.provider.getBalance(signers[0].address);
    console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

