import { ethers, run } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ Please set CONTRACT_ADDRESS in .env file");
    process.exit(1);
  }
  
  console.log("🔍 Verifying contract on Etherscan...");
  console.log("📍 Contract address:", contractAddress);
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // No constructor arguments for this contract
    });
    
    console.log("✅ Contract verified successfully!");
    
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error);
      process.exit(1);
    }
  }
}

main()
  .then(() => {
    console.log("🎉 Verification completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification process failed:", error);
    process.exit(1);
  });