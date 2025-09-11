import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { users, userChallenges, seaCampaignProgress } from "~~/services/database/config/schema";
import { ReviewAction } from "~~/services/database/config/types";
import { markAsParticipant, updateWeekCompletion } from "~~/services/database/repositories/seaCampaignProgress";

// SEA challenge IDs mapped to week numbers
const SEA_CHALLENGE_WEEKS: Record<string, number> = {
  "sea-week-1-hello-token-nft": 1,
  "sea-week-2-frontend-connect": 2,
  "sea-week-3-indexing-display": 3,
  "sea-week-4-oracle-sponsored": 4,
  "sea-week-5-nft-badge-game": 5,
  "sea-week-6-mini-dex-lending": 6,
};

export async function POST(req: NextRequest) {
  try {
    console.log("Starting SEA campaign progress synchronization...");

    const results = {
      usersProcessed: 0,
      usersCreated: 0,
      usersUpdated: 0,
      errors: [] as string[],
    };

    // Get all SEA challenge submissions for debugging
    const allSeaSubmissions = await db
      .select({
        userAddress: userChallenges.userAddress,
        challengeId: userChallenges.challengeId,
        reviewAction: userChallenges.reviewAction,
        submittedAt: userChallenges.submittedAt,
      })
      .from(userChallenges)
      .where(sql`${userChallenges.challengeId} LIKE 'sea-week-%'`)
      .orderBy(userChallenges.userAddress, userChallenges.challengeId);

    console.log(`Found ${allSeaSubmissions.length} total SEA challenge submissions`);
    
    // Show breakdown by status
    const statusCounts = allSeaSubmissions.reduce((acc, sub) => {
      acc[sub.reviewAction || 'NULL'] = (acc[sub.reviewAction || 'NULL'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Status breakdown:', statusCounts);

    // Get only accepted submissions for processing
    const seaChallengeSubmissions = allSeaSubmissions.filter(
      sub => sub.reviewAction === ReviewAction.ACCEPTED
    );

    console.log(`Found ${seaChallengeSubmissions.length} accepted SEA challenge submissions`);

    // If no accepted submissions in userChallenges, check seaCampaignProgress table
    if (seaChallengeSubmissions.length === 0) {
      console.log("No accepted submissions found, checking seaCampaignProgress table...");
      
      // Get all progress records that have completed weeks
      const progressRecords = await db
        .select()
        .from(seaCampaignProgress)
        .where(sql`total_weeks_completed > 0`);
      
      console.log(`Found ${progressRecords.length} progress records with completed weeks`);
      
      // For each progress record, create corresponding userChallenge entries
      for (const progress of progressRecords) {
        console.log(`Processing progress for ${progress.userAddress}...`);
        
        // Check which weeks are completed and create userChallenge entries
        const completedWeeks: number[] = [];
        if (progress.week1Completed) completedWeeks.push(1);
        if (progress.week2Completed) completedWeeks.push(2);
        if (progress.week3Completed) completedWeeks.push(3);
        if (progress.week4Completed) completedWeeks.push(4);
        if (progress.week5Completed) completedWeeks.push(5);
        if (progress.week6Completed) completedWeeks.push(6);
        
        console.log(`  Completed weeks: [${completedWeeks.join(', ')}]`);
        
        for (const weekNum of completedWeeks) {
          const challengeId = Object.keys(SEA_CHALLENGE_WEEKS).find(
            id => SEA_CHALLENGE_WEEKS[id] === weekNum
          );
          
          if (challengeId) {
            // Check if userChallenge already exists
            const existing = await db
              .select()
              .from(userChallenges)
              .where(
                and(
                  eq(sql`lower(${userChallenges.userAddress})`, progress.userAddress.toLowerCase()),
                  eq(userChallenges.challengeId, challengeId)
                )
              )
              .limit(1);
            
            if (existing.length === 0) {
              console.log(`  Creating userChallenge for ${challengeId}`);
              
              // Create userChallenge entry for this completed week
              await db.insert(userChallenges).values({
                userAddress: progress.userAddress,
                challengeId,
                frontendUrl: '',
                contractUrl: '',
                reviewAction: ReviewAction.ACCEPTED,
                reviewComment: 'Synced from SEA campaign progress',
                submittedAt: progress.registrationDate || new Date(),
              });
              
              results.usersCreated++;
            } else {
              console.log(`  UserChallenge already exists for ${challengeId}`);
            }
          }
        }
        
        results.usersProcessed++;
      }
      
      return NextResponse.json({
        success: true,
        message: "SEA campaign progress synchronization completed (from progress table)",
        results,
      });
    }

    // Group by user
    const userSubmissions = new Map<string, typeof seaChallengeSubmissions>();
    for (const submission of seaChallengeSubmissions) {
      const userAddr = submission.userAddress.toLowerCase();
      if (!userSubmissions.has(userAddr)) {
        userSubmissions.set(userAddr, []);
      }
      userSubmissions.get(userAddr)!.push(submission);
    }

    console.log(`Processing ${userSubmissions.size} unique users...`);

    for (const [userAddr, submissions] of userSubmissions) {
      try {
        // Get the actual user record
        const userRecord = await db.query.users.findFirst({
          where: eq(sql`lower(${users.userAddress})`, userAddr),
        });

        if (!userRecord) {
          results.errors.push(`User record not found for ${userAddr}`);
          continue;
        }

        console.log(`Processing ${userRecord.userAddress} with ${submissions.length} submissions...`);

        // Mark as participant first
        await markAsParticipant(userRecord.userAddress);

        // Get existing progress
        const existingProgress = await db
          .select()
          .from(seaCampaignProgress)
          .where(eq(sql`lower(${seaCampaignProgress.userAddress})`, userAddr))
          .limit(1);

        // Calculate which weeks should be completed
        const completedWeeks = new Set<number>();
        for (const submission of submissions) {
          const weekNum = SEA_CHALLENGE_WEEKS[submission.challengeId];
          if (weekNum) {
            completedWeeks.add(weekNum);
          }
        }

        const weekCompletions = {
          week1Completed: completedWeeks.has(1),
          week2Completed: completedWeeks.has(2),
          week3Completed: completedWeeks.has(3),
          week4Completed: completedWeeks.has(4),
          week5Completed: completedWeeks.has(5),
          week6Completed: completedWeeks.has(6),
        };

        const totalCompleted = completedWeeks.size;
        const isGraduated = totalCompleted === 6;

        if (existingProgress.length === 0) {
          // Create new progress record
          await db.insert(seaCampaignProgress).values({
            userAddress: userRecord.userAddress,
            ...weekCompletions,
            totalWeeksCompleted: totalCompleted,
            isGraduated,
            graduationDate: isGraduated ? new Date() : null,
          });
          results.usersCreated++;
          console.log(`  Created progress record - ${totalCompleted} weeks completed`);
        } else {
          // Update existing progress record
          const current = existingProgress[0];
          await db
            .update(seaCampaignProgress)
            .set({
              ...weekCompletions,
              totalWeeksCompleted: totalCompleted,
              isGraduated,
              graduationDate: isGraduated && !current.isGraduated ? new Date() : current.graduationDate,
            })
            .where(eq(seaCampaignProgress.userAddress, current.userAddress));
          results.usersUpdated++;
          console.log(`  Updated progress record: ${current.totalWeeksCompleted} -> ${totalCompleted} weeks`);
        }

        results.usersProcessed++;
      } catch (error) {
        const errorMsg = `Error processing user ${userAddr}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    console.log("Synchronization complete!");
    console.log("Results:", results);

    return NextResponse.json({
      success: true,
      message: "SEA campaign progress synchronization completed",
      results,
    });
  } catch (error) {
    console.error("Error in SEA campaign synchronization:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during synchronization",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}