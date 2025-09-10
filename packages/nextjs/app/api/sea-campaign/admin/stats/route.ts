import { NextRequest, NextResponse } from "next/server";
import { getWeeklySubmissionCounts, getCountryDistribution, getTotalSubmissions } from "~~/services/database/repositories/seaCampaignSubmissions";
import { getCampaignStatistics } from "~~/services/database/repositories/seaCampaignProgress";
import { getRewardStatistics } from "~~/services/database/repositories/seaCampaignRewards";

// TODO: Add proper admin authentication
// For now, this endpoint is open for development purposes
// In production, add authentication middleware to verify admin role

export async function GET(req: NextRequest) {
  try {
    // Get comprehensive campaign statistics
    const [
      weeklyStats,
      countryStats,
      progressStats,
      rewardStats,
      totalSubmissions
    ] = await Promise.all([
      getWeeklySubmissionCounts(),
      getCountryDistribution(),
      getCampaignStatistics(),
      getRewardStatistics(),
      getTotalSubmissions()
    ]);

    // Calculate completion rate
    const completionRate = progressStats.totalParticipants > 0 
      ? Math.round((progressStats.graduates / progressStats.totalParticipants) * 100)
      : 0;

    // Calculate average submissions per week
    const averageSubmissionsPerWeek = weeklyStats.length > 0
      ? Math.round(totalSubmissions / weeklyStats.length)
      : 0;

    // Calculate retention rate (users who completed week 2 after week 1)
    const week1Submissions = weeklyStats.find(w => w.weekNumber === 1)?.count || 0;
    const week2Submissions = weeklyStats.find(w => w.weekNumber === 2)?.count || 0;
    const retentionRate = week1Submissions > 0
      ? Math.round((week2Submissions / week1Submissions) * 100)
      : 0;

    // Prepare weekly stats with target tracking
    const weeklyTargets = [200, 100, 80, 60, 40, 30]; // KPI targets per week
    const weeklyStatsWithTargets = Array.from({ length: 6 }, (_, i) => {
      const weekNumber = i + 1;
      const actual = weeklyStats.find(w => w.weekNumber === weekNumber)?.count || 0;
      const target = weeklyTargets[i];
      const status = actual >= target ? 'exceeded' : 
                    actual >= target * 0.8 ? 'on-track' : 'behind';
      
      return {
        weekNumber,
        target,
        actual,
        status,
        percentage: Math.round((actual / target) * 100)
      };
    });

    // Calculate budget utilization
    const budgetUtilization = Math.round((rewardStats.totalAmount / 2000) * 100);

    return NextResponse.json({
      overview: {
        totalParticipants: progressStats.totalParticipants,
        totalSubmissions,
        graduates: progressStats.graduates,
        completionRate,
        averageWeeksCompleted: Math.round(progressStats.averageWeeksCompleted * 10) / 10,
        retentionRate,
        averageSubmissionsPerWeek,
      },
      weeklyStats: weeklyStatsWithTargets,
      countryStats: countryStats.slice(0, 10), // Top 10 countries
      rewardStats: {
        ...rewardStats,
        budgetUtilization,
        remainingBudget: 2000 - rewardStats.totalAmount,
      },
      kpis: {
        targetParticipants: 200,
        actualParticipants: progressStats.totalParticipants,
        participantProgress: Math.round((progressStats.totalParticipants / 200) * 100),
        
        targetGraduates: 60, // 30% of 200 target participants
        actualGraduates: progressStats.graduates,
        graduateProgress: Math.round((progressStats.graduates / 60) * 100),
        
        overallCampaignHealth: calculateCampaignHealth(weeklyStatsWithTargets, progressStats),
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function calculateCampaignHealth(weeklyStats: any[], progressStats: any): 'excellent' | 'good' | 'fair' | 'poor' {
  // Calculate health based on multiple factors
  const onTrackWeeks = weeklyStats.filter(w => w.status === 'exceeded' || w.status === 'on-track').length;
  const weeklyHealthScore = (onTrackWeeks / 6) * 100;
  
  const participantHealthScore = Math.min((progressStats.totalParticipants / 200) * 100, 100);
  const graduateHealthScore = Math.min((progressStats.graduates / 60) * 100, 100);
  
  const overallScore = (weeklyHealthScore + participantHealthScore + graduateHealthScore) / 3;
  
  if (overallScore >= 80) return 'excellent';
  if (overallScore >= 60) return 'good';
  if (overallScore >= 40) return 'fair';
  return 'poor';
}