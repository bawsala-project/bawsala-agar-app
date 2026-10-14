"use client";

import React from "react";
import { motion } from "framer-motion";

interface BawsalaCompassProps {
  /** Diameter in pixels (default: 48) */
  size?: number;
  className?: string;
  /** Rotation of the outer dial / ticks in degrees (default: 0) */
  dialRotation?: number;
  /** Rotation of the diamond needle in degrees (default: 15) */
  needleRotation?: number;
  /** Whether to show a faint soft radial glow behind the dial */
  showGlow?: boolean;
  /** Whether compass is actively in a hover state for micro-interactions */
  isHovered?: boolean;
  /** Automatic micro-animation on hover */
  animateHover?: boolean;
}

const TICK_COUNT = 60;
const CX = 50;
const CY = 50;

// Precompute 60 radial ticks for the dial
const DIAL_TICKS = Array.from({ length: TICK_COUNT }, (_, i) => {
  const angle = (i * (360 / TICK_COUNT) * Math.PI) / 180;
  const isCardinal = i % 15 === 0; // 0 (N), 15 (E), 30 (S), 45 (W)
  const isMajor = i % 5 === 0;     // Every 30 degrees

  const rOut = 42;
  const rIn = isCardinal ? 32 : isMajor ? 34.5 : 37;

  const x1 = +(CX + rIn * Math.sin(angle)).toFixed(2);
  const y1 = +(CY - rIn * Math.cos(angle)).toFixed(2);
  const x2 = +(CX + rOut * Math.sin(angle)).toFixed(2);
  const y2 = +(CY - rOut * Math.cos(angle)).toFixed(2);

  return {
    key: i,
    x1,
    y1,
    x2,
    y2,
    strokeWidth: isCardinal ? 1.3 : isMajor ? 0.95 : 0.6,
    opacity: isCardinal ? 0.95 : isMajor ? 0.75 : 0.4,
  };
});

/**
 * BawsalaCompass: Clean inline SVG compass with independent groups for:
 * 1. Outer Ring (hairline circle + inner concentric guide)
 * 2. Tick Marks (60 radial ticks on the dial)
 * 3. Needle (slim diamond needle slightly tilted at ~15deg)
 * Uses currentColor to adapt to any context seamlessly.
 */
export function BawsalaCompass({
  size = 48,
  className = "",
  dialRotation = 0,
  needleRotation = 15,
  showGlow = false,
  isHovered = false,
  animateHover = false,
}: BawsalaCompassProps) {
  // If animateHover is enabled and hovered, apply a subtle rotational offset
  const effectiveDialRotation = animateHover && isHovered ? dialRotation + 45 : dialRotation;
  const effectiveNeedleRotation = animateHover && isHovered ? needleRotation + 12 : needleRotation;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Optional Pulsing Soft Glow */}
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none -z-10"
          style={{
            background: "radial-gradient(circle, rgba(209, 207, 201, 0.25) 0%, rgba(82, 103, 125, 0.08) 50%, transparent 70%)",
            filter: "blur(6px)",
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible text-current select-none"
        aria-hidden="true"
      >
        {/* GROUP 1: OUTER RING */}
        <g id="outer-ring" className="transition-opacity duration-300">
          {/* Main outer ring */}
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="currentColor"
            strokeWidth="0.85"
            strokeOpacity="0.4"
            fill="none"
          />
          {/* Inner concentric hairline reference circle */}
          <circle
            cx="50"
            cy="50"
            r="35"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.18"
            strokeDasharray="1.5 2.5"
            fill="none"
          />
          {/* North Cardinal Tip Marker (Small Diamond at Zenith) */}
          <polygon
            points="50,3.5 51.5,6.5 50,8.5 48.5,6.5"
            fill="currentColor"
            opacity="0.85"
          />
        </g>

        {/* GROUP 2: TICK MARKS (DIAL) */}
        <motion.g
          id="tick-marks"
          style={{ transformOrigin: "50px 50px" }}
          animate={{ rotate: effectiveDialRotation }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {DIAL_TICKS.map((tick) => (
            <line
              key={tick.key}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="currentColor"
              strokeWidth={tick.strokeWidth}
              strokeLinecap="round"
              opacity={tick.opacity}
            />
          ))}
        </motion.g>

        {/* GROUP 3: NEEDLE */}
        <motion.g
          id="needle"
          style={{ transformOrigin: "50px 50px" }}
          animate={{ rotate: effectiveNeedleRotation }}
          transition={{
            type: "spring",
            damping: 14,
            stiffness: 110,
          }}
        >
          {/* Needle Right Facet (Solid Shaded) */}
          <polygon
            points="50,9 53.5,50 50,91"
            fill="currentColor"
            fillOpacity="0.95"
          />

          {/* Needle Left Facet (Muted Contrast) */}
          <polygon
            points="50,9 46.5,50 50,91"
            fill="currentColor"
            fillOpacity="0.32"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeLinejoin="round"
          />

          {/* Center Dividing Ridge */}
          <line
            x1="50"
            y1="9"
            x2="50"
            y2="91"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />

          {/* Pivot Base Ring */}
          <circle
            cx="50"
            cy="50"
            r="3.6"
            fill="currentColor"
            fillOpacity="0.95"
          />

          {/* Center Watchmaker Jewel / Pinhole */}
          <circle
            cx="50"
            cy="50"
            r="1.4"
            fill="var(--cream)"
          />
        </motion.g>
      </svg>
    </div>
  );
}
