"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatSAR, cn } from "@/lib/utils";
import { FIELD_REGISTRY, type FieldKey } from "@/lib/evidence/fields";
import type { ConstraintResult } from "@/lib/analysis/constraints";

export interface PropertyCardAssessment {
  id: string;
  property_id: string;
  fit_rating: "strong" | "partial" | "weak" | "insufficient_evidence" | string;
  fit_summary: string;
  strengths: string[];
  risks: string[];
  key_unknowns: string[];
  visit_priority: "high" | "medium" | "low" | "insufficient_evidence" | string;
  visit_priority_reason: string;
  evidence_fields: string[];
  constraint_results: ConstraintResult[];
  price_per_sqm: number | null;
}

export interface PropertyCardProperty {
  id: string;
  title?: string | null;
  district?: string | null;
  listing_price_sar?: number | null;
  source_url?: string | null;
  input_mode?: string | null;
  notes?: string | null;
}

export interface PropertyCardProps {
  caseId: string;
  assessment: PropertyCardAssessment;
  property: PropertyCardProperty;
  resolvedPrice?: number | null;
  resolvedDistrict?: string | null;
  index?: number;
}

const FIT_RATING_CONFIG = {
  strong: {
    label: "توافق قوي",
    badgeClasses: "bg-emerald-50 text-emerald-800 border-emerald-300",
    dotClass: "bg-emerald-500",
  },
  partial: {
    label: "توافق جزئي",
    badgeClasses: "bg-amber-50 text-amber-800 border-amber-300",
    dotClass: "bg-amber-500",
  },
  weak: {
    label: "توافق ضعيف",
    badgeClasses: "bg-rose-50 text-rose-800 border-rose-300",
    dotClass: "bg-rose-500",
  },
  insufficient_evidence: {
    label: "بيانات غير كافية",
    badgeClasses: "bg-slate-100 text-slate-800 border-slate-300",
    dotClass: "bg-slate-400",
  },
};

const ADVISORY_CONFIG = {
  high: {
    title: "أولوية المعاينة: مرتفعة",
    approvedText:
      "هذا العقار متوافق بدرجة جيدة مع متطلباتك الحالية، وقد تكون معاينته خطوة مفيدة للتحقق من النقاط التي لم تُحسم بعد.",
    containerClasses: "bg-emerald-50/70 border-emerald-200 text-emerald-950",
    badgeClasses: "bg-emerald-100 text-emerald-800 border-emerald-300",
    btnClasses: "bg-emerald-700 hover:bg-emerald-800 text-white",
  },
  medium: {
    title: "أولوية المعاينة: متوسطة",
    approvedText: null, // dynamic reason
    containerClasses: "bg-amber-50/70 border-amber-200 text-amber-950",
    badgeClasses: "bg-amber-100 text-amber-800 border-amber-300",
    btnClasses: "bg-amber-700 hover:bg-amber-800 text-white",
  },
  low: {
    title: "أولوية المعاينة: منخفضة",
    approvedText:
      "هذا العقار لا يتطابق جيدًا مع متطلباتك الحالية، لذلك قد لا تكون معاينته أولوية الآن. يمكنك مع ذلك فتح قائمة الزيارة إذا رغبت.",
    containerClasses: "bg-rose-50/70 border-rose-200 text-rose-950",
    badgeClasses: "bg-rose-100 text-rose-800 border-rose-300",
    btnClasses: "bg-rose-700 hover:bg-rose-800 text-white",
  },
  insufficient_evidence: {
    title: "أولوية المعاينة: لا تكفي البيانات",
    approvedText: null,
    containerClasses: "bg-slate-50 border-slate-200 text-slate-900",
    badgeClasses: "bg-slate-200 text-slate-800 border-slate-300",
    btnClasses: "bg-slate-700 hover:bg-slate-800 text-white",
  },
};

export function PropertyCard({
  caseId,
  assessment,
  property,
  resolvedPrice,
  resolvedDistrict,
  index = 0,
}: PropertyCardProps) {
  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    constraints: true,
    strengths: true,
    risks: true,
    unknowns: true,
    evidence: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. Resolve Title
  let displayTitle = property.title?.trim() || "";
  const districtName = resolvedDistrict || property.district || "";

  if (!displayTitle) {
    if (districtName) {
      displayTitle = `شقة في حي ${districtName}`;
    } else if (property.input_mode === "url" && property.source_url) {
      try {
        displayTitle = new URL(property.source_url).hostname;
      } catch {
        displayTitle = `عقار ${index + 1}`;
      }
    } else if (property.notes) {
      displayTitle = property.notes.slice(0, 60);
    } else {
      displayTitle = `عقار ${index + 1}`;
    }
  }

  // 2. Resolve Price
  const effectivePrice =
    resolvedPrice !== undefined && resolvedPrice !== null
      ? resolvedPrice
      : property.listing_price_sar;

  // 3. Fit Rating
  const fitKey = (assessment.fit_rating as keyof typeof FIT_RATING_CONFIG) in FIT_RATING_CONFIG
    ? (assessment.fit_rating as keyof typeof FIT_RATING_CONFIG)
    : "insufficient_evidence";
  const fitConfig = FIT_RATING_CONFIG[fitKey];

  // 4. Advisory Guidance
  const priorityKey = (assessment.visit_priority as keyof typeof ADVISORY_CONFIG) in ADVISORY_CONFIG
    ? (assessment.visit_priority as keyof typeof ADVISORY_CONFIG)
    : "insufficient_evidence";
  const advisoryConfig = ADVISORY_CONFIG[priorityKey];

  const advisoryBodyText =
    advisoryConfig.approvedText ||
    assessment.visit_priority_reason?.trim() ||
    "البيانات المتوفرة عن العقار غير كافية لتقييم أولوية المعاينة بدقة.";

  const constraints = assessment.constraint_results || [];
  const strengths = assessment.strengths || [];
  const risks = assessment.risks || [];
  const keyUnknowns = assessment.key_unknowns || [];
  const evidenceFields = assessment.evidence_fields || [];

  return (
    <article className="w-full bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* 1. Property Header */}
      <header className="p-4 sm:p-6 border-b border-gray-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words leading-snug">
              {displayTitle}
            </h2>
            {districtName && (
              <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                <span className="text-gray-400 select-none">📍</span>
                <span>حي {districtName}</span>
              </p>
            )}
          </div>

          {/* Fit Rating Badge */}
          <div className="self-start shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border",
                fitConfig.badgeClasses
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", fitConfig.dotClass)} aria-hidden="true" />
              {fitConfig.label}
            </span>
          </div>
        </div>

        {/* Price & Price per m² */}
        <div className="flex flex-wrap items-baseline gap-2 pt-1">
          {effectivePrice !== null && effectivePrice !== undefined && effectivePrice > 0 ? (
            <>
              <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {formatSAR(effectivePrice)}
              </span>
              {assessment.price_per_sqm !== null && assessment.price_per_sqm > 0 && (
                <span className="text-xs sm:text-sm font-medium text-gray-500">
                  ({Math.round(assessment.price_per_sqm).toLocaleString("ar-SA")} ر.س / م²)
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-semibold text-gray-500">
              السعر غير محدد في الإعلان
            </span>
          )}
        </div>
      </header>

      {/* 2. Advisory Pre-Visit Guidance Banner */}
      <div className="p-4 sm:p-6 bg-gray-50/50 border-b border-gray-100">
        <div
          className={cn(
            "rounded-xl border p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors",
            advisoryConfig.containerClasses
          )}
        >
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                  advisoryConfig.badgeClasses
                )}
              >
                {advisoryConfig.title}
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-inherit opacity-95">
              {advisoryBodyText}
            </p>
          </div>

          {/* Persistent Action Button */}
          <Link
            href={`/case/${caseId}/inspection?propertyId=${property.id}`}
            className={cn(
              "w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 shrink-0 active:scale-[0.98]",
              advisoryConfig.btnClasses
            )}
          >
            <span>قائمة المعاينة الميدانية</span>
            <span aria-hidden="true">←</span>
          </Link>
        </div>
      </div>

      {/* 3. Objective Fit Summary */}
      {assessment.fit_summary && (
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-white">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            ملخص التحليل
          </h3>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            {assessment.fit_summary}
          </p>
        </div>
      )}

      {/* 4. Collapsible Sections */}
      <div className="divide-y divide-gray-100">
        {/* Section A: الشروط الأساسية */}
        <div className="p-4 sm:p-6">
          <button
            type="button"
            onClick={() => toggleSection("constraints")}
            className="w-full flex items-center justify-between text-right group focus:outline-none"
            aria-expanded={openSections.constraints}
          >
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                الشروط الأساسية
              </span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                {constraints.length}
              </span>
            </div>
            <span
              className={cn(
                "text-gray-400 transform transition-transform duration-200 text-sm",
                openSections.constraints ? "rotate-180" : ""
              )}
              aria-hidden="true"
            >
              ▼
            </span>
          </button>

          {openSections.constraints && (
            <div className="mt-3.5 space-y-2.5">
              {constraints.length === 0 ? (
                <p className="text-xs text-gray-500">لا توجد شروط محددة مسبقاً.</p>
              ) : (
                constraints.map((c, idx) => {
                  const isPass = c.result === "pass";
                  const isFail = c.result === "fail";

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors",
                        isPass
                          ? "bg-emerald-50/50 border-emerald-100 text-emerald-950"
                          : isFail
                          ? "bg-rose-50/50 border-rose-100 text-rose-950"
                          : "bg-gray-50 border-gray-200/80 text-gray-800"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0",
                            isPass
                              ? "bg-emerald-200 text-emerald-800"
                              : isFail
                              ? "bg-rose-200 text-rose-800"
                              : "bg-gray-200 text-gray-700"
                          )}
                          aria-hidden="true"
                        >
                          {isPass ? "✓" : isFail ? "✕" : "?"}
                        </span>
                        <span className="font-semibold">{c.labelAr}</span>
                      </div>
                      <span className="text-xs opacity-90 sm:text-left">{c.detailAr}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Section B: نقاط القوة */}
        <div className="p-4 sm:p-6">
          <button
            type="button"
            onClick={() => toggleSection("strengths")}
            className="w-full flex items-center justify-between text-right group focus:outline-none"
            aria-expanded={openSections.strengths}
          >
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                نقاط القوة
              </span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                {strengths.length}
              </span>
            </div>
            <span
              className={cn(
                "text-gray-400 transform transition-transform duration-200 text-sm",
                openSections.strengths ? "rotate-180" : ""
              )}
              aria-hidden="true"
            >
              ▼
            </span>
          </button>

          {openSections.strengths && (
            <div className="mt-3.5">
              {strengths.length === 0 ? (
                <p className="text-xs text-gray-500">لا توجد نقاط قوة بارزة مسجلة.</p>
              ) : (
                <ul className="space-y-2">
                  {strengths.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-sm text-gray-700 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-emerald-600 font-bold shrink-0 mt-0.5 select-none">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Section C: المخاطر والتنبيهات */}
        <div className="p-4 sm:p-6">
          <button
            type="button"
            onClick={() => toggleSection("risks")}
            className="w-full flex items-center justify-between text-right group focus:outline-none"
            aria-expanded={openSections.risks}
          >
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                المخاطر والتنبيهات
              </span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-800 rounded-full">
                {risks.length}
              </span>
            </div>
            <span
              className={cn(
                "text-gray-400 transform transition-transform duration-200 text-sm",
                openSections.risks ? "rotate-180" : ""
              )}
              aria-hidden="true"
            >
              ▼
            </span>
          </button>

          {openSections.risks && (
            <div className="mt-3.5">
              {risks.length === 0 ? (
                <p className="text-xs text-gray-500">لا توجد مخاطر مسجلة.</p>
              ) : (
                <ul className="space-y-2">
                  {risks.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-sm text-rose-900 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-rose-600 font-bold shrink-0 mt-0.5 select-none">
                        ⚠
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Section D: معلومات غير محسومة */}
        <div className="p-4 sm:p-6">
          <button
            type="button"
            onClick={() => toggleSection("unknowns")}
            className="w-full flex items-center justify-between text-right group focus:outline-none"
            aria-expanded={openSections.unknowns}
          >
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                معلومات غير محسومة
              </span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                {keyUnknowns.length}
              </span>
            </div>
            <span
              className={cn(
                "text-gray-400 transform transition-transform duration-200 text-sm",
                openSections.unknowns ? "rotate-180" : ""
              )}
              aria-hidden="true"
            >
              ▼
            </span>
          </button>

          {openSections.unknowns && (
            <div className="mt-3.5">
              {keyUnknowns.length === 0 ? (
                <p className="text-xs text-gray-500">تم حسم كافة البيانات الأساسية بنجاح.</p>
              ) : (
                <ul className="space-y-2">
                  {keyUnknowns.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-sm text-gray-700 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-amber-500 font-bold shrink-0 mt-0.5 select-none">
                        ?
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Section E: الأدلة المعتمدة */}
        <div className="p-4 sm:p-6 bg-gray-50/30">
          <button
            type="button"
            onClick={() => toggleSection("evidence")}
            className="w-full flex items-center justify-between text-right group focus:outline-none"
            aria-expanded={openSections.evidence}
          >
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                الأدلة المعتمدة
              </span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                {evidenceFields.length}
              </span>
            </div>
            <span
              className={cn(
                "text-gray-400 transform transition-transform duration-200 text-sm",
                openSections.evidence ? "rotate-180" : ""
              )}
              aria-hidden="true"
            >
              ▼
            </span>
          </button>

          {openSections.evidence && (
            <div className="mt-3.5">
              {evidenceFields.length === 0 ? (
                <p className="text-xs text-gray-500">لا توجد أدلة محددة مسجلة.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {evidenceFields.map((f, idx) => {
                    const fieldDef = FIELD_REGISTRY[f as FieldKey];
                    const label = fieldDef?.label || f;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
