"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FindingItem } from "./finding-item";
import {
  CATEGORY_LABELS_AR,
  type InspectionCategory,
} from "@/lib/inspection/generate-items";
import type {
  InspectionItemRow,
  InspectionFindingRow,
  FindingResult,
} from "@/actions/inspection";
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

export function InspectionView({
  caseId,
  propertyId,
  items,
  initialFindings,
}: InspectionViewProps) {
  const [activeCategory, setActiveCategory] = useState<InspectionCategory | "all">("all");

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

  // Group items by category & sort high priority first
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

  const availableCategories = CATEGORY_ORDER.filter(
    (cat) => groupedItems[cat] && groupedItems[cat].length > 0
  );

  // Live statistics
  const totalItems = items.length;
  const recordedEntries = Object.values(findingsMap);
  const checkedCount = recordedEntries.filter(
    (f) => f.result === "good" || f.result === "problem"
  ).length;
  const problemCount = recordedEntries.filter((f) => f.result === "problem").length;
  const goodCount = recordedEntries.filter((f) => f.result === "good").length;
  const hasAtLeastOneFinding = recordedEntries.length > 0;

  const progressPercent =
    totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 1. Integrated Top Control Bar: Live Progress + Category Filter Tabs + Reassess CTA */}
      <div className="bg-[var(--paper)] rounded-[22px] border border-[var(--mist)]/80 p-4 sm:p-5 space-y-3.5 shadow-[0_8px_28px_rgba(15,26,43,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Progress Summary */}
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="font-bold text-[var(--navy)] tabular-nums">
                تم فحص {checkedCount} من {totalItems} بنود ({problemCount} مشاكل مسجلة)
              </span>

              {goodCount > 0 && (
                <span className="text-[11px] font-bold text-[#2D6A4F] bg-[#E9F4EE] px-2 py-0.5 rounded-md tabular-nums">
                  {goodCount} مطابق
                </span>
              )}
            </div>

            <div className="w-full sm:max-w-xs h-1.5 bg-[var(--cream)] rounded-full overflow-hidden border border-[var(--mist)]/60">
              <div
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  problemCount > 0 ? "bg-[#9A6700]" : "bg-[#2D6A4F]"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Primary Action Button (No Sparkles, clean Navy CTA) */}
          <div className="shrink-0">
            {hasAtLeastOneFinding ? (
              <Link
                href={`/case/${caseId}/reassess?propertyId=${propertyId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-bold text-xs transition-all"
              >
                <span>تحديث التقييم بناءً على الزيارة</span>
                <span aria-hidden="true">←</span>
              </Link>
            ) : (
              <span className="text-[11px] text-[var(--dusty-blue)]">
                سجّل نتيجة بند واحد على الأقل لتحديث التقييم
              </span>
            )}
          </div>
        </div>

        {/* Category Filter Pills (Mobile-First Zero-Scroll Switching) */}
        {availableCategories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[var(--mist)]/50 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer",
                activeCategory === "all"
                  ? "bg-[var(--navy)] text-[var(--cream)]"
                  : "bg-[var(--cream)]/70 text-[var(--dusty-blue)] hover:text-[var(--navy)]"
              )}
            >
              الكل ({totalItems})
            </button>

            {availableCategories.map((category) => {
              const catItems = groupedItems[category];
              const catChecked = catItems.filter((i) => {
                const r = findingsMap[i.id]?.result;
                return r === "good" || r === "problem";
              }).length;
              const isSelected = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                    isSelected
                      ? "bg-[var(--navy)] text-[var(--cream)]"
                      : "bg-[var(--cream)]/70 text-[var(--dusty-blue)] hover:text-[var(--navy)]"
                  )}
                >
                  <span>{CATEGORY_LABELS_AR[category]}</span>
                  <span className="text-[10px] opacity-75 tabular-nums" dir="ltr">
                    ({catChecked}/{catItems.length})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Horizontal 2-Column Checklist Grid on Desktop / Filtered Category on Mobile */}
      <div className="space-y-5">
        {availableCategories.map((category) => {
          const categoryItems = groupedItems[category];
          const isHidden =
            activeCategory !== "all" && activeCategory !== category;

          return (
            <section
              key={category}
              aria-labelledby={`cat-title-${category}`}
              className={cn("space-y-2.5", isHidden ? "hidden" : "block")}
            >
              {/* Quiet Editorial Section Header (No Cartoon Emojis) */}
              <div className="flex items-center justify-between px-1">
                <h2
                  id={`cat-title-${category}`}
                  className="text-sm font-display font-bold text-[var(--navy)]"
                >
                  {CATEGORY_LABELS_AR[category]}
                </h2>
                <span className="text-[11px] text-[var(--dusty-blue)]">
                  {categoryItems.length} بنود
                </span>
              </div>

              {/* 2-Column Horizontal Grid on Desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
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
    </div>
  );
}
