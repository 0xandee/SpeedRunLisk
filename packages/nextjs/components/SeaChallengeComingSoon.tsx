"use client";

import { useEffect, useState } from "react";
import { SEA_CAMPAIGN_METADATA } from "~~/utils/sea-challenges";

interface SeaChallengeComingSoonProps {
  challengeId: string;
}

export const SeaChallengeComingSoon = ({ challengeId }: SeaChallengeComingSoonProps) => {
  const [timeUntil, setTimeUntil] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const updateCountdown = () => {
      const metadata = SEA_CAMPAIGN_METADATA[challengeId as keyof typeof SEA_CAMPAIGN_METADATA];
      if (!metadata) return;

      const now = new Date();
      const dueDate = new Date(metadata.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();

      if (timeDiff <= 0) return;

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntil({ days, hours, minutes });
    };

    updateCountdown();

    // Update countdown every minute
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [challengeId]);

  if (!mounted || !timeUntil) return null;

  const metadata = SEA_CAMPAIGN_METADATA[challengeId as keyof typeof SEA_CAMPAIGN_METADATA];
  if (!metadata) return null;

  return (
    <div className="challenge-expanded-card flex justify-center group relative">
      <div className="flex justify-between max-w-7xl py-8 mx-10 sm:mx-14 pl-10 border-primary border-l-[3px] sm:border-l-[5px] relative flex-col-reverse lg:flex-row border-b-2 group-[:not(:has(+.challenge-expanded-card))]:border-b-0">
        <div className="hidden group-first:block absolute -left-3 z-10 top-0 w-[18px] h-[57%] sm:h-[50%] bg-base-200" />
        <div className="flex flex-col max-w-full lg:max-w-[40%] gap-18 lg:gap-20">
          <div className="flex flex-col items-start gap-0">
            <span className="badge badge-warning">Coming Soon</span>
            <span className="text-lg">Challenge #{metadata.weekNumber}</span>
            <h2 className="text-xl lg:text-2xl font-medium mt-0">{metadata.title}</h2>
          </div>
          <div className="flex flex-col gap-8">
            <span className="text-sm lg:text-base leading-[1.5]">{metadata.description}</span>
            <div className="flex items-center">
              <div className="inline-flex items-center text-xl lg:text-lg px-4 py-1 border-2 border-primary rounded-full bg-base-300 opacity-60 cursor-not-allowed">
                <div className="flex items-center">
                  <span className="ml-2 uppercase font-medium text-sm sm:text-lg">Coming Soon</span>
                </div>
              </div>
            </div>

            {/* Mini countdown for this specific challenge */}
            <div className="flex gap-3 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-primary/20 text-primary rounded px-2 py-1 font-mono text-lg font-bold min-w-[40px]">
                  {timeUntil.days}
                </div>
                <span className="text-xs mt-1 text-base-content/60">Days</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/20 text-primary rounded px-2 py-1 font-mono text-lg font-bold min-w-[40px]">
                  {timeUntil.hours}
                </div>
                <span className="text-xs mt-1 text-base-content/60">Hours</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/20 text-primary rounded px-2 py-1 font-mono text-lg font-bold min-w-[40px]">
                  {timeUntil.minutes}
                </div>
                <span className="text-xs mt-1 text-base-content/60">Minutes</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mb-0 lg:mb-0 opacity-50">
          <div className="w-full max-w-[490px] h-[300px] bg-base-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">⏰</div>
              <p className="text-sm text-base-content/60">Challenge Preview</p>
            </div>
          </div>
        </div>
        <span className="absolute h-3 w-3 sm:h-5 sm:w-5 rounded-full bg-base-300 border-primary border-2 lg:border-4 top-[57%] sm:top-[50%] -left-[8px] sm:-left-[13px]" />
      </div>
    </div>
  );
};
