"use client";

import React, { useState } from "react";
import { formatSAR } from "@/lib/utils";
import { EngineeringDialGauge } from "./engineering-dial-gauge";
import { PropertyDetailSheet } from "./property-detail-sheet";

export interface ComparisonItem {
  id: string;
  rank?: number | null;
  title: string;
  district?: string | null;
  listing_price_sar: number;
  price_per_sqm: number | null;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms?: number | null;
  floor_no?: number | null;
  fit_rating: string;
  visit_priority: string;
  fit_summary?: string;
  strengths: string[];
  risks: string[];
  key_unknowns: string[];
  image_url?: string | null;
  engineering_score?: number;
}

interface ComparisonMatrixProps {
  items: ComparisonItem[];
  caseId?: string;
}


export function ComparisonMatrix({ items }: ComparisonMatrixProps) {
  const [activePropertyForSheet, setActivePropertyForSheet] = useState<ComparisonItem | null>(null);

  if (!items || items.length === 0) return null;

  // Compute best values for highlighting with small navy dot
  const prices = items.map((it) => it.listing_price_sar).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : null;

  const pricesPerSqm = items
    .map((it) => it.price_per_sqm)
    .filter((p): p is number => p !== null && p > 0);
  const minPricePerSqm = pricesPerSqm.length ? Math.min(...pricesPerSqm) : null;

  const areas = items.map((it) => it.area_sqm).filter((a): a is number => a !== null && a > 0);
  const maxArea = areas.length ? Math.max(...areas) : null;

  const scores = items.map((it) =>
    it.engineering_score || (it.fit_rating === "strong" ? 89 : it.fit_rating === "partial" ? 74 : 58)
  );
  const maxScore = Math.max(...scores);

  return (
    <div className="w-full space-y-6 select-none" dir="rtl">
      {/* Matrix Table Container */}
      <div className="relative rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] overflow-hidden shadow-[0_20px_60px_rgba(15,26,43,0.06)]">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-right min-w-[760px]">
            {/* STICKY HEADER */}
            <thead className="sticky top-0 z-30 bg-[var(--paper)] border-b border-[var(--mist)]">
              <tr>
                {/* Metric Axis Column Header */}
                <th className="p-5 sm:p-6 w-[220px] sm:w-[260px] text-xs font-display font-bold text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
                    <span className="text-sm">معايير المقارنة الهندسية</span>
                  </div>
                  <div className="text-[11px] text-[var(--dusty-blue)] font-normal mt-1">
                    {items.length} عقارات مرشحة
                  </div>
                </th>

                {/* Property Columns */}
                {items.map((item) => {
                  const score =
                    item.engineering_score ||
                    (item.fit_rating === "strong" ? 89 : item.fit_rating === "partial" ? 74 : 58);

                  return (
                    <th
                      key={item.id}
                      className="p-4 sm:p-5 w-[260px] sm:w-[300px] border-l border-[var(--mist)] align-top"
                    >
                      <div
                        onClick={() => setActivePropertyForSheet(item)}
                        className="group relative rounded-[20px] overflow-hidden border border-[var(--mist)] bg-[var(--cream)] hover:border-[var(--navy)] transition-all p-4 cursor-pointer text-right flex flex-col justify-between h-[200px]"
                      >
                        {/* Top: Rank and Score */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--dusty-blue)]">
                            خيار #{item.rank}
                          </span>
                          <EngineeringDialGauge score={score} size={42} strokeWidth={2.5} />
                        </div>

                        {/* Bottom: Title & Price in Display Font */}
                        <div className="space-y-1">
                          <h4 className="font-display font-bold text-sm text-[var(--navy)] line-clamp-1">
                            {item.title}
                          </h4>
                          <div className="text-[11px] text-[var(--dusty-blue)]">
                            {item.district ? `حي ${item.district}` : "الرياض"}
                          </div>
                          <div className="font-display font-black text-lg text-[var(--navy)] tabular-nums pt-0.5">
                            {formatSAR(item.listing_price_sar)}
                          </div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* MATRIX BODY: Rows with Hairline Separators */}
            <tbody className="divide-y divide-[var(--mist)]">
              {/* Row 1: السعر الإجمالي */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)]">
                  السعر الإجمالي المطلوب
                </td>
                {items.map((item) => {
                  const isBest = minPrice !== null && item.listing_price_sar === minPrice;
                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-sm border-l border-[var(--mist)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-black text-[var(--navy)] tabular-nums font-mono text-base">
                          {formatSAR(item.listing_price_sar)}
                        </span>
                        {isBest && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--navy)] shrink-0"
                            title="الأفضل في هذا المعيار"
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 2: سعر المتر الصافي */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)]">
                  سعر المتر المربع الصافي
                </td>
                {items.map((item) => {
                  const isBest =
                    minPricePerSqm !== null &&
                    item.price_per_sqm !== null &&
                    item.price_per_sqm === minPricePerSqm;
                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-sm border-l border-[var(--mist)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[var(--navy)] tabular-nums font-mono">
                          {item.price_per_sqm ? `${formatSAR(item.price_per_sqm)} / م²` : "غير محدد"}
                        </span>
                        {isBest && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--navy)] shrink-0"
                            title="الأفضل في هذا المعيار"
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 3: المساحة الصافية */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)]">
                  المساحة الصافية القابلة للعيش
                </td>
                {items.map((item) => {
                  const isBest = maxArea !== null && item.area_sqm === maxArea;
                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-sm border-l border-[var(--mist)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[var(--navy)] tabular-nums font-mono">
                          {item.area_sqm ? `${item.area_sqm} م²` : "غير محدد"}
                        </span>
                        {isBest && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--navy)] shrink-0"
                            title="الأفضل في هذا المعيار"
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 4: التقييم الهندسي العام */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)]">
                  التقييم الهندسي والإنشائي
                </td>
                {items.map((item) => {
                  const score =
                    item.engineering_score ||
                    (item.fit_rating === "strong" ? 89 : item.fit_rating === "partial" ? 74 : 58);
                  const isBest = score === maxScore;

                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-sm border-l border-[var(--mist)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[var(--navy)] tabular-nums font-mono">
                          {score} / 100
                        </span>
                        {isBest && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--navy)] shrink-0"
                            title="الأعلى تقييماً"
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 5: كود البناء والتراخيص */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)]">
                  كود البناء والتراخيص
                </td>
                {items.map((item) => (
                  <td
                    key={item.id}
                    className="p-4 sm:p-5 text-xs text-[var(--dusty-blue)] border-l border-[var(--mist)]"
                  >
                    مطابق لكود البناء (SBC)
                  </td>
                ))}
              </tr>

              {/* Row 6: أولوية الزيارة */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)]">
                  توصية المعاينة
                </td>
                {items.map((item) => {
                  const isPriority = item.visit_priority === "first" || item.rank === 1;
                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-xs border-l border-[var(--mist)]"
                    >
                      <span className={`font-semibold ${isPriority ? "text-[var(--navy)]" : "text-[var(--dusty-blue)]"}`}>
                        {isPriority ? "أولوية أولى للمعاينة" : "خيار ثانوي للمقارنة"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Sheet Modal */}
      {activePropertyForSheet && (
        <PropertyDetailSheet
          isOpen={true}
          onClose={() => setActivePropertyForSheet(null)}
          property={{
            id: activePropertyForSheet.id,
            title: activePropertyForSheet.title,
            district: activePropertyForSheet.district,
            listing_price_sar: activePropertyForSheet.listing_price_sar,
            area_sqm: activePropertyForSheet.area_sqm,
            bedrooms: activePropertyForSheet.bedrooms,
            bathrooms: activePropertyForSheet.bathrooms,
            floor_no: activePropertyForSheet.floor_no,
            image_url: activePropertyForSheet.image_url,
          }}
          assessment={{
            fit_rating: activePropertyForSheet.fit_rating,
            fit_summary: activePropertyForSheet.fit_summary || "",
            visit_priority: activePropertyForSheet.visit_priority,
            visit_priority_reason: "",
            strengths: activePropertyForSheet.strengths,
            risks: activePropertyForSheet.risks,
            key_unknowns: activePropertyForSheet.key_unknowns,
            engineering_score: activePropertyForSheet.engineering_score,
            price_per_sqm: activePropertyForSheet.price_per_sqm,
          }}
        />
      )}
    </div>
  );
}
