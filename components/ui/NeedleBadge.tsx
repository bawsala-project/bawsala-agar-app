"use client";

import React from "react";

export type NeedleContext = "rank" | "priority";

interface NeedleBadgeProps {
  angle?: number;
  rank?: 1 | 2 | 3;
  priority?: "high" | "medium" | "low" | "insufficient" | "insufficient_data";
  size?: "sm" | "md" | "lg";
  className?: string;
  glow?: boolean;
  variant?: "light" | "dark";
}

export function NeedleBadge({
  angle,
  rank,
  priority,
  size = "md",
  className = "",
  glow = false,
}: NeedleBadgeProps) {
  // Determine rotation angle
  let resolvedAngle = 0;
  let isDashed = false;

  if (typeof angle === "number") {
    resolvedAngle = angle;
  } else if (rank !== undefined) {
    // Rank 1: 0° (North), Rank 2: 45°, Rank 3: 90° (East)
    resolvedAngle = rank === 1 ? 0 : rank === 2 ? 45 : 90;
  } else if (priority) {
    if (priority === "high") resolvedAngle = 30;
    else if (priority === "medium") resolvedAngle = 85;
    else if (priority === "low") resolvedAngle = 145;
    else if (priority === "insufficient" || priority === "insufficient_data") {
      resolvedAngle = 0;
      isDashed = true;
    }
  }

  const dimensions = {
    sm: { box: 24, stroke: 1.2, r: 10 },
    md: { box: 32, stroke: 1.5, r: 13 },
    lg: { box: 40, stroke: 1.5, r: 17 },
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: dimensions.box, height: dimensions.box }}
    >
      <svg
        width={dimensions.box}
        height={dimensions.box}
        viewBox="0 0 32 32"
        fill="none"
        className="w-full h-full"
      >
        {/* Outer Thin Ring */}
        <circle
          cx="16"
          cy="16"
          r="13.5"
          stroke="var(--driftwood)"
          strokeWidth={dimensions.stroke}
          strokeOpacity={isDashed ? "0.3" : "0.75"}
          strokeDasharray={isDashed ? "3 3" : undefined}
        />

        {/* Small subtle tick at 12 o'clock */}
        <line
          x1="16"
          y1="2.5"
          x2="16"
          y2="4.5"
          stroke="var(--sandstone)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Precision Needle: pointing at resolvedAngle */}
        <g
          transform={`rotate(${resolvedAngle} 16 16)`}
          className="transition-transform duration-500 ease-out"
        >
          {/* North Pointing Tip in Sandstone */}
          <polygon
            points="16 6 18.5 16 16 15 13.5 16"
            fill="var(--sandstone)"
            stroke="var(--espresso)"
            strokeWidth="0.5"
          />

          {/* South Tail in Driftwood */}
          <polygon
            points="16 26 18.5 16 16 15 13.5 16"
            fill="var(--driftwood)"
            stroke="var(--espresso)"
            strokeWidth="0.5"
          />

          {/* Central Pivot Dot */}
          <circle
            cx="16"
            cy="16"
            r="1.75"
            fill="var(--espresso)"
            stroke="var(--sandstone)"
            strokeWidth="1"
          />
        </g>
      </svg>

      {/* Subtle Glow if requested */}
      {glow && (
        <div className="absolute inset-0 rounded-full blur-sm pointer-events-none bg-sandstone/15" />
      )}
    </div>
  );
}
