"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatSAR } from "@/lib/utils";
import { EngineeringDialGauge } from "./engineering-dial-gauge";
import { PropertyDetailSheet } from "./property-detail-sheet";
import type { ConstraintResult } from "@/lib/analysis/constraints";

export interface ComparisonItem {
  id: string;
  rank?: number | null;
  title: string;
  district?: string | null;
  city?: string | null;
  listing_price_sar: number;
  price_per_sqm: number | null;
  price_delta_budget?: number | null;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms?: number | null;
  floor_no?: number | null;
  fit_rating: string;
  visit_priority: string;
  visit_priority_reason?: string;
  fit_summary?: string;
  main_advantage_ar?: string;
  main_tradeoff_ar?: string;
  what_could_change_rank_ar?: string;
  strengths: string[];
  risks: string[];
  key_unknowns: string[];
  constraint_summary?: {
    pass: number;
    fail: number;
    unknown: number;
  };
  constraint_results?: ConstraintResult[];
  image_url?: string | null;
  engineering_score?: number;
}

interface ComparisonMatrixProps {
  items: ComparisonItem[];
  caseId?: string;
}

function getFitLabel(rating: string) {
  switch (rating) {
    case "strong":
      return {
        label: "توافق قوي",
        classes: "bg-[#E9F4EE] text-[#1E6B43] border-[#C5E4D4]",
      };
    case "partial":
      return {
        label: "توافق جزئي",
        classes: "bg-[#FFF9EC] text-[#9A6700] border-[#F9E2AF]",
      };
    case "weak":
      return {
        label: "توافق ضعيف",
        classes: "bg-[#FDF1F0] text-[#A62626] border-[#F6CBC8]",
      };
    default:
      return {
        label: "بيانات غير كافية",
        classes: "bg-[var(--cream)] text-[var(--dusty-blue)] border-[var(--mist)]",
      };
  }
}

function getVisitPriorityLabel(priority: string) {
  switch (priority) {
    case "high":
    case "first":
      return {
        label: "معاينة مرتفعة",
        classes: "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)]",
      };
    case "medium":
    case "second":
      return {
        label: "معاينة متوسطة",
        classes: "bg-[#FFF9EC] text-[#9A6700] border-[#F9E2AF]",
      };
    case "low":
    case "third":
      return {
        label: "معاينة منخفضة",
        classes: "bg-[#FDF1F0] text-[#A62626] border-[#F6CBC8]",
      };
    default:
      return {
        label: "معاينة قيد التحقق",
        classes: "bg-[var(--cream)] text-[var(--dusty-blue)] border-[var(--mist)]",
      };
  }
}

export function ComparisonMatrix({ items, caseId }: ComparisonMatrixProps) {
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
                <th className="p-5 sm:p-6 w-[210px] sm:w-[250px] text-xs font-display font-bold text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
                    <span className="text-sm">معايير المفاضلة والقرار</span>
                  </div>
                  <div className="text-[11px] text-[var(--dusty-blue)] font-normal mt-1">
                    {items.length} عقارات مرشحة للمقارنة
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
                        className="group relative rounded-[20px] overflow-hidden border border-[var(--mist)] bg-[var(--cream)] hover:border-[var(--navy)] transition-all p-4 cursor-pointer text-right flex flex-col justify-between h-[196px]"
                      >
                        {/* Top: Rank and Score */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]">
                            {`المركز #${item.rank}`}
                          </span>
                          <EngineeringDialGauge score={score} size={42} strokeWidth={2.5} />
                        </div>

                        {/* Bottom: Title & Price in Body Font */}
                        <div className="space-y-1">
                          <h4 className="font-body font-bold text-sm text-[var(--navy)] line-clamp-1">
                            {item.title}
                          </h4>
                          <div className="text-[11px] text-[var(--dusty-blue)]">
                            {item.district ? `حي ${item.district}` : item.city || "المدينة غير محددة"}
                          </div>
                          <div className="font-body font-extrabold text-lg text-[var(--navy)] tabular-nums pt-0.5">
                            {item.listing_price_sar > 0
                              ? formatSAR(item.listing_price_sar)
                              : "السعر غير محدد"}
                          </div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* MATRIX BODY: Honest Decision-Driving Rows */}
            <tbody className="divide-y divide-[var(--mist)]">
              {/* Row 1: مستوى التوافق وتوصية المعاينة */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top">
                  مستوى التوافق وتوصية المعاينة
                </td>
                {items.map((item) => {
                  const fitMeta = getFitLabel(item.fit_rating);
                  const visitMeta = getVisitPriorityLabel(item.visit_priority);
                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-xs border-l border-[var(--mist)] align-top"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold border ${fitMeta.classes}`}
                        >
                          {fitMeta.label}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold border ${visitMeta.classes}`}
                        >
                          {visitMeta.label}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 2: السعر المطلوب وسعر المتر والموقف من الميزانية */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top">
                  السعر الإجمالي وسعر المتر
                </td>
                {items.map((item) => {
                  const isBestPrice =
                    minPrice !== null && item.listing_price_sar === minPrice;
                  const isBestPpsqm =
                    minPricePerSqm !== null &&
                    item.price_per_sqm !== null &&
                    item.price_per_sqm === minPricePerSqm;
                  const delta = item.price_delta_budget;

                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-sm border-l border-[var(--mist)] align-top space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-body font-extrabold text-[var(--navy)] tabular-nums text-base">
                          {item.listing_price_sar > 0
                            ? formatSAR(item.listing_price_sar)
                            : "غير محدد"}
                        </span>
                        {isBestPrice && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--navy)] shrink-0"
                            title="الأقل سعراً"
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs text-[var(--dusty-blue)]">
                        <span className="font-medium tabular-nums font-mono">
                          {item.price_per_sqm
                            ? `${formatSAR(item.price_per_sqm)} / م²`
                            : "سعر المتر غير محدد"}
                        </span>
                        {isBestPpsqm && (
                          <span className="text-[10px] font-bold text-[#1E6B43]">
                            أفضل قيمة للمتر
                          </span>
                        )}
                      </div>

                      {delta !== null && delta !== undefined && (
                        <div className="pt-0.5">
                          {delta < 0 ? (
                            <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E9F4EE] text-[#1E6B43]">
                              توفير {formatSAR(Math.abs(delta))} عن الميزانية
                            </span>
                          ) : delta === 0 ? (
                            <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--cream)] text-[var(--navy)]">
                              مطابق للحد الأقصى للميزانية
                            </span>
                          ) : (
                            <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FDF1F0] text-[#A62626]">
                              يتجاوز الميزانية بـ {formatSAR(delta)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row 3: المساحة وعدد الغرف */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top">
                  المساحة وعدد الغرف
                </td>
                {items.map((item) => {
                  const isBestArea = maxArea !== null && item.area_sqm === maxArea;
                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-xs sm:text-sm border-l border-[var(--mist)] align-top space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[var(--navy)] tabular-nums font-mono">
                          {item.area_sqm ? `${item.area_sqm} م²` : "المساحة غير محددة"}
                        </span>
                        {isBestArea && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--navy)] shrink-0"
                            title="الأكبر مساحة"
                          />
                        )}
                      </div>
                      <div className="text-xs text-[var(--dusty-blue)]">
                        {item.bedrooms ? `${item.bedrooms} غرف نوم` : "عدد الغرف غير محدد"}
                        {item.floor_no !== null && item.floor_no !== undefined
                          ? ` • الدور ${item.floor_no}`
                          : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 4: الشروط الملزمة */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top">
                  الشروط الملزمة
                </td>
                {items.map((item) => {
                  const constraints = item.constraint_results || [];
                  const pass =
                    item.constraint_summary?.pass ??
                    constraints.filter((c) => c.result === "pass").length;
                  const fail =
                    item.constraint_summary?.fail ??
                    constraints.filter((c) => c.result === "fail").length;
                  const unknown =
                    item.constraint_summary?.unknown ??
                    constraints.filter((c) => c.result === "unknown").length;

                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-xs border-l border-[var(--mist)] align-top space-y-2"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-[#E9F4EE] text-[#1E6B43]">
                          {pass} مطابق
                        </span>
                        {fail > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FDF1F0] text-[#A62626]">
                            {fail} مخالف
                          </span>
                        )}
                        {unknown > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FFF9EC] text-[#9A6700]">
                            {unknown} غير مؤكد
                          </span>
                        )}
                      </div>

                      {constraints.length > 0 && (
                        <ul className="space-y-1 text-[11px] text-[var(--dusty-blue)]">
                          {constraints.slice(0, 4).map((c, idx) => (
                            <li key={`${c.key}-${idx}`} className="flex items-center gap-1.5">
                              <span
                                className={`font-bold ${
                                  c.result === "pass"
                                    ? "text-[#1E6B43]"
                                    : c.result === "fail"
                                    ? "text-[#A62626]"
                                    : "text-[#9A6700]"
                                }`}
                              >
                                {c.result === "pass" ? "✓" : c.result === "fail" ? "✗" : "؟"}
                              </span>
                              <span className="truncate">{c.labelAr}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row 5: لماذا هذا الترتيب؟ */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top">
                  لماذا هذا الترتيب؟
                </td>
                {items.map((item) => (
                  <td
                    key={item.id}
                    className="p-4 sm:p-5 text-xs border-l border-[var(--mist)] align-top space-y-2 leading-relaxed"
                  >
                    <div className="text-[var(--navy)] font-medium">
                      <span className="text-[#1E6B43] font-bold">الميزة: </span>
                      {item.main_advantage_ar || item.fit_summary || "توافق متوازن مع متطلباتك"}
                    </div>
                    {item.main_tradeoff_ar && (
                      <div className="text-[var(--dusty-blue)]">
                        <span className="text-[#9A6700] font-bold">المفاضلة: </span>
                        {item.main_tradeoff_ar}
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 6: ما الذي قد يغيّر الترتيب؟ */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top">
                  ما الذي قد يغيّر الترتيب؟
                </td>
                {items.map((item) => (
                  <td
                    key={item.id}
                    className="p-4 sm:p-5 text-xs text-[var(--dusty-blue)] border-l border-[var(--mist)] align-top leading-relaxed space-y-1.5"
                  >
                    <p className="text-[var(--navy)]">
                      {item.what_could_change_rank_ar ||
                        (item.key_unknowns.length > 0
                          ? `التحقق الميداني من: ${item.key_unknowns.slice(0, 2).join("، ")}`
                          : "المعاينة الميدانية والتثبت من حالة المرافق والصك")}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Row 7: الإجراء التالي */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-middle">
                  الإجراء التالي
                </td>
                {items.map((item) => (
                  <td
                    key={item.id}
                    className="p-4 sm:p-5 text-xs border-l border-[var(--mist)] align-middle"
                  >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      {caseId && (
                        <Link
                          href={`/case/${caseId}/inspection?propertyId=${item.id}`}
                          className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-body font-bold text-xs transition-all no-underline text-center"
                        >
                          معاينة العقار ←
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => setActivePropertyForSheet(item)}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-[var(--cream)] hover:bg-[var(--mist)]/40 text-[var(--navy)] border border-[var(--mist)] font-body font-semibold text-xs transition-all cursor-pointer"
                      >
                        ملف التفاصيل
                      </button>
                    </div>
                  </td>
                ))}
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
          caseId={caseId}
          rank={activePropertyForSheet.rank}
          property={{
            id: activePropertyForSheet.id,
            title: activePropertyForSheet.title,
            district: activePropertyForSheet.district,
            city: activePropertyForSheet.city,
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
            visit_priority_reason: activePropertyForSheet.visit_priority_reason || "",
            main_advantage_ar: activePropertyForSheet.main_advantage_ar,
            main_tradeoff_ar: activePropertyForSheet.main_tradeoff_ar,
            strengths: activePropertyForSheet.strengths,
            risks: activePropertyForSheet.risks,
            key_unknowns: activePropertyForSheet.key_unknowns,
            constraint_results: activePropertyForSheet.constraint_results,
            engineering_score: activePropertyForSheet.engineering_score,
            price_per_sqm: activePropertyForSheet.price_per_sqm,
          }}
        />
      )}
    </div>
  );
}
