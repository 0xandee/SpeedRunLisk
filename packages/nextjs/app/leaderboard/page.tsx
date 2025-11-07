import { LeaderboardTable } from "./_components/LeaderboardTable";
import { readFileSync } from "fs";
import path from "path";
import { LeaderboardData, LeaderboardEntry } from "~~/types/leaderboard";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "SpeedRun Leaderboard",
  description: "Top builders and contributors in the SpeedRunLisk 2025 challenge",
});

// Parse both USD and LSK CSV files and merge the data
function parseLeaderboardCSV(): LeaderboardData {
  try {
    // Read USD CSV file
    const csvPathUSD = path.join(process.cwd(), "public", "speedrun", "Leaderboard SpeedRunLisk 2025 - Sheet1.csv");
    const csvContentUSD = readFileSync(csvPathUSD, "utf-8");

    // Read LSK CSV file
    const csvPathLSK = path.join(
      process.cwd(),
      "public",
      "speedrun",
      "Leaderboard SpeedRunLisk 2025 - Sheet1 - LSK.csv",
    );
    const csvContentLSK = readFileSync(csvPathLSK, "utf-8");

    // Parse USD data
    const linesUSD = csvContentUSD.trim().split("\n");
    const dataLinesUSD = linesUSD.slice(1); // Skip header

    // Parse LSK data
    const linesLSK = csvContentLSK.trim().split("\n");
    const dataLinesLSK = linesLSK.slice(1); // Skip header

    // Create a map of wallet address to LSK amount
    const lskMap = new Map<string, number>();
    dataLinesLSK.forEach(line => {
      const parts = line.split(",");
      if (parts.length >= 6) {
        const wallet = parts[4].trim();
        const lskAmount = parseFloat(parts[5].trim()) || 0;
        lskMap.set(wallet, lskAmount);
      }
    });

    // Parse USD data and merge with LSK amounts
    const entries: LeaderboardEntry[] = dataLinesUSD
      .map((line, index) => {
        const parts = line.split(",");

        if (parts.length < 6) {
          console.warn(`Skipping invalid line ${index + 2}: ${line}`);
          return null;
        }

        const wallet = parts[4].trim();
        const usdAmount = parseFloat(parts[5].trim()) || 0;
        const lskAmount = lskMap.get(wallet) || 0;

        return {
          rank: index + 1, // Will be recalculated after sorting
          telegram: parts[0].trim(),
          fastestFinisher: parts[1].trim().toUpperCase() === "TRUE",
          bestProject: parts[2].trim().toUpperCase() === "TRUE",
          bestSocialEngagement: parts[3].trim().toUpperCase() === "TRUE",
          payoutWallet: wallet,
          totalRewardUSD: usdAmount,
          totalRewardLSK: lskAmount,
        };
      })
      .filter((entry): entry is LeaderboardEntry => entry !== null);

    // Sort by total USD reward (descending) and recalculate ranks
    entries.sort((a, b) => b.totalRewardUSD - a.totalRewardUSD);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Calculate statistics
    const totalRewardsDistributedUSD = entries.reduce((sum, entry) => sum + entry.totalRewardUSD, 0);
    const totalRewardsDistributedLSK = entries.reduce((sum, entry) => sum + entry.totalRewardLSK, 0);

    return {
      entries,
      totalParticipants: entries.length,
      totalRewardsDistributedUSD,
      totalRewardsDistributedLSK,
    };
  } catch (error) {
    console.error("Error parsing leaderboard CSV:", error);
    return {
      entries: [],
      totalParticipants: 0,
      totalRewardsDistributedUSD: 0,
      totalRewardsDistributedLSK: 0,
    };
  }
}

export default function LeaderboardPage() {
  const leaderboardData = parseLeaderboardCSV();

  // Calculate achievement statistics
  const stats = {
    fastestFinishers: leaderboardData.entries.filter(e => e.fastestFinisher).length,
    bestProjects: leaderboardData.entries.filter(e => e.bestProject).length,
    bestSocialEngagement: leaderboardData.entries.filter(e => e.bestSocialEngagement).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">🏆 SpeedRun Leaderboard 2025</h1>
        <p className="text-lg opacity-80 mb-6">
          Celebrating the top builders and contributors in the SpeedRunLisk challenge
        </p>
      </div>

      {/* Leaderboard Table */}
      {leaderboardData.entries.length > 0 ? (
        <LeaderboardTable data={leaderboardData.entries} />
      ) : (
        <div className="alert alert-warning">
          <span>No leaderboard data available. Please check the CSV file.</span>
        </div>
      )}
    </div>
  );
}
