"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CompassIcon } from "@/components/brand/CompassIcon";
import { TickRing } from "@/components/ui/TickRing";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
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
    }, 40);

    const t1 = setTimeout(() => setCurrentStep(1), 1400);
    const t2 = setTimeout(() => setCurrentStep(2), 2800);
    const tSettle = setTimeout(() => setIsSettled(true), 4200);
    const tDone = setTimeout(() => {
      router.push("/case/demo/results");
    }, 4800);

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
      <div className="flex-1 flex flex-col justify-between px-5 py-8 text-center relative overflow-hidden min-h-screen bg-[#FAF6EF]">
        {/* Soft Blurred Photo Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
          <Image
            src="/images/hero-home.jpg"
            alt="Interior architectural backdrop"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center blur-2xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6EF]/60 via-[#FAF6EF]/85 to-[#FAF6EF]" />
        </div>

        {/* Top Header & 1 Supporting Line */}
        <div className="space-y-1.5 max-w-xs mx-auto relative z-10 pt-4" dir="rtl">
          <span className="text-[11px] font-semibold text-[#14756E] block">
            المرحلة الأخيرة قبل النتائج
          </span>
          <h1 className="text-2xl font-semibold text-[#130F08]">
            {COPY.analyzing.title}
          </h1>
          <p className="text-xs text-[#130F08]/80 leading-relaxed font-normal">
            {COPY.analyzing.subtitle}
          </p>
        </div>

        {/* Main Body (Max 3 Content Blocks) */}
        <div className="space-y-6 relative z-10 max-w-sm mx-auto w-full py-4" dir="rtl">
          {/* Content Block 1: Central Compass with Searching Animation & TickRing */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 rounded-full glass-light border border-white/80 flex items-center justify-center shadow-[0_16px_40px_rgba(19,15,8,0.08)]">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <TickRing progress={progress} size={192} showCenterContent={false} />
              </div>

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
                className="text-[#130F08] drop-shadow-md relative z-10"
              >
                <CompassIcon size={68} needleAngle={isSettled ? 0 : 25} />
              </motion.div>
            </div>
          </div>

          {/* Content Block 2: 3 Sequential Progress Steps */}
          <div className="p-4 rounded-3xl glass-light border border-[#E9DFD0] space-y-2 text-right shadow-2xs">
            {steps.map((step, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 p-2.5 rounded-2xl transition-all duration-300 ${
                    isCurrent
                      ? "bg-white/80 border border-[#14756E]/20"
                      : "border border-transparent"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                      isPast
                        ? "bg-[#14756E] text-[#FAF6EF]"
                        : isCurrent
                        ? "bg-[#130F08] text-[#FAF6EF] animate-pulse"
                        : "bg-[#E9DFD0] text-[#130F08]/75"
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : <bdi dir="ltr">{idx + 1}</bdi>}
                  </div>
                  <span
                    className={`text-xs ${
                      isCurrent
                        ? "font-semibold text-[#130F08]"
                        : isPast
                        ? "text-[#130F08]/80 font-medium"
                        : "text-[#130F08]/65"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Content Block 3: Progress percentage chip */}
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full glass-light border border-[#130F08]/10 text-xs font-semibold text-[#130F08] shadow-2xs">
              اكتمال التحليل: <bdi dir="ltr">{progress}%</bdi>
            </span>
          </div>
        </div>

        {/* 1 Primary Brass CTA (Skip to Results) */}
        <div className="relative z-10 max-w-sm mx-auto w-full pt-2">
          <PrimaryButton
            label="الانتقال للنتائج مباشرة"
            onClick={() => router.push("/case/demo/results")}
            size="56"
            className="w-full shadow-lg"
          />
        </div>
      </div>
    </AppShell>
  );
}
