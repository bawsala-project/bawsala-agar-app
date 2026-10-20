"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CompassLoader, CompassLoaderState } from "./compass-loader";
import { staggerContainerVariants, scrollRevealVariants } from "@/lib/motion";

interface AnalysisLoadingOverlayProps {
  /** Whether analysis is currently in progress */
  isLoading: boolean;
  /** Callback fired after locking animation completes and overlay dissolves */
  onFinished?: () => void;
  /** Genuine result components to reveal once loading completes */
  children?: React.ReactNode;
  /** Custom status messages */
  messages?: string[];
  /** Allow manual simulation trigger for testing */
  allowSimulateComplete?: boolean;
}

/**
 * AnalysisLoadingOverlay: Cream overlay at 92% opacity.
 * Used while the real-estate decision / analysis is processing.
 * - CompassLoader centered at the top.
 * - Soft mist shimmer skeleton cards preparing below on paper cards.
 * - When done, loader enters "locking" state (spring snap), then results rise in with staggered reveals.
 */
export function AnalysisLoadingOverlay({
  isLoading,
  onFinished,
  children,
  messages,
  allowSimulateComplete = false,
}: AnalysisLoadingOverlayProps) {
  const [internalState, setInternalState] = useState<CompassLoaderState>("searching");
  const [overlayVisible, setOverlayVisible] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setOverlayVisible(true);
      setInternalState("searching");
    } else if (overlayVisible && internalState === "searching") {
      setInternalState("locking");
    }
  }, [isLoading, overlayVisible, internalState]);

  const handleLockingComplete = () => {
    setOverlayVisible(false);
    if (onFinished) {
      onFinished();
    }
  };

  const simulateComplete = () => {
    setInternalState("locking");
  };

  return (
    <div className="relative w-full min-h-[500px]">
      {/* Loading Overlay */}
      <AnimatePresence>
        {overlayVisible && (
          <motion.div
            key="analysis-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-16 sm:pt-20 px-4 bg-[rgba(243,239,231,0.92)] text-[var(--navy)] overflow-y-auto"
          >
            {/* Top-Center Compass Loader */}
            <div className="mb-10 relative z-20">
              <CompassLoader
                size={72}
                state={internalState}
                messages={messages}
                targetAngle={15}
                onComplete={handleLockingComplete}
              />

              {/* Optional Simulation Button for testing in UI */}
              {allowSimulateComplete && internalState === "searching" && (
                <div className="mt-4 text-center">
                  <button
                    onClick={simulateComplete}
                    className="text-[11px] py-1 px-3.5 rounded-full border border-[var(--mist)] text-[var(--navy)] bg-[var(--paper)] hover:bg-[var(--cream)] shadow-xs transition-all cursor-pointer font-medium"
                  >
                    <span>محاكاة اكتمال تحليل الملاءمة</span>
                  </button>
                </div>
              )}
            </div>

            {/* Subtly Shimmering Skeleton Cards (Soft Mist Shimmer) */}
            <div className="w-full max-w-5xl mx-auto space-y-6 pb-16 opacity-85">
              <div className="flex items-center justify-between px-2">
                <div className="h-3.5 w-44 rounded bg-[var(--mist)]/30 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-[rgba(189,196,212,0.4)] to-transparent" />
                </div>
                <div className="h-3.5 w-28 rounded bg-[var(--mist)]/25" />
              </div>

              {/* 3 Shimmering Skeleton Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((cardIdx) => (
                  <div
                    key={cardIdx}
                    className="rounded-[28px] p-6 space-y-5 relative overflow-hidden border border-[var(--mist)] bg-[var(--paper)] shadow-[0_20px_60px_rgba(15,26,43,0.06)]"
                  >
                    {/* Soft Mist Shimmer Sweeper */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-[rgba(189,196,212,0.3)] to-transparent pointer-events-none" />

                    {/* Card Header Skeleton */}
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-32 rounded bg-[var(--mist)]/35" />
                      <div className="h-5 w-16 rounded-full bg-[var(--mist)]/25" />
                    </div>

                    {/* Metric Placeholder */}
                    <div className="space-y-2 py-2">
                      <div className="h-7 w-24 rounded bg-[var(--mist)]/30" />
                      <div className="h-3 w-40 rounded bg-[var(--mist)]/20" />
                    </div>

                    {/* Content Lines */}
                    <div className="space-y-2 pt-3 border-t border-[var(--mist)]">
                      <div className="h-2.5 w-full rounded bg-[var(--mist)]/25" />
                      <div className="h-2.5 w-5/6 rounded bg-[var(--mist)]/20" />
                      <div className="h-2.5 w-4/6 rounded bg-[var(--mist)]/20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Genuine Results (Rise In With Staggered Reveals Once Loader Locks and Dissolves) */}
      {!overlayVisible && children && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainerVariants(0.12, 0.1)}
          className="w-full space-y-6"
        >
          {React.Children.map(children, (child, idx) => (
            <motion.div key={idx} variants={scrollRevealVariants}>
              {child}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
