"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X } from "lucide-react";

export type SheetSnapPoint = "peek" | "half" | "full";

interface GlassSheetProps {
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
  variant = "light",
}: GlassSheetProps) {
  const [currentSnap, setCurrentSnap] = useState<SheetSnapPoint>(initialSnap);

  useEffect(() => {
    if (isOpen) {
      setCurrentSnap(initialSnap);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialSnap]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const deltaY = info.offset.y;
    const velocityY = info.velocity.y;

    if (deltaY > 160 || velocityY > 500) {
      if (currentSnap === "peek") {
        onClose();
      } else if (currentSnap === "half") {
        setCurrentSnap("peek");
      } else {
        setCurrentSnap("half");
      }
    } else if (deltaY < -80 || velocityY < -400) {
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
          {/* Backdrop with Soft Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 cursor-pointer backdrop-blur-md ${
              isLight ? "bg-[#130F08]/40" : "bg-[#130F08]/85"
            }`}
          />

          {/* Glass Bottom Sheet with 3 Snap Points */}
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
            className={`relative w-full max-w-lg rounded-t-[32px] overflow-hidden flex flex-col z-10 transition-[height] duration-300 ${
              isLight
                ? "bg-[#FAF6EF]/95 backdrop-blur-2xl border-t border-x border-[#E9DFD0] shadow-[0_-20px_60px_rgba(19,15,8,0.15)] text-[#130F08]"
                : "glass-dark border-t border-x border-white/20 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] text-[#FAF6EF]"
            } ${className}`}
          >
            {/* Grabber Handle & Snap Indicators */}
            <div className="pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing w-full shrink-0">
              <div
                className={`w-12 h-1.5 rounded-full transition-colors ${
                  isLight ? "bg-[#E9DFD0] hover:bg-[#130F08]/30" : "bg-white/30 hover:bg-white/50"
                }`}
              />

              {/* Mini Snap Points Selector */}
              <div className="flex items-center gap-1.5 mt-2">
                {(["peek", "half", "full"] as SheetSnapPoint[]).map((snap) => (
                  <button
                    key={snap}
                    type="button"
                    onClick={() => setCurrentSnap(snap)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      currentSnap === snap
                        ? isLight ? "w-6 bg-[#130F08]" : "w-6 bg-[#FAF6EF]"
                        : isLight ? "w-2 bg-[#E9DFD0]" : "w-2 bg-white/30"
                    }`}
                    title={`تبديل إلى ${snap === "peek" ? "38%" : snap === "half" ? "62%" : "92%"}`}
                  />
                ))}
              </div>
            </div>

            {/* Header */}
            {(title || subtitle) && (
              <div
                className={`px-6 pb-3 pt-1 flex items-center justify-between border-b shrink-0 ${
                  isLight ? "border-[#E9DFD0]" : "border-white/10"
                }`}
              >
                <div>
                  {title && (
                    <h3 className={`text-base font-semibold ${isLight ? "text-[#130F08]" : "text-[#FAF6EF]"}`}>
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className={`text-xs mt-0.5 ${isLight ? "text-[#130F08]/80" : "text-[#FAF6EF]/80"}`}>
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isLight
                      ? "glass-light border border-[#130F08]/10 text-[#130F08] hover:bg-[#E9DFD0]/60"
                      : "glass-dark border border-white/20 text-[#FAF6EF] hover:bg-white/10"
                  }`}
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Scrollable Content Body with Stagger Animation */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className={`flex-1 p-6 overflow-y-auto space-y-4 text-xs md:text-sm ${
                isLight ? "text-[#130F08]" : "text-[#FAF6EF]/90"
              }`}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
