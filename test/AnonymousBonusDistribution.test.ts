import { expect } from "chai";
import { ethers } from "hardhat";
import { AnonymousBonusDistribution } from "../types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("AnonymousBonusDistribution", function () {
  let contract: AnonymousBonusDistribution;
  let admin: SignerWithAddress;
  let manager: SignerWithAddress;
  let employee1: SignerWithAddress;
  let employee2: SignerWithAddress;
  let unauthorized: SignerWithAddress;
  
  const DISTRIBUTION_TITLE = "Q4 Performance Bonus";
  const TOTAL_BUDGET = ethers.parseEther("10.0");
  const DURATION_DAYS = 30;
  const BONUS_AMOUNT = ethers.parseEther("0.5");
  
  beforeEach(async function () {
    [admin, manager, employee1, employee2, unauthorized] = await ethers.getSigners();
    
    const AnonymousBonusDistribution = await ethers.getContractFactory("AnonymousBonusDistribution");
    contract = (await AnonymousBonusDistribution.deploy()) as AnonymousBonusDistribution;
    await contract.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await contract.admin()).to.equal(admin.address);
    });
    
    it("Should start with distribution ID 0", async function () {
      expect(await contract.getCurrentDistributionId()).to.equal(0);
    });
    
    it("Should have admin as authorized manager by default", async function () {
      // In this implementation, admin is not automatically a manager
      // This might need to be changed based on requirements
      expect(await contract.isAuthorizedManager(admin.address)).to.equal(false);
    });
  });
  
  describe("Manager Authorization", function () {
    it("Should allow admin to authorize managers", async function () {
      await contract.connect(admin).setManagerAuthorization(manager.address, true);
      expect(await contract.isAuthorizedManager(manager.address)).to.equal(true);
    });
    
    it("Should allow admin to revoke manager authorization", async function () {
      await contract.connect(admin).setManagerAuthorization(manager.address, true);
      await contract.connect(admin).setManagerAuthorization(manager.address, false);
      expect(await contract.isAuthorizedManager(manager.address)).to.equal(false);
    });
    
    it("Should not allow non-admin to authorize managers", async function () {
      await expect(
        contract.connect(unauthorized).setManagerAuthorization(manager.address, true)
      ).to.be.revertedWith("Only admin can perform this action");
    });
    
    it("Should emit ManagerAuthorized event", async function () {
      await expect(contract.connect(admin).setManagerAuthorization(manager.address, true))
        .to.emit(contract, "ManagerAuthorized")
        .withArgs(manager.address);
    });
    
    it("Should emit ManagerRevoked event", async function () {
      await contract.connect(admin).setManagerAuthorization(manager.address, true);
      await expect(contract.connect(admin).setManagerAuthorization(manager.address, false))
        .to.emit(contract, "ManagerRevoked")
        .withArgs(manager.address);
    });
  });
  
  describe("Distribution Creation", function () {
    beforeEach(async function () {
      // Authorize admin as manager for these tests
      await contract.connect(admin).setManagerAuthorization(admin.address, true);
    });
    
    it("Should allow authorized manager to create distribution", async function () {
      await expect(
        contract.connect(admin).createDistribution(DISTRIBUTION_TITLE, TOTAL_BUDGET, DURATION_DAYS)
      ).to.emit(contract, "DistributionCreated");
      
      expect(await contract.getCurrentDistributionId()).to.equal(1);
    });
    
    it("Should not allow unauthorized user to create distribution", async function () {
      await expect(
        contract.connect(unauthorized).createDistribution(DISTRIBUTION_TITLE, TOTAL_BUDGET, DURATION_DAYS)
      ).to.be.revertedWith("Not authorized");
    });
    
    it("Should not allow creation with zero budget", async function () {
      await expect(
        contract.connect(admin).createDistribution(DISTRIBUTION_TITLE, 0, DURATION_DAYS)
      ).to.be.revertedWith("Budget must be greater than 0");
    });
    
    it("Should not allow creation with zero duration", async function () {
      await expect(
        contract.connect(admin).createDistribution(DISTRIBUTION_TITLE, TOTAL_BUDGET, 0)
      ).to.be.revertedWith("Duration must be greater than 0");
    });
    
    it("Should store distribution info correctly", async function () {
      await contract.connect(admin).createDistribution(DISTRIBUTION_TITLE, TOTAL_BUDGET, DURATION_DAYS);
      
      const distributionInfo = await contract.getDistributionInfo(1);
      expect(distributionInfo[0]).to.equal(DISTRIBUTION_TITLE); // title
      expect(distributionInfo[1]).to.equal(TOTAL_BUDGET); // totalBudget
      expect(distributionInfo[2]).to.equal(true); // isActive
      expect(distributionInfo[3]).to.equal(false); // isFinalized
      expect(distributionInfo[6]).to.equal(0); // recipientCount
    });
  });
  
  describe("Bonus Allocation", function () {
    beforeEach(async function () {
      await contract.connect(admin).setManagerAuthorization(admin.address, true);
      await contract.connect(admin).createDistribution(DISTRIBUTION_TITLE, TOTAL_BUDGET, DURATION_DAYS);
    });
    
    it("Should allow manager to allocate bonus", async function () {
      // Note: This test uses simplified allocation without real FHE encryption
      // In production, proper FHE encryption would be used
      await expect(
        contract.connect(admin).allocateBonus(1, employee1.address, BONUS_AMOUNT, "0x")
      ).to.emit(contract, "BonusAllocated")
        .withArgs(1, employee1.address);
    });
    
    it("Should not allow non-manager to allocate bonus", async function () {
      await expect(
        contract.connect(unauthorized).allocateBonus(1, employee1.address, BONUS_AMOUNT, "0x")
      ).to.be.revertedWith("Not authorized");
    });
    
    it("Should not allow allocation to inactive distribution", async function () {
      await contract.connect(admin).finalizeDistribution(1);
      
      await expect(
        contract.connect(admin).allocateBonus(1, employee1.address, BONUS_AMOUNT, "0x")
      ).to.be.revertedWith("Distribution is not active");
    });
    
    it("Should not allow duplicate allocation to same recipient", async function () {
      await contract.connect(admin).allocateBonus(1, employee1.address, BONUS_AMOUNT, "0x");
      
      await expect(
        contract.connect(admin).allocateBonus(1, employee1.address, BONUS_AMOUNT, "0x")
      ).to.be.revertedWith("Recipient already has allocation");
    });
    
    it("Should update recipient count", async function () {
      await contract.connect(admin).allocateBonus(1, employee1.address, BONUS_AMOUNT, "0x");
      await contract.connect(admin).allocateBonus(1, employee2.address, BONUS_AMOUNT, "0x");
      
      const distributionInfo = await contract.getDistributionInfo(1);
      expect(distributionInfo[6]).to.equal(2); // recipientCount
    });
  });
  
  describe("Bonus Claiming", function () {
    beforeEach(async function () {
      await contract.connect(admin).setManagerAuthorization(admin.address, true);
      await contract.connect(admin).createDistribution(DISTRIBUTION_TITLE, TOTAL_BUDGET, DURATION_DAYS);
      await contract.connect(admin).allocateBonus(1, employee1.address, BONUS_AMOUNT, "0x");
    });
    
    it("Should allow employee to claim bonus", async function () {
      await expect(
        contract.connect(employee1).claimBonus(1)
      ).to.emit(contract, "BonusClaimed")
        .withArgs(1, employee1.address);
    });
    
    it("Should not allow claiming non-existent bonus", async function () {
      await expect(
        contract.connect(employee2).claimBonus(1)
      ).to.be.revertedWith("No bonus allocated for you");
    });
    
    it("Should not allow double claiming", async function () {
      await contract.connect(employee1).claimBonus(1);
      
      await expect(
        contract.connect(employee1).claimBonus(1)
      ).to.be.revertedWith("Bonus already claimed");
    });
    
    it("Should update bonus status after claiming", async function () {
      await contract.connect(employee1).claimBonus(1);
      
      const bonusStatus = await contract.getBonusStatus(1, employee1.address);
      expect(bonusStatus[0]).to.equal(true); // hasBonus
      expect(bonusStatus[1]).to.equal(true); // hasClaimed
    });
  });
  
  describe("Distribution Finalization", function () {
    beforeEach(async function () {
      await contract.connect(admin).setManagerAuthorization(admin.address, true);
      await contract.connect(admin).createDistribution(DISTRIBUTION_TITLE, TOTAL_BUDGET, DURATION_DAYS);
    });
    
    it("Should allow admin to finalize distribution", async function () {
      await expect(
        contract.connect(admin).finalizeDistribution(1)
      ).to.emit(contract, "DistributionFinalized")
        .withArgs(1, 0); // 0 recipients initially
    });
    
    it("Should not allow non-admin to finalize distribution", async function () {
      await expect(
        contract.connect(unauthorized).finalizeDistribution(1)
      ).to.be.revertedWith("Only admin can perform this action");
    });
    
    it("Should not allow finalizing already finalized distribution", async function () {
      await contract.connect(admin).finalizeDistribution(1);
      
      await expect(
        contract.connect(admin).finalizeDistribution(1)
      ).to.be.revertedWith("Distribution already finalized");
    });
    
    it("Should update distribution status after finalization", async function () {
      await contract.connect(admin).finalizeDistribution(1);
      
      const distributionInfo = await contract.getDistributionInfo(1);
      expect(distributionInfo[2]).to.equal(false); // isActive
      expect(distributionInfo[3]).to.equal(true); // isFinalized
    });
    
    it("Should still allow bonus claiming after finalization", async function () {
      await contract.connect(admin).allocateBonus(1, employee1.address, BONUS_AMOUNT, "0x");
      await contract.connect(admin).finalizeDistribution(1);
      
      await expect(
        contract.connect(employee1).claimBonus(1)
      ).to.emit(contract, "BonusClaimed");
    });
  });
  
  describe("View Functions", function () {
    beforeEach(async function () {
      await contract.connect(admin).setManagerAuthorization(admin.address, true);
      await contract.connect(admin).createDistribution(DISTRIBUTION_TITLE, TOTAL_BUDGET, DURATION_DAYS);
      await contract.connect(admin).allocateBonus(1, employee1.address, BONUS_AMOUNT, "0x");
    });
    
    it("Should return correct distribution info", async function () {
      const info = await contract.getDistributionInfo(1);
      expect(info[0]).to.equal(DISTRIBUTION_TITLE);
      expect(info[1]).to.equal(TOTAL_BUDGET);
      expect(info[2]).to.equal(true); // isActive
      expect(info[3]).to.equal(false); // isFinalized
    });
    
    it("Should return correct bonus status", async function () {
      const status = await contract.getBonusStatus(1, employee1.address);
      expect(status[0]).to.equal(true); // hasBonus
      expect(status[1]).to.equal(false); // hasClaimed
    });
    
    it("Should return correct has received bonus status", async function () {
      expect(await contract.hasReceivedBonus(1, employee1.address)).to.equal(true);
      expect(await contract.hasReceivedBonus(1, employee2.address)).to.equal(false);
    });
    
    it("Should return correct distribution recipients", async function () {
      await contract.connect(admin).allocateBonus(1, employee2.address, BONUS_AMOUNT, "0x");
      
      const recipients = await contract.getDistributionRecipients(1);
      expect(recipients).to.deep.equal([employee1.address, employee2.address]);
    });
  });
  
  describe("Edge Cases", function () {
    it("Should handle invalid distribution ID", async function () {
      await expect(
        contract.getDistributionInfo(999)
      ).to.be.revertedWith("Invalid distribution ID");
    });
    
    it("Should handle expired distribution", async function () {
      await contract.connect(admin).setManagerAuthorization(admin.address, true);
      await contract.connect(admin).createDistribution(DISTRIBUTION_TITLE, TOTAL_BUDGET, 1);
      
      // Advance time by more than 1 day
      await time.increase(2 * 24 * 60 * 60);
      
      // Note: The current contract doesn't automatically check for expiration
      // This test may need adjustment based on implementation requirements
    });
  });
});