"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  Layers,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { BdiNumber, formatNumber } from "@/lib/format";

interface ComparisonItem {
  id: string;
  label: string;
  category: "السعر" | "الملاءمة" | "الموقع" | "المخاطر" | "المجهولات";
  values: Record<string, string>;
  strongestId?: string;
  isKey: boolean;
}

export default function ComparePage() {
  const router = useRouter();
  const { properties } = useAppStore();

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const p1 = properties.find((p) => p.id === "p1") || properties[0];
  const p2 = properties.find((p) => p.id === "p2") || properties[1] || properties[0];
  const p3 = properties.find((p) => p.id === "p3") || properties[2] || properties[0];

  const compareProperties = [p1, p2, p3];

  const allComparisonItems: ComparisonItem[] = [
    // Top 5 Key Rows (shown on main screen)
    {
      id: "price-total",
      label: "السعر الإجمالي",
      category: "السعر",
      values: {
        p1: "870 ألف",
        p2: "910 آلاف",
        p3: "820 ألف",
      },
      strongestId: "p3",
      isKey: true,
    },
    {
      id: "price-m2",
      label: "سعر المتر",
      category: "السعر",
      values: {
        p1: "5,878 ر.س",
        p2: "5,870 ر.س",
        p3: "5,394 ر.س",
      },
      strongestId: "p3",
      isKey: true,
    },
    {
      id: "fit-budget",
      label: "مطابقة الميزانية",
      category: "الملاءمة",
      values: {
        p1: "وفر 30k",
        p2: "تجاوز 10k",
        p3: "وفر 80k",
      },
      strongestId: "p3",
      isKey: true,
    },
    {
      id: "loc-commute",
      label: "مدة العمل",
      category: "الموقع",
      values: {
        p1: "15 دقيقة",
        p2: "18 دقيقة",
        p3: "24 دقيقة",
      },
      strongestId: "p1",
      isKey: true,
    },
    {
      id: "risk-primary",
      label: "أبرز مخاطرة",
      category: "المخاطر",
      values: {
        p1: "تعارض مساحة",
        p2: "تجاوز السقف",
        p3: "مجرى الوادي",
      },
      strongestId: "p1",
      isKey: true,
    },

    // Additional Detail Rows (in Bottom Sheet)
    {
      id: "fit-area",
      label: "المساحة الموثقة",
      category: "الملاءمة",
      values: {
        p1: "148 م²",
        p2: "155 م²",
        p3: "152 م²",
      },
      strongestId: "p2",
      isKey: false,
    },
    {
      id: "fit-rooms",
      label: "عدد الغرف",
      category: "الملاءمة",
      values: {
        p1: "3 غرف",
        p2: "3 غرف",
        p3: "3 غرف",
      },
      isKey: false,
    },
    {
      id: "price-fair",
      label: "النطاق العادل",
      category: "السعر",
      values: {
        p1: "مطابق للنطاق",
        p2: "غير كافٍ",
        p3: "مطابق للنطاق",
      },
      strongestId: "p1",
      isKey: false,
    },
    {
      id: "loc-district",
      label: "الحي السكني",
      category: "الموقع",
      values: {
        p1: "الياسمين",
        p2: "الملقا",
        p3: "النرجس",
      },
      isKey: false,
    },
    {
      id: "unknown-info",
      label: "معلومة غير مؤكدة",
      category: "المجهولات",
      values: {
        p1: "عزل السطح",
        p2: "عمر المبنى",
        p3: "موقف القبو",
      },
      isKey: false,
    },
  ];

  const keyRows = allComparisonItems.filter((r) => r.isKey);

  return (
    <AppShell backHref="/case/demo/results" pageTitle={COPY.compare.title}>
      <div className="relative z-10 flex-1 flex flex-col justify-between px-4 pt-4 pb-32 max-w-lg mx-auto w-full text-right" dir="rtl">
        <div className="space-y-4">
          {/* Headline & Supporting Line (Content Budget) */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#14756E] tracking-normal">
              المقارنة المباشرة
            </span>
            <h1 className="text-xl font-bold text-[#130F08]">
              {COPY.compare.title}
            </h1>
            <p className="text-xs text-[#130F08]/70">
              {COPY.compare.subtitle}
            </p>
          </div>

          {/* BLOCK 1: Three Photo Headers */}
          <div className="grid grid-cols-3 gap-2">
            {compareProperties.map((prop, idx) => (
              <button
                key={prop.id}
                type="button"
                onClick={() => router.push(`/case/demo/property/${prop.id}`)}
                className="group p-2 rounded-2xl glass-light border border-[#130F08]/10 text-right transition-all hover:border-[#14756E]/40 cursor-pointer shadow-xs flex flex-col justify-between min-h-[140px]"
              >
                <div className="relative w-full h-16 rounded-xl overflow-hidden border border-[#E9DFD0] mb-2 bg-[#E9DFD0]">
                  <PropertyImage
                    image={prop.images?.[0]}
                    tone={prop.colorTone || "sandstone"}
                    alt={prop.title}
                    containerClassName="w-full h-full"
                  />
                  <span className="absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full glass-dark text-[#FAF6EF] border border-white/20">
                    #{idx + 1}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-[#130F08] block truncate">
                    {prop.title}
                  </span>
                  <div className="text-[11px] font-semibold text-[#14756E]">
                    <BdiNumber value={formatNumber(prop.price)} unit="ر.س" />
                  </div>
                  <span className="text-[10px] text-[#130F08]/60 block truncate">
                    {prop.district}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* BLOCK 2: Key Comparison Table (Max 5 Rows) + "عرض الكل" Button */}
          <div className="rounded-2xl bg-white border border-[#E9DFD0] shadow-xs overflow-hidden">
            <div className="p-3 bg-[#FAF6EF] border-b border-[#E9DFD0] flex items-center justify-between">
              <span className="text-xs font-bold text-[#130F08]">
                الفروقات الجوهرية (5 معايير)
              </span>
              <span className="text-[11px] text-[#130F08]/60">
                الخط الأخضر يوضح الأفضل
              </span>
            </div>

            <div className="divide-y divide-[#E9DFD0]/70 text-xs">
              {keyRows.map((row) => (
                <div
                  key={row.id}
                  className="p-3 grid grid-cols-4 items-center gap-1.5 hover:bg-[#FAF6EF]/40 transition-colors"
                >
                  <span className="font-semibold text-[#130F08] text-[11px]">
                    {row.label}
                  </span>

                  {compareProperties.map((prop) => {
                    const isStrongest = row.strongestId === prop.id;
                    const val = row.values[prop.id] || "—";
                    return (
                      <div
                        key={prop.id}
                        className={`text-center py-1 px-1 rounded-lg text-[11px] truncate ${
                          isStrongest
                            ? "bg-[#14756E]/10 text-[#14756E] font-bold border border-[#14756E]/20"
                            : "text-[#130F08]/85"
                        }`}
                        title={val}
                      >
                        {val}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* "عرض الكل" Expand Button */}
            <div className="p-2.5 bg-[#FAF6EF]/60 border-t border-[#E9DFD0] text-center">
              <button
                type="button"
                onClick={() => setIsSheetOpen(true)}
                className="w-full h-11 px-4 rounded-xl glass-light border border-[#130F08]/15 text-xs font-semibold text-[#130F08] hover:bg-[#E9DFD0]/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5 text-[#14756E]" />
                <span>عرض الكل (10 معايير تفصيلية)</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#130F08]/60" />
              </button>
            </div>
          </div>

          {/* BLOCK 3: Reassessing Factor Chips (Max 3 Chips) */}
          <div className="p-3.5 rounded-2xl glass-light border border-[#130F08]/10 space-y-2 text-right shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#130F08]">
              <Sparkles className="w-4 h-4 text-[#14756E]" />
              <span>ما قد يغير الترتيب بعد المعاينة:</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#E9DFD0] text-[#130F08] font-medium shadow-2xs">
                اكتشاف رطوبة في سقف الياسمين
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#E9DFD0] text-[#130F08] font-medium shadow-2xs">
                تفاوض لتخفيض سعر شقة الملقا
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#E9DFD0] text-[#130F08] font-medium shadow-2xs">
                تأكيد صك المساحة على 160 م²
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer: 1 Primary CTA */}
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-4 bg-gradient-to-t from-[#FAF6EF] via-[#FAF6EF]/95 to-transparent pt-8 z-30 pointer-events-none">
          <div className="pointer-events-auto">
            <PrimaryButton
              label="الانتقال إلى قائمة الفحص"
              icon={ArrowRight}
              onClick={() => router.push("/case/demo/inspection")}
              className="w-full h-14 rounded-full text-base font-semibold shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* GlassSheet for Full 10-Criteria Comparison */}
      <GlassSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="جدول المقارنة الكامل"
        subtitle="مقارنة شاملة لجميع المعايير والمحاور التفصيلية"
        initialSnap="half"
        variant="light"
      >
        <div className="space-y-4 text-right" dir="rtl">
          {/* Header Properties mini row inside sheet */}
          <div className="grid grid-cols-4 items-center gap-1.5 pb-2 border-b border-[#E9DFD0] text-xs font-bold text-[#130F08]">
            <span>المعيار</span>
            {compareProperties.map((p) => (
              <span key={p.id} className="text-center truncate">
                {p.title}
              </span>
            ))}
          </div>

          <div className="divide-y divide-[#E9DFD0]/70 text-xs">
            {allComparisonItems.map((item) => (
              <div
                key={item.id}
                className="py-2.5 grid grid-cols-4 items-center gap-1.5"
              >
                <div>
                  <span className="font-semibold text-[#130F08] block text-[11px]">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-[#130F08]/50 block">
                    {item.category}
                  </span>
                </div>

                {compareProperties.map((prop) => {
                  const isStrongest = item.strongestId === prop.id;
                  const val = item.values[prop.id] || "—";
                  return (
                    <div
                      key={prop.id}
                      className={`text-center py-1 px-1 rounded-lg text-[11px] truncate ${
                        isStrongest
                          ? "bg-[#14756E]/10 text-[#14756E] font-bold border border-[#14756E]/20"
                          : "text-[#130F08]/85"
                      }`}
                      title={val}
                    >
                      {val}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </GlassSheet>
    </AppShell>
  );
}
