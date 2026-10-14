"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export interface StackedSectionProps {
  children: React.ReactNode;
  index: number;
  total?: number;
  className?: string;
  bgColor?: string;
}

export function StackedSection({
  children,
  index,
  className = "",
  bgColor = "bg-[var(--cream)]",
}: StackedSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scale down from 1 to 0.98 as the next section rolls over (stacked-sheet feel)
  const { scrollYProgress: exitProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(exitProgress, [0, 1], [1, 0.98]);
  const opacity = useTransform(exitProgress, [0, 1], [1, 0.85]);

  return (
    <motion.section
      ref={containerRef}
      style={{
        scale,
        opacity,
        zIndex: 10 + index,
      }}
      className={`relative w-full rounded-t-[36px] sm:rounded-t-[48px] -mt-10 sm:-mt-14 pt-12 sm:pt-16 pb-16 sm:pb-24 border-t border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.04)] will-change-transform ${bgColor} ${className}`}
    >
      {/* Top Measuring Ticks Frame on Section Border */}
      <div className="absolute top-0 inset-x-8 sm:inset-x-16 h-[2px] flex justify-between items-start pointer-events-none opacity-20">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`w-[1px] bg-[var(--navy)] ${i % 3 === 0 ? "h-2" : "h-1"}`}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {children}
      </div>
    </motion.section>
  );
}
