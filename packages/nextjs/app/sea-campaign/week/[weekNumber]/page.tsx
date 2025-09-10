"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { SeaSubmissionForm } from "~~/app/_components/sea-campaign/SeaSubmissionForm";
import { WeeklyLeaderboard } from "~~/app/_components/sea-campaign/WeeklyLeaderboard";
import { SEA_CAMPAIGN_METADATA, getChallengeByWeek } from "~~/utils/sea-challenges";

interface WeeklyProgress {
  weekNumber: number;
  completed: boolean;
  submission?: {
    id: number;
    submissionDate: string;
    reviewStatus: string;
    mentorFeedback?: string;
  };
}

interface LeaderboardEntry {
  rank: number;
  userAddress: string;
  country: string | null;
  submissionDate: string;
  githubUrl: string;
  demoUrl: string | null;
  socialPostUrl: string;
  reviewStatus: string;
  completionTime?: number;
  socialEngagement?: number;
  qualityScore?: number;
}

interface LeaderboardData {
  week: number;
  leaderboard: LeaderboardEntry[];
  totalSubmissions: number;
  lastUpdated: string;
}

export default function WeeklyChallengePage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const weekNumber = parseInt(params.weekNumber as string);
  const challenge = getChallengeByWeek(weekNumber);

  const fetchUserProgress = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/sea-campaign/progress/${address}`);
      if (response.ok) {
        const data = await response.json();
        const weekProgress = data.weeklyProgress?.find((w: WeeklyProgress) => w.weekNumber === weekNumber);
        setWeeklyProgress(weekProgress || null);
      }
    } catch (error) {
      console.error("Failed to fetch user progress:", error);
    } finally {
      setLoading(false);
    }
  }, [address, weekNumber]);

  useEffect(() => {
    if (address && challenge) {
      fetchUserProgress();
    }
  }, [address, challenge, fetchUserProgress]);

  useEffect(() => {
    fetchLeaderboard();
  }, [weekNumber]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sea-campaign/leaderboard?week=${weekNumber}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionSuccess = () => {
    fetchUserProgress(); // Refresh progress after successful submission
  };

  if (!challenge) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-error mb-4">Challenge Not Found</h1>
        <p className="text-base-content/70 mb-6">
          Week {weekNumber} challenge does not exist. Please check the week number.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  const isOverdue = new Date() > new Date(challenge.dueDate);
  const canSubmit = isConnected && !weeklyProgress?.completed && !isOverdue;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="breadcrumbs text-sm mb-4">
          <ul>
            <li>
              <Link href="/" className="link">
                Home
              </Link>
            </li>
            <li>Week {weekNumber}</li>
          </ul>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">{challenge.title}</h1>
            <p className="text-lg text-base-content/70">{challenge.description}</p>
          </div>

          {/* {weeklyProgress?.completed && (
            <div className="alert alert-success max-w-sm">
              <span>✅ Completed!</span>
            </div>
          )} */}
        </div>

        {/* <div className="flex flex-wrap gap-4 mb-6">
          <div className="badge badge-primary badge-lg">Due: {challenge.dueDate}</div>
          <div className="badge badge-secondary badge-lg">{challenge.reward}</div>
          {challenge.topPerformersBonus > 0 && (
            <div className="badge badge-warning badge-lg">
              💰 Top 10: ${challenge.topPerformersBonus} each
            </div>
          )}
          {challenge.completionBonus > 0 && (
            <div className="badge badge-success badge-lg">
              ⚡ Speed bonus: ${challenge.completionBonus}
            </div>
          )}
          {isOverdue && (
            <div className="badge badge-error badge-lg">
              ⏰ Overdue
            </div>
          )}
        </div> */}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-8">
          {/* Challenge Overview */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">📋 Challenge Overview</h2>

              <div className="prose max-w-none">
                <h3>🎯 Goal</h3>
                <p>{challenge.kpi}</p>

                <h3>📚 Learning Resources</h3>
                <ul>
                  {challenge.guides.map((guide, index) => (
                    <li key={index}>
                      <a href={guide} className="link link-primary" target="_blank" rel="noopener noreferrer">
                        {guide}
                      </a>
                    </li>
                  ))}
                </ul>

                <h3>📹 Video Guide</h3>
                <p className="text-base-content/70">{challenge.videoUrl}</p>

                <h3>📱 Social Media Requirements</h3>
                <div className="flex flex-wrap items-center gap-2 my-2">
                  <span>Share your progress with these hashtags:</span>
                  {challenge.socialHashtags.map((tag, index) => (
                    <span key={index} className="badge badge-outline p-4">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submission Status or Form */}
          {weeklyProgress?.completed ? (
            <div className="card bg-success/10 border-2 border-success shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-success">✅ Challenge Completed!</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h3 className="font-semibold mb-2">Submission Details</h3>
                    <p className="text-sm">
                      <strong>Submitted:</strong>{" "}
                      {new Date(weeklyProgress.submission?.submissionDate || "").toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 badge ${weeklyProgress.submission?.reviewStatus === "APPROVED"
                            ? "badge-success"
                            : weeklyProgress.submission?.reviewStatus === "REJECTED"
                              ? "badge-error"
                              : "badge-warning"
                          }`}
                      >
                        {weeklyProgress.submission?.reviewStatus}
                      </span>
                    </p>
                  </div>

                  {weeklyProgress.submission?.mentorFeedback && (
                    <div>
                      <h3 className="font-semibold mb-2">Mentor Feedback</h3>
                      <p className="text-sm bg-base-200 p-3 rounded">{weeklyProgress.submission.mentorFeedback}</p>
                    </div>
                  )}
                </div>

                {/* <div className="card-actions justify-center mt-6">
                  {weekNumber < 6 ? (
                    <Link href={`/sea-campaign/week/${weekNumber + 1}`} className="btn btn-primary">
                      Continue to Week {weekNumber + 1}
                    </Link>
                  ) : (
                    <Link href="/" className="btn btn-primary">
                      Back to Home
                    </Link>
                  )}
                </div> */}
              </div>
            </div>
          ) : isOverdue ? (
            <div className="card bg-error/10 border-2 border-error shadow-lg">
              <div className="card-body text-center">
                <h2 className="card-title text-error justify-center">⏰ Challenge Overdue</h2>
                <p className="text-base-content/70">
                  This challenge was due on {challenge.dueDate}. Submissions are no longer accepted.
                </p>
                <div className="card-actions justify-center mt-4">
                  <Link href="/" className="btn btn-outline">
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          ) : !isConnected ? (
            <div className="card bg-warning/10 border-2 border-warning shadow-lg">
              <div className="card-body text-center">
                <h2 className="card-title text-warning justify-center">👋 Connect Wallet Required</h2>
                <p className="text-base-content/70 mb-4">
                  Please connect your wallet to submit challenges and track your progress.
                </p>
              </div>
            </div>
          ) : (
            <SeaSubmissionForm weekNumber={weekNumber} challengeId={challenge.id} onSuccess={handleSubmissionSuccess} />
          )}
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          {/* Quick Info */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h3 className="card-title text-lg">ℹ️ Quick Info</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-base-content/60">Week</div>
                  <div className="font-semibold">{weekNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-base-content/60">Submissions</div>
                  <div className="font-semibold">{leaderboardData?.totalSubmissions}</div>
                </div>
                {/* <div>
                  <div className="text-sm text-base-content/60">Due Date</div>
                  <div className="font-semibold">{challenge.dueDate}</div>
                </div>
                <div>
                  <div className="text-sm text-base-content/60">Reward</div>
                  <div className="font-semibold">{challenge.reward}</div>
                </div>
                {challenge.topPerformersBonus > 0 && (
                  <div>
                    <div className="text-sm text-base-content/60">Top Performers</div>
                    <div className="font-semibold">${challenge.topPerformersBonus} × 10</div>
                  </div>
                )} */}
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h3 className="card-title text-lg">🔗 Network</h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Lisk Sepolia</strong>
                </div>
                <div className="text-xs space-y-1">
                  <div>Chain ID: 4202</div>
                  <div>
                    <a
                      href="https://sepolia-faucet.lisk.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary"
                    >
                      Get Test LSK
                    </a>
                  </div>
                  <div>
                    <a
                      href="https://sepolia-blockscout.lisk.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary"
                    >
                      Block Explorer
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Leaderboard */}
          {/* <WeeklyLeaderboard weekNumber={weekNumber} /> */}

          {/* Navigation */}
          {/* <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h3 className="card-title text-lg">🧭 Navigation</h3>
              <div className="space-y-2">
                {weekNumber > 1 && (
                  <Link href={`/sea-campaign/week/${weekNumber - 1}`} className="btn btn-sm btn-outline w-full">
                    ← Week {weekNumber - 1}
                  </Link>
                )}
                <Link href="/" className="btn btn-sm btn-outline w-full">
                  📊 Campaign Dashboard
                </Link>
                {weekNumber < 6 && (
                  <Link href={`/sea-campaign/week/${weekNumber + 1}`} className="btn btn-sm btn-outline w-full">
                    Week {weekNumber + 1} →
                  </Link>
                )}
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
