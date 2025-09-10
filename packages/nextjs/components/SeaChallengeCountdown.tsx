"use client";

import { useEffect, useState } from "react";
import { getTimeUntilNextChallenge } from "~~/utils/sea-challenges";

interface TimeUntilNextChallenge {
  days: number;
  hours: number;
  minutes: number;
  challengeId: string;
  title: string;
}

export const SeaChallengeCountdown = () => {
  const [timeUntil, setTimeUntil] = useState<TimeUntilNextChallenge | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeUntil(getTimeUntilNextChallenge());

    // Update countdown every minute
    const interval = setInterval(() => {
      setTimeUntil(getTimeUntilNextChallenge());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted || !timeUntil) return null;

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-primary/20 mb-8">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-primary mb-2">Next SEA Challenge Coming Soon!</h3>
        <p className="text-sm text-base-content/70">{timeUntil.title}</p>
      </div>

      <div className="flex gap-4 text-center">
        <div className="flex flex-col items-center">
          <div className="bg-primary text-primary-content rounded-lg px-3 py-2 font-mono text-2xl font-bold min-w-[60px]">
            {timeUntil.days}
          </div>
          <span className="text-xs mt-1 text-base-content/60">Days</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-primary text-primary-content rounded-lg px-3 py-2 font-mono text-2xl font-bold min-w-[60px]">
            {timeUntil.hours}
          </div>
          <span className="text-xs mt-1 text-base-content/60">Hours</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-primary text-primary-content rounded-lg px-3 py-2 font-mono text-2xl font-bold min-w-[60px]">
            {timeUntil.minutes}
          </div>
          <span className="text-xs mt-1 text-base-content/60">Minutes</span>
        </div>
      </div>

      <p className="text-xs text-base-content/50 mt-4">Join the Speedrun Lisk Campaign!</p>
    </div>
  );
};
