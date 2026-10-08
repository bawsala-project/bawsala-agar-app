"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  Columns,
  HelpCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { CircleButton } from "@/components/ui/CircleButton";
import { PhotoCard } from "@/components/ui/PhotoCard";
import { StatCard } from "@/components/ui/StatCard";
import { MapView } from "@/components/ui/MapView";
import { ActionBar } from "@/components/ui/ActionBar";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { NeedleBadge } from "@/components/ui/NeedleBadge";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { formatNumber } from "@/lib/format";

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

  const [centeredIndex, setCenteredIndex] = useState(0);
  const [isWhySheetOpen, setIsWhySheetOpen] = useState(false);

  // Sort properties by active rank (preRank or postRank if reassessed)
  const sortedProperties = [...properties].sort((a, b) => {
    const rankA = isReassessed ? a.postRank : a.preRank;
    const rankB = isReassessed ? b.postRank : b.preRank;
    return rankA - rankB;
  });

  const centeredProperty = sortedProperties[centeredIndex] || sortedProperties[0];

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between select-none bg-radial-lift"
      dir="rtl"
    >
      {/* Main Content Area */}
      <div className="w-full max-w-[420px] mx-auto px-5 pt-[calc(20px+var(--safe-top))] pb-[calc(100px+var(--safe-bottom))] flex-1 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Header Row: CircleButton back + Small Title 18/600 + CircleButton info */}
          <div className="flex items-center justify-between">
            <CircleButton
              icon={<ArrowRight className="w-5 h-5 text-sandstone" />}
              ariaLabel="الرجوع للخلف"
              onClick={() => router.push("/case/demo/properties")}
              variant="glass"
            />

            {/* Small Title "الأنسب لك" per DESIGN_RULES: section title 18 / 600 */}
            <h2 className="text-[18px] font-semibold text-ink tracking-normal">
              الأنسب لك
            </h2>

            <CircleButton
              icon={<HelpCircle className="w-5 h-5 text-sandstone" />}
              ariaLabel="لماذا هذا الترتيب؟"
              onClick={() => setIsWhySheetOpen(true)}
              variant="glass"
            />
          </div>

          {/* Section 1: Large PhotoCard Carousel + 3 StatCards */}
          <div className="space-y-3">
            {/* Carousel: One centered with side peeks */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-5 px-5 py-1">
              {sortedProperties.map((property, idx) => {
                const imageSrc = PROPERTY_IMAGES[property.id] || "/images/hero-home.jpg";
                const isCentered = idx === centeredIndex;

                return (
                  <div
                    key={property.id}
                    onClick={() => setCenteredIndex(idx)}
                    className={`w-[84vw] max-w-[340px] shrink-0 snap-center cursor-pointer transition-opacity duration-200 ${
                      isCentered ? "opacity-100" : "opacity-60"
                    }`}
                  >
                    <PhotoCard
                      imageSrc={imageSrc}
                      imageAlt={property.title}
                      title={property.title}
                      subtitle={property.district}
                      topChipLabel={property.title}
                      topChipIcon={
                        <NeedleBadge
                          priority={property.visitPriority}
                          size="sm"
                          variant="dark"
                        />
                      }
                      chips={[
                        property.formattedPrice,
                        `${property.areaM2} م²`,
                        `${property.travelTimeWorkMin} دقيقة للعمل`,
                      ]}
                      pillLabel="التفاصيل"
                      onPillAction={() => router.push(`/case/demo/property/${property.id}`)}
                      circleActions={[
                        {
                          icon: (
                            <Bookmark
                              className={`w-4 h-4 ${
                                bookmarkedIds.includes(property.id)
                                  ? "fill-sandstone text-sandstone"
                                  : "text-sandstone"
                              }`}
                            />
                          ),
                          ariaLabel: "حفظ العقار",
                          onClick: () => toggleBookmark(property.id),
                        },
                      ]}
                      height={400}
                    />
                  </div>
                );
              })}
            </div>

            {/* 3 StatCards (السعر، المساحة، الوقت للعمل) for the centered property */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <StatCard
                label="السعر"
                value={formatNumber(Math.round(centeredProperty.price / 1000))}
                unit="ألف ر.س"
              />
              <StatCard
                label="المساحة"
                value={centeredProperty.areaM2}
                unit="م²"
              />
              <StatCard
                label="الوقت للعمل"
                value={centeredProperty.travelTimeWorkMin}
                unit="دقيقة"
              />
            </div>
          </div>

          {/* Section 2: Mini MapView */}
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-muted px-1 block">
              نطاق الوصول والتنقل
            </span>
            <div className="rounded-[28px] overflow-hidden border border-stroke shadow-lg">
              <MapView
                variant="mini"
                properties={sortedProperties}
                selectedPropertyId={centeredProperty.id}
                onSelectProperty={(id) => {
                  const idx = sortedProperties.findIndex((p) => p.id === id);
                  if (idx >= 0) setCenteredIndex(idx);
                }}
                height={144}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Bottom ActionBar: [compare circle] [pill "المعاينة"] [info circle] */}
      <ActionBar
        primaryLabel="المعاينة"
        onPrimaryAction={() => router.push("/case/demo/inspection")}
        startIcon={<Columns className="w-5 h-5 text-sandstone" />}
        startAriaLabel="مقارنة العقارات"
        onStartAction={() => router.push("/case/demo/compare")}
        endIcon={<HelpCircle className="w-5 h-5 text-sandstone" />}
        endAriaLabel="لماذا هذا الترتيب؟"
        onEndAction={() => setIsWhySheetOpen(true)}
        primaryVariant="sandstone"
        pinned={true}
      />

      {/* GlassSheet for "لماذا؟", close-options, and missing-info explanations */}
      <GlassSheet
        isOpen={isWhySheetOpen}
        onClose={() => setIsWhySheetOpen(false)}
        title="أسباب الترتيب والمفاضلة"
        subtitle={`تحليل معايير المفاضلة لـ ${centeredProperty.title}`}
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
              {centeredProperty.whyReasons.map((reason, idx) => (
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
              {centeredProperty.visitPriorityReason}
            </p>
          </div>
        </div>
      </GlassSheet>
    </div>
  );
}
