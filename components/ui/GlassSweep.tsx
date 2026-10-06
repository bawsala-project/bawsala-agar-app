"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface GlassSweepProps {
  intervalSeconds?: number;
  className?: string;
}

export function GlassSweep({
  intervalSeconds = 9,
  className = "",
}: GlassSweepProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <motion.div
        initial={{ x: "-150%", opacity: 0 }}
        animate={{
          x: ["-150%", "-150%", "250%", "250%"],
          opacity: [0, 0.45, 0.45, 0],
        }}
        transition={{
          duration: intervalSeconds,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.7, 0.9, 1],
        }}
        style={{
          transform: "skewX(-25deg)",
          width: "45%",
          height: "100%",
          background: "linear-gradient(90deg, transparent 0%, rgba(242, 235, 226, 0.22) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}
