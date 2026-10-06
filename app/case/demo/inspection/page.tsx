"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { INITIAL_INSPECTION_ITEMS, InspectionQuestion } from "@/lib/seed";

export default function InspectionPage() {
  const router = useRouter();
  const {
    properties,
    inspectionAnswers,
    setInspectionAnswer,
  } = useAppStore();

  const [activePropertyId, setActivePropertyId] = useState<string>("p1");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isHowSheetOpen, setIsHowSheetOpen] = useState<boolean>(false);

  const activeProperty = properties.find((p) => p.id === activePropertyId) || properties[0];
  const questions: InspectionQuestion[] = INITIAL_INSPECTION_ITEMS;
  const currentItem = questions[currentQuestionIndex] || questions[0];

  const currentStatus = inspectionAnswers[currentItem.id] || "unchecked";

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      router.push("/case/demo/reassess");
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSwipeEnd = (_: unknown, info: PanInfo) => {
    // In RTL: dragging left (negative x) goes to next question, dragging right goes to previous
    if (info.offset.x < -60 || info.velocity.x < -300) {
      handleNext();
    } else if (info.offset.x > 60 || info.velocity.x > 300) {
      handlePrev();
    }
  };

  const handleSelectAnswer = (status: "good" | "problem" | "unchecked") => {
    setInspectionAnswer(currentItem.id, status);
  };

  // Answered count across all questions
  const answeredCount = questions.filter(
    (item) => inspectionAnswers[item.id] && inspectionAnswers[item.id] !== "unchecked"
  ).length;

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <AppShell backHref="/case/demo/compare" pageTitle={COPY.inspection.title}>
      <div
        className="relative z-10 flex-1 flex flex-col justify-between px-4 pt-4 pb-32 max-w-lg mx-auto w-full text-right"
        dir="rtl"
      >
        <div className="space-y-4">
          {/* Headline & Supporting Line (Content Budget) */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#14756E]">
              الخطوة 05 // الفحص الميداني
            </span>
            <h1 className="text-xl font-bold text-[#130F08]">
              {COPY.inspection.title}
            </h1>
            <p className="text-xs text-[#130F08]/70">
              سؤال واحد في كل شاشة لتوثيق الملاحظات أثناء معاينتك
            </p>
          </div>

          {/* BLOCK 1: Property Switcher & Thin Progress Bar */}
          <div className="space-y-2.5">
            {/* Property Switcher Pills (min-h 48px) */}
            <div className="p-1 rounded-2xl glass-light border border-[#130F08]/10 grid grid-cols-3 gap-1 shadow-xs">
              {properties.map((p) => {
                const isActive = p.id === activePropertyId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePropertyId(p.id)}
                    className={`h-12 px-2 text-xs font-semibold rounded-xl transition-all cursor-pointer truncate flex items-center justify-center ${
                      isActive
                        ? "bg-[#130F08] text-[#FAF6EF] shadow-xs"
                        : "text-[#130F08]/70 hover:bg-white/60 hover:text-[#130F08]"
                    }`}
                  >
                    {p.district.split("،")[0]}
                  </button>
                );
              })}
            </div>

            {/* Progress Bar & Counter */}
            <div className="p-3 rounded-2xl bg-white border border-[#E9DFD0] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#130F08]">
                  السؤال <bdi dir="ltr">{currentQuestionIndex + 1}</bdi> من <bdi dir="ltr">{questions.length}</bdi>
                </span>
                <span className="text-[11px] font-medium text-[#14756E]">
                  تم تقييم <bdi dir="ltr">{answeredCount}</bdi> نقاط
                </span>
              </div>

              {/* Segmented Tick Bar */}
              <div className="flex items-center gap-1.5 w-full">
                {questions.map((item, idx) => {
                  const status = inspectionAnswers[item.id];
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-2 flex-1 rounded-full transition-all cursor-pointer ${
                        status === "problem"
                          ? "bg-[#C2643A]"
                          : status === "good"
                          ? "bg-[#14756E]"
                          : isCurrent
                          ? "bg-[#C2A370] ring-2 ring-[#C2A370]/40"
                          : "bg-[#E9DFD0]"
                      }`}
                      aria-label={`انتقال للسؤال ${idx + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* BLOCK 2: The Question Card with Big Answer Buttons (Swipeable, Photo-Free) */}
          <div className="relative">
            <motion.div
              key={currentItem.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleSwipeEnd}
              className="p-5 rounded-3xl bg-white border border-[#E9DFD0] shadow-sm space-y-4 select-none cursor-grab active:cursor-grabbing"
            >
              {/* Question Header: Category & Question Number */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF6EF] text-[#130F08] border border-[#E9DFD0]">
                  {currentItem.categoryTag}
                </span>
                <span className="text-xs font-bold text-[#130F08]/50">
                  #{currentQuestionIndex + 1}
                </span>
              </div>

              {/* Question Title & Why It Matters */}
              <div className="space-y-1.5">
                <h2 className="text-base sm:text-lg font-bold text-[#130F08] leading-snug">
                  {currentItem.title}
                </h2>
                <p className="text-xs text-[#130F08]/75 leading-relaxed">
                  {currentItem.whyItMatters}
                </p>
              </div>

              {/* Expandable "How to Check" trigger (extra detail in sheet) */}
              <button
                type="button"
                onClick={() => setIsHowSheetOpen(true)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#FAF6EF] border border-[#E9DFD0] text-xs font-semibold text-[#14756E] hover:bg-[#E9DFD0]/40 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>طريقة الفحص الميداني الدقيقة</span>
                </span>
                <span className="text-[11px] text-[#130F08]/50">عرض الإرشادات ←</span>
              </button>

              {/* BIG ANSWER BUTTONS (Each >= 48px tap target) */}
              <div className="space-y-2 pt-1">
                {/* Button 1: Good / Solved */}
                <button
                  type="button"
                  onClick={() => handleSelectAnswer("good")}
                  className={`w-full h-14 px-4 rounded-2xl border text-right font-semibold text-sm transition-all flex items-center justify-between cursor-pointer shadow-xs ${
                    currentStatus === "good"
                      ? "bg-[#14756E] border-[#14756E] text-[#FAF6EF] ring-2 ring-[#14756E]/30"
                      : "bg-[#FAF6EF] border-[#E9DFD0] text-[#130F08] hover:border-[#14756E]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        currentStatus === "good" ? "text-[#FAF6EF]" : "text-[#14756E]"
                      }`}
                    />
                    <span>سليم ومطابق للمواصفات</span>
                  </div>
                  {currentStatus === "good" && (
                    <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full">
                      محدد
                    </span>
                  )}
                </button>

                {/* Button 2: Problem / Note */}
                <button
                  type="button"
                  onClick={() => handleSelectAnswer("problem")}
                  className={`w-full h-14 px-4 rounded-2xl border text-right font-semibold text-sm transition-all flex items-center justify-between cursor-pointer shadow-xs ${
                    currentStatus === "problem"
                      ? "bg-[#C2643A] border-[#C2643A] text-[#FAF6EF] ring-2 ring-[#C2643A]/30"
                      : "bg-[#FAF6EF] border-[#E9DFD0] text-[#130F08] hover:border-[#C2643A]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle
                      className={`w-5 h-5 ${
                        currentStatus === "problem" ? "text-[#FAF6EF]" : "text-[#C2643A]"
                      }`}
                    />
                    <span>يوجد ملاحظة أو مشكلة تحتاج متابعة</span>
                  </div>
                  {currentStatus === "problem" && (
                    <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full">
                      محدد
                    </span>
                  )}
                </button>

                {/* Button 3: Unchecked */}
                <button
                  type="button"
                  onClick={() => handleSelectAnswer("unchecked")}
                  className={`w-full h-14 px-4 rounded-2xl border text-right font-semibold text-sm transition-all flex items-center justify-between cursor-pointer shadow-xs ${
                    currentStatus === "unchecked"
                      ? "bg-[#130F08] border-[#130F08] text-[#FAF6EF]"
                      : "bg-[#FAF6EF] border-[#E9DFD0] text-[#130F08]/75 hover:border-[#130F08]/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle
                      className={`w-5 h-5 ${
                        currentStatus === "unchecked" ? "text-[#FAF6EF]" : "text-[#130F08]/50"
                      }`}
                    />
                    <span>لم أتحقق من هذا البند بعد</span>
                  </div>
                  {currentStatus === "unchecked" && (
                    <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full">
                      محدد
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>

          {/* BLOCK 3: Navigation Swipe Hints & Stepper Controls */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className={`h-12 px-4 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentQuestionIndex === 0
                  ? "opacity-35 cursor-not-allowed bg-transparent border-[#130F08]/10 text-[#130F08]/40"
                  : "glass-light border-[#130F08]/15 text-[#130F08] hover:bg-white"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <span className="text-[11px] text-[#130F08]/50">
              اسحب يميناً أو يساراً للتنقل
            </span>

            <button
              type="button"
              onClick={handleNext}
              className="h-12 px-4 rounded-xl glass-light border border-[#130F08]/15 text-xs font-semibold text-[#130F08] hover:bg-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isLastQuestion ? "النتائج" : "التالي"}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sticky Action Footer: 1 Primary CTA */}
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-4 bg-gradient-to-t from-[#FAF6EF] via-[#FAF6EF]/95 to-transparent pt-8 z-30 pointer-events-none">
          <div className="pointer-events-auto space-y-2">
            <PrimaryButton
              label={
                isLastQuestion
                  ? "إعادة الترتيب بناءً على الفحص"
                  : "السؤال التالي"
              }
              icon={isLastQuestion ? ArrowRight : ChevronLeft}
              onClick={handleNext}
              className="w-full h-14 rounded-full text-base font-semibold shadow-lg"
            />

            {!isLastQuestion && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/case/demo/reassess")}
                  className="text-xs text-[#14756E] hover:underline font-semibold cursor-pointer py-1"
                >
                  إنهاء الفحص الميداني والانتقال للتقييم النهائي
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GlassSheet for "How to Check" detailed guidelines */}
      <GlassSheet
        isOpen={isHowSheetOpen}
        onClose={() => setIsHowSheetOpen(false)}
        title="إرشادات الفحص الميداني"
        subtitle={currentItem.title}
        initialSnap="half"
        variant="light"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div className="p-4 rounded-2xl bg-white border border-[#E9DFD0] space-y-2 shadow-xs">
            <span className="text-xs font-bold text-[#14756E] block">
              طريقة الفحص المقترحة:
            </span>
            <p className="text-xs text-[#130F08]/85 leading-relaxed">
              {currentItem.howToCheck}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#E9DFD0] space-y-1.5">
            <span className="text-xs font-semibold text-[#130F08] block">
              لماذا يهم هذا الفحص؟
            </span>
            <p className="text-xs text-[#130F08]/70 leading-relaxed">
              {currentItem.whyItMatters}
            </p>
          </div>
        </div>
      </GlassSheet>
    </AppShell>
  );
}
