"use client";

import React, { useState } from "react";
import { formatSAR } from "@/lib/utils";
import { EngineeringDialGauge } from "./engineering-dial-gauge";
import { PropertyDetailSheet } from "./property-detail-sheet";

import type { PropertyFitEvaluation, ConfidenceAssessment } from "@/lib/analysis/fit-evaluator";
import type { DimensionWeights } from "@/lib/analysis/weights";

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
  weighted_fit_score?: number;
  dimensions?: PropertyFitEvaluation["dimensions"];
  dimension_weights?: DimensionWeights;
  top_pros?: string[];
  top_cons?: string[];
  ranking_reason_ar?: string;
  missing_information?: string[];
  confidence?: ConfidenceAssessment;
  is_certain?: boolean;
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

  const fitScores = items.map(
    (it) => it.weighted_fit_score ?? it.engineering_score ?? (it.fit_rating === "strong" ? 89 : it.fit_rating === "partial" ? 74 : 58)
  );
  const maxFitScore = Math.max(...fitScores);

  const dailyLifeScores = items.map((it) => it.dimensions?.locationDailyLife.score ?? 75);
  const maxDailyLifeScore = Math.max(...dailyLifeScores);

  const qualityScores = items.map((it) => it.dimensions?.propertyQuality.score ?? 75);
  const maxQualityScore = Math.max(...qualityScores);

  const risksScores = items.map((it) => it.dimensions?.risks.score ?? 80);
  const maxRisksScore = Math.max(...risksScores);

  const confidenceScores = items.map((it) => it.confidence?.score ?? (it.confidence?.level === "high" ? 90 : it.confidence?.level === "medium" ? 70 : 40));
  const maxConfidenceScore = Math.max(...confidenceScores);

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
                    <span className="text-sm">محاور الملاءمة ومقارنة الخيارات</span>
                  </div>
                  <div className="text-[11px] text-[var(--dusty-blue)] font-normal mt-1">
                    {items.length} عقارات مرشحة
                  </div>
                </th>

                {/* Property Columns */}
                {items.map((item) => {
                  const score =
                    item.weighted_fit_score ??
                    item.engineering_score ??
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
                            خيار {`#${item.rank}`}
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
              {/* Row 1: Fit score (مؤشر ملاءمة العقار) */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)]">
                  مؤشر ملاءمة العقار
                </td>
                {items.map((item) => {
                  const score =
                    item.weighted_fit_score ??
                    item.engineering_score ??
                    (item.fit_rating === "strong" ? 89 : item.fit_rating === "partial" ? 74 : 58);
                  const isBest = score === maxFitScore;
                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-sm border-l border-[var(--mist)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-display font-black text-[var(--navy)] tabular-nums font-mono text-base">
                            {score} / 100
                          </span>
                          <div className="text-[11px] text-[var(--dusty-blue)] mt-0.5">
                            {score >= 80 ? "توافق ممتاز مع الأولويات" : score >= 65 ? "توافق مقبول مع تضحيات" : "توافق محدود"}
                          </div>
                        </div>
                        {isBest && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--navy)] shrink-0"
                            title="الأعلى في مؤشر الملاءمة"
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 2: Price vs budget (السعر مقابل الميزانية) */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)]">
                  السعر والقدرة المالية
                </td>
                {items.map((item) => {
                  const isBest = minPrice !== null && item.listing_price_sar === minPrice;
                  const priceReason = item.dimensions?.priceAffordability.reasonAr;
                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-sm border-l border-[var(--mist)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-display font-black text-[var(--navy)] tabular-nums font-mono text-base">
                            {formatSAR(item.listing_price_sar)}
                          </span>
                          <div className="text-[11px] text-[var(--dusty-blue)] mt-0.5 leading-relaxed line-clamp-2">
                            {priceReason || (item.price_per_sqm ? `${formatSAR(item.price_per_sqm)} / م²` : "ضمن الميزانية المحددة")}
                          </div>
                        </div>
                        {isBest && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--navy)] shrink-0"
                            title="السعر الأفضل"
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 3: Daily life impact (الموقع وأثر الحياة اليومية) */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)]">
                  الموقع وأثر الحياة اليومية
                </td>
                {items.map((item) => {
                  const score = item.dimensions?.locationDailyLife.score ?? 75;
                  const isBest = score === maxDailyLifeScore;
                  const reason = item.dimensions?.locationDailyLife.reasonAr;
                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-sm border-l border-[var(--mist)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[var(--navy)] tabular-nums font-mono">
                            {score} / 100
                          </span>
                          <div className="text-[11px] text-[var(--dusty-blue)] mt-0.5 leading-relaxed line-clamp-2">
                            {reason || (item.district ? `حي ${item.district} - موقع مناسب للروتين اليومي` : "ملائم للروتين اليومي")}
                          </div>
                        </div>
                        {isBest && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--navy)] shrink-0"
                            title="الأفضل في الموقع والحياة اليومية"
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 4: Quality (جودة العقار وحالته) */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)]">
                  جودة العقار وحالته
                </td>
                {items.map((item) => {
                  const score = item.dimensions?.propertyQuality.score ?? 75;
                  const isBest = score === maxQualityScore;
                  const reason = item.dimensions?.propertyQuality.reasonAr;
                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-sm border-l border-[var(--mist)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[var(--navy)] tabular-nums font-mono">
                            {score} / 100
                          </span>
                          <div className="text-[11px] text-[var(--dusty-blue)] mt-0.5 leading-relaxed line-clamp-2">
                            {reason || "مواصفات تشطيب حديث وعمر بناء مناسب"}
                          </div>
                        </div>
                        {isBest && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--navy)] shrink-0"
                            title="الأعلى جودة"
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 5: Risks (المخاطر وجوانب الحذر) */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)]">
                  المخاطر وجوانب الحذر
                </td>
                {items.map((item) => {
                  const score = item.dimensions?.risks.score ?? 80;
                  const isBest = score === maxRisksScore;
                  const reason = item.dimensions?.risks.reasonAr;
                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-sm border-l border-[var(--mist)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[var(--navy)] tabular-nums font-mono">
                            {score} / 100
                          </span>
                          <div className="text-[11px] text-[var(--dusty-blue)] mt-0.5 leading-relaxed line-clamp-2">
                            {reason || "سلامة الصك الإلكتروني وخلو من الالتزامات الحرجة"}
                          </div>
                        </div>
                        {isBest && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--navy)] shrink-0"
                            title="الأقل مخاطر والأعلى أماناً"
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 6: Confidence (مستوى الثقة وموثوقية البيانات) */}
              <tr className="hover:bg-[var(--cream)]/40 transition-colors">
                <td className="p-4 sm:p-5 font-bold text-xs sm:text-sm text-[var(--navy)] border-l border-[var(--mist)] bg-[var(--paper)]">
                  مستوى الثقة وموثوقية البيانات
                </td>
                {items.map((item) => {
                  const level = item.confidence?.level ?? (item.is_certain !== false ? "high" : "low");
                  const confScore = item.confidence?.score ?? (level === "high" ? 90 : level === "medium" ? 70 : 40);
                  const isBest = confScore === maxConfidenceScore;
                  const reason = item.confidence?.reasonAr;
                  return (
                    <td
                      key={item.id}
                      className="p-4 sm:p-5 text-sm border-l border-[var(--mist)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span
                            className={`font-bold text-xs ${
                              level === "high"
                                ? "text-emerald-700"
                                : level === "medium"
                                ? "text-blue-700"
                                : "text-amber-700"
                            }`}
                          >
                            {level === "high"
                              ? "ثقة مرتفعة"
                              : level === "medium"
                              ? "ثقة متوسطة"
                              : "تقدير مبدئي (بيانات ناقصة)"}
                          </span>
                          <div className="text-[11px] text-[var(--dusty-blue)] mt-0.5 leading-relaxed line-clamp-2">
                            {reason || (level === "high" ? "بيانات موثقة ومطابقة" : "بيانات ناقصة تستدعي المعاينة")}
                          </div>
                        </div>
                        {isBest && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--navy)] shrink-0"
                            title="الأعلى موثوقية في البيانات"
                          />
                        )}
                      </div>
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
            weighted_fit_score: activePropertyForSheet.weighted_fit_score,
            dimensions: activePropertyForSheet.dimensions,
            dimension_weights: activePropertyForSheet.dimension_weights,
            top_pros: activePropertyForSheet.top_pros,
            top_cons: activePropertyForSheet.top_cons,
            ranking_reason_ar: activePropertyForSheet.ranking_reason_ar,
            missing_information: activePropertyForSheet.missing_information,
            confidence: activePropertyForSheet.confidence,
            is_certain: activePropertyForSheet.is_certain,
          }}
        />
      )}
    </div>
  );
}
