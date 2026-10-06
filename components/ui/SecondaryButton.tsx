"use client";

import React, { useState } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { buttonMotion } from "@/lib/motion";

export interface SecondaryButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  label?: string;
  fullWidth?: boolean;
  size?: "40" | "48" | "56" | "sm" | "default" | "lg";
  className?: string;
  icon?: React.ReactNode;
  variant?: "light" | "dark";
}

export function SecondaryButton({
  children,
  label,
  fullWidth = false,
  size = "56",
  className = "",
  icon,
  variant = "light",
  ...props
}: SecondaryButtonProps) {
  // Pill heights strictly normalized to: 40px, 48px, 56px
  const sizeClasses =
    size === "40" || size === "sm"
      ? "h-10 px-4 text-xs"
      : size === "48"
      ? "h-12 px-5 text-sm"
      : "h-14 px-6 text-sm md:text-base"; // 56px default

  const content = label || children;

  const glassStyle =
    variant === "light"
      ? "glass-light text-[#130F08] hover:bg-[#E9DFD0]/60 border border-[#130F08]/15 shadow-xs"
      : "glass-dark text-[#FAF6EF] hover:bg-white/10 border border-white/20 shadow-md";

  return (
    <motion.button
      type="button"
      {...buttonMotion}
      className={`relative inline-flex items-center justify-center font-medium rounded-full cursor-pointer select-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none gap-2.5 overflow-hidden ${
        fullWidth ? "w-full" : "w-auto"
      } ${sizeClasses} ${glassStyle} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="font-semibold">{content}</span>
    </motion.button>
  );
}
