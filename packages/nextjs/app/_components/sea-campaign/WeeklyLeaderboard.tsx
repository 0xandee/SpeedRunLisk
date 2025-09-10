"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

interface WeeklyLeaderboardProps {
  weekNumber: number;
}

export function WeeklyLeaderboard({ weekNumber }: WeeklyLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <span className="badge badge-success badge-xs">✅</span>;
      case "rejected":
        return <span className="badge badge-error badge-xs">❌</span>;
      case "submitted":
        return <span className="badge badge-warning badge-xs">⏳</span>;
      default:
        return <span className="badge badge-ghost badge-xs">{status}</span>;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    if (rank <= 10) return "🏆";
    return rank.toString();
  };

  if (loading) {
    return (
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h3 className="card-title">🏆 Week {weekNumber} Leaderboard</h3>
          <div className="flex justify-center py-8">
            <div className="loading loading-spinner loading-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!leaderboardData || leaderboardData.leaderboard.length === 0) {
    return (
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h3 className="card-title">🏆 Week {weekNumber} Leaderboard</h3>
          <div className="text-center py-8 text-base-content/60">
            No submissions yet for this week.
            <br />
            Be the first to submit! 🚀
          </div>
        </div>
      </div>
    );
  }

  const displayedEntries = showAll ? leaderboardData.leaderboard : leaderboardData.leaderboard.slice(0, 10);

  return (
    <div className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title">🏆 Week {weekNumber} Submissions:</h3>
          <div className="badge badge-primary p-4 mx-auto">{leaderboardData.totalSubmissions}</div>
        </div>

        {/* <div className="space-y-2 max-h-96 overflow-y-auto">
          {displayedEntries.map(entry => (
            <div
              key={`${entry.userAddress}-${entry.rank}`}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                entry.rank <= 3 ? "bg-warning/20 border border-warning/30" : "bg-base-100"
              } hover:bg-base-300/50`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-8 text-center font-bold">{getRankBadge(entry.rank)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm truncate">{formatAddress(entry.userAddress)}</span>
                    {getStatusBadge(entry.reviewStatus)}
                  </div>

                  {entry.country && <div className="text-xs text-base-content/60">{entry.country}</div>}
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-2 text-xs">
                    {entry.qualityScore && (
                      <div className="tooltip" data-tip="Quality Score">
                        <span className="badge badge-info badge-xs">Q: {entry.qualityScore}/10</span>
                      </div>
                    )}
                    {entry.socialEngagement && (
                      <div className="tooltip" data-tip="Social Engagement">
                        <span className="badge badge-secondary badge-xs">E: {entry.socialEngagement}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-base-content/60 mt-1">
                    {new Date(entry.submissionDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 ml-2">
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-ghost btn-xs">
                    👁️
                  </label>
                  <div className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300">
                    <div className="menu-title text-xs">
                      <span>Submission Links</span>
                    </div>
                    <ul>
                      <li>
                        <a href={entry.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs">
                          📂 GitHub Repository
                        </a>
                      </li>
                      {entry.demoUrl && (
                        <li>
                          <a href={entry.demoUrl} target="_blank" rel="noopener noreferrer" className="text-xs">
                            🌐 Live Demo
                          </a>
                        </li>
                      )}
                      <li>
                        <a href={entry.socialPostUrl} target="_blank" rel="noopener noreferrer" className="text-xs">
                          📱 Social Post
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div> */}

        {/* {leaderboardData.leaderboard.length > 10 && (
          <div className="text-center mt-4">
            <button className="btn btn-sm btn-outline" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show Top 10" : `Show All ${leaderboardData.totalSubmissions}`}
            </button>
          </div>
        )} */}

        <div className="text-center text-xs text-base-content/60 mt-4">
          Last updated: {new Date(leaderboardData.lastUpdated).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
