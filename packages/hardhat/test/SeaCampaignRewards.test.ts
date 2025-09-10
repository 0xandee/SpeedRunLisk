import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { SeaCampaignRewards } from "../typechain-types";

describe("SeaCampaignRewards", function () {
  let seaCampaignRewards: SeaCampaignRewards;
  let owner: SignerWithAddress;
  let participant1: SignerWithAddress;
  let participant2: SignerWithAddress;
  let participant3: SignerWithAddress;

  const REWARD_AMOUNT = ethers.utils.parseEther("0.025"); // $50 equivalent at $2000/ETH
  const WEEK_1 = 1;
  const WEEK_2 = 2;
  const RewardType = { TOP_QUALITY: 0, TOP_ENGAGEMENT: 1, FAST_COMPLETION: 2 };

  beforeEach(async function () {
    [owner, participant1, participant2, participant3] = await ethers.getSigners();

    const SeaCampaignRewardsFactory = await ethers.getContractFactory("SeaCampaignRewards");
    seaCampaignRewards = await SeaCampaignRewardsFactory.deploy();
    await seaCampaignRewards.deployed();

    // Fund the contract
    await seaCampaignRewards.fundContract({ value: ethers.utils.parseEther("1.0") });
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await seaCampaignRewards.owner()).to.equal(owner.address);
    });

    it("Should have correct initial state", async function () {
      const stats = await seaCampaignRewards.getContractStats();
      expect(stats.totalAllocated).to.equal(0);
      expect(stats.totalPaid).to.equal(0);
    });
  });

  describe("Reward Allocation", function () {
    it("Should allocate rewards correctly", async function () {
      const recipients = [participant1.address, participant2.address];
      const amounts = [REWARD_AMOUNT, REWARD_AMOUNT];
      const rewardTypes = [RewardType.TOP_QUALITY, RewardType.TOP_QUALITY];
      const weekNumbers = [WEEK_1, WEEK_1];
      const proofHashes = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof1")),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof2"))
      ];

      await expect(
        seaCampaignRewards.allocateRewards(recipients, amounts, rewardTypes, weekNumbers, proofHashes)
      )
        .to.emit(seaCampaignRewards, "RewardAllocated")
        .withArgs(
          ethers.utils.keccak256("0x"), // rewardId (calculated)
          participant1.address,
          REWARD_AMOUNT,
          RewardType.TOP_QUALITY,
          WEEK_1,
          proofHashes[0]
        );

      // Check total rewards earned
      expect(await seaCampaignRewards.totalRewardsEarned(participant1.address)).to.equal(REWARD_AMOUNT);
      expect(await seaCampaignRewards.totalRewardsEarned(participant2.address)).to.equal(REWARD_AMOUNT);

      // Check available rewards
      expect(await seaCampaignRewards.getAvailableRewards(participant1.address)).to.equal(REWARD_AMOUNT);
    });

    it("Should reject allocation with mismatched array lengths", async function () {
      const recipients = [participant1.address];
      const amounts = [REWARD_AMOUNT, REWARD_AMOUNT]; // Mismatched length
      const rewardTypes = [RewardType.TOP_QUALITY];
      const weekNumbers = [WEEK_1];
      const proofHashes = [ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof1"))];

      await expect(
        seaCampaignRewards.allocateRewards(recipients, amounts, rewardTypes, weekNumbers, proofHashes)
      ).to.be.revertedWith("Array lengths mismatch");
    });

    it("Should reject allocation that exceeds budget", async function () {
      const hugeAmount = ethers.utils.parseEther("3000"); // Exceeds MAX_BUDGET
      const recipients = [participant1.address];
      const amounts = [hugeAmount];
      const rewardTypes = [RewardType.TOP_QUALITY];
      const weekNumbers = [WEEK_1];
      const proofHashes = [ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof1"))];

      await expect(
        seaCampaignRewards.allocateRewards(recipients, amounts, rewardTypes, weekNumbers, proofHashes)
      ).to.be.revertedWith("Exceeds maximum budget");
    });

    it("Should reject allocation with invalid week number", async function () {
      const recipients = [participant1.address];
      const amounts = [REWARD_AMOUNT];
      const rewardTypes = [RewardType.TOP_QUALITY];
      const weekNumbers = [7]; // Invalid week number
      const proofHashes = [ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof1"))];

      await expect(
        seaCampaignRewards.allocateRewards(recipients, amounts, rewardTypes, weekNumbers, proofHashes)
      ).to.be.revertedWith("Invalid week number");
    });

    it("Should reject duplicate proof hashes", async function () {
      const proofHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof1"));
      
      // First allocation should succeed
      await seaCampaignRewards.allocateRewards(
        [participant1.address],
        [REWARD_AMOUNT],
        [RewardType.TOP_QUALITY],
        [WEEK_1],
        [proofHash]
      );

      // Second allocation with same proof hash should fail
      await expect(
        seaCampaignRewards.allocateRewards(
          [participant2.address],
          [REWARD_AMOUNT],
          [RewardType.TOP_QUALITY],
          [WEEK_1],
          [proofHash]
        )
      ).to.be.revertedWith("Proof hash already used");
    });
  });

  describe("Reward Claiming", function () {
    beforeEach(async function () {
      // Allocate a reward to participant1
      const recipients = [participant1.address];
      const amounts = [REWARD_AMOUNT];
      const rewardTypes = [RewardType.TOP_QUALITY];
      const weekNumbers = [WEEK_1];
      const proofHashes = [ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof1"))];

      await seaCampaignRewards.allocateRewards(recipients, amounts, rewardTypes, weekNumbers, proofHashes);
    });

    it("Should allow participants to claim rewards", async function () {
      const initialBalance = await participant1.getBalance();
      
      // This is a simplified test - in practice, you'd need the actual rewardId
      // For now, we test the claimAllRewards function
      await expect(seaCampaignRewards.connect(participant1).claimAllRewards())
        .to.emit(seaCampaignRewards, "RewardClaimed");

      // Check that available rewards is now 0
      expect(await seaCampaignRewards.getAvailableRewards(participant1.address)).to.equal(0);
      
      // Check that total claimed amount is correct
      expect(await seaCampaignRewards.totalRewardsClaimed(participant1.address)).to.equal(REWARD_AMOUNT);
    });

    it("Should reject claiming with no rewards", async function () {
      await expect(
        seaCampaignRewards.connect(participant2).claimAllRewards()
      ).to.be.revertedWith("No rewards to claim");
    });
  });

  describe("Contract Management", function () {
    it("Should allow owner to fund contract", async function () {
      const fundAmount = ethers.utils.parseEther("0.5");
      
      await expect(seaCampaignRewards.fundContract({ value: fundAmount }))
        .to.emit(seaCampaignRewards, "BudgetDeposited")
        .withArgs(fundAmount);
    });

    it("Should allow owner to pause/unpause", async function () {
      await seaCampaignRewards.pause();
      
      // Should reject operations when paused
      await expect(
        seaCampaignRewards.allocateRewards(
          [participant1.address],
          [REWARD_AMOUNT],
          [RewardType.TOP_QUALITY],
          [WEEK_1],
          [ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof1"))]
        )
      ).to.be.revertedWith("Pausable: paused");

      await seaCampaignRewards.unpause();
      
      // Should work again after unpause
      await expect(
        seaCampaignRewards.allocateRewards(
          [participant1.address],
          [REWARD_AMOUNT],
          [RewardType.TOP_QUALITY],
          [WEEK_1],
          [ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof1"))]
        )
      ).to.not.be.reverted;
    });

    it("Should allow emergency withdrawal by owner", async function () {
      const ownerInitialBalance = await owner.getBalance();
      const contractBalance = await ethers.provider.getBalance(seaCampaignRewards.address);
      
      await expect(seaCampaignRewards.emergencyWithdraw())
        .to.emit(seaCampaignRewards, "EmergencyWithdrawal")
        .withArgs(contractBalance);
    });

    it("Should reject non-owner operations", async function () {
      await expect(
        seaCampaignRewards.connect(participant1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        seaCampaignRewards.connect(participant1).emergencyWithdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Contract Statistics", function () {
    it("Should return correct contract statistics", async function () {
      const stats = await seaCampaignRewards.getContractStats();
      
      expect(stats.balance).to.equal(ethers.utils.parseEther("1.0")); // Initial funding
      expect(stats.totalAllocated).to.equal(0);
      expect(stats.totalPaid).to.equal(0);
      expect(stats.remainingBudget).to.equal(ethers.utils.parseEther("2000")); // MAX_BUDGET
    });
  });
});