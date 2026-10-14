"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type CompassLoaderState = "searching" | "locking" | "pointing" | "idle";

export interface CompassLoaderProps {
  /** Size in pixels (default: 72) */
  size?: number;
  /** Active animation state */
  state?: CompassLoaderState;
  /** Rotating status messages in Arabic */
  messages?: string[];
  /** Target angle in degrees for locking or pointing states (default: 15) */
  targetAngle?: number;
  /** Callback fired when locking transition completes */
  onComplete?: () => void;
  className?: string;
  /** Whether to show the thin progress line under the status text */
  showProgressLine?: boolean;
  /** Optional controlled progress percentage (0 - 100) */
  progress?: number;
  /** Duration in ms for each status message before cross-fading (default: 1600ms) */
  intervalMs?: number;
}

const DEFAULT_MESSAGES = [
  "نقارن المساحات الفعلية بمخطط البناء…",
  "نحسب تكاليف التشغيل والصيانة المخفية…",
  "نحلل العقارات المرشحة ومؤشرات الكود السعودي…",
  "ندقق التوافق الإنشائي وتقدير القيمة العادلة…",
  "نراجع اشتراطات العزل وتمديدات السلامة…",
];

const TICK_COUNT = 60;
const CX = 50;
const CY = 50;

// Precompute dial tick marks
const DIAL_TICKS = Array.from({ length: TICK_COUNT }, (_, i) => {
  const angle = (i * (360 / TICK_COUNT) * Math.PI) / 180;
  const isCardinal = i % 15 === 0;
  const isMajor = i % 5 === 0;

  const rOut = 42;
  const rIn = isCardinal ? 32 : isMajor ? 34.5 : 37;

  return {
    key: i,
    x1: +(CX + rIn * Math.sin(angle)).toFixed(2),
    y1: +(CY - rIn * Math.cos(angle)).toFixed(2),
    x2: +(CX + rOut * Math.sin(angle)).toFixed(2),
    y2: +(CY - rOut * Math.cos(angle)).toFixed(2),
    strokeWidth: isCardinal ? 1.3 : isMajor ? 0.95 : 0.6,
  };
});

/**
 * CompassLoader: Reusable top-center loading and thinking indicator.
 * Navy line-art compass (72px):
 * - Needle spins smoothly (ease-in-out, varied speed).
 * - Tick ring counter-rotates slowly.
 * - One thin ring pulses outward.
 * - When finished: needle decelerates and locks with a spring.
 * - Arabic status text cross-fading every 1.6s.
 * - Thin progress line.
 */
export function CompassLoader({
  size = 72,
  state = "searching",
  messages = DEFAULT_MESSAGES,
  targetAngle = 15,
  onComplete,
  className = "",
  showProgressLine = true,
  progress,
  intervalMs = 1600,
}: CompassLoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [autoProgress, setAutoProgress] = useState(15);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Status message rotation every 1.6s
  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [messages.length, intervalMs]);

  // Simulated progress increment while searching
  useEffect(() => {
    if (state !== "searching" || progress !== undefined) return;

    const interval = setInterval(() => {
      setAutoProgress((prev) => {
        if (prev >= 94) return 94;
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, 700);

    return () => clearInterval(interval);
  }, [state, progress]);

  // Handle locking completion callback
  useEffect(() => {
    if (state === "locking" && !hasCompleted) {
      const timer = setTimeout(() => {
        setHasCompleted(true);
        if (onComplete) {
          onComplete();
        }
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [state, hasCompleted, onComplete]);

  const effectiveProgress = useMemo(() => {
    if (state === "locking") return 100;
    if (progress !== undefined) return Math.min(100, Math.max(0, progress));
    return autoProgress;
  }, [state, progress, autoProgress]);

  return (
    <div
      dir="rtl"
      className={`flex flex-col items-center justify-start text-center select-none ${className}`}
    >
      {/* Top Compass Unit (72px) */}
      <div
        className="relative flex items-center justify-center shrink-0 mb-3"
        style={{ width: size, height: size }}
      >
        {/* One Thin Ring Pulses Outward */}
        {state === "searching" && (
          <motion.div
            animate={{
              scale: [0.75, 1.65],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: 2.0,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className="absolute inset-0 rounded-full border border-[var(--mist)] pointer-events-none -z-10"
          />
        )}

        {/* Lock Settle Ripple */}
        {state === "locking" && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 2.0, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 rounded-full border border-[var(--navy)] pointer-events-none -z-10"
          />
        )}

        {/* Navy Line-Art Compass SVG */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible select-none text-[var(--navy)]"
          aria-hidden="true"
        >
          {/* Group 1: Outer Ring */}
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="currentColor"
            strokeWidth="0.85"
            strokeOpacity={state === "locking" ? 0.7 : 0.35}
            fill="none"
            className="transition-all duration-400"
          />
          <circle
            cx="50"
            cy="50"
            r="35"
            stroke="var(--mist)"
            strokeWidth="0.5"
            strokeOpacity="0.35"
            strokeDasharray="1.5 2.5"
            fill="none"
          />

          {/* Group 2: Tick Ring (Counter-rotates slowly while searching) */}
          <motion.g
            id="dial-ticks"
            style={{ transformOrigin: "50px 50px" }}
            animate={
              state === "searching"
                ? { rotate: [0, -360] }
                : { rotate: 0 }
            }
            transition={
              state === "searching"
                ? {
                    duration: 16,
                    repeat: Infinity,
                    ease: "linear",
                  }
                : {
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }
            }
          >
            {DIAL_TICKS.map((t) => (
              <line
                key={t.key}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="currentColor"
                strokeWidth={t.strokeWidth}
                strokeLinecap="round"
                opacity={
                  state === "locking"
                    ? 0.9
                    : t.key % 15 === 0
                    ? 0.85
                    : t.key % 5 === 0
                    ? 0.6
                    : 0.3
                }
              />
            ))}
          </motion.g>

          {/* Group 3: Diamond Needle (Spins with varied speed, decelerates and locks with spring) */}
          <motion.g
            id="compass-needle"
            style={{ transformOrigin: "50px 50px" }}
            animate={
              state === "searching"
                ? {
                    rotate: [0, 160, 290, 420, 560, 720],
                  }
                : state === "locking" || state === "pointing"
                ? {
                    rotate: targetAngle,
                  }
                : {
                    rotate: 15,
                  }
            }
            transition={
              state === "searching"
                ? {
                    duration: 3.2,
                    repeat: Infinity,
                    ease: [0.45, 0.05, 0.55, 0.95],
                  }
                : {
                    type: "spring",
                    stiffness: 90,
                    damping: 12,
                    mass: 0.8,
                  }
            }
          >
            {/* Right Needle Facet (Solid Navy) */}
            <polygon
              points="50,9 53.5,50 50,91"
              fill="currentColor"
              fillOpacity={0.95}
            />

            {/* Left Needle Facet (Muted Contrast) */}
            <polygon
              points="50,9 46.5,50 50,91"
              fill="currentColor"
              fillOpacity={0.3}
              stroke="currentColor"
              strokeWidth="0.75"
              strokeLinejoin="round"
            />

            {/* Center Ridge Line */}
            <line
              x1="50"
              y1="9"
              x2="50"
              y2="91"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeOpacity="0.5"
            />

            {/* Center Pivot Jewel */}
            <circle
              cx="50"
              cy="50"
              r="3.6"
              fill="currentColor"
            />
            <circle
              cx="50"
              cy="50"
              r="1.4"
              fill="var(--cream)"
            />
          </motion.g>
        </svg>
      </div>

      {/* One line of Arabic status text cross-fading every 1.6s */}
      {messages.length > 0 && (
        <div className="h-6 relative flex items-center justify-center overflow-hidden px-4 mb-2 max-w-sm">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="text-xs sm:text-sm font-medium text-[var(--navy)] tracking-tight whitespace-nowrap"
            >
              {messages[currentMessageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {/* Thin Progress Line */}
      {showProgressLine && (
        <div className="w-44 sm:w-56 h-[2px] rounded-full bg-[var(--mist)]/40 overflow-hidden relative">
          <motion.div
            initial={{ width: "12%" }}
            animate={{ width: `${effectiveProgress}%` }}
            transition={{
              duration: state === "locking" ? 0.4 : 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="h-full bg-[var(--navy)] rounded-full"
          />
        </div>
      )}
    </div>
  );
}
