import { db } from "./services/database/config/postgresClient";
import { challenges, seaCampaignProgress, userChallenges, users } from "./services/database/config/schema";
import { ReviewAction } from "./services/database/config/types";
import { eq, sql } from "drizzle-orm";

const TARGET_ADDRESS = "0xeffB943a01dDeC6bA3C94B7A3e65600AB3255d0A";

async function grantAllAccess() {
  console.log(`\n🔍 Checking user: ${TARGET_ADDRESS}\n`);

  // 1. Check if user exists
  const user = await db.query.users.findFirst({
    where: eq(sql`lower(${users.userAddress})`, TARGET_ADDRESS.toLowerCase()),
  });

  if (!user) {
    console.log("❌ User not found. Creating user...");
    await db.insert(users).values({
      userAddress: TARGET_ADDRESS,
      createdAt: new Date(),
      updatedAt: new Date(),
      seaCampaignParticipant: true,
      seaCampaignRegistrationDate: new Date(),
    });
    console.log("✅ User created successfully");
  } else {
    console.log("✅ User found");
    console.log(`   Role: ${user.role}`);
    console.log(`   SEA Campaign Participant: ${user.seaCampaignParticipant}`);

    // Update user to be a SEA campaign participant if not already
    if (!user.seaCampaignParticipant) {
      await db
        .update(users)
        .set({
          seaCampaignParticipant: true,
          seaCampaignRegistrationDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sql`lower(${users.userAddress})`, TARGET_ADDRESS.toLowerCase()));
      console.log("✅ Updated user to be SEA campaign participant");
    }
  }

  // 2. Check and create SEA campaign progress with all weeks completed
  console.log("\n🏆 Setting up SEA Campaign Progress...");

  const existingProgress = await db.query.seaCampaignProgress.findFirst({
    where: eq(sql`lower(${seaCampaignProgress.userAddress})`, TARGET_ADDRESS.toLowerCase()),
  });

  if (!existingProgress) {
    await db.insert(seaCampaignProgress).values({
      userAddress: TARGET_ADDRESS,
      week1Completed: true,
      week2Completed: true,
      week3Completed: true,
      week4Completed: true,
      week5Completed: true,
      week6Completed: true,
      totalWeeksCompleted: 6,
      isGraduated: true,
      registrationDate: new Date(),
      graduationDate: new Date(),
      totalBonusEarned: "0",
    });
    console.log("✅ SEA Campaign progress created with all weeks completed");
  } else {
    await db
      .update(seaCampaignProgress)
      .set({
        week1Completed: true,
        week2Completed: true,
        week3Completed: true,
        week4Completed: true,
        week5Completed: true,
        week6Completed: true,
        totalWeeksCompleted: 6,
        isGraduated: true,
        graduationDate: new Date(),
      })
      .where(eq(seaCampaignProgress.userAddress, existingProgress.userAddress));
    console.log("✅ SEA Campaign progress updated with all weeks completed");
  }

  // 3. Get all challenges
  console.log("\n📚 Granting access to all challenges...");

  const allChallenges = await db.query.challenges.findMany({
    where: eq(challenges.disabled, false),
  });

  console.log(`Found ${allChallenges.length} active challenges`);

  // 4. Check existing user challenges
  const existingUserChallenges = await db.query.userChallenges.findMany({
    where: eq(sql`lower(${userChallenges.userAddress})`, TARGET_ADDRESS.toLowerCase()),
  });

  console.log(`User has ${existingUserChallenges.length} existing challenge submissions`);

  // 5. Create accepted submissions for all challenges not yet completed
  let newChallengesGranted = 0;
  let alreadyCompleted = 0;

  for (const challenge of allChallenges) {
    const existingSubmission = existingUserChallenges.find(uc => uc.challengeId === challenge.id);

    if (!existingSubmission) {
      // Create new accepted submission
      await db.insert(userChallenges).values({
        userAddress: TARGET_ADDRESS,
        challengeId: challenge.id,
        frontendUrl: "https://granted-access.example.com",
        contractUrl: "https://granted-access.example.com",
        reviewComment: "Access granted by admin",
        submittedAt: new Date(),
        reviewAction: ReviewAction.ACCEPTED,
        weekNumber: Math.ceil(allChallenges.indexOf(challenge) / 2) + 1, // Distribute across weeks
      });
      newChallengesGranted++;
      console.log(`✅ Granted access to: ${challenge.challengeName}`);
    } else if (existingSubmission.reviewAction === ReviewAction.ACCEPTED) {
      alreadyCompleted++;
      console.log(`ℹ️  Already completed: ${challenge.challengeName}`);
    } else {
      // Update existing submission to be accepted
      await db
        .update(userChallenges)
        .set({
          reviewAction: ReviewAction.ACCEPTED,
          reviewComment: "Access granted by admin",
        })
        .where(eq(userChallenges.id, existingSubmission.id));
      newChallengesGranted++;
      console.log(`✅ Updated to accepted: ${challenge.challengeName}`);
    }
  }

  console.log(`\n🎉 Summary:`);
  console.log(`   - New challenges granted: ${newChallengesGranted}`);
  console.log(`   - Already completed: ${alreadyCompleted}`);
  console.log(`   - Total challenges accessible: ${allChallenges.length}`);
  console.log(`   - SEA Campaign: All 6 weeks completed & graduated`);
  console.log(`\n✅ User ${TARGET_ADDRESS} now has access to all challenges and lessons!`);
}

grantAllAccess()
  .then(() => {
    console.log("\n🚀 Access granted successfully!");
    process.exit(0);
  })
  .catch(error => {
    console.error("\n❌ Error granting access:", error);
    process.exit(1);
  });
