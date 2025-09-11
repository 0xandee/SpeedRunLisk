import {
  BatchNetwork,
  BatchStatus,
  BatchUserStatus,
  BuildCategory,
  BuildType,
  ReviewAction,
  SeaCampaignPaymentStatus,
  SeaCampaignRewardType,
  SeaCampaignSubmissionStatus,
  UTMParams,
  UserRole,
} from "./types";
import { SQL, relations, sql } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export function lower(address: AnyPgColumn): SQL {
  return sql`lower(${address})`;
}

export const reviewActionEnum = pgEnum("review_action_enum", ReviewAction);
export const userRoleEnum = pgEnum("user_role_enum", UserRole);
export const batchStatusEnum = pgEnum("batch_status_enum", BatchStatus);
export const batchUserStatusEnum = pgEnum("batch_user_status_enum", BatchUserStatus);
export const buildTypeEnum = pgEnum("build_type_enum", BuildType);
export const buildCategoryEnum = pgEnum("build_category_enum", BuildCategory);
export const batchNetworkEnum = pgEnum("batch_network", BatchNetwork);

// SEA Campaign Enums
export const seaCampaignSubmissionStatusEnum = pgEnum("sea_campaign_submission_status_enum", SeaCampaignSubmissionStatus);
export const seaCampaignRewardTypeEnum = pgEnum("sea_campaign_reward_type_enum", SeaCampaignRewardType);
export const seaCampaignPaymentStatusEnum = pgEnum("sea_campaign_payment_status_enum", SeaCampaignPaymentStatus);

export const users = pgTable(
  "users",
  {
    userAddress: varchar({ length: 42 }).primaryKey(), // Wallet address
    role: userRoleEnum().default(UserRole.USER),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
    ens: varchar({ length: 255 }),
    ensAvatar: text(),
    socialTelegram: varchar({ length: 255 }),
    socialX: varchar({ length: 255 }),
    socialGithub: varchar({ length: 255 }),
    socialInstagram: varchar({ length: 255 }),
    socialDiscord: varchar({ length: 255 }),
    socialEmail: varchar({ length: 255 }),
    socialFarcaster: varchar({ length: 255 }),
    location: varchar({ length: 255 }),
    batchId: integer().references(() => batches.id),
    batchStatus: batchUserStatusEnum(),
    referrer: varchar({ length: 255 }),
    originalUtmParams: jsonb("original_utm_params").$type<UTMParams>(),
    // SEA Campaign specific fields
    country: varchar({ length: 100 }),
    seaCampaignParticipant: boolean().default(false),
    seaCampaignRegistrationDate: timestamp(),
  },
  table => [uniqueIndex("idUniqueIndex").on(lower(table.userAddress))],
);

type ExternalLink = Partial<{
  link: string;
  claim: string;
}>;

export const challenges = pgTable("challenges", {
  id: varchar({ length: 255 }).primaryKey(),
  challengeName: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  sortOrder: integer().notNull(),
  github: varchar({ length: 255 }),
  autograding: boolean().default(false),
  disabled: boolean().default(false),
  previewImage: varchar({ length: 255 }),
  icon: varchar({ length: 255 }),
  externalLink: jsonb("external_link").$type<ExternalLink>(),
});

export const batches = pgTable("batches", {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  startDate: timestamp().notNull(),
  status: batchStatusEnum().notNull(),
  contractAddress: varchar({ length: 42 }),
  telegramLink: varchar({ length: 255 }).notNull(),
  bgSubdomain: varchar({ length: 255 }).notNull(),
  network: batchNetworkEnum().notNull(),
});

export const userChallenges = pgTable(
  "user_challenges",
  {
    id: serial().primaryKey(),
    userAddress: varchar({ length: 42 })
      .notNull()
      .references(() => users.userAddress),
    challengeId: varchar({ length: 255 })
      .notNull()
      .references(() => challenges.id),
    frontendUrl: varchar({ length: 255 }),
    contractUrl: varchar({ length: 255 }),
    reviewComment: text(), // Feedback provided during autograding
    submittedAt: timestamp().notNull().defaultNow(),
    reviewAction: reviewActionEnum(),
    signature: varchar({ length: 255 }),
    // SEA Campaign specific fields
    campaignId: varchar({ length: 50 }),
    weekNumber: integer(),
    socialPostUrl: text(),
    mentorAssigned: varchar({ length: 42 }),
    completionTimeHours: integer(),
  },
  table => [
    index("user_challenge_lookup_idx").on(table.userAddress),
    index("user_challenge_review_idx").on(table.userAddress, table.reviewAction),
  ],
);

export const builds = pgTable(
  "builds",
  {
    // Legacy Firebase IDs are deterministically converted to UUIDs during import.
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar({ length: 255 }).notNull(),
    desc: text(),
    buildType: buildTypeEnum(),
    buildCategory: buildCategoryEnum(),
    demoUrl: varchar({ length: 255 }),
    videoUrl: varchar({ length: 255 }),
    imageUrl: varchar({ length: 255 }),
    githubUrl: varchar({ length: 255 }),
    submittedTimestamp: timestamp().notNull().defaultNow(),
  },
  table => [index("build_type_idx").on(table.buildType), index("build_category_idx").on(table.buildCategory)],
);

export const buildBuilders = pgTable(
  "build_builders",
  {
    buildId: uuid()
      .notNull()
      .references(() => builds.id),
    userAddress: varchar({ length: 42 })
      .notNull()
      .references(() => users.userAddress),
    isOwner: boolean().default(false).notNull(),
  },
  table => [
    primaryKey({ columns: [table.buildId, table.userAddress] }),
    index("build_builder_user_idx").on(table.userAddress),
  ],
);

export const buildLikes = pgTable(
  "build_likes",
  {
    id: serial().primaryKey(),
    buildId: uuid()
      .notNull()
      .references(() => builds.id),
    userAddress: varchar({ length: 42 })
      .notNull()
      .references(() => users.userAddress),
    likedAt: timestamp().notNull().defaultNow(),
  },
  table => [uniqueIndex("build_like_unique_idx").on(table.buildId, table.userAddress)],
);

export const usersRelations = relations(users, ({ many, one }) => ({
  userChallenges: many(userChallenges),
  batch: one(batches, {
    fields: [users.batchId],
    references: [batches.id],
  }),
  buildBuilders: many(buildBuilders),
  buildLikes: many(buildLikes),
}));

export const challengesRelations = relations(challenges, ({ many }) => ({
  userChallenges: many(userChallenges),
}));

export const userChallengesRelations = relations(userChallenges, ({ one }) => ({
  user: one(users, {
    fields: [userChallenges.userAddress],
    references: [users.userAddress],
  }),
  challenge: one(challenges, {
    fields: [userChallenges.challengeId],
    references: [challenges.id],
  }),
}));

export const batchesRelations = relations(batches, ({ many }) => ({
  users: many(users),
}));

export const buildsRelations = relations(builds, ({ many }) => ({
  likes: many(buildLikes),
  builders: many(buildBuilders),
}));

export const buildLikesRelations = relations(buildLikes, ({ one }) => ({
  build: one(builds, {
    fields: [buildLikes.buildId],
    references: [builds.id],
  }),
  liker: one(users, {
    fields: [buildLikes.userAddress],
    references: [users.userAddress],
  }),
}));

export const buildBuildersRelations = relations(buildBuilders, ({ one }) => ({
  build: one(builds, {
    fields: [buildBuilders.buildId],
    references: [builds.id],
  }),
  user: one(users, {
    fields: [buildBuilders.userAddress],
    references: [users.userAddress],
  }),
}));

// SEA Campaign Tables
export const seaCampaignSubmissions = pgTable(
  "sea_campaign_submissions",
  {
    id: serial().primaryKey(),
    userAddress: varchar({ length: 42 })
      .notNull()
      .references(() => users.userAddress),
    weekNumber: integer().notNull(),
    githubUrl: text().notNull(),
    contractAddress: varchar({ length: 42 }),
    txHash: varchar({ length: 66 }),
    demoUrl: text(),
    socialPostUrl: text().notNull(),
    country: varchar({ length: 100 }),
    telegramHandle: varchar({ length: 100 }),
    payoutWallet: varchar({ length: 42 }),
    submissionDate: timestamp().defaultNow().notNull(),
    reviewStatus: seaCampaignSubmissionStatusEnum().default(SeaCampaignSubmissionStatus.SUBMITTED),
    mentorFeedback: text(),
    completionBonusAmount: decimal({ precision: 10, scale: 2 }).default("0"),
  },
  table => [
    index("sea_submissions_week_idx").on(table.weekNumber),
    index("sea_submissions_user_idx").on(table.userAddress),
    index("sea_submissions_status_idx").on(table.reviewStatus),
    uniqueIndex("sea_submissions_user_week_unique").on(table.userAddress, table.weekNumber),
  ]
);

export const seaCampaignProgress = pgTable(
  "sea_campaign_progress",
  {
    id: serial().primaryKey(),
    userAddress: varchar({ length: 42 })
      .notNull()
      .references(() => users.userAddress),
    week1Completed: boolean().default(false),
    week2Completed: boolean().default(false),
    week3Completed: boolean().default(false),
    week4Completed: boolean().default(false),
    week5Completed: boolean().default(false),
    week6Completed: boolean().default(false),
    totalWeeksCompleted: integer().default(0),
    isGraduated: boolean().default(false),
    registrationDate: timestamp().defaultNow().notNull(),
    graduationDate: timestamp(),
    totalBonusEarned: decimal({ precision: 10, scale: 2 }).default("0"),
  },
  table => [
    index("sea_progress_user_idx").on(table.userAddress),
    uniqueIndex("sea_progress_user_unique").on(table.userAddress),
  ]
);

export const seaCampaignRewards = pgTable(
  "sea_campaign_rewards",
  {
    id: serial().primaryKey(),
    userAddress: varchar({ length: 42 })
      .notNull()
      .references(() => users.userAddress),
    weekNumber: integer().notNull(),
    rewardType: seaCampaignRewardTypeEnum().notNull(),
    rewardAmount: decimal({ precision: 10, scale: 2 }).notNull(),
    awardedDate: timestamp().defaultNow().notNull(),
    paidDate: timestamp(),
    paymentStatus: seaCampaignPaymentStatusEnum().default(SeaCampaignPaymentStatus.PENDING),
    paymentTxHash: varchar({ length: 66 }),
  },
  table => [
    index("sea_rewards_user_idx").on(table.userAddress),
    index("sea_rewards_week_idx").on(table.weekNumber),
  ]
);

// SEA Campaign Relations
export const seaCampaignSubmissionsRelations = relations(seaCampaignSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [seaCampaignSubmissions.userAddress],
    references: [users.userAddress],
  }),
}));

export const seaCampaignProgressRelations = relations(seaCampaignProgress, ({ one }) => ({
  user: one(users, {
    fields: [seaCampaignProgress.userAddress],
    references: [users.userAddress],
  }),
}));

export const seaCampaignRewardsRelations = relations(seaCampaignRewards, ({ one }) => ({
  user: one(users, {
    fields: [seaCampaignRewards.userAddress],
    references: [users.userAddress],
  }),
}));

// Update users relation to include SEA campaign data
export const usersSeaCampaignRelations = relations(users, ({ one, many }) => ({
  seaCampaignProgress: one(seaCampaignProgress, {
    fields: [users.userAddress],
    references: [seaCampaignProgress.userAddress],
  }),
  seaCampaignSubmissions: many(seaCampaignSubmissions),
  seaCampaignRewards: many(seaCampaignRewards),
}));
