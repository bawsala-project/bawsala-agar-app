"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { buttonMotion } from "@/lib/motion";

export interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: "light" | "dark";
  size?: "48" | "40" | "56";
  className?: string;
  label?: string;
}

/**
 * Standard Bawsala Icon Button:
 * Default is 48px glass circle. Never uses icon-in-bordered-square patterns.
 */
export function IconButton({
  children,
  variant = "light",
  size = "48",
  className = "",
  label,
  ...props
}: IconButtonProps) {
  const sizeClass =
    size === "48"
      ? "w-12 h-12"
      : size === "40"
      ? "w-10 h-10"
      : "w-14 h-14";

  const glassStyle =
    variant === "light"
      ? "glass-light text-[#130F08] hover:bg-[#E9DFD0]/60 border border-[#130F08]/12 shadow-xs"
      : "glass-dark text-[#FAF6EF] hover:bg-white/10 border border-white/20 shadow-md";

  return (
    <motion.button
      type="button"
      {...buttonMotion}
      aria-label={label}
      title={label}
      className={`rounded-full shrink-0 flex items-center justify-center cursor-pointer select-none transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${sizeClass} ${glassStyle} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
