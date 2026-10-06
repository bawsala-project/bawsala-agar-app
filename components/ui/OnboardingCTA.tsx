"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface OnboardingCTAProps {
  href?: string;
  onClick?: () => void;
  label?: string;
  triggerShimmer?: boolean;
  className?: string;
}

export function OnboardingCTA({
  href = "/start",
  onClick,
  label = "ابدأ التحليل",
  triggerShimmer = true,
  className = "",
}: OnboardingCTAProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  // Arrow repeating nudge every 4s
  const arrowVariants: Record<string, { x: number | number[]; transition?: Record<string, unknown> }> = {
    idle: {
      x: [0, -4, 0, 0],
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            duration: 4,
            repeat: Infinity,
            repeatDelay: 0,
            times: [0, 0.15, 0.3, 1],
            ease: [0.42, 0, 0.58, 1],
          },
    },
    hover: {
      x: -4,
      transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
    },
  };

  const chipVariants: Record<string, { scale: number; transition?: Record<string, unknown> }> = {
    idle: { scale: 1 },
    hover: { scale: shouldReduceMotion ? 1 : 1.05, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } },
  };

  const content = (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "linear-gradient(135deg, #E3A83A 0%, #F0C060 100%)",
      }}
      className={`relative w-full max-w-[360px] h-14 rounded-full text-[#130F08] px-4 flex items-center justify-between select-none shadow-[0_10px_25px_-5px_rgba(227,168,58,0.5)] hover:shadow-[0_14px_32px_-5px_rgba(227,168,58,0.65)] cursor-pointer overflow-hidden group transition-shadow ${className}`}
      dir="rtl"
    >
      {/* Soft light shimmer passing once after intro ends */}
      {triggerShimmer && !shouldReduceMotion && (
        <motion.div
          initial={{ x: "200%", opacity: 0 }}
          animate={{ x: "-200%", opacity: [0, 0.6, 0] }}
          transition={{
            delay: 0.6,
            duration: 1.4,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute inset-0 w-1/2 h-full bg-gradient-to-l from-transparent via-white/50 to-transparent skew-x-[-20deg] pointer-events-none"
        />
      )}

      {/* Subtle top inner reflection */}
      <div className="absolute inset-x-6 top-0 h-px bg-white/50 pointer-events-none" />

      {/* Label: aligned to the start (right in RTL) */}
      <span className="pr-3 text-base font-semibold text-[#130F08] leading-none">
        {label}
      </span>

      {/* 40px Circular Chip at end (left in RTL), filled espresso with light arrow */}
      <motion.div
        variants={chipVariants}
        animate={isHovered ? "hover" : "idle"}
        className="w-10 h-10 rounded-full bg-[#130F08] flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden"
      >
        <motion.div
          variants={arrowVariants}
          animate={isHovered ? "hover" : "idle"}
          className="flex items-center justify-center text-[#FAF6EF]"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        </motion.div>
      </motion.div>
    </motion.button>
  );

  if (href) {
    return (
      <Link href={href} className="w-full flex justify-center">
        {content}
      </Link>
    );
  }

  return <div className="w-full flex justify-center">{content}</div>;
}
