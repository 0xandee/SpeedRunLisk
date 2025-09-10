CREATE TYPE "public"."sea_campaign_payment_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."sea_campaign_reward_type_enum" AS ENUM('TOP_QUALITY', 'TOP_ENGAGEMENT', 'FAST_COMPLETION');--> statement-breakpoint
CREATE TYPE "public"."sea_campaign_submission_status_enum" AS ENUM('SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TYPE "public"."batch_network" ADD VALUE 'lisk-sepolia';--> statement-breakpoint
CREATE TABLE "sea_campaign_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_address" varchar(42) NOT NULL,
	"week1_completed" boolean DEFAULT false,
	"week2_completed" boolean DEFAULT false,
	"week3_completed" boolean DEFAULT false,
	"week4_completed" boolean DEFAULT false,
	"week5_completed" boolean DEFAULT false,
	"week6_completed" boolean DEFAULT false,
	"total_weeks_completed" integer DEFAULT 0,
	"is_graduated" boolean DEFAULT false,
	"registration_date" timestamp DEFAULT now() NOT NULL,
	"graduation_date" timestamp,
	"total_bonus_earned" numeric(10, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "sea_campaign_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_address" varchar(42) NOT NULL,
	"week_number" integer NOT NULL,
	"reward_type" "sea_campaign_reward_type_enum" NOT NULL,
	"reward_amount" numeric(10, 2) NOT NULL,
	"awarded_date" timestamp DEFAULT now() NOT NULL,
	"paid_date" timestamp,
	"payment_status" "sea_campaign_payment_status_enum" DEFAULT 'PENDING',
	"payment_tx_hash" varchar(66)
);
--> statement-breakpoint
CREATE TABLE "sea_campaign_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_address" varchar(42) NOT NULL,
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
	"completion_bonus_amount" numeric(10, 2) DEFAULT '0'
);
--> statement-breakpoint
ALTER TABLE "user_challenges" ADD COLUMN "campaign_id" varchar(50);--> statement-breakpoint
ALTER TABLE "user_challenges" ADD COLUMN "week_number" integer;--> statement-breakpoint
ALTER TABLE "user_challenges" ADD COLUMN "social_post_url" text;--> statement-breakpoint
ALTER TABLE "user_challenges" ADD COLUMN "mentor_assigned" varchar(42);--> statement-breakpoint
ALTER TABLE "user_challenges" ADD COLUMN "completion_time_hours" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sea_campaign_participant" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sea_campaign_registration_date" timestamp;--> statement-breakpoint
ALTER TABLE "sea_campaign_progress" ADD CONSTRAINT "sea_campaign_progress_user_address_users_user_address_fk" FOREIGN KEY ("user_address") REFERENCES "public"."users"("user_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sea_campaign_rewards" ADD CONSTRAINT "sea_campaign_rewards_user_address_users_user_address_fk" FOREIGN KEY ("user_address") REFERENCES "public"."users"("user_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sea_campaign_submissions" ADD CONSTRAINT "sea_campaign_submissions_user_address_users_user_address_fk" FOREIGN KEY ("user_address") REFERENCES "public"."users"("user_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sea_progress_user_idx" ON "sea_campaign_progress" USING btree ("user_address");--> statement-breakpoint
CREATE UNIQUE INDEX "sea_progress_user_unique" ON "sea_campaign_progress" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "sea_rewards_user_idx" ON "sea_campaign_rewards" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "sea_rewards_week_idx" ON "sea_campaign_rewards" USING btree ("week_number");--> statement-breakpoint
CREATE INDEX "sea_submissions_week_idx" ON "sea_campaign_submissions" USING btree ("week_number");--> statement-breakpoint
CREATE INDEX "sea_submissions_user_idx" ON "sea_campaign_submissions" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "sea_submissions_status_idx" ON "sea_campaign_submissions" USING btree ("review_status");--> statement-breakpoint
CREATE UNIQUE INDEX "sea_submissions_user_week_unique" ON "sea_campaign_submissions" USING btree ("user_address","week_number");