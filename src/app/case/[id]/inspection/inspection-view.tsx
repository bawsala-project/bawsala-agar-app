"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { FindingItem } from "./finding-item";
import {
  CATEGORY_LABELS_AR,
  type InspectionCategory,
} from "@/lib/inspection/generate-items";
import type { InspectionItemRow, InspectionFindingRow, FindingResult } from "@/actions/inspection";
import { cn } from "@/lib/utils";

interface InspectionViewProps {
  caseId: string;
  propertyId: string;
  items: InspectionItemRow[];
  initialFindings: InspectionFindingRow[];
}

const CATEGORY_ORDER: InspectionCategory[] = [
  "building_services",
  "unit_specs",
  "parking_access",
  "neighborhood",
];

const CATEGORY_ICONS: Record<InspectionCategory, string> = {
  building_services: "🏢",
  unit_specs: "📐",
  parking_access: "🚗",
  neighborhood: "📍",
};

export function InspectionView({
  caseId,
  propertyId,
  items,
  initialFindings,
}: InspectionViewProps) {
  // Initialize findings map from initial server-provided findings
  const [findingsMap, setFindingsMap] = useState<
    Record<string, { result: FindingResult; note: string | null }>
  >(() => {
    const map: Record<string, { result: FindingResult; note: string | null }> = {};
    for (const f of initialFindings) {
      map[f.inspection_item_id] = {
        result: f.result as FindingResult,
        note: f.note,
      };
    }
    return map;
  });

  const handleFindingChange = (
    itemId: string,
    result: FindingResult,
    note: string | null
  ) => {
    setFindingsMap((prev) => ({
      ...prev,
      [itemId]: { result, note },
    }));
  };

  // Group items by category
  const priorityWeights: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const groupedItems: Record<InspectionCategory, InspectionItemRow[]> = {
    building_services: [],
    unit_specs: [],
    parking_access: [],
    neighborhood: [],
  };

  for (const item of items) {
    const cat = item.category as InspectionCategory;
    if (groupedItems[cat]) {
      groupedItems[cat].push(item);
    } else {
      groupedItems.unit_specs.push(item);
    }
  }

  for (const cat of CATEGORY_ORDER) {
    groupedItems[cat].sort(
      (a, b) =>
        (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0)
    );
  }

  // Live statistics
  const totalItems = items.length;
  const recordedEntries = Object.values(findingsMap);
  const checkedCount = recordedEntries.filter(
    (f) => f.result === "good" || f.result === "problem"
  ).length;
  const problemCount = recordedEntries.filter((f) => f.result === "problem").length;
  const goodCount = recordedEntries.filter((f) => f.result === "good").length;
  const hasAtLeastOneFinding = recordedEntries.length > 0;

  const progressPercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-8 pb-32">
      {/* Category Sections */}
      <div className="space-y-8">
        {CATEGORY_ORDER.map((category) => {
          const categoryItems = groupedItems[category];
          if (!categoryItems || categoryItems.length === 0) return null;

          const categoryTitle = CATEGORY_LABELS_AR[category];
          const icon = CATEGORY_ICONS[category];

          return (
            <section
              key={category}
              className="space-y-4"
              aria-labelledby={`cat-title-${category}`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-[var(--mist)] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl" aria-hidden="true">
                    {icon}
                  </span>
                  <h2
                    id={`cat-title-${category}`}
                    className="text-base sm:text-lg font-display font-bold text-[var(--navy)]"
                  >
                    {categoryTitle}
                  </h2>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--paper)] text-[var(--dusty-blue)] border border-[var(--mist)]">
                  {categoryItems.length} بنود
                </span>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 gap-4">
                {categoryItems.map((item) => {
                  const initialFinding = findingsMap[item.id] || null;

                  return (
                    <FindingItem
                      key={item.id}
                      caseId={caseId}
                      propertyId={propertyId}
                      item={item}
                      initialFinding={initialFinding}
                      onFindingChange={handleFindingChange}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Floating / Sticky Bottom Summary & Completion Banner */}
      <aside
        aria-label="شريط ملخص نتائج المعاينة"
        className="fixed bottom-16 md:bottom-0 inset-x-0 bg-[var(--paper)]/95 backdrop-blur-md border-t border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.08)] z-30 p-3 sm:p-4"
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Real-time Counter & Progress */}
          <div className="w-full sm:w-auto space-y-1.5">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-xs sm:text-sm font-medium text-[var(--navy)] tabular-nums">
                تم فحص {checkedCount} من {totalItems} بنود ({problemCount} مشاكل مسجلة)
              </span>

              {goodCount > 0 && (
                <span className="text-[11px] font-medium text-[#1E6B43] bg-[#E9F4EE] px-2.5 py-0.5 rounded-full border border-[#C5E4D4] tabular-nums">
                  {goodCount} مطابق
                </span>
              )}
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full sm:w-72 h-1.5 bg-[var(--cream)] rounded-full overflow-hidden border border-[var(--mist)]">
              <div
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  problemCount > 0 ? "bg-[#9A6700]" : "bg-[#1E6B43]"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Actions: Primary CTA when >= 1 finding is recorded */}
          <div className="w-full sm:w-auto flex items-center justify-end gap-2">
            {hasAtLeastOneFinding ? (
              <Link
                href={`/case/${caseId}/reassess?propertyId=${propertyId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-display font-medium text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-[var(--cream)]" />
                <span>تحديث التقييم بناءً على الزيارة</span>
                <span aria-hidden="true">←</span>
              </Link>
            ) : (
              <span className="text-xs text-[var(--dusty-blue)] font-medium hidden sm:inline-block">
                اختر نتيجة فحص بند واحد على الأقل لتفعيل إعادة التقييم
              </span>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
