"use client";

import React from "react";
import { motion } from "framer-motion";

interface SelectChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export function SelectChip({
  label,
  selected = false,
  onClick,
  className = "",
  icon,
}: SelectChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      animate={
        selected
          ? { scale: [1, 1.05, 1] }
          : { scale: 1 }
      }
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-xs cursor-pointer transition-all duration-200 select-none ${
        selected
          ? "bg-[#14756E] text-[#FAF6EF] border border-[#14756E] shadow-sm font-semibold"
          : "glass-light text-[#130F08] border border-[#130F08]/12 hover:border-[#130F08]/30 font-medium"
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </motion.button>
  );
}
