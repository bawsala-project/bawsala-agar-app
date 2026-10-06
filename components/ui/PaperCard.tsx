"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cardMotion } from "@/lib/motion";

interface PaperCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export function PaperCard({
  children,
  className = "",
  interactive = false,
  ...props
}: PaperCardProps) {
  return (
    <motion.div
      {...(interactive ? cardMotion : {})}
      className={`relative rounded-[24px] bg-[#FAF6EF] text-[#130F08] p-5 border border-[#E9DFD0] shadow-[0_8px_24px_-4px_rgba(19,15,8,0.06)] transition-all duration-300 selection:bg-[#E9DFD0] ${className}`}
      {...props}
    >
      {/* Subtle top inner light highlight */}
      <span className="absolute inset-x-6 top-0 h-px bg-white/70 pointer-events-none rounded-t-[24px]" />
      {children}
    </motion.div>
  );
}
