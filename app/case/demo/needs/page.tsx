"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Edit3, ArrowRight, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { formatNumber } from "@/lib/format";

export default function NeedsPage() {
  const router = useRouter();
  const { userNeed, updateHardBudget, updatePreferencePriority } = useAppStore();
  const [isEditingSheetOpen, setIsEditingSheetOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<"budget" | "proximity" | "bedrooms">("budget");
  const [tempBudget, setTempBudget] = useState(userNeed.hardConstraint.numericBudget);

  const handleOpenEdit = (target: "budget" | "proximity" | "bedrooms") => {
    setEditingTarget(target);
    setTempBudget(userNeed.hardConstraint.numericBudget);
    setIsEditingSheetOpen(true);
  };

  const handleSaveBudget = () => {
    updateHardBudget(tempBudget);
    setIsEditingSheetOpen(false);
  };

  return (
    <AppShell hideTopBar>
      {/* Header: Back Arrow, Headline, 5-Segment Progress Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF6EF]/92 backdrop-blur-md border-b border-[#E9DFD0]/70 px-4 sm:px-5 pt-3 pb-2.5 space-y-2" dir="rtl">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 text-[#130F08] hover:bg-[#E9DFD0]/60 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
            aria-label="الرجوع للخلف"
          >
            <ArrowRight className="w-5 h-5 text-[#130F08]" />
          </button>

          {/* 1 Headline: "ما فهمناه من طلبك" */}
          <h1 className="text-base font-semibold text-[#130F08]">
            {COPY.needs.title}
          </h1>

          <div className="w-10 h-10" />
        </div>

        {/* 1 Supporting Line: 5-Segment Progress Bar */}
        <div className="flex items-center justify-between text-xs text-[#130F08]/65 font-medium">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 w-20" dir="rtl">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full ${
                    step <= 1 ? "bg-[#130F08]" : "bg-[#E9DFD0]"
                  }`}
                />
              ))}
            </div>
            <span>
              <bdi dir="ltr">1 من 5</bdi>
            </span>
          </div>

          <span className="text-[11px] text-[#130F08]/60">
            {COPY.needs.subtitle}
          </span>
        </div>
      </header>

      {/* Main Body (Strictly Max 3 Content Blocks) */}
      <div className="px-4 sm:px-5 pt-4 pb-32 flex-1 flex flex-col justify-between max-w-md mx-auto w-full" dir="rtl">
        <div className="space-y-4">
          {/* Content Block 1: One Hero Card for Hard Constraint */}
          <div
            className="p-5 rounded-3xl border border-[#E9DFD0] shadow-sm relative overflow-hidden text-right"
            style={{
              background: "linear-gradient(135deg, #FAF6EF 0%, #E9DFD0 100%)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#130F08]/70 font-medium">
                    {userNeed.hardConstraint.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#14756E]/12 text-[#14756E] border border-[#14756E]/30">
                    شرط قاطع
                  </span>
                </div>

                <div className="pt-0.5">
                  <bdi dir="ltr" className="text-3xl sm:text-4xl text-[#130F08] font-bold tabular-nums block leading-none">
                    {formatNumber(userNeed.hardConstraint.numericBudget)} <span className="text-sm font-medium text-[#130F08]/70">ر.س</span>
                  </bdi>
                </div>
              </div>

              <div className="w-11 h-11 rounded-full glass-light border border-[#130F08]/10 flex items-center justify-center text-[#14756E] shrink-0 shadow-xs">
                <Lock className="w-5 h-5 text-[#14756E]" />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#130F08]/10 flex items-center justify-between text-xs">
              <span className="text-[#130F08]/75">
                {COPY.needs.hardConstraintTip}
              </span>
              <button
                type="button"
                onClick={() => handleOpenEdit("budget")}
                className="inline-flex items-center gap-1 font-semibold text-[#14756E] hover:underline cursor-pointer min-h-[36px] px-2 py-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>
            </div>
          </div>

          {/* Content Block 2: Preference Row 1 (Simple Row) */}
          {userNeed.preferences[0] && (
            <div className="p-4 rounded-2xl glass-light border border-[#E9DFD0] flex items-center justify-between shadow-2xs">
              <div className="text-right space-y-0.5">
                <span className="text-xs text-[#130F08]/65 block font-medium">
                  {userNeed.preferences[0].title}
                </span>
                <span className="text-sm font-semibold text-[#130F08] block">
                  {userNeed.preferences[0].value}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit("proximity")}
                className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 flex items-center justify-center text-[#14756E] hover:bg-white active:scale-95 transition-all cursor-pointer shadow-2xs shrink-0"
                title="تعديل التفضيل"
                aria-label="تعديل التفضيل"
              >
                <Edit3 className="w-4 h-4 text-[#14756E]" />
              </button>
            </div>
          )}

          {/* Content Block 3: Preference Row 2 (Simple Row) */}
          {userNeed.preferences[1] && (
            <div className="p-4 rounded-2xl glass-light border border-[#E9DFD0] flex items-center justify-between shadow-2xs">
              <div className="text-right space-y-0.5">
                <span className="text-xs text-[#130F08]/65 block font-medium">
                  {userNeed.preferences[1].title}
                </span>
                <span className="text-sm font-semibold text-[#130F08] block">
                  {userNeed.preferences[1].value}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit("bedrooms")}
                className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 flex items-center justify-center text-[#14756E] hover:bg-white active:scale-95 transition-all cursor-pointer shadow-2xs shrink-0"
                title="تعديل التفضيل"
                aria-label="تعديل التفضيل"
              >
                <Edit3 className="w-4 h-4 text-[#14756E]" />
              </button>
            </div>
          )}
        </div>

        {/* 1 Primary Brass CTA (min 48px height) */}
        <div className="pt-6">
          <PrimaryButton
            label={COPY.needs.cta}
            onClick={() => router.push("/case/demo/properties")}
            size="56"
            className="w-full shadow-lg"
          />
        </div>
      </div>

      {/* Edit Sheet */}
      <GlassSheet
        isOpen={isEditingSheetOpen}
        onClose={() => setIsEditingSheetOpen(false)}
        title={COPY.needs.sheetTitle}
        subtitle={COPY.needs.sheetSubtitle}
        variant="light"
        initialSnap="half"
      >
        <div className="space-y-4 text-right" dir="rtl">
          {editingTarget === "budget" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-[#130F08] block">
                تعديل سقف الميزانية الصارم:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="50000"
                  min="300000"
                  max="5000000"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(Number(e.target.value))}
                  className="flex-1 min-h-[48px] px-4 rounded-xl border border-[#E9DFD0] bg-white text-base font-semibold text-[#130F08] tabular-nums focus:outline-none"
                />
                <span className="text-xs font-semibold text-[#130F08]/70">ر.س</span>
              </div>

              <div className="pt-2">
                <PrimaryButton
                  label="حفظ السقف الجديد"
                  onClick={handleSaveBudget}
                  size="48"
                  className="w-full"
                />
              </div>
            </div>
          )}

          {editingTarget === "proximity" && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#130F08] block">
                تحديد أولوية القرب من مقر العمل:
              </span>
              {(["high", "medium", "low"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    updatePreferencePriority("proximity", lvl);
                    setIsEditingSheetOpen(false);
                  }}
                  className="w-full min-h-[48px] p-3 rounded-xl border border-[#E9DFD0] bg-white hover:bg-[#FAF6EF] flex items-center justify-between text-xs font-semibold text-[#130F08] cursor-pointer"
                >
                  <span>
                    {lvl === "high" ? "أولوية قصوى (حتى 15 دقيقة)" : lvl === "medium" ? "أولوية متوسطة (حتى 25 دقيقة)" : "أولوية عادية (حتى 35 دقيقة)"}
                  </span>
                  <span className="text-[11px] text-[#14756E]">
                    {lvl === "high" ? "مرتفعة" : lvl === "medium" ? "متوسطة" : "منخفضة"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {editingTarget === "bedrooms" && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#130F08] block">
                تحديد عدد الغرف المطلوب:
              </span>
              {(["high", "medium", "low"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    updatePreferencePriority("bedrooms", lvl);
                    setIsEditingSheetOpen(false);
                  }}
                  className="w-full min-h-[48px] p-3 rounded-xl border border-[#E9DFD0] bg-white hover:bg-[#FAF6EF] flex items-center justify-between text-xs font-semibold text-[#130F08] cursor-pointer"
                >
                  <span>
                    {lvl === "high" ? "3 غرف نوم مؤكدة (شرط أساسي)" : lvl === "medium" ? "3 غرف نوم مفضلة" : "غرفتان أو أكثر"}
                  </span>
                  <span className="text-[11px] text-[#14756E]">
                    {lvl === "high" ? "مرتفعة" : lvl === "medium" ? "متوسطة" : "منخفضة"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </GlassSheet>
    </AppShell>
  );
}
