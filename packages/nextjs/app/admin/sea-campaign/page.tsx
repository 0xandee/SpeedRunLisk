"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";

interface CampaignStats {
  overview: {
    totalParticipants: number;
    totalSubmissions: number;
    graduates: number;
    completionRate: number;
    averageWeeksCompleted: number;
    retentionRate: number;
    averageSubmissionsPerWeek: number;
  };
  weeklyStats: Array<{
    weekNumber: number;
    target: number;
    actual: number;
    status: "exceeded" | "on-track" | "behind";
    percentage: number;
  }>;
  countryStats: Array<{
    country: string;
    participants: number;
  }>;
  rewardStats: {
    totalRewards: number;
    totalAmount: number;
    paidRewards: number;
    paidAmount: number;
    pendingRewards: number;
    pendingAmount: number;
    budgetUtilization: number;
    remainingBudget: number;
  };
  kpis: {
    targetParticipants: number;
    actualParticipants: number;
    participantProgress: number;
    targetGraduates: number;
    actualGraduates: number;
    graduateProgress: number;
    overallCampaignHealth: "excellent" | "good" | "fair" | "poor";
  };
  lastUpdated: string;
}

export default function SeaCampaignAdminPage() {
  const { address } = useAccount();
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeTab, setActiveTab] = useState<"overview" | "weekly" | "rewards" | "participants">("overview");

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/sea-campaign/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (health: string) => {
    const badges = {
      excellent: "badge-success",
      good: "badge-info",
      fair: "badge-warning",
      poor: "badge-error",
    };
    return badges[health as keyof typeof badges] || "badge-ghost";
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      exceeded: "badge-success",
      "on-track": "badge-info",
      behind: "badge-error",
    };
    return badges[status as keyof typeof badges] || "badge-ghost";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>Failed to load campaign statistics. Please try again.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">SEA Campaign Admin Dashboard</h1>
            <p className="text-base-content/70">Monitor progress and manage the Speedrun Lisk campaign</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`badge ${getHealthBadge(stats.kpis.overallCampaignHealth)} badge-lg`}>
              {stats.kpis.overallCampaignHealth.toUpperCase()} Health
            </div>
            <button onClick={fetchStats} className="btn btn-sm btn-outline">
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="text-xs text-base-content/60">Last updated: {new Date(stats.lastUpdated).toLocaleString()}</div>
      </header>

      {/* Tabs */}
      <div className="tabs tabs-bordered mb-8">
        <button
          className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button className={`tab ${activeTab === "weekly" ? "tab-active" : ""}`} onClick={() => setActiveTab("weekly")}>
          Weekly Progress
        </button>
        <button
          className={`tab ${activeTab === "rewards" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("rewards")}
        >
          Rewards
        </button>
        <button
          className={`tab ${activeTab === "participants" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("participants")}
        >
          Participants
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-figure text-primary">
                <span className="text-2xl">👥</span>
              </div>
              <div className="stat-title">Total Participants</div>
              <div className="stat-value text-primary">{stats.overview.totalParticipants}</div>
              <div className="stat-desc">
                Target: {stats.kpis.targetParticipants} ({stats.kpis.participantProgress}%)
              </div>
            </div>

            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-figure text-success">
                <span className="text-2xl">🎓</span>
              </div>
              <div className="stat-title">Graduates</div>
              <div className="stat-value text-success">{stats.overview.graduates}</div>
              <div className="stat-desc">
                Target: {stats.kpis.targetGraduates} ({stats.kpis.graduateProgress}%)
              </div>
            </div>

            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-figure text-info">
                <span className="text-2xl">📊</span>
              </div>
              <div className="stat-title">Completion Rate</div>
              <div className="stat-value text-info">{stats.overview.completionRate}%</div>
              <div className="stat-desc">Avg: {stats.overview.averageWeeksCompleted} weeks</div>
            </div>

            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-figure text-warning">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="stat-title">Retention Rate</div>
              <div className="stat-value text-warning">{stats.overview.retentionRate}%</div>
              <div className="stat-desc">Week 1 → Week 2</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/admin/sea-campaign/submissions" className="btn btn-primary">
                  📝 Review Submissions
                </Link>
                <Link href="/admin/sea-campaign/rewards" className="btn btn-secondary">
                  💰 Manage Rewards
                </Link>
                <Link href="/admin/sea-campaign/participants" className="btn btn-accent">
                  👥 View Participants
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Progress Tab */}
      {activeTab === "weekly" && (
        <div className="space-y-8">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title mb-6">Weekly KPI Tracking</h2>
              <div className="space-y-4">
                {stats.weeklyStats.map(week => (
                  <div key={week.weekNumber} className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="font-bold text-lg">Week {week.weekNumber}</div>
                      <div className={`badge ${getStatusBadge(week.status)}`}>{week.status}</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">
                          {week.actual} / {week.target}
                        </div>
                        <div className="text-sm text-base-content/60">{week.percentage}% of target</div>
                      </div>

                      <div className="w-32">
                        <progress
                          className={`progress ${week.status === "exceeded" ? "progress-success" : week.status === "on-track" ? "progress-info" : "progress-error"}`}
                          value={week.actual}
                          max={week.target}
                        ></progress>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === "rewards" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Reward Distribution</h2>
                <div className="stats stats-vertical">
                  <div className="stat">
                    <div className="stat-title">Total Distributed</div>
                    <div className="stat-value text-primary">${stats.rewardStats.totalAmount.toFixed(2)}</div>
                    <div className="stat-desc">{stats.rewardStats.totalRewards} rewards</div>
                  </div>

                  <div className="stat">
                    <div className="stat-title">Paid Out</div>
                    <div className="stat-value text-success">${stats.rewardStats.paidAmount.toFixed(2)}</div>
                    <div className="stat-desc">{stats.rewardStats.paidRewards} payments</div>
                  </div>

                  <div className="stat">
                    <div className="stat-title">Pending</div>
                    <div className="stat-value text-warning">${stats.rewardStats.pendingAmount.toFixed(2)}</div>
                    <div className="stat-desc">{stats.rewardStats.pendingRewards} pending</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Budget Utilization</h2>
                <div className="mb-4">
                  <progress
                    className="progress progress-primary w-full"
                    value={stats.rewardStats.budgetUtilization}
                    max="100"
                  ></progress>
                  <div className="text-sm text-center mt-2">
                    {stats.rewardStats.budgetUtilization}% of $2,000 budget used
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-base-200 rounded">
                    <div className="text-2xl font-bold text-primary">${stats.rewardStats.totalAmount.toFixed(0)}</div>
                    <div className="text-xs">Distributed</div>
                  </div>
                  <div className="text-center p-4 bg-base-200 rounded">
                    <div className="text-2xl font-bold text-secondary">
                      ${stats.rewardStats.remainingBudget.toFixed(0)}
                    </div>
                    <div className="text-xs">Remaining</div>
                  </div>
                </div>

                <div className="mt-6">
                  <button className="btn btn-primary btn-block">Process Pending Payments</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === "participants" && (
        <div className="space-y-8">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title mb-6">Participants by Country</h2>
              <div className="space-y-3">
                {stats.countryStats.slice(0, 10).map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="badge badge-primary">{index + 1}</div>
                      <span className="font-medium">{country.country || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <progress
                        className="progress progress-primary w-24"
                        value={country.participants}
                        max={stats.overview.totalParticipants}
                      ></progress>
                      <span className="text-sm font-semibold w-8 text-right">{country.participants}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
