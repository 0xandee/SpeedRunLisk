#!/usr/bin/env tsx

/**
 * Script to synchronize SEA Campaign progress between userChallenges and seaCampaignProgress tables
 * 
 * This script:
 * 1. Finds all users who have submitted SEA challenges (userChallenges table)
 * 2. Ensures they have corresponding progress records (seaCampaignProgress table)
 * 3. Updates week completion status based on approved challenge submissions
 */

import { eq, and, sql } from "drizzle-orm";
import { db } from "../services/database/config/postgresClient";
import { users, userChallenges, seaCampaignProgress } from "../services/database/config/schema";
import { ReviewAction } from "../services/database/config/types";

// SEA challenge IDs mapped to week numbers
const SEA_CHALLENGE_WEEKS: Record<string, number> = {
  "sea-week-1-hello-token-nft": 1,
  "sea-week-2-frontend-connect": 2,
  "sea-week-3-indexing-display": 3,
  "sea-week-4-oracle-sponsored": 4,
  "sea-week-5-nft-badge-game": 5,
  "sea-week-6-mini-dex-lending": 6,
};

async function analyzeDatabaseState() {
  console.log("=== Analyzing Database State ===\n");

  // Get all users with SEA challenge submissions
  const seaChallengeSubmissions = await db
    .select({
      userAddress: userChallenges.userAddress,
      challengeId: userChallenges.challengeId,
      reviewAction: userChallenges.reviewAction,
      submittedAt: userChallenges.submittedAt,
    })
    .from(userChallenges)
    .where(sql`${userChallenges.challengeId} LIKE 'sea-week-%'`)
    .orderBy(userChallenges.userAddress, userChallenges.challengeId);

  console.log(`Found ${seaChallengeSubmissions.length} SEA challenge submissions`);

  // Group by user
  const userSubmissions = new Map<string, typeof seaChallengeSubmissions>();
  for (const submission of seaChallengeSubmissions) {
    const userAddr = submission.userAddress.toLowerCase();
    if (!userSubmissions.has(userAddr)) {
      userSubmissions.set(userAddr, []);
    }
    userSubmissions.get(userAddr)!.push(submission);
  }

  console.log(`Submissions from ${userSubmissions.size} unique users\n`);

  // Check existing progress records
  const existingProgress = await db
    .select()
    .from(seaCampaignProgress);

  console.log(`Found ${existingProgress.length} existing progress records\n`);

  // Analyze discrepancies
  const usersWithSubmissions = Array.from(userSubmissions.keys());
  const usersWithProgress = existingProgress.map(p => p.userAddress.toLowerCase());

  const usersNeedingProgress = usersWithSubmissions.filter(
    addr => !usersWithProgress.includes(addr)
  );

  console.log("=== Analysis Results ===");
  console.log(`Users with submissions but no progress record: ${usersNeedingProgress.length}`);
  if (usersNeedingProgress.length > 0) {
    console.log("Addresses needing progress records:");
    usersNeedingProgress.forEach(addr => console.log(`  - ${addr}`));
  }

  // Detailed analysis per user
  console.log("\n=== Per-User Analysis ===");
  for (const [userAddr, submissions] of userSubmissions) {
    const progressRecord = existingProgress.find(p => p.userAddress.toLowerCase() === userAddr);
    
    console.log(`\nUser: ${userAddr}`);
    console.log(`Submissions: ${submissions.length}`);
    
    const approvedSubmissions = submissions.filter(s => s.reviewAction === ReviewAction.ACCEPT);
    console.log(`Approved submissions: ${approvedSubmissions.length}`);
    
    if (approvedSubmissions.length > 0) {
      console.log("Approved challenges:");
      approvedSubmissions.forEach(s => {
        const weekNum = SEA_CHALLENGE_WEEKS[s.challengeId];
        console.log(`  - ${s.challengeId} (Week ${weekNum})`);
      });
    }

    if (progressRecord) {
      console.log(`Progress record exists - Total weeks: ${progressRecord.totalWeeksCompleted}`);
      const weeklyStatus = [
        progressRecord.week1Completed ? "✓" : "✗",
        progressRecord.week2Completed ? "✓" : "✗", 
        progressRecord.week3Completed ? "✓" : "✗",
        progressRecord.week4Completed ? "✓" : "✗",
        progressRecord.week5Completed ? "✓" : "✗",
        progressRecord.week6Completed ? "✓" : "✗",
      ];
      console.log(`Weekly completion: [${weeklyStatus.join(", ")}]`);
    } else {
      console.log("❌ No progress record found");
    }
  }

  return {
    userSubmissions,
    existingProgress,
    usersNeedingProgress,
  };
}

async function synchronizeProgress(dryRun: boolean = true) {
  console.log(`\n=== ${dryRun ? 'DRY RUN' : 'EXECUTING'} Synchronization ===\n`);

  const { userSubmissions } = await analyzeDatabaseState();

  for (const [userAddr, submissions] of userSubmissions) {
    const approvedSubmissions = submissions.filter(s => s.reviewAction === ReviewAction.ACCEPT);
    
    if (approvedSubmissions.length === 0) {
      console.log(`Skipping ${userAddr} - no approved submissions`);
      continue;
    }

    // Get the actual user record to ensure we use the correct case
    const userRecord = await db.query.users.findFirst({
      where: eq(sql`lower(${users.userAddress})`, userAddr),
    });

    if (!userRecord) {
      console.log(`❌ User record not found for ${userAddr}`);
      continue;
    }

    console.log(`Processing ${userRecord.userAddress}...`);

    // Check if progress record exists
    const existingProgress = await db
      .select()
      .from(seaCampaignProgress)
      .where(eq(sql`lower(${seaCampaignProgress.userAddress})`, userAddr))
      .limit(1);

    // Calculate which weeks should be completed
    const weekCompletions = {
      week1Completed: false,
      week2Completed: false,
      week3Completed: false,
      week4Completed: false,
      week5Completed: false,
      week6Completed: false,
    };

    let totalCompleted = 0;
    for (const submission of approvedSubmissions) {
      const weekNum = SEA_CHALLENGE_WEEKS[submission.challengeId];
      if (weekNum) {
        const weekKey = `week${weekNum}Completed` as keyof typeof weekCompletions;
        if (!weekCompletions[weekKey]) {
          weekCompletions[weekKey] = true;
          totalCompleted++;
        }
      }
    }

    const isGraduated = totalCompleted === 6;

    if (existingProgress.length === 0) {
      // Create new progress record
      console.log(`  Creating new progress record - ${totalCompleted} weeks completed`);
      
      if (!dryRun) {
        await db.insert(seaCampaignProgress).values({
          userAddress: userRecord.userAddress,
          ...weekCompletions,
          totalWeeksCompleted: totalCompleted,
          isGraduated,
          graduationDate: isGraduated ? new Date() : null,
        });
      }
    } else {
      // Update existing progress record
      const current = existingProgress[0];
      console.log(`  Updating existing progress record`);
      console.log(`    Current weeks: ${current.totalWeeksCompleted} -> Target: ${totalCompleted}`);
      
      if (!dryRun) {
        await db
          .update(seaCampaignProgress)
          .set({
            ...weekCompletions,
            totalWeeksCompleted: totalCompleted,
            isGraduated,
            graduationDate: isGraduated && !current.isGraduated ? new Date() : current.graduationDate,
          })
          .where(eq(seaCampaignProgress.userAddress, current.userAddress));
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "analyze":
        await analyzeDatabaseState();
        break;
      case "sync":
        await synchronizeProgress(false); // Execute the sync
        break;
      case "dry-run":
      default:
        await synchronizeProgress(true); // Dry run by default
        break;
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}