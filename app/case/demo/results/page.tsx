"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Columns,
  HelpCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import Image from "next/image";
import { CircleButton } from "@/components/ui/CircleButton";
import { Banner } from "@/components/ui/Banner";
import { WideCard } from "@/components/ui/WideCard";
import { ActionBar } from "@/components/ui/ActionBar";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { NeedleBadge } from "@/components/ui/NeedleBadge";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";

const PROPERTY_IMAGES: Record<string, string> = {
  p1: "/images/p1-exterior.jpg",
  p2: "/images/p2-exterior.jpg",
  p3: "/images/p3-exterior.jpg",
};

export default function ResultsPage() {
  const router = useRouter();
  const {
    properties,
    isReassessed,
    bookmarkedIds,
    toggleBookmark,
  } = useAppStore();

  const [isWhySheetOpen, setIsWhySheetOpen] = useState(false);

  // Sort properties by active rank (preRank or postRank if reassessed)
  const sortedProperties = [...properties].sort((a, b) => {
    const rankA = isReassessed ? a.postRank : a.preRank;
    const rankB = isReassessed ? b.postRank : b.preRank;
    return rankA - rankB;
  });

  const winnerProperty = sortedProperties[0] || properties[0];
  const secondProperty = sortedProperties[1] || properties[1] || winnerProperty;
  const thirdProperty = sortedProperties[2] || properties[2] || winnerProperty;

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(winnerProperty.id);
  const activeProperty =
    sortedProperties.find((p) => p.id === selectedPropertyId) || winnerProperty;

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between select-none bg-radial-lift"
      dir="rtl"
    >
      {/* Main Content Area */}
      <div className="w-full max-w-[420px] mx-auto px-5 pt-[calc(20px+var(--safe-top))] pb-[calc(105px+var(--safe-bottom))] flex-1 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Header Row: CircleButton back + Title 18/600 + CircleButton info */}
          <div className="flex items-center justify-between">
            <CircleButton
              icon={<ArrowRight className="w-5 h-5 text-sandstone" />}
              ariaLabel="الرجوع للخلف"
              onClick={() => router.push("/case/demo/properties")}
              variant="glass"
            />

            <h1 className="text-[18px] font-semibold text-ink tracking-normal">
              الأنسب لك
            </h1>

            <CircleButton
              icon={<HelpCircle className="w-5 h-5 text-sandstone" />}
              ariaLabel="تفاصيل المعايير"
              onClick={() => setIsWhySheetOpen(true)}
              variant="glass"
            />
          </div>

          {/* Section 1: 3-Step Horizontal Leaderboard Podium */}
          <div className="space-y-3">
            <div className="flex items-end justify-center gap-2.5 pt-3 pb-1">
              {/* Step 2: Runner-up (Right side in RTL) */}
              <div
                onClick={() => {
                  if (selectedPropertyId === secondProperty.id) {
                    router.push(`/case/demo/property/${secondProperty.id}`);
                  } else {
                    setSelectedPropertyId(secondProperty.id);
                  }
                }}
                className={`relative flex-1 rounded-t-[24px] rounded-b-[18px] overflow-hidden flex flex-col justify-between bg-surface-2 border transition-all cursor-pointer select-none active:scale-[0.98] ${
                  selectedPropertyId === secondProperty.id
                    ? "border-sandstone shadow-md ring-1 ring-sandstone/50"
                    : "border-stroke hover:border-sandstone/40"
                } h-[195px]`}
              >
                {/* Photo Header */}
                <div className="relative w-full h-[76px] shrink-0 overflow-hidden">
                  <Image
                    src={PROPERTY_IMAGES[secondProperty.id] || "/images/hero-home.jpg"}
                    alt={secondProperty.title}
                    fill
                    sizes="120px"
                    className="object-cover photo-grade"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-2 via-black/30 to-black/50" />
                  <div className="absolute top-2 start-2 z-10">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-3 border border-stroke text-sandstone text-[11px] font-semibold shadow-xs">
                      2
                    </span>
                  </div>
                </div>

                {/* Info Body */}
                <div className="p-2 text-center flex flex-col justify-between flex-1">
                  <div className="flex flex-col items-center">
                    <span className="text-[13px] font-semibold text-sandstone leading-tight truncate w-full">
                      حي {secondProperty.district.split("،")[0]}
                    </span>
                    <span className="text-[11px] font-medium text-muted mt-0.5 tabular-nums">
                      <bdi dir="ltr">{Math.round(secondProperty.price / 1000)}</bdi> ألف ر.س
                    </span>
                    <span className="text-[10px] text-muted mt-0.5">
                      <bdi dir="ltr">{secondProperty.travelTimeWorkMin}</bdi> د للعمل
                    </span>
                  </div>

                  {/* Details Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/case/demo/property/${secondProperty.id}`);
                    }}
                    className="w-full mt-1.5 py-1 px-1.5 rounded-full bawsala-glass text-sandstone text-[11px] font-medium flex items-center justify-center gap-1 hover:border-sandstone/60 active:scale-[0.96] transition-all border border-stroke"
                    aria-label={`تفاصيل عقار ${secondProperty.title}`}
                  >
                    <span>التفاصيل</span>
                    <ArrowLeft className="w-3 h-3 stroke-[2]" />
                  </button>
                </div>
              </div>

              {/* Step 1: Winner / Elevated Center (Tallest & Brightest) */}
              <div
                onClick={() => {
                  if (selectedPropertyId === winnerProperty.id) {
                    router.push(`/case/demo/property/${winnerProperty.id}`);
                  } else {
                    setSelectedPropertyId(winnerProperty.id);
                  }
                }}
                className={`relative flex-[1.15] rounded-t-[28px] rounded-b-[20px] overflow-hidden flex flex-col justify-between bg-gradient-to-b from-surface-2 via-surface-2 to-cocoa/40 border-2 transition-all cursor-pointer select-none active:scale-[0.98] z-10 shadow-xl ${
                  selectedPropertyId === winnerProperty.id
                    ? "border-sandstone ring-2 ring-sandstone/40 shadow-sandstone/10"
                    : "border-sandstone/60 hover:border-sandstone"
                } h-[245px]`}
              >
                {/* Photo Header with warm scrim */}
                <div className="relative w-full h-[98px] shrink-0 overflow-hidden">
                  <Image
                    src={PROPERTY_IMAGES[winnerProperty.id] || "/images/hero-home.jpg"}
                    alt={winnerProperty.title}
                    fill
                    sizes="140px"
                    className="object-cover photo-grade"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-2 via-black/25 to-black/60" />

                  {/* Rank 1 Badge with Needle */}
                  <div className="absolute top-2.5 start-2.5 z-10">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sandstone text-espresso text-[11px] font-bold shadow-md">
                      <NeedleBadge priority="high" size="sm" variant="dark" />
                      <span>1</span>
                    </span>
                  </div>

                  <div className="absolute top-2.5 end-2.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(winnerProperty.id);
                      }}
                      className="w-6 h-6 rounded-full bg-espresso/60 flex items-center justify-center text-sandstone"
                      aria-label="حفظ"
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${
                          bookmarkedIds.includes(winnerProperty.id)
                            ? "fill-sandstone text-sandstone"
                            : "text-sandstone"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Info Body */}
                <div className="p-2.5 text-center flex flex-col justify-between flex-1">
                  <div className="flex flex-col items-center">
                    <span className="text-[14px] font-semibold text-ink leading-tight truncate w-full">
                      حي {winnerProperty.district.split("،")[0]}
                    </span>
                    <span className="text-[12px] font-semibold text-sandstone mt-0.5 tabular-nums">
                      <bdi dir="ltr">{Math.round(winnerProperty.price / 1000)}</bdi> ألف ر.س
                    </span>
                    <span className="text-[11px] text-muted mt-0.5">
                      <bdi dir="ltr">{winnerProperty.travelTimeWorkMin}</bdi> د للعمل
                    </span>
                  </div>

                  {/* Details Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/case/demo/property/${winnerProperty.id}`);
                    }}
                    className="w-full mt-2 py-1.5 px-2 rounded-full bg-sandstone text-espresso font-semibold text-[11px] flex items-center justify-center gap-1 hover:brightness-105 active:scale-[0.96] transition-all shadow-xs"
                    aria-label={`تفاصيل عقار ${winnerProperty.title}`}
                  >
                    <span>التفاصيل</span>
                    <ArrowLeft className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Step 3: Third place (Left side in RTL) */}
              <div
                onClick={() => {
                  if (selectedPropertyId === thirdProperty.id) {
                    router.push(`/case/demo/property/${thirdProperty.id}`);
                  } else {
                    setSelectedPropertyId(thirdProperty.id);
                  }
                }}
                className={`relative flex-1 rounded-t-[20px] rounded-b-[16px] overflow-hidden flex flex-col justify-between bg-surface-1 border transition-all cursor-pointer select-none active:scale-[0.98] ${
                  selectedPropertyId === thirdProperty.id
                    ? "border-sandstone shadow-md ring-1 ring-sandstone/50 opacity-100"
                    : "border-stroke/60 hover:border-stroke opacity-85"
                } h-[175px]`}
              >
                {/* Photo Header */}
                <div className="relative w-full h-[64px] shrink-0 overflow-hidden">
                  <Image
                    src={PROPERTY_IMAGES[thirdProperty.id] || "/images/hero-home.jpg"}
                    alt={thirdProperty.title}
                    fill
                    sizes="120px"
                    className="object-cover photo-grade"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-black/40 to-black/60" />
                  <div className="absolute top-2 start-2 z-10">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-1 border border-stroke text-muted text-[10px] font-medium shadow-xs">
                      3
                    </span>
                  </div>
                </div>

                {/* Info Body */}
                <div className="p-2 text-center flex flex-col justify-between flex-1">
                  <div className="flex flex-col items-center">
                    <span className="text-[12px] font-medium text-sandstone leading-tight truncate w-full">
                      حي {thirdProperty.district.split("،")[0]}
                    </span>
                    <span className="text-[11px] text-muted mt-0.5 tabular-nums">
                      <bdi dir="ltr">{Math.round(thirdProperty.price / 1000)}</bdi> ألف ر.س
                    </span>
                    <span className="text-[10px] text-copper mt-0.5 font-medium">
                      فوق الميزانية
                    </span>
                  </div>

                  {/* Details Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/case/demo/property/${thirdProperty.id}`);
                    }}
                    className="w-full mt-1.5 py-1 px-1.5 rounded-full bawsala-glass text-sandstone text-[11px] font-medium flex items-center justify-center gap-1 hover:border-sandstone/60 active:scale-[0.96] transition-all border border-stroke"
                    aria-label={`تفاصيل عقار ${thirdProperty.title}`}
                  >
                    <span>التفاصيل</span>
                    <ArrowLeft className="w-3 h-3 stroke-[2]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Podium Floor Line */}
            <div className="w-full flex items-center justify-between px-2 pt-0.5">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-driftwood/30 to-sandstone/50 rounded-full" />
              <span className="text-[11px] font-medium text-muted px-2.5 shrink-0">
                منصة المراكز الثلاثة
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-driftwood/30 to-sandstone/50 rounded-full" />
            </div>

            {/* Crucial Decision Callout: Close Options Banner */}
            <Banner
              title={COPY.results.closeOptionsNotice}
              description="شقة النرجس توفر 80,000 ر.س لكنها تزيد 6 دقائق عن دوامك. الحسم النهائي يعتمد على ما ستراه في المعاينة."
              buttonAriaLabel="أسباب الترتيب"
              onClick={() => setIsWhySheetOpen(true)}
            />
          </div>

          {/* Section 2: Direct Trade-offs & Alternatives Comparison */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[14px] font-semibold text-sandstone block">
                موجز المفاضلة ونقاط الضعف
              </span>
              <span className="text-[12px] font-medium text-muted">
                <bdi dir="ltr">{sortedProperties.length}</bdi> عقارات تحت التقييم
              </span>
            </div>

            {/* 1. Winner Property (#1) */}
            <WideCard
              title={`1. ${winnerProperty.title}`}
              subtitle={`${winnerProperty.price.toLocaleString("en-US")} ر.س · ${winnerProperty.travelTimeWorkMin} د للعمل`}
              value={
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-sandstone text-espresso font-semibold shrink-0">
                  الخيار الأول
                </span>
              }
              onClick={() => router.push(`/case/demo/property/${winnerProperty.id}`)}
            >
              <div className="space-y-2 pt-2 text-[13px] border-t border-stroke/40">
                <div className="flex items-start gap-2 text-sandstone">
                  <span className="w-2 h-2 rounded-full bg-sandstone shrink-0 mt-1.5" title="ميزة مؤكدة" />
                  <span className="leading-relaxed">
                    <span className="text-ink font-semibold">الميزة: </span>
                    {winnerProperty.keyAdvantage}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-copper">
                  <span className="w-2 h-2 rounded-full bg-copper shrink-0 mt-1.5" title="تعارض مصادر" />
                  <span className="leading-relaxed">
                    <span className="font-semibold">نقطة الحسم: </span>
                    {winnerProperty.keyTradeoff}
                  </span>
                </div>
              </div>
            </WideCard>

            {/* 2. Runner-up Property (#2) */}
            <WideCard
              title={`2. ${secondProperty.title}`}
              subtitle={`${secondProperty.price.toLocaleString("en-US")} ر.س · ${secondProperty.travelTimeWorkMin} د للعمل`}
              value={
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface-3 text-sandstone font-medium shrink-0">
                  وفر 80 ألف
                </span>
              }
              onClick={() => router.push(`/case/demo/property/${secondProperty.id}`)}
            >
              <div className="space-y-2 pt-2 text-[13px] border-t border-stroke/40">
                <div className="flex items-start gap-2 text-sandstone">
                  <span className="w-2 h-2 rounded-full bg-sandstone shrink-0 mt-1.5" title="ميزة مؤكدة" />
                  <span className="leading-relaxed">
                    <span className="text-ink font-semibold">الميزة: </span>
                    {secondProperty.keyAdvantage}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-muted">
                  <span className="w-2 h-2 rounded-full border border-muted bg-transparent shrink-0 mt-1.5" title="تجاوز طفيف" />
                  <span className="leading-relaxed">
                    <span className="text-sandstone font-semibold">المقايضة: </span>
                    {secondProperty.keyTradeoff}
                  </span>
                </div>
              </div>
            </WideCard>

            {/* 3. Disqualified / Third Property (#3) */}
            <WideCard
              title={`3. ${thirdProperty.title}`}
              subtitle={`${thirdProperty.price.toLocaleString("en-US")} ر.س · ${thirdProperty.travelTimeWorkMin} د للعمل`}
              value={
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-copper/15 text-copper font-medium border border-copper/25 shrink-0">
                  فوق الميزانية
                </span>
              }
              onClick={() => router.push(`/case/demo/property/${thirdProperty.id}`)}
            >
              <div className="space-y-2 pt-2 text-[13px] border-t border-stroke/40">
                <div className="flex items-start gap-2 text-sandstone">
                  <span className="w-2 h-2 rounded-full bg-sandstone shrink-0 mt-1.5" title="ميزة مؤكدة" />
                  <span className="leading-relaxed">
                    <span className="text-ink font-semibold">الميزة: </span>
                    {thirdProperty.keyAdvantage}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-copper">
                  <span className="w-2 h-2 rounded-full bg-copper shrink-0 mt-1.5" title="شرط قاطع" />
                  <span className="leading-relaxed">
                    <span className="font-semibold">المقايضة: </span>
                    {thirdProperty.keyTradeoff}
                  </span>
                </div>
              </div>
            </WideCard>
          </div>
        </div>
      </div>

      {/* Pinned Bottom ActionBar: [compare circle] [decisive pill "المعاينة"] [info circle] */}
      <ActionBar
        primaryLabel={
          selectedPropertyId === winnerProperty.id
            ? "المعاينة الميدانية للياسمين"
            : `المعاينة الميدانية لـ ${activeProperty.district.split("،")[0]}`
        }
        onPrimaryAction={() => router.push("/case/demo/inspection")}
        startIcon={<Columns className="w-5 h-5 text-sandstone" />}
        startAriaLabel="مقارنة كاملة"
        onStartAction={() => router.push("/case/demo/compare")}
        endIcon={<HelpCircle className="w-5 h-5 text-sandstone" />}
        endAriaLabel="تفاصيل المعايير"
        onEndAction={() => setIsWhySheetOpen(true)}
        primaryVariant="sandstone"
        pinned={true}
      />

      {/* GlassSheet for "لماذا هذا الترتيب؟" detailed criteria breakdown */}
      <GlassSheet
        isOpen={isWhySheetOpen}
        onClose={() => setIsWhySheetOpen(false)}
        title="أسباب الترتيب والمفاضلة"
        subtitle={`تحليل معايير المفاضلة لـ ${activeProperty.title}`}
        initialSnap="half"
        variant="dark"
      >
        <div className="space-y-4 pt-2">
          {/* Close Options Explanation */}
          <div className="p-4 rounded-[20px] bg-surface-2 border border-stroke space-y-1.5">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sandstone" />
              <span className="text-[14px] font-semibold text-ink">
                {COPY.results.closeOptionsNotice}
              </span>
            </div>
            <p className="text-[13px] text-muted leading-relaxed">
              {COPY.results.closeOptionsDesc}
            </p>
          </div>

          {/* Why Reasons Breakdown */}
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-muted block">
              أسباب الترتيب وفق معطياتك:
            </span>
            <div className="space-y-2.5">
              {activeProperty.whyReasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-[18px] bg-surface-2 border border-stroke space-y-1 text-right"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-sandstone">
                      {reason.title}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-3 text-sandstone">
                      {reason.category}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Info / Inspection Points */}
          <div className="p-4 rounded-[20px] bg-surface-2 border border-copper/30 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-copper" />
              <span className="text-[14px] font-semibold text-ink">
                نقاط الحسم في المعاينة الميدانية
              </span>
            </div>
            <p className="text-[12px] text-muted leading-relaxed">
              {activeProperty.visitPriorityReason}
            </p>
          </div>
        </div>
      </GlassSheet>
    </div>
  );
}
