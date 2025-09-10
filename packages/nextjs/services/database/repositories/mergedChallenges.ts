import { getLatestSubmissionPerChallengeByUser } from "./userChallenges";
import { getSubmissionsByUser } from "./seaCampaignSubmissions";
import { ReviewAction, SeaCampaignSubmissionStatus } from "../config/types";
import { SEA_CAMPAIGN_METADATA } from "~~/utils/sea-challenges";

export type MergedUserChallenge = {
  id: number;
  userAddress: string;
  challengeId: string;
  frontendUrl: string | null;
  contractUrl: string | null;
  reviewComment: string | null;
  submittedAt: Date;
  reviewAction: ReviewAction | null;
  signature: string | null;
  campaignId: string | null;
  weekNumber: number | null;
  socialPostUrl: string | null;
  mentorAssigned: string | null;
  completionTimeHours: number | null;
  challenge: {
    id: string;
    challengeName: string;
    description: string;
    sortOrder: number;
    github?: string | null;
    autograding: boolean;
    disabled: boolean;
    previewImage?: string | null;
    icon?: string | null;
    externalLink?: any;
  };
};

function mapSeaCampaignStatusToReviewAction(status: SeaCampaignSubmissionStatus | null): ReviewAction {
  switch (status) {
    case "APPROVED":
      return ReviewAction.ACCEPTED;
    case "REJECTED":
      return ReviewAction.REJECTED;
    case "SUBMITTED":
      return ReviewAction.SUBMITTED;
    case null:
    default:
      return ReviewAction.SUBMITTED;
  }
}

function getChallengeIdFromWeekNumber(weekNumber: number): string {
  const challengeIds = Object.keys(SEA_CAMPAIGN_METADATA);
  const challengeId = challengeIds[weekNumber - 1];
  return challengeId || `sea-week-${weekNumber}`;
}

export async function getMergedUserChallenges(userAddress: string): Promise<MergedUserChallenge[]> {
  // Get traditional user challenges
  const traditionalChallenges = await getLatestSubmissionPerChallengeByUser(userAddress);
  
  // Get SEA campaign submissions
  const seaCampaignSubmissions = await getSubmissionsByUser(userAddress);
  
  // Convert traditional challenges to merged format
  const mergedTraditional: MergedUserChallenge[] = traditionalChallenges.map(tc => ({
    ...tc,
    submittedAt: tc.submittedAt || new Date(),
    frontendUrl: tc.frontendUrl || null,
    contractUrl: tc.contractUrl || null,
    reviewComment: tc.reviewComment || null,
    reviewAction: tc.reviewAction || null,
    signature: tc.signature || null,
    campaignId: tc.campaignId || null,
    weekNumber: tc.weekNumber || null,
    socialPostUrl: tc.socialPostUrl || null,
    mentorAssigned: tc.mentorAssigned || null,
    completionTimeHours: tc.completionTimeHours || null,
  }));
  
  // Convert SEA campaign submissions to merged format
  const mergedSeaCampaign: MergedUserChallenge[] = seaCampaignSubmissions.map(submission => {
    const challengeId = getChallengeIdFromWeekNumber(submission.weekNumber);
    const challengeMetadata = SEA_CAMPAIGN_METADATA[challengeId as keyof typeof SEA_CAMPAIGN_METADATA];
    
    return {
      id: submission.id,
      userAddress: submission.userAddress,
      challengeId,
      frontendUrl: submission.demoUrl || null,
      contractUrl: submission.contractAddress || null,
      reviewComment: submission.mentorFeedback || null,
      submittedAt: submission.submissionDate,
      reviewAction: mapSeaCampaignStatusToReviewAction(submission.reviewStatus),
      signature: null,
      campaignId: "sea-campaign",
      weekNumber: submission.weekNumber,
      socialPostUrl: submission.socialPostUrl || null,
      mentorAssigned: null,
      completionTimeHours: null,
      challenge: {
        id: challengeId,
        challengeName: challengeMetadata?.title || `Week ${submission.weekNumber} Challenge`,
        description: challengeMetadata?.description || `SEA Campaign Week ${submission.weekNumber}`,
        sortOrder: submission.weekNumber,
        github: submission.githubUrl,
        autograding: true,
        disabled: false,
        previewImage: null,
        icon: null,
        externalLink: null,
      },
    };
  });
  
  // Combine both arrays, preferring SEA campaign submissions over traditional ones for the same challenge ID
  const challengeMap = new Map<string, MergedUserChallenge>();
  
  // Add traditional challenges first
  mergedTraditional.forEach(challenge => {
    challengeMap.set(challenge.challengeId, challenge);
  });
  
  // Add/override with SEA campaign submissions
  mergedSeaCampaign.forEach(challenge => {
    challengeMap.set(challenge.challengeId, challenge);
  });
  
  return Array.from(challengeMap.values()).sort((a, b) => a.challenge.sortOrder - b.challenge.sortOrder);
}