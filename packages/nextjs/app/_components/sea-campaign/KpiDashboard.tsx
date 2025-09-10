"use client";

import { useState, useEffect } from "react";

interface WeeklyKpi {
  weekNumber: number;
  target: number;
  actual: number;
  status: 'exceeded' | 'on-track' | 'behind';
  percentage: number;
}

interface KpiData {
  weeklyStats: WeeklyKpi[];
  overview: {
    totalParticipants: number;
    totalSubmissions: number;
    graduates: number;
    completionRate: number;
    averageWeeksCompleted: number;
    retentionRate: number;
  };
  kpis: {
    overallCampaignHealth: 'excellent' | 'good' | 'fair' | 'poor';
    participantProgress: number;
    graduateProgress: number;
    targetParticipants: number;
    actualParticipants: number;
    targetGraduates: number;
    actualGraduates: number;
  };
  lastUpdated: string;
}

interface KpiDashboardProps {
  compact?: boolean;
  showWeekly?: boolean;
}

export function KpiDashboard({ compact = false, showWeekly = true }: KpiDashboardProps) {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKpis();
    // Refresh every 5 minutes
    const interval = setInterval(fetchKpis, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchKpis = async () => {
    try {
      const response = await fetch("/api/sea-campaign/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setKpiData(data);
      }
    } catch (error) {
      console.error("Failed to fetch KPIs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    const colors = {
      excellent: "text-success",
      good: "text-info",
      fair: "text-warning", 
      poor: "text-error"
    };
    return colors[health as keyof typeof colors] || "text-base-content";
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      exceeded: "🎯",
      "on-track": "✅",
      behind: "⚠️"
    };
    return icons[status as keyof typeof icons] || "📊";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      exceeded: "text-success",
      "on-track": "text-info",
      behind: "text-error"
    };
    return colors[status as keyof typeof colors] || "text-base-content";
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">📊 Campaign KPIs</h2>
          <div className="flex justify-center py-8">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">📊 Campaign KPIs</h2>
          <div className="alert alert-error">
            <span>Failed to load KPI data</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title">📊 Campaign Overview</h2>
            <div className={`badge badge-lg ${getHealthColor(kpiData.kpis.overallCampaignHealth)}`}>
              {kpiData.kpis.overallCampaignHealth.toUpperCase()}
            </div>
          </div>
          
          <div className={`grid ${compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} gap-4`}>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title text-xs">Participants</div>
              <div className="stat-value text-lg text-primary">
                {kpiData.overview.totalParticipants}
              </div>
              <div className="stat-desc text-xs">
                Target: {kpiData.kpis.targetParticipants} ({kpiData.kpis.participantProgress}%)
              </div>
              <progress 
                className="progress progress-primary w-full mt-1" 
                value={kpiData.kpis.participantProgress} 
                max="100"
              ></progress>
            </div>

            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title text-xs">Graduates</div>
              <div className="stat-value text-lg text-success">
                {kpiData.overview.graduates}
              </div>
              <div className="stat-desc text-xs">
                Target: {kpiData.kpis.targetGraduates} ({kpiData.kpis.graduateProgress}%)
              </div>
              <progress 
                className="progress progress-success w-full mt-1" 
                value={kpiData.kpis.graduateProgress} 
                max="100"
              ></progress>
            </div>

            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title text-xs">Completion Rate</div>
              <div className="stat-value text-lg text-info">
                {kpiData.overview.completionRate}%
              </div>
              <div className="stat-desc text-xs">
                Avg: {kpiData.overview.averageWeeksCompleted.toFixed(1)} weeks
              </div>
            </div>

            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title text-xs">Retention</div>
              <div className="stat-value text-lg text-warning">
                {kpiData.overview.retentionRate}%
              </div>
              <div className="stat-desc text-xs">
                Week 1 → Week 2
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-base-content/60 mt-4">
            Last updated: {new Date(kpiData.lastUpdated).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Weekly Progress */}
      {showWeekly && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title text-lg mb-4">🎯 Weekly Targets vs Actual</h3>
            
            <div className="space-y-3">
              {kpiData.weeklyStats.map((week) => (
                <div key={week.weekNumber} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">{getStatusIcon(week.status)}</div>
                    <div>
                      <div className="font-medium">Week {week.weekNumber}</div>
                      <div className={`text-xs ${getStatusColor(week.status)}`}>
                        {week.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{week.actual}</div>
                      <div className="text-xs text-base-content/60">
                        / {week.target} target
                      </div>
                    </div>
                    
                    <div className="w-24">
                      <progress 
                        className={`progress ${
                          week.status === 'exceeded' ? 'progress-success' : 
                          week.status === 'on-track' ? 'progress-info' : 
                          'progress-error'
                        }`}
                        value={Math.min(week.actual, week.target)} 
                        max={week.target}
                      ></progress>
                      <div className="text-xs text-center mt-1">
                        {week.percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}