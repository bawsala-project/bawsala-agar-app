"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BawsalaCompass } from "@/components/brand/bawsala-compass";

export interface CompassPageTransitionProps {
  children?: React.ReactNode;
  triggerKey?: string | number;
  onComplete?: () => void;
  showDemoTrigger?: boolean;
}

/**
 * CompassPageTransition: Cream curtain sweeps up with the compass needle spinning once, under 700ms.
 */
export function CompassPageTransition({
  children,
  triggerKey,
  onComplete,
  showDemoTrigger = false,
}: CompassPageTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (triggerKey !== undefined) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        onComplete?.();
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [triggerKey, onComplete]);

  const triggerTransitionManually = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
      onComplete?.();
    }, 650);
  };

  return (
    <>
      {showDemoTrigger && (
        <button
          type="button"
          onClick={triggerTransitionManually}
          className="text-xs py-2 px-4 rounded-full border border-[var(--mist)] bg-[var(--paper)] text-[var(--navy)] hover:bg-[var(--cream)] inline-flex items-center gap-2 cursor-pointer"
        >
          <span>تشغيل انتقال الصفحة</span>
        </button>
      )}

      {children}

      {/* Cream Curtain Sweep (< 700ms) */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="page-curtain"
            initial={{ y: "-100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{
              duration: 0.62,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="fixed inset-0 z-[9999] bg-[var(--cream)] border-b border-[var(--mist)] flex flex-col items-center justify-center pointer-events-none select-none text-[var(--navy)]"
          >
            {/* Center Spinning Compass */}
            <div className="relative flex flex-col items-center space-y-3">
              <motion.div
                initial={{ rotate: 0, scale: 0.9 }}
                animate={{
                  rotate: 360,
                  scale: 1,
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-20 h-20 flex items-center justify-center text-[var(--navy)]"
              >
                <BawsalaCompass size={64} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                dir="ltr"
                lang="en"
                style={{ direction: "ltr", unicodeBidi: "isolate" }}
                aria-label="BAWSALA"
                className="font-wordmark font-normal text-xs tracking-[0.25em] text-[var(--navy)] uppercase"
              >
                <span aria-hidden="true">BAWSALA</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
