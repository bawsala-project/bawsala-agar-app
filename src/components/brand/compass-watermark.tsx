"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BawsalaCompass } from "./bawsala-compass";

interface HeroCompassWatermarkProps {
  className?: string;
  size?: number;
}

/**
 * HeroCompassWatermark: A giant, very faint (4% opacity) compass watermark
 * positioned behind the hero area that rotates slowly with user scroll.
 */
export function HeroCompassWatermark({
  className = "",
  size = 640,
}: HeroCompassWatermarkProps) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const { scrollY } = useScroll();

  // Scroll rotation: 0 to 1000px scroll rotates the compass 45 degrees
  const scrollRotation = useTransform(scrollY, [0, 1200], [0, 48]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute select-none flex items-center justify-center overflow-visible -z-10 ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <motion.div
        style={{
          rotate: isReducedMotion ? 0 : scrollRotation,
          opacity: 0.04,
        }}
        className="w-full h-full text-[var(--navy)]"
      >
        <BawsalaCompass size={size} needleRotation={18} />
      </motion.div>
    </div>
  );
}
