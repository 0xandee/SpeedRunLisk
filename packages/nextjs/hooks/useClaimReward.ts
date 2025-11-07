import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

/**
 * Hook to interact with the WhitelistClaim contract
 * Provides claim functionality and status checks for leaderboard rewards
 */
export const useClaimReward = () => {
  const { address } = useAccount();

  // Read user's allocation from the contract
  const { data: allocation, refetch: refetchAllocation } = useScaffoldReadContract({
    contractName: "WhitelistClaim",
    functionName: "getAllocation",
    args: [address as string],
    chainId: 1135, // Lisk Mainnet
    query: {
      enabled: !!address,
    },
  });

  // Check if user has already claimed
  const { data: hasClaimed, refetch: refetchHasClaimed } = useScaffoldReadContract({
    contractName: "WhitelistClaim",
    functionName: "hasClaimed",
    args: [address as string],
    chainId: 1135, // Lisk Mainnet
    query: {
      enabled: !!address,
    },
  });

  // Write hook for claiming tokens
  const { writeContractAsync: claimAsync, isPending: isClaimPending } = useScaffoldWriteContract({
    contractName: "WhitelistClaim",
    chainId: 1135, // Lisk Mainnet
  });

  // Claim function
  const claim = async () => {
    try {
      const result = await claimAsync({
        functionName: "claim",
      });

      // Refetch data after claim
      await Promise.all([refetchAllocation(), refetchHasClaimed()]);

      return result;
    } catch (error) {
      console.error("Claim error:", error);
      throw error;
    }
  };

  // Convert allocation from Wei to ETH for display
  const allocationInLSK = allocation ? formatEther(allocation) : "0";

  return {
    allocation: allocation || 0n,
    allocationInLSK,
    hasClaimed: hasClaimed || false,
    isEligible: allocation ? allocation > 0n : false,
    claim,
    isClaimPending,
    refetch: () => Promise.all([refetchAllocation(), refetchHasClaimed()]),
  };
};
