"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { CompassIcon } from "@/components/brand/CompassIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { BdiNumber, formatNumber } from "@/lib/format";

export default function ReassessPage() {
  const router = useRouter();
  const {
    properties,
    isReassessed,
    applyReassessment,
    setLoginSheetOpen,
  } = useAppStore();

  const [isAnalyzing, setIsAnalyzing] = useState(!isReassessed);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (!isReassessed) {
      const timer = setTimeout(() => {
        applyReassessment();
        setIsAnalyzing(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isReassessed, applyReassessment]);

  const p1 = properties.find((p) => p.id === "p1") || properties[0];
  const p3 = properties.find((p) => p.id === "p3") || properties[2] || properties[0];

  return (
    <AppShell backHref="/case/demo/inspection" pageTitle={COPY.reassess.title}>
      <div
        className="relative z-10 flex-1 flex flex-col justify-between px-4 pt-4 pb-32 max-w-lg mx-auto w-full text-right"
        dir="rtl"
      >
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            /* Analyzing Moment */
            <motion.div
              key="analyzing-moment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-5"
            >
              <div className="relative w-24 h-24 rounded-full glass-light border border-[#130F08]/10 flex items-center justify-center shadow-lg">
                <motion.div
                  animate={{ rotate: [-30, 45, -15, 25, 0] }}
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                  className="text-[#14756E]"
                >
                  <CompassIcon size={46} />
                </motion.div>
                <div className="absolute inset-0 rounded-full border-2 border-[#E9DFD0] border-t-[#14756E] animate-spin" />
              </div>

              <div className="space-y-1.5 max-w-xs">
                <h3 className="text-base font-bold text-[#130F08]">
                  {COPY.reassess.analyzingMini}
                </h3>
                <p className="text-xs text-[#130F08]/70 leading-relaxed">
                  تحديث التقييم الهندسي والمالي وفقاً لملاحظاتك الميدانية
                </p>
              </div>
            </motion.div>
          ) : (
            /* Reassessment Content */
            <motion.div
              key="reassess-content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              {/* Headline & Supporting Line (Content Budget) */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#14756E]">
                    الخطوة 06 // التحديث النهائي
                  </span>
                  <span className="text-xs text-[#130F08]/30">•</span>
                  <span className="text-[11px] font-medium text-[#130F08]/70">
                    تم التقييم الميداني
                  </span>
                </div>
                <h1 className="text-xl font-bold text-[#130F08]">
                  {COPY.reassess.title}
                </h1>
                <p className="text-xs text-[#130F08]/70">
                  {COPY.reassess.subtitle}
                </p>
              </div>

              {/* BLOCK 1: Before / After Cards with Photos & One-Line Reason */}
              <div className="space-y-3">
                {/* NEW WINNER (After Card) */}
                <div className="p-3.5 rounded-3xl bg-[#130F08] text-[#FAF6EF] shadow-md border border-[#130F08] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#14756E] text-[#FAF6EF] font-bold">
                      المركز الأول الجديد ↑
                    </span>
                    <span className="text-[11px] text-[#FAF6EF]/60 font-medium">
                      بعد المعاينة
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/20">
                      <PropertyImage
                        image={p3.images?.[0]}
                        tone={p3.colorTone || "sandstone"}
                        alt={p3.title}
                        containerClassName="w-full h-full"
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#FAF6EF] truncate">
                        #{p3.postRank} • {p3.title}
                      </h3>
                      <div className="text-xs font-semibold text-[#C2A370]">
                        <BdiNumber value={formatNumber(p3.price)} unit="ر.س" />
                      </div>
                      {/* One-Line Reason */}
                      <p className="text-[11px] text-[#FAF6EF]/80 leading-relaxed line-clamp-2">
                        السبب: سلامة تامة من العيوب الإنشائية وتوفير 80 ألف ر.س.
                      </p>
                    </div>
                  </div>
                </div>

                {/* DEMOTED RUNNER-UP (Before Card) */}
                <div className="p-3.5 rounded-3xl bg-white border border-[#C2643A]/40 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#C2643A]/15 text-[#C2643A] font-bold">
                      تراجع للمركز الثاني ↓
                    </span>
                    <span className="text-[11px] text-[#130F08]/50 font-medium">
                      كان #1 قبل المعاينة
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-[#E9DFD0]">
                      <PropertyImage
                        image={p1.images?.[0]}
                        tone={p1.colorTone || "sandstone"}
                        alt={p1.title}
                        containerClassName="w-full h-full"
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#130F08] truncate">
                        #{p1.postRank} • {p1.title}
                      </h3>
                      <div className="text-xs font-semibold text-[#130F08]">
                        <BdiNumber value={formatNumber(p1.price)} unit="ر.س" />
                      </div>
                      {/* One-Line Reason */}
                      <p className="text-[11px] text-[#C2643A] font-medium leading-relaxed line-clamp-2">
                        السبب: رصد تسرب ورطوبة في سقف الممر يرجح تكاليف إصلاح غير معلنة.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCK 2: Field Inspection Findings (Max 3 Chips) */}
              <div className="p-3.5 rounded-2xl glass-light border border-[#130F08]/10 space-y-2 shadow-xs">
                <span className="text-xs font-bold text-[#130F08] block">
                  أبرز ما أكدته المعاينة الميدانية:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#C2643A]/15 text-[#C2643A] border border-[#C2643A]/30 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>رطوبة بسقف الياسمين</span>
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#E9DFD0] text-[#14756E] font-semibold flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>سلامة عزل شقة النرجس</span>
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#E9DFD0] text-[#130F08] font-medium flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-[#14756E]" />
                    <span>تأكيد الصك 148 م²</span>
                  </span>
                </div>
              </div>

              {/* BLOCK 3: Confidence Shift Arc + Deep Details Trigger */}
              <div className="p-4 rounded-2xl bg-white border border-[#E9DFD0] shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#130F08] flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-[#C2643A]" />
                    <span>تراجع اطمئنان شقة الياسمين</span>
                  </span>
                  <span className="font-bold text-[#C2643A]">
                    <bdi dir="ltr">80% ← 35%</bdi>
                  </span>
                </div>

                {/* Animated Shrinking Bar */}
                <div className="w-full h-2 rounded-full bg-[#FAF6EF] border border-[#E9DFD0] overflow-hidden">
                  <motion.div
                    initial={{ width: "80%" }}
                    animate={{ width: "35%" }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    className="h-full bg-[#C2643A] rounded-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(true)}
                  className="w-full h-11 px-3.5 rounded-xl glass-light border border-[#130F08]/15 text-xs font-semibold text-[#14756E] hover:bg-[#FAF6EF] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>لماذا تفوقت شقة النرجس؟ (تفاصيل المعادلة)</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#130F08]/50" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky Action Footer: 1 Primary CTA */}
        {!isAnalyzing && (
          <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-4 bg-gradient-to-t from-[#FAF6EF] via-[#FAF6EF]/95 to-transparent pt-8 z-30 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2.5">
              <PrimaryButton
                label={COPY.reassess.saveCaseCta}
                icon={ArrowRight}
                onClick={() => setLoginSheetOpen(true)}
                className="flex-1 h-14 rounded-full text-base font-semibold shadow-lg"
              />
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="h-14 px-5 rounded-full glass-light border border-[#130F08]/15 text-xs font-semibold text-[#130F08] hover:bg-[#E9DFD0]/60 transition-colors shadow-xs cursor-pointer shrink-0"
              >
                لوحة الحالات
              </button>
            </div>
          </div>
        )}
      </div>

      {/* GlassSheet for Details */}
      <GlassSheet
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="أسباب إعادة الترتيب بعد الفحص"
        subtitle="تأثير الملاحظات الميدانية المسجلة على توازن القرار النهائي"
        initialSnap="half"
        variant="light"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div className="p-4 rounded-2xl bg-white border border-[#E9DFD0] space-y-1.5 shadow-xs">
            <span className="text-xs font-bold text-[#14756E] block">
              شقة حي النرجس (المركز الأول الجديد)
            </span>
            <p className="text-xs text-[#130F08]/85 leading-relaxed">
              خالية من أي ملاحظات إنشائية مرصودة، وتوفر مبلغ 80,000 ر.س يكفي لتغطية فارق تكلفة التنقل لعدة سنوات قادمة بأريحية وأمان.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#C2643A]/10 border border-[#C2643A]/30 space-y-1.5">
            <span className="text-xs font-bold text-[#C2643A] block">
              شقة حي الياسمين (المركز الثاني)
            </span>
            <p className="text-xs text-[#130F08]/85 leading-relaxed">
              رغم ميزتها الكبرى في القرب من مقر العمل (15 دقيقة)، فإن رصد تسرب مائي في السقف يفرض فحصاً هندسياً دقيقاً واشتراط ضمانات إصلاح رسمية من البائع قبل التعاقد.
            </p>
          </div>
        </div>
      </GlassSheet>
    </AppShell>
  );
}
