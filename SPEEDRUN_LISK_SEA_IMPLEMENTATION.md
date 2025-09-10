# Speedrun Lisk Campaign Implementation Changes

## Overview

This document outlines the technical implementation changes required for the Speedrun Lisk Onboarding Challenge, a 7-week progressive learning campaign targeting 200+ new Web3 developers from Southeast Asia.

**Campaign Timeline**: September 15 - October 31, 2025  
**Target**: Onboard 200+ completely new Web3 developers from SEA to Lisk ecosystem  
**Budget**: $2,000 total for completion bonuses

## Database Schema Changes

### New Tables

#### 1. `sea_campaign_submissions`

```sql
CREATE TABLE sea_campaign_submissions (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  week_number INTEGER NOT NULL,
  github_url TEXT NOT NULL,
  contract_address VARCHAR(42),
  tx_hash VARCHAR(66),
  demo_url TEXT,
  social_post_url TEXT NOT NULL,
  country VARCHAR(100),
  telegram_handle VARCHAR(100),
  payout_wallet VARCHAR(42),
  submission_date TIMESTAMP DEFAULT NOW(),
  review_status VARCHAR(20) DEFAULT 'SUBMITTED', -- SUBMITTED, REVIEWED, APPROVED, REJECTED
  mentor_feedback TEXT,
  completion_bonus_amount DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (user_address) REFERENCES users(address),
  UNIQUE(user_address, week_number)
);
```

#### 2. `sea_campaign_progress`

```sql
CREATE TABLE sea_campaign_progress (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  week_1_completed BOOLEAN DEFAULT FALSE,
  week_2_completed BOOLEAN DEFAULT FALSE,
  week_3_completed BOOLEAN DEFAULT FALSE,
  week_4_completed BOOLEAN DEFAULT FALSE,
  week_5_completed BOOLEAN DEFAULT FALSE,
  week_6_completed BOOLEAN DEFAULT FALSE,
  total_weeks_completed INTEGER DEFAULT 0,
  is_graduated BOOLEAN DEFAULT FALSE,
  registration_date TIMESTAMP DEFAULT NOW(),
  graduation_date TIMESTAMP,
  total_bonus_earned DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (user_address) REFERENCES users(address),
  UNIQUE(user_address)
);
```

#### 3. `sea_campaign_rewards`

```sql
CREATE TABLE sea_campaign_rewards (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  week_number INTEGER NOT NULL,
  reward_type VARCHAR(50) NOT NULL, -- 'TOP_QUALITY', 'TOP_ENGAGEMENT', 'FAST_COMPLETION'
  reward_amount DECIMAL(10,2) NOT NULL,
  awarded_date TIMESTAMP DEFAULT NOW(),
  paid_date TIMESTAMP,
  payment_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PAID, FAILED
  payment_tx_hash VARCHAR(66),
  FOREIGN KEY (user_address) REFERENCES users(address)
);
```

### Schema Extensions

#### Users Table Updates

```sql
-- Add new columns to existing users table
ALTER TABLE users
ADD COLUMN country VARCHAR(100),
ADD COLUMN telegram_handle VARCHAR(100),
ADD COLUMN payout_wallet VARCHAR(42),
ADD COLUMN sea_campaign_participant BOOLEAN DEFAULT FALSE,
ADD COLUMN sea_campaign_registration_date TIMESTAMP;
```

#### UserChallenges Table Updates

```sql
-- Add new columns to existing user_challenges table
ALTER TABLE user_challenges
ADD COLUMN campaign_id VARCHAR(50),
ADD COLUMN week_number INTEGER,
ADD COLUMN social_post_url TEXT,
ADD COLUMN mentor_assigned VARCHAR(42),
ADD COLUMN completion_time_hours INTEGER;
```

## New Challenge Definitions

### Challenge Configuration Updates

#### File: `packages/nextjs/services/database/config/types.ts`

```typescript
// Add new challenge types
export const seaCampaignChallenges = [
	"sea-week-1-hello-token-nft",
	"sea-week-2-frontend-connect",
	"sea-week-3-indexing-display",
	"sea-week-4-oracle-sponsored",
	"sea-week-5-nft-badge-game",
	"sea-week-6-mini-dex-lending",
] as const;

export type SeaCampaignChallenge = (typeof seaCampaignChallenges)[number];
```

#### File: `packages/nextjs/utils/sea-challenges.ts` (New)

```typescript
export const SEA_CAMPAIGN_METADATA = {
	"sea-week-1-hello-token-nft": {
		title: "Week 1: Hello Token + NFT",
		description:
			"Deploy and verify your first ERC20 token and ERC721 NFT contracts on Lisk Sepolia",
		dueDate: "2025-09-21",
		reward: "NFT Badge for completion",
		guides: [
			"/speedrun/start-here",
			"/speedrun/setup",
			"/speedrun/ch1-deploy-verify",
		],
		videoUrl: "V1 (10m): From zero → first deploy & verify",
		socialHashtags: ["#SpeedrunLiskSEA", "#W1", "@LiskSEA"],
		requiredSubmissions: [
			"contract_address",
			"tx_hash",
			"github_url",
			"social_post_url",
		],
		completionBonus: 0,
		topPerformersBonus: 50, // Top 10 get $50 each
		kpi: "≥200 verified contracts",
	},
	"sea-week-2-frontend-connect": {
		title: "Week 2: Frontend Connect",
		description:
			"Connect your smart contracts to a React/Next.js frontend with wallet integration",
		dueDate: "2025-09-28",
		reward: "Frontend Integration Badge",
		guides: ["/speedrun/ch2-frontend-connect"],
		videoUrl: "V2 (10m): Connect React/Next (hooks, read/write demo)",
		socialHashtags: ["#SpeedrunLiskSEA", "#W2", "@LiskSEA"],
		requiredSubmissions: ["demo_url", "github_url", "social_post_url"],
		completionBonus: 0,
		topPerformersBonus: 50,
		kpi: "≥100 learners complete Frontend Connect with screenshots",
	},
	"sea-week-3-indexing-display": {
		title: "Week 3: Indexing & Display",
		description:
			"Index blockchain data and display it in your frontend with pagination",
		dueDate: "2025-10-05",
		reward: "Data Indexing Badge",
		guides: [
			"/speedrun/ch3-index-display",
			"/speedrun/indexer-caching-tips",
		],
		videoUrl:
			"V3 (10m): Index & display (init, entities, queries, paginate)",
		socialHashtags: ["#SpeedrunLiskSEA", "#W3", "@LiskSEA"],
		requiredSubmissions: ["demo_url", "github_url", "social_post_url"],
		completionBonus: 0,
		topPerformersBonus: 50,
		kpi: "≥80 learners ship indexed list/detail UI",
	},
	"sea-week-4-oracle-sponsored": {
		title: "Week 4: Oracle + Sponsored UX",
		description:
			"Integrate price oracles or implement gasless transactions for better UX",
		dueDate: "2025-10-12",
		reward: "Oracle Integration Badge",
		guides: ["/speedrun/ch4-oracle-sponsored", "/speedrun/relayer-readme"],
		videoUrl:
			"V4 (10m): Oracles & sponsored UX (toggle sponsorship via env)",
		socialHashtags: ["#SpeedrunLiskSEA", "#W4", "@LiskSEA"],
		requiredSubmissions: ["demo_url", "github_url", "social_post_url"],
		completionBonus: 0,
		topPerformersBonus: 50,
		kpi: "≥60 learners implement either feed read or sponsored flow",
	},
	"sea-week-5-nft-badge-game": {
		title: "Week 5: NFT Badge / Mini-Game",
		description:
			"Create an interactive NFT badge system or simple on-chain game",
		dueDate: "2025-10-19",
		reward: "Game Developer Badge",
		guides: [
			"/speedrun/challenge-nft-badge",
			"/speedrun/challenge-mini-game",
			"/speedrun/showcase-guide",
		],
		videoUrl:
			"V5 (10m): Demo implementation NFT badge and mini-game + submission checklist",
		socialHashtags: ["#SpeedrunLiskSEA", "#W5", "@LiskSEA"],
		requiredSubmissions: ["demo_url", "github_url", "social_post_url"],
		completionBonus: 0,
		topPerformersBonus: 50,
		kpi: "≥40 learners complete a track; 6 demos showcased",
	},
	"sea-week-6-mini-dex-lending": {
		title: "Week 6: Mini-DEX / Lending App",
		description:
			"Build a simple DEX, lending protocol, or prediction market",
		dueDate: "2025-10-26",
		reward: "DeFi Developer Badge",
		guides: [
			"/speedrun/advanced-dex-stub",
			"/speedrun/advanced-lending-stub",
			"/speedrun/advanced-prediction-stub",
		],
		videoUrl: "V6 (10m): Demo implementation dex and lending app",
		socialHashtags: ["#SpeedrunLiskSEA", "#W6", "@LiskSEA"],
		requiredSubmissions: ["demo_url", "github_url", "social_post_url"],
		completionBonus: 20, // Next 50 fastest get $20 each
		topPerformersBonus: 50, // Top 10 get $50 each
		kpi: "≥30 projects complete an advanced track",
	},
};

export const COMPLETION_BONUS_STRUCTURE = {
	topQualitySubmissions: { amount: 50, count: 10 }, // Top 10 best quality submissions per week: $50 each
	topEngagementSubmissions: { amount: 50, count: 10 }, // Top 10 best social media engagement: $50 each
	fastestCompletions: { amount: 20, count: 50 }, // Next 50 fastest finishers: $20 each
	totalBudget: 2000,
};
```

## Frontend Changes

### New Pages

#### 1. SEA Campaign Landing Page

**File**: `packages/nextjs/app/sea-campaign/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { SEA_CAMPAIGN_METADATA } from "~~/utils/sea-challenges";

export default function SeaCampaignPage() {
	const { address } = useAccount();
	const [registrationStep, setRegistrationStep] = useState<
		"info" | "register" | "dashboard"
	>("info");

	return (
		<div className="container mx-auto px-4 py-8">
			<header className="text-center mb-12">
				<h1 className="text-4xl font-bold text-primary mb-4">
					🏃‍♂️ Speedrun Lisk Onboarding Challenge
				</h1>
				<p className="text-lg text-base-content/70 mb-2">
					September 15 - October 31, 2025
				</p>
				<p className="text-xl mb-6">
					Onboard 200+ Web3 developers from SEA to Lisk ecosystem in 7
					weeks
				</p>
				<div className="badge badge-primary badge-lg">
					$2,000 Total Completion Bonuses
				</div>
			</header>

			{/* Weekly Timeline */}
			<section className="mb-12">
				<h2 className="text-2xl font-bold mb-6 text-center">
					7-Week Progressive Learning Path
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{Object.entries(SEA_CAMPAIGN_METADATA).map(
						([challengeId, metadata], index) => (
							<div
								key={challengeId}
								className="card bg-base-200 shadow-lg"
							>
								<div className="card-body">
									<div className="flex items-center gap-2 mb-2">
										<div className="badge badge-secondary">
											Week {index + 1}
										</div>
										<div className="text-sm text-base-content/60">
											{metadata.dueDate}
										</div>
									</div>
									<h3 className="card-title text-lg">
										{metadata.title}
									</h3>
									<p className="text-sm text-base-content/70 mb-4">
										{metadata.description}
									</p>
									<div className="text-xs text-success font-semibold">
										{metadata.kpi}
									</div>
									{metadata.completionBonus > 0 && (
										<div className="badge badge-success">
											${metadata.completionBonus} bonus
										</div>
									)}
								</div>
							</div>
						)
					)}
				</div>
			</section>

			{/* Registration/Dashboard */}
			{registrationStep === "info" && (
				<section className="text-center">
					<button
						className="btn btn-primary btn-lg"
						onClick={() => setRegistrationStep("register")}
					>
						Join the Challenge
					</button>
				</section>
			)}
		</div>
	);
}
```

#### 2. Weekly Challenge Pages

**File**: `packages/nextjs/app/sea-campaign/week/[weekNumber]/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { SEA_CAMPAIGN_METADATA } from "~~/utils/sea-challenges";
import { SeaSubmissionForm } from "~~/components/sea-campaign/SeaSubmissionForm";
import { WeeklyLeaderboard } from "~~/components/sea-campaign/WeeklyLeaderboard";

export default function WeeklyChallengePage() {
	const params = useParams();
	const weekNumber = parseInt(params.weekNumber as string);

	const challengeId = Object.keys(SEA_CAMPAIGN_METADATA)[weekNumber - 1];
	const challengeMetadata = SEA_CAMPAIGN_METADATA[challengeId];

	if (!challengeMetadata) {
		return <div>Challenge not found</div>;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<header className="mb-8">
				<div className="breadcrumbs text-sm mb-4">
					<ul>
						<li>
							<a href="/sea-campaign">SEA Campaign</a>
						</li>
						<li>Week {weekNumber}</li>
					</ul>
				</div>

				<h1 className="text-3xl font-bold mb-4">
					{challengeMetadata.title}
				</h1>
				<p className="text-lg text-base-content/70 mb-4">
					{challengeMetadata.description}
				</p>

				<div className="flex flex-wrap gap-4 mb-6">
					<div className="badge badge-primary">
						Due: {challengeMetadata.dueDate}
					</div>
					<div className="badge badge-secondary">
						{challengeMetadata.reward}
					</div>
					{challengeMetadata.topPerformersBonus > 0 && (
						<div className="badge badge-success">
							Top 10: ${challengeMetadata.topPerformersBonus} each
						</div>
					)}
				</div>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Challenge Content */}
				<div className="lg:col-span-2">
					<div className="card bg-base-100 shadow-lg mb-6">
						<div className="card-body">
							<h2 className="card-title">
								📚 Learning Resources
							</h2>
							<ul className="list-disc list-inside space-y-2">
								{challengeMetadata.guides.map(
									(guide, index) => (
										<li key={index}>
											<a
												href={guide}
												className="link link-primary"
											>
												{guide}
											</a>
										</li>
									)
								)}
							</ul>

							<div className="mt-4">
								<h3 className="font-semibold mb-2">
									📹 Video Guide
								</h3>
								<p className="text-sm text-base-content/70">
									{challengeMetadata.videoUrl}
								</p>
							</div>
						</div>
					</div>

					<SeaSubmissionForm
						weekNumber={weekNumber}
						challengeId={challengeId}
					/>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					<div className="card bg-base-200 shadow-lg">
						<div className="card-body">
							<h3 className="card-title text-lg">
								🎯 This Week's Goal
							</h3>
							<p className="text-sm">{challengeMetadata.kpi}</p>
						</div>
					</div>

					<div className="card bg-base-200 shadow-lg">
						<div className="card-body">
							<h3 className="card-title text-lg">
								📱 Social Media
							</h3>
							<p className="text-sm mb-2">
								Post proof-of-work with:
							</p>
							<div className="flex flex-wrap gap-1">
								{challengeMetadata.socialHashtags.map(
									(tag, index) => (
										<span
											key={index}
											className="badge badge-outline text-xs"
										>
											{tag}
										</span>
									)
								)}
							</div>
						</div>
					</div>

					<WeeklyLeaderboard weekNumber={weekNumber} />
				</div>
			</div>
		</div>
	);
}
```

### New Components

#### 1. SEA Submission Form

**File**: `packages/nextjs/components/sea-campaign/SeaSubmissionForm.tsx`

```typescript
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";

interface SeaSubmissionFormProps {
	weekNumber: number;
	challengeId: string;
}

export function SeaSubmissionForm({
	weekNumber,
	challengeId,
}: SeaSubmissionFormProps) {
	const { address } = useAccount();
	const [formData, setFormData] = useState({
		githubUrl: "",
		contractAddress: "",
		txHash: "",
		demoUrl: "",
		socialPostUrl: "",
		country: "",
		telegramHandle: "",
		payoutWallet: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!address) {
			toast.error("Please connect your wallet first");
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch("/api/sea-campaign/submit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					weekNumber,
					challengeId,
					userAddress: address,
					...formData,
				}),
			});

			if (response.ok) {
				toast.success("Submission successful! 🎉");
				setFormData({
					githubUrl: "",
					contractAddress: "",
					txHash: "",
					demoUrl: "",
					socialPostUrl: "",
					country: "",
					telegramHandle: "",
					payoutWallet: "",
				});
			} else {
				const error = await response.text();
				toast.error(`Submission failed: ${error}`);
			}
		} catch (error) {
			toast.error("Network error. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="card bg-base-100 shadow-lg">
			<div className="card-body">
				<h2 className="card-title">
					📝 Submit Your Week {weekNumber} Challenge
				</h2>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="form-control">
						<label className="label">
							<span className="label-text">
								GitHub Repository URL *
							</span>
						</label>
						<input
							type="url"
							placeholder="https://github.com/username/repo"
							className="input input-bordered"
							value={formData.githubUrl}
							onChange={(e) =>
								setFormData({
									...formData,
									githubUrl: e.target.value,
								})
							}
							required
						/>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Contract Address</span>
						</label>
						<input
							type="text"
							placeholder="0x..."
							className="input input-bordered"
							value={formData.contractAddress}
							onChange={(e) =>
								setFormData({
									...formData,
									contractAddress: e.target.value,
								})
							}
						/>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">
								Deploy Transaction Hash
							</span>
						</label>
						<input
							type="text"
							placeholder="0x..."
							className="input input-bordered"
							value={formData.txHash}
							onChange={(e) =>
								setFormData({
									...formData,
									txHash: e.target.value,
								})
							}
						/>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Demo URL</span>
						</label>
						<input
							type="url"
							placeholder="https://your-app.vercel.app"
							className="input input-bordered"
							value={formData.demoUrl}
							onChange={(e) =>
								setFormData({
									...formData,
									demoUrl: e.target.value,
								})
							}
						/>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">
								Social Media Post URL *
							</span>
						</label>
						<input
							type="url"
							placeholder="https://twitter.com/username/status/..."
							className="input input-bordered"
							value={formData.socialPostUrl}
							onChange={(e) =>
								setFormData({
									...formData,
									socialPostUrl: e.target.value,
								})
							}
							required
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text">Country</span>
							</label>
							<select
								className="select select-bordered"
								value={formData.country}
								onChange={(e) =>
									setFormData({
										...formData,
										country: e.target.value,
									})
								}
							>
								<option value="">Select your country</option>
								<option value="Singapore">Singapore</option>
								<option value="Malaysia">Malaysia</option>
								<option value="Thailand">Thailand</option>
								<option value="Indonesia">Indonesia</option>
								<option value="Philippines">Philippines</option>
								<option value="Vietnam">Vietnam</option>
								<option value="Other">Other</option>
							</select>
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text">
									Telegram Handle
								</span>
							</label>
							<input
								type="text"
								placeholder="@username"
								className="input input-bordered"
								value={formData.telegramHandle}
								onChange={(e) =>
									setFormData({
										...formData,
										telegramHandle: e.target.value,
									})
								}
							/>
						</div>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">
								Payout Wallet Address
							</span>
						</label>
						<input
							type="text"
							placeholder="0x... (for completion bonuses)"
							className="input input-bordered"
							value={formData.payoutWallet}
							onChange={(e) =>
								setFormData({
									...formData,
									payoutWallet: e.target.value,
								})
							}
						/>
					</div>

					<div className="form-control mt-6">
						<button
							type="submit"
							className={`btn btn-primary ${
								isSubmitting ? "loading" : ""
							}`}
							disabled={isSubmitting}
						>
							{isSubmitting
								? "Submitting..."
								: "Submit Challenge"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
```

#### 2. Weekly Leaderboard Component

**File**: `packages/nextjs/components/sea-campaign/WeeklyLeaderboard.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";

interface LeaderboardEntry {
	userAddress: string;
	completionTime: number;
	socialEngagement: number;
	qualityScore: number;
	country: string;
}

interface WeeklyLeaderboardProps {
	weekNumber: number;
}

export function WeeklyLeaderboard({ weekNumber }: WeeklyLeaderboardProps) {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchLeaderboard();
	}, [weekNumber]);

	const fetchLeaderboard = async () => {
		try {
			const response = await fetch(
				`/api/sea-campaign/leaderboard?week=${weekNumber}`
			);
			if (response.ok) {
				const data = await response.json();
				setLeaderboard(data);
			}
		} catch (error) {
			console.error("Failed to fetch leaderboard:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="card bg-base-200 shadow-lg">
				<div className="card-body">
					<h3 className="card-title">🏆 Weekly Leaderboard</h3>
					<div className="skeleton h-32 w-full"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="card bg-base-200 shadow-lg">
			<div className="card-body">
				<h3 className="card-title">🏆 Week {weekNumber} Leaderboard</h3>

				<div className="space-y-2">
					{leaderboard.slice(0, 10).map((entry, index) => (
						<div
							key={entry.userAddress}
							className="flex items-center justify-between p-2 bg-base-100 rounded"
						>
							<div className="flex items-center gap-2">
								<span className="badge badge-primary">
									{index + 1}
								</span>
								<div>
									<div className="text-sm font-semibold">
										{entry.userAddress.slice(0, 6)}...
										{entry.userAddress.slice(-4)}
									</div>
									<div className="text-xs text-base-content/60">
										{entry.country}
									</div>
								</div>
							</div>
							<div className="text-right">
								<div className="text-xs">
									Quality: {entry.qualityScore}/10
								</div>
								<div className="text-xs">
									Engagement: {entry.socialEngagement}
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="text-center text-xs text-base-content/60 mt-4">
					Top 10 quality submissions get $50 bonus
				</div>
			</div>
		</div>
	);
}
```

## API Endpoints

### 1. SEA Campaign Submission

**File**: `packages/nextjs/app/api/sea-campaign/submit/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "~~/services/database/config/database";
import {
	seaCampaignSubmissions,
	seaCampaignProgress,
} from "~~/services/database/config/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
	try {
		const {
			weekNumber,
			challengeId,
			userAddress,
			githubUrl,
			contractAddress,
			txHash,
			demoUrl,
			socialPostUrl,
			country,
			telegramHandle,
			payoutWallet,
		} = await req.json();

		// Validation
		if (!userAddress || !weekNumber || !githubUrl || !socialPostUrl) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const db = await getRepository();

		// Check for existing submission
		const existingSubmission = await db
			.select()
			.from(seaCampaignSubmissions)
			.where(
				and(
					eq(seaCampaignSubmissions.userAddress, userAddress),
					eq(seaCampaignSubmissions.weekNumber, weekNumber)
				)
			)
			.limit(1);

		if (existingSubmission.length > 0) {
			return NextResponse.json(
				{ error: "Submission already exists for this week" },
				{ status: 400 }
			);
		}

		// Insert submission
		await db.insert(seaCampaignSubmissions).values({
			userAddress,
			weekNumber,
			githubUrl,
			contractAddress,
			txHash,
			demoUrl,
			socialPostUrl,
			country,
			telegramHandle,
			payoutWallet,
		});

		// Update progress
		const progressExists = await db
			.select()
			.from(seaCampaignProgress)
			.where(eq(seaCampaignProgress.userAddress, userAddress))
			.limit(1);

		if (progressExists.length === 0) {
			// Create new progress record
			await db.insert(seaCampaignProgress).values({
				userAddress,
				[`week_${weekNumber}_completed`]: true,
				totalWeeksCompleted: 1,
			});
		} else {
			// Update existing progress
			const updateData = {
				[`week_${weekNumber}_completed`]: true,
				totalWeeksCompleted: progressExists[0].totalWeeksCompleted + 1,
			};

			if (updateData.totalWeeksCompleted === 6) {
				updateData.isGraduated = true;
				updateData.graduationDate = new Date();
			}

			await db
				.update(seaCampaignProgress)
				.set(updateData)
				.where(eq(seaCampaignProgress.userAddress, userAddress));
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("SEA campaign submission error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
```

### 2. Leaderboard API

**File**: `packages/nextjs/app/api/sea-campaign/leaderboard/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "~~/services/database/config/database";
import { seaCampaignSubmissions } from "~~/services/database/config/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const week = searchParams.get("week");

		if (!week) {
			return NextResponse.json(
				{ error: "Week parameter required" },
				{ status: 400 }
			);
		}

		const db = await getRepository();

		const submissions = await db
			.select({
				userAddress: seaCampaignSubmissions.userAddress,
				completionTime: seaCampaignSubmissions.completionTimeHours,
				country: seaCampaignSubmissions.country,
				submissionDate: seaCampaignSubmissions.submissionDate,
				socialPostUrl: seaCampaignSubmissions.socialPostUrl,
			})
			.from(seaCampaignSubmissions)
			.where(eq(seaCampaignSubmissions.weekNumber, parseInt(week)))
			.orderBy(desc(seaCampaignSubmissions.submissionDate));

		// Calculate engagement and quality scores (simplified)
		const leaderboard = submissions.map((submission) => ({
			...submission,
			socialEngagement: Math.floor(Math.random() * 100), // TODO: Integrate with social media APIs
			qualityScore: Math.floor(Math.random() * 10) + 1, // TODO: Implement quality scoring
		}));

		// Sort by quality score and engagement
		leaderboard.sort(
			(a, b) =>
				b.qualityScore +
				b.socialEngagement / 10 -
				(a.qualityScore + a.socialEngagement / 10)
		);

		return NextResponse.json(leaderboard);
	} catch (error) {
		console.error("Leaderboard fetch error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
```

### 3. Admin Dashboard API

**File**: `packages/nextjs/app/api/sea-campaign/admin/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "~~/services/database/config/database";
import {
	seaCampaignSubmissions,
	seaCampaignProgress,
} from "~~/services/database/config/schema";
import { sql, eq, count, sum } from "drizzle-orm";

export async function GET(req: NextRequest) {
	try {
		const db = await getRepository();

		// Weekly submission counts
		const weeklyStats = await db
			.select({
				week: seaCampaignSubmissions.weekNumber,
				submissions: count(),
			})
			.from(seaCampaignSubmissions)
			.groupBy(seaCampaignSubmissions.weekNumber)
			.orderBy(seaCampaignSubmissions.weekNumber);

		// Country distribution
		const countryStats = await db
			.select({
				country: seaCampaignSubmissions.country,
				participants: count(),
			})
			.from(seaCampaignSubmissions)
			.groupBy(seaCampaignSubmissions.country)
			.orderBy(desc(count()));

		// Progress overview
		const progressStats = await db
			.select({
				totalParticipants: count(),
				graduates: sum(sql`CASE WHEN is_graduated THEN 1 ELSE 0 END`),
			})
			.from(seaCampaignProgress);

		// Total bonuses distributed
		const bonusStats = await db
			.select({
				totalBonuses: sum(seaCampaignProgress.totalBonusEarned),
			})
			.from(seaCampaignProgress);

		return NextResponse.json({
			weeklyStats,
			countryStats,
			progressStats: progressStats[0],
			bonusStats: bonusStats[0],
			lastUpdated: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Admin stats error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
```

## Documentation Structure

### New Documentation Files to Create

#### 1. `/packages/nextjs/public/speedrun/start-here.md`

```markdown
# Getting Started with Speedrun Lisk

Welcome to the 7-week Speedrun Lisk Onboarding Challenge! 🎉

## Quick Setup Checklist

### 1. Get Lisk Sepolia ETH

-   **Primary Faucet**: [Lisk Sepolia Faucet](https://sepolia-faucet.lisk.com)
-   **Fallback**: [Alchemy Faucet](https://sepoliafaucet.com) (select Lisk Sepolia)
-   **Amount needed**: 0.1 ETH should cover all 6 weeks

### 2. Wallet Setup

-   Install MetaMask or your preferred wallet
-   Add Lisk Sepolia network:
    -   Network Name: Lisk Sepolia
    -   RPC URL: https://rpc.sepolia-api.lisk.com
    -   Chain ID: 4202
    -   Currency Symbol: ETH
    -   Block Explorer: https://sepolia-blockscout.lisk.com

### 3. Development Environment

-   Node.js >= v22.18.0
-   Git and GitHub account
-   Code editor (VS Code recommended)

### 4. Block Explorer

-   **Primary**: [Lisk Sepolia Blockscout](https://sepolia-blockscout.lisk.com)
-   Use this to verify your contracts and view transactions

## Weekly Challenge Overview

| Week | Challenge             | Focus             | Due Date |
| ---- | --------------------- | ----------------- | -------- |
| 1    | Hello Token + NFT     | Deploy & Verify   | Sep 21   |
| 2    | Frontend Connect      | React Integration | Sep 28   |
| 3    | Indexing & Display    | Data Querying     | Oct 5    |
| 4    | Oracle + Sponsored UX | Advanced Features | Oct 12   |
| 5    | NFT Badge / Game      | Interactive Apps  | Oct 19   |
| 6    | Mini-DEX / Lending    | DeFi Building     | Oct 26   |
| 7    | Graduation            | Showcase & Awards | Oct 31   |

## Completion Bonuses 💰

-   **Top 10 Quality Submissions**: $50 each (every week)
-   **Top 10 Social Engagement**: $50 each (every week)
-   **Next 50 Fastest Completions**: $20 each (Week 6 only)
-   **Total Budget**: $2,000

## Support & Community

-   **Telegram Support**: [Join here] - Get help from mentors
-   **Office Hours**: Wednesdays 8pm SGT
-   **Social Media**: Tag #SpeedrunLiskSEA #W[number] @LiskSEA

Ready to start? Head to [Week 1: Hello Token + NFT](/sea-campaign/week/1)! 🚀
```

#### 2. `/packages/nextjs/public/speedrun/setup.md`

````markdown
# Development Setup Guide

## Install Scaffold-Lisk

### 1. Clone the Template

```bash
git clone https://github.com/scaffold-eth/scaffold-eth-2.git my-lisk-project
cd my-lisk-project
```
````

### 2. Install Dependencies

```bash
yarn install
```

### 3. Configure for Lisk Sepolia

Create `packages/hardhat/.env`:

```
DEPLOYER_PRIVATE_KEY=your_private_key_here
ALCHEMY_API_KEY=your_alchemy_key (optional)
```

Update `packages/hardhat/hardhat.config.ts`:

```typescript
liskSepolia: {
  url: "https://rpc.sepolia-api.lisk.com",
  accounts: [process.env.DEPLOYER_PRIVATE_KEY],
  chainId: 4202,
},
```

### 4. Test Your Setup

Start the frontend:

```bash
yarn start
```

Your app should load at `http://localhost:3000`

Deploy a test contract:

```bash
yarn hardhat:deploy --network liskSepolia
```

If everything works, you're ready for Week 1! 🎉

## Troubleshooting

### Common Issues

1. **"Network not found"** - Double-check your RPC URL and chain ID
2. **"Insufficient funds"** - Get more test ETH from the faucet
3. **"Deploy failed"** - Check your private key has ETH balance

### Getting Help

-   Telegram support group: [Link]
-   Office hours: Wednesdays 8pm SGT
-   GitHub issues: Create detailed bug reports

````

#### 3. `/packages/nextjs/public/speedrun/ch1-deploy-verify.md`
```markdown
# Week 1: Deploy & Verify Your First Contracts

## Challenge Overview
Deploy an ERC20 token and ERC721 NFT contract to Lisk Sepolia, then verify them on the block explorer.

## Step-by-Step Guide

### 1. Create Your Token Contract
```solidity
// contracts/MyToken.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("My SEA Token", "MSEA") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}
````

### 2. Create Your NFT Contract

```solidity
// contracts/MyNFT.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyNFT is ERC721 {
    uint256 private _tokenIdCounter;

    constructor() ERC721("SEA Builder Badge", "SBB") {}

    function mint(address to) public {
        _mint(to, _tokenIdCounter);
        _tokenIdCounter++;
    }
}
```

### 3. Deploy Your Contracts

```bash
# Deploy to Lisk Sepolia
yarn hardhat:deploy --network liskSepolia

# Note the contract addresses from the output
```

### 4. Verify on Block Explorer

Visit [Lisk Sepolia Blockscout](https://sepolia-blockscout.lisk.com):

1. Paste your contract address
2. Go to "Contract" tab
3. Click "Verify & Publish"
4. Upload your contract source code
5. Confirm verification

### 5. Submit Your Challenge

Go to [Week 1 Submission](/sea-campaign/week/1) and provide:

-   ✅ GitHub repository URL
-   ✅ Token contract address
-   ✅ NFT contract address
-   ✅ Deploy transaction hash
-   ✅ Social media post URL
-   ✅ Your country
-   ✅ Telegram handle

### Success Criteria

-   Both contracts deployed successfully
-   Both contracts verified on block explorer
-   Social media post with #SpeedrunLiskSEA #W1 @LiskSEA
-   All submission fields completed

## Tips for Success

-   Test locally first with `yarn hardhat:chain`
-   Keep your private key secure
-   Double-check contract addresses before submitting
-   Include a screenshot in your social post

**Need help?** Join our Telegram support group! 💬

````

## Reward Distribution System

### Smart Contract for Automated Rewards
**File**: `packages/hardhat/contracts/SeaCampaignRewards.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SeaCampaignRewards is Ownable, ReentrancyGuard {
    mapping(address => uint256) public totalRewardsEarned;
    mapping(address => uint256) public rewardsWithdrawn;
    mapping(bytes32 => bool) public rewardClaimed;

    event RewardAllocated(address indexed user, uint256 amount, uint8 weekNumber, string rewardType);
    event RewardWithdrawn(address indexed user, uint256 amount);

    function allocateReward(
        address user,
        uint256 amount,
        uint8 weekNumber,
        string memory rewardType,
        bytes32 proofHash
    ) external onlyOwner {
        require(!rewardClaimed[proofHash], "Reward already claimed");
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");

        totalRewardsEarned[user] += amount;
        rewardClaimed[proofHash] = true;

        emit RewardAllocated(user, amount, weekNumber, rewardType);
    }

    function withdrawRewards() external nonReentrant {
        uint256 availableRewards = totalRewardsEarned[msg.sender] - rewardsWithdrawn[msg.sender];
        require(availableRewards > 0, "No rewards available");
        require(address(this).balance >= availableRewards, "Insufficient contract balance");

        rewardsWithdrawn[msg.sender] += availableRewards;

        (bool success, ) = payable(msg.sender).call{value: availableRewards}("");
        require(success, "Withdrawal failed");

        emit RewardWithdrawn(msg.sender, availableRewards);
    }

    function getAvailableRewards(address user) external view returns (uint256) {
        return totalRewardsEarned[user] - rewardsWithdrawn[user];
    }

    function fundContract() external payable onlyOwner {}

    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Emergency withdrawal failed");
    }
}
````

### Admin Dashboard for Reward Management

**File**: `packages/nextjs/app/admin/sea-campaign/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface CampaignStats {
	weeklyStats: Array<{ week: number; submissions: number }>;
	countryStats: Array<{ country: string; participants: number }>;
	progressStats: { totalParticipants: number; graduates: number };
	bonusStats: { totalBonuses: number };
}

export default function SeaCampaignAdminPage() {
	const { address } = useAccount();
	const [stats, setStats] = useState<CampaignStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedWeek, setSelectedWeek] = useState(1);

	useEffect(() => {
		fetchStats();
	}, []);

	const fetchStats = async () => {
		try {
			const response = await fetch("/api/sea-campaign/admin/stats");
			if (response.ok) {
				const data = await response.json();
				setStats(data);
			}
		} catch (error) {
			console.error("Failed to fetch stats:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="skeleton h-64 w-full"></div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<header className="mb-8">
				<h1 className="text-3xl font-bold">
					SEA Campaign Admin Dashboard
				</h1>
				<p className="text-base-content/70">
					Monitor progress and manage rewards
				</p>
			</header>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<div className="stat bg-base-200 rounded-lg">
					<div className="stat-title">Total Participants</div>
					<div className="stat-value text-primary">
						{stats?.progressStats.totalParticipants}
					</div>
				</div>
				<div className="stat bg-base-200 rounded-lg">
					<div className="stat-title">Graduates</div>
					<div className="stat-value text-success">
						{stats?.progressStats.graduates}
					</div>
				</div>
				<div className="stat bg-base-200 rounded-lg">
					<div className="stat-title">Total Bonuses</div>
					<div className="stat-value text-accent">
						${stats?.bonusStats.totalBonuses}
					</div>
				</div>
				<div className="stat bg-base-200 rounded-lg">
					<div className="stat-title">Completion Rate</div>
					<div className="stat-value text-info">
						{stats && stats.progressStats.totalParticipants > 0
							? Math.round(
									(stats.progressStats.graduates /
										stats.progressStats.totalParticipants) *
										100
							  )
							: 0}
						%
					</div>
				</div>
			</div>

			{/* Weekly Progress Chart */}
			<div className="card bg-base-100 shadow-lg mb-8">
				<div className="card-body">
					<h2 className="card-title">Weekly Submission Progress</h2>
					<div className="w-full h-64">
						{/* TODO: Add chart component */}
						<div className="flex items-end justify-center h-full gap-4">
							{stats?.weeklyStats.map((week) => (
								<div
									key={week.week}
									className="flex flex-col items-center"
								>
									<div
										className="bg-primary rounded-t"
										style={{
											width: "40px",
											height: `${
												(week.submissions / 200) * 200
											}px`,
											minHeight: "10px",
										}}
									></div>
									<div className="text-xs mt-1">
										W{week.week}
									</div>
									<div className="text-xs text-base-content/60">
										{week.submissions}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Country Distribution */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<div className="card bg-base-100 shadow-lg">
					<div className="card-body">
						<h2 className="card-title">Participants by Country</h2>
						<div className="space-y-2">
							{stats?.countryStats
								.slice(0, 10)
								.map((country, index) => (
									<div
										key={country.country}
										className="flex justify-between items-center"
									>
										<span>
											{country.country || "Unknown"}
										</span>
										<div className="flex items-center gap-2">
											<progress
												className="progress progress-primary w-20"
												value={country.participants}
												max={
													stats.progressStats
														.totalParticipants
												}
											></progress>
											<span className="text-sm">
												{country.participants}
											</span>
										</div>
									</div>
								))}
						</div>
					</div>
				</div>

				{/* Reward Management */}
				<div className="card bg-base-100 shadow-lg">
					<div className="card-body">
						<h2 className="card-title">Reward Management</h2>

						<div className="form-control">
							<label className="label">
								<span className="label-text">Select Week</span>
							</label>
							<select
								className="select select-bordered"
								value={selectedWeek}
								onChange={(e) =>
									setSelectedWeek(parseInt(e.target.value))
								}
							>
								{[1, 2, 3, 4, 5, 6].map((week) => (
									<option key={week} value={week}>
										Week {week}
									</option>
								))}
							</select>
						</div>

						<div className="mt-4 space-y-2">
							<button className="btn btn-primary btn-sm w-full">
								Calculate Top 10 Quality Winners
							</button>
							<button className="btn btn-secondary btn-sm w-full">
								Calculate Top 10 Engagement Winners
							</button>
							<button className="btn btn-success btn-sm w-full">
								Distribute Rewards
							</button>
						</div>

						<div className="divider"></div>

						<div className="text-sm">
							<p className="mb-2">
								<strong>Bonus Structure:</strong>
							</p>
							<ul className="list-disc list-inside space-y-1 text-xs">
								<li>Top 10 Quality: $50 each</li>
								<li>Top 10 Engagement: $50 each</li>
								<li>Next 50 Fast (Week 6): $20 each</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
```

## Migration Scripts

### Database Migration

**File**: `packages/nextjs/drizzle/sea-campaign-migration.sql`

```sql
-- Create SEA Campaign tables
CREATE TABLE sea_campaign_submissions (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  week_number INTEGER NOT NULL,
  github_url TEXT NOT NULL,
  contract_address VARCHAR(42),
  tx_hash VARCHAR(66),
  demo_url TEXT,
  social_post_url TEXT NOT NULL,
  country VARCHAR(100),
  telegram_handle VARCHAR(100),
  payout_wallet VARCHAR(42),
  submission_date TIMESTAMP DEFAULT NOW(),
  review_status VARCHAR(20) DEFAULT 'SUBMITTED',
  mentor_feedback TEXT,
  completion_bonus_amount DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (user_address) REFERENCES users(address),
  UNIQUE(user_address, week_number)
);

CREATE TABLE sea_campaign_progress (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  week_1_completed BOOLEAN DEFAULT FALSE,
  week_2_completed BOOLEAN DEFAULT FALSE,
  week_3_completed BOOLEAN DEFAULT FALSE,
  week_4_completed BOOLEAN DEFAULT FALSE,
  week_5_completed BOOLEAN DEFAULT FALSE,
  week_6_completed BOOLEAN DEFAULT FALSE,
  total_weeks_completed INTEGER DEFAULT 0,
  is_graduated BOOLEAN DEFAULT FALSE,
  registration_date TIMESTAMP DEFAULT NOW(),
  graduation_date TIMESTAMP,
  total_bonus_earned DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (user_address) REFERENCES users(address),
  UNIQUE(user_address)
);

CREATE TABLE sea_campaign_rewards (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  week_number INTEGER NOT NULL,
  reward_type VARCHAR(50) NOT NULL,
  reward_amount DECIMAL(10,2) NOT NULL,
  awarded_date TIMESTAMP DEFAULT NOW(),
  paid_date TIMESTAMP,
  payment_status VARCHAR(20) DEFAULT 'PENDING',
  payment_tx_hash VARCHAR(66),
  FOREIGN KEY (user_address) REFERENCES users(address)
);

-- Add new columns to existing tables
ALTER TABLE users
ADD COLUMN country VARCHAR(100),
ADD COLUMN telegram_handle VARCHAR(100),
ADD COLUMN payout_wallet VARCHAR(42),
ADD COLUMN sea_campaign_participant BOOLEAN DEFAULT FALSE,
ADD COLUMN sea_campaign_registration_date TIMESTAMP;

ALTER TABLE user_challenges
ADD COLUMN campaign_id VARCHAR(50),
ADD COLUMN week_number INTEGER,
ADD COLUMN social_post_url TEXT,
ADD COLUMN mentor_assigned VARCHAR(42),
ADD COLUMN completion_time_hours INTEGER;

-- Create indexes for better query performance
CREATE INDEX idx_sea_submissions_week ON sea_campaign_submissions(week_number);
CREATE INDEX idx_sea_submissions_user ON sea_campaign_submissions(user_address);
CREATE INDEX idx_sea_submissions_status ON sea_campaign_submissions(review_status);
CREATE INDEX idx_sea_progress_user ON sea_campaign_progress(user_address);
CREATE INDEX idx_sea_rewards_user ON sea_campaign_rewards(user_address);
CREATE INDEX idx_sea_rewards_week ON sea_campaign_rewards(week_number);
```

## Analytics and KPI Tracking

### Weekly KPI Dashboard

**File**: `packages/nextjs/components/sea-campaign/KpiDashboard.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";

interface WeeklyKpis {
	week: number;
	target: string;
	actual: number;
	status: "on-track" | "behind" | "exceeded";
}

const WEEKLY_TARGETS: WeeklyKpis[] = [
	{ week: 1, target: "≥200 verified contracts", actual: 0, status: "behind" },
	{
		week: 2,
		target: "≥100 learners complete Frontend Connect",
		actual: 0,
		status: "behind",
	},
	{
		week: 3,
		target: "≥80 learners ship indexed list/detail UI",
		actual: 0,
		status: "behind",
	},
	{
		week: 4,
		target: "≥60 learners implement feed read or sponsored flow",
		actual: 0,
		status: "behind",
	},
	{
		week: 5,
		target: "≥40 learners complete a track; 6 demos showcased",
		actual: 0,
		status: "behind",
	},
	{
		week: 6,
		target: "≥30 projects complete an advanced track",
		actual: 0,
		status: "behind",
	},
];

export function KpiDashboard() {
	const [kpis, setKpis] = useState<WeeklyKpis[]>(WEEKLY_TARGETS);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchKpis();
	}, []);

	const fetchKpis = async () => {
		try {
			const response = await fetch("/api/sea-campaign/kpis");
			if (response.ok) {
				const data = await response.json();
				setKpis(data);
			}
		} catch (error) {
			console.error("Failed to fetch KPIs:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="card bg-base-100 shadow-lg">
			<div className="card-body">
				<h2 className="card-title">📊 Weekly KPI Tracking</h2>

				<div className="space-y-4">
					{kpis.map((kpi) => (
						<div
							key={kpi.week}
							className="flex items-center justify-between p-4 bg-base-200 rounded-lg"
						>
							<div>
								<div className="font-semibold">
									Week {kpi.week}
								</div>
								<div className="text-sm text-base-content/70">
									{kpi.target}
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="text-right">
									<div className="text-lg font-bold">
										{kpi.actual}
									</div>
									<div className="text-xs text-base-content/60">
										achieved
									</div>
								</div>

								<div
									className={`badge ${
										kpi.status === "exceeded"
											? "badge-success"
											: kpi.status === "on-track"
											? "badge-warning"
											: "badge-error"
									}`}
								>
									{kpi.status}
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="mt-6 text-center">
					<div className="stat">
						<div className="stat-title">
							Overall Campaign Progress
						</div>
						<div className="stat-value text-primary">
							{Math.round(
								(kpis.filter((k) => k.status !== "behind")
									.length /
									kpis.length) *
									100
							)}
							%
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
```

## Implementation Timeline & Checklist

### Week -1 (Preparation Phase)

-   [ ] **Database**: Run migration scripts, test schema
-   [ ] **Challenges**: Create all 6 challenge definitions
-   [ ] **Documentation**: Write all `/speedrun/` guides
-   [ ] **Videos**: Record Week 1 tutorial video
-   [ ] **Forms**: Create submission forms for all weeks
-   [ ] **Testing**: End-to-end testing of Week 1 flow

### Week 0 (Launch Preparation)

-   [ ] **Frontend**: Deploy campaign landing page
-   [ ] **API**: Test all submission endpoints
-   [ ] **Social**: Set up tracking for #SpeedrunLiskSEA
-   [ ] **Telegram**: Create support group
-   [ ] **Faucets**: Ensure Lisk Sepolia faucets working
-   [ ] **Admin**: Deploy admin dashboard

### Weeks 1-6 (Campaign Execution)

-   [ ] **Monday**: Publish weekly docs & challenges
-   [ ] **Wednesday**: Post progress update thread
-   [ ] **Friday**: Calculate weekly KPIs & leaderboard
-   [ ] **Sunday**: Review submissions, prepare rewards

### Week 7 (Graduation)

-   [ ] **Graduation ceremony**: Live showcase event
-   [ ] **Final rewards**: Distribute all completion bonuses
-   [ ] **Transparency report**: Publish final metrics
-   [ ] **Archive**: Tag repository v1.0
-   [ ] **Retrospective**: Document lessons learned

## Success Metrics

### Primary KPIs

-   **Week 1**: ≥200 verified contracts on Lisk Sepolia
-   **Week 2**: ≥100 frontend integrations with wallet connect
-   **Week 3**: ≥80 applications with indexed blockchain data
-   **Week 4**: ≥60 oracle integrations or sponsored transactions
-   **Week 5**: ≥40 interactive NFT/game applications
-   **Week 6**: ≥30 complete DeFi applications
-   **Overall**: 200+ new developers onboarded to Lisk ecosystem

### Secondary Metrics

-   **Geographic distribution**: 60%+ from SEA countries
-   **Social engagement**: 1000+ #SpeedrunLiskSEA posts
-   **Completion rate**: 30%+ finish all 6 weeks
-   **Quality**: 80%+ submissions pass automated testing
-   **Community**: 500+ active Telegram members
-   **Pipeline**: 50+ developers continue to Lisk hackathons

### Budget Distribution

-   **$1,000**: Top 10 quality submissions ($50 × 10 × 2 tracks × 6 weeks)
-   **$600**: Top 10 engagement submissions ($50 × 10 × 1.2 average)
-   **$400**: Fast completion bonuses ($20 × 50, Week 6 only)

Total: **$2,000** completion bonuses to incentivize high-quality participation and completion.

---

This implementation provides a comprehensive foundation for the Speedrun Lisk Campaign, with progressive weekly challenges, robust submission tracking, social engagement features, and a transparent reward distribution system designed to onboard 200+ new Web3 developers to the Lisk ecosystem.
