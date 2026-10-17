"use client";

import React, { useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface MagneticButtonProps {
  children?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "ghost";
  showArrow?: boolean;
}

export function MagneticButton({
  children,
  href,
  onClick,
  className = "",
  variant = "primary",
  showArrow = true,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [wipePos, setWipePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // Springs for magnetic pull
  const springConfig = { damping: 15, stiffness: 180, mass: 0.1 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    // Dampened magnetic offset (maximum pull around 10px)
    const distanceX = (clientX - centerX) * 0.18;
    const distanceY = (clientY - centerY) * 0.18;

    x.set(distanceX);
    y.set(distanceY);

    // Compute cursor position for circular wipe
    setWipePos({
      x: clientX - left,
      y: clientY - top,
    });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ref.current) {
      const { left, top } = ref.current.getBoundingClientRect();
      setWipePos({
        x: e.clientX - left,
        y: e.clientY - top,
      });
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const isPrimary = variant === "primary";

  const content = (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.97 }}
      className={`group relative inline-flex items-center justify-center gap-3 rounded-full transition-all duration-300 cursor-pointer select-none overflow-hidden focus:outline-hidden ${
        isPrimary
          ? "bg-[var(--navy)] text-white px-8 sm:px-10 py-4 text-base font-semibold shadow-[0_20px_60px_rgba(15,26,43,0.06)]"
          : "bg-transparent text-[var(--navy)] border border-[var(--navy)] hover:bg-[var(--paper)] px-7 sm:px-9 py-4 text-base font-semibold"
      } ${className}`}
    >
      {/* Circular Wipe from Cursor Position on Primary Hover (Dark Midnight fill, label stays white) */}
      {isPrimary && (
        <span
          className="absolute inset-0 pointer-events-none rounded-full transition-transform duration-500 ease-out"
          style={{
            background: "var(--midnight)",
            transform: isHovered ? "scale(2.2)" : "scale(0)",
            transformOrigin: `${wipePos.x}px ${wipePos.y}px`,
          }}
        />
      )}

      {/* Button Label Text: Full Opacity White for Primary, Full Opacity Navy for Ghost, >= 16px */}
      <span
        className={`relative z-10 font-semibold text-base tracking-tight whitespace-nowrap opacity-100 ${
          isPrimary ? "text-white" : "text-[var(--navy)]"
        }`}
      >
        {children}
      </span>

      {showArrow && (
        <ArrowLeft
          className={`relative z-10 w-4 h-4 transition-transform duration-300 shrink-0 opacity-100 ${
            isPrimary ? "text-white" : "text-[var(--navy)]"
          } group-hover:-translate-x-1.5`}
        />
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
    <button type="button" onClick={onClick} className="inline-block bg-transparent border-0 p-0 focus:outline-hidden">
      {content}
    </button>
  );
}
