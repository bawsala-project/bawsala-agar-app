"use client";

import React from "react";

export type FitLevel = "excellent" | "good" | "acceptable" | "weak";

interface FitArcProps {
  level: FitLevel | string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

const FIT_CONFIG: Record<
  string,
  {
    defaultLabel: string;
    filledCount: number;
    color: string;
  }
> = {
  excellent: {
    defaultLabel: "ممتاز",
    filledCount: 4,
    color: "#F2EBE2",
  },
  good: {
    defaultLabel: "جيد",
    filledCount: 3,
    color: "#D7CBBE",
  },
  acceptable: {
    defaultLabel: "مقبول",
    filledCount: 2,
    color: "#645A4E",
  },
  weak: {
    defaultLabel: "ضعيف",
    filledCount: 1,
    color: "#645A4E",
  },
};

export function FitArc({
  level,
  label,
  className = "",
  size = "md",
}: FitArcProps) {
  const normalizedLevel = level.toLowerCase();
  const config =
    FIT_CONFIG[normalizedLevel] ||
    (normalizedLevel.includes("ممتاز")
      ? FIT_CONFIG.excellent
      : normalizedLevel.includes("جيد")
      ? FIT_CONFIG.good
      : normalizedLevel.includes("مقبول")
      ? FIT_CONFIG.acceptable
      : FIT_CONFIG.weak);

  const displayLabel = label || config.defaultLabel;
  const isSm = size === "sm";

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* 4 Arc segments gauge */}
      <div className={`relative flex items-center justify-center ${isSm ? "w-4 h-4" : "w-5 h-5"}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full -rotate-90">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < config.filledCount;
            // 4 arcs around circle with small gaps
            const dashArray = "14 4";
            const offset = -(index * 18);
            return (
              <circle
                key={index}
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke={isFilled ? config.color : "rgba(100, 90, 78, 0.25)"}
                strokeWidth={isSm ? "2.2" : "2.8"}
                strokeDasharray={dashArray}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>

      <span className={`font-medium ${isSm ? "text-xs" : "text-sm"} text-current leading-none`}>
        {displayLabel}
      </span>
    </div>
  );
}
