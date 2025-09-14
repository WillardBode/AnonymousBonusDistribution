import { ethers } from "hardhat";
import { AnonymousBonusDistribution } from "../types";
import * as dotenv from "dotenv";

dotenv.config();

// Manager addresses to authorize (update these with real addresses)
const MANAGERS = [
  "0xeC6881Fd6E8818Ec543579B95445eBC7050aF677", // Replace with real manager addresses
  "0xeC6881Fd6E8818Ec543579B95445eBC7050aF677",
];

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ Please set CONTRACT_ADDRESS in .env file");
    process.exit(1);
  }
  
  console.log("⚙️ Setting up Anonymous Bonus Distribution contract...");
  console.log("📍 Contract address:", contractAddress);
  
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Using account:", deployer.address);
  
  // Get contract instance
  const contract = (await ethers.getContractAt(
    "AnonymousBonusDistribution",
    contractAddress
  )) as AnonymousBonusDistribution;
  
  // Verify contract is accessible
  const admin = await contract.admin();
  console.log("👑 Current admin:", admin);
  
  if (admin.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error("❌ You are not the admin of this contract");
    process.exit(1);
  }
  
  console.log("\n🎯 Authorizing managers...");
  
  for (const managerAddress of MANAGERS) {
    try {
      console.log(`- Authorizing manager: ${managerAddress}`);
      
      // Check if already authorized
      const isAlreadyAuthorized = await contract.isAuthorizedManager(managerAddress);
      
      if (isAlreadyAuthorized) {
        console.log(`  ✅ Already authorized`);
        continue;
      }
      
      // Authorize the manager
      const tx = await contract.setManagerAuthorization(managerAddress, true);
      await tx.wait();
      
      // Verify authorization
      const isAuthorized = await contract.isAuthorizedManager(managerAddress);
      
      if (isAuthorized) {
        console.log(`  ✅ Successfully authorized`);
      } else {
        console.log(`  ❌ Authorization failed`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error authorizing ${managerAddress}:`, error);
    }
  }
  
  console.log("\n📊 Current contract state:");
  console.log("- Admin:", await contract.admin());
  console.log("- Current Distribution ID:", (await contract.getCurrentDistributionId()).toString());
  
  console.log("\n👑 Authorized managers:");
  for (const managerAddress of MANAGERS) {
    const isAuthorized = await contract.isAuthorizedManager(managerAddress);
    console.log(`- ${managerAddress}: ${isAuthorized ? '✅' : '❌'}`);
  }
  
  console.log("\n🎯 Setup completed! Next steps:");
  console.log("1. Update frontend with the contract address");
  console.log("2. Test manager functions with authorized addresses");
  console.log("3. Create test distributions to verify functionality");
}

main()
  .then(() => {
    console.log("\n🎉 Setup completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });