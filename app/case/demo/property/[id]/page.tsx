"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  Share2,
  Bookmark,
  Coins,
  Maximize2,
  BedDouble,
  Clock,
  Sparkles,
  Tag,
  Home,
  AlertTriangle,
} from "lucide-react";
import { CircleButton } from "@/components/ui/CircleButton";
import { WideCard } from "@/components/ui/WideCard";
import { MapView } from "@/components/ui/MapView";
import { ActionBar } from "@/components/ui/ActionBar";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { NeedleBadge } from "@/components/ui/NeedleBadge";
import { useAppStore } from "@/lib/store";

const PROPERTY_IMAGES: Record<string, string> = {
  p1: "/images/p1-exterior.jpg",
  p2: "/images/p2-exterior.jpg",
  p3: "/images/p3-exterior.jpg",
};

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = (params?.id as string) || "p1";

  const {
    properties,
    selectedForVisit,
    toggleSelectForVisit,
    bookmarkedIds,
    toggleBookmark,
  } = useAppStore();

  const [isMapSheetOpen, setIsMapSheetOpen] = useState(false);

  const property = properties.find((p) => p.id === propertyId) || properties[0];
  const isSelected = selectedForVisit.includes(property.id);
  const isBookmarked = bookmarkedIds.includes(property.id);
  const heroImage = PROPERTY_IMAGES[property.id] || "/images/hero-home.jpg";

  // Rank determination
  const rankLabel =
    property.id === "p1"
      ? "الخيار الأنسب • #1"
      : property.id === "p3"
      ? "المنافس الأقرب • #2"
      : "فوق الميزانية • #3";

  // Match reasons from data
  const fitReason =
    property.whyReasons.find((r) => r.category === "الملاءمة")?.description ||
    "تطابق ممتاز مع معيار وقت التنقل لمقر العمل وتوفير وقت الرحلات اليومية.";

  const priceReason =
    property.whyReasons.find((r) => r.category === "السعر")?.description ||
    "سعر المتر يقع ضمن النطاق الطبيعي لصفقات الحي المنفذة حديثاً.";

  const lifestyleReason =
    property.whyReasons.find((r) => r.category === "الحياة اليومية")?.description ||
    "شارع سكني هادئ ونافذ يبعد عن الشرايين التجارية لتفادي الضوضاء والزحام.";

  const riskReason =
    property.whyReasons.find((r) => r.category === "المخاطر")?.description ||
    property.visitPriorityReason;

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between select-none bg-radial-lift"
      dir="rtl"
    >
      {/* Main Content Area */}
      <div className="w-full max-w-[420px] mx-auto px-5 pt-[calc(20px+var(--safe-top))] pb-[calc(105px+var(--safe-bottom))] flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header Row: Back Button + Title 18/600 + Bookmark Button */}
          <div className="flex items-center justify-between">
            <CircleButton
              icon={<ArrowRight className="w-5 h-5 text-sandstone" />}
              ariaLabel="الرجوع للخلف"
              onClick={() => router.back()}
              variant="glass"
            />

            <h1 className="text-[18px] font-semibold text-ink tracking-normal">
              تفاصيل العقار
            </h1>

            <CircleButton
              icon={
                <Bookmark
                  className={`w-5 h-5 ${
                    isBookmarked ? "fill-sandstone text-sandstone" : "text-sandstone"
                  }`}
                />
              }
              ariaLabel="حفظ العقار"
              onClick={() => toggleBookmark(property.id)}
              variant="glass"
            />
          </div>

          {/* Section 1: Compact Hero Photo + Seasoned 4-Metric Strip */}
          <div className="space-y-3">
            {/* Compact Photo Card (185px) */}
            <div className="relative w-full h-[185px] rounded-[28px] overflow-hidden border border-stroke shadow-xl">
              <Image
                src={heroImage}
                alt={property.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover object-center photo-grade"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/50" />

              {/* Top Rank Chip */}
              <div className="absolute top-3.5 start-3.5 z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bawsala-glass text-sandstone shadow-md">
                  <NeedleBadge priority={property.visitPriority} size="sm" variant="dark" />
                  <span className="text-[12px] font-semibold">{rankLabel}</span>
                </div>
              </div>

              {/* Bottom Title & Neighborhood */}
              <div className="absolute bottom-3.5 inset-x-4 z-10">
                <h2 className="text-[18px] font-semibold text-ink leading-snug drop-shadow-sm">
                  {property.title}
                </h2>
                <span className="text-[12px] text-muted block mt-0.5">
                  {property.district}
                </span>
              </div>
            </div>

            {/* Seasoned 4-Metric Quick Strip with Icons */}
            <div className="p-3.5 rounded-[24px] bg-surface-2 border border-stroke shadow-md">
              <div className="grid grid-cols-4 gap-2 text-center divide-x divide-x-reverse divide-stroke/30">
                {/* 1. Price */}
                <div className="flex flex-col items-center justify-center min-w-0">
                  <Coins className="w-4 h-4 text-sandstone mb-1 shrink-0" />
                  <span className="text-[13px] font-semibold text-ink tabular-nums leading-none">
                    <bdi dir="ltr">{Math.round(property.price / 1000)}</bdi> ألف
                  </span>
                  <span className="text-[11px] text-muted mt-1 leading-none">
                    السعر
                  </span>
                </div>

                {/* 2. Area */}
                <div className="flex flex-col items-center justify-center min-w-0">
                  <Maximize2 className="w-4 h-4 text-sandstone mb-1 shrink-0" />
                  <span className="text-[13px] font-semibold text-ink tabular-nums leading-none">
                    <bdi dir="ltr">{property.areaM2}</bdi> م²
                  </span>
                  <span className="text-[11px] text-muted mt-1 leading-none">
                    المساحة
                  </span>
                </div>

                {/* 3. Bedrooms */}
                <div className="flex flex-col items-center justify-center min-w-0">
                  <BedDouble className="w-4 h-4 text-sandstone mb-1 shrink-0" />
                  <span className="text-[13px] font-semibold text-ink tabular-nums leading-none">
                    <bdi dir="ltr">{property.rooms}</bdi> غرف
                  </span>
                  <span className="text-[11px] text-muted mt-1 leading-none">
                    النوم
                  </span>
                </div>

                {/* 4. Commute Time */}
                <div className="flex flex-col items-center justify-center min-w-0">
                  <Clock className="w-4 h-4 text-sandstone mb-1 shrink-0" />
                  <span className="text-[13px] font-semibold text-ink tabular-nums leading-none">
                    <bdi dir="ltr">{property.travelTimeWorkMin}</bdi> د
                  </span>
                  <span className="text-[11px] text-muted mt-1 leading-none">
                    للعمل
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: The 4 Core Analysis Pillars */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[14px] font-semibold text-sandstone block">
                محاور التحليل والتدقيق
              </span>
              <span className="text-[12px] font-medium text-muted">
                4 معايير معتمدة
              </span>
            </div>

            {/* Pillar 1: Fit & Commute */}
            <WideCard
              icon={<Sparkles className="w-4 h-4 text-sandstone" />}
              title="الملاءمة وسهولة التنقل"
              subtitle={`${property.travelTimeWorkMin} دقيقة في الذروة`}
              value={
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-sandstone/15 text-sandstone font-medium">
                  {property.travelTimeWorkMin <= 18 ? "ممتاز" : "مقبول"}
                </span>
              }
            >
              <div className="space-y-1 pt-1.5 text-[12px] border-t border-stroke/40">
                <div className="flex items-start gap-2 text-sandstone">
                  <span className="w-2 h-2 rounded-full bg-sandstone shrink-0 mt-1" title="مؤكد" />
                  <span className="leading-relaxed text-ink">{fitReason}</span>
                </div>
              </div>
            </WideCard>

            {/* Pillar 2: Price & Fair Valuation */}
            <WideCard
              icon={<Tag className="w-4 h-4 text-sandstone" />}
              title="السعر العادل التقديري"
              subtitle={property.fairPriceRange || "نطاق الصفقات المقارنة"}
              value={
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-3 text-sandstone font-medium">
                  {property.isOverBudget ? "فوق الميزانية" : "ضمن الميزانية"}
                </span>
              }
            >
              <div className="space-y-1 pt-1.5 text-[12px] border-t border-stroke/40">
                <div className="flex items-start gap-2 text-sandstone">
                  <span className="w-2 h-2 rounded-full bg-sandstone shrink-0 mt-1" title="مؤشر سعري" />
                  <span className="leading-relaxed text-muted">{priceReason}</span>
                </div>
              </div>
            </WideCard>

            {/* Pillar 3: Lifestyle & Street */}
            <WideCard
              icon={<Home className="w-4 h-4 text-sandstone" />}
              title="طبيعة الحي والشارع"
              subtitle={property.district}
              value={
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-3 text-sandstone font-medium">
                  سكني هادئ
                </span>
              }
            >
              <div className="space-y-1 pt-1.5 text-[12px] border-t border-stroke/40">
                <div className="flex items-start gap-2 text-sandstone">
                  <span className="w-2 h-2 rounded-full border border-muted bg-transparent shrink-0 mt-1" title="ملاحظة موقع" />
                  <span className="leading-relaxed text-muted">{lifestyleReason}</span>
                </div>
              </div>
            </WideCard>

            {/* Pillar 4: Risks & Inspection Points */}
            <WideCard
              icon={<AlertTriangle className="w-4 h-4 text-copper" />}
              title="نقاط الحسم في المعاينة"
              subtitle="يلزم تدقيقها ميدانياً"
              value={
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-copper/20 text-copper font-medium border border-copper/30">
                  نقطة تدقيق
                </span>
              }
            >
              <div className="space-y-1 pt-1.5 text-[12px] border-t border-stroke/40">
                <div className="flex items-start gap-2 text-copper">
                  <span className="w-2 h-2 rounded-full bg-copper shrink-0 mt-1" title="تعارض مصادر" />
                  <span className="leading-relaxed font-medium">{riskReason}</span>
                </div>
              </div>
            </WideCard>
          </div>
        </div>
      </div>

      {/* Pinned Bottom ActionBar [Map circle] [Decisive Pill] [Share circle] */}
      <ActionBar
        primaryLabel={isSelected ? "مُعتمد للمعاينة الميدانية ✓" : "اعتماد هذا العقار للمعاينة"}
        onPrimaryAction={() => toggleSelectForVisit(property.id)}
        startIcon={<MapPin className="w-5 h-5 text-sandstone" />}
        startAriaLabel="عرض الموقع على الخريطة"
        onStartAction={() => setIsMapSheetOpen(true)}
        endIcon={<Share2 className="w-5 h-5 text-sandstone" />}
        endAriaLabel="مشاركة تفاصيل العقار"
        primaryVariant={isSelected ? "glass" : "sandstone"}
        pinned={true}
      />

      {/* GlassSheet for Map View */}
      <GlassSheet
        isOpen={isMapSheetOpen}
        onClose={() => setIsMapSheetOpen(false)}
        title={`موقع ${property.title}`}
        subtitle={`${property.district} · ${property.travelTimeWorkMin} دقيقة لمقر العمل`}
        initialSnap="half"
        variant="dark"
      >
        <div className="pt-2">
          <div className="rounded-[28px] overflow-hidden border border-stroke shadow-lg">
            <MapView
              variant="mini"
              properties={[property]}
              selectedPropertyId={property.id}
              height={260}
            />
          </div>
        </div>
      </GlassSheet>
    </div>
  );
}
