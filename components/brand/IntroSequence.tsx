"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { CompassIcon } from "./CompassIcon";
import { Wordmark } from "./Wordmark";
import { Headline } from "@/components/ui/Headline";
import { ActionBar } from "@/components/ui/ActionBar";
import { PhoneStatusBar } from "@/components/shell/PhoneStatusBar";

export function IntroSequence() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // Animation timeline phases:
  // 0: Initial espresso screen
  // 1: Background blur-to-sharp & fade in (0-900ms)
  // 2: Circle glass button appears (700-1300ms)
  // 3: Needle spin (1200-2800ms)
  // 4: Panel morphs to pill and Wordmark reveals (2500-3700ms)
  // 5: Lockup glides up to upper third, headline and action bar fade in (3800-4300ms)
  // 6: Idle / Ready state
  const [phase, setPhase] = useState<number>(0);
  const [isSkipped, setIsSkipped] = useState<boolean>(false);
  const [isEmbedded, setIsEmbedded] = useState<boolean>(false);

  // Replay Intro Handler
  const replayIntro = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("bawsala_intro_seen");
    }
    setIsSkipped(false);
    setPhase(0);
  }, []);

  // Check ?embed=1 and sessionStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("embed") === "1") {
          setIsEmbedded(true);
        }
        const hasSeenIntro = sessionStorage.getItem("bawsala_intro_seen");
        if (hasSeenIntro && !shouldReduceMotion) {
          setIsSkipped(true);
          setPhase(6);
        } else {
          setPhase(1);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  // Dev keyboard shortcut 'R' to replay intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          replayIntro();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [replayIntro]);

  // Master timeline orchestration
  useEffect(() => {
    if (isSkipped || shouldReduceMotion) {
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // Phase 2: Circle glass button appears (700ms)
    timers.push(
      setTimeout(() => {
        setPhase(2);
      }, 700)
    );

    // Phase 3: Needle spins (1200ms)
    timers.push(
      setTimeout(() => {
        setPhase(3);
      }, 1200)
    );

    // Phase 4: Panel morphs and Wordmark slides out (2500ms)
    timers.push(
      setTimeout(() => {
        setPhase(4);
      }, 2500)
    );

    // Phase 5: Lockup glides up to upper third, headline fades in (3800ms)
    timers.push(
      setTimeout(() => {
        setPhase(5);
      }, 3800)
    );

    // Phase 6: Enter idle state
    timers.push(
      setTimeout(() => {
        setPhase(6);
        sessionStorage.setItem("bawsala_intro_seen", "true");
      }, 4300)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isSkipped, shouldReduceMotion]);

  const isCircle = phase < 4 && !isSkipped;
  const isGlidedUp = phase >= 5 || isSkipped;
  const isIdle = phase >= 6 || isSkipped;

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-espresso flex flex-col justify-between items-center selection:bg-sandstone/20 select-none">
      {/* iOS Status Bar Overlay (only visible in embed=1 inside phone mockup) */}
      {isEmbedded && <PhoneStatusBar />}

      {/* 1. Full-Bleed Background Moody Photo with Photo Grade and Espresso Scrims */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        initial={
          isSkipped || shouldReduceMotion
            ? { opacity: 1, filter: "blur(0px)" }
            : { opacity: 0, filter: "blur(16px)" }
        }
        animate={{
          opacity: 1,
          filter: "blur(0px)",
        }}
        transition={{
          duration: isSkipped ? 0.4 : 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src="/images/hero-home.jpg"
            alt="Moody architectural home"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center photo-grade"
          />
        </div>

        {/* Top Espresso Scrim Gradient over 28% of height for status bar legibility */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none h-[28%] scrim-warm-header"
          aria-hidden="true"
        />

        {/* Bottom Espresso Scrim Gradient over lower 45% for headline & action bar contrast */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none h-[45%] scrim-warm"
          aria-hidden="true"
        />
      </motion.div>

      {/* Main Container Area with Glide-up Glass Lockup */}
      <div className="relative z-20 w-full flex-1 flex flex-col items-center justify-center max-w-md px-5 pt-[calc(20px+var(--safe-top))]">
        {/* The Glass Lockup Container
            - Center during intro
            - Glides up to upper third when intro completes */}
        <motion.div
          animate={{
            y: isGlidedUp ? -110 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 110,
            damping: 18,
          }}
          className="relative flex items-center justify-center my-auto transition-transform"
        >
          {/* Glass Shape (Circle -> Driftwood Glass Pill Panel) */}
          <motion.div
            layout
            initial={
              isSkipped || shouldReduceMotion
                ? {
                    opacity: 1,
                    scale: 1,
                    width: 326,
                    height: 80,
                    borderRadius: 40,
                  }
                : {
                    opacity: 0,
                    scale: 0.85,
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                  }
            }
            animate={{
              opacity: phase >= 2 || isSkipped ? 1 : 0,
              scale: phase >= 2 || isSkipped ? 1 : 0.85,
              width: isCircle ? 96 : 326,
              height: isCircle ? 96 : 80,
              borderRadius: isCircle ? 48 : 40,
            }}
            transition={{
              duration: isSkipped ? 0.35 : isCircle ? 0.6 : 1.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`flex items-center overflow-hidden transition-shadow text-sandstone bawsala-glass ${
              isIdle ? "animate-glass-sweep" : ""
            } ${isCircle ? "justify-center p-0" : "justify-start px-5 gap-3"}`}
            dir="ltr"
          >
            {/* Compass Icon Button: currentColor = sandstone */}
            <div className="relative z-20 flex items-center justify-center shrink-0 text-sandstone">
              <CompassIcon
                size={isCircle ? 62 : 54}
                isSpinning={phase >= 3 && !isIdle}
                isIdle={isIdle}
                needleAngle={25}
              />
            </div>

            {/* Wordmark "BAWSALA" reveals from behind compass */}
            <AnimatePresence>
              {(!isCircle || isSkipped) && (
                <motion.div
                  initial={
                    isSkipped || shouldReduceMotion
                      ? { opacity: 1, x: 0, clipPath: "inset(0% 0% 0% 0%)" }
                      : {
                          opacity: 0,
                          x: -45,
                          clipPath: "inset(0% 100% 0% 0%)",
                        }
                  }
                  animate={{
                    opacity: 1,
                    x: 0,
                    clipPath: "inset(0% 0% 0% 0%)",
                  }}
                  transition={{
                    duration: isSkipped ? 0.3 : 1.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative z-10 flex items-center overflow-hidden pr-2 text-sandstone"
                >
                  <Wordmark
                    width={185}
                    height={30}
                    useTextFallback={false}
                    className="text-sandstone"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      {/* End State Content: Huge Light Headline & ActionBar */}
      <AnimatePresence>
        {isGlidedUp && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: isSkipped ? 0 : 0.1,
            }}
            className="relative z-30 w-full max-w-md px-5 pb-[calc(100px+var(--safe-bottom))] flex flex-col items-start text-right"
            dir="rtl"
          >
            {/* Huge Light Headline: "قرارك العقاري،" and "[p1-living capsule] بوضوح" */}
            <Headline
              beforeText="قرارك العقاري،"
              capsuleImage="/images/p1-living.jpg"
              capsuleAlt="صالة شقة الياسمين الفاخرة"
              afterText="بوضوح"
              className="text-right"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ActionBar pinned at bottom: Single full-width primary pill "ابدأ الآن" with circular arrow chip */}
      <ActionBar
        primaryLabel="ابدأ الآن"
        onPrimaryAction={() => router.push("/start")}
        primaryVariant="sandstone"
        pinned={true}
      />
    </div>
  );
}
