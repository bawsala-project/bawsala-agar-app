"use client";

import React from "react";
import { motion } from "framer-motion";

export interface InstrumentChipProps {
  label: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  count?: number | string;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

export function InstrumentChip({
  label,
  icon,
  selected = false,
  onSelect,
  count,
  size = "md",
  className = "",
  disabled = false,
}: InstrumentChipProps) {
  const sizeClasses = {
    sm: "px-3 py-1 text-xs gap-1.5 min-h-[30px]",
    md: "px-4 py-2 text-xs sm:text-sm gap-2 min-h-[38px]",
  }[size];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      whileHover={{ y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.94 }}
      animate={{
        scale: selected ? [1, 1.05, 1] : 1,
      }}
      transition={{
        scale: { type: "spring", stiffness: 450, damping: 22 },
        y: { duration: 0.15 },
      }}
      className={`relative inline-flex items-center justify-center rounded-full border select-none transition-colors duration-300 font-medium focus:outline-hidden ${sizeClasses} ${
        selected
          ? "bg-[var(--navy)] text-[var(--cream)] font-bold border-[var(--navy)] shadow-xs"
          : "bg-[var(--paper)] text-[var(--navy)] hover:border-[var(--navy)] border-[var(--mist)] shadow-xs"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {/* Icon */}
      {icon && (
        <span
          className={`shrink-0 transition-colors ${
            selected ? "text-[var(--cream)]" : "text-[var(--navy)]"
          }`}
        >
          {icon}
        </span>
      )}

      {/* Label */}
      <span className="font-display">{label}</span>

      {/* Optional Count */}
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono transition-colors ${
            selected
              ? "bg-[var(--midnight)] text-[var(--cream)]"
              : "bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]"
          }`}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
}
