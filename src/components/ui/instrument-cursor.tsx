"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export function InstrumentCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth springs for cursor trailing
  const springConfig = { damping: 24, stiffness: 320, mass: 0.2 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only run on desktop with pointer
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = Boolean(
          target.closest("button, a, input, select, textarea, [role='button'], [tabindex='0'], .interactive-element")
        );
        setIsInteractive(interactive);
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [cursorX, cursorY, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="hidden lg:block fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      <motion.div
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="relative flex items-center justify-center pointer-events-none"
      >
        {isInteractive ? (
          // INTERACTIVE STATE: Small Precision Navy Needle
          <motion.div
            initial={{ scale: 0.6, rotate: 0 }}
            animate={{ scale: 1, rotate: 45 }}
            transition={{ type: "spring", stiffness: 450, damping: 24 }}
            className="w-5 h-5 flex items-center justify-center text-[var(--navy)]"
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-full h-full">
              <polygon points="10,1 13,10 10,19" fill="currentColor" opacity="0.95" />
              <polygon points="10,1 7,10 10,19" fill="currentColor" opacity="0.35" />
              <circle cx="10" cy="10" r="1.6" fill="var(--cream)" />
            </svg>
          </motion.div>
        ) : (
          // DEFAULT STATE: Small Navy Ring
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-5 rounded-full border border-[var(--navy)]/50 flex items-center justify-center"
          >
            {/* Center Crosshair Dot */}
            <div className="w-1 h-1 rounded-full bg-[var(--navy)]" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
