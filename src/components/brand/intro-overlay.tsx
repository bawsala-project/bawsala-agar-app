"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BawsalaCompass } from "./bawsala-compass";

const ARABIC_WORDS = ["بوصلة", "العقار"];

interface IntroOverlayProps {
  onIntroComplete?: () => void;
  /** Force play even if already seen (kept for backwards compatibility) */
  forcePlay?: boolean;
}

/**
 * Brand Splash Screen (plays on every website refresh via RootLayout):
 * - Full-screen editorial cream canvas (#F3EFE7) with Navy ink (#0F1A2B).
 * - 0.0s - 0.9s: Animated Horological Compass spins & calibrates while "بوصلة العقار"
 *   rises word-by-word from behind a mask line with soft blur-to-sharp reveal.
 * - 0.9s - 1.7s: Compass needle overshoots and settles at 15° with a spring;
 *   hairline divider expands to reveal the brand tagline.
 * - 1.7s - 2.3s: Smooth editorial curtain fade-out into the active page.
 */
export function IntroOverlay({ onIntroComplete }: IntroOverlayProps) {
  const [mounted, setMounted] = useState(true);
  const [stage, setStage] = useState<
    "enter" | "calibrate" | "settle" | "exit" | "done"
  >("enter");
  const hasFinishedRef = useRef(false);

  const finishIntro = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    setStage("done");
    if (onIntroComplete) {
      onIntroComplete();
    }
    setTimeout(() => {
      setMounted(false);
    }, 150);
  }, [onIntroComplete]);

  const handleSkip = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      finishIntro();
    },
    [finishIntro]
  );

  useEffect(() => {
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedQuery.matches) {
      const t1 = setTimeout(() => finishIntro(), 600);
      return () => clearTimeout(t1);
    }

    // 0.15s: Compass calibrates & Arabic wordmark rises
    const tCalibrate = setTimeout(() => {
      setStage("calibrate");
    }, 150);

    // 1.05s: Needle locks in & tagline reveals
    const tSettle = setTimeout(() => {
      setStage("settle");
    }, 1050);

    // 1.85s: Smooth editorial fade out
    const tExit = setTimeout(() => {
      setStage("exit");
    }, 1850);

    // 2.4s: Unmount overlay
    const tDone = setTimeout(() => {
      finishIntro();
    }, 2400);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(tCalibrate);
      clearTimeout(tSettle);
      clearTimeout(tExit);
      clearTimeout(tDone);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [finishIntro, handleSkip]);

  if (!mounted || stage === "done") {
    return null;
  }

  const isNeedleSettled = stage === "settle" || stage === "exit";

  return (
    <AnimatePresence>
      <motion.div
        key="bawsala-splash"
        dir="rtl"
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === "exit" ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => handleSkip()}
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--cream)] text-[var(--navy)] select-none cursor-pointer overflow-hidden ${
          stage === "exit" ? "pointer-events-none" : "pointer-events-auto"
        }`}
        aria-label="شاشة البداية - بوصلة العقار"
        role="button"
        tabIndex={0}
      >
        {/* Subtle radial architectural halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 46%, rgba(15, 26, 43, 0.05) 0%, rgba(15, 26, 43, 0.015) 38%, transparent 68%)",
          }}
        />

        {/* Center Brand Lockup */}
        <motion.div
          animate={
            stage === "exit"
              ? { y: -14, scale: 0.97, opacity: 0 }
              : { y: 0, scale: 1, opacity: 1 }
          }
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center text-center px-6"
        >
          {/* 1. Animated Horological Compass with Expanding Ring Pulse */}
          <div className="relative mb-6 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{
                scale: isNeedleSettled ? 1.35 : 1.05,
                opacity: isNeedleSettled ? 0 : 0.25,
              }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute w-24 h-24 rounded-full border border-[var(--navy)] pointer-events-none"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.78, rotate: -160 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
              }}
              transition={{
                duration: 1.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-[var(--navy)]"
            >
              <BawsalaCompass
                size={76}
                dialRotation={stage === "enter" ? -90 : 0}
                needleRotation={
                  stage === "enter" ? -45 : stage === "calibrate" ? 38 : 15
                }
              />
            </motion.div>
          </div>

          {/* 2. Arabic Brand Name "بوصلة العقار" — Word-by-Word Masked Rise */}
          <div className="overflow-hidden py-1.5 px-2">
            <h1 className="flex items-center justify-center gap-3 sm:gap-4 font-display font-bold text-4xl sm:text-5xl md:text-6xl text-[var(--navy)] tracking-normal leading-tight">
              {ARABIC_WORDS.map((word, idx) => (
                <motion.span
                  key={word}
                  initial={{ y: 42, opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.75,
                    delay: 0.1 + idx * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              ))}
            </h1>
          </div>

          {/* 3. Expanding Architectural Hairline & Diamond */}
          <div className="w-48 sm:w-60 my-3.5 flex items-center justify-center gap-2.5">
            <motion.span
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: stage !== "enter" ? 1 : 0,
                opacity: stage !== "enter" ? 0.45 : 0,
              }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 h-[1px] bg-[var(--navy)] origin-left"
            />
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: stage !== "enter" ? 1 : 0,
                opacity: stage !== "enter" ? 0.7 : 0,
              }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="w-1.5 h-1.5 rotate-45 bg-[var(--navy)]"
            />
            <motion.span
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: stage !== "enter" ? 1 : 0,
                opacity: stage !== "enter" ? 0.45 : 0,
              }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 h-[1px] bg-[var(--navy)] origin-right"
            />
          </div>

          {/* 4. Editorial Subtitle & Correct LTR Sub-mark */}
          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{
              y: stage !== "enter" ? 0 : 12,
              opacity: stage !== "enter" ? 1 : 0,
            }}
            transition={{ duration: 0.65, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="text-xs sm:text-sm font-medium text-[var(--dusty-blue)]"
          >
            مساعدك الذكي المستقل لقرار شراء شقتك
          </motion.p>

          <motion.span
            dir="ltr"
            initial={{ opacity: 0 }}
            animate={{ opacity: isNeedleSettled ? 0.45 : 0 }}
            transition={{ duration: 0.5 }}
            className="mt-2.5 text-[10px] font-wordmark uppercase tracking-[0.42em] text-[var(--navy)]"
          >
            BAWSALA
          </motion.span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function InlineCompass({
  size = 48,
  className = "",
}: {
  size?: number;
  className?: string;
  stage?: string;
  isReducedMotion?: boolean;
}) {
  return <BawsalaCompass size={size} className={className} />;
}
