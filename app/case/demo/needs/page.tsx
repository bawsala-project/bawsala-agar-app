"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, SlidersHorizontal, Check } from "lucide-react";
import { CircleButton } from "@/components/ui/CircleButton";
import { Banner } from "@/components/ui/Banner";
import { StatCard } from "@/components/ui/StatCard";
import { GlassPill } from "@/components/ui/GlassPill";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { formatNumber } from "@/lib/format";

export default function NeedsPage() {
  const router = useRouter();
  const { userNeed, updateHardBudget, updatePreferencePriority, selectedCity, selectedDistrict } = useAppStore();

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<"budget" | "proximity" | "bedrooms">("budget");
  const [tempBudget, setTempBudget] = useState(userNeed.hardConstraint.numericBudget);

  const handleOpenEdit = (target: "budget" | "proximity" | "bedrooms") => {
    setEditingTarget(target);
    setTempBudget(userNeed.hardConstraint.numericBudget);
    setIsEditSheetOpen(true);
  };

  const handleSaveBudget = (budgetVal: number) => {
    updateHardBudget(budgetVal);
    setIsEditSheetOpen(false);
  };

  const proximityPref = userNeed.preferences.find((p) => p.id === "proximity") || userNeed.preferences[0];
  const bedroomsPref = userNeed.preferences.find((p) => p.id === "bedrooms") || userNeed.preferences[1];

  const BUDGET_PRESETS = [750000, 850000, 900000, 950000, 1000000];

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between select-none bg-radial-lift"
      dir="rtl"
    >
      {/* Main Content Area (Max 1 title, 2 sections, 1 primary action) */}
      <div className="w-full max-w-[420px] mx-auto px-5 pt-[calc(20px+var(--safe-top))] pb-[calc(24px+var(--safe-bottom))] flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header Row: CircleButton back */}
          <div className="flex items-center justify-between">
            <CircleButton
              icon={<ArrowRight className="w-5 h-5 text-sandstone" />}
              ariaLabel="الرجوع للخلف"
              onClick={() => router.back()}
              variant="glass"
            />
            <span className="text-[13px] font-medium text-muted">
              خطوة <bdi dir="ltr">1</bdi> من <bdi dir="ltr">5</bdi>
            </span>
          </div>

          {/* Huge Title: "احتياجك" with Location */}
          <div className="space-y-1">
            <h1 className="text-[40px] md:text-[48px] font-light text-ink leading-[1.15] tracking-normal">
              احتياجك
            </h1>
            <p className="text-[14px] text-muted font-normal">
              {selectedCity || "الرياض"} · {selectedDistrict || "الياسمين"}
            </p>
          </div>

          {/* Section 1: Banner with the hard budget (big number + unit) */}
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-muted px-1 block">
              الشرط الأساسي
            </span>
            <Banner
              title="سقف الميزانية الصارم"
              value={
                <>
                  <bdi dir="ltr" className="text-[36px] font-medium text-ink leading-none tabular-nums">
                    {formatNumber(userNeed.hardConstraint.numericBudget)}
                  </bdi>
                  <span className="text-[14px] font-normal text-muted leading-none">
                    ر.س
                  </span>
                </>
              }
              description={COPY.needs.hardConstraintTip || "أي خيار يتجاوز هذا السعر يعتبر غير مطابق"}
              onClick={() => handleOpenEdit("budget")}
              buttonAriaLabel="تعديل الميزانية"
            />
          </div>

          {/* Section 2: Two StatCards for the two preferences */}
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-muted px-1 block">
              التفضيلات
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Proximity StatCard */}
              <StatCard
                label={proximityPref?.title || "القرب من مقر العمل"}
                value="20"
                unit="دقيقة"
                icon={<SlidersHorizontal className="w-4 h-4 text-sandstone" />}
                iconAriaLabel="تعديل وقت التنقل"
                onIconClick={() => handleOpenEdit("proximity")}
              />

              {/* Bedrooms StatCard */}
              <StatCard
                label={bedroomsPref?.title || "عدد غرف النوم"}
                value="3"
                unit="غرف"
                icon={<SlidersHorizontal className="w-4 h-4 text-sandstone" />}
                iconAriaLabel="تعديل عدد الغرف"
                onIconClick={() => handleOpenEdit("bedrooms")}
              />
            </div>
          </div>
        </div>

        {/* One Primary Action (GlassPill 56px in sandstone) */}
        <div className="pt-6">
          <GlassPill
            label={COPY.needs.cta || "إضافة العقارات"}
            size="56"
            variant="sandstone"
            showArrow
            fullWidth
            onClick={() => router.push("/case/demo/properties")}
          />
        </div>
      </div>

      {/* GlassSheet for editing constraints and preferences */}
      <GlassSheet
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        title={
          editingTarget === "budget"
            ? "تعديل سقف الميزانية"
            : editingTarget === "proximity"
            ? "تعديل تفضيل التنقل"
            : "تعديل عدد الغرف"
        }
        subtitle="عدّل المحددات بما يناسب قدرتك واحتياجك الفعلي"
        initialSnap="half"
        variant="dark"
      >
        <div className="space-y-4 pt-2">
          {editingTarget === "budget" && (
            <div className="space-y-4">
              <div className="p-4 rounded-[20px] bg-surface-2 border border-stroke flex items-center justify-between">
                <span className="text-[14px] text-muted">السقف المحدد:</span>
                <div className="flex items-baseline gap-1.5">
                  <bdi dir="ltr" className="text-[28px] font-medium text-ink tabular-nums">
                    {formatNumber(tempBudget)}
                  </bdi>
                  <span className="text-[13px] text-muted">ر.س</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[13px] font-medium text-muted block">
                  خيارات مسبقة:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {BUDGET_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTempBudget(preset)}
                      className={`h-11 px-3 rounded-full text-[13px] font-medium transition-all flex items-center justify-between cursor-pointer ${
                        tempBudget === preset
                          ? "bg-sandstone text-espresso font-semibold"
                          : "bg-surface-2 text-muted border border-stroke hover:text-sandstone"
                      }`}
                    >
                      <bdi dir="ltr">{formatNumber(preset)}</bdi>
                      <span>ر.س</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <GlassPill
                  label="اعتماد الميزانية"
                  size="48"
                  variant="sandstone"
                  fullWidth
                  onClick={() => handleSaveBudget(tempBudget)}
                />
              </div>
            </div>
          )}

          {editingTarget === "proximity" && (
            <div className="space-y-3">
              <span className="text-[13px] font-medium text-muted block">
                أقصى وقت تنقل مقبول:
              </span>
              {[
                { id: "high", time: "15 دقيقة", label: "أولوية قصوى (حتى 15 د)" },
                { id: "medium", time: "20 دقيقة", label: "أولوية متوسطة (حتى 20 د)" },
                { id: "low", time: "30 دقيقة", label: "أولوية عادية (حتى 30 د)" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    updatePreferencePriority("proximity", opt.id as "high" | "medium" | "low");
                    setIsEditSheetOpen(false);
                  }}
                  className="w-full p-4 rounded-[20px] bg-surface-2 border border-stroke hover:bg-surface-3 transition-all flex items-center justify-between text-right cursor-pointer"
                >
                  <span className="text-[15px] font-medium text-sandstone">
                    {opt.label}
                  </span>
                  {proximityPref.priority === opt.id && (
                    <Check className="w-5 h-5 text-sandstone" />
                  )}
                </button>
              ))}
            </div>
          )}

          {editingTarget === "bedrooms" && (
            <div className="space-y-3">
              <span className="text-[13px] font-medium text-muted block">
                عدد الغرف المطلوب:
              </span>
              {[
                { id: "high", rooms: "3 غرف", label: "3 غرف نوم مؤكدة (شرط حرج)" },
                { id: "medium", rooms: "3 غرف", label: "3 غرف نوم مفضلة" },
                { id: "low", rooms: "2 غرف+", label: "غرفتان أو أكثر مقبولة" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    updatePreferencePriority("bedrooms", opt.id as "high" | "medium" | "low");
                    setIsEditSheetOpen(false);
                  }}
                  className="w-full p-4 rounded-[20px] bg-surface-2 border border-stroke hover:bg-surface-3 transition-all flex items-center justify-between text-right cursor-pointer"
                >
                  <span className="text-[15px] font-medium text-sandstone">
                    {opt.label}
                  </span>
                  {bedroomsPref.priority === opt.id && (
                    <Check className="w-5 h-5 text-sandstone" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </GlassSheet>
    </div>
  );
}
