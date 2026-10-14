"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export interface InstrumentCardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function InstrumentCard({
  children,
  className = "",
  onClick,
  interactive = true,
}: InstrumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={interactive ? { y: -4 } : undefined}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-[28px] bg-[var(--paper)] border p-6 sm:p-8 transition-colors duration-200 overflow-hidden select-none text-[var(--navy)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] ${
        isHovered
          ? "border-[var(--navy)]"
          : "border-[var(--mist)]"
      } ${interactive ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
