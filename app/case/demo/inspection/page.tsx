"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  AlertTriangle,
  HelpCircle,
  Info,
} from "lucide-react";
import { CircleButton } from "@/components/ui/CircleButton";
import { WideCard } from "@/components/ui/WideCard";
import { GlassPill } from "@/components/ui/GlassPill";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { useAppStore } from "@/lib/store";
import { INITIAL_INSPECTION_ITEMS } from "@/lib/seed";

export default function InspectionPage() {
  const router = useRouter();
  const { inspectionAnswers, setInspectionAnswer } = useAppStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHowSheetOpen, setIsHowSheetOpen] = useState(false);

  const questions = INITIAL_INSPECTION_ITEMS;
  const currentItem = questions[currentIndex] || questions[0];
  const currentStatus = inspectionAnswers[currentItem.id] || "unchecked";

  const total = questions.length;
  const progressPercent = ((currentIndex + 1) / total) * 100;

  const handleSelectAnswer = (status: "good" | "problem" | "unchecked") => {
    setInspectionAnswer(currentItem.id, status);
    if (currentIndex < total - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 150);
    } else {
      setTimeout(() => {
        router.push("/case/demo/reassess");
      }, 200);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between select-none bg-radial-lift"
      dir="rtl"
    >
      {/* 1. Thin Progress Line at Top */}
      <div className="w-full h-1 bg-surface-3 fixed top-0 inset-x-0 z-50">
        <div
          className="h-full bg-sandstone transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-[420px] mx-auto px-5 pt-[calc(20px+var(--safe-top))] pb-[calc(24px+var(--safe-bottom))] flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header Row: CircleButton back + Question counter */}
          <div className="flex items-center justify-between">
            <CircleButton
              icon={<ArrowRight className="w-5 h-5 text-sandstone" />}
              ariaLabel="السابق"
              onClick={handleBack}
              variant="glass"
            />
            <span className="text-[13px] font-medium text-muted tabular-nums">
              فحص <bdi dir="ltr">{currentIndex + 1}</bdi> من <bdi dir="ltr">{total}</bdi>
            </span>
          </div>

          {/* Big Title: Question text */}
          <h1 className="text-[30px] md:text-[36px] font-light text-ink leading-[1.25] tracking-normal">
            {currentItem.title}
          </h1>

          {/* One WideCard 'why' */}
          <WideCard
            title="لماذا هذا الفحص مهم؟"
            subtitle={currentItem.whyItMatters}
            icon={<Info className="w-5 h-5 text-sandstone" />}
            value={<span className="text-[12px] text-muted">كيف تتأكد؟</span>}
            onClick={() => setIsHowSheetOpen(true)}
          />
        </div>

        {/* Three Large Answer Pills (جيد، مشكلة، لم أتحقق) */}
        <div className="space-y-3 pt-6">
          {/* Good / Sound */}
          <GlassPill
            label="جيد / سليم"
            icon={<Check className="w-5 h-5" />}
            size="56"
            variant={currentStatus === "good" ? "sandstone" : "glass"}
            fullWidth
            onClick={() => handleSelectAnswer("good")}
          />

          {/* Problem / Defect */}
          <GlassPill
            label="مشكلة / عيب محتمل"
            icon={<AlertTriangle className={`w-5 h-5 ${currentStatus === "problem" ? "text-copper" : "text-sandstone"}`} />}
            size="56"
            variant={currentStatus === "problem" ? "sandstone" : "glass"}
            fullWidth
            onClick={() => handleSelectAnswer("problem")}
          />

          {/* Unchecked */}
          <GlassPill
            label="لم أتحقق بعد"
            icon={<HelpCircle className="w-5 h-5" />}
            size="56"
            variant={currentStatus === "unchecked" ? "sandstone" : "glass"}
            fullWidth
            onClick={() => handleSelectAnswer("unchecked")}
          />
        </div>
      </div>

      {/* How to Check Sheet */}
      <GlassSheet
        isOpen={isHowSheetOpen}
        onClose={() => setIsHowSheetOpen(false)}
        title="كيف تتأكد بنفسك في الميدان؟"
        subtitle={currentItem.title}
        initialSnap="half"
        variant="dark"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-[20px] bg-surface-2 border border-stroke space-y-2">
            <span className="text-[14px] font-semibold text-sandstone block">
              طريقة الفحص الميداني:
            </span>
            <p className="text-[13px] text-sandstone leading-relaxed">
              {currentItem.howToCheck}
            </p>
          </div>
        </div>
      </GlassSheet>
    </div>
  );
}
