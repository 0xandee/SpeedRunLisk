-- SEA Campaign Migration
-- This migration adds the necessary tables and columns for the Speedrun Lisk Campaign

-- First, create the new enum types for SEA campaign
CREATE TYPE "public"."sea_campaign_submission_status_enum" AS ENUM('SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED');
CREATE TYPE "public"."sea_campaign_reward_type_enum" AS ENUM('TOP_QUALITY', 'TOP_ENGAGEMENT', 'FAST_COMPLETION');
CREATE TYPE "public"."sea_campaign_payment_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED');

-- Add new network option to batch_network enum
ALTER TYPE "public"."batch_network" ADD VALUE 'lisk-sepolia';

-- Add SEA campaign specific columns to users table
ALTER TABLE "users" ADD COLUMN "country" varchar(100);
ALTER TABLE "users" ADD COLUMN "sea_campaign_participant" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN "sea_campaign_registration_date" timestamp;

-- Add SEA campaign specific columns to user_challenges table
ALTER TABLE "user_challenges" ADD COLUMN "campaign_id" varchar(50);
ALTER TABLE "user_challenges" ADD COLUMN "week_number" integer;
ALTER TABLE "user_challenges" ADD COLUMN "social_post_url" text;
ALTER TABLE "user_challenges" ADD COLUMN "mentor_assigned" varchar(42);
ALTER TABLE "user_challenges" ADD COLUMN "completion_time_hours" integer;

-- Create sea_campaign_submissions table
CREATE TABLE "sea_campaign_submissions" (
  "id" serial PRIMARY KEY,
  "user_address" varchar(42) NOT NULL REFERENCES "users"("user_address"),
  "week_number" integer NOT NULL,
  "github_url" text NOT NULL,
  "contract_address" varchar(42),
  "tx_hash" varchar(66),
  "demo_url" text,
  "social_post_url" text NOT NULL,
  "country" varchar(100),
  "telegram_handle" varchar(100),
  "payout_wallet" varchar(42),
  "submission_date" timestamp DEFAULT now() NOT NULL,
  "review_status" "sea_campaign_submission_status_enum" DEFAULT 'SUBMITTED',
  "mentor_feedback" text,
  "completion_bonus_amount" decimal(10,2) DEFAULT '0',
  UNIQUE("user_address", "week_number")
);

-- Create sea_campaign_progress table
CREATE TABLE "sea_campaign_progress" (
  "id" serial PRIMARY KEY,
  "user_address" varchar(42) NOT NULL REFERENCES "users"("user_address") UNIQUE,
  "week_1_completed" boolean DEFAULT false,
  "week_2_completed" boolean DEFAULT false,
  "week_3_completed" boolean DEFAULT false,
  "week_4_completed" boolean DEFAULT false,
  "week_5_completed" boolean DEFAULT false,
  "week_6_completed" boolean DEFAULT false,
  "total_weeks_completed" integer DEFAULT 0,
  "is_graduated" boolean DEFAULT false,
  "registration_date" timestamp DEFAULT now() NOT NULL,
  "graduation_date" timestamp,
  "total_bonus_earned" decimal(10,2) DEFAULT '0'
);

-- Create sea_campaign_rewards table
CREATE TABLE "sea_campaign_rewards" (
  "id" serial PRIMARY KEY,
  "user_address" varchar(42) NOT NULL REFERENCES "users"("user_address"),
  "week_number" integer NOT NULL,
  "reward_type" "sea_campaign_reward_type_enum" NOT NULL,
  "reward_amount" decimal(10,2) NOT NULL,
  "awarded_date" timestamp DEFAULT now() NOT NULL,
  "paid_date" timestamp,
  "payment_status" "sea_campaign_payment_status_enum" DEFAULT 'PENDING',
  "payment_tx_hash" varchar(66)
);

-- Create indexes for better query performance
CREATE INDEX "sea_submissions_week_idx" ON "sea_campaign_submissions"("week_number");
CREATE INDEX "sea_submissions_user_idx" ON "sea_campaign_submissions"("user_address");
CREATE INDEX "sea_submissions_status_idx" ON "sea_campaign_submissions"("review_status");

CREATE INDEX "sea_progress_user_idx" ON "sea_campaign_progress"("user_address");

CREATE INDEX "sea_rewards_user_idx" ON "sea_campaign_rewards"("user_address");
CREATE INDEX "sea_rewards_week_idx" ON "sea_campaign_rewards"("week_number");

-- Insert SEA campaign challenges into the challenges table
INSERT INTO "challenges" ("id", "challenge_name", "description", "sort_order", "disabled") VALUES
('sea-week-1-hello-token-nft', 'Week 1: Hello Token + NFT', 'Deploy and verify your first ERC20 token and ERC721 NFT contracts on Lisk Sepolia', 100, false),
('sea-week-2-frontend-connect', 'Week 2: Frontend Connect', 'Connect your smart contracts to a React/Next.js frontend with wallet integration', 101, false),
('sea-week-3-indexing-display', 'Week 3: Indexing & Display', 'Index blockchain data and display it in your frontend with pagination', 102, false),
('sea-week-4-oracle-sponsored', 'Week 4: Oracle + Sponsored UX', 'Integrate price oracles or implement gasless transactions for better UX', 103, false),
('sea-week-5-nft-badge-game', 'Week 5: NFT Badge / Mini-Game', 'Create an interactive NFT badge system or simple on-chain game', 104, false),
('sea-week-6-mini-dex-lending', 'Week 6: Mini-DEX / Lending App', 'Build a simple DEX, lending protocol, or prediction market', 105, false);

-- Add comments for documentation
COMMENT ON TABLE "sea_campaign_submissions" IS 'Stores individual weekly challenge submissions for the SEA campaign';
COMMENT ON TABLE "sea_campaign_progress" IS 'Tracks overall progress and completion status for each participant';
COMMENT ON TABLE "sea_campaign_rewards" IS 'Records bonus rewards distributed to top performers';

COMMENT ON COLUMN "sea_campaign_submissions"."review_status" IS 'Current status of the submission review process';
COMMENT ON COLUMN "sea_campaign_progress"."is_graduated" IS 'True when user completes all 6 weeks';
COMMENT ON COLUMN "sea_campaign_rewards"."reward_type" IS 'Type of reward: quality, engagement, or speed-based';