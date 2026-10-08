"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X } from "lucide-react";

export type SheetSnapPoint = "peek" | "half" | "full";

export interface GlassSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  initialSnap?: SheetSnapPoint;
  children?: React.ReactNode;
  className?: string;
  variant?: "light" | "dark";
}

const SNAP_HEIGHTS: Record<SheetSnapPoint, string> = {
  peek: "38vh",
  half: "62vh",
  full: "92vh",
};

export function GlassSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  initialSnap = "half",
  children,
  className = "",
  variant = "dark",
}: GlassSheetProps) {
  const [currentSnap, setCurrentSnap] = useState<SheetSnapPoint>(initialSnap);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const deltaY = info.offset.y;
    const velocityY = info.velocity.y;

    if (deltaY > 140 || velocityY > 400) {
      if (currentSnap === "peek") {
        onClose();
      } else if (currentSnap === "half") {
        setCurrentSnap("peek");
      } else {
        setCurrentSnap("half");
      }
    } else if (deltaY < -60 || velocityY < -300) {
      if (currentSnap === "peek") {
        setCurrentSnap("half");
      } else if (currentSnap === "half") {
        setCurrentSnap("full");
      }
    }
  };

  const isLight = variant === "light";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl">
          {/* Backdrop with Soft Blur and Espresso Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 cursor-pointer backdrop-blur-md bg-espresso/70"
          />

          {/* Glass Bottom Sheet with snaps 38 / 62 / 92% */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0, height: SNAP_HEIGHTS[currentSnap] }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 32,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            className={`relative w-full max-w-lg rounded-t-[32px] overflow-hidden flex flex-col z-10 transition-[height] duration-300 border-t border-x border-stroke shadow-2xl ${
              isLight ? "bg-surface-2 text-sandstone" : "bawsala-glass-dark text-sandstone"
            } ${className}`}
          >
            {/* Grabber Handle & Snap Indicators */}
            <div className="pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing w-full shrink-0">
              {/* 36x4 handle sandstone at 40% */}
              <div className="w-[36px] h-[4px] rounded-full bg-sandstone/40" />

              {/* Snap Points Selector (38% / 62% / 92%) */}
              <div className="flex items-center gap-2 mt-2.5">
                {(["peek", "half", "full"] as SheetSnapPoint[]).map((snap) => {
                  const isActive = currentSnap === snap;
                  const label = snap === "peek" ? "38%" : snap === "half" ? "62%" : "92%";
                  return (
                    <button
                      key={snap}
                      type="button"
                      onClick={() => setCurrentSnap(snap)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        isActive ? "w-6 bg-sandstone" : "w-2 bg-driftwood/40 hover:bg-driftwood/60"
                      }`}
                      title={`تبديل إلى ${label}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Header */}
            {(title || subtitle) && (
              <div className="px-6 pb-3 pt-1 flex items-center justify-between border-b border-stroke shrink-0">
                <div>
                  {title && (
                    <h3 className="text-[17px] font-semibold text-ink leading-snug">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-[13px] text-muted mt-0.5 leading-tight">
                      {subtitle}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bawsala-glass border border-stroke flex items-center justify-center text-sandstone hover:brightness-110 cursor-pointer transition-transform active:scale-95"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 text-[14px] leading-relaxed text-sandstone/90 scrollbar-none">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
