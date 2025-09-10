"use client";

import { AfterSreCard } from "./AfterSreCard";
import { AfterSreLine } from "./AfterSreLine";
import { ChallengeExpandedCard } from "./ChallengeExpandedCard";
import { Hero } from "./Hero";
import { OnboardingBatchesCard } from "./OnboardingBatchesCard";
import { useAccount } from "wagmi";
import { useUserChallenges } from "~~/hooks/useUserChallenges";
import { ChallengeId } from "~~/services/database/config/types";
import { Challenges } from "~~/services/database/repositories/challenges";
import { SeaChallengeCountdown } from "~~/components/SeaChallengeCountdown";
import { SeaChallengeComingSoon } from "~~/components/SeaChallengeComingSoon";
import { getSeaChallengeVisibilityStatus, seaCampaignChallenges, SEA_CAMPAIGN_CONFIG } from "~~/utils/sea-challenges";

export const HomepageClient = ({ challenges }: { challenges: Challenges }) => {
  const { address: connectedAddress } = useAccount();

  const { data: userChallenges } = useUserChallenges(connectedAddress);

  // Check if campaign has started
  const now = new Date();
  const campaignStartDate = new Date(SEA_CAMPAIGN_CONFIG.startDate);
  const campaignHasStarted = now >= campaignStartDate;

  // Filter to only show SEA campaign challenges
  const seaChallenges = challenges.filter(challenge =>
    seaCampaignChallenges.includes(challenge.id as any)
  );

  // Sort SEA challenges by week number
  const sortedSeaChallenges = seaChallenges.sort((a, b) => {
    const aMeta = getSeaChallengeVisibilityStatus(a.id);
    const bMeta = getSeaChallengeVisibilityStatus(b.id);
    return aMeta.status === 'active' && bMeta.status !== 'active' ? -1 :
      bMeta.status === 'active' && aMeta.status !== 'active' ? 1 : 0;
  });

  return (
    <div>
      <Hero />
      <div className="bg-base-200">
        {/* Show countdown if there are upcoming challenges */}
        <SeaChallengeCountdown />

        {/* Only show content below countdown if campaign has started */}
        {campaignHasStarted && (
          <>
            {/* Render SEA challenges based on their timing */}
            {sortedSeaChallenges.map((challenge) => {
              const visibilityStatus = getSeaChallengeVisibilityStatus(challenge.id);

              if (visibilityStatus.status === 'upcoming') {
                // Show coming soon for upcoming challenges
                return (
                  <SeaChallengeComingSoon
                    key={challenge.id}
                    challengeId={challenge.id}
                  />
                );
              } else {
                // Show active challenge (no more expired status)
                return (
                  <ChallengeExpandedCard
                    key={challenge.id}
                    challengeId={challenge.id as ChallengeId}
                    userChallenges={userChallenges}
                    challenges={challenges}
                  />
                );
              }
            })}

            <OnboardingBatchesCard userChallenges={userChallenges} />

            <div className="flex flex-col xl:flex-row justify-center mx-auto relative">
              <AfterSreLine />
              <div className="hidden xl:flex flex-grow bg-[#96EAEA] dark:bg-[#3AACAD]" />
              <AfterSreCard
                title="Lisk Tech Tree"
                description="Check this advanced Solidity challenges to test your Lisk dev skills."
                externalLink="https://www.ethtechtree.com"
                buttonText="Join"
                previewImage="/assets/challenges/techTree.svg"
                bgClassName="bg-[#96EAEA] dark:bg-[#3AACAD]"
              />
              <AfterSreCard
                title="Capture the Flag"
                description="Join our CTF game and hack your way through 12 Smart Contract challenges."
                externalLink="https://ctf.buidlguidl.com"
                buttonText="Start"
                previewImage="/assets/challenges/ctf.svg"
                bgClassName="bg-base-300"
              />
              <div className="hidden xl:flex flex-grow bg-base-300" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
