import { NextRequest, NextResponse } from "next/server";
import { getProgressByUser } from "~~/services/database/repositories/seaCampaignProgress";
import { getRewardsByUser, getUserTotalRewards } from "~~/services/database/repositories/seaCampaignRewards";
import { getSubmissionsByUser } from "~~/services/database/repositories/seaCampaignSubmissions";
import { getUserByAddress } from "~~/services/database/repositories/users";
import { SEA_CAMPAIGN_METADATA } from "~~/utils/sea-challenges";

export async function GET(req: NextRequest, props: { params: Promise<{ userAddress: string }> }) {
  const params = await props.params;

  try {
    const { userAddress } = params;

    if (!userAddress) {
      return NextResponse.json({ error: "User address is required" }, { status: 400 });
    }

    // Validate user exists
    const user = await getUserByAddress(userAddress);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's SEA campaign data
    const [progress, submissions, rewards, totalRewards] = await Promise.all([
      getProgressByUser(userAddress),
      getSubmissionsByUser(userAddress),
      getRewardsByUser(userAddress),
      getUserTotalRewards(userAddress),
    ]);

    // Build weekly progress summary
    const weeklyProgress = Array.from({ length: 6 }, (_, i) => {
      const weekNumber = i + 1;
      const weekKey = `week${weekNumber}Completed`;
      const submission = submissions.find(s => s.weekNumber === weekNumber);
      const challengeId = Object.keys(SEA_CAMPAIGN_METADATA)[i];
      const challengeMetadata = SEA_CAMPAIGN_METADATA[challengeId as keyof typeof SEA_CAMPAIGN_METADATA];

      return {
        weekNumber,
        challengeId,
        title: challengeMetadata.title,
        dueDate: challengeMetadata.dueDate,
        completed: progress ? (progress[weekKey as keyof typeof progress] as boolean) : false,
        submission: submission
          ? {
              id: submission.id,
              submissionDate: submission.submissionDate,
              reviewStatus: submission.reviewStatus,
              githubUrl: submission.githubUrl,
              demoUrl: submission.demoUrl,
              socialPostUrl: submission.socialPostUrl,
              mentorFeedback: submission.mentorFeedback,
            }
          : null,
        isOverdue: new Date() > new Date(challengeMetadata.dueDate),
      };
    });

    // Calculate completion percentage
    const completedWeeks = weeklyProgress.filter(w => w.completed).length;
    const completionPercentage = Math.round((completedWeeks / 6) * 100);

    // Get next week to work on
    const nextWeek = weeklyProgress.find(w => !w.completed);

    return NextResponse.json({
      userAddress,
      isParticipant: !!progress,
      registrationDate: progress?.registrationDate || null,
      progress: {
        totalWeeksCompleted: progress?.totalWeeksCompleted || 0,
        completionPercentage,
        isGraduated: progress?.isGraduated || false,
        graduationDate: progress?.graduationDate || null,
        totalBonusEarned: parseFloat(progress?.totalBonusEarned || "0"),
      },
      weeklyProgress,
      nextWeek: nextWeek
        ? {
            weekNumber: nextWeek.weekNumber,
            title: nextWeek.title,
            dueDate: nextWeek.dueDate,
            challengeId: nextWeek.challengeId,
          }
        : null,
      rewards: {
        total: totalRewards,
        recentRewards: rewards.slice(0, 5), // Last 5 rewards
      },
      stats: {
        totalSubmissions: submissions.length,
        approvedSubmissions: submissions.filter(s => s.reviewStatus === "APPROVED").length,
        pendingSubmissions: submissions.filter(s => s.reviewStatus === "SUBMITTED").length,
        rejectedSubmissions: submissions.filter(s => s.reviewStatus === "REJECTED").length,
      },
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
