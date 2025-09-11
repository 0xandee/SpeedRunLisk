import { InferInsertModel, eq, sql } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { seaCampaignProgress } from "~~/services/database/config/schema";

export type SeaCampaignProgressInsert = InferInsertModel<typeof seaCampaignProgress>;
export type SeaCampaignProgressSelect = Awaited<ReturnType<typeof getProgressByUser>>;

export async function createSeaCampaignProgress(progress: SeaCampaignProgressInsert) {
  const result = await db.insert(seaCampaignProgress).values(progress).returning();
  return result[0];
}

export async function getProgressByUser(userAddress: string) {
  // Use case-insensitive search since userAddress case can vary
  const result = await db
    .select()
    .from(seaCampaignProgress)
    .where(sql`lower(${seaCampaignProgress.userAddress}) = lower(${userAddress})`)
    .limit(1);
  
  return result[0] || null;
}

export async function updateWeekCompletion(userAddress: string, weekNumber: number) {
  // First, get current progress
  const currentProgress = await getProgressByUser(userAddress);
  
  if (!currentProgress) {
    // Get the actual user address from the users table to match the foreign key
    const user = await db.query.users.findFirst({
      where: (users, { eq, sql }) => eq(sql`lower(${users.userAddress})`, userAddress.toLowerCase()),
    });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Create new progress record
    const weekColumns = {
      week1Completed: weekNumber === 1,
      week2Completed: weekNumber === 2,
      week3Completed: weekNumber === 3,
      week4Completed: weekNumber === 4,
      week5Completed: weekNumber === 5,
      week6Completed: weekNumber === 6,
    };
    
    return await createSeaCampaignProgress({
      userAddress: user.userAddress, // Use exact case from users table
      ...weekColumns,
      totalWeeksCompleted: 1,
    });
  } else {
    // Update existing progress
    const weekColumn = `week${weekNumber}Completed` as keyof SeaCampaignProgressInsert;
    const updateData: Partial<SeaCampaignProgressInsert> = {
      [weekColumn]: true,
      totalWeeksCompleted: (currentProgress.totalWeeksCompleted ?? 0) + 1,
    };
    
    // Check if this makes them a graduate (completed all 6 weeks)
    if ((currentProgress.totalWeeksCompleted ?? 0) + 1 === 6) {
      updateData.isGraduated = true;
      updateData.graduationDate = new Date();
    }
    
    const result = await db
      .update(seaCampaignProgress)
      .set(updateData)
      .where(eq(seaCampaignProgress.userAddress, currentProgress.userAddress)) // Use existing progress address
      .returning();
      
    return result[0];
  }
}

export async function markAsParticipant(userAddress: string) {
  const existingProgress = await getProgressByUser(userAddress);
  
  if (!existingProgress) {
    // Get the actual user address from the users table to match the foreign key
    const user = await db.query.users.findFirst({
      where: (users, { eq, sql }) => eq(sql`lower(${users.userAddress})`, userAddress.toLowerCase()),
    });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return await createSeaCampaignProgress({
      userAddress: user.userAddress, // Use the exact case from the users table
    });
  }
  
  return existingProgress;
}

export async function getCampaignStatistics() {
  const result = await db
    .select({
      totalParticipants: sql<number>`count(*)::int`,
      graduates: sql<number>`sum(case when is_graduated then 1 else 0 end)::int`,
      averageWeeksCompleted: sql<number>`avg(total_weeks_completed)::float`,
      totalBonusDistributed: sql<number>`sum(total_bonus_earned)::float`,
    })
    .from(seaCampaignProgress);
    
  return result[0] || {
    totalParticipants: 0,
    graduates: 0,
    averageWeeksCompleted: 0,
    totalBonusDistributed: 0,
  };
}

export async function getProgressDistribution() {
  return await db
    .select({
      weeksCompleted: seaCampaignProgress.totalWeeksCompleted,
      count: sql<number>`count(*)::int`,
    })
    .from(seaCampaignProgress)
    .groupBy(seaCampaignProgress.totalWeeksCompleted)
    .orderBy(seaCampaignProgress.totalWeeksCompleted);
}

export async function getGraduates(limit?: number) {
  const baseQuery = db
    .select()
    .from(seaCampaignProgress)
    .where(eq(seaCampaignProgress.isGraduated, true))
    .orderBy(seaCampaignProgress.graduationDate);
    
  if (limit) {
    return await baseQuery.limit(limit);
  }
  
  return await baseQuery;
}

export async function updateBonusEarned(userAddress: string, bonusAmount: number) {
  const currentProgress = await getProgressByUser(userAddress);
  
  if (!currentProgress) {
    throw new Error("User progress not found");
  }
  
  const newTotalBonus = parseFloat(currentProgress.totalBonusEarned || "0") + bonusAmount;
  
  const result = await db
    .update(seaCampaignProgress)
    .set({
      totalBonusEarned: newTotalBonus.toString(),
    })
    .where(eq(seaCampaignProgress.userAddress, userAddress.toLowerCase()))
    .returning();
    
  return result[0];
}

export async function getTopParticipants(limit: number = 10) {
  return await db
    .select()
    .from(seaCampaignProgress)
    .orderBy(
      sql`${seaCampaignProgress.totalWeeksCompleted} DESC, ${seaCampaignProgress.registrationDate} ASC`
    )
    .limit(limit);
}