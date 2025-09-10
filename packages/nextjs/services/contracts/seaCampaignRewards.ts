import { ethers } from "ethers";
import { createSeaCampaignReward, updatePaymentStatus } from "~~/services/database/repositories/seaCampaignRewards";

// ABI for the SeaCampaignRewards contract
const SEA_CAMPAIGN_REWARDS_ABI = [
  "function allocateRewards(address[] recipients, uint256[] amounts, uint8[] rewardTypes, uint8[] weekNumbers, bytes32[] proofHashes) external",
  "function claimReward(bytes32 rewardId) external",
  "function claimAllRewards() external",
  "function getAvailableRewards(address user) external view returns (uint256)",
  "function getContractStats() external view returns (uint256 balance, uint256 totalAllocated, uint256 totalPaid, uint256 remainingBudget)",
  "function fundContract() external payable",
  "function pause() external",
  "function unpause() external",
  "event RewardAllocated(bytes32 indexed rewardId, address indexed recipient, uint256 amount, uint8 rewardType, uint8 weekNumber, bytes32 proofHash)",
  "event RewardClaimed(bytes32 indexed rewardId, address indexed recipient, uint256 amount)"
];

// Contract configuration - should be environment variables in production
const CONTRACT_CONFIG = {
  // This should be set after deployment
  address: process.env.SEA_CAMPAIGN_REWARDS_CONTRACT_ADDRESS || "",
  rpcUrl: process.env.LISK_SEPOLIA_RPC_URL || "https://rpc.sepolia-api.lisk.com",
  privateKey: process.env.ADMIN_PRIVATE_KEY || "", // Admin key for allocating rewards
};

// Enum values matching the smart contract
export enum RewardType {
  TOP_QUALITY = 0,
  TOP_ENGAGEMENT = 1,
  FAST_COMPLETION = 2
}

export interface RewardAllocation {
  recipient: string;
  amount: number; // Amount in USD
  rewardType: RewardType;
  weekNumber: number;
  proofHash: string;
}

/**
 * Get contract instance for read operations
 */
export function getRewardsContract(signerOrProvider?: ethers.Signer | ethers.providers.Provider) {
  if (!CONTRACT_CONFIG.address) {
    throw new Error("SeaCampaignRewards contract address not configured");
  }

  const provider = signerOrProvider || new ethers.providers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
  return new ethers.Contract(CONTRACT_CONFIG.address, SEA_CAMPAIGN_REWARDS_ABI, provider);
}

/**
 * Get contract instance for admin operations (with signer)
 */
export function getRewardsContractWithSigner() {
  if (!CONTRACT_CONFIG.privateKey) {
    throw new Error("Admin private key not configured");
  }

  const provider = new ethers.providers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
  const signer = new ethers.Wallet(CONTRACT_CONFIG.privateKey, provider);
  return getRewardsContract(signer);
}

/**
 * Allocate rewards on-chain and update database
 */
export async function allocateRewardsOnChain(allocations: RewardAllocation[]) {
  try {
    const contract = getRewardsContractWithSigner();

    // Convert USD amounts to ETH (simplified conversion - should use real price feed)
    const ETH_USD_RATE = 2000; // Approximate rate - use actual price feed in production
    
    const recipients = allocations.map(a => a.recipient);
    const amounts = allocations.map(a => ethers.utils.parseEther((a.amount / ETH_USD_RATE).toString()));
    const rewardTypes = allocations.map(a => a.rewardType);
    const weekNumbers = allocations.map(a => a.weekNumber);
    const proofHashes = allocations.map(a => ethers.utils.keccak256(ethers.utils.toUtf8Bytes(a.proofHash)));

    // Call smart contract
    const tx = await contract.allocateRewards(recipients, amounts, rewardTypes, weekNumbers, proofHashes);
    const receipt = await tx.wait();

    // Update database records
    for (let i = 0; i < allocations.length; i++) {
      const allocation = allocations[i];
      await createSeaCampaignReward({
        userAddress: allocation.recipient,
        weekNumber: allocation.weekNumber,
        rewardType: Object.keys(RewardType)[allocation.rewardType] as any,
        rewardAmount: allocation.amount.toString(),
        paymentStatus: "PENDING",
        paymentTxHash: tx.hash,
      });
    }

    return {
      success: true,
      transactionHash: tx.hash,
      gasUsed: receipt.gasUsed.toString(),
      allocatedCount: allocations.length
    };
  } catch (error) {
    console.error("Error allocating rewards on-chain:", error);
    throw error;
  }
}

/**
 * Get contract statistics
 */
export async function getContractStats() {
  try {
    const contract = getRewardsContract();
    const stats = await contract.getContractStats();
    
    return {
      balance: ethers.utils.formatEther(stats.balance),
      totalAllocated: ethers.utils.formatEther(stats.totalAllocated),
      totalPaid: ethers.utils.formatEther(stats.totalPaid),
      remainingBudget: ethers.utils.formatEther(stats.remainingBudget),
    };
  } catch (error) {
    console.error("Error getting contract stats:", error);
    throw error;
  }
}

/**
 * Get available rewards for a user
 */
export async function getUserAvailableRewards(userAddress: string) {
  try {
    const contract = getRewardsContract();
    const availableRewards = await contract.getAvailableRewards(userAddress);
    
    return {
      availableETH: ethers.utils.formatEther(availableRewards),
      availableUSD: parseFloat(ethers.utils.formatEther(availableRewards)) * 2000 // Approximate conversion
    };
  } catch (error) {
    console.error("Error getting user rewards:", error);
    throw error;
  }
}

/**
 * Fund the contract with additional budget
 */
export async function fundContract(amountETH: string) {
  try {
    const contract = getRewardsContractWithSigner();
    const amount = ethers.utils.parseEther(amountETH);
    
    const tx = await contract.fundContract({ value: amount });
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: tx.hash,
      gasUsed: receipt.gasUsed.toString(),
      amountFunded: amountETH
    };
  } catch (error) {
    console.error("Error funding contract:", error);
    throw error;
  }
}

/**
 * Listen to contract events and update database
 */
export function setupEventListeners() {
  const contract = getRewardsContract();

  // Listen for RewardAllocated events
  contract.on("RewardAllocated", async (rewardId, recipient, amount, rewardType, weekNumber, proofHash, event) => {
    console.log("RewardAllocated event:", {
      rewardId,
      recipient,
      amount: ethers.utils.formatEther(amount),
      rewardType,
      weekNumber,
      proofHash
    });
    
    // Update database with on-chain confirmation
    // This could be used to sync on-chain state with off-chain database
  });

  // Listen for RewardClaimed events
  contract.on("RewardClaimed", async (rewardId, recipient, amount, event) => {
    console.log("RewardClaimed event:", {
      rewardId,
      recipient,
      amount: ethers.utils.formatEther(amount)
    });
    
    // Update database records to mark as paid
    // This would require mapping rewardId to database records
  });
}

/**
 * Generate proof hash for reward allocation
 */
export function generateProofHash(userAddress: string, weekNumber: number, submissionId: number): string {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "uint8", "uint256", "uint256"],
      [userAddress, weekNumber, submissionId, Date.now()]
    )
  );
}

/**
 * Validate reward allocation before processing
 */
export function validateRewardAllocation(allocation: RewardAllocation): boolean {
  if (!ethers.utils.isAddress(allocation.recipient)) return false;
  if (allocation.amount <= 0) return false;
  if (allocation.weekNumber < 1 || allocation.weekNumber > 6) return false;
  if (!Object.values(RewardType).includes(allocation.rewardType)) return false;
  if (!allocation.proofHash) return false;
  
  return true;
}