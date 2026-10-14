"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";

export interface InstrumentSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
  className?: string;
  tickCount?: number;
}

export function InstrumentSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  unit = "",
  className = "",
  tickCount = 21,
}: InstrumentSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = 1 - clickX / rect.width; // RTL: 0% is at right edge
    const rawVal = min + ratio * (max - min);
    const steppedVal = Math.round(rawVal / step) * step;
    const clampedVal = Math.min(max, Math.max(min, steppedVal));
    onChange(clampedVal);
  };

  return (
    <div dir="rtl" className={`w-full space-y-3 select-none ${className}`}>
      {/* Header with Label and Value Indicator */}
      <div className="flex items-center justify-between">
        {label && (
          <span className="text-xs font-bold text-[var(--navy)] tracking-tight">
            {label}
          </span>
        )}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)]" />
          <span className="font-mono text-xs font-bold tabular-nums">
            {value} {unit}
          </span>
        </div>
      </div>

      {/* Slider Track Area (Rounded Cream Well with 1px Mist Border) */}
      <div className="relative pt-2 pb-5">
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative h-2.5 rounded-full bg-[var(--cream)] border border-[var(--mist)] cursor-pointer"
        >
          {/* Active Fill Track in Navy */}
          <div
            className="absolute top-0 right-0 h-full rounded-full bg-[var(--navy)]"
            style={{ width: `${percentage}%` }}
          />

          {/* Dial-Style Thumb in Navy with Cream Border */}
          <motion.div
            style={{
              right: `calc(${percentage}% - 12px)`,
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--navy)] border-2 border-[var(--cream)] shadow-sm cursor-grab active:cursor-grabbing flex items-center justify-center z-20 group"
          >
            {/* Center Dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--cream)]" />
          </motion.div>
        </div>

        {/* Small Tick Marks Under Track */}
        <div className="absolute bottom-1 inset-x-2 flex justify-between items-center pointer-events-none opacity-60">
          {Array.from({ length: tickCount }).map((_, i) => (
            <div
              key={i}
              className={`w-[1px] ${
                i % 5 === 0
                  ? "h-2 bg-[var(--dusty-blue)]"
                  : "h-1 bg-[var(--mist)]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
