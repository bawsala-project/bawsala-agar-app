"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CompassIcon } from "@/components/brand/CompassIcon";
import { TickRing } from "@/components/ui/TickRing";
import { BdiNumber } from "@/lib/format";
import { COPY } from "@/lib/copy";

export default function AnalyzingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSettled, setIsSettled] = useState(false);

  const steps = COPY.analyzing.steps;

  useEffect(() => {
    // 1. Progress timer: smoothly increments up to 100% over 4.8 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 45); // 45ms * 100 = 4500ms

    // 2. Sequential steps timers
    const t1 = setTimeout(() => setCurrentStep(1), 1500);
    const t2 = setTimeout(() => setCurrentStep(2), 3000);

    // 3. Settle and lock needle with soft pulse at 4.6s
    const tSettle = setTimeout(() => setIsSettled(true), 4600);

    // 4. Navigate to results at 5.2s
    const tDone = setTimeout(() => {
      router.push("/case/demo/results");
    }, 5200);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(tSettle);
      clearTimeout(tDone);
    };
  }, [router]);

  return (
    <AppShell hideTopBar>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center relative overflow-hidden min-h-screen bg-[#FAF6EF]">
        {/* Soft Blurred Interior Backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <Image
            src="/images/p1-living.jpg"
            alt="Interior backdrop"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center blur-2xl scale-110"
          />
        </div>

        {/* Very Slow Blurred Vertical Streak Texture in Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
          <motion.div
            animate={{
              y: ["-15%", "15%", "-15%"],
              opacity: [0.25, 0.45, 0.25],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-full h-[140%] bg-[radial-gradient(ellipse_280px_700px_at_50%_50%,rgba(233,223,208,0.7),transparent_70%)] blur-3xl"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(227,168,58,0.06)_50%,transparent_100%)] opacity-50" />
        </div>

        {/* Central Compass inside TickRing */}
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-52 h-52 rounded-full glass-light border border-white/80 flex items-center justify-center shadow-[0_16px_40px_rgba(19,15,8,0.08)] mb-8 shrink-0"
        >
          {/* TickRing wrapping the compass */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <TickRing progress={progress} size={208} showCenterContent={false} />
          </div>

          {/* Compass with searching swing and final lock-in */}
          <motion.div
            animate={
              isSettled
                ? { rotate: 0, scale: [1, 1.06, 1] }
                : {
                    rotate: [-35, 45, -20, 60, -10, 25, 0],
                  }
            }
            transition={
              isSettled
                ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                : {
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
            className="text-[#130F08] drop-shadow-[0_4px_16px_rgba(19,15,8,0.12)] relative z-10"
          >
            <CompassIcon size={76} needleAngle={isSettled ? 0 : 25} />
          </motion.div>
        </motion.div>

        {/* Title & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="space-y-2 mb-8 max-w-xs relative z-10"
        >
          <span className="eyebrow-caption text-[#14756E] block">
            جاري فحص الخيارات
          </span>
          <h2 className="text-[22px] font-semibold text-[#130F08] leading-[1.35]">
            {COPY.analyzing.title}
          </h2>
          <p className="text-xs text-[#130F08]/75 leading-relaxed font-normal">
            {COPY.analyzing.subtitle}
          </p>
        </motion.div>

        {/* Three Status Lines Checking Off */}
        <div className="w-full max-w-xs space-y-3 text-right relative z-10">
          {steps.map((stepText, idx) => {
            const isDone = currentStep > idx || isSettled;
            const isCurrent = currentStep === idx && !isSettled;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: isCurrent || isDone ? 1 : 0.45,
                  x: isCurrent || isDone ? 0 : -6,
                }}
                transition={{ duration: 0.3 }}
                className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all duration-300 ${
                  isDone
                    ? "bg-[#E9DFD0]/70 border-[#14756E]/40 text-[#130F08] shadow-xs"
                    : isCurrent
                    ? "glass-light border-[#14756E] text-[#130F08] shadow-sm"
                    : "bg-white/40 border-[#E9DFD0]/60 text-[#130F08]/40"
                }`}
              >
                <span className="font-medium text-xs text-[#130F08]">{stepText}</span>

                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 450, damping: 22 }}
                      className="w-4 h-4 rounded-full bg-[#14756E] text-[#FAF6EF] flex items-center justify-center font-bold"
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </motion.div>
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-3.5 h-3.5 border-2 border-[#14756E] border-t-transparent rounded-full"
                    />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#130F08]/20" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Percentage with BdiNumber */}
        <div className="mt-8 text-xs text-[#130F08]/70 relative z-10 font-sans">
          <BdiNumber value={`${progress}%`} className="text-xs font-medium text-[#130F08]/75" />
        </div>
      </div>
    </AppShell>
  );
}

