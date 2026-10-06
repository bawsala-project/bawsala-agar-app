"use client";

import React, { useState } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface TertiaryButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  label?: string;
  className?: string;
  icon?: React.ReactNode;
  underlineColor?: string;
}

export function TertiaryButton({
  children,
  label,
  className = "",
  icon,
  underlineColor = "#D7CBBE",
  ...props
}: TertiaryButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const content = label || children;

  return (
    <motion.button
      type="button"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={`relative inline-flex items-center gap-1.5 py-1 text-xs md:text-sm font-medium text-[#D7CBBE] hover:text-[#F2EBE2] cursor-pointer select-none transition-colors active:opacity-80 ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{content}</span>

      {/* Thin hairline underline that draws in */}
      <motion.span
        className="absolute bottom-0 right-0 h-[1.5px] rounded-full origin-right pointer-events-none"
        style={{ backgroundColor: underlineColor }}
        initial={{ width: 0 }}
        animate={{ width: isHovered ? "100%" : 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.button>
  );
}
