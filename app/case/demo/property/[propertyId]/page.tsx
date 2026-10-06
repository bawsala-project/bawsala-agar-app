"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ChevronUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { VisitPriorityBadge } from "@/components/ui/VisitPriorityBadge";
import { CertaintyChip } from "@/components/ui/CertaintyChip";
import { FitArc } from "@/components/ui/FitArc";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { MapView } from "@/components/ui/MapView";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { BdiNumber, formatNumber } from "@/lib/format";

type PropertyTab = "fit" | "location" | "price" | "daily" | "risks";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = (params?.propertyId as string) || "p1";

  const {
    properties,
    selectedForVisit,
    toggleSelectForVisit,
    showToast,
  } = useAppStore();

  const property = properties.find((p) => p.id === propertyId) || properties[0];
  const isSelected = selectedForVisit.includes(property.id);

  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") as PropertyTab | null;

  const [activeTab, setActiveTab] = useState<PropertyTab>(
    requestedTab && ["fit", "location", "price", "daily", "risks"].includes(requestedTab)
      ? requestedTab
      : "fit"
  );
  const [isSheetOpen, setIsSheetOpen] = useState(requestedTab === "location");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const activeImage = property.images?.[selectedPhotoIndex] || property.images?.[0];

  const tabs: { id: PropertyTab; label: string }[] = [
    { id: "fit", label: "الملاءمة" },
    { id: "location", label: "الموقع" },
    { id: "price", label: "السعر" },
    { id: "daily", label: "الحياة اليومية" },
    { id: "risks", label: "المخاطر" },
  ];

  const handleToggleVisit = () => {
    toggleSelectForVisit(property.id);
    if (!isSelected) {
      showToast(`تمت إضافة ${property.title} لقائمة المعاينة`);
    } else {
      showToast(`تمت إزالة ${property.title} من قائمة المعاينة`);
    }
  };

  const openTabInSheet = (tab: PropertyTab) => {
    setActiveTab(tab);
    setIsSheetOpen(true);
  };

  return (
    <AppShell backHref="/case/demo/results" pageTitle={property.title}>
      <div className="flex-1 flex flex-col justify-between pb-32 max-w-lg mx-auto w-full">
        {/* Full-Bleed Hero with PropertyImage */}
        <div className="relative w-full h-80 overflow-hidden border-b border-[#E9DFD0] text-right select-none">
          <motion.div
            key={activeImage?.file || property.id}
            initial={{ scale: 1.05, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <PropertyImage
              image={activeImage}
              tone={property.colorTone || "sandstone"}
              alt={property.title}
              priority
              fill
              containerClassName="w-full h-full"
            />
          </motion.div>

          {/* Deep Architectural Gradient Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(19,15,8,0.2) 0%, rgba(19,15,8,0.3) 30%, rgba(19,15,8,0.85) 85%, #130F08 100%)",
            }}
          />

          {/* Three Circular Thumbnails to Switch Property (Floating Top) */}
          <div className="absolute top-4 inset-x-0 px-6 flex items-center justify-between z-20" dir="rtl">
            <span className="text-xs font-semibold text-[#FAF6EF] glass-dark px-3 py-1 rounded-full border border-white/20">
              العقارات:
            </span>

            <div className="flex items-center gap-2">
              {properties.map((p) => {
                const isCurrent = p.id === property.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPhotoIndex(0);
                      router.push(`/case/demo/property/${p.id}`);
                    }}
                    className={`w-11 h-11 rounded-full overflow-hidden transition-all cursor-pointer relative shadow-md ${
                      isCurrent
                        ? "border-2 border-[#FAF6EF] scale-110 shadow-[0_0_12px_rgba(250,246,239,0.5)]"
                        : "border border-white/30 opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                    title={p.title}
                  >
                    <PropertyImage
                      image={p.images?.[0]}
                      shape="circle"
                      tone={p.colorTone || "sandstone"}
                      alt={p.title}
                      containerClassName="w-full h-full"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Hero Labels */}
          <div className="absolute bottom-4 inset-x-0 px-6 space-y-2 z-10">
            {/* Gallery Photo Selector (when multiple images are available) */}
            {property.images && property.images.length > 1 && (
              <div className="flex items-center gap-1.5 pb-1">
                {property.images.map((img, photoIdx) => {
                  const isCurrentPhoto = (selectedPhotoIndex % property.images.length) === photoIdx;
                  const kindLabels: Record<string, string> = {
                    exterior: "الواجهة",
                    living: "الصالة",
                    kitchen: "المطبخ",
                    bedroom: "غرفة النوم",
                    balcony: "الشرفة",
                    map: "الخريطة",
                    hero: "الرئيسية",
                  };
                  return (
                    <button
                      key={img.file}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(photoIdx)}
                      className={`text-xs px-2.5 py-0.5 rounded-full transition-all cursor-pointer font-medium ${
                        isCurrentPhoto
                          ? "bg-[#FAF6EF] text-[#130F08] shadow-sm font-semibold scale-105"
                          : "glass-dark text-[#FAF6EF]/75 hover:text-[#FAF6EF] border border-white/15"
                      }`}
                    >
                      {kindLabels[img.kind] || img.kind}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-[#FAF6EF] font-medium">
                {property.sourceLabel}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#130F08]/80 text-[#FAF6EF] border border-white/20">
                {property.district}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <h1 className="text-xl md:text-2xl font-semibold text-[#FAF6EF]">
                {property.title}
              </h1>
              <BdiNumber
                value={formatNumber(property.price)}
                unit="ر.س"
                className="text-2xl font-semibold text-[#FAF6EF]"
              />
            </div>
          </div>
        </div>

        <div className="px-6 pt-5 space-y-5">
          {/* Four-Fact Strip with Hairline Separators and Tiny Certainty Dots */}
          <div className="p-3.5 rounded-2xl glass-light border border-[#130F08]/10 grid grid-cols-4 divide-x divide-x-reverse divide-[#130F08]/10 text-center shadow-xs">
            {/* Fact 1: السعر */}
            <div className="px-1.5 space-y-1">
              <span className="text-xs text-[#130F08]/65 block font-medium">السعر</span>
              <div className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#14756E]" title="مؤكد" />
                <BdiNumber
                  value={formatNumber(property.price)}
                  className="text-xs font-semibold text-[#130F08] truncate"
                />
              </div>
            </div>

            {/* Fact 2: المساحة */}
            <div className="px-1.5 space-y-1">
              <span className="text-xs text-[#130F08]/65 block font-medium">المساحة</span>
              <div className="flex items-center justify-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    property.id === "p1" ? "bg-[#C2643A]" : "bg-[#14756E]"
                  }`}
                  title={property.id === "p1" ? "تعارض مساحة" : "مطابق"}
                />
                <BdiNumber
                  value={property.areaM2}
                  unit="م²"
                  className="text-xs font-semibold text-[#130F08]"
                />
              </div>
            </div>

            {/* Fact 3: مدة العمل */}
            <div className="px-1.5 space-y-1">
              <span className="text-xs text-[#130F08]/65 block font-medium">العمل</span>
              <div className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#14756E]" title="محسوب بدقة" />
                <BdiNumber
                  value={property.travelTimeWorkMin}
                  unit="د"
                  className="text-xs font-semibold text-[#130F08]"
                />
              </div>
            </div>

            {/* Fact 4: الغرف */}
            <div className="px-1.5 space-y-1">
              <span className="text-xs text-[#130F08]/65 block font-medium">الغرف</span>
              <div className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#14756E]" title="مؤكد" />
                <BdiNumber
                  value={property.rooms}
                  unit="غرف"
                  className="text-xs font-semibold text-[#130F08]"
                />
              </div>
            </div>
          </div>

          {/* Advisory Priority Paper Card */}
          <PaperCard className="p-4 flex items-center justify-between gap-3 text-right">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#130F08]/65 block">
                أولوية المعاينة
              </span>
              <p className="text-xs text-[#130F08] font-normal leading-relaxed">
                {property.visitPriorityReason}
              </p>
            </div>
            <div className="shrink-0">
              <VisitPriorityBadge level={property.visitPriority} size="md" />
            </div>
          </PaperCard>

          {/* Tabs Section Triggering GlassSheet */}
          <div className="space-y-3 text-right">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#130F08]/75 font-semibold">
                محاور التحليل وخريطة الموقع:
              </span>
              <button
                type="button"
                onClick={() => setIsSheetOpen(true)}
                className="text-xs text-[#14756E] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>فتح التفاصيل</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => openTabInSheet(tab.id)}
                  className={`p-3.5 rounded-2xl glass-light border text-right transition-all cursor-pointer shadow-xs ${
                    activeTab === tab.id
                      ? "border-[#14756E] bg-white shadow-sm"
                      : "border-[#130F08]/10 hover:border-[#130F08]/25"
                  }`}
                >
                  <span className="text-xs font-semibold text-[#130F08] block">
                    {tab.label}
                  </span>
                  <span className="text-xs text-[#130F08]/60 block mt-1">
                    انقر لعرض البيانات
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-6 bg-gradient-to-t from-[#FAF6EF] via-[#FAF6EF]/95 to-transparent pt-10 z-30 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
            <PrimaryButton
              label={isSelected ? "محدد للمعاينة الميدانية ✓" : COPY.propertyDetail.selectForVisit}
              onClick={handleToggleVisit}
              className={`flex-1 shadow-xl transition-all ${
                isSelected
                  ? "bg-[#14756E] text-[#FAF6EF]"
                  : ""
              }`}
            />
            <button
              type="button"
              onClick={() => router.push("/case/demo/inspection")}
              className="h-14 px-5 rounded-full glass-light border border-[#130F08]/15 text-xs font-semibold text-[#130F08] hover:bg-[#E9DFD0]/60 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              قائمة الفحص
            </button>
          </div>
        </div>
      </div>

      {/* GlassSheet Holding the 4 Tabs */}
      <GlassSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={`تحليل: ${property.title}`}
        subtitle="فحص تفصيلي للملاءمة، السعر، والمخاطر"
        initialSnap="half"
        variant="light"
      >
        <div className="space-y-4">
          {/* Segmented Tab Headers inside Sheet (40px pills) */}
          <div className="p-1 rounded-full glass-light border border-[#130F08]/10 grid grid-cols-5 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`h-9 px-1 text-[11px] font-semibold rounded-full transition-all text-center cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#130F08] text-[#FAF6EF] shadow-xs"
                    : "text-[#130F08]/65 hover:text-[#130F08]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: الملاءمة (Fit) */}
          {activeTab === "fit" && (
            <div className="space-y-3 text-right">
              <div className="flex items-center justify-between py-2 border-b border-[#E9DFD0]">
                <div>
                  <span className="text-xs font-semibold text-[#130F08] block">سقف الميزانية</span>
                  <span className="text-xs text-[#130F08]/65">
                    {property.isOverBudget ? `تجاوز (${property.budgetDelta})` : "مطابق للسقف تماماً"}
                  </span>
                </div>
                <FitArc
                  level={property.isOverBudget ? "acceptable" : "excellent"}
                  label={property.isOverBudget ? "مقبول" : "ممتاز"}
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#E9DFD0]">
                <div>
                  <span className="text-xs font-semibold text-[#130F08] block">القرب من العمل</span>
                  <span className="text-xs text-[#130F08]/65">
                    {property.travelTimeWorkMin} دقيقة عبر المسار المعتاد
                  </span>
                </div>
                <FitArc
                  level={property.travelTimeWorkMin <= 16 ? "excellent" : "good"}
                  label={property.travelTimeWorkMin <= 16 ? "ممتاز" : "جيد"}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-xs font-semibold text-[#130F08] block">عدد الغرف</span>
                  <span className="text-xs text-[#130F08]/65">{property.rooms} غرف نوم وصالة</span>
                </div>
                <FitArc level="excellent" label="ممتاز" />
              </div>
            </div>
          )}

          {/* Tab 2: الموقع (Location) with Full MapView */}
          {activeTab === "location" && (
            <div className="space-y-3.5 text-right">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#130F08]">
                  خريطة الموقع التفاعلية ومسار العمل:
                </span>
                <span className="font-semibold text-[#14756E] px-2.5 py-0.5 rounded-full bg-[#14756E]/10">
                  {property.travelTimeWorkMin} دقيقة لمقر العمل
                </span>
              </div>

              {/* Full Interactive MapView */}
              <MapView
                variant="full"
                selectedPropertyId={property.id}
                className="w-full"
              />

              <div className="p-3.5 rounded-2xl bg-[#FAF6EF] border border-[#E9DFD0] space-y-1.5 text-xs text-right shadow-2xs">
                <span className="font-semibold text-[#130F08] block">
                  تحليل النطاق الجغرافي والربط المروري:
                </span>
                <p className="text-[#130F08]/80 leading-relaxed">
                  يقع العقار في {property.district}، ضمن نطاق دائرة الوصول المستهدفة (20 دقيقة عبر طريق الملك فهد وطريق أنس بن مالك). المسار مباشر نحو مركز الملك عبد الله المالي (KAFD) دون اختناقات رئيسية.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: السعر (Price) */}
          {activeTab === "price" && (
            <div className="space-y-3 text-right">
              {property.fairPriceStatus === "insufficient" ? (
                <div className="p-4 rounded-2xl border border-dashed border-[#E9DFD0] text-center space-y-2 bg-white/50">
                  <span className="text-xs font-semibold text-[#130F08] block">
                    غير كافٍ للتقدير الإحصائي
                  </span>
                  <p className="text-xs text-[#130F08]/70 leading-relaxed">
                    الصفقات الموثقة في هذا المربع العقاري قليلة جداً حالياً.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-[#E9DFD0] space-y-2 shadow-xs">
                  <span className="text-xs text-[#130F08]/65 block font-medium">النطاق السعري الاسترشادي للمتر</span>
                  <span className="text-base font-semibold text-[#130F08] block tabular-nums">
                    {property.fairPriceRange}
                  </span>
                  <div className="text-xs text-[#130F08]/75 pt-1">
                    سعر المتر التقريبي: <BdiNumber value={formatNumber(Math.round(property.price / property.areaM2))} unit="ر.س" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: الحياة اليومية (Daily) */}
          {activeTab === "daily" && (
            <div className="space-y-3 text-right">
              <div className="p-3.5 rounded-2xl bg-white border border-[#E9DFD0] flex items-center justify-between text-xs shadow-xs">
                <span className="font-medium text-[#130F08]">زمن الوصول للعمل</span>
                <BdiNumber value={property.travelTimeWorkMin} unit="دقيقة" className="font-semibold text-[#130F08]" />
              </div>
              <div className="space-y-2">
                {property.facts
                  .filter((f) => f.scope === "micro_location" || f.scope === "neighborhood")
                  .map((fact) => (
                    <div
                      key={fact.id}
                      className="p-3.5 rounded-xl bg-white/70 border border-[#E9DFD0] flex items-start justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#130F08] block">{fact.label}</span>
                        <p className="text-xs text-[#130F08]/75 mt-0.5">{fact.value}</p>
                      </div>
                      <CertaintyChip level={fact.certainty} size="sm" variant="paper" />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Tab 4: المخاطر والمجهولات (Risks) */}
          {activeTab === "risks" && (
            <div className="space-y-2.5 text-right">
              {property.facts
                .filter(
                  (f) =>
                    f.certainty === "conflicting" ||
                    f.certainty === "unknown" ||
                    f.certainty === "inferred"
                )
                .map((fact) => {
                  const isConflict = fact.certainty === "conflicting";
                  return (
                    <div
                      key={fact.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        isConflict
                          ? "bg-[#C2643A]/10 border-[#C2643A]/40 text-[#130F08]"
                          : "bg-white/70 border-[#E9DFD0] text-[#130F08]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#130F08]">{fact.label}</span>
                        <CertaintyChip level={fact.certainty} size="sm" variant="paper" />
                      </div>
                      <p className="text-xs text-[#130F08]/80">{fact.value}</p>
                      {fact.impactExplanation && (
                        <p className="text-xs text-[#C2643A] font-medium pt-1 border-t border-[#130F08]/10">
                          الأثر: {fact.impactExplanation}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </GlassSheet>
    </AppShell>
  );
}
