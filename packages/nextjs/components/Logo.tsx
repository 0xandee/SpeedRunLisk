"use client";

import { HTMLProps, useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

// Dynamic logo component that changes colors based on dark/light mode
export const Logo = ({ className, ...props }: HTMLProps<HTMLDivElement>) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // This avoids hydration mismatch between server and client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to light mode logo until client-side rendering is complete
  let logoSrc = "/logos/00 Wordmark/lisk-wordmark-black.svg";

  if (mounted) {
    logoSrc =
      resolvedTheme === "dark"
        ? "/logos/00 Wordmark/lisk-wordmark-white.svg"
        : "/logos/00 Wordmark/lisk-wordmark-black.svg";
  }

  return (
    <div className={className} {...props}>
      <Image src={logoSrc} alt="Lisk SpeedRun" width={192} height={40} priority className="h-auto" />
    </div>
  );
};

export default Logo;
