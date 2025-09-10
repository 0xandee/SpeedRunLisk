"use client";

import Link from "next/link";
import type { MappedChallenges } from "./GroupedChallenges";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { getWeekFromChallengeId } from "~~/utils/sea-challenges";

export function ChallengeDetails({
  address,
  challenge,
  comingSoon,
}: {
  address: Address;
  challenge: MappedChallenges;
  comingSoon?: boolean;
}) {
  const { address: connectedAddress } = useAccount();
  const isProfileOwner = connectedAddress?.toLowerCase() === address.toLowerCase();

  const shortedDescription = challenge.description.split(".")[0];

  // Determine the correct link based on challenge type
  const isSeaChallenge = challenge.id.startsWith("sea-week-");
  const weekNumber = isSeaChallenge ? getWeekFromChallengeId(challenge.id) : null;
  const challengeLink =
    isSeaChallenge && weekNumber ? `/sea-campaign/week/${weekNumber}` : `/challenge/${challenge.id}`;

  return (
    <div
      className={`text-base-content/50 transition ${
        !comingSoon || challenge.id === "sea-week-1-hello-token-nft" ? "hover:text-base-content" : ""
      }`}
    >
      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 bg-base-300 rounded-full font-semibold text-sm dark:bg-base-200">
              {challenge.sortOrder}
            </div>
            <h2 className="m-0 font-medium">
              {comingSoon && challenge.id !== "sea-week-1-hello-token-nft" ? (
                <span className="text-base-content/70">{challenge.challengeName}</span>
              ) : (
                <Link href={challengeLink} className="hover:underline">
                  {challenge.challengeName}
                </Link>
              )}
            </h2>
          </div>
          <div className="pl-8">
            <p className="mt-2 mb-0 text-sm">{shortedDescription}.</p>
          </div>
        </div>

        {isProfileOwner && (
          <div className="shrink-0 flex flex-col items-center">
            {comingSoon && challenge.id !== "sea-week-1-hello-token-nft" ? (
              <button className="btn btn-outline btn-sm rounded-md" disabled>
                Coming Soon
              </button>
            ) : (
              <Link href={challengeLink} className="btn btn-primary btn-sm rounded-md">
                Start
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
