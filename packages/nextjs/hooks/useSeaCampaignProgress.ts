"use client";

import { useQuery } from "@tanstack/react-query";

export interface WeeklyProgress {
  weekNumber: number;
  challengeId: string;
  title: string;
  dueDate: string;
  completed: boolean;
  submission?: {
    id: number;
    submissionDate: string;
    reviewStatus: string;
    githubUrl: string;
    demoUrl: string;
    socialPostUrl: string;
    mentorFeedback?: string;
  };
}

export interface SeaCampaignProgressData {
  userAddress: string;
  isParticipant: boolean;
  registrationDate: string | null;
  progress: {
    totalWeeksCompleted: number;
    completionPercentage: number;
    isGraduated: boolean;
    graduationDate: string | null;
    totalBonusEarned: number;
  };
  weeklyProgress: WeeklyProgress[];
  nextWeek?: {
    weekNumber: number;
    title: string;
    dueDate: string;
    challengeId: string;
  };
  rewards: {
    total: number;
    recentRewards: any[];
  };
  stats: {
    totalSubmissions: number;
    approvedSubmissions: number;
    pendingSubmissions: number;
    rejectedSubmissions: number;
  };
}

async function fetchSeaCampaignProgress(userAddress: string): Promise<SeaCampaignProgressData> {
  const response = await fetch(`/api/sea-campaign/progress/${userAddress}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch SEA campaign progress: ${response.statusText}`);
  }
  return response.json();
}

export function useSeaCampaignProgress(userAddress: string | undefined) {
  return useQuery({
    queryKey: ["sea-campaign-progress", userAddress],
    queryFn: () => fetchSeaCampaignProgress(userAddress!),
    enabled: !!userAddress,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 404 (user not found) errors
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
