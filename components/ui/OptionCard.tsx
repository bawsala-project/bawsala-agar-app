"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OptionCardProps {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  badge?: string;
}

export function OptionCard({
  title,
  subtitle,
  selected = false,
  onClick,
  icon,
  className = "",
  badge,
}: OptionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`w-full p-4 rounded-[24px] text-right cursor-pointer transition-all duration-300 relative overflow-hidden flex items-center justify-between gap-3 ${
        selected
          ? "bg-[#FAF6EF] border-2 border-[#14756E] shadow-[0_8px_24px_rgba(20,117,110,0.15)]"
          : "glass-light border border-[#130F08]/10 hover:border-[#130F08]/25"
      } ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
              selected
                ? "bg-[#14756E] text-[#FAF6EF] border-[#14756E]"
                : "glass-light text-[#130F08] border-[#130F08]/12"
            }`}
          >
            {icon}
          </div>
        )}

        <div className="space-y-0.5 truncate">
          <div className="flex items-center gap-2">
            <h4
              className={`text-sm font-semibold truncate transition-colors ${
                selected ? "text-[#14756E]" : "text-[#130F08]"
              }`}
            >
              {title}
            </h4>
            {badge && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E9DFD0] text-[#130F08] border border-[#130F08]/10 font-medium">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[#130F08]/65 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Check Circle that Draws In */}
      <div
        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
          selected
            ? "border-[#14756E] bg-[#14756E] shadow-sm"
            : "border-[#130F08]/20 bg-white/40"
        }`}
      >
        <AnimatePresence>
          {selected && (
            <motion.svg
              key="check-icon"
              className="w-3.5 h-3.5 text-[#FAF6EF]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M 5 13 L 9 17 L 19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                exit={{ pathLength: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
