"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Edit3, SlidersHorizontal, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { OnboardingCTA } from "@/components/ui/OnboardingCTA";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { BdiNumber, formatNumber } from "@/lib/format";

export default function NeedsPage() {
  const { userNeed, updateHardBudget, updatePreferencePriority } = useAppStore();
  const [editingBudget, setEditingBudget] = useState(false);
  const [editingPref, setEditingPref] = useState<string | null>(null);
  const [tempBudget, setTempBudget] = useState(userNeed.hardConstraint.numericBudget);

  const activePref = userNeed.preferences.find((p) => p.id === editingPref);

  const handleSaveBudget = () => {
    updateHardBudget(tempBudget);
    setEditingBudget(false);
  };

  return (
    <AppShell showStepper activeStep="needs">
      <div className="px-5 py-6 flex-1 flex flex-col justify-between max-w-md mx-auto w-full" dir="rtl">
        <div className="space-y-6">
          {/* Headline and Subtitle */}
          <div className="space-y-1.5 text-right">
            <span className="eyebrow-caption text-[#130F08]/65 block font-medium">
              الخطوة 01 // مراجعة الشروط
            </span>
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#130F08]">
              {COPY.needs.title}
            </h1>
            <p className="text-xs text-[#130F08]/70 leading-relaxed">
              {COPY.needs.subtitle}
            </p>
          </div>

          {/* 1. Hard Constraint Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-[#130F08]/65 px-1">
              <span className="font-semibold text-[#130F08] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#14756E]" />
                <span>{COPY.needs.hardConstraintHeader}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setTempBudget(userNeed.hardConstraint.numericBudget);
                  setEditingBudget(true);
                }}
                className="inline-flex items-center gap-1 text-xs text-[#14756E] hover:underline transition-colors cursor-pointer font-medium"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل السقف</span>
              </button>
            </div>

            {/* Filled Hero Card with Ivory-to-Sand Gradient */}
            <div
              className="relative p-6 rounded-3xl overflow-hidden text-right border border-[#E9DFD0] shadow-sm"
              style={{
                background: "linear-gradient(135deg, #FAF6EF 0%, #E9DFD0 100%)",
              }}
            >
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#130F08]/65 block font-medium">
                      {userNeed.hardConstraint.title}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#14756E]/12 text-[#14756E] border border-[#14756E]/30">
                      شرط قاطع
                    </span>
                  </div>

                  {/* Budget with Tabular Numerals wrapped in BdiNumber */}
                  <div className="pt-1 pb-1">
                    <BdiNumber
                      value={formatNumber(userNeed.hardConstraint.numericBudget)}
                      unit="ر.س"
                      className="text-3xl sm:text-4xl text-[#130F08] font-semibold tracking-normal block leading-none"
                    />
                  </div>
                </div>

                {/* Tactile Lock Glyph Emblem */}
                <div className="w-12 h-12 rounded-full glass-light border border-[#130F08]/10 flex items-center justify-center text-[#14756E] shrink-0 shadow-xs">
                  <Lock className="w-5 h-5 text-[#14756E]" />
                </div>
              </div>

              <div className="relative z-10 mt-4 pt-3 border-t border-[#130F08]/10 flex items-center justify-between text-xs text-[#130F08]/75">
                <p className="leading-relaxed">
                  {COPY.needs.hardConstraintTip}
                </p>
              </div>
            </div>
          </motion.div>

          {/* 2. Preferences Cards: Glass cards with 3-dot priority control and edit trigger */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.45 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-xs text-[#130F08]/65 px-1">
              <span className="font-semibold text-[#130F08]">{COPY.needs.preferencesHeader}</span>
              <span className="text-xs text-[#130F08]/65">{COPY.needs.preferencesTip}</span>
            </div>

            {userNeed.preferences.map((pref) => {
              const activeDotsCount =
                pref.priority === "high" ? 3 : pref.priority === "medium" ? 2 : 1;

              return (
                <GlassCard
                  key={pref.id}
                  variant="light"
                  className="p-4 flex items-center justify-between transition-all hover:border-[#130F08]/25 group shadow-xs"
                >
                  <div className="space-y-1.5 text-right flex-1 min-w-0 pr-1">
                    <span className="text-xs text-[#130F08]/65 block font-medium">
                      {pref.title}
                    </span>
                    <span className="text-sm font-semibold text-[#130F08] block truncate">
                      {pref.value}
                    </span>

                    {/* 3-Dot Priority Interactive Selector */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-full border border-[#130F08]/10">
                        {(["low", "medium", "high"] as const).map((pLevel, dotIdx) => {
                          const isDotActive = dotIdx < activeDotsCount;
                          return (
                            <button
                              key={pLevel}
                              type="button"
                              onClick={() => updatePreferencePriority(pref.id, pLevel)}
                              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                                isDotActive
                                  ? "bg-[#14756E] scale-110 shadow-xs"
                                  : "bg-[#130F08]/20 hover:bg-[#130F08]/40"
                              }`}
                              title={`تعيين الأولوية كـ ${pLevel}`}
                              aria-label={`تحديد ${pLevel}`}
                            />
                          );
                        })}
                      </div>

                      <span className="text-xs text-[#130F08]/75 font-medium">
                        {pref.priorityLabel}
                      </span>
                    </div>
                  </div>

                  {/* Edit Pencil Button -> 48px glass circle */}
                  <button
                    type="button"
                    onClick={() => setEditingPref(pref.id)}
                    className="w-11 h-11 rounded-full glass-light border border-[#130F08]/10 text-[#130F08] hover:bg-[#E9DFD0]/60 flex items-center justify-center cursor-pointer transition-colors active:scale-95 shrink-0 mr-3 shadow-xs"
                    title="تعديل هذا التفضيل"
                    aria-label={`تعديل ${pref.title}`}
                  >
                    <Edit3 className="w-4 h-4 text-[#130F08]" />
                  </button>
                </GlassCard>
              );
            })}

            <p className="text-xs text-[#130F08]/65 text-center pt-2">
              {COPY.needs.footerNotice}
            </p>
          </motion.div>
        </div>

        {/* Sticky Action Footer */}
        <div className="pt-6 pb-2">
          <OnboardingCTA
            label={COPY.needs.cta}
            href="/case/demo/properties"
          />
        </div>
      </div>

      {/* GlassSheet for Editing Budget */}
      <GlassSheet
        isOpen={editingBudget}
        onClose={() => setEditingBudget(false)}
        title="تعديل الميزانية القصوى"
        subtitle="الشرط الصارم غير القابل للتفاوض في المفاضلة"
        initialSnap="half"
      >
        <div className="space-y-6 pt-2">
          {/* Display Amount */}
          <div className="p-5 rounded-2xl bg-white border border-[#E9DFD0] text-center space-y-1 shadow-xs">
            <span className="text-xs text-[#130F08]/65 block font-medium">السقف المالي المعتمد</span>
            <BdiNumber
              value={formatNumber(tempBudget)}
              unit="ر.س"
              className="text-3xl font-semibold text-[#130F08] block"
            />
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#130F08]/65 font-medium">
              <span>700 ألف</span>
              <span>1.5 مليون</span>
            </div>
            <input
              type="range"
              min={700000}
              max={1500000}
              step={25000}
              value={tempBudget}
              onChange={(e) => setTempBudget(Number(e.target.value))}
              className="w-full h-2 rounded-lg bg-[#E9DFD0] appearance-none cursor-pointer accent-[#14756E]"
            />
          </div>

          <PrimaryButton
            onClick={handleSaveBudget}
            fullWidth
            label="حفظ الميزانية الجديدة"
          />
        </div>
      </GlassSheet>

      {/* GlassSheet for Editing Preferences */}
      <GlassSheet
        isOpen={!!editingPref}
        onClose={() => setEditingPref(null)}
        title={activePref ? `تعديل: ${activePref.title}` : "تعديل التفضيل"}
        subtitle="اختر مستوى الأهمية لتوجيه الترتيب"
        initialSnap="peek"
      >
        {activePref && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              {(["high", "medium", "low"] as const).map((level) => {
                const isCurrent = activePref.priority === level;
                const label =
                  level === "high" ? "أولوية مرتفعة" : level === "medium" ? "أولوية متوسطة" : "أولوية منخفضة";

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      updatePreferencePriority(activePref.id, level);
                      setEditingPref(null);
                    }}
                    className={`w-full p-4 rounded-2xl border text-right flex items-center justify-between transition-colors cursor-pointer ${
                      isCurrent
                        ? "bg-[#FAF6EF] border-[#14756E] text-[#14756E] font-semibold"
                        : "glass-light border-[#130F08]/10 text-[#130F08] hover:bg-[#E9DFD0]/60"
                    }`}
                  >
                    <span>{label}</span>
                    {isCurrent && <Check className="w-4 h-4 text-[#14756E]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </GlassSheet>
    </AppShell>
  );
}
