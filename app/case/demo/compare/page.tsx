"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Bookmark, Layers } from "lucide-react";
import { CircleButton } from "@/components/ui/CircleButton";
import { PhotoCard } from "@/components/ui/PhotoCard";
import { StatCard } from "@/components/ui/StatCard";
import { GlassPill } from "@/components/ui/GlassPill";
import { ActionBar } from "@/components/ui/ActionBar";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { useAppStore } from "@/lib/store";
import { formatNumber } from "@/lib/format";

const PROPERTY_IMAGES: Record<string, string> = {
  p1: "/images/p1-exterior.jpg",
  p2: "/images/p2-exterior.jpg",
  p3: "/images/p3-exterior.jpg",
};

export default function ComparePage() {
  const router = useRouter();
  const { properties, isReassessed } = useAppStore();
  const [isAllSheetOpen, setIsAllSheetOpen] = useState(false);

  const p1 = properties.find((p) => p.id === "p1") || properties[0];
  const p2 = properties.find((p) => p.id === "p2") || properties[1] || properties[0];
  const p3 = properties.find((p) => p.id === "p3") || properties[2] || properties[0];

  const compareProperties = [p1, p2, p3];

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between select-none bg-radial-lift"
      dir="rtl"
    >
      {/* Main Content Area */}
      <div className="w-full max-w-[420px] mx-auto px-5 pt-[calc(20px+var(--safe-top))] pb-[calc(100px+var(--safe-bottom))] flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header Row: CircleButton back + Title 18/600 */}
          <div className="flex items-center justify-between">
            <CircleButton
              icon={<ArrowRight className="w-5 h-5 text-sandstone" />}
              ariaLabel="الرجوع للخلف"
              onClick={() => router.back()}
              variant="glass"
            />
            <h2 className="text-[18px] font-semibold text-ink tracking-normal">
              مقارنة الخيارات
            </h2>
            <div className="w-11 h-11" />
          </div>

          {/* Section 1: Three small PhotoCards as column headers */}
          <div className="grid grid-cols-3 gap-2">
            {compareProperties.map((prop) => (
              <PhotoCard
                key={prop.id}
                imageSrc={PROPERTY_IMAGES[prop.id] || "/images/hero-home.jpg"}
                imageAlt={prop.title}
                title={prop.id === "p1" ? "الياسمين" : prop.id === "p2" ? "الملقا" : "النرجس"}
                chips={[prop.formattedPrice]}
                height={150}
              />
            ))}
          </div>

          {/* Section 2: StatCards in rows, max 4 rows plus 'عرض الكل' */}
          <div className="space-y-3 pt-1">
            {/* Row 1: السعر */}
            <div className="space-y-1">
              <span className="text-[12px] font-medium text-muted px-1 block">
                السعر الإجمالي
              </span>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="الياسمين" value={formatNumber(Math.round(p1.price / 1000))} unit="ألف" />
                <StatCard label="الملقا" value={formatNumber(Math.round(p2.price / 1000))} unit="ألف" />
                <StatCard label="النرجس" value={formatNumber(Math.round(p3.price / 1000))} unit="ألف" />
              </div>
            </div>

            {/* Row 2: المساحة */}
            <div className="space-y-1">
              <span className="text-[12px] font-medium text-muted px-1 block">
                المساحة الصافية
              </span>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="الياسمين" value={p1.areaM2} unit="م²" />
                <StatCard label="الملقا" value={p2.areaM2} unit="م²" />
                <StatCard label="النرجس" value={p3.areaM2} unit="م²" />
              </div>
            </div>

            {/* Row 3: زمن الوصول للعمل */}
            <div className="space-y-1">
              <span className="text-[12px] font-medium text-muted px-1 block">
                الوقت لمقر العمل
              </span>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="الياسمين" value={p1.travelTimeWorkMin} unit="د" />
                <StatCard label="الملقا" value={p2.travelTimeWorkMin} unit="د" />
                <StatCard label="النرجس" value={p3.travelTimeWorkMin} unit="د" />
              </div>
            </div>

            {/* Row 4: الترتيب */}
            <div className="space-y-1">
              <span className="text-[12px] font-medium text-muted px-1 block">
                الترتيب الحالي
              </span>
              <div className="grid grid-cols-3 gap-2">
                <StatCard
                  label="الياسمين"
                  value={isReassessed ? "#2" : "#1"}
                  unit={isReassessed ? "بعد الفحص" : "مبدئي"}
                />
                <StatCard
                  label="الملقا"
                  value="#3"
                  unit="فوق الميزانية"
                />
                <StatCard
                  label="النرجس"
                  value={isReassessed ? "#1" : "#2"}
                  unit={isReassessed ? "الأنسب" : "مبدئي"}
                />
              </div>
            </div>

            {/* Plus 'عرض الكل' Button */}
            <div className="pt-1">
              <GlassPill
                label="عرض كافة الفروقات والمعايير"
                icon={<Layers className="w-4 h-4" />}
                size="48"
                variant="glass"
                fullWidth
                onClick={() => setIsAllSheetOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Bottom ActionBar */}
      <ActionBar
        primaryLabel="بدء المعاينة الميدانية"
        onPrimaryAction={() => router.push("/case/demo/inspection")}
        startIcon={<Bookmark className="w-5 h-5 text-sandstone" />}
        startAriaLabel="حفظ"
        endIcon={<ArrowLeft className="w-5 h-5 text-sandstone" />}
        endAriaLabel="المعاينة"
        primaryVariant="sandstone"
        pinned={true}
      />

      {/* Full Comparison in GlassSheet */}
      <GlassSheet
        isOpen={isAllSheetOpen}
        onClose={() => setIsAllSheetOpen(false)}
        title="كافة معايير المقارنة"
        subtitle="مقارنة تفصيلية بين الخيارات الثلاثة"
        initialSnap="full"
        variant="dark"
      >
        <div className="space-y-4 pt-2">
          {[
            { label: "سعر المتر التقديري", p1: "5,878 ر.س", p2: "5,870 ر.س", p3: "5,394 ر.س" },
            { label: "حالة الميزانية", p1: "ضمن الميزانية", p2: "تتجاوز بـ 10 آلاف", p3: "توفر 80 ألفاً" },
            { label: "عمر المبنى", p1: "4 سنوات", p2: "سنة واحدة", p3: "غير محدد بدقة" },
            { label: "أهم مقايضة", p1: "تعارض قياس المساحة", p2: "تجاوز شرط السقف", p3: "دقيقة إضافية للتنقل" },
          ].map((row, idx) => (
            <div
              key={idx}
              className="p-4 rounded-[20px] bg-surface-2 border border-stroke space-y-2"
            >
              <span className="text-[13px] font-semibold text-sandstone block">
                {row.label}
              </span>
              <div className="grid grid-cols-3 gap-2 text-[12px] pt-1 border-t border-stroke">
                <div className="space-y-0.5">
                  <span className="text-muted text-[11px] block">الياسمين</span>
                  <span className="text-sandstone font-medium">{row.p1}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted text-[11px] block">الملقا</span>
                  <span className="text-sandstone font-medium">{row.p2}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted text-[11px] block">النرجس</span>
                  <span className="text-sandstone font-medium">{row.p3}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassSheet>
    </div>
  );
}
