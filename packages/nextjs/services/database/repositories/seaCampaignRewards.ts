import { InferInsertModel, eq, and, desc, sql } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { seaCampaignRewards } from "~~/services/database/config/schema";

export type SeaCampaignRewardInsert = InferInsertModel<typeof seaCampaignRewards>;
export type SeaCampaignRewardsSelect = Awaited<ReturnType<typeof getRewardsByUser>>;

export async function createSeaCampaignReward(reward: SeaCampaignRewardInsert) {
  const result = await db.insert(seaCampaignRewards).values(reward).returning();
  return result[0];
}

export async function getRewardsByUser(userAddress: string) {
  return await db
    .select()
    .from(seaCampaignRewards)
    .where(eq(seaCampaignRewards.userAddress, userAddress.toLowerCase()))
    .orderBy(desc(seaCampaignRewards.awardedDate));
}

export async function getRewardsByWeek(weekNumber: number) {
  return await db
    .select()
    .from(seaCampaignRewards)
    .where(eq(seaCampaignRewards.weekNumber, weekNumber))
    .orderBy(desc(seaCampaignRewards.awardedDate));
}

export async function getRewardsByType(rewardType: string) {
  return await db
    .select()
    .from(seaCampaignRewards)
    .where(eq(seaCampaignRewards.rewardType, rewardType as any))
    .orderBy(desc(seaCampaignRewards.awardedDate));
}

export async function updatePaymentStatus(
  rewardId: number, 
  paymentStatus: string, 
  paymentTxHash?: string
) {
  const updateData: Partial<SeaCampaignRewardInsert> = {
    paymentStatus: paymentStatus as any,
    paidDate: paymentStatus === "PAID" ? new Date() : null,
  };
  
  if (paymentTxHash) {
    updateData.paymentTxHash = paymentTxHash;
  }

  const result = await db
    .update(seaCampaignRewards)
    .set(updateData)
    .where(eq(seaCampaignRewards.id, rewardId))
    .returning();
    
  return result[0];
}

export async function getPendingRewards() {
  return await db
    .select()
    .from(seaCampaignRewards)
    .where(eq(seaCampaignRewards.paymentStatus, "PENDING"))
    .orderBy(seaCampaignRewards.awardedDate);
}

export async function getRewardStatistics() {
  const result = await db
    .select({
      totalRewards: sql<number>`count(*)::int`,
      totalAmount: sql<number>`sum(reward_amount)::float`,
      paidRewards: sql<number>`sum(case when payment_status = 'PAID' then 1 else 0 end)::int`,
      paidAmount: sql<number>`sum(case when payment_status = 'PAID' then reward_amount else 0 end)::float`,
      pendingRewards: sql<number>`sum(case when payment_status = 'PENDING' then 1 else 0 end)::int`,
      pendingAmount: sql<number>`sum(case when payment_status = 'PENDING' then reward_amount else 0 end)::float`,
    })
    .from(seaCampaignRewards);
    
  return result[0] || {
    totalRewards: 0,
    totalAmount: 0,
    paidRewards: 0,
    paidAmount: 0,
    pendingRewards: 0,
    pendingAmount: 0,
  };
}

export async function getRewardsByWeekAndType(weekNumber: number, rewardType: string) {
  return await db
    .select()
    .from(seaCampaignRewards)
    .where(and(
      eq(seaCampaignRewards.weekNumber, weekNumber),
      eq(seaCampaignRewards.rewardType, rewardType as any)
    ))
    .orderBy(desc(seaCampaignRewards.awardedDate));
}

export async function getUserTotalRewards(userAddress: string) {
  const result = await db
    .select({
      totalAmount: sql<number>`sum(reward_amount)::float`,
      totalRewards: sql<number>`count(*)::int`,
      paidAmount: sql<number>`sum(case when payment_status = 'PAID' then reward_amount else 0 end)::float`,
      pendingAmount: sql<number>`sum(case when payment_status = 'PENDING' then reward_amount else 0 end)::float`,
    })
    .from(seaCampaignRewards)
    .where(eq(seaCampaignRewards.userAddress, userAddress.toLowerCase()));
    
  return result[0] || {
    totalAmount: 0,
    totalRewards: 0,
    paidAmount: 0,
    pendingAmount: 0,
  };
}

export async function getTopRewardEarners(limit: number = 10) {
  return await db
    .select({
      userAddress: seaCampaignRewards.userAddress,
      totalAmount: sql<number>`sum(reward_amount)::float`,
      rewardCount: sql<number>`count(*)::int`,
    })
    .from(seaCampaignRewards)
    .groupBy(seaCampaignRewards.userAddress)
    .orderBy(desc(sql`sum(reward_amount)`))
    .limit(limit);
}

export async function getWeeklyRewardDistribution() {
  return await db
    .select({
      weekNumber: seaCampaignRewards.weekNumber,
      rewardType: seaCampaignRewards.rewardType,
      count: sql<number>`count(*)::int`,
      totalAmount: sql<number>`sum(reward_amount)::float`,
    })
    .from(seaCampaignRewards)
    .groupBy(seaCampaignRewards.weekNumber, seaCampaignRewards.rewardType)
    .orderBy(seaCampaignRewards.weekNumber, seaCampaignRewards.rewardType);
}