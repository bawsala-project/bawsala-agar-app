"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BawsalaCompass } from "./bawsala-compass";

const WORDMARK_LETTERS = ["B", "A", "W", "S", "A", "L", "A"] as const;

interface IntroOverlayProps {
  onIntroComplete?: () => void;
  /** Force play even if already seen in current session (e.g. for testing / styleguide) */
  forcePlay?: boolean;
}

/**
 * Opening Intro Animation (plays once per session, stored in sessionStorage, skippable):
 * - Full-screen cream screen (#F3EFE7).
 * - 0.0-1.1s: "BAWSALA" rises from behind mask line, letter by letter with blur 10px to 0,
 *   stagger 70ms, letter-spacing easing from 0.35em to 0.2em, in pure navy (#0F1A2B).
 * - 1.0-2.5s: Navy thin-line compass appears on the LEFT and spins smoothly (dial 360deg),
 *   needle swings, overshoots by ~25deg and settles at 20deg rest with spring (stiffness 90, damping 12).
 *   Soft ring pulse at settle moment (navy at 12% opacity).
 * - 2.5-3.4s: Shared-element FLIP into navbar logo position (compass-left, wordmark-right in LTR)
 *   and scales down while cream screen dissolves.
 * - Total duration: ~3.4s.
 * - Skippable with clean "تخطي" button.
 * - Respects prefers-reduced-motion with a simple 400ms fade of the finished lockup.
 */
export function IntroOverlay({
  onIntroComplete,
  forcePlay = false,
}: IntroOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<"initial" | "letters" | "compass" | "settle" | "travel" | "done">("initial");
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [travelTarget, setTravelTarget] = useState({ x: 380, y: -320, scale: 0.24 });
  const hasFinishedRef = useRef(false);

  const finishIntro = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    try {
      sessionStorage.setItem("bawsala_intro_seen", "true");
    } catch {
      // Ignore storage errors
    }

    setStage("done");
    if (onIntroComplete) {
      onIntroComplete();
    }
    setTimeout(() => {
      setMounted(false);
    }, 200);
  }, [onIntroComplete]);

  const handleSkip = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      finishIntro();
    },
    [finishIntro]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Calculate FLIP target position dynamically based on navbar logo in DOM
    const updateTarget = () => {
      const mobile = window.innerWidth <= 640;
      const navbarLogo = document.querySelector('nav a[href="/"]');
      if (navbarLogo) {
        const rect = navbarLogo.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = centerX - window.innerWidth / 2;
        const deltaY = centerY - window.innerHeight / 2;
        const scale = mobile ? 0.32 : 0.24;
        setTravelTarget({ x: deltaX, y: deltaY, scale });
      } else {
        // Precise mathematical fallback
        const isLarge = window.innerWidth > 1024;
        const navHalfWidth = isLarge ? 512 : window.innerWidth / 2;
        const targetX = navHalfWidth - (mobile ? 72 : 120);
        const targetY = -(window.innerHeight / 2 - (mobile ? 32 : 44));
        const scale = mobile ? 0.32 : 0.24;
        setTravelTarget({ x: targetX, y: targetY, scale });
      }
    };
    updateTarget();
    window.addEventListener("resize", updateTarget);

    if (!forcePlay) {
      try {
        const seen = sessionStorage.getItem("bawsala_intro_seen");
        if (seen === "true") {
          if (onIntroComplete) onIntroComplete();
          return;
        }
      } catch {
        // Fallback
      }
    }

    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedQuery.matches) {
      setIsReducedMotion(true);
      setMounted(true);
      setStage("settle");
      const t1 = setTimeout(() => finishIntro(), 1200);
      return () => {
        clearTimeout(t1);
        window.removeEventListener("resize", checkMobile);
        window.removeEventListener("resize", updateTarget);
      };
    }

    setMounted(true);

    // Timeline Sequence (Total ~3.4s)
    // 0.0s: Stage 'letters' - word BAWSALA emerges from behind mask
    setStage("letters");

    // 1.0s: Stage 'compass' - compass appears on LEFT, dial spins 360, needle swings
    const tCompass = setTimeout(() => {
      setStage("compass");
    }, 1000);

    // 2.0s: Stage 'settle' - needle springs to rest (20deg, stiffness 90, damping 12) + ring pulse
    const tSettle = setTimeout(() => {
      setStage("settle");
    }, 2000);

    // 2.5s: Stage 'travel' - shared-element FLIP into navbar position, cream screen dissolves
    const tTravel = setTimeout(() => {
      setStage("travel");
    }, 2500);

    // 3.4s: Done
    const tDone = setTimeout(() => {
      finishIntro();
    }, 3400);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(tCompass);
      clearTimeout(tSettle);
      clearTimeout(tTravel);
      clearTimeout(tDone);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("resize", updateTarget);
    };
  }, [finishIntro, forcePlay, handleSkip, onIntroComplete]);

  if (!mounted || stage === "done") {
    return null;
  }

  // Reduced motion alternative: simple 400ms fade of finished lockup
  if (isReducedMotion) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--cream)] text-[var(--navy)]"
        onClick={() => handleSkip()}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          dir="ltr"
          lang="en"
          style={{ direction: "ltr", unicodeBidi: "isolate" }}
          aria-label="BAWSALA"
          className="flex items-center justify-center gap-[48px] sm:gap-[67px] text-[var(--navy)]"
        >
          <BawsalaCompass
            size={isMobile ? 80 : 112}
            fullOpacity
            strokeWidth={1.5}
            needleRotation={20}
          />
          <span
            aria-hidden="true"
            className="font-wordmark font-normal uppercase text-[var(--navy)] text-[36px] sm:text-[56px] tracking-[0.2em] leading-none"
            style={{ letterSpacing: "0.2em" }}
          >
            BAWSALA
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        key="intro-backdrop"
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === "travel" ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => handleSkip()}
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-[var(--cream)] text-[var(--navy)] select-none cursor-pointer overflow-hidden ${
          stage === "travel" ? "pointer-events-none" : "pointer-events-auto"
        }`}
        aria-label="تخطي شاشة البداية"
        role="button"
        tabIndex={0}
      >
        {/* Skippable "تخطي" Button */}
        <div className="absolute top-6 left-6 z-30">
          <button
            onClick={handleSkip}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-[var(--dusty-blue)] bg-[var(--paper)] hover:bg-[var(--cream)] border border-[var(--mist)] hover:text-[var(--navy)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] transition-all cursor-pointer"
          >
            <span>تخطي</span>
            <span className="text-[10px] opacity-60 font-mono">Esc</span>
          </button>
        </div>

        {/* Center Lockup Container with FLIP Travel Animation */}
        <motion.div
          dir="ltr"
          lang="en"
          style={{ direction: "ltr", unicodeBidi: "isolate" }}
          aria-label="BAWSALA"
          animate={
            stage === "travel"
              ? {
                  x: travelTarget.x,
                  y: travelTarget.y,
                  scale: travelTarget.scale,
                  opacity: 0,
                }
              : {
                  x: 0,
                  y: 0,
                  scale: 1,
                  opacity: 1,
                }
          }
          transition={{
            duration: 0.85,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative flex items-center justify-center gap-[48px] sm:gap-[67px] text-[var(--navy)]"
        >
          {/* COMPASS ON THE LEFT (Fades in at 1.0s, scale 0.9->1, dial rotates 360, needle swings) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={
              stage === "initial" || stage === "letters"
                ? { opacity: 0, scale: 0.9 }
                : { opacity: 1, scale: 1 }
            }
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex items-center justify-center shrink-0 text-[var(--navy)]"
          >
            {/* Soft Ring Pulse at Settle Moment (~2.0s to 2.5s) */}
            {(stage === "settle" || stage === "travel") && (
              <motion.div
                key="settle-ring-pulse"
                initial={{ scale: 0.95, opacity: 0.12 }}
                animate={{ scale: 1.35, opacity: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 rounded-full border-[1.5px] border-[var(--navy)] pointer-events-none"
              />
            )}

            {/* Dial 360deg Rotation */}
            <motion.div
              animate={{
                rotate: stage === "compass" || stage === "settle" || stage === "travel" ? 360 : 0,
              }}
              transition={{
                duration: 1.4,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <BawsalaCompass
                size={isMobile ? 80 : 112}
                fullOpacity
                strokeWidth={1.5}
                needleRotation={stage === "compass" ? 45 : 20}
              />
            </motion.div>
          </motion.div>

          {/* WORDMARK "BAWSALA" ON THE RIGHT (Rises from behind mask line, letter by letter) */}
          <div className="overflow-hidden py-3 px-1">
            <motion.div
              dir="ltr"
              lang="en"
              style={{ direction: "ltr", unicodeBidi: "isolate" }}
              initial={{ letterSpacing: "0.35em" }}
              animate={{
                letterSpacing: stage !== "initial" && stage !== "letters" ? "0.2em" : "0.22em",
              }}
              transition={{
                duration: 1.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center"
            >
              {WORDMARK_LETTERS.map((letter, index) => (
                <span
                  key={index}
                  className="inline-block overflow-hidden py-3 px-0.5"
                  style={{ verticalAlign: "middle" }}
                >
                  <motion.span
                    initial={{ y: "115%", opacity: 0, filter: "blur(10px)" }}
                    animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.65,
                      delay: index * 0.07,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    aria-hidden="true"
                    className="inline-block font-wordmark uppercase font-normal text-[var(--navy)] text-[36px] sm:text-[56px] leading-none select-none"
                  >
                    {letter}
                  </motion.span>
                </span>
              ))}
            </motion.div>
          </div>
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
  return <BawsalaCompass size={size} fullOpacity className={className} />;
}
