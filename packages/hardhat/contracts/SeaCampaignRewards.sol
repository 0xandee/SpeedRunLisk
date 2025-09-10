// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SeaCampaignRewards
 * @dev Smart contract for managing and distributing rewards for the Speedrun Lisk Campaign
 * @notice This contract handles automated reward distribution for campaign participants
 */
contract SeaCampaignRewards is Ownable, ReentrancyGuard, Pausable {
    
    // Reward types
    enum RewardType {
        TOP_QUALITY,
        TOP_ENGAGEMENT, 
        FAST_COMPLETION
    }
    
    // Reward structure
    struct Reward {
        address recipient;
        uint256 amount;
        RewardType rewardType;
        uint8 weekNumber;
        bool claimed;
        uint256 timestamp;
        bytes32 proofHash; // Hash of submission proof data
    }
    
    // State variables
    mapping(bytes32 => Reward) public rewards;
    mapping(address => uint256) public totalRewardsEarned;
    mapping(address => uint256) public totalRewardsClaimed;
    mapping(bytes32 => bool) public usedProofHashes;
    
    uint256 public totalRewardsAllocated;
    uint256 public totalRewardsPaid;
    uint256 constant public MAX_BUDGET = 2000 ether; // $2000 equivalent in ETH
    
    // Events
    event RewardAllocated(
        bytes32 indexed rewardId,
        address indexed recipient,
        uint256 amount,
        RewardType rewardType,
        uint8 weekNumber,
        bytes32 proofHash
    );
    
    event RewardClaimed(
        bytes32 indexed rewardId,
        address indexed recipient,
        uint256 amount
    );
    
    event BudgetDeposited(uint256 amount);
    event EmergencyWithdrawal(uint256 amount);
    
    constructor() {}
    
    /**
     * @dev Allocate rewards to participants (only owner/admin can call)
     * @param recipients Array of recipient addresses
     * @param amounts Array of reward amounts (in wei)
     * @param rewardTypes Array of reward types
     * @param weekNumbers Array of week numbers
     * @param proofHashes Array of proof hashes for submissions
     */
    function allocateRewards(
        address[] calldata recipients,
        uint256[] calldata amounts,
        RewardType[] calldata rewardTypes,
        uint8[] calldata weekNumbers,
        bytes32[] calldata proofHashes
    ) external onlyOwner whenNotPaused {
        require(
            recipients.length == amounts.length &&
            amounts.length == rewardTypes.length &&
            rewardTypes.length == weekNumbers.length &&
            weekNumbers.length == proofHashes.length,
            "Array lengths mismatch"
        );
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(
            totalRewardsAllocated + totalAmount <= MAX_BUDGET,
            "Exceeds maximum budget"
        );
        
        require(
            address(this).balance >= totalAmount,
            "Insufficient contract balance"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(weekNumbers[i] >= 1 && weekNumbers[i] <= 6, "Invalid week number");
            require(!usedProofHashes[proofHashes[i]], "Proof hash already used");
            
            bytes32 rewardId = keccak256(abi.encodePacked(
                recipients[i],
                amounts[i],
                rewardTypes[i],
                weekNumbers[i],
                block.timestamp,
                i
            ));
            
            rewards[rewardId] = Reward({
                recipient: recipients[i],
                amount: amounts[i],
                rewardType: rewardTypes[i],
                weekNumber: weekNumbers[i],
                claimed: false,
                timestamp: block.timestamp,
                proofHash: proofHashes[i]
            });
            
            totalRewardsEarned[recipients[i]] += amounts[i];
            usedProofHashes[proofHashes[i]] = true;
            totalRewardsAllocated += amounts[i];
            
            emit RewardAllocated(
                rewardId,
                recipients[i],
                amounts[i],
                rewardTypes[i],
                weekNumbers[i],
                proofHashes[i]
            );
        }
    }
    
    /**
     * @dev Claim a specific reward by reward ID
     * @param rewardId The ID of the reward to claim
     */
    function claimReward(bytes32 rewardId) external nonReentrant whenNotPaused {
        Reward storage reward = rewards[rewardId];
        
        require(reward.recipient == msg.sender, "Not the reward recipient");
        require(!reward.claimed, "Reward already claimed");
        require(reward.amount > 0, "Invalid reward");
        
        reward.claimed = true;
        totalRewardsClaimed[msg.sender] += reward.amount;
        totalRewardsPaid += reward.amount;
        
        (bool success, ) = payable(msg.sender).call{value: reward.amount}("");
        require(success, "Transfer failed");
        
        emit RewardClaimed(rewardId, msg.sender, reward.amount);
    }
    
    /**
     * @dev Claim all unclaimed rewards for the caller
     */
    function claimAllRewards() external nonReentrant whenNotPaused {
        uint256 totalToClaim = 0;
        bytes32[] memory rewardIds = getUserRewardIds(msg.sender);
        
        for (uint256 i = 0; i < rewardIds.length; i++) {
            Reward storage reward = rewards[rewardIds[i]];
            if (!reward.claimed && reward.amount > 0) {
                reward.claimed = true;
                totalToClaim += reward.amount;
                emit RewardClaimed(rewardIds[i], msg.sender, reward.amount);
            }
        }
        
        require(totalToClaim > 0, "No rewards to claim");
        
        totalRewardsClaimed[msg.sender] += totalToClaim;
        totalRewardsPaid += totalToClaim;
        
        (bool success, ) = payable(msg.sender).call{value: totalToClaim}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev Get available rewards for a user
     * @param user The user address
     * @return available The amount of unclaimed rewards
     */
    function getAvailableRewards(address user) external view returns (uint256 available) {
        available = totalRewardsEarned[user] - totalRewardsClaimed[user];
    }
    
    /**
     * @dev Get reward IDs for a user (simplified implementation)
     * Note: In production, this would be optimized with proper indexing
     */
    function getUserRewardIds(address user) public view returns (bytes32[] memory) {
        // This is a simplified implementation
        // In production, you'd want to maintain an index of user rewards
        bytes32[] memory userRewards = new bytes32[](0);
        // Implementation would require reward ID tracking per user
        return userRewards;
    }
    
    /**
     * @dev Get reward details by ID
     * @param rewardId The reward ID
     */
    function getReward(bytes32 rewardId) external view returns (
        address recipient,
        uint256 amount,
        RewardType rewardType,
        uint8 weekNumber,
        bool claimed,
        uint256 timestamp,
        bytes32 proofHash
    ) {
        Reward memory reward = rewards[rewardId];
        return (
            reward.recipient,
            reward.amount,
            reward.rewardType,
            reward.weekNumber,
            reward.claimed,
            reward.timestamp,
            reward.proofHash
        );
    }
    
    /**
     * @dev Fund the contract (only owner)
     */
    function fundContract() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
        emit BudgetDeposited(msg.value);
    }
    
    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 balance,
        uint256 totalAllocated,
        uint256 totalPaid,
        uint256 remainingBudget
    ) {
        balance = address(this).balance;
        totalAllocated = totalRewardsAllocated;
        totalPaid = totalRewardsPaid;
        remainingBudget = MAX_BUDGET - totalRewardsAllocated;
    }
    
    /**
     * @dev Pause the contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
        
        emit EmergencyWithdrawal(balance);
    }
    
    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {
        emit BudgetDeposited(msg.value);
    }
}