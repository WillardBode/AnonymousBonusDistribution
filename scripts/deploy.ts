import { ethers } from "hardhat";
import { AnonymousBonusDistribution } from "../types";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Starting Anonymous Bonus Distribution deployment...");
  
  const [deployer, admin] = await ethers.getSigners();
  
  console.log("📝 Deployment details:");
  console.log("- Deployer address:", deployer.address);
  console.log("- Admin address:", admin?.address || deployer.address);
  console.log("- Network:", (await ethers.provider.getNetwork()).name);
  console.log("- Chain ID:", (await ethers.provider.getNetwork()).chainId);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("- Deployer balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy the contract
  console.log("\n🔨 Deploying AnonymousBonusDistribution contract...");
  
  const AnonymousBonusDistribution = await ethers.getContractFactory("AnonymousBonusDistribution");
  const contract = await AnonymousBonusDistribution.deploy();
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log("\n✅ Contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const adminAddress = await contract.admin();
  console.log("- Contract admin:", adminAddress);
  console.log("- Current distribution ID:", (await contract.getCurrentDistributionId()).toString());
  
  // Set up additional managers if specified
  if (admin && admin.address !== deployer.address) {
    console.log("\n👑 Setting up additional manager...");
    const tx = await contract.setManagerAuthorization(admin.address, true);
    await tx.wait();
    console.log("- Additional manager authorized:", admin.address);
  }
  
  console.log("\n📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log("Contract Name: AnonymousBonusDistribution");
  console.log("Contract Address:", contractAddress);
  console.log("Transaction Hash:", contract.deploymentTransaction()?.hash);
  console.log("Block Number:", (await contract.deploymentTransaction()?.wait())?.blockNumber);
  console.log("Gas Used:", (await contract.deploymentTransaction()?.wait())?.gasUsed.toString());
  console.log("=".repeat(50));
  
  // Save deployment info
  const deploymentInfo = {
    contractName: "AnonymousBonusDistribution",
    contractAddress: contractAddress,
    deployer: deployer.address,
    admin: adminAddress,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    transactionHash: contract.deploymentTransaction()?.hash,
    blockNumber: (await contract.deploymentTransaction()?.wait())?.blockNumber
  };
  
  console.log("\n💾 Deployment info:", JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Verify the contract on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
  console.log("2. Update the contract address in frontend constants:");
  console.log(`   src/utils/constants.ts: CONTRACT_ADDRESS = "${contractAddress}"`);
  console.log("3. Authorize additional managers if needed:");
  console.log(`   contract.setManagerAuthorization("0x...", true)`);
  console.log("4. Test the deployment with basic operations");
  
  return contractAddress;
}

// Execute deployment
main()
  .then((contractAddress) => {
    console.log(`\n🎉 Deployment completed successfully! Contract: ${contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });