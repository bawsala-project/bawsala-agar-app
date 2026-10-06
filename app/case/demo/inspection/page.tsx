"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { INITIAL_INSPECTION_ITEMS, InspectionQuestion } from "@/lib/seed";

export default function InspectionPage() {
  const router = useRouter();
  const {
    properties,
    inspectionAnswers,
    setInspectionAnswer,
    inspectionNotes,
  } = useAppStore();

  const [activePropertyId, setActivePropertyId] = useState<string>("p1");
  const [expandedHowMap, setExpandedHowMap] = useState<Record<string, boolean>>({});

  const activeProperty = properties.find((p) => p.id === activePropertyId) || properties[0];

  const inspectionItems: InspectionQuestion[] = INITIAL_INSPECTION_ITEMS;

  const toggleHow = (id: string) => {
    setExpandedHowMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Progress metrics
  const answeredCount = inspectionItems.filter(
    (item: InspectionQuestion) =>
      inspectionAnswers[item.id] !== undefined &&
      inspectionAnswers[item.id] !== "unchecked"
  ).length;
  const totalCount = inspectionItems.length;

  return (
    <AppShell backHref="/case/demo/results" pageTitle={COPY.inspection.title}>
      <div className="relative z-10 flex-1 flex flex-col justify-between px-5 pt-6 pb-32 max-w-lg mx-auto w-full">
        <div className="space-y-5">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-1.5 text-right"
          >
            <span className="eyebrow-caption text-[#130F08]/65 block mb-1">
              الخطوة 05 // التحقق الميداني
            </span>
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#130F08]">
              {COPY.inspection.title}
            </h1>
            <p className="text-xs text-[#130F08]/70 leading-relaxed font-normal">
              {COPY.inspection.subtitle}
            </p>
          </motion.div>

          {/* Property Switcher Tabs (Normalized 40px Pills) */}
          <div className="p-1 rounded-full glass-light border border-[#130F08]/10 grid grid-cols-3 gap-1 shadow-xs">
            {properties.map((p) => {
              const isActive = p.id === activePropertyId;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePropertyId(p.id)}
                  className={`h-10 px-2 text-xs rounded-full font-semibold transition-all text-center cursor-pointer relative ${
                    isActive
                      ? "text-[#FAF6EF]"
                      : "text-[#130F08]/65 hover:text-[#130F08]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-inspection-prop"
                      className="absolute inset-0 bg-[#130F08] rounded-full -z-0 shadow-xs"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 truncate block">{p.district.split("،")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Progress Card with Thin Tick Progress Bar */}
          <div className="p-4 rounded-3xl glass-light border border-[#130F08]/10 space-y-3 text-right shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#130F08] font-semibold flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5 text-[#14756E]" />
                <span>تقدم الفحص لـ {activeProperty.title}</span>
              </span>
              <span className="text-[#14756E] font-semibold">
                {answeredCount} من {totalCount} تم فحصها
              </span>
            </div>

            {/* Thin Tick Progress Bar (One Tick per Item) */}
            <div className="flex items-center gap-1.5 w-full pt-1" dir="rtl">
              {inspectionItems.map((item) => {
                const isAnswered =
                  inspectionAnswers[item.id] !== undefined &&
                  inspectionAnswers[item.id] !== "unchecked";
                const isProblem = inspectionAnswers[item.id] === "problem";

                return (
                  <div
                    key={item.id}
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                      isProblem
                        ? "bg-[#C2643A]"
                        : isAnswered
                        ? "bg-[#14756E]"
                        : "bg-[#E9DFD0]"
                    }`}
                  />
                );
              })}
            </div>

            <p className="text-xs text-[#130F08]/65">
              قائمة الفحص موحدة لمقارنة الخيارات بدون إغفال أي تفصيل.
            </p>
          </div>

          {/* Checklist of Option-Card Style Items */}
          <div className="space-y-4">
            {inspectionItems.map((item, idx) => {
              const currentStatus = inspectionAnswers[item.id] || "unchecked";
              const isHowExpanded = expandedHowMap[item.id] ?? false;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                >
                  <PaperCard className="p-4 space-y-3.5 text-right shadow-xs border border-[#E9DFD0]">
                    {/* Item Top: Category Tag + Title */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF6EF] text-[#130F08] font-semibold border border-[#E9DFD0]">
                          {item.categoryTag}
                        </span>
                        <span className="text-xs font-semibold text-[#130F08]/60">
                          #{idx + 1}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-[#130F08] leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs text-[#130F08]/75 leading-relaxed">
                        {item.whyItMatters}
                      </p>
                    </div>

                    {/* Expandable "How to check" */}
                    <div className="border-t border-[#E9DFD0] pt-2">
                      <button
                        type="button"
                        onClick={() => toggleHow(item.id)}
                        className="text-xs text-[#14756E] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{COPY.inspection.howToCheck}</span>
                        {isHowExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isHowExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pt-2 text-xs text-[#130F08]/85 leading-relaxed bg-[#FAF6EF] p-3 rounded-2xl border border-[#E9DFD0] mt-2"
                          >
                            {item.howToCheck}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Three Segmented Answers: جيد / مشكلة (Copper Outline) / لم أتحقق */}
                    <div className="pt-1">
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-full glass-light border border-[#130F08]/10">
                        {/* Option 1: Good (Teal) */}
                        <button
                          type="button"
                          onClick={() => setInspectionAnswer(item.id, "good")}
                          className={`h-10 px-2 text-xs font-semibold rounded-full transition-all cursor-pointer text-center ${
                            currentStatus === "good"
                              ? "bg-[#14756E] text-[#FAF6EF] shadow-xs"
                              : "text-[#130F08]/75 hover:bg-white/60"
                          }`}
                        >
                          {COPY.inspection.statusOptions.good}
                        </button>

                        {/* Option 2: Problem (Copper Outline, #C2643A) */}
                        <button
                          type="button"
                          onClick={() => setInspectionAnswer(item.id, "problem")}
                          className={`h-10 px-2 text-xs font-semibold rounded-full transition-all cursor-pointer text-center ${
                            currentStatus === "problem"
                              ? "bg-[#C2643A]/15 text-[#C2643A] border-2 border-[#C2643A] shadow-xs"
                              : "text-[#130F08]/75 hover:bg-white/60"
                          }`}
                        >
                          {COPY.inspection.statusOptions.problem}
                        </button>

                        {/* Option 3: Unchecked */}
                        <button
                          type="button"
                          onClick={() => setInspectionAnswer(item.id, "unchecked")}
                          className={`h-10 px-2 text-xs font-medium rounded-full transition-all cursor-pointer text-center ${
                            currentStatus === "unchecked"
                              ? "bg-[#130F08] text-[#FAF6EF] shadow-xs"
                              : "text-[#130F08]/75 hover:bg-white/60"
                          }`}
                        >
                          {COPY.inspection.statusOptions.unchecked}
                        </button>
                      </div>
                    </div>
                  </PaperCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-6 bg-gradient-to-t from-[#FAF6EF] via-[#FAF6EF]/95 to-transparent pt-10 z-30 pointer-events-none">
          <div className="pointer-events-auto">
            <PrimaryButton
              label={COPY.inspection.reassessCta}
              onClick={() => router.push("/case/demo/reassess")}
              className="w-full shadow-xl"
              size="56"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
