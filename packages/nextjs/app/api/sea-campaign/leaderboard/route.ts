import { NextRequest, NextResponse } from "next/server";
import { getLeaderboardForWeek, getSubmissionsByWeek } from "~~/services/database/repositories/seaCampaignSubmissions";

interface LeaderboardEntry {
  userAddress: string;
  country: string | null;
  submissionDate: Date;
  githubUrl: string;
  demoUrl: string | null;
  socialPostUrl: string;
  reviewStatus: string;
  completionTime?: number;
  socialEngagement?: number;
  qualityScore?: number;
}

// Mock function to calculate social engagement score
// TODO: Integrate with actual social media APIs (Twitter, etc.)
function calculateSocialEngagement(socialPostUrl: string): number {
  // This is a placeholder implementation
  // In a real implementation, you would:
  // 1. Extract post ID from URL
  // 2. Call social media APIs to get likes, retweets, comments
  // 3. Calculate engagement score based on these metrics

  // For now, return a random score for demonstration
  return Math.floor(Math.random() * 100) + 1;
}

// Mock function to calculate quality score
// TODO: Implement actual quality scoring based on:
// - Code quality analysis
// - Demo functionality
// - Documentation completeness
function calculateQualityScore(githubUrl: string, demoUrl: string | null, reviewStatus: string): number {
  // This is a placeholder implementation
  let score = 5; // Base score

  if (demoUrl) score += 2; // Bonus for having a demo
  if (reviewStatus === "APPROVED") score += 3; // Bonus for approved submissions
  if (githubUrl.includes("readme")) score += 1; // Bonus if likely has README

  // Add some randomness for demonstration
  score += Math.floor(Math.random() * 3);

  return Math.min(score, 10); // Cap at 10
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const week = searchParams.get("week");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!week) {
      return NextResponse.json({ error: "Week parameter required" }, { status: 400 });
    }

    const weekNumber = parseInt(week);
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 6) {
      return NextResponse.json({ error: "Invalid week number. Must be 1-6" }, { status: 400 });
    }

    // Get submissions for the week
    const submissions = await getLeaderboardForWeek(weekNumber, limit);

    // Calculate engagement and quality scores for each submission
    const leaderboard: LeaderboardEntry[] = submissions.map(submission => {
      const socialEngagement = calculateSocialEngagement(submission.socialPostUrl);
      const qualityScore = calculateQualityScore(submission.githubUrl, submission.demoUrl, submission.reviewStatus);

      // Calculate completion time in hours (mock data for now)
      const completionTime = Math.floor(Math.random() * 72) + 1; // 1-72 hours

      return {
        userAddress: submission.userAddress,
        country: submission.country,
        submissionDate: submission.submissionDate,
        githubUrl: submission.githubUrl,
        demoUrl: submission.demoUrl,
        socialPostUrl: submission.socialPostUrl,
        reviewStatus: submission.reviewStatus,
        completionTime,
        socialEngagement,
        qualityScore,
      };
    });

    // Sort by combined score (quality + engagement + speed bonus)
    leaderboard.sort((a, b) => {
      const scoreA = a.qualityScore! + a.socialEngagement! / 10 + (a.completionTime! < 24 ? 2 : 0);
      const scoreB = b.qualityScore! + b.socialEngagement! / 10 + (b.completionTime! < 24 ? 2 : 0);
      return scoreB - scoreA;
    });

    // Add ranking
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return NextResponse.json({
      week: weekNumber,
      leaderboard: rankedLeaderboard,
      totalSubmissions: leaderboard.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
