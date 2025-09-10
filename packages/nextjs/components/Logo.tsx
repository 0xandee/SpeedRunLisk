"use client";

import { HTMLProps, useEffect, useState } from "react";
import { useTheme } from "next-themes";

// Dynamic logo component that changes colors based on dark/light mode
export const Logo = ({ className, ...props }: HTMLProps<SVGSVGElement>) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // This avoids hydration mismatch between server and client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to light mode color until client-side rendering is complete
  let fillColor = "#4070F4";

  if (mounted) {
    fillColor = resolvedTheme === "dark" ? "#FFFFFF" : "#4070F4";
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 200 40" className={className} {...props}>
      <g fill={fillColor}>
        <path d="M8.5 8.5h3v19h7v3h-10v-22z" />
        <path d="M22.5 8.5h3v22h-3v-22z" />
        <path d="M30.5 25.5c0-4 3-7 7-7s7 3 7 7-3 7-7 7-7-3-7-7zm3 0c0 2.2 1.8 4 4 4s4-1.8 4-4-1.8-4-4-4-4 1.8-4 4z" />
        <path d="M48.5 25.5c0-4 3-7 7-7s7 3 7 7-3 7-7 7-7-3-7-7zm3 0c0 2.2 1.8 4 4 4s4-1.8 4-4-1.8-4-4-4-4 1.8-4 4z" />
        <path d="M66.5 8.5h3v13.5l8-8h4l-7 7 8 9.5h-4l-6-7.5-3 3v4.5h-3v-22z" />
        <text x="85" y="26" fontSize="16" fontWeight="bold" fill={fillColor}>LISK</text>
      </g>
      <text x="8" y="38" fontSize="12" fill={fillColor} opacity="0.7">SpeedRun</text>
    </svg>
  );
};

export default Logo;
