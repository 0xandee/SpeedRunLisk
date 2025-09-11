import { NextRequest, NextResponse } from "next/server";
import {
  getProgressByUser,
  markAsParticipant,
  updateWeekCompletion,
} from "~~/services/database/repositories/seaCampaignProgress";
import {
  createSeaCampaignSubmission,
  getSubmissionByUserAndWeek,
} from "~~/services/database/repositories/seaCampaignSubmissions";
import { SeaCampaignSubmissionStatus } from "~~/services/database/config/types";
import { getUserByAddress } from "~~/services/database/repositories/users";
import { getWeekFromChallengeId, isSeaCampaignChallenge } from "~~/utils/sea-challenges";

export type SeaCampaignSubmitPayload = {
  weekNumber: number;
  challengeId: string;
  userAddress: string;
  githubUrl: string;
  contractAddress?: string;
  txHash?: string;
  demoUrl?: string;
  socialPostUrl: string;
  country?: string;
  telegramHandle?: string;
  payoutWallet?: string;
};

export async function POST(req: NextRequest) {
  try {
    const {
      weekNumber,
      challengeId,
      userAddress,
      githubUrl,
      contractAddress,
      txHash,
      demoUrl,
      socialPostUrl,
      country,
      telegramHandle,
      payoutWallet,
    } = (await req.json()) as SeaCampaignSubmitPayload;

    // Validation
    if (!userAddress || !weekNumber || !githubUrl || !socialPostUrl || !challengeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate this is a SEA campaign challenge
    if (!isSeaCampaignChallenge(challengeId)) {
      return NextResponse.json({ error: "Invalid SEA campaign challenge ID" }, { status: 400 });
    }

    // Validate week number matches challenge ID
    const expectedWeek = getWeekFromChallengeId(challengeId);
    if (expectedWeek !== weekNumber) {
      return NextResponse.json(
        {
          error: `Week number mismatch. Challenge ${challengeId} is for week ${expectedWeek}`,
        },
        { status: 400 },
      );
    }

    // Check if user exists
    const user = await getUserByAddress(userAddress);
    if (!user) {
      return NextResponse.json({ error: "User not found. Please register first." }, { status: 404 });
    }

    // Check for existing submission for this week
    const existingSubmission = await getSubmissionByUserAndWeek(userAddress, weekNumber);
    if (existingSubmission) {
      return NextResponse.json(
        {
          error: `You have already submitted for week ${weekNumber}. You cannot submit multiple times for the same week.`,
        },
        { status: 400 },
      );
    }

    // Ensure user is marked as SEA campaign participant
    await markAsParticipant(userAddress);

    // Create the submission using exact user address from database
    const submission = await createSeaCampaignSubmission({
      userAddress: user.userAddress, // Use exact case from database
      weekNumber,
      githubUrl,
      contractAddress,
      txHash,
      demoUrl,
      socialPostUrl,
      country,
      telegramHandle,
      payoutWallet,
      reviewStatus: SeaCampaignSubmissionStatus.SUBMITTED,
    });

    if (!submission) {
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
    }

    // Update user's progress
    try {
      await updateWeekCompletion(user.userAddress, weekNumber);
    } catch (error) {
      console.error("Failed to update week completion:", error);
      // Don't fail the request, just log the error
    }

    // Get updated progress for response
    const updatedProgress = await getProgressByUser(user.userAddress);

    return NextResponse.json({
      success: true,
      message: "Challenge submitted successfully! 🎉",
      submission: {
        id: submission.id,
        weekNumber: submission.weekNumber,
        reviewStatus: submission.reviewStatus,
        submissionDate: submission.submissionDate,
      },
      progress: {
        totalWeeksCompleted: updatedProgress?.totalWeeksCompleted || 0,
        isGraduated: updatedProgress?.isGraduated || false,
        nextWeek: updatedProgress?.totalWeeksCompleted === 6 ? null : (updatedProgress?.totalWeeksCompleted || 0) + 1,
      },
    });
  } catch (error) {
    console.error("Error submitting SEA campaign challenge:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
