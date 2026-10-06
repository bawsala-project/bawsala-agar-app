"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Filter,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusPill } from "@/components/ui/StatusPill";
import { SurveyBrackets } from "@/components/ui/SurveyBrackets";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { BdiNumber, formatNumber } from "@/lib/format";

interface ComparisonRow {
  id: string;
  category: "السعر" | "الملاءمة" | "الموقع" | "المخاطر" | "المجهولات";
  label: string;
  values: Record<string, string>;
  strongestId?: string;
  isDifferent: boolean;
}

export default function ComparePage() {
  const router = useRouter();
  const { properties, rankingMode } = useAppStore();

  const [showDiffsOnly, setShowDiffsOnly] = useState(false);

  const p1 = properties.find((p) => p.id === "p1") || properties[0];
  const p2 = properties.find((p) => p.id === "p2") || properties[1] || properties[0];
  const p3 = properties.find((p) => p.id === "p3") || properties[2] || properties[0];

  const compareProperties = [p1, p2, p3];

  const comparisonRows: ComparisonRow[] = [
    // 1. السعر
    {
      id: "price-total",
      category: "السعر",
      label: "السعر الإجمالي",
      values: {
        p1: "870,000 ر.س",
        p2: "910,000 ر.س (تجاوز)",
        p3: "820,000 ر.س (الأقل)",
      },
      strongestId: "p3",
      isDifferent: true,
    },
    {
      id: "price-m2",
      category: "السعر",
      label: "سعر المتر التقديري",
      values: {
        p1: "5,878 ر.س / م²",
        p2: "5,870 ر.س / م²",
        p3: "5,394 ر.س / م²",
      },
      strongestId: "p3",
      isDifferent: true,
    },
    {
      id: "price-fair",
      category: "السعر",
      label: "القيمة السوقية العادلة",
      values: {
        p1: "مطابق للنطاق (5.8k-6.1k)",
        p2: "غير كافٍ للتقدير",
        p3: "مطابق للنطاق (5.3k-5.6k)",
      },
      strongestId: "p1",
      isDifferent: true,
    },

    // 2. الملاءمة
    {
      id: "fit-budget",
      category: "الملاءمة",
      label: "مطابقة الميزانية القصوى",
      values: {
        p1: "مطابق (وفر 30 ألف)",
        p2: "غير مطابق (+10 آلاف)",
        p3: "مطابق (وفر 80 ألف)",
      },
      strongestId: "p3",
      isDifferent: true,
    },
    {
      id: "fit-rooms",
      category: "الملاءمة",
      label: "عدد غرف النوم",
      values: {
        p1: "3 غرف نوم",
        p2: "3 غرف نوم",
        p3: "3 غرف نوم",
      },
      isDifferent: false,
    },
    {
      id: "fit-area",
      category: "الملاءمة",
      label: "المساحة الإجمالية",
      values: {
        p1: "148 م² (تعارض صك)",
        p2: "155 م²",
        p3: "152 م²",
      },
      strongestId: "p2",
      isDifferent: true,
    },

    // 3. الموقع
    {
      id: "loc-commute",
      category: "الموقع",
      label: "مدة الوصول للعمل",
      values: {
        p1: "15 دقيقة (الأقرب)",
        p2: "18 دقيقة",
        p3: "24 دقيقة",
      },
      strongestId: "p1",
      isDifferent: true,
    },
    {
      id: "loc-district",
      category: "الموقع",
      label: "الحي السكني",
      values: {
        p1: "الياسمين",
        p2: "الملقا",
        p3: "النرجس",
      },
      isDifferent: true,
    },

    // 4. المخاطر
    {
      id: "risk-primary",
      category: "المخاطر",
      label: "المخاطرة أو التنازل",
      values: {
        p1: "تعارض قياس المساحة",
        p2: "تجاوز الميزانية بـ 10k",
        p3: "قرب مجرى الوادي",
      },
      strongestId: "p1",
      isDifferent: true,
    },

    // 5. المجهولات
    {
      id: "unknown-info",
      category: "المجهولات",
      label: "المعلومة المجهولة",
      values: {
        p1: "حالة عزل السطح",
        p2: "عمر المبنى الدقيق",
        p3: "موقف القبو محدد؟",
      },
      isDifferent: true,
    },
  ];

  const filteredRows = showDiffsOnly
    ? comparisonRows.filter((r) => r.isDifferent)
    : comparisonRows;

  const categories: ComparisonRow["category"][] = [
    "السعر",
    "الملاءمة",
    "الموقع",
    "المخاطر",
    "المجهولات",
  ];

  return (
    <AppShell backHref="/case/demo/results" pageTitle={COPY.compare.title}>
      <div className="relative z-10 flex-1 flex flex-col justify-between px-4 pt-6 pb-32 max-w-xl mx-auto w-full">
        <div className="space-y-5">
          {/* Header */}
          <div className="space-y-3 text-right">
            <div className="flex items-center justify-between">
              <div>
                <span className="eyebrow-caption text-[#130F08]/65 block mb-1">
                  المقارنة المباشرة
                </span>
                <h1 className="text-xl md:text-2xl font-semibold text-[#130F08]">
                  {COPY.compare.title}
                </h1>
                <p className="text-xs text-[#130F08]/70">
                  {COPY.compare.subtitle}
                </p>
              </div>

              <StatusPill status={rankingMode} />
            </div>

            {/* Filter Toggle: Show Differences Only */}
            <div className="flex items-center justify-between p-3 rounded-2xl glass-light border border-[#130F08]/10 shadow-xs">
              <span className="text-xs text-[#130F08] font-semibold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#14756E]" />
                <span>{COPY.compare.showDiffOnly}</span>
              </span>

              <button
                type="button"
                onClick={() => setShowDiffsOnly(!showDiffsOnly)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  showDiffsOnly ? "bg-[#14756E]" : "bg-[#E9DFD0]"
                }`}
                aria-label="تبديل إظهار الفروقات فقط"
              >
                <motion.div
                  animate={{ x: showDiffsOnly ? -22 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-4 h-4 rounded-full m-1 bg-white shadow-xs"
                />
              </button>
            </div>
          </div>

          {/* Paper Columns Table */}
          <div className="relative rounded-3xl bg-white border border-[#E9DFD0] overflow-hidden shadow-sm">
            <div className="overflow-x-auto" dir="rtl">
              <table className="w-full border-collapse text-xs min-w-[500px]">
                {/* Header with Bracketed Property Cards */}
                <thead>
                  <tr className="border-b border-[#E9DFD0] bg-[#FAF6EF]">
                    <th className="p-3 text-right font-semibold text-[#130F08] w-28 sticky right-0 bg-[#FAF6EF] z-20 shadow-[2px_0_6px_rgba(19,15,8,0.04)]">
                      المحور
                    </th>
                    {compareProperties.map((prop) => (
                      <th
                        key={prop.id}
                        className="p-3 text-right font-semibold text-[#130F08] min-w-[130px] align-top"
                      >
                        {/* Bracketed Header Card */}
                        <SurveyBrackets active={true} size={6} color="#14756E">
                          <div className="p-2.5 rounded-xl bg-white border border-[#E9DFD0] space-y-1.5 shadow-2xs">
                            <div className="w-full h-16 rounded-lg overflow-hidden border border-[#E9DFD0]">
                              <PropertyImage
                                image={prop.images?.[0]}
                                tone={prop.colorTone || "sandstone"}
                                alt={prop.title}
                                containerClassName="w-full h-full"
                              />
                            </div>
                            <div>
                              <span className="text-xs text-[#14756E] block font-semibold">
                                الخيار #{prop.preRank}
                              </span>
                              <span className="text-xs font-semibold text-[#130F08] block truncate">
                                {prop.title}
                              </span>
                              <span className="text-xs text-[#130F08] font-semibold block pt-0.5">
                                <BdiNumber value={formatNumber(prop.price)} unit="ر.س" />
                              </span>
                            </div>
                          </div>
                        </SurveyBrackets>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body Rows by Category */}
                <tbody>
                  {categories.map((category) => {
                    const rowsInCategory = filteredRows.filter(
                      (r) => r.category === category
                    );
                    if (rowsInCategory.length === 0) return null;

                    return (
                      <React.Fragment key={category}>
                        {/* Category Divider Header */}
                        <tr className="bg-[#FAF6EF] border-y border-[#E9DFD0]">
                          <td
                            colSpan={4}
                            className="py-1.5 px-3 text-xs font-semibold text-[#14756E] sticky right-0"
                          >
                            محور {category}
                          </td>
                        </tr>

                        {/* Category Rows */}
                        {rowsInCategory.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-[#E9DFD0]/60 hover:bg-[#FAF6EF]/50 transition-colors"
                          >
                            {/* Pinned Label Cell */}
                            <td className="p-3 text-[#130F08] font-semibold text-xs sticky right-0 bg-white z-10 shadow-[2px_0_5px_rgba(19,15,8,0.03)]">
                              {row.label}
                            </td>

                            {/* Value Cells with Soft Cream/Sand Underline for Stronger Cell */}
                            {compareProperties.map((prop) => {
                              const isStrongest = row.strongestId === prop.id;
                              const cellVal = row.values[prop.id] || "—";

                              return (
                                <td
                                  key={prop.id}
                                  className="p-3 text-[#130F08] align-middle text-xs relative"
                                >
                                  <div
                                    className={`inline-block pb-0.5 transition-all ${
                                      isStrongest
                                        ? "border-b-2 border-[#14756E] font-semibold text-[#14756E]"
                                        : "font-normal text-[#130F08]/85"
                                    }`}
                                  >
                                    {cellVal}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Card */}
          <div className="p-4 rounded-3xl glass-light border border-[#130F08]/10 space-y-2.5 text-right shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#130F08]">
              <Sparkles className="w-4 h-4 text-[#14756E]" />
              <span>{COPY.compare.whatCouldChangeRank}</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-[#E9DFD0] text-[#130F08] font-medium shadow-2xs">
                اكتشاف رطوبة في سقف شقة الياسمين
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-[#E9DFD0] text-[#130F08] font-medium shadow-2xs">
                تفاوض لتخفيض سعر شقة الملقا
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-[#E9DFD0] text-[#130F08] font-medium shadow-2xs">
                تأكيد صك المساحة على 160 م²
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-6 bg-gradient-to-t from-[#FAF6EF] via-[#FAF6EF]/95 to-transparent pt-10 z-30 pointer-events-none">
          <div className="pointer-events-auto">
            <PrimaryButton
              label="الانتقال إلى المعاينة الميدانية"
              onClick={() => router.push("/case/demo/inspection")}
              className="w-full shadow-xl"
              size="56"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
