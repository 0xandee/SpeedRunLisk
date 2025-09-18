import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { mdxComponents } from "~~/app/_components/mdx";
import { fetchLocalSpeedrunReadme } from "~~/services/github";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";
import { SPEEDRUN_METADATA } from "~~/utils/speedruns";

// 6 hours
export const revalidate = 21600;

// Force static generation for all speedrun pages
export const dynamic = "force-static";

export async function generateStaticParams() {
  // Get all speedrun files from public/speedrun directory
  const speedrunIds = [
    "ch1-deploy-verify",
    "ch2-frontend-connect",
    "ch3-index-display",
    "ch4-oracle-sponsored",
    "ch5-nft-badge-game",
    "ch6-mini-dex-lending",
    "setup",
    "start-here",
  ];

  return speedrunIds.map(speedrunId => ({
    speedrunId,
  }));
}

export async function generateMetadata(props: { params: Promise<{ speedrunId: string }> }) {
  const params = await props.params;
  const staticMetadata = SPEEDRUN_METADATA[params.speedrunId as keyof typeof SPEEDRUN_METADATA];

  return getMetadata({
    title: staticMetadata?.title || `SpeedRun: ${params.speedrunId}`,
    description: staticMetadata?.description || "Learn to build on Lisk with step-by-step tutorials",
    imageRelativePath: staticMetadata?.previewImage || undefined,
  });
}

export default async function SpeedrunPage(props: { params: Promise<{ speedrunId: string }> }) {
  const params = await props.params;
  const speedrunId = params.speedrunId;

  // Check if this speedrun exists
  const staticMetadata = SPEEDRUN_METADATA[speedrunId as keyof typeof SPEEDRUN_METADATA];
  if (!staticMetadata) {
    notFound();
  }

  let speedrunReadme: string;
  try {
    speedrunReadme = await fetchLocalSpeedrunReadme(speedrunId);
  } catch (error) {
    console.error(`Failed to load speedrun readme for ${speedrunId}:`, error);
    notFound();
  }

  return (
    <div className="flex flex-col items-center py-8 px-5 xl:p-12 relative max-w-[100vw]">
      {/* Welcome Banner */}
      {/* <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          🚀 SpeedRun Lisk
        </h1>
        <p className="text-lg opacity-75">Master Lisk development with hands-on tutorials</p>
      </div> */}

      {speedrunReadme ? (
        <>
          <div className="prose dark:prose-invert max-w-fit break-words lg:max-w-[850px]">
            <MDXRemote
              source={speedrunReadme}
              options={{
                mdxOptions: {
                  rehypePlugins: [rehypeRaw],
                  remarkPlugins: [remarkGfm],
                  format: "md",
                },
              }}
              components={mdxComponents}
            />
          </div>
          {/* GitHub Link */}
          <a
            href="https://github.com/LiskHQ/scaffold-lisk"
            className="block mt-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="btn btn-outline btn-sm sm:btn-md">
              <span className="text-xs sm:text-sm">View Scaffold-Lisk on GitHub</span>
              <ArrowTopRightOnSquareIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </a>
        </>
      ) : (
        <div>Failed to load speedrun content</div>
      )}
    </div>
  );
}
