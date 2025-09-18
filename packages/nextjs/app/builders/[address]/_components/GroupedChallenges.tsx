import { ChallengeDetails } from "./ChallengeDetails";
import { ChallengeDetailsStatus } from "./ChallengeDetailsStatus";
import { ChallengeIconComputer, ChallengeIconRocket } from "./ChallengeGroupIcons";
import { GroupedChallengeTitle } from "./GroupedChallengeTitle";
import "./groupedChallenges.css";
import { type Address } from "viem";
import { ChallengeId, ReviewAction } from "~~/services/database/config/types";
import type { Challenges } from "~~/services/database/repositories/challenges";
import type { MergedUserChallenge } from "~~/services/database/repositories/mergedChallenges";
import { getSeaChallengeVisibilityStatus } from "~~/utils/sea-challenges";

const basicChallengeIds = new Set<ChallengeId>([
  ChallengeId.SIMPLE_NFT_EXAMPLE,
  ChallengeId.DECENTRALIZED_STAKING,
  ChallengeId.TOKEN_VENDOR,
  ChallengeId.DICE_GAME,
]);

// SEA challenge IDs
const seaBasicChallengeIds = new Set<string>([
  "sea-week-1-hello-token-nft",
  "sea-week-2-frontend-connect",
  "sea-week-3-indexing-display",
  "sea-week-4-oracle-sponsored",
]);

const seaAdvancedChallengeIds = new Set<string>(["sea-week-5-nft-badge-game", "sea-week-6-mini-dex-lending"]);

export type MappedChallenges = Challenges[number] & {
  reviewAction?: ReviewAction | null;
  submittedAt?: Date;
  reviewComment?: string | null;
  contractUrl?: string | null;
  frontendUrl?: string | null;
};

export function GroupedChallenges({
  address,
  challenges,
  userChallenges,
}: {
  address: Address;
  challenges: Challenges;
  userChallenges: MergedUserChallenge[];
}) {
  // Convert user challenges to mapped format, combining with challenge metadata
  const userMappedChallenges: MappedChallenges[] = [];

  // Add all static challenges from the challenges list
  challenges.forEach((challenge: Challenges[number]) => {
    const userChallenge = userChallenges.find(uc => uc.challengeId === challenge.id);

    userMappedChallenges.push({
      ...challenge,
      reviewAction: userChallenge?.reviewAction ?? null,
      submittedAt: userChallenge?.submittedAt ?? undefined,
      reviewComment: userChallenge?.reviewComment ?? null,
      contractUrl: userChallenge?.contractUrl ?? null,
      frontendUrl: userChallenge?.frontendUrl ?? null,
    });
  });

  // Add any additional user challenges that aren't in the static list (like completed SEA challenges)
  userChallenges.forEach(uc => {
    const existsInStatic = challenges.find(c => c.id === uc.challengeId);
    if (!existsInStatic) {
      userMappedChallenges.push({
        id: uc.challengeId,
        challengeName: uc.challenge.challengeName,
        description: uc.challenge.description,
        sortOrder: uc.challenge.sortOrder,
        github: uc.challenge.github || "",
        autograding: uc.challenge.autograding,
        disabled: uc.challenge.disabled,
        previewImage: uc.challenge.previewImage || "",
        icon: uc.challenge.icon || "",
        externalLink: uc.challenge.externalLink,
        reviewAction: uc.reviewAction,
        submittedAt: uc.submittedAt,
        reviewComment: uc.reviewComment,
        contractUrl: uc.contractUrl,
        frontendUrl: uc.frontendUrl,
      });
    }
  });

  userMappedChallenges.sort((a, b) => a.sortOrder - b.sortOrder);

  // Filter challenges into basic and advanced
  const basicChallenges = userMappedChallenges.filter(
    challenge => basicChallengeIds.has(challenge.id as ChallengeId) || seaBasicChallengeIds.has(challenge.id),
  );
  const advancedChallenges = userMappedChallenges.filter(
    challenge =>
      (!basicChallengeIds.has(challenge.id as ChallengeId) && !seaBasicChallengeIds.has(challenge.id)) ||
      seaAdvancedChallengeIds.has(challenge.id),
  );

  return (
    <div>
      <div className="collapse collapse-arrow bg-base-300 rounded-lg">
        <input type="checkbox" defaultChecked />
        <div className="collapse-title text-base font-medium">
          <GroupedChallengeTitle title="Ethereum 101" icon={<ChallengeIconComputer />} challenges={basicChallenges} />
        </div>
        <div className="collapse-content px-3 bg-base-100">
          <div className="mt-3 space-y-4 divide-y">
            {basicChallenges.map(challenge => {
              if (challenge.reviewAction) {
                return <ChallengeDetailsStatus key={challenge.id} challenge={challenge} />;
              }

              const isSeaChallenge = challenge.id.startsWith("sea-week-");
              const isComingSoon =
                isSeaChallenge && getSeaChallengeVisibilityStatus(challenge.id).status === "upcoming";

              return (
                <ChallengeDetails
                  key={challenge.id}
                  address={address}
                  challenge={challenge}
                  comingSoon={isComingSoon}
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-4 collapse collapse-arrow bg-base-300 rounded-lg">
        <input type="checkbox" defaultChecked={true} />
        <div className="collapse-title text-base font-medium">
          <GroupedChallengeTitle
            title="Advanced Concepts"
            icon={<ChallengeIconRocket />}
            challenges={advancedChallenges}
          />
        </div>
        <div className="collapse-content px-3 bg-base-100">
          <div className="mt-3 space-y-4 divide-y">
            {advancedChallenges.map(challenge => {
              if (challenge.reviewAction) {
                return <ChallengeDetailsStatus key={challenge.id} challenge={challenge} />;
              }

              const isSeaChallenge = challenge.id.startsWith("sea-week-");
              const isComingSoon =
                (isSeaChallenge && getSeaChallengeVisibilityStatus(challenge.id).status === "upcoming") ||
                challenge.id === ChallengeId.DEPLOY_TO_L2;

              return (
                <ChallengeDetails
                  key={challenge.id}
                  address={address}
                  challenge={challenge}
                  comingSoon={isComingSoon}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
