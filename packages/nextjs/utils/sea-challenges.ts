export const SEA_CAMPAIGN_METADATA = {
  "sea-week-1-hello-token-nft": {
    title: "Week 1: Hello Token + NFT",
    description: "Deploy and verify your first ERC20 token and ERC721 NFT contracts on Lisk Sepolia",
    dueDate: "2025-09-21",
    reward: "NFT Badge for completion",
    guides: ["/speedrun/ch1-deploy-verify"],
    videoUrl: {
      text: "V1 (10m): From zero → first deploy & verify",
      url: "https://youtu.be/Xw9S9Y2DYDg",
    },
    socialHashtags: ["#SpeedrunLiskSEA", "#W1", "@LiskSEA"],
    requiredSubmissions: ["contract_address", "tx_hash", "github_url", "social_post_url"],
    completionBonus: 0,
    topPerformersBonus: 50, // Top 10 get $50 each
    kpi: "Deploy and verify your ERC20 token and ERC721 NFT contracts on Lisk Sepolia",
    weekNumber: 1,
  },
  "sea-week-2-frontend-connect": {
    title: "Week 2: Frontend Connect",
    description: "Connect your smart contracts to a React/Next.js frontend with wallet integration",
    dueDate: "2025-09-28",
    reward: "Frontend Integration Badge",
    guides: ["/speedrun/ch2-frontend-connect"],
    videoUrl: {
      text: "V2 (10m): Connect React/Next (hooks, read/write demo)",
      url: "https://youtu.be/nFOc1Or3hkg",
    },
    socialHashtags: ["#SpeedrunLiskSEA", "#W2", "@LiskSEA"],
    requiredSubmissions: ["demo_url", "github_url", "social_post_url"],
    completionBonus: 0,
    topPerformersBonus: 50,
    kpi: "Create a functional frontend that connects to your smart contracts with wallet integration",
    weekNumber: 2,
  },
  "sea-week-3-indexing-display": {
    title: "Week 3: Indexing & Display",
    description: "Index blockchain data and display it in your frontend with pagination",
    dueDate: "2025-10-05",
    reward: "Data Indexing Badge",
    guides: ["/speedrun/ch3-index-display"],
    videoUrl: {
      text: "V3 (10m): Index & display (init, entities, queries, paginate)",
      url: "https://www.youtube.com/watch?v=YR8Wm363aek",
    },
    socialHashtags: ["#SpeedrunLiskSEA", "#W3", "@LiskSEA"],
    requiredSubmissions: ["demo_url", "github_url", "social_post_url"],
    completionBonus: 0,
    topPerformersBonus: 50,
    kpi: "Build an indexing system that displays blockchain data with pagination in your UI",
    weekNumber: 3,
  },
  "sea-week-4-oracle-sponsored": {
    title: "Week 4: Oracle + Sponsored UX",
    description: "Integrate price oracles or implement gasless transactions for better UX",
    dueDate: "2025-10-12",
    reward: "Oracle Integration Badge",
    guides: ["/speedrun/ch4-oracle-sponsored"],
    videoUrl: {
      text: "V4 (10m): Oracles & sponsored transactions",
      url: "https://youtu.be/pEBTsovB34g",
    },
    socialHashtags: ["#SpeedrunLiskSEA", "#W4", "@LiskSEA"],
    requiredSubmissions: ["demo_url", "github_url", "social_post_url"],
    completionBonus: 0,
    topPerformersBonus: 50,
    kpi: "Integrate price oracles OR implement gasless transactions for better user experience",
    weekNumber: 4,
  },
  "sea-week-5-nft-badge-game": {
    title: "Week 5: NFT Badge / Mini-Game",
    description: "Create an interactive NFT badge system or simple on-chain game",
    dueDate: "2025-10-19",
    reward: "Game Developer Badge",
    guides: ["/speedrun/challenge-nft-badge", "/speedrun/challenge-mini-game", "/speedrun/showcase-guide"],
    videoUrl: {
      text: "V5 (10m): Demo implementation NFT badge and mini-game + submission checklist",
      url: null,
    },
    socialHashtags: ["#SpeedrunLiskSEA", "#W5", "@LiskSEA"],
    requiredSubmissions: ["demo_url", "github_url", "social_post_url"],
    completionBonus: 0,
    topPerformersBonus: 50,
    kpi: "Create an interactive NFT badge system OR build a simple on-chain game",
    weekNumber: 5,
  },
  "sea-week-6-mini-dex-lending": {
    title: "Week 6: Mini-DEX / Lending App",
    description: "Build a simple DEX, lending protocol, or prediction market",
    dueDate: "2025-10-26",
    reward: "DeFi Developer Badge",
    guides: ["/speedrun/advanced-dex-stub", "/speedrun/advanced-lending-stub", "/speedrun/advanced-prediction-stub"],
    videoUrl: {
      text: "V6 (10m): Demo implementation dex and lending app",
      url: null,
    },
    socialHashtags: ["#SpeedrunLiskSEA", "#W6", "@LiskSEA"],
    requiredSubmissions: ["demo_url", "github_url", "social_post_url"],
    completionBonus: 20, // Next 50 fastest get $20 each
    topPerformersBonus: 50, // Top 10 get $50 each
    kpi: "Build a mini-DEX, lending protocol, OR prediction market application",
    weekNumber: 6,
  },
} as const;

export const COMPLETION_BONUS_STRUCTURE = {
  topQualitySubmissions: { amount: 50, count: 10 }, // Top 10 best quality submissions per week: $50 each
  topEngagementSubmissions: { amount: 50, count: 10 }, // Top 10 best social media engagement: $50 each
  fastestCompletions: { amount: 20, count: 50 }, // Next 50 fastest finishers: $20 each
  totalBudget: 2000,
} as const;

// Calculate start date from due date (6 days earlier)
export const getChallengeStartDate = (dueDate: string): string => {
  const dueDateObj = new Date(dueDate);
  const startDateObj = new Date(dueDateObj.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 days before
  return startDateObj.toISOString().split("T")[0];
};

// Special account that gets full access to all challenges
const SPECIAL_ACCESS_ACCOUNT = "0xeffB943a01dDeC6bA3C94B7A3e65600AB3255d0A";

// SEA Campaign timing utilities
export const getSeaChallengeVisibilityStatus = (challengeId: string, userAddress?: string) => {
  const metadata = SEA_CAMPAIGN_METADATA[challengeId as keyof typeof SEA_CAMPAIGN_METADATA];
  if (!metadata) return { isVisible: false, status: "not_found" };

  // Grant full access to special account
  if (userAddress && userAddress.toLowerCase() === SPECIAL_ACCESS_ACCOUNT.toLowerCase()) {
    return { isVisible: true, status: "active", startDate: new Date(getChallengeStartDate(metadata.dueDate)) };
  }

  const now = new Date();
  const startDate = new Date(getChallengeStartDate(metadata.dueDate));

  // Challenge is visible if current time is on or after the start date
  // No due date limitation - challenges stay visible after their due date
  const isVisible = now >= startDate;

  if (!isVisible) {
    return { isVisible: false, status: "upcoming", startDate };
  }

  return { isVisible: true, status: "active", startDate };
};

export const getNextSeaChallenge = () => {
  const now = new Date();

  // Sort challenges by due date
  const sortedChallenges = Object.entries(SEA_CAMPAIGN_METADATA).sort(
    ([, a], [, b]) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  // Find the next challenge that hasn't expired yet
  for (const [challengeId, metadata] of sortedChallenges) {
    const dueDate = new Date(metadata.dueDate);
    if (now <= dueDate) {
      return { challengeId, metadata, dueDate };
    }
  }

  return null; // No upcoming challenges
};

export const getTimeUntilNextChallenge = () => {
  const nextChallenge = getNextSeaChallenge();
  if (!nextChallenge) return null;

  const now = new Date();
  const timeDiff = nextChallenge.dueDate.getTime() - now.getTime();

  if (timeDiff <= 0) return null;

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, challengeId: nextChallenge.challengeId, title: nextChallenge.metadata.title };
};

export const SEA_CAMPAIGN_CONFIG = {
  name: "Speedrun Lisk Onboarding Challenge",
  startDate: "15-Sep-2025",
  endDate: "31-Oct-2025",
  targetParticipants: 200,
  totalWeeks: 6,
  network: "lisk-sepolia",
  networkConfig: {
    chainId: 4202,
    rpcUrl: "https://rpc.sepolia-api.lisk.com",
    blockExplorer: "https://sepolia-blockscout.lisk.com",
    faucetUrl: "https://sepolia-faucet.lisk.com",
  },
} as const;

export const SEA_COUNTRIES = [
  "Singapore",
  "Malaysia",
  "Thailand",
  "Indonesia",
  "Philippines",
  "Vietnam",
  "Cambodia",
  "Laos",
  "Myanmar",
  "Brunei",
  "East Timor",
  "Other",
] as const;

// Utility functions
export function getChallengeByWeek(weekNumber: number) {
  const challengeKey = Object.keys(SEA_CAMPAIGN_METADATA).find(
    key => SEA_CAMPAIGN_METADATA[key as keyof typeof SEA_CAMPAIGN_METADATA].weekNumber === weekNumber,
  );
  return challengeKey
    ? {
      id: challengeKey,
      ...SEA_CAMPAIGN_METADATA[challengeKey as keyof typeof SEA_CAMPAIGN_METADATA],
    }
    : null;
}

export function getAllSeaChallenges() {
  return Object.entries(SEA_CAMPAIGN_METADATA).map(([id, metadata]) => ({
    id,
    ...metadata,
  }));
}

export function isSeaCampaignChallenge(challengeId: string): boolean {
  return challengeId.startsWith("sea-week-");
}

export function getWeekFromChallengeId(challengeId: string): number | null {
  const match = challengeId.match(/sea-week-(\d+)/);
  return match ? parseInt(match[1]) : null;
}

export function calculateProgressPercentage(weeklyProgress: Record<string, boolean>): number {
  const completed = Object.values(weeklyProgress).filter(Boolean).length;
  return Math.round((completed / 6) * 100);
}

export function isGraduated(weeklyProgress: Record<string, boolean>): boolean {
  return Object.values(weeklyProgress).filter(Boolean).length === 6;
}

export function getNextWeek(weeklyProgress: Record<string, boolean>): number | null {
  for (let i = 1; i <= 6; i++) {
    if (!weeklyProgress[`week${i}Completed`]) {
      return i;
    }
  }
  return null; // All weeks completed
}

export const seaCampaignChallenges = [
  "sea-week-1-hello-token-nft",
  "sea-week-2-frontend-connect",
  "sea-week-3-indexing-display",
  "sea-week-4-oracle-sponsored",
  "sea-week-5-nft-badge-game",
  "sea-week-6-mini-dex-lending",
] as const;

export type SeaCampaignChallenge = (typeof seaCampaignChallenges)[number];
export type SeaChallengeMetadata = (typeof SEA_CAMPAIGN_METADATA)[keyof typeof SEA_CAMPAIGN_METADATA];
export type SeaChallengeId = keyof typeof SEA_CAMPAIGN_METADATA;
