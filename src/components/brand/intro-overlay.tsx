"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BawsalaCompass } from "./bawsala-compass";

const WORDMARK_LETTERS = ["B", "A", "W", "S", "A", "L", "A"];

interface IntroOverlayProps {
  onIntroComplete?: () => void;
  /** Force play even if already seen in current session (e.g. for testing / styleguide) */
  forcePlay?: boolean;
}

/**
 * Opening Intro Animation (plays once per session, stored in sessionStorage, skippable):
 * - Full-screen cream screen (#F3EFE7).
 * - 0.0-1.0s: "BAWSALA" rises from behind mask line, letter by letter with soft blur-to-sharp in navy ink.
 * - 1.0-2.2s: Navy thin-line compass appears beside it and spins smoothly, needle overshoots and settles with a spring.
 * - 2.2-3.0s: Logo flies (shared-element) into the navbar while cream screen fades away.
 * - Total duration: ~3.0s (under 3.5 seconds).
 * - Skippable with clean "تخطي" button.
 */
export function IntroOverlay({
  onIntroComplete,
  forcePlay = false,
}: IntroOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<"initial" | "letters" | "compass" | "settle" | "travel" | "done">("initial");
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
    setMounted(true);

    if (reducedQuery.matches) {
      const t1 = setTimeout(() => finishIntro(), 800);
      return () => clearTimeout(t1);
    }

    // Sequence Timetable (Total < 3.2s)
    // 0.0s: Stage 'letters' - letters emerge from behind mask line
    setStage("letters");

    // 0.9s: Stage 'compass' - compass appears, spins, needle springs
    const tCompass = setTimeout(() => {
      setStage("compass");
    }, 900);

    // 1.9s: Stage 'settle' - needle locks into place
    const tSettle = setTimeout(() => {
      setStage("settle");
    }, 1900);

    // 2.3s: Stage 'travel' - logo flies into navbar and screen fades away
    const tTravel = setTimeout(() => {
      setStage("travel");
    }, 2300);

    // 3.1s: Done
    const tDone = setTimeout(() => {
      finishIntro();
    }, 3100);

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
    };
  }, [finishIntro, forcePlay, handleSkip, onIntroComplete]);

  if (!mounted || stage === "done") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="intro-backdrop"
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === "travel" ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
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
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-[var(--dusty-blue)] bg-[var(--paper)] hover:bg-[var(--cream)] border border-[var(--mist)] hover:text-[var(--navy)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] transition-all cursor-pointer"
          >
            <span>تخطي</span>
            <span className="text-[10px] opacity-60">Esc</span>
          </button>
        </div>

        {/* Center Lockup Container with Travel (FLIP) Animation */}
        <motion.div
          animate={
            stage === "travel"
              ? {
                  y: -window.innerHeight * 0.42,
                  x: window.innerWidth > 640 ? window.innerWidth * 0.38 : 0,
                  scale: 0.52,
                  opacity: 0,
                }
              : {
                  y: 0,
                  x: 0,
                  scale: 1,
                  opacity: 1,
                }
          }
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative flex items-center justify-center gap-6"
        >
          {/* Compass Unit (Fades in beside the wordmark and spins) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              stage !== "initial" && stage !== "letters"
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.8 }
            }
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex items-center justify-center text-[var(--navy)]"
          >
            <motion.div
              animate={
                stage === "compass" || stage === "settle" || stage === "travel"
                  ? { rotate: [-240, 0] }
                  : { rotate: -240 }
              }
              transition={{
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <BawsalaCompass
                size={68}
                needleRotation={stage === "compass" ? 42 : 15}
              />
            </motion.div>
          </motion.div>

          {/* Wordmark "BAWSALA" with Mask Line & Staggered Letter Rise */}
          <div className="overflow-hidden py-2 px-1">
            <motion.div
              initial={{ letterSpacing: "0.55em" }}
              animate={{
                letterSpacing:
                  stage !== "initial" && stage !== "letters" ? "0.35em" : "0.45em",
              }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center"
            >
              {WORDMARK_LETTERS.map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ y: 50, opacity: 0, filter: "blur(8px)" }}
                  animate={
                    stage !== "initial"
                      ? { y: 0, opacity: 1, filter: "blur(0px)" }
                      : { y: 50, opacity: 0, filter: "blur(8px)" }
                  }
                  transition={{
                    duration: 0.7,
                    delay: index * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="wordmark-latin text-3xl sm:text-4xl lg:text-5xl font-light text-[var(--navy)] leading-none select-none inline-block"
                >
                  {letter}
                </motion.span>
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
  return <BawsalaCompass size={size} className={className} />;
}
