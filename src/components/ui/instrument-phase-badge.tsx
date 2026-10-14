"use client";

import React from "react";
import { motion } from "framer-motion";

export interface InstrumentPhaseBadgeProps {
  label: string;
  currentStep?: number;
  totalSteps?: number;
  sublabel?: string;
  className?: string;
  size?: "sm" | "md";
}

export function InstrumentPhaseBadge({
  label,
  currentStep = 1,
  totalSteps = 4,
  sublabel,
  className = "",
  size = "md",
}: InstrumentPhaseBadgeProps) {
  const tickCount = 16;
  const progressRatio = Math.min(1, Math.max(0, currentStep / totalSteps));
  const activeTicksCount = Math.round(progressRatio * tickCount);

  // Generate radial ticks
  const dialTicks = Array.from({ length: tickCount }, (_, i) => {
    const angle = (i * (360 / tickCount) * Math.PI) / 180;
    const cx = 14;
    const cy = 14;
    const rIn = 8;
    const rOut = 12;

    return {
      index: i,
      x1: +(cx + rIn * Math.sin(angle)).toFixed(2),
      y1: +(cy - rIn * Math.cos(angle)).toFixed(2),
      x2: +(cx + rOut * Math.sin(angle)).toFixed(2),
      y2: +(cy - rOut * Math.cos(angle)).toFixed(2),
    };
  });

  return (
    <div
      dir="rtl"
      className={`inline-flex items-center gap-2.5 rounded-full bg-[var(--paper)] border border-[var(--mist)] text-[var(--navy)] shadow-xs select-none ${
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-xs sm:text-sm"
      } ${className}`}
    >
      {/* Clockwise Segmented Ring of Ticks Filling in Navy */}
      <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 28 28"
          fill="none"
          className="w-full h-full overflow-visible"
        >
          {/* Outer hairline circle */}
          <circle
            cx="14"
            cy="14"
            r="12.5"
            stroke="var(--mist)"
            strokeWidth="0.5"
            strokeOpacity="0.4"
          />

          {/* Clockwise Segmented Ticks */}
          {dialTicks.map((tick) => {
            const isActive = tick.index < activeTicksCount;
            return (
              <motion.line
                key={tick.index}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={isActive ? "var(--navy)" : "var(--mist)"}
                strokeWidth={isActive ? "1.4" : "0.75"}
                strokeLinecap="round"
                opacity={isActive ? 1 : 0.4}
                animate={{
                  opacity: isActive ? 1 : 0.4,
                }}
                transition={{ duration: 0.25 }}
              />
            );
          })}

          {/* Center Navy Dot */}
          <circle
            cx="14"
            cy="14"
            r="1.8"
            fill="var(--navy)"
          />
        </svg>
      </div>

      <div className="flex items-center gap-1.5 font-bold">
        <span>{label}</span>
        {sublabel && (
          <span className="text-[11px] font-normal text-[var(--dusty-blue)]">
            • {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
