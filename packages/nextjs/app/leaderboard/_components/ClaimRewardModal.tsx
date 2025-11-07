"use client";

import { useState } from "react";
import { LeaderboardEntry } from "~~/types/leaderboard";

interface ClaimRewardModalProps {
  userEntry: LeaderboardEntry;
  onClose: () => void;
}

export const ClaimRewardModal = ({ userEntry, onClose }: ClaimRewardModalProps) => {
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  const SURVEY_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSeGX63Nnd-fh7A_2Zai6UHA_8IP4zRimDhi5-nEeM9i1XbJgw/viewform";

  const handleOpenSurvey = () => {
    window.open(SURVEY_URL, "_blank", "noopener,noreferrer");
    // Honor system - mark as completed when they click to open
    setSurveyCompleted(true);
  };

  const handleClaim = () => {
    // Placeholder for claim functionality
    alert("Claim functionality coming soon! Your reward: $" + userEntry.totalRewardUSD);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-2xl text-primary">🎉 Congratulations!</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Reward Info */}
          <div className="alert alert-success">
            <div className="flex flex-col gap-2">
              <div className="font-bold text-lg">You are eligible for a reward!</div>
              <div className="text-sm">
                <span className="font-semibold">Telegram:</span> {userEntry.telegram}
              </div>
              <div className="text-sm">
                <span className="font-semibold">Total Reward:</span>{" "}
                <span className="text-2xl font-bold">${userEntry.totalRewardUSD}</span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h4 className="card-title text-lg">Your Achievements:</h4>
              <div className="space-y-2">
                {userEntry.fastestFinisher && (
                  <div className="flex items-center gap-2">
                    <span className="badge badge-warning">$20</span>
                    <span className="text-success font-bold">✓</span>
                    <span className="font-medium">Fastest Finisher</span>
                  </div>
                )}
                {userEntry.bestProject && (
                  <div className="flex items-center gap-2">
                    <span className="badge badge-info">$50</span>
                    <span className="text-success font-bold">✓</span>
                    <span className="font-medium">Best Project</span>
                  </div>
                )}
                {userEntry.bestSocialEngagement && (
                  <div className="flex items-center gap-2">
                    <span className="badge badge-success">$50</span>
                    <span className="text-success font-bold">✓</span>
                    <span className="font-medium">Best Social Engagement</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Survey Section */}
          <div className="card bg-base-200 border-2 border-primary">
            <div className="card-body">
              <h4 className="card-title text-lg">Complete Survey to Claim</h4>
              <p className="text-sm opacity-80">
                Before claiming your reward, please complete a short survey to help us improve future challenges.
              </p>

              <div className="card-actions justify-end mt-4">
                <button className="btn btn-primary btn-block gap-2" onClick={handleOpenSurvey}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                  Open Survey Form
                </button>
              </div>

              {surveyCompleted && (
                <div className="alert alert-info mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">
                    Once you&apos;ve completed the survey, click the button below to claim your reward!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Claim Button */}
          <div className="flex gap-2">
            <button className="btn btn-outline flex-1" onClick={onClose}>
              Close
            </button>
            <button className="btn btn-success flex-1 gap-2" onClick={handleClaim} disabled={!surveyCompleted}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
              Claim Reward ${userEntry.totalRewardUSD}
            </button>
          </div>

          {!surveyCompleted && (
            <p className="text-xs text-center opacity-60">Click &quot;Open Survey Form&quot; above to enable the claim button</p>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};
