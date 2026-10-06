"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { buttonMotion } from "@/lib/motion";

export interface PrimaryButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  label?: string;
  fullWidth?: boolean;
  size?: "40" | "48" | "56" | "sm" | "default" | "lg";
  className?: string;
  icon?: React.ReactNode;
  hideArrowChip?: boolean;
}

export function PrimaryButton({
  children,
  label,
  fullWidth = false,
  size = "56",
  className = "",
  icon,
  hideArrowChip = false,
  ...props
}: PrimaryButtonProps) {
  // Pill heights strictly normalized to: 40px, 48px, 56px
  const sizeClasses =
    size === "40" || size === "sm"
      ? "h-10 px-4 text-xs"
      : size === "48"
      ? "h-12 px-5 text-sm"
      : "h-14 px-6 text-base"; // 56px default

  const content = label || children;

  return (
    <motion.button
      type="button"
      {...buttonMotion}
      style={{
        background: "linear-gradient(135deg, #E3A83A 0%, #F0C060 100%)",
      }}
      className={`relative inline-flex items-center justify-between font-semibold rounded-full text-[#130F08] shadow-[0_8px_20px_-4px_rgba(227,168,58,0.45)] hover:shadow-[0_12px_28px_-4px_rgba(227,168,58,0.6)] cursor-pointer select-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none gap-3 overflow-hidden ${
        fullWidth ? "w-full" : "w-auto"
      } ${sizeClasses} ${className}`}
      {...props}
    >
      {/* Top inner subtle highlight */}
      <span className="absolute inset-x-4 top-0 h-[1px] bg-white/40 pointer-events-none" />

      {/* Button Text & Optional Prefix Icon */}
      <div className="flex items-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="text-sm md:text-base font-semibold text-[#130F08]">
          {content}
        </span>
      </div>

      {/* Circular Espresso Arrow Chip at the End (Pointing Left in RTL) */}
      {!hideArrowChip && (
        <span className="w-8 h-8 rounded-full bg-[#130F08] text-[#FAF6EF] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:-translate-x-0.5">
          <ArrowLeft className="w-4 h-4 text-[#FAF6EF]" />
        </span>
      )}
    </motion.button>
  );
}
