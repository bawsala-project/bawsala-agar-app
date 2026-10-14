"use client";

import React from "react";
import { BawsalaCompass } from "./bawsala-compass";

interface CompassDividerProps {
  className?: string;
  withEmblem?: boolean;
  label?: string;
}

/**
 * CompassDivider: Section divider featuring the compass tick-mark ruler pattern in navy ink on cream.
 */
export function CompassDivider({
  className = "",
  withEmblem = true,
  label,
}: CompassDividerProps) {
  return (
    <div
      className={`relative w-full py-8 flex items-center justify-center select-none text-[var(--mist)] ${className}`}
      aria-hidden="true"
    >
      {/* Right Hairline with Fade */}
      <div className="flex-1 h-px bg-gradient-to-l from-[var(--mist)] to-transparent" />

      {/* Repeating Tick Ruler Marks (Right) */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 opacity-70">
        {[...Array(12)].map((_, i) => (
          <div
            key={`r-${i}`}
            className={`w-px bg-[var(--mist)] ${i % 3 === 0 ? "h-3 opacity-90" : "h-1.5 opacity-50"}`}
          />
        ))}
      </div>

      {/* Center Motif / Emblem */}
      {withEmblem ? (
        <div className="relative mx-3 p-1.5 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] flex items-center justify-center">
          <BawsalaCompass size={22} needleRotation={15} />
        </div>
      ) : label ? (
        <span className="px-4 text-xs font-mono text-[var(--dusty-blue)] uppercase tracking-wider bg-[var(--cream)] border border-[var(--mist)] rounded-full py-1">
          {label}
        </span>
      ) : (
        <div className="w-2 h-2 rotate-45 border border-[var(--mist)] mx-3" />
      )}

      {/* Repeating Tick Ruler Marks (Left) */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 opacity-70">
        {[...Array(12)].map((_, i) => (
          <div
            key={`l-${i}`}
            className={`w-px bg-[var(--mist)] ${i % 3 === 0 ? "h-3 opacity-90" : "h-1.5 opacity-50"}`}
          />
        ))}
      </div>

      {/* Left Hairline with Fade */}
      <div className="flex-1 h-px bg-gradient-to-r from-[var(--mist)] to-transparent" />
    </div>
  );
}
