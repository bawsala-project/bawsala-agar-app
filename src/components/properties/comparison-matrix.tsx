"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { formatSAR } from "@/lib/utils";
import { DecisionFitGauge } from "./decision-fit-gauge";
import { PropertyDetailSheet } from "./property-detail-sheet";
import type { ConstraintResult } from "@/lib/analysis/constraints";
import type {
  ConfidenceLevel,
  DailyLifeAssessment,
  FairPriceAssessment,
  AffordabilityAssessment,
  TradeoffSummary,
} from "@/lib/analysis/axes";

export interface ComparisonItem {
  id: string;
  rank?: number | null;
  title: string;
  district?: string | null;
  city?: string | null;
  listing_price_sar: number;
  price_per_sqm?: number | null;
  price_delta_budget?: number | null;
  area_sqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor_no?: number | null;
  fit_rating: "strong" | "partial" | "weak" | "insufficient_evidence" | string;
  visit_priority: "high" | "medium" | "low" | "insufficient_evidence" | string;
  visit_priority_reason?: string;
  fit_summary?: string;
  main_advantage_ar?: string;
  main_tradeoff_ar?: string;
  what_could_change_rank_ar?: string;
  ranking_reason_ar?: string;
  preferences_impact_ar?: string;
  score_vs_rank_note_ar?: string;
  strengths: string[];
  risks: string[];
  key_unknowns: string[];
  constraint_summary?: {
    pass: number;
    fail: number;
    unknown: number;
  };
  constraint_results?: ConstraintResult[];
  decision_fit_score?: number;
  image_url?: string | null;
  overall_confidence?: ConfidenceLevel;
  confidence_label_ar?: string;
  confidence_reason_ar?: string;
  daily_life?: DailyLifeAssessment;
  price_axis?: FairPriceAssessment;
  affordability_axis?: AffordabilityAssessment;
  tradeoffs?: TradeoffSummary;
}

export interface ComparisonMatrixProps {
  items: ComparisonItem[];
  caseId?: string;
}

const FIT_BADGE: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  strong: {
    label: "توافق قوي",
    bg: "bg-[#E9F4EE]",
    text: "text-[#1E6B43]",
    border: "border-[#C5E4D4]",
  },
  partial: {
    label: "توافق جزئي",
    bg: "bg-[#FFF9EC]",
    text: "text-[#9A6700]",
    border: "border-[#F9E2AF]",
  },
  weak: {
    label: "توافق ضعيف",
    bg: "bg-[#FDF1F0]",
    text: "text-[#A62626]",
    border: "border-[#F6CBC8]",
  },
  insufficient_evidence: {
    label: "بيانات غير كافية",
    bg: "bg-[var(--cream)]",
    text: "text-[var(--dusty-blue)]",
    border: "border-[var(--mist)]",
  },
};

const CONFIDENCE_BADGE: Record<
  ConfidenceLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  high: {
    label: "ثقة عالية",
    bg: "bg-[#E9F4EE]",
    text: "text-[#1E6B43]",
    border: "border-[#C5E4D4]",
  },
  medium: {
    label: "ثقة متوسطة",
    bg: "bg-[#FFF9EC]",
    text: "text-[#9A6700]",
    border: "border-[#F9E2AF]",
  },
  low: {
    label: "ثقة منخفضة",
    bg: "bg-[#FDF1F0]",
    text: "text-[#A62626]",
    border: "border-[#F6CBC8]",
  },
};

const PRIORITY_BADGE: Record<string, { label: string; text: string }> = {
  high: { label: "معاينة مرتفعة", text: "text-[#1E6B43]" },
  medium: { label: "معاينة متوسطة", text: "text-[#9A6700]" },
  low: { label: "معاينة منخفضة", text: "text-[#A62626]" },
  insufficient_evidence: {
    label: "تحتاج استكمال بيانات",
    text: "text-[var(--dusty-blue)]",
  },
};

export function ComparisonMatrix({ items, caseId }: ComparisonMatrixProps) {
  const [activePropertyForSheet, setActivePropertyForSheet] =
    useState<ComparisonItem | null>(null);
  const [showAllOptions, setShowAllOptions] = useState(false);

  if (!items || items.length === 0) return null;

  const hasMoreThanThree = items.length > 3;
  const visibleItems =
    hasMoreThanThree && !showAllOptions ? items.slice(0, 3) : items;

  const validSqm = visibleItems
    .map((i) => i.price_per_sqm)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const minPricePerSqm = validSqm.length > 0 ? Math.min(...validSqm) : null;

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* Top-3 Eligible Options Banner (when 4-5 properties exist) */}
      {hasMoreThanThree && (
        <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--paper)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--cream)] border border-[var(--mist)] flex items-center justify-center text-[var(--navy)] shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--navy)]">
                {showAllOptions
                  ? `كل الشقق (${items.length})`
                  : "أفضل 3 خيارات"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAllOptions((prev) => !prev)}
            className="self-start sm:self-center px-4 py-2 rounded-full bg-[var(--cream)] hover:bg-[var(--navy)] text-[var(--navy)] hover:text-[var(--cream)] border border-[var(--mist)] text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            {showAllOptions
              ? "الاكتفاء بأفضل 3 خيارات"
              : `إظهار جميع الخيارات (${items.length})`}
          </button>
        </div>
      )}

      {/* Side-by-Side Comparison Table Container */}
      <div className="rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] shadow-[0_20px_60px_rgba(15,26,43,0.05)] overflow-hidden">
        <div
          className="overflow-x-auto focus:outline-2 focus:outline-[var(--navy)]"
          tabIndex={0}
          role="region"
          aria-labelledby="comparison-matrix-caption"
        >
          <table className="w-full min-w-[780px] border-collapse text-right">
            <caption id="comparison-matrix-caption" className="sr-only">
              مصفوفة المقارنة المباشرة للشقق السكنية المرشحة عبر محاور القرار الخمسة
            </caption>
            <thead>
              <tr className="border-b border-[var(--mist)] bg-[var(--cream)]/70">
                <th
                  scope="col"
                  className="sticky top-0 right-0 z-30 p-4 sm:p-5 w-48 font-display font-bold text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--cream)] align-middle"
                >
                  المحور
                </th>

                {visibleItems.map((item, idx) => {
                  const rank = item.rank ?? idx + 1;
                  const isWinner =
                    rank === 1 &&
                    item.fit_rating !== "weak" &&
                    item.fit_rating !== "insufficient_evidence";
                  const score =
                    item.decision_fit_score ||
                    (item.fit_rating === "strong"
                      ? 89
                      : item.fit_rating === "partial"
                        ? 74
                        : 58);

                  return (
                    <th
                      key={item.id}
                      scope="col"
                      className={`sticky top-0 z-20 p-4 sm:p-5 min-w-[230px] border-l border-[var(--mist)] align-top transition-colors ${
                        isWinner ? "bg-[#E9F4EE]/95" : "bg-[var(--paper)]"
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Rank + Dial Row */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                              isWinner
                                ? "bg-[#1E6B43] text-white"
                                : "bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]"
                            }`}
                          >
                            {isWinner && <Trophy className="w-3.5 h-3.5" />}
                            <span>
                              {isWinner
                                ? "#1 · الخيار الأنسب"
                                : `المركز #${rank}`}
                            </span>
                          </span>

                          <DecisionFitGauge
                            score={score}
                            size={40}
                            strokeWidth={3.5}
                            countUp={true}
                          />
                        </div>

                        {/* Property Title & District */}
                        <div>
                          <div className="font-display font-bold text-base text-[var(--navy)] leading-snug">
                            {item.title}
                          </div>
                          <div className="text-xs text-[var(--dusty-blue)] flex items-center gap-1 mt-0.5 font-normal">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>
                              {item.district
                                ? `حي ${item.district}`
                                : "الحي غير مذكور"}
                            </span>
                          </div>
                        </div>

                        {/* Quick Sheet Trigger */}
                        <button
                          type="button"
                          onClick={() => setActivePropertyForSheet(item)}
                          className="inline-flex items-center gap-1 text-xs font-body font-bold text-[var(--navy)] hover:underline cursor-pointer"
                        >
                          <span>عرض محاور القرار الـ 5</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--mist)] font-body">
              {/* Row 1: الملاءمة الشخصية ومستوى الثقة */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <th
                  scope="row"
                  className="sticky right-0 z-10 p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-middle"
                >
                  الملاءمة والثقة
                </th>
                {visibleItems.map((item) => {
                  const fit =
                    FIT_BADGE[item.fit_rating] ||
                    FIT_BADGE.insufficient_evidence;
                  const prio =
                    PRIORITY_BADGE[item.visit_priority] ||
                    PRIORITY_BADGE.insufficient_evidence;
                  const confLevel: ConfidenceLevel =
                    item.overall_confidence ||
                    (item.fit_rating === "insufficient_evidence"
                      ? "low"
                      : item.key_unknowns.length <= 1
                        ? "high"
                        : "medium");
                  const conf = CONFIDENCE_BADGE[confLevel];

                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 border-l border-[var(--mist)] align-middle space-y-2"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${fit.bg} ${fit.text} ${fit.border}`}
                        >
                          {fit.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{item.confidence_label_ar || conf.label}</span>
                        </span>
                      </div>
                      <div className={`text-xs font-semibold ${prio.text}`}>
                        {prio.label}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 2: السعر العادل ومؤشر المتر */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <th
                  scope="row"
                  className="sticky right-0 z-10 p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-middle"
                >
                  السعر وسعر المتر
                </th>
                {visibleItems.map((item) => {
                  const hasPrice = item.listing_price_sar > 0;
                  const isBestSqm =
                    minPricePerSqm !== null &&
                    item.price_per_sqm === minPricePerSqm &&
                    visibleItems.length > 1;
                  const overBudget =
                    typeof item.price_delta_budget === "number" &&
                    item.price_delta_budget > 0;
                  const underBudget =
                    typeof item.price_delta_budget === "number" &&
                    item.price_delta_budget <= 0;

                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 border-l border-[var(--mist)] align-middle space-y-1.5"
                    >
                      {hasPrice ? (
                        <>
                          <div className="font-extrabold text-base sm:text-lg text-[var(--navy)] tabular-nums">
                            {formatSAR(item.listing_price_sar)}
                          </div>
                          {item.price_per_sqm ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs text-[var(--dusty-blue)] font-semibold tabular-nums">
                                {item.price_per_sqm.toLocaleString("en-US")} ر.س / م²
                              </span>
                              {isBestSqm && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E9F4EE] text-[#1E6B43]">
                                  أفضل قيمة للمتر
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-[var(--dusty-blue)]">
                              سعر المتر غير متاح
                            </div>
                          )}

                          {item.price_axis && (
                            <div className="text-[11px] font-bold text-[var(--navy)]">
                              {item.price_axis.label_ar}
                            </div>
                          )}

                          {overBudget && (
                            <div className="text-[11px] font-bold text-[#A62626]">
                              يتجاوز الميزانية بـ{" "}
                              {formatSAR(item.price_delta_budget!)}
                            </div>
                          )}
                          {underBudget && (
                            <div className="text-[11px] font-bold text-[#1E6B43]">
                              {item.price_delta_budget! < 0
                                ? `توفير ${formatSAR(Math.abs(item.price_delta_budget!))} ضمن ميزانيتك ✓`
                                : "ضمن سقف ميزانيتك ✓"}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs font-bold text-[#9A6700] bg-[#FFF9EC] px-2.5 py-1 rounded-lg border border-[#F9E2AF]">
                          السعر غير مذكور
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row 3: القدرة المالية وطريقة الشراء */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <th
                  scope="row"
                  className="sticky right-0 z-10 p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top"
                >
                  القدرة المالية
                </th>
                {visibleItems.map((item) => (
                  <td
                    key={item.id}
                    className="p-4 sm:p-5 text-sm border-l border-[var(--mist)] align-top space-y-1.5 leading-relaxed"
                  >
                    <div className="font-bold text-[var(--navy)]">
                      {item.affordability_axis?.label_ar || "حسب ميزانيتك"}
                    </div>
                    <p className="text-[var(--dusty-blue)]">
                      {item.affordability_axis?.summary_ar ||
                        "يُقيّم بمقارنة السعر بميزانيتك."}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Row 4: الموقع وأثره على الحياة اليومية */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <th
                  scope="row"
                  className="sticky right-0 z-10 p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top"
                >
                  الموقع والحياة اليومية
                </th>
                {visibleItems.map((item) => (
                  <td
                    key={item.id}
                    className="p-4 sm:p-5 text-sm border-l border-[var(--mist)] align-top space-y-1.5 leading-relaxed"
                  >
                    <div className="font-bold text-[var(--navy)]">
                      {item.daily_life?.label_ar ||
                        (item.district ? `حي ${item.district}` : "الحي غير محدد")}
                    </div>
                    <p className="text-[var(--dusty-blue)]">
                      {item.daily_life?.summary_ar ||
                        (item.district
                          ? `يقع في حي ${item.district}؛ يوصى بالتحقق الميداني من المسار وقت الذروة.`
                          : "اسم الحي غير مذكور في الإعلان.")}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Row 5: المساحة والغرف */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <th
                  scope="row"
                  className="sticky right-0 z-10 p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-middle"
                >
                  المساحة والغرف
                </th>
                {visibleItems.map((item) => (
                  <td
                    key={item.id}
                    className="p-4 sm:p-5 text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] align-middle space-y-1"
                  >
                    <div className="font-bold tabular-nums">
                      المساحة:{" "}
                      {item.area_sqm ? `${item.area_sqm} م²` : "غير مذكورة"}
                    </div>
                    <div className="text-xs text-[var(--dusty-blue)] tabular-nums">
                      غرف النوم:{" "}
                      {item.bedrooms !== null && item.bedrooms !== undefined
                        ? `${item.bedrooms} غرف نوم`
                        : "غير مذكور"}
                      {item.bathrooms
                        ? ` · ${item.bathrooms} دورات مياه`
                        : ""}
                    </div>
                    {item.floor_no !== null && item.floor_no !== undefined && (
                      <div className="text-xs text-[var(--dusty-blue)]">
                        الدور:{" "}
                        {item.floor_no === 0
                          ? "الأرضي"
                          : `الدور ${item.floor_no}`}
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 6: مطابقة الشروط الملزمة */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <th
                  scope="row"
                  className="sticky right-0 z-10 p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top"
                >
                  الشروط الملزمة
                </th>
                {visibleItems.map((item) => {
                  const summary = item.constraint_summary || {
                    pass: 0,
                    fail: 0,
                    unknown: 0,
                  };
                  const constraints = item.constraint_results || [];

                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 border-l border-[var(--mist)] align-top space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E9F4EE] text-[#1E6B43]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{summary.pass} مطابق</span>
                        </span>
                        {summary.fail > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FDF1F0] text-[#A62626]">
                            <XCircle className="w-3 h-3" />
                            <span>{summary.fail} مخالف</span>
                          </span>
                        )}
                        {summary.unknown > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF9EC] text-[#9A6700]">
                            <HelpCircle className="w-3 h-3" />
                            <span>{summary.unknown} غير مؤكد</span>
                          </span>
                        )}
                      </div>

                      {constraints.length > 0 && (
                        <ul className="space-y-1 text-[11px] text-[var(--dusty-blue)]">
                          {constraints.slice(0, 4).map((c, idx) => (
                            <li
                              key={`${c.key}-${idx}`}
                              className="flex items-center gap-1.5"
                            >
                              <span
                                className={`font-bold ${
                                  c.result === "pass"
                                    ? "text-[#1E6B43]"
                                    : c.result === "fail"
                                      ? "text-[#A62626]"
                                      : "text-[#9A6700]"
                                }`}
                              >
                                {c.result === "pass"
                                  ? "✓"
                                  : c.result === "fail"
                                    ? "✗"
                                    : "؟"}
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

              {/* Row 7: لماذا هذا الترتيب؟ */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <th
                  scope="row"
                  className="sticky right-0 z-10 p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top"
                >
                  لماذا هذا الترتيب؟
                </th>
                {visibleItems.map((item) => (
                  <td
                    key={item.id}
                    className="p-4 sm:p-5 text-sm border-l border-[var(--mist)] align-top space-y-2 leading-relaxed"
                  >
                    {item.ranking_reason_ar && (
                      <div className="text-[var(--navy)] font-medium">
                        <span className="text-[var(--navy)] font-bold">
                          السبب:{" "}
                        </span>
                        {item.ranking_reason_ar}
                      </div>
                    )}
                    <div className="text-[var(--navy)] font-medium">
                      <span className="text-[#1E6B43] font-bold">الميزة: </span>
                      {item.main_advantage_ar ||
                        item.fit_summary ||
                        "توافق متوازن مع متطلباتك"}
                    </div>
                    {(item.tradeoffs?.[0] ||
                      item.main_tradeoff_ar) && (
                      <div className="text-[var(--dusty-blue)]">
                        <span className="text-[#9A6700] font-bold">
                          المفاضلة:{" "}
                        </span>
                        {item.tradeoffs?.[0] ||
                          item.main_tradeoff_ar}
                      </div>
                    )}
                    {item.preferences_impact_ar && (
                      <div className="text-xs text-[var(--dusty-blue)] pt-1 border-t border-[var(--mist)]/60">
                        {item.preferences_impact_ar}
                      </div>
                    )}
                    {item.score_vs_rank_note_ar && (
                      <div className="text-xs text-[#9A6700] bg-[#FFF9EC] border border-[#F9E2AF] rounded-xl px-2.5 py-1.5 font-medium">
                        {item.score_vs_rank_note_ar}
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 8: المعلومات الناقصة وما قد يغيّر الترتيب */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <th
                  scope="row"
                  className="sticky right-0 z-10 p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-top"
                >
                  ما الذي قد يغيّر الترتيب؟
                </th>
                {visibleItems.map((item) => (
                  <td
                    key={item.id}
                    className="p-4 sm:p-5 text-sm text-[var(--dusty-blue)] border-l border-[var(--mist)] align-top leading-relaxed space-y-1.5"
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

              {/* Row 9: الإجراء التالي */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <th
                  scope="row"
                  className="sticky right-0 z-10 p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)] align-middle"
                >
                  الإجراء التالي
                </th>
                {visibleItems.map((item) => (
                  <td
                    key={item.id}
                    className="p-4 sm:p-5 text-sm border-l border-[var(--mist)] align-middle"
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
            visit_priority_reason:
              activePropertyForSheet.visit_priority_reason || "",
            main_advantage_ar: activePropertyForSheet.main_advantage_ar,
            main_tradeoff_ar: activePropertyForSheet.main_tradeoff_ar,
            what_could_change_rank_ar:
              activePropertyForSheet.what_could_change_rank_ar,
            ranking_reason_ar: activePropertyForSheet.ranking_reason_ar,
            preferences_impact_ar:
              activePropertyForSheet.preferences_impact_ar,
            score_vs_rank_note_ar:
              activePropertyForSheet.score_vs_rank_note_ar,
            strengths: activePropertyForSheet.strengths,
            risks: activePropertyForSheet.risks,
            key_unknowns: activePropertyForSheet.key_unknowns,
            constraint_results: activePropertyForSheet.constraint_results,
            decision_fit_score: activePropertyForSheet.decision_fit_score,
            price_per_sqm: activePropertyForSheet.price_per_sqm,
            overall_confidence: activePropertyForSheet.overall_confidence,
            confidence_label_ar: activePropertyForSheet.confidence_label_ar,
            confidence_reason_ar: activePropertyForSheet.confidence_reason_ar,
            daily_life: activePropertyForSheet.daily_life,
            price_axis: activePropertyForSheet.price_axis,
            affordability_axis: activePropertyForSheet.affordability_axis,
            tradeoffs: activePropertyForSheet.tradeoffs,
          }}
        />
      )}
    </div>
  );
}
