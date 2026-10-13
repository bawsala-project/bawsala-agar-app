"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  ChevronDown,
  ClipboardCheck,
} from "lucide-react";
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
    badgeClasses: "bg-emerald-50 text-emerald-800 border-emerald-300/80 shadow-xs",
    dotClass: "bg-emerald-500",
  },
  partial: {
    label: "توافق جزئي",
    badgeClasses: "bg-amber-50 text-amber-800 border-amber-300/80 shadow-xs",
    dotClass: "bg-amber-500",
  },
  weak: {
    label: "توافق ضعيف",
    badgeClasses: "bg-rose-50 text-rose-800 border-rose-300/80 shadow-xs",
    dotClass: "bg-rose-500",
  },
  insufficient_evidence: {
    label: "بيانات غير كافية",
    badgeClasses: "bg-slate-100 text-slate-800 border-slate-300/80 shadow-xs",
    dotClass: "bg-slate-400",
  },
};

const ADVISORY_CONFIG = {
  high: {
    title: "أولوية المعاينة: مرتفعة",
    approvedText:
      "هذا العقار متوافق بدرجة جيدة مع متطلباتك الحالية، وقد تكون معاينته خطوة مفيدة للتحقق من النقاط التي لم تُحسم بعد.",
    containerClasses: "bg-emerald-50/70 border-emerald-200/90 text-emerald-950",
    badgeClasses: "bg-emerald-100 text-emerald-800 border-emerald-300",
    btnClasses: "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs",
  },
  medium: {
    title: "أولوية المعاينة: متوسطة",
    approvedText: null, // dynamic reason
    containerClasses: "bg-amber-50/70 border-amber-200/90 text-amber-950",
    badgeClasses: "bg-amber-100 text-amber-800 border-amber-300",
    btnClasses: "bg-amber-700 hover:bg-amber-800 text-white shadow-xs",
  },
  low: {
    title: "أولوية المعاينة: منخفضة",
    approvedText:
      "هذا العقار لا يتطابق جيدًا مع متطلباتك الحالية، لذلك قد لا تكون معاينته أولوية الآن. يمكنك مع ذلك فتح قائمة الزيارة إذا رغبت.",
    containerClasses: "bg-rose-50/70 border-rose-200/90 text-rose-950",
    badgeClasses: "bg-rose-100 text-rose-800 border-rose-300",
    btnClasses: "bg-rose-700 hover:bg-rose-800 text-white shadow-xs",
  },
  insufficient_evidence: {
    title: "أولوية المعاينة: لا تكفي البيانات",
    approvedText: null,
    containerClasses: "bg-slate-50 border-slate-200 text-slate-900",
    badgeClasses: "bg-slate-200 text-slate-800 border-slate-300",
    btnClasses: "bg-slate-700 hover:bg-slate-800 text-white shadow-xs",
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
    <article className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-slate-300 relative">
      {/* 1. Property Header */}
      <header className="p-5 sm:p-7 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900 text-white text-[11px] font-black shrink-0 shadow-xs">
                #{index + 1}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 break-words leading-snug">
                {displayTitle}
              </h2>
            </div>

            {districtName && (
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>حي {districtName}</span>
              </p>
            )}
          </div>

          {/* Fit Rating Badge */}
          <div className="self-start shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border",
                fitConfig.badgeClasses
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", fitConfig.dotClass)} aria-hidden="true" />
              {fitConfig.label}
            </span>
          </div>
        </div>

        {/* Price & Price per m² */}
        <div className="flex flex-wrap items-baseline gap-2.5 pt-1">
          {effectivePrice !== null && effectivePrice !== undefined && effectivePrice > 0 ? (
            <>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {formatSAR(effectivePrice)}
              </span>
              {assessment.price_per_sqm !== null && assessment.price_per_sqm > 0 && (
                <span className="text-xs sm:text-sm font-bold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                  {Math.round(assessment.price_per_sqm).toLocaleString("ar-SA")} ر.س / م²
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-bold text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60">
              السعر غير محدد في الإعلان
            </span>
          )}
        </div>
      </header>

      {/* 2. Advisory Pre-Visit Guidance Banner */}
      <div className="p-4 sm:p-6 bg-slate-50/40 border-b border-slate-100">
        <div
          className={cn(
            "rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-xs",
            advisoryConfig.containerClasses
          )}
        >
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-extrabold border shadow-xs",
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
              "w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm transition-all focus:outline-none shrink-0 active:scale-[0.98]",
              advisoryConfig.btnClasses
            )}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>قائمة المعاينة الميدانية</span>
            <span aria-hidden="true">←</span>
          </Link>
        </div>
      </div>

      {/* 3. Objective Fit Summary */}
      {assessment.fit_summary && (
        <div className="px-5 sm:px-7 py-4 border-b border-slate-100 bg-white">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            ملخص التحليل
          </h3>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
            {assessment.fit_summary}
          </p>
        </div>
      )}

      {/* 4. Collapsible Sections */}
      <div className="divide-y divide-slate-100">
        {/* Section A: الشروط الأساسية */}
        <div className="p-5 sm:p-7">
          <button
            type="button"
            onClick={() => toggleSection("constraints")}
            className="w-full flex items-center justify-between text-right group focus:outline-none"
            aria-expanded={openSections.constraints}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                الشروط الأساسية
              </span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200/60">
                {constraints.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-slate-400 transition-transform duration-200",
                openSections.constraints ? "rotate-180" : ""
              )}
              aria-hidden="true"
            />
          </button>

          {openSections.constraints && (
            <div className="mt-4 space-y-2.5">
              {constraints.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد شروط محددة مسبقاً.</p>
              ) : (
                constraints.map((c, idx) => {
                  const isPass = c.result === "pass";
                  const isFail = c.result === "fail";

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-3.5 rounded-xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all shadow-xs",
                        isPass
                          ? "bg-emerald-50/40 border-emerald-200/80 text-emerald-950"
                          : isFail
                          ? "bg-rose-50/40 border-rose-200/80 text-rose-950"
                          : "bg-slate-50 border-slate-200/80 text-slate-800"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-black shrink-0",
                            isPass
                              ? "bg-emerald-200 text-emerald-800"
                              : isFail
                              ? "bg-rose-200 text-rose-800"
                              : "bg-slate-200 text-slate-700"
                          )}
                          aria-hidden="true"
                        >
                          {isPass ? "✓" : isFail ? "✕" : "?"}
                        </span>
                        <span className="font-bold">{c.labelAr}</span>
                      </div>
                      <span className="text-xs opacity-90 sm:text-left font-medium">{c.detailAr}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Section B: نقاط القوة */}
        <div className="p-5 sm:p-7">
          <button
            type="button"
            onClick={() => toggleSection("strengths")}
            className="w-full flex items-center justify-between text-right group focus:outline-none"
            aria-expanded={openSections.strengths}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                نقاط القوة
              </span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200/60">
                {strengths.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-slate-400 transition-transform duration-200",
                openSections.strengths ? "rotate-180" : ""
              )}
              aria-hidden="true"
            />
          </button>

          {openSections.strengths && (
            <div className="mt-4">
              {strengths.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد نقاط قوة بارزة مسجلة.</p>
              ) : (
                <ul className="space-y-2.5">
                  {strengths.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-sm text-slate-700 flex items-start gap-2.5 leading-relaxed bg-emerald-50/20 p-2.5 rounded-xl border border-emerald-100/60"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </span>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Section C: المخاطر والتنبيهات */}
        <div className="p-5 sm:p-7">
          <button
            type="button"
            onClick={() => toggleSection("risks")}
            className="w-full flex items-center justify-between text-right group focus:outline-none"
            aria-expanded={openSections.risks}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                المخاطر والتنبيهات
              </span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-200/60">
                {risks.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-slate-400 transition-transform duration-200",
                openSections.risks ? "rotate-180" : ""
              )}
              aria-hidden="true"
            />
          </button>

          {openSections.risks && (
            <div className="mt-4">
              {risks.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد مخاطر مسجلة.</p>
              ) : (
                <ul className="space-y-2.5">
                  {risks.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-sm text-rose-950 flex items-start gap-2.5 leading-relaxed bg-rose-50/30 p-2.5 rounded-xl border border-rose-100/80"
                    >
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ⚠
                      </span>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Section D: معلومات غير محسومة */}
        <div className="p-5 sm:p-7">
          <button
            type="button"
            onClick={() => toggleSection("unknowns")}
            className="w-full flex items-center justify-between text-right group focus:outline-none"
            aria-expanded={openSections.unknowns}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                معلومات غير محسومة
              </span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200/60">
                {keyUnknowns.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-slate-400 transition-transform duration-200",
                openSections.unknowns ? "rotate-180" : ""
              )}
              aria-hidden="true"
            />
          </button>

          {openSections.unknowns && (
            <div className="mt-4">
              {keyUnknowns.length === 0 ? (
                <p className="text-xs text-slate-500">تم حسم كافة البيانات الأساسية بنجاح.</p>
              ) : (
                <ul className="space-y-2.5">
                  {keyUnknowns.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-sm text-slate-700 flex items-start gap-2.5 leading-relaxed bg-amber-50/20 p-2.5 rounded-xl border border-amber-100/60"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ?
                      </span>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Section E: الأدلة المعتمدة */}
        <div className="p-5 sm:p-7 bg-slate-50/40">
          <button
            type="button"
            onClick={() => toggleSection("evidence")}
            className="w-full flex items-center justify-between text-right group focus:outline-none"
            aria-expanded={openSections.evidence}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                الأدلة المعتمدة
              </span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-slate-200/80 text-slate-700 rounded-full border border-slate-300/60">
                {evidenceFields.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-slate-400 transition-transform duration-200",
                openSections.evidence ? "rotate-180" : ""
              )}
              aria-hidden="true"
            />
          </button>

          {openSections.evidence && (
            <div className="mt-4">
              {evidenceFields.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد أدلة محددة مسجلة.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {evidenceFields.map((f, idx) => {
                    const fieldDef = FIELD_REGISTRY[f as FieldKey];
                    const label = fieldDef?.label || f;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-xs"
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
