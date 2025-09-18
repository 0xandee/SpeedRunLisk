"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

interface MermaidProps {
  chart: string;
  id?: string;
}

export const Mermaid = ({ chart, id }: MermaidProps) => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "dark",
      securityLevel: "loose",
    });

    if (mermaidRef.current) {
      const uniqueId = id || `mermaid-${Date.now()}`;
      mermaidRef.current.innerHTML = `<div class="mermaid" id="${uniqueId}">${chart}</div>`;
      mermaid.contentLoaded();
    }
  }, [chart, id]);

  return (
    <div className="relative group not-prose my-4">
      {/* Header with language label */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg border-b border-gray-700">
        <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">mermaid</span>
      </div>

      {/* Mermaid diagram container */}
      <div
        ref={mermaidRef}
        className="bg-gray-900 rounded-b-lg p-4 flex justify-center border border-gray-700 border-t-0"
      />
    </div>
  );
};