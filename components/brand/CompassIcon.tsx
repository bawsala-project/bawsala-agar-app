"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MOTION_SPRINGS } from "@/lib/motion";

interface CompassIconProps {
  size?: number;
  className?: string;
  isSpinning?: boolean;
  isIdle?: boolean;
  needleAngle?: number; // default 25 degrees
  onSpinComplete?: () => void;
}

export function CompassIcon({
  size = 65, // ~20% larger than original 54px
  className = "",
  isSpinning = false,
  isIdle = false,
  needleAngle = 25,
  onSpinComplete,
}: CompassIconProps) {
  const shouldReduceMotion = useReducedMotion();

  // Generate the 60 tick marks
  const ticks = useMemo(() => {
    const list = [];
    const cx = 50;
    const cy = 50;
    const rOuter = 45;

    for (let i = 0; i < 60; i++) {
      const angleDeg = i * 6;
      const angleRad = (angleDeg * Math.PI) / 180;
      const isMajor = i % 5 === 0;
      const rInner = isMajor ? 35 : 40;

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

  // Needle path: slim diamond, vertices at top, right, bottom, left
  const needlePath = "M 50 12 L 56 50 L 50 88 L 44 50 Z";

  const tickVariants: Record<string, { rotate: number; transition?: { duration: number; ease: [number, number, number, number] } }> = {
    initial: { rotate: 0 },
    spin: {
      rotate: shouldReduceMotion ? 0 : -90,
      transition: {
        duration: 1.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const needleVariants: Record<
    string,
    {
      rotate: number | number[];
      transition?:
        | { duration: number }
        | { type: "spring"; stiffness: number; damping: number }
        | { duration: number; repeat: number; ease: "easeInOut" };
    }
  > = {
    initial: { rotate: shouldReduceMotion ? needleAngle : -875 }, // -875 + 900 = 25
    spin: {
      rotate: needleAngle,
      transition: shouldReduceMotion
        ? { duration: 0.2 }
        : {
            type: "spring",
            stiffness: 60,
            damping: 12,
          },
    },
    idle: {
      rotate: [needleAngle - 3, needleAngle + 3, needleAngle - 3],
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          },
    },
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size, color: "currentColor" }}
      dir="ltr"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        aria-hidden="true"
      >
        {/* Counter-rotating tick ring - ticks fully opaque, 2px stroke, currentColor */}
        <motion.g
          style={{ originX: "50px", originY: "50px" }}
          variants={tickVariants}
          animate={isSpinning ? "spin" : "initial"}
        >
          {ticks.map((tick) => (
            <line
              key={tick.id}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="currentColor"
              strokeWidth={tick.isMajor ? "2" : "1.75"}
              strokeLinecap="round"
              strokeOpacity="1"
            />
          ))}
        </motion.g>

        {/* Needle with spring settling & idle sway - 2px stroke, currentColor */}
        <motion.path
          d={needlePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ originX: "50px", originY: "50px" }}
          variants={needleVariants}
          animate={
            isIdle
              ? "idle"
              : isSpinning
              ? "spin"
              : { rotate: needleAngle }
          }
          onAnimationComplete={() => {
            if (isSpinning && onSpinComplete) {
              onSpinComplete();
            }
          }}
        />

        {/* Center pivot point */}
        <circle
          cx="50"
          cy="50"
          r="1.6"
          fill="currentColor"
          opacity="1"
        />
      </svg>
    </div>
  );
}
