"use client";

import { Info } from "lucide-react";

export function CircularProgress({
  current,
  total,
  size = 64,
  strokeWidth = 5,
}: {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = total > 0 ? Math.min(current / total, 1) : 0;
  const offset = circumference * (1 - percentage);
  const displayPct = Math.round(percentage * 100);

  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      <div
        className="relative flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-neu3"
            strokeWidth={strokeWidth}
          />
          {/* Foreground arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-green transition-[stroke-dashoffset] duration-500"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <span className="text-navy absolute inset-0 flex items-center justify-center text-sm font-bold">
          {displayPct}%
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-navy text-lg leading-tight font-bold">
          {current}/{total}
        </span>
        <span className="text-neu6 flex items-center gap-1 text-xs tracking-wide uppercase">
          Credits Completed
          <Info className="text-neu5 h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
