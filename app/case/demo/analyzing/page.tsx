"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { CompassIcon } from "@/components/brand/CompassIcon";
import { TickRing } from "@/components/ui/TickRing";
import { COPY } from "@/lib/copy";

export default function AnalyzingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSettled, setIsSettled] = useState(false);

  const steps = COPY.analyzing.steps;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 38);

    const t1 = setTimeout(() => setCurrentStep(1), 1300);
    const t2 = setTimeout(() => setCurrentStep(2), 2600);
    const tSettle = setTimeout(() => setIsSettled(true), 3800);
    const tDone = setTimeout(() => {
      router.push("/case/demo/results");
    }, 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(tSettle);
      clearTimeout(tDone);
    };
  }, [router]);

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between items-center px-5 py-8 select-none overflow-hidden bg-radial-lift"
      dir="rtl"
    >
      {/* 1. Background with Photo Grade */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <Image
          src="/images/hero-home.jpg"
          alt="Architectural backdrop"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center blur-2xl opacity-20 scale-110 photo-grade"
        />
        <div className="absolute inset-0 bg-radial-lift opacity-80" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 w-full max-w-[420px] text-center pt-[calc(20px+var(--safe-top))] space-y-2">
        <h1 className="text-[28px] md:text-[32px] font-light text-ink leading-tight">
          {COPY.analyzing.title}
        </h1>
        <p className="text-[14px] text-muted font-normal">
          {COPY.analyzing.subtitle}
        </p>
      </div>

      {/* Center: Compass with TickRing in sandstone */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center">
        <div className="relative w-48 h-48 rounded-full bawsala-glass-dark border border-stroke flex items-center justify-center shadow-2xl">
          {/* TickRing in sandstone around the compass */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <TickRing progress={progress} size={192} showCenterContent={false} />
          </div>

          {/* Compass Icon */}
          <motion.div
            animate={
              isSettled
                ? { rotate: 0, scale: [1, 1.05, 1] }
                : {
                    rotate: [-30, 40, -15, 55, -10, 20, 0],
                  }
            }
            transition={
              isSettled
                ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                : {
                    duration: 4.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
            className="text-sandstone drop-shadow-md relative z-10"
          >
            <CompassIcon size={68} needleAngle={isSettled ? 0 : 25} />
          </motion.div>
        </div>

        {/* Progress percent display */}
        <div className="mt-5">
          <span className="text-[13px] font-medium text-muted tabular-nums">
            اكتمال الفحص: <bdi dir="ltr">{progress}%</bdi>
          </span>
        </div>
      </div>

      {/* Bottom: Three Status Lines */}
      <div className="relative z-10 w-full max-w-[420px] pb-[calc(20px+var(--safe-bottom))] space-y-2.5">
        <div className="p-4 rounded-[28px] bg-surface-2 border border-stroke space-y-2.5 shadow-lg">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2 rounded-[18px] transition-all duration-300 ${
                  isCurrent ? "bg-surface-3/50 text-sandstone" : "text-muted"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 transition-colors ${
                    isDone
                      ? "bg-sandstone text-espresso"
                      : isCurrent
                      ? "border border-sandstone text-sandstone animate-pulse"
                      : "border border-stroke text-muted"
                  }`}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 stroke-[2]" />
                  ) : (
                    <bdi dir="ltr">{idx + 1}</bdi>
                  )}
                </div>

                <span
                  className={`text-[13px] leading-snug ${
                    isCurrent
                      ? "font-semibold text-sandstone"
                      : isDone
                      ? "text-sandstone"
                      : "text-muted"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
