export const SPEEDRUN_METADATA = {
  "ch1-deploy-verify": {
    title: "Deploy & Verify Your First Contracts",
    description: "Learn to deploy and verify ERC20 token and ERC721 NFT contracts on Lisk Sepolia testnet",
    previewImage: "/hero/ch1-deploy-verify.png",
    difficulty: "Beginner",
    estimatedTime: "30-45 minutes",
    week: 1,
    guides: [
      {
        title: "Environment Setup",
        url: "/speedrun/setup",
      },
      {
        title: "Getting Started",
        url: "/speedrun/start-here",
      },
    ],
  },
  "ch2-frontend-connect": {
    title: "Frontend Connect",
    description: "Connect your smart contracts to a React/Next.js frontend with wallet integration",
    previewImage: "/hero/ch2-frontend-connect.png",
    difficulty: "Beginner",
    estimatedTime: "45-60 minutes",
    week: 2,
    guides: [
      {
        title: "Deploy & Verify",
        url: "/speedrun/ch1-deploy-verify",
      },
    ],
  },
  "ch3-index-display": {
    title: "Indexing & Display",
    description: "Index blockchain data and display it in your frontend with pagination",
    previewImage: "/hero/ch3-index-display.png",
    difficulty: "Intermediate",
    estimatedTime: "60-90 minutes",
    week: 3,
    guides: [
      {
        title: "Frontend Connect",
        url: "/speedrun/ch2-frontend-connect",
      },
    ],
  },
  "ch4-oracle-sponsored": {
    title: "Oracle + Sponsored UX",
    description: "Integrate price oracles or implement gasless transactions for better UX",
    previewImage: "/hero/ch4-oracle-sponsored.png",
    difficulty: "Intermediate",
    estimatedTime: "60-90 minutes",
    week: 4,
    guides: [
      {
        title: "Indexing & Display",
        url: "/speedrun/ch3-index-display",
      },
    ],
  },
  "ch5-nft-marketplace": {
    title: "NFT Marketplace",
    description: "Build a fully functional NFT marketplace with oracle-powered price feeds",
    previewImage: "/hero/ch5-nft-marketplace.png",
    difficulty: "Advanced",
    estimatedTime: "90-120 minutes",
    week: 5,
    guides: [
      {
        title: "Oracle + Sponsored UX",
        url: "/speedrun/ch4-oracle-sponsored",
      },
    ],
  },
  "ch6-mini-dex": {
    title: "Build a Simple DEX (Decentralized Exchange)",
    description: "Build a decentralized exchange (DEX) with AMM, liquidity pools, and token swaps",
    previewImage: "/hero/dex.png",
    difficulty: "Advanced",
    estimatedTime: "120+ minutes",
    week: 6,
    guides: [
      {
        title: "NFT Marketplace",
        url: "/speedrun/ch5-nft-marketplace",
      },
    ],
  },
  setup: {
    title: "⚙️ Environment Setup",
    description: "Set up your development environment for Lisk blockchain development",
    previewImage: "/hero/setup.png",
    difficulty: "Beginner",
    estimatedTime: "15-20 minutes",
    week: 0,
    guides: [],
  },
  "start-here": {
    title: "🎯 Start Here",
    description: "Welcome to SpeedRun Lisk! Learn the basics and get oriented",
    previewImage: "/hero/start-here.png",
    difficulty: "Beginner",
    estimatedTime: "10-15 minutes",
    week: 0,
    guides: [
      {
        title: "Environment Setup",
        url: "/speedrun/setup",
      },
    ],
  },
} as const;

export type SpeedrunId = keyof typeof SPEEDRUN_METADATA;
export type SpeedrunMetadata = (typeof SPEEDRUN_METADATA)[SpeedrunId];

export const getAllSpeedruns = () => {
  return Object.entries(SPEEDRUN_METADATA).map(([id, metadata]) => ({
    id: id as SpeedrunId,
    ...metadata,
  }));
};

export const getSpeedrunsByWeek = (week: number) => {
  return getAllSpeedruns().filter(speedrun => speedrun.week === week);
};

export const getSpeedrunsByDifficulty = (difficulty: string) => {
  return getAllSpeedruns().filter(speedrun => speedrun.difficulty === difficulty);
};

export const getNextSpeedrun = (currentSpeedrunId: SpeedrunId): SpeedrunMetadata | null => {
  const allSpeedruns = getAllSpeedruns().sort((a, b) => a.week - b.week);
  const currentIndex = allSpeedruns.findIndex(s => s.id === currentSpeedrunId);

  if (currentIndex === -1 || currentIndex === allSpeedruns.length - 1) {
    return null;
  }

  return allSpeedruns[currentIndex + 1];
};

export const getPreviousSpeedrun = (currentSpeedrunId: SpeedrunId): SpeedrunMetadata | null => {
  const allSpeedruns = getAllSpeedruns().sort((a, b) => a.week - b.week);
  const currentIndex = allSpeedruns.findIndex(s => s.id === currentSpeedrunId);

  if (currentIndex <= 0) {
    return null;
  }

  return allSpeedruns[currentIndex - 1];
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty.toLowerCase()) {
    case "beginner":
      return "text-green-500";
    case "intermediate":
      return "text-yellow-500";
    case "advanced":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

export const getProgressForWeek = (week: number, completedSpeedruns: SpeedrunId[]): number => {
  const weekSpeedruns = getSpeedrunsByWeek(week);
  if (weekSpeedruns.length === 0) return 0;

  const completedCount = weekSpeedruns.filter(s => completedSpeedruns.includes(s.id)).length;
  return Math.round((completedCount / weekSpeedruns.length) * 100);
};
