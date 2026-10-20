"use client";

import React from "react";
import { motion } from "framer-motion";

interface HeroConsultationWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function HeroConsultationWrapper({
  children,
  className = "",
}: HeroConsultationWrapperProps) {
  return (
    <motion.div
      id="consultation-card"
      initial={{ y: 36, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.75,
        delay: 0.25,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`max-w-4xl mx-auto mt-0 px-4 sm:px-6 relative z-20 scroll-mt-24 will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}
