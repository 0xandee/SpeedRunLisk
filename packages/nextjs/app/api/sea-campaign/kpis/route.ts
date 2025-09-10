import { NextRequest, NextResponse } from "next/server";
import { getWeeklySubmissionCounts, getCountryDistribution } from "~~/services/database/repositories/seaCampaignSubmissions";
import { getCampaignStatistics } from "~~/services/database/repositories/seaCampaignProgress";

// Public KPI endpoint for campaign progress display
// This endpoint provides campaign progress information without sensitive admin data

export async function GET(req: NextRequest) {
  try {
    const [weeklyStats, countryStats, progressStats] = await Promise.all([
      getWeeklySubmissionCounts(),
      getCountryDistribution(), 
      getCampaignStatistics()
    ]);

    // Weekly targets for public display
    const weeklyTargets = [
      { week: 1, target: 200, description: "≥200 verified contracts" },
      { week: 2, target: 100, description: "≥100 learners complete Frontend Connect" },
      { week: 3, target: 80, description: "≥80 learners ship indexed UI" },
      { week: 4, target: 60, description: "≥60 learners implement oracle/sponsored flow" },
      { week: 5, target: 40, description: "≥40 learners complete interactive track" },
      { week: 6, target: 30, description: "≥30 projects complete advanced track" }
    ];

    const weeklyProgress = weeklyTargets.map((target) => {
      const actual = weeklyStats.find(w => w.weekNumber === target.week)?.count || 0;
      const percentage = Math.round((actual / target.target) * 100);
      let status: 'exceeded' | 'on-track' | 'behind' = 'behind';
      
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'on-track';
      
      return {
        weekNumber: target.week,
        target: target.target,
        actual,
        percentage,
        status,
        description: target.description
      };
    });

    // Calculate campaign health
    const onTrackWeeks = weeklyProgress.filter(w => w.status === 'exceeded' || w.status === 'on-track').length;
    const participantHealthScore = Math.min((progressStats.totalParticipants / 200) * 100, 100);
    const graduateHealthScore = Math.min((progressStats.graduates / 60) * 100, 100);
    const overallScore = (onTrackWeeks / 6 * 100 + participantHealthScore + graduateHealthScore) / 3;
    
    let campaignHealth: 'excellent' | 'good' | 'fair' | 'poor';
    if (overallScore >= 80) campaignHealth = 'excellent';
    else if (overallScore >= 60) campaignHealth = 'good';
    else if (overallScore >= 40) campaignHealth = 'fair';
    else campaignHealth = 'poor';

    return NextResponse.json({
      overview: {
        totalParticipants: progressStats.totalParticipants,
        graduates: progressStats.graduates,
        averageWeeksCompleted: Number(progressStats.averageWeeksCompleted) || 0,
        completionRate: progressStats.totalParticipants > 0 
          ? Math.round((progressStats.graduates / progressStats.totalParticipants) * 100)
          : 0
      },
      weeklyProgress,
      topCountries: countryStats.slice(0, 5), // Top 5 countries only for public display
      campaignHealth: {
        score: Math.round(overallScore),
        status: campaignHealth,
        participantProgress: Math.round(participantHealthScore),
        graduateProgress: Math.round(graduateHealthScore),
        weeklyProgress: Math.round((onTrackWeeks / 6) * 100)
      },
      targets: {
        totalParticipants: 200,
        totalGraduates: 60, // 30% of target participants
        campaignDuration: "7 weeks",
        totalBudget: "$2,000 USD"
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("KPI fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}