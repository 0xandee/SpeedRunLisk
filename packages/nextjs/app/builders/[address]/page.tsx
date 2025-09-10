import { notFound } from "next/navigation";
import { GroupedChallenges } from "./_components/GroupedChallenges";
import { PointsBar } from "./_components/PointsBar";
import { UserProfileCard } from "./_components/UserProfileCard";
import { Metadata } from "next";
import { isAddress } from "viem";
import { RouteRefresher } from "~~/components/RouteRefresher";
import { getBatchById } from "~~/services/database/repositories/batches";
import { getLatestSubmissionPerChallengeByUser } from "~~/services/database/repositories/userChallenges";
import { getUserByAddress, getUserPoints } from "~~/services/database/repositories/users";
import { getAllSeaChallenges, getSeaChallengeVisibilityStatus } from "~~/utils/sea-challenges";
import { getShortAddressAndEns } from "~~/utils/short-address-and-ens";
import { getTotalXP } from "~~/utils/xp";

type Props = {
  params: Promise<{
    address: string;
  }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const address = params.address;

  if (!isAddress(address)) {
    return {
      title: "User Not Found",
    };
  }
  const { shortAddress } = await getShortAddressAndEns(address);
  const title = shortAddress;

  // Base URL - replace with your actual domain in production
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  const ogImageUrl = `${baseUrl}/api/og?address=${address}`;

  return {
    metadataBase: new URL(baseUrl),
    title,
    openGraph: {
      title,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `QR Code for ${address}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [ogImageUrl],
    },
  };
}

export default async function BuilderPage(props: { params: Promise<{ address: string }> }) {
  const params = await props.params;
  const { address } = params;

  const challenges = getAllSeaChallenges();
  const userChallenges = await getLatestSubmissionPerChallengeByUser(address);
  const user = await getUserByAddress(address);

  let userBatch;
  if (user?.batchId) {
    userBatch = await getBatchById(user.batchId);
  }
  const points = await getUserPoints(address);

  if (!user) {
    notFound();
  }

  // Filter SEA challenges to show active or upcoming ones
  const filteredChallenges = challenges.filter(challenge => {
    const status = getSeaChallengeVisibilityStatus(challenge.id);
    return status.status === "active" || status.status === "upcoming";
  });

  // Transform SEA challenges to match the expected database challenge format
  const transformedChallenges = filteredChallenges.map(challenge => ({
    id: challenge.id,
    challengeName: challenge.title,
    description: challenge.description,
    sortOrder: challenge.weekNumber,
    github: "",
    autograding: true,
    disabled: false,
    previewImage: "",
    icon: "",
    externalLink: null,
  }));

  const totalPoints = getTotalXP(filteredChallenges.length);

  return (
    <>
      <RouteRefresher />
      <div className="max-w-[1440px] w-full mx-auto px-4 py-8">
        {/* Header with Lisk Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img 
            src="/logos/01-Profile/lisk-profile-white.svg" 
            alt="Lisk" 
            className="h-8 w-8" 
          />
          <h1 className="text-2xl font-bold text-primary">Builder Profile</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <UserProfileCard user={user} batch={userBatch} />
            {/* <PointsBar points={points} totalPoints={totalPoints} /> */}
          </div>
          <div className="lg:col-span-3">
            <GroupedChallenges address={address} challenges={transformedChallenges} userChallenges={userChallenges} />
          </div>
        </div>
      </div>
    </>
  );
}
