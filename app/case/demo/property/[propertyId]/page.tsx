"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, PanInfo } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { VisitPriorityBadge } from "@/components/ui/VisitPriorityBadge";
import { CertaintyChip } from "@/components/ui/CertaintyChip";
import { FitArc } from "@/components/ui/FitArc";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { MapView } from "@/components/ui/MapView";
import { useAppStore } from "@/lib/store";
import { BdiNumber, formatNumber } from "@/lib/format";

type PropertyTab = "fit" | "location" | "price" | "daily" | "risks";
type SheetSnap = "peek" | "half" | "full";

const SNAP_HEIGHTS: Record<SheetSnap, string> = {
  peek: "32vh",
  half: "58vh",
  full: "88vh",
};

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
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>(
    requestedTab === "location" ? "half" : "half"
  );
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const images = property.images && property.images.length > 0 ? property.images : [];
  const activeImage = images[selectedPhotoIndex % (images.length || 1)] || null;

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
      showToast(`تمت إضافة ${property.title} لقائمة المعاينة الميدانية`);
    } else {
      showToast(`تمت إزالة ${property.title} من قائمة المعاينة`);
    }
  };

  const nextPhoto = () => {
    if (images.length > 1) {
      setSelectedPhotoIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevPhoto = () => {
    if (images.length > 1) {
      setSelectedPhotoIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const deltaY = info.offset.y;
    const velocityY = info.velocity.y;

    if (deltaY > 80 || velocityY > 400) {
      if (sheetSnap === "full") setSheetSnap("half");
      else if (sheetSnap === "half") setSheetSnap("peek");
    } else if (deltaY < -80 || velocityY < -400) {
      if (sheetSnap === "peek") setSheetSnap("half");
      else if (sheetSnap === "half") setSheetSnap("full");
    }
  };

  return (
    <AppShell backHref="/case/demo/results" pageTitle={property.title}>
      <div className="relative w-full h-[calc(100vh-64px)] max-w-lg mx-auto overflow-hidden bg-[#FAF6EF]">
        {/* BLOCK 1: Circular Thumbnails to Switch Properties (Floating Top Bar) */}
        <div className="absolute top-3 inset-x-0 px-4 z-20 flex items-center justify-between pointer-events-none" dir="rtl">
          <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-full glass-dark border border-white/20 shadow-md">
            <span className="text-[11px] font-semibold text-[#FAF6EF] px-2">العقارات:</span>
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
                  className={`w-12 h-12 rounded-full overflow-hidden transition-all cursor-pointer relative flex items-center justify-center ${
                    isCurrent
                      ? "ring-2 ring-[#C2A370] ring-offset-2 ring-offset-[#130F08] scale-105 shadow-md"
                      : "opacity-60 hover:opacity-100 hover:scale-100"
                  }`}
                  title={p.title}
                  aria-label={`الانتقال إلى ${p.title}`}
                >
                  <PropertyImage
                    image={p.images?.[0]}
                    shape="circle"
                    tone={p.colorTone || "sandstone"}
                    alt={p.title}
                    containerClassName="w-full h-full"
                  />
                  {isCurrent && (
                    <div className="absolute inset-0 bg-black/15 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Inspection Action Pill */}
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={() => router.push("/case/demo/inspection")}
              className="h-11 px-3.5 rounded-full glass-dark border border-white/20 text-xs font-semibold text-[#FAF6EF] hover:bg-black/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              title="قائمة الفحص الميداني"
            >
              <ClipboardList className="w-4 h-4 text-[#C2A370]" />
              <span className="hidden xs:inline">فحص</span>
            </button>
          </div>
        </div>

        {/* BLOCK 2: Full-Bleed Photo Carousel */}
        <div className="absolute inset-0 w-full h-[68vh] overflow-hidden select-none">
          <motion.div
            key={activeImage?.file || property.id}
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full relative"
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

          {/* Architectural Gradient Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(19,15,8,0.4) 0%, rgba(19,15,8,0.1) 35%, rgba(19,15,8,0.6) 80%, rgba(19,15,8,0.95) 100%)",
            }}
          />

          {/* Photo Carousel Controls & Max 3 Chips */}
          <div className="absolute top-20 inset-x-0 px-4 flex items-center justify-between z-10 pointer-events-none" dir="rtl">
            {/* Max 3 Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full glass-dark text-[#FAF6EF] border border-white/20">
                {property.district}
              </span>
              <div className="scale-90 origin-right">
                <VisitPriorityBadge level={property.visitPriority} size="sm" />
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-[#FAF6EF]">
                {property.sourceLabel}
              </span>
            </div>
          </div>

          {/* Left/Right Photo Carousel Arrows (at least 48px tap targets) */}
          {images.length > 1 && (
            <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between z-10 pointer-events-none">
              <button
                type="button"
                onClick={prevPhoto}
                className="w-12 h-12 rounded-full glass-dark border border-white/20 text-[#FAF6EF] flex items-center justify-center pointer-events-auto hover:bg-black/60 transition-colors cursor-pointer shadow-md"
                aria-label="الصورة السابقة"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={nextPhoto}
                className="w-12 h-12 rounded-full glass-dark border border-white/20 text-[#FAF6EF] flex items-center justify-center pointer-events-auto hover:bg-black/60 transition-colors cursor-pointer shadow-md"
                aria-label="الصورة التالية"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Carousel Photo Dots (Bottom of photo area) */}
          {images.length > 1 && (
            <div className="absolute bottom-[34vh] inset-x-0 flex items-center justify-center gap-2 z-10">
              {images.map((img, idx) => (
                <button
                  key={img.file}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    (selectedPhotoIndex % images.length) === idx
                      ? "w-7 bg-[#C2A370]"
                      : "w-2.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`عرض الصورة ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* BLOCK 3: Glass Bottom Sheet with 3 Snaps */}
        <motion.div
          animate={{ height: SNAP_HEIGHTS[sheetSnap] }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.1, bottom: 0.2 }}
          onDragEnd={handleDragEnd}
          className="absolute bottom-0 inset-x-0 z-30 flex flex-col bg-[#FAF6EF]/95 backdrop-blur-xl border-t border-[#E9DFD0] rounded-t-3xl shadow-[0_-12px_32px_rgba(19,15,8,0.12)] text-right"
          dir="rtl"
        >
          {/* Snap Drag Handle & Snap Cycle Toggle */}
          <div
            className="w-full pt-2.5 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
            onClick={() => {
              if (sheetSnap === "peek") setSheetSnap("half");
              else if (sheetSnap === "half") setSheetSnap("full");
              else setSheetSnap("peek");
            }}
          >
            <div className="w-12 h-1.5 rounded-full bg-[#130F08]/20 hover:bg-[#130F08]/40 transition-colors" />
            <div className="flex items-center gap-1 mt-1 text-[10px] text-[#130F08]/50">
              <span>{sheetSnap === "peek" ? "اسحب للتفاصيل" : sheetSnap === "half" ? "اسحب للتوسيع" : "اسحب للأسفل"}</span>
              {sheetSnap === "peek" ? <ChevronUp className="w-3 h-3" /> : sheetSnap === "full" ? <ChevronDown className="w-3 h-3" /> : null}
            </div>
          </div>

          {/* Sheet Header Summary */}
          <div className="px-5 pt-1 pb-3 flex items-baseline justify-between border-b border-[#E9DFD0]/60">
            <div>
              <h1 className="text-lg font-bold text-[#130F08]">{property.title}</h1>
              <p className="text-xs text-[#130F08]/65">{property.district} • {property.areaM2} م² • {property.rooms} غرف</p>
            </div>
            <div className="text-left">
              <BdiNumber
                value={formatNumber(property.price)}
                unit="ر.س"
                className="text-xl font-bold text-[#130F08]"
              />
              <span className="text-[11px] text-[#130F08]/60 block">سنوي</span>
            </div>
          </div>

          {/* 5 Tabs Inside the Sheet (Horizontal Scrollable Strip, >= 48px tap targets) */}
          <div className="px-4 py-2 border-b border-[#E9DFD0]/60 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (sheetSnap === "peek") setSheetSnap("half");
                    }}
                    className={`h-11 px-4 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      isActive
                        ? "bg-[#130F08] text-[#FAF6EF] shadow-sm"
                        : "bg-[#E9DFD0]/50 text-[#130F08]/75 hover:bg-[#E9DFD0] hover:text-[#130F08]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Tab Content Body */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {/* Tab 1: الملاءمة (Fit) */}
            {activeTab === "fit" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-white border border-[#E9DFD0] flex items-center justify-between shadow-xs">
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

                <div className="p-3.5 rounded-2xl bg-white border border-[#E9DFD0] flex items-center justify-between shadow-xs">
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

                <div className="p-3.5 rounded-2xl bg-white border border-[#E9DFD0] flex items-center justify-between shadow-xs">
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
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#130F08]">
                    خريطة الموقع التفاعلية ومسار العمل:
                  </span>
                  <span className="font-semibold text-[#14756E] px-2.5 py-0.5 rounded-full bg-[#14756E]/10">
                    {property.travelTimeWorkMin} دقيقة للعمل
                  </span>
                </div>

                {/* Full Interactive MapView */}
                <div className="rounded-2xl overflow-hidden border border-[#E9DFD0] shadow-xs">
                  <MapView
                    variant="full"
                    selectedPropertyId={property.id}
                    className="w-full"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/70 border border-[#E9DFD0] text-xs text-[#130F08]/80 leading-relaxed">
                  يقع العقار في {property.district}، ضمن نطاق دائرة الوصول المستهدفة نحو مركز الملك عبد الله المالي (KAFD) دون اختناقات رئيسية.
                </div>
              </div>
            )}

            {/* Tab 3: السعر (Price) */}
            {activeTab === "price" && (
              <div className="space-y-3">
                {property.fairPriceStatus === "insufficient" ? (
                  <div className="p-4 rounded-2xl border border-dashed border-[#E9DFD0] text-center space-y-1.5 bg-white/50">
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
                    <div className="text-xs text-[#130F08]/75 pt-1 border-t border-[#E9DFD0]/60">
                      سعر المتر التقريبي: <BdiNumber value={formatNumber(Math.round(property.price / property.areaM2))} unit="ر.س" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: الحياة اليومية (Daily) */}
            {activeTab === "daily" && (
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-white border border-[#E9DFD0] flex items-center justify-between text-xs shadow-xs">
                  <span className="font-medium text-[#130F08]">زمن الوصول للعمل</span>
                  <BdiNumber value={property.travelTimeWorkMin} unit="دقيقة" className="font-semibold text-[#130F08]" />
                </div>
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
            )}

            {/* Tab 5: المخاطر (Risks) */}
            {activeTab === "risks" && (
              <div className="space-y-2.5">
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

          {/* Sticky Sheet Bottom Bar: 1 Primary CTA */}
          <div className="p-4 pt-2 border-t border-[#E9DFD0] bg-[#FAF6EF]/90 backdrop-blur-md">
            <PrimaryButton
              label={isSelected ? "محدد للمعاينة الميدانية ✓" : "اختر للمعاينة الميدانية"}
              icon={isSelected ? Check : undefined}
              onClick={handleToggleVisit}
              className={`w-full h-14 rounded-full text-base font-semibold shadow-lg ${
                isSelected ? "bg-[#14756E] text-[#FAF6EF]" : ""
              }`}
            />
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
