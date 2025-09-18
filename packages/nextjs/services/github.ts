const GITHUB_RAW_BASE_URL = "https://raw.githubusercontent.com";

type GithubRepoInfo = {
  owner: string;
  repo: string;
  branch: string;
};

export function parseGithubUrl(githubString: string): GithubRepoInfo {
  const [repoPath, branch] = githubString.split(":");
  const [owner, repo] = repoPath.split("/");

  return {
    owner,
    repo,
    branch,
  };
}

export async function fetchLocalChallengeReadme(githubString: string): Promise<string> {
  const { branch } = parseGithubUrl(githubString);
  const fs = await import("fs/promises");
  const path = await import("path");

  const branchWithoutChallengePrefix = branch.replace("challenge-", "");
  const filePath = path.join(process.cwd(), "public", "readme", `${branchWithoutChallengePrefix}.md`);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    throw new Error(`Failed to read README file: ${filePath}. ${error}`);
  }
}

export async function fetchLocalSpeedrunReadme(speedrunId: string): Promise<string> {
  // In development or build time, try filesystem first
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "public", "speedrun", `${speedrunId}.md`);
      const content = await fs.readFile(filePath, "utf-8");
      return content;
    } catch (fsError) {
      console.warn(`Filesystem read failed in development: ${fsError}`);
    }
  }

  // For production runtime or fallback, fetch from public URL
  try {
    // Use the configured app URL for reliable fetching
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.speedrunlisk.xyz";
    const response = await fetch(`${baseUrl}/speedrun/${speedrunId}.md`, {
      // Add cache control for better reliability
      cache: "force-cache",
      next: { revalidate: 21600 }, // 6 hours
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    if (!content || content.trim().length === 0) {
      throw new Error("Empty content received");
    }

    return content;
  } catch (fetchError) {
    throw new Error(`Failed to fetch speedrun file: ${speedrunId}.md. Error: ${fetchError}`);
  }
}

export async function fetchGithubChallengeReadme(githubString: string): Promise<string> {
  const { owner, repo, branch } = parseGithubUrl(githubString);

  // TODO: Remove this hotfix after github url scaffold-eth/se-2-challenges  works correctly
  let correctOwner = owner;
  if (owner === "scaffold-eth" && repo === "se-2-challenges") {
    correctOwner = "BuidlGuidl";
  }
  const readmeUrl = `${GITHUB_RAW_BASE_URL}/${correctOwner}/${repo}/${branch}/README.md`;

  const response = await fetch(readmeUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch README: ${response.statusText}`);
  }

  return response.text();
}

export const getGithubReadmeUrlFromBranchUrl = (branchUrl: string): string =>
  branchUrl.replace("github.com", "raw.githubusercontent.com").replace(/\/tree\/(.*)/, "/$1/README.md");

export const getGithubApiReadmeFromRepoUrl = (repoUrl: string): string =>
  repoUrl.replace(/github\.com\/(.*?)\/(.*$)/, "api.github.com/repos/$1/$2/readme");

export const isGithubBranch = (url: string): boolean => /github\.com\/.*?\/.*?\/tree\/.*/.test(url);

export const fetchGithubBuildReadme = async (githubUrl: string): Promise<string | undefined> => {
  try {
    let readmeUrl: string;

    if (isGithubBranch(githubUrl)) {
      readmeUrl = getGithubReadmeUrlFromBranchUrl(githubUrl);
    } else {
      const apiUrl = getGithubApiReadmeFromRepoUrl(githubUrl);

      const ghApiResponse = await fetch(apiUrl);
      if (!ghApiResponse.ok) {
        throw new Error("Failed to fetch GitHub API README info");
      }
      const data = await ghApiResponse.json();
      readmeUrl = data.download_url;
    }

    const response = await fetch(readmeUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch README content");
    }
    return await response.text();
  } catch (err) {
    console.log("error fetching build README", err);
    return undefined;
  }
};
