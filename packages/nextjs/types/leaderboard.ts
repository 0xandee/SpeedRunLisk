export interface LeaderboardEntry {
  rank: number;
  telegram: string;
  fastestFinisher: boolean;
  bestProject: boolean;
  bestSocialEngagement: boolean;
  payoutWallet: string;
  totalRewardUSD: number; // For display in the table
  totalRewardLSK: number; // For contract claim amount
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalParticipants: number;
  totalRewardsDistributedUSD: number;
  totalRewardsDistributedLSK: number;
}
