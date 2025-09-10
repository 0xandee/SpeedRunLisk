import { InferInsertModel, eq, and, desc, sql } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { seaCampaignSubmissions, users } from "~~/services/database/config/schema";

export type SeaCampaignSubmissionInsert = InferInsertModel<typeof seaCampaignSubmissions>;
export type SeaCampaignSubmissions = Awaited<ReturnType<typeof getSubmissionsByWeek>>;

export async function createSeaCampaignSubmission(submission: SeaCampaignSubmissionInsert) {
  const result = await db.insert(seaCampaignSubmissions).values(submission).returning();
  return result[0];
}

export async function getSubmissionByUserAndWeek(userAddress: string, weekNumber: number) {
  const result = await db
    .select()
    .from(seaCampaignSubmissions)
    .where(and(
      eq(seaCampaignSubmissions.userAddress, userAddress.toLowerCase()),
      eq(seaCampaignSubmissions.weekNumber, weekNumber)
    ))
    .limit(1);
  
  return result[0] || null;
}

export async function getSubmissionsByWeek(weekNumber: number) {
  return await db
    .select({
      id: seaCampaignSubmissions.id,
      userAddress: seaCampaignSubmissions.userAddress,
      weekNumber: seaCampaignSubmissions.weekNumber,
      githubUrl: seaCampaignSubmissions.githubUrl,
      contractAddress: seaCampaignSubmissions.contractAddress,
      txHash: seaCampaignSubmissions.txHash,
      demoUrl: seaCampaignSubmissions.demoUrl,
      socialPostUrl: seaCampaignSubmissions.socialPostUrl,
      country: seaCampaignSubmissions.country,
      submissionDate: seaCampaignSubmissions.submissionDate,
      reviewStatus: seaCampaignSubmissions.reviewStatus,
    })
    .from(seaCampaignSubmissions)
    .where(eq(seaCampaignSubmissions.weekNumber, weekNumber))
    .orderBy(desc(seaCampaignSubmissions.submissionDate));
}

export async function getSubmissionsByUser(userAddress: string) {
  // Use case-insensitive search since userAddress case can vary
  return await db
    .select()
    .from(seaCampaignSubmissions)
    .where(sql`lower(${seaCampaignSubmissions.userAddress}) = lower(${userAddress})`)
    .orderBy(seaCampaignSubmissions.weekNumber);
}

export async function updateSubmissionStatus(
  id: number, 
  reviewStatus: string, 
  mentorFeedback?: string,
  completionBonusAmount?: number
) {
  const updateData: Partial<SeaCampaignSubmissionInsert> = {
    reviewStatus: reviewStatus as any,
  };
  
  if (mentorFeedback) {
    updateData.mentorFeedback = mentorFeedback;
  }
  
  if (completionBonusAmount !== undefined) {
    updateData.completionBonusAmount = completionBonusAmount.toString();
  }

  const result = await db
    .update(seaCampaignSubmissions)
    .set(updateData)
    .where(eq(seaCampaignSubmissions.id, id))
    .returning();
    
  return result[0];
}

export async function getWeeklySubmissionCounts() {
  return await db
    .select({
      weekNumber: seaCampaignSubmissions.weekNumber,
      count: sql<number>`count(*)::int`,
    })
    .from(seaCampaignSubmissions)
    .groupBy(seaCampaignSubmissions.weekNumber)
    .orderBy(seaCampaignSubmissions.weekNumber);
}

export async function getCountryDistribution() {
  return await db
    .select({
      country: seaCampaignSubmissions.country,
      participants: sql<number>`count(distinct ${seaCampaignSubmissions.userAddress})::int`,
    })
    .from(seaCampaignSubmissions)
    .where(sql`${seaCampaignSubmissions.country} IS NOT NULL`)
    .groupBy(seaCampaignSubmissions.country)
    .orderBy(desc(sql`count(distinct ${seaCampaignSubmissions.userAddress})`));
}

export async function getLeaderboardForWeek(weekNumber: number, limit: number = 50) {
  return await db
    .select({
      userAddress: seaCampaignSubmissions.userAddress,
      country: seaCampaignSubmissions.country,
      submissionDate: seaCampaignSubmissions.submissionDate,
      githubUrl: seaCampaignSubmissions.githubUrl,
      demoUrl: seaCampaignSubmissions.demoUrl,
      socialPostUrl: seaCampaignSubmissions.socialPostUrl,
      reviewStatus: seaCampaignSubmissions.reviewStatus,
    })
    .from(seaCampaignSubmissions)
    .where(eq(seaCampaignSubmissions.weekNumber, weekNumber))
    .orderBy(seaCampaignSubmissions.submissionDate)
    .limit(limit);
}

export async function getTotalSubmissions() {
  const result = await db
    .select({
      total: sql<number>`count(*)::int`,
    })
    .from(seaCampaignSubmissions);
    
  return result[0]?.total || 0;
}