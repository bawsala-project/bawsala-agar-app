"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface TickRingProps {
  progress?: number; // 0 to 100
  size?: number; // width & height in px
  children?: React.ReactNode;
  className?: string;
  showCenterContent?: boolean;
}

export function TickRing({
  progress = 0,
  size = 72,
  children,
  className = "",
  showCenterContent = true,
}: TickRingProps) {
  // Clamped progress between 0 and 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const activeTicksCount = Math.round((normalizedProgress / 100) * 60);

  // Generate 60 tick coordinates
  const ticks = useMemo(() => {
    const list = [];
    const cx = 50;
    const cy = 50;
    const rOuter = 46;

    for (let i = 0; i < 60; i++) {
      const angleDeg = i * 6; // 60 ticks * 6 deg = 360 deg
      const angleRad = (angleDeg * Math.PI) / 180;
      const isMajor = i % 5 === 0;
      const rInner = isMajor ? 36 : 41;

      const x1 = cx + rInner * Math.sin(angleRad);
      const y1 = cy - rInner * Math.cos(angleRad);
      const x2 = cx + rOuter * Math.sin(angleRad);
      const y2 = cy - rOuter * Math.cos(angleRad);

      list.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        isMajor,
      });
    }
    return list;
  }, []);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        fill="none"
      >
        {/* Subtle background guide circle */}
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="#130F08"
          strokeWidth="0.5"
          strokeOpacity="0.12"
        />

        {/* 60 Ticks */}
        {ticks.map((tick) => {
          const isActive = tick.id < activeTicksCount;

          return (
            <line
              key={tick.id}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={isActive ? "#14756E" : "#E9DFD0"}
              strokeWidth={tick.isMajor ? (isActive ? 2 : 1.5) : (isActive ? 1.5 : 1)}
              strokeLinecap="round"
              className="transition-colors duration-200"
            />
          );
        })}
      </svg>

      {/* Center slot */}
      {showCenterContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children ? (
            children
          ) : (
            <bdi dir="ltr" className="tabular-nums font-sans text-xs font-semibold text-[#130F08]">
              {Math.round(normalizedProgress)}%
            </bdi>
          )}
        </div>
      )}
    </div>
  );
}
