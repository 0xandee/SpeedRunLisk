"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  SEA_CAMPAIGN_CONFIG,
  SEA_CAMPAIGN_METADATA,
  getAllSeaChallenges,
  getChallengeStartDate,
  getSeaChallengeVisibilityStatus,
} from "~~/utils/sea-challenges";

interface UserProgress {
  isParticipant: boolean;
  progress: {
    totalWeeksCompleted: number;
    completionPercentage: number;
    isGraduated: boolean;
  };
  nextWeek?: {
    weekNumber: number;
    title: string;
    challengeId: string;
  };
}

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetchedAddress, setLastFetchedAddress] = useState<string | undefined>();

  const challenges = getAllSeaChallenges();

  const fetchUserProgress = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/sea-campaign/progress/${address}`);
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data);
      }
    } catch (error) {
      console.error("Failed to fetch user progress:", error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address && address !== lastFetchedAddress) {
      fetchUserProgress();
      setLastFetchedAddress(address);
    }
  }, [address, fetchUserProgress]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <header className="text-center my-32">
        <div className="mb-6">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4">🏃‍♂️ Speedrun Lisk</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Onboarding Challenge</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-8">
          <div className="badge badge-lg badge-outline p-4">
            From {SEA_CAMPAIGN_CONFIG.startDate} to {SEA_CAMPAIGN_CONFIG.endDate}
          </div>
          <div className="badge badge-lg badge-primary p-4">💰 $2,000 Total Completion Bonuses</div>
        </div>

        <p className="text-lg text-base-content/70 max-w-3xl mx-auto mb-8">
          Join Southeast Asia&apos;s premier Web3 onboarding challenge! Master blockchain development on Lisk in 6
          progressive weeks, from your first smart contract to advanced DeFi applications.
        </p>

        {/* User Status */}
        {isConnected ? (
          <></>
        ) : (
          <div className="alert alert-info max-w-sm mx-auto px-8">
            <span className="block text-center whitespace-normal">
              Connect your wallet to track your progress and submit challenges!
            </span>
          </div>
        )}
      </header>

      {/* Weekly Timeline */}
      <section className="my-12">
        <h2 className="text-3xl font-bold text-center mb-8">6-Week Progressive Learning Path</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge, index) => (
            <div
              key={challenge.id}
              className={`card shadow-lg transition-all hover:shadow-xl border-2 ${(userProgress?.progress?.totalWeeksCompleted ?? 0) >= challenge.weekNumber
                ? "border-success bg-success/10"
                : userProgress?.nextWeek?.weekNumber === challenge.weekNumber
                  ? "border-primary bg-primary/10"
                  : "border-base-300 bg-base-100"
                }`}
            >
              <div className="card-body">
                <div className="flex items-center justify-between mb-3">
                  <div className="badge badge-primary">Week {challenge.weekNumber}</div>
                  <div className="text-sm text-base-content/60">Starts: {getChallengeStartDate(challenge.dueDate)}</div>
                  {(userProgress?.progress?.totalWeeksCompleted ?? 0) >= challenge.weekNumber && (
                    <div className="text-success">✅</div>
                  )}
                </div>

                <h3 className="card-title text-lg mb-2">{challenge.title}</h3>
                <p className="text-sm text-base-content/70 mb-4 line-clamp-3">{challenge.description}</p>

                {/* <div className="flex flex-wrap gap-1 mb-4">
                  {challenge.socialHashtags.map((tag, i) => (
                    <span key={i} className="badge badge-outline badge-xs p-3">
                      {tag}
                    </span>
                  ))}
                </div> */}

                <div className="card-actions justify-end mt-4">
                  {getSeaChallengeVisibilityStatus(challenge.id).status === "upcoming" && challenge.weekNumber !== 1 ? (
                    <button className="btn btn-sm btn-outline btn-disabled" disabled>
                      Coming Soon
                    </button>
                  ) : (
                    <Link href={`/sea-campaign/week/${challenge.weekNumber}`} className="btn btn-sm btn-primary">
                      View Challenge
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="my-12">
        <h2 className="text-3xl font-bold text-center mb-8">Why Join SEA Challenge?</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body text-center">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="font-bold text-lg mb-2">Learn by Building</h3>
              <p className="text-sm">Hands-on challenges that teach real Web3 development skills</p>
            </div>
          </div>

          <div className="card bg-base-200 shadow-lg">
            <div className="card-body text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-bold text-lg mb-2">Earn While Learning</h3>
              <p className="text-sm">$2,000 in completion bonuses for top performers</p>
            </div>
          </div>

          <div className="card bg-base-200 shadow-lg">
            <div className="card-body text-center">
              <div className="text-4xl mb-4">🌏</div>
              <h3 className="font-bold text-lg mb-2">SEA Community</h3>
              <p className="text-sm">Connect with builders across Southeast Asia</p>
            </div>
          </div>

          <div className="card bg-base-200 shadow-lg">
            <div className="card-body text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-bold text-lg mb-2">Lisk Network</h3>
              <p className="text-sm">Deploy on fast, low-cost Lisk Sepolia testnet</p>
            </div>
          </div>
        </div>
      </section>

      {/* Network Info */}
      {/* <section className="mb-12">
        <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">🔗 Lisk Sepolia Network</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Chain ID</div>
                <div className="stat-value text-primary">{SEA_CAMPAIGN_CONFIG.networkConfig.chainId}</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">RPC URL</div>
                <div className="stat-value text-xs break-all">{SEA_CAMPAIGN_CONFIG.networkConfig.rpcUrl}</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Explorer</div>
                <div className="stat-desc">
                  <a
                    href={SEA_CAMPAIGN_CONFIG.networkConfig.blockExplorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Blockscout
                  </a>
                </div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Faucet</div>
                <div className="stat-desc">
                  <a
                    href={SEA_CAMPAIGN_CONFIG.networkConfig.faucetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Get Test LSK
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
}
