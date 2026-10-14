"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export interface InstrumentButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  showNeedle?: boolean;
}

export function InstrumentButton({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  className = "",
  disabled = false,
  showNeedle = true,
}: InstrumentButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [hoverOrigin, setHoverOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Mouse angle tracking for the needle arrow
  const rawAngle = useMotionValue(0);
  const needleAngle = useSpring(rawAngle, { stiffness: 350, damping: 24 });

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoverOrigin({ x, y });
    setIsHovered(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate angle in degrees relative to the center
    const radians = Math.atan2(mouseY - centerY, mouseX - centerX);
    const degrees = (radians * 180) / Math.PI + 90;
    rawAngle.set(degrees);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    needleAngle.set(0);
  };

  const sizeClasses = {
    sm: "px-5 py-2.5 text-base gap-2 min-h-[44px]",
    md: "px-7 py-3.5 text-base gap-2.5 min-h-[48px]",
    lg: "px-9 py-4 text-base gap-3 min-h-[54px]",
  }[size];

  const content = (
    <motion.div
      ref={buttonRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      className={`relative inline-flex items-center justify-center rounded-full font-semibold text-base select-none overflow-hidden transition-all duration-300 ${sizeClasses} ${
        variant === "primary"
          ? "bg-[var(--navy)] text-[var(--cream)] shadow-sm hover:shadow-md"
          : "bg-transparent text-[var(--navy)] border border-[var(--navy)] hover:bg-[var(--paper)]"
      } ${disabled ? "bg-[var(--navy)] text-[var(--cream)]/70 cursor-not-allowed pointer-events-none opacity-100" : "cursor-pointer opacity-100"} ${className}`}
    >
      {/* PRIMARY: Circular Wipe of midnight expanding from cursor position */}
      {variant === "primary" && (
        <motion.span
          className="absolute rounded-full pointer-events-none -z-0 bg-[var(--midnight)]"
          initial={false}
          animate={
            isHovered
              ? {
                  width: 380,
                  height: 380,
                  x: hoverOrigin.x - 190,
                  y: hoverOrigin.y - 190,
                  opacity: 1,
                  scale: 1,
                }
              : {
                  width: 0,
                  height: 0,
                  x: hoverOrigin.x,
                  y: hoverOrigin.y,
                  opacity: 0,
                  scale: 0,
                }
          }
          transition={{
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      )}

      {/* GHOST / SECONDARY: Hairline stroke and drawing effect */}
      {variant !== "primary" && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base border */}
          <rect
            x="0.75"
            y="0.75"
            width="calc(100% - 1.5px)"
            height="calc(100% - 1.5px)"
            rx="999"
            ry="999"
            fill="none"
            stroke="var(--mist)"
            strokeWidth="1"
          />

          {/* Animated drawing stroke */}
          <motion.rect
            x="0.75"
            y="0.75"
            width="calc(100% - 1.5px)"
            height="calc(100% - 1.5px)"
            rx="999"
            ry="999"
            fill="none"
            stroke="var(--navy)"
            strokeWidth="1.2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              isHovered
                ? { pathLength: 1, opacity: 1 }
                : { pathLength: 0, opacity: 0 }
            }
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </svg>
      )}

      {/* Button Text */}
      <span className="relative z-10 tracking-tight whitespace-nowrap font-body font-semibold text-base opacity-100">
        {children}
      </span>

      {/* Needle-Arrow Icon that rotates toward hover direction */}
      {showNeedle && (
        <motion.div
          style={{ rotate: needleAngle }}
          className="relative z-10 flex items-center justify-center shrink-0 w-4 h-4 pointer-events-none"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className={`w-3.5 h-3.5 opacity-100 ${
              variant === "primary"
                ? "text-[var(--cream)]"
                : "text-[var(--navy)]"
            }`}
          >
            {/* Diamond Needle Arrow */}
            <polygon
              points="8,1 12,8 8,15 9,8"
              fill="currentColor"
              opacity="1"
            />
            <polygon
              points="8,1 4,8 8,15 7,8"
              fill="currentColor"
              opacity="0.85"
            />
            {/* Center Pivot Jewel */}
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="inline-block focus:outline-hidden" onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-block focus:outline-hidden bg-transparent border-0 p-0"
    >
      {content}
    </button>
  );
}
