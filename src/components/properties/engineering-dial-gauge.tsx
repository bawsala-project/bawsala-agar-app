"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface EngineeringDialGaugeProps {
  score: number; // 0 to 100
  size?: number; // diameter in pixels (default: 52)
  strokeWidth?: number;
  showTicks?: boolean;
  className?: string;
  countUp?: boolean;
}

const TICK_COUNT = 36;
const CX = 50;
const CY = 50;

export function EngineeringDialGauge({
  score = 85,
  size = 52,
  strokeWidth = 3,
  showTicks = true,
  className = "",
  countUp = true,
}: EngineeringDialGaugeProps) {
  const [displayNumber, setDisplayNumber] = useState(countUp ? 0 : score);
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  // Count-up animation
  useEffect(() => {
    if (!countUp) {
      setDisplayNumber(clampedScore);
      return;
    }
    const duration = 1000; // ms
    const steps = 25;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayNumber(Math.round(eased * clampedScore));

      if (step >= steps) {
        clearInterval(timer);
        setDisplayNumber(clampedScore);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [clampedScore, countUp]);

  // Radius for outer tick ring and inner progress circle
  const tickRadius = 45;
  const progressRadius = 36;
  const circumference = 2 * Math.PI * progressRadius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Precompute tick marks
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = (i * (360 / TICK_COUNT) * Math.PI) / 180;
    const isMajor = i % 3 === 0;
    const length = isMajor ? 4.5 : 2.5;
    const rOut = tickRadius;
    const rIn = tickRadius - length;

    return {
      key: i,
      x1: +(CX + rIn * Math.sin(angle)).toFixed(2),
      y1: +(CY - rIn * Math.cos(angle)).toFixed(2),
      x2: +(CX + rOut * Math.sin(angle)).toFixed(2),
      y2: +(CY - rOut * Math.cos(angle)).toFixed(2),
      isMajor,
    };
  });

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      title={`مؤشر جودة العقار: ${clampedScore}%`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full transform -rotate-90 overflow-visible"
      >
        {/* Background circular track */}
        <circle
          cx={CX}
          cy={CY}
          r={progressRadius}
          fill="none"
          stroke="var(--mist)"
          strokeWidth={strokeWidth}
          strokeOpacity="0.4"
        />

        {/* Dial Ticks */}
        {showTicks && (
          <g className="text-[var(--mist)]">
            {ticks.map((t) => (
              <line
                key={t.key}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="currentColor"
                strokeWidth={t.isMajor ? 1.2 : 0.7}
                opacity={t.isMajor ? 0.7 : 0.35}
              />
            ))}
          </g>
        )}

        {/* Foreground active fill track (clockwise from top) */}
        <motion.circle
          cx={CX}
          cy={CY}
          r={progressRadius}
          fill="none"
          stroke="var(--navy)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      {/* Center count-up score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="font-display font-extrabold text-[var(--navy)] tabular-nums tracking-tighter"
          style={{ fontSize: `${Math.round(size * 0.32)}px`, lineHeight: 1 }}
        >
          {displayNumber}
        </span>
        <span
          className="text-[var(--dusty-blue)] uppercase font-semibold"
          style={{ fontSize: `${Math.max(7, Math.round(size * 0.13))}px`, marginTop: "1px" }}
        >
          %
        </span>
      </div>
    </div>
  );
}
