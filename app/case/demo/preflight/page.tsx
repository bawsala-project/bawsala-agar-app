"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { CertaintyChip } from "@/components/ui/CertaintyChip";
import { ScopeTag } from "@/components/ui/ScopeTag";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { TickRing } from "@/components/ui/TickRing";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { BdiNumber, formatNumber } from "@/lib/format";

export default function PreflightPage() {
  const router = useRouter();
  const {
    properties,
    p1AreaResolved,
    p1SelectedArea,
    resolveP1Area,
    p3AgeResolved,
    p3BuildingAge,
    resolveP3Age,
  } = useAppStore();

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    p1: true,
    p2: false,
    p3: true,
  });

  const [inputAgeVal, setInputAgeVal] = useState(p3BuildingAge || "3");

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Readiness Calculation
  const totalTasks = 2;
  const completedTasks = (p1AreaResolved ? 1 : 0) + (p3AgeResolved ? 1 : 0);
  const readinessPercent = Math.round((completedTasks / totalTasks) * 100);
  const isReady = readinessPercent === 100;

  return (
    <AppShell
      showStepper
      activeStep="preflight"
      backHref="/case/demo/properties"
      pageTitle={COPY.preflight.title}
    >
      <div className="flex-1 flex flex-col justify-between px-5 pt-6 pb-32 max-w-lg mx-auto w-full">
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-1.5 text-right"
          >
            <span className="eyebrow-caption text-[#130F08]/65 block mb-1">
              الخطوة 03 // فحص الجاهزية
            </span>
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#130F08]">
              {COPY.preflight.title}
            </h1>
            <p className="text-xs text-[#130F08]/70 leading-relaxed font-normal">
              {COPY.preflight.subtitle}
            </p>
          </motion.div>

          {/* Readiness as TickRing at the top */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="p-5 rounded-3xl glass-light border border-[#130F08]/10 shadow-xs relative overflow-hidden"
          >
            <div className="flex items-center gap-5">
              {/* TickRing Component with 60 precision ticks */}
              <div className="shrink-0">
                <TickRing progress={readinessPercent} size={92}>
                  <div className="flex flex-col items-center justify-center">
                    <BdiNumber
                      value={`${readinessPercent}%`}
                      className="text-base font-semibold text-[#130F08]"
                    />
                    <span className="text-xs text-[#130F08]/65">جاهزية</span>
                  </div>
                </TickRing>
              </div>

              {/* Status Description */}
              <div className="flex-1 min-w-0 space-y-1 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#14756E]">
                    فحص اكتمال البيانات
                  </span>
                  {isReady && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-[#14756E] text-[#FAF6EF] font-semibold"
                    >
                      <Sparkles className="w-3 h-3 text-[#FAF6EF]" />
                      <span>جاهز تماماً</span>
                    </motion.span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-[#130F08] leading-snug">
                  {isReady ? COPY.preflight.readyText : COPY.preflight.incompleteText}
                </h3>
                <p className="text-xs text-[#130F08]/75 leading-relaxed">
                  {isReady
                    ? "تم حسم التعارضات وسد النواقص. القرار الآن مبني على حقائق دقيقة وموثقة."
                    : `يتبقى ${totalTasks - completedTasks} بيانات رئيسية تحتاج اختيارك لحسم المقارنة.`}
                </p>
              </div>
            </div>

            {/* Hint bar */}
            <div className="mt-3.5 pt-3 border-t border-[#130F08]/10 flex items-center gap-2 text-xs text-[#130F08]/75 text-right">
              <Info className="w-3.5 h-3.5 text-[#14756E] shrink-0" />
              <span>
                {isReady
                  ? "تم التدقيق بنجاح. يمكنك الآن الانتقال لمشاهدة التحليل الكامل."
                  : "يرجى حسم التعارضات والبيانات الناقصة في البطاقات أدناه للمتابعة."}
              </span>
            </div>
          </motion.div>

          {/* Properties Expandable Paper Cards */}
          <div className="space-y-4">
            {properties.map((property, idx) => {
              const isExpanded = expandedCards[property.id] ?? false;
              const hasP1Conflict = property.id === "p1";
              const hasP3Missing = property.id === "p3";

              return (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                >
                  <PaperCard className="overflow-hidden p-0 shadow-xs border border-[#E9DFD0]">
                    {/* Collapsible Card Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(property.id)}
                      className="w-full p-4 flex items-center justify-between text-right cursor-pointer hover:bg-[#FAF6EF] transition-colors border-b border-[#E9DFD0]"
                    >
                      <div className="flex items-center gap-3">
                        <PropertyImage
                          image={property.images?.[0]}
                          shape="rounded-2xl"
                          tone={property.colorTone || "sandstone"}
                          alt={property.title}
                          priority={idx === 0}
                          containerClassName="w-12 h-12 shrink-0 rounded-2xl shadow-xs"
                        />
                        <div>
                          <h3 className="text-sm font-semibold text-[#130F08]">
                            {property.title}
                          </h3>
                          <p className="text-xs text-[#130F08]/65">
                            <BdiNumber value={formatNumber(property.price)} unit="ر.س" /> • {property.district}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {property.id === "p1" && !p1AreaResolved && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#C2643A]/15 border border-[#C2643A]/40 text-[#C2643A] font-semibold">
                            تعارض مصادر
                          </span>
                        )}
                        {property.id === "p3" && !p3AgeResolved && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E9DFD0] text-[#130F08] font-semibold">
                            بيان ناقص
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#130F08]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#130F08]" />
                        )}
                      </div>
                    </button>

                    {/* Expandable Body */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="p-4 space-y-4 text-right"
                        >
                          {/* 1. What We Understood (Facts) */}
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-[#130F08] flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#14756E]" />
                              <span>{COPY.preflight.sectionUnderstood}</span>
                            </span>

                            <div className="space-y-2 bg-[#FAF6EF] rounded-2xl p-3.5 border border-[#E9DFD0]">
                              {property.facts.map((fact) => (
                                <div
                                  key={fact.id}
                                  className="flex items-start justify-between gap-2 text-xs py-1.5 border-b border-[#E9DFD0] last:border-0"
                                >
                                  <div className="space-y-0.5">
                                    <span className="text-[#130F08]/70 font-medium">
                                      {fact.label}:
                                    </span>
                                    <p className="text-[#130F08] font-semibold">
                                      {fact.value}
                                    </p>
                                    {fact.impactExplanation && (
                                      <p className="text-xs text-[#C2643A] pt-0.5 font-medium">
                                        {fact.impactExplanation}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <CertaintyChip level={fact.certainty} variant="paper" size="sm" />
                                    <ScopeTag scope={fact.scope} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 2. What Is Missing / Conflicting with Transition from unknown/conflicting to user_observed */}
                          {hasP1Conflict && (
                            <div className="p-4 rounded-2xl bg-[#C2643A]/10 border border-[#C2643A]/30 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C2643A]">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  <span>{COPY.preflight.conflictTitle}</span>
                                </div>
                                <CertaintyChip
                                  level={p1AreaResolved ? "user_observed" : "conflicting"}
                                  variant="paper"
                                />
                              </div>
                              <p className="text-xs text-[#130F08]/85 leading-relaxed">
                                {COPY.preflight.conflictDesc} أي مساحة تفضل اعتمادها في المقارنة؟
                              </p>

                              {/* Choose One Control */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => resolveP1Area("148")}
                                  className={`py-2.5 px-3 rounded-full text-xs font-semibold border text-center transition-all cursor-pointer ${
                                    p1AreaResolved && p1SelectedArea === "148"
                                      ? "bg-[#14756E] text-[#FAF6EF] border-[#14756E] shadow-xs"
                                      : "bg-white text-[#130F08] border-[#E9DFD0] hover:bg-[#FAF6EF]"
                                  }`}
                                >
                                  148 م² (الصك الرسمي)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => resolveP1Area("160")}
                                  className={`py-2.5 px-3 rounded-full text-xs font-semibold border text-center transition-all cursor-pointer ${
                                    p1AreaResolved && p1SelectedArea === "160"
                                      ? "bg-[#14756E] text-[#FAF6EF] border-[#14756E] shadow-xs"
                                      : "bg-white text-[#130F08] border-[#E9DFD0] hover:bg-[#FAF6EF]"
                                  }`}
                                >
                                  160 م² (حسب الإعلان)
                                </button>
                              </div>
                            </div>
                          )}

                          {hasP3Missing && (
                            <div className="p-4 rounded-2xl bg-white border border-[#E9DFD0] space-y-2.5 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#130F08]">
                                  <HelpCircle className="w-4 h-4 text-[#14756E] shrink-0" />
                                  <span>{COPY.preflight.unknownAgeTitle}</span>
                                </div>
                                <CertaintyChip
                                  level={p3AgeResolved ? "user_observed" : "unknown"}
                                  variant="paper"
                                />
                              </div>
                              <p className="text-xs text-[#130F08]/80 leading-relaxed">
                                {COPY.preflight.unknownAgeDesc}
                              </p>

                              {/* Inline Field & I Don't Know Option */}
                              <div className="flex items-center gap-2 pt-1">
                                <div className="flex-1 flex items-center bg-[#FAF6EF] border border-[#E9DFD0] rounded-full px-4 py-2 focus-within:border-[#14756E]">
                                  <input
                                    type="text"
                                    value={inputAgeVal}
                                    onChange={(e) => setInputAgeVal(e.target.value)}
                                    placeholder="أدخل العمر (مثلاً: 3 سنوات)"
                                    className="w-full bg-transparent text-xs text-[#130F08] focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => resolveP3Age(inputAgeVal || "3")}
                                    className="text-xs font-semibold bg-[#130F08] text-[#FAF6EF] px-3 py-1 rounded-full cursor-pointer shrink-0"
                                  >
                                    تأكيد
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => resolveP3Age("غير محدد")}
                                  className="h-10 px-4 rounded-full text-xs font-medium border border-[#E9DFD0] bg-white text-[#130F08] hover:bg-[#FAF6EF] transition-colors shrink-0 cursor-pointer"
                                >
                                  {COPY.preflight.dontKnowOption}
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
              label={COPY.preflight.ctaReady}
              onClick={() => router.push("/case/demo/checkout")}
              disabled={!isReady}
              className={`w-full shadow-xl transition-all ${
                isReady
                  ? ""
                  : "opacity-60 cursor-not-allowed"
              }`}
              size="56"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
