"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cardMotion } from "@/lib/motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "light" | "dark" | "primary" | "subtle";
  interactive?: boolean;
  children: React.ReactNode;
  className?: string;
  radius?: "20" | "24" | "28";
}

export function GlassCard({
  variant = "light",
  interactive = false,
  children,
  className = "",
  radius = "28",
  ...props
}: GlassCardProps) {
  const variantClass = 
    variant === "dark"
      ? "glass-dark text-[#FAF6EF]"
      : variant === "subtle"
      ? "bawsala-glass-subtle text-[#130F08]"
      : "glass-light text-[#130F08]";

  const radiusClass = 
    radius === "20" 
      ? "rounded-[20px]" 
      : radius === "24" 
      ? "rounded-[24px]" 
      : "rounded-[28px]";

  return (
    <motion.div
      {...(interactive ? cardMotion : {})}
      className={`relative transition-all duration-300 overflow-hidden ${radiusClass} ${variantClass} ${className}`}
      {...props}
    >
      {/* Top inner highlight on glass */}
      <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}
