import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { allocateRewardsOnChain, RewardType, generateProofHash, validateRewardAllocation } from "~~/services/contracts/seaCampaignRewards";
import { getSubmissionsByWeek } from "~~/services/database/repositories/seaCampaignSubmissions";
import { UserRole } from "~~/services/database/config/types";
import { authOptions } from "~~/utils/auth";

// Admin endpoint for processing reward distribution
export async function POST(req: NextRequest) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { weekNumber, rewardType, recipientAddresses } = await req.json();

    // Validation
    if (!weekNumber || weekNumber < 1 || weekNumber > 6) {
      return NextResponse.json({ error: "Invalid week number" }, { status: 400 });
    }

    if (!rewardType || !Object.keys(RewardType).includes(rewardType)) {
      return NextResponse.json({ error: "Invalid reward type" }, { status: 400 });
    }

    if (!recipientAddresses || !Array.isArray(recipientAddresses) || recipientAddresses.length === 0) {
      return NextResponse.json({ error: "Invalid recipients" }, { status: 400 });
    }

    // Get submissions for the week to validate recipients
    const weekSubmissions = await getSubmissionsByWeek(weekNumber);
    const validSubmissions = weekSubmissions.filter(s => 
      recipientAddresses.includes(s.userAddress) && s.reviewStatus === "APPROVED"
    );

    if (validSubmissions.length === 0) {
      return NextResponse.json({ error: "No valid submissions found for recipients" }, { status: 400 });
    }

    // Determine reward amounts based on type
    const rewardAmounts = getRewardAmounts(rewardType as keyof typeof RewardType, validSubmissions.length);

    // Create reward allocations
    const allocations = validSubmissions.slice(0, rewardAmounts.length).map((submission, index) => ({
      recipient: submission.userAddress,
      amount: rewardAmounts[index],
      rewardType: RewardType[rewardType as keyof typeof RewardType],
      weekNumber: weekNumber,
      proofHash: generateProofHash(submission.userAddress, weekNumber, submission.id)
    }));

    // Validate all allocations
    const invalidAllocations = allocations.filter(a => !validateRewardAllocation(a));
    if (invalidAllocations.length > 0) {
      return NextResponse.json({ 
        error: "Invalid allocations found",
        details: invalidAllocations 
      }, { status: 400 });
    }

    // Process rewards on-chain
    const result = await allocateRewardsOnChain(allocations);

    return NextResponse.json({
      success: true,
      message: `Processed ${allocations.length} ${rewardType} rewards for week ${weekNumber}`,
      transactionHash: result.transactionHash,
      allocatedCount: result.allocatedCount,
      totalAmount: allocations.reduce((sum, a) => sum + a.amount, 0),
      gasUsed: result.gasUsed
    });

  } catch (error) {
    console.error("Reward distribution error:", error);
    return NextResponse.json({ 
      error: "Failed to distribute rewards",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// Get reward contract statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Import here to avoid issues if contract is not configured
    const { getContractStats } = await import("~~/services/contracts/seaCampaignRewards");
    const stats = await getContractStats();

    return NextResponse.json({
      contractStats: stats,
      rewardStructure: {
        topQuality: { amount: 50, count: 10, description: "Top 10 quality submissions per week" },
        topEngagement: { amount: 50, count: 10, description: "Top 10 social engagement per week" },
        fastCompletion: { amount: 20, count: 50, description: "Next 50 fastest completions (Week 6 only)" }
      },
      weeklyLimits: {
        maxTopQuality: 10,
        maxTopEngagement: 10,
        maxFastCompletion: 50 // Only for week 6
      }
    });

  } catch (error) {
    console.error("Error getting reward stats:", error);
    return NextResponse.json({ 
      error: "Failed to get reward statistics",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

/**
 * Get reward amounts based on reward type and number of recipients
 */
function getRewardAmounts(rewardType: keyof typeof RewardType, recipientCount: number): number[] {
  switch (rewardType) {
    case 'TOP_QUALITY':
      // Top 10 quality submissions get $50 each
      return Array(Math.min(recipientCount, 10)).fill(50);
    
    case 'TOP_ENGAGEMENT':
      // Top 10 engagement submissions get $50 each
      return Array(Math.min(recipientCount, 10)).fill(50);
    
    case 'FAST_COMPLETION':
      // Next 50 fastest get $20 each (Week 6 only)
      return Array(Math.min(recipientCount, 50)).fill(20);
    
    default:
      throw new Error(`Unknown reward type: ${rewardType}`);
  }
}