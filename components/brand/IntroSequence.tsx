"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence, PanInfo, Variants } from "framer-motion";
import { CompassIcon } from "./CompassIcon";
import { Wordmark } from "./Wordmark";
import { OnboardingCTA } from "@/components/ui/OnboardingCTA";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { PhoneStatusBar } from "@/components/preview/PhoneStatusBar";
import { RotateCcw, Palette } from "lucide-react";

interface SlideData {
  id: number;
  headline: string;
  subtitle: string;
  bgZoom: number;
  bgX: number;
  bgY: number;
}

const ONBOARDING_SLIDES: SlideData[] = [
  {
    id: 1,
    headline: "قرارك العقاري، <em>بوضوح</em>",
    subtitle: "أضف حتى ٥ شقق، واعرف ما هو مؤكد وما يحتاج إلى تحقق، قبل أن تقرر.",
    bgZoom: 1.0,
    bgX: 0,
    bgY: 0,
  },
  {
    id: 2,
    headline: "أضف عقاراتك <em>بالرابط</em> أو الصورة",
    subtitle: "حلّل خياراتك فورياً بمجرد إدخال الروابط أو رفع المخططات والمستندات.",
    bgZoom: 1.04,
    bgX: -14,
    bgY: -8,
  },
  {
    id: 3,
    headline: "اعرف ما نعرفه، <em>وما نجهله</em>",
    subtitle: "شفافية مطلقة في كل معيار: نصنف لك البيانات بين المؤكدة والمحتاجة لمعاينة.",
    bgZoom: 1.02,
    bgX: 12,
    bgY: -12,
  },
];

const slideBlurVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 20 : -20,
    filter: "blur(12px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -20 : 20,
    filter: "blur(12px)",
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function IntroSequence() {
  const shouldReduceMotion = useReducedMotion();

  // Animation timeline phases:
  // 0: Initial espresso screen
  // 1: Background blur-to-sharp & fade in (0-900ms)
  // 2: Circle glass button appears (700-1300ms)
  // 3: Needle spin (1200-2800ms)
  // 4: Panel morphs to pill and Wordmark reveals (2500-3700ms)
  // 5: Lockup glides up 120px to upper third, onboarding content fades in (3800-4300ms)
  // 6: Idle state with 3-slide auto-advance
  const [phase, setPhase] = useState<number>(0);
  const [isSkipped, setIsSkipped] = useState<boolean>(false);
  const [isEmbedded, setIsEmbedded] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const goToSlide = useCallback((nextIdx: number, dir: number) => {
    setSlideDirection(dir);
    setCurrentSlide(nextIdx);
  }, []);

  // Replay Intro Handler
  const replayIntro = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("bawsala_intro_seen");
    }
    setIsSkipped(false);
    setSlideDirection(1);
    setCurrentSlide(0);
    setPhase(0);
  }, []);

  // Check ?embed=1 and sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("embed") === "1") {
        setIsEmbedded(true);
      }
    }
    const hasSeenIntro = sessionStorage.getItem("bawsala_intro_seen");
    if (hasSeenIntro && !shouldReduceMotion) {
      setIsSkipped(true);
      setPhase(6);
    } else {
      setPhase(1);
    }
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

  // Pointer parallax on desktop
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const { clientX, clientY, currentTarget } = e;
    const { width, height } = currentTarget.getBoundingClientRect();
    const xPct = (clientX / width - 0.5) * 14;
    const yPct = (clientY / height - 0.5) * 14;
    setMouseOffset({ x: xPct, y: yPct });
  };

  // Master timeline orchestration
  useEffect(() => {
    if (isSkipped || shouldReduceMotion) {
      setPhase(6);
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

    // Phase 5: Lockup glides up to upper third, content fades in (3800ms)
    timers.push(
      setTimeout(() => {
        setPhase(5);
      }, 3800)
    );

    // Phase 6: Enter idle loop, enable carousel (4300ms)
    timers.push(
      setTimeout(() => {
        setPhase(6);
        sessionStorage.setItem("bawsala_intro_seen", "true");
      }, 4300)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isSkipped, shouldReduceMotion, phase === 0]);

  // Auto-advance slides every 5 seconds (pause on touch/hover)
  useEffect(() => {
    if (phase < 5 || isPaused || shouldReduceMotion) {
      if (autoAdvanceTimerRef.current) {
        clearInterval(autoAdvanceTimerRef.current);
      }
      return;
    }

    autoAdvanceTimerRef.current = setInterval(() => {
      goToSlide((currentSlide + 1) % ONBOARDING_SLIDES.length, 1);
    }, 5000);

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearInterval(autoAdvanceTimerRef.current);
      }
    };
  }, [phase, isPaused, shouldReduceMotion, currentSlide, goToSlide]);

  // Handle Swipe Gesture
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 40;
    // In RTL: swipe left (info.offset.x < -threshold) advances to next slide
    // swipe right (info.offset.x > threshold) goes to previous slide
    if (info.offset.x < -threshold) {
      goToSlide((currentSlide + 1) % ONBOARDING_SLIDES.length, 1);
    } else if (info.offset.x > threshold) {
      goToSlide(currentSlide === 0 ? ONBOARDING_SLIDES.length - 1 : currentSlide - 1, -1);
    }
  };

  const isCircle = phase < 4 && !isSkipped;
  const isGlidedUp = phase >= 5 || isSkipped;
  const isIdle = phase >= 6 || isSkipped;

  const activeSlideData = ONBOARDING_SLIDES[currentSlide];

  return (
    <div
      onPointerMove={handlePointerMove}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-full min-h-screen overflow-hidden bg-[#130F08] flex flex-col justify-between items-center selection:bg-[#F2EBE2]/20 select-none"
    >
      {/* iOS Status Bar Overlay (only visible in embed=1 inside phone mockup) */}
      {isEmbedded && <PhoneStatusBar />}

      {/* 1. Full-Bleed Background Image with Ken Burns, Slide Parallax & Depth */}
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
          duration: isSkipped ? 0.5 : 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          x: mouseOffset.x * -0.4,
          y: mouseOffset.y * -0.4,
        }}
      >
        <motion.div
          className="relative w-full h-full"
          animate={{
            scale: shouldReduceMotion ? 1.0 : activeSlideData.bgZoom,
            x: shouldReduceMotion ? 0 : activeSlideData.bgX,
            y: shouldReduceMotion ? 0 : activeSlideData.bgY,
          }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Image
            src="/brand/bg-interior.jpg"
            alt="Interior architecture"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>

        {/* Stronger refined gradient overlay:
            - 30% fade at top for status-bar
            - 0% at middle (35%-45%)
            - ~88% espresso at bottom for maximum text contrast */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(19,15,8,0.32) 0%, rgba(19,15,8,0) 35%, rgba(19,15,8,0.40) 65%, rgba(19,15,8,0.88) 100%)",
          }}
        />
      </motion.div>

      {/* Top Navigation Bar / Dev controls (Hidden in embed=1) */}
      {!isEmbedded && (
        <header className="relative z-30 w-full max-w-5xl px-6 pt-6 flex items-center justify-between pointer-events-auto">
          {/* Styleguide link */}
          <Link
            href="/styleguide"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#F2EBE2]/80 hover:text-[#F2EBE2] bg-[#130F08]/50 hover:bg-[#130F08]/80 border border-[#F2EBE2]/20 backdrop-blur-md transition-all active:scale-95 shadow-sm"
            title="دليل التصميم والمكونات (Styleguide)"
          >
            <Palette className="w-3.5 h-3.5 text-[#F2EBE2]" />
            <span className="hidden sm:inline">دليل المكونات</span>
            <span className="sm:hidden">الدليل</span>
          </Link>

          {/* Dev Replay Indicator */}
          <button
            type="button"
            onClick={replayIntro}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#F2EBE2]/80 hover:text-[#F2EBE2] bg-[#130F08]/50 hover:bg-[#130F08]/80 border border-[#F2EBE2]/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-sm"
            title="إعادة تشغيل المشهد الحركي (مفتاح R)"
          >
            <RotateCcw className="w-3 h-3 text-[#F2EBE2]" />
            <span>إعادة العرض</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-sans font-medium rounded bg-[#3D271A]/80 text-[#FAF6EF]/90 border border-[#645A4E]/40">
              R
            </kbd>
          </button>
        </header>
      )}

      {/* Main Container Area with Glide-up Glass Lockup */}
      <div className="relative z-20 w-full flex-1 flex flex-col items-center justify-center max-w-md px-6">
        {/* The Glass Lockup Container
            - Center during intro
            - Glides up 120px to the upper third after intro completes */}
        <motion.div
          animate={{
            y: isGlidedUp ? -120 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 110,
            damping: 18,
          }}
          className="relative flex items-center justify-center my-auto transition-transform"
        >
          {/* Glass Shape (Circle -> Darker Tinted Pill Panel)
              - Color enforced strictly: currentColor = --cream (#F2EBE2) on both compass & wordmark!
              - Darker tinted glass with >7:1 contrast */}
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
            className={`bawsala-glass flex items-center overflow-hidden transition-shadow text-[#F2EBE2] ${
              isIdle ? "animate-glass-sweep" : ""
            } ${isCircle ? "justify-center p-0" : "justify-start px-5 gap-3"}`}
            dir="ltr"
            style={{
              // Darker tinted luxury glass
              backgroundColor: "rgba(19, 15, 8, 0.42)",
              backdropFilter: "blur(28px) saturate(130%)",
              WebkitBackdropFilter: "blur(28px) saturate(130%)",
              border: "1px solid rgba(242, 235, 226, 0.35)",
              boxShadow:
                "inset 0 1px 1px 0 rgba(242, 235, 226, 0.3), 0 20px 45px -10px rgba(19, 15, 8, 0.65)",
            }}
          >
            {/* Compass Icon Button: 20% larger, 2px stroke, fully opaque ticks, currentColor */}
            <div className="relative z-20 flex items-center justify-center shrink-0 text-[#F2EBE2]">
              <CompassIcon
                size={isCircle ? 62 : 54}
                isSpinning={phase >= 3 && !isIdle}
                isIdle={isIdle}
                needleAngle={25}
              />
            </div>

            {/* Wordmark "BAWSALA" reveals from behind compass: 100% same cream color via currentColor */}
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
                  className="relative z-10 flex items-center overflow-hidden pr-2 text-[#F2EBE2]"
                >
                  <Wordmark
                    width={185}
                    height={30}
                    useTextFallback={false}
                    className="text-[#F2EBE2]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      {/* 2. Anchored Bottom Content Block (24px side padding, safe area bottom, right-aligned) */}
      <AnimatePresence>
        {isGlidedUp && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
              delay: isSkipped ? 0 : 0.1,
            }}
            className="relative z-30 w-full max-w-md px-6 pb-9 flex flex-col items-stretch text-right"
            dir="rtl"
          >
            {/* 3-Slide Carousel Content with Swipe & Directional Blur Crossfade */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={handleDragEnd}
              className="w-full min-h-[148px] flex flex-col justify-end cursor-grab active:cursor-grabbing mb-5"
            >
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.div
                  key={activeSlideData.id}
                  custom={slideDirection}
                  variants={slideBlurVariants}
                  initial={shouldReduceMotion ? { opacity: 0 } : "enter"}
                  animate="center"
                  exit={shouldReduceMotion ? { opacity: 0 } : "exit"}
                  className="space-y-3"
                >
                  {/* Headline: 30px / 1.3, IBM Plex Sans Arabic Weight 600 */}
                  <h1 className="text-[30px] md:text-[34px] font-semibold text-[#FAF6EF] leading-[1.3]">
                    <span dangerouslySetInnerHTML={{ __html: activeSlideData.headline }} />
                  </h1>

                  {/* Supporting text: 15px, sandstone at 80% */}
                  <p className="text-[15px] text-[#D7CBBE]/80 font-normal leading-relaxed max-w-[340px]">
                    {activeSlideData.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* CTAs: Primary pill + Secondary with SurveyBrackets */}
            <div className="w-full flex flex-col items-center gap-3 mb-5">
              <div className="w-full flex justify-center">
                <OnboardingCTA
                  label="ابدأ التحليل"
                  href="/start"
                  triggerShimmer={isIdle}
                />
              </div>

              <Link href="/case/demo/results" className="w-full max-w-[340px] block">
                <SecondaryButton
                  label="شاهد كيف تعمل"
                  fullWidth
                  size="48"
                  variant="dark"
                  className="text-xs text-[#FAF6EF]/90 hover:text-[#FAF6EF]"
                />
              </Link>
            </div>

            {/* Pagination Dots under the CTA: 3 dots, active is elongated pill in cream */}
            <div className="flex items-center justify-center gap-2" dir="ltr">
              {ONBOARDING_SLIDES.map((slide, idx) => {
                const isActive = idx === currentSlide;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => goToSlide(idx, idx > currentSlide ? 1 : -1)}
                    className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                      isActive
                        ? "w-7 bg-[#F2EBE2]"
                        : "w-2 bg-[#F2EBE2]/35 hover:bg-[#F2EBE2]/60"
                    }`}
                    aria-label={`الانتقال للشريحة ${idx + 1}`}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safe Area Home Indicator Bar (inside phone embed) */}
      {isEmbedded && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-[#D7CBBE]/60 rounded-full z-40 pointer-events-none"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
