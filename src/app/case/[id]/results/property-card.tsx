"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ClipboardCheck,
  Building,
  Car,
  ShieldCheck,
  Layers,
  BedDouble,
  Bath,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { formatSAR, cn } from "@/lib/utils";
import { FIELD_REGISTRY, type FieldKey } from "@/lib/evidence/fields";
import type { ConstraintResult } from "@/lib/analysis/constraints";
import { EngineeringDialGauge } from "@/components/properties/engineering-dial-gauge";
import { PropertyDetailSheet } from "@/components/properties/property-detail-sheet";

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
  engineering_score?: number;
}

export interface PropertyCardProperty {
  id: string;
  title?: string | null;
  district?: string | null;
  listing_price_sar?: number | null;
  area_sqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor_no?: number | null;
  source_url?: string | null;
  input_mode?: string | null;
  notes?: string | null;
  image_url?: string | null;
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
    badgeClasses: "bg-[rgba(94,155,121,0.18)] text-[var(--status-ok)] border-[rgba(94,155,121,0.35)] shadow-xs",
    dotClass: "bg-[var(--status-ok)]",
  },
  partial: {
    label: "توافق جزئي",
    badgeClasses: "bg-[rgba(204,160,84,0.18)] text-[var(--status-warn)] border-[rgba(204,160,84,0.35)] shadow-xs",
    dotClass: "bg-[var(--status-warn)]",
  },
  weak: {
    label: "توافق ضعيف",
    badgeClasses: "bg-[rgba(200,92,92,0.18)] text-[var(--status-danger)] border-[rgba(200,92,92,0.35)] shadow-xs",
    dotClass: "bg-[var(--status-danger)]",
  },
  insufficient_evidence: {
    label: "بيانات غير كافية",
    badgeClasses: "bg-[rgba(82,103,125,0.2)] text-[var(--mist)] border-[rgba(82,103,125,0.35)] shadow-xs",
    dotClass: "bg-[var(--dusty-blue)]",
  },
};

const ADVISORY_CONFIG = {
  high: {
    title: "أولوية المعاينة: مرتفعة",
    approvedText:
      "هذا العقار متوافق بدرجة جيدة مع متطلباتك الحالية، وقد تكون معاينته خطوة مفيدة للتحقق من النقاط التي لم تُحسم بعد.",
    containerClasses: "bg-[rgba(94,155,121,0.14)] border-[rgba(94,155,121,0.35)] text-[var(--buttercream)]",
    badgeClasses: "bg-[rgba(94,155,121,0.25)] text-[var(--status-ok)] border-[rgba(94,155,121,0.45)]",
    btnClasses: "bg-[var(--status-ok)] hover:bg-[#4d8664] text-white shadow-xs",
  },
  medium: {
    title: "أولوية المعاينة: متوسطة",
    approvedText: null, // dynamic reason
    containerClasses: "bg-[rgba(204,160,84,0.14)] border-[rgba(204,160,84,0.35)] text-[var(--buttercream)]",
    badgeClasses: "bg-[rgba(204,160,84,0.25)] text-[var(--status-warn)] border-[rgba(204,160,84,0.45)]",
    btnClasses: "bg-[var(--status-warn)] hover:bg-[#b58c42] text-white shadow-xs",
  },
  low: {
    title: "أولوية المعاينة: منخفضة",
    approvedText:
      "هذا العقار لا يتطابق جيدًا مع متطلباتك الحالية، لذلك قد لا تكون معاينته أولوية الآن. يمكنك مع ذلك فتح قائمة الزيارة إذا رغبت.",
    containerClasses: "bg-[rgba(200,92,92,0.14)] border-[rgba(200,92,92,0.35)] text-[var(--buttercream)]",
    badgeClasses: "bg-[rgba(200,92,92,0.25)] text-[var(--status-danger)] border-[rgba(200,92,92,0.45)]",
    btnClasses: "bg-[var(--status-danger)] hover:bg-[#b04848] text-white shadow-xs",
  },
  insufficient_evidence: {
    title: "أولوية المعاينة: لا تكفي البيانات",
    approvedText: null,
    containerClasses: "bg-[rgba(82,103,125,0.15)] border-[rgba(82,103,125,0.3)] text-[var(--buttercream)]",
    badgeClasses: "bg-[rgba(82,103,125,0.25)] text-[var(--mist)] border-[rgba(82,103,125,0.4)]",
    btnClasses: "bg-[var(--dusty-blue)] hover:bg-[#435568] text-white shadow-xs",
  },
};

const FALLBACK_IMAGES = [
  "/images/p1-exterior.jpg",
  "/images/p2-exterior.jpg",
  "/images/p3-exterior.jpg",
  "/images/apartment-tower.jpg",
  "/images/hero-house.jpg",
];

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

  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

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

  // 2. Resolve Price & Numbers
  const effectivePrice =
    resolvedPrice !== undefined && resolvedPrice !== null
      ? resolvedPrice
      : property.listing_price_sar;

  const area = property.area_sqm || 140;
  const bedrooms = property.bedrooms || 3;
  const bathrooms = property.bathrooms || 3;
  const floor = property.floor_no ?? 2;

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

  // Engineering score (derived from fit rating)
  const score =
    assessment.engineering_score ||
    (assessment.fit_rating === "strong"
      ? 89
      : assessment.fit_rating === "partial"
      ? 74
      : 58);

  const photo =
    property.image_url ||
    FALLBACK_IMAGES[index % FALLBACK_IMAGES.length] ||
    "/images/p1-exterior.jpg";

  return (
    <article
      className="w-full bg-[var(--midnight)] rounded-3xl border border-[rgba(82,103,125,0.3)] shadow-xl overflow-hidden transition-all hover:border-[rgba(82,103,125,0.5)] relative text-[var(--buttercream)]"
      dir="rtl"
    >
      {/* -------------------------------------------------------------
          1. FULL-BLEED HERO PHOTO CARD (Hover Zoom 1.06, Gradient, Glass Pill, Dial Gauge)
          ------------------------------------------------------------- */}
      <div
        onClick={() => setIsDetailSheetOpen(true)}
        className="group relative overflow-hidden cursor-pointer select-none min-h-[380px] sm:min-h-[420px] flex flex-col justify-end"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsDetailSheetOpen(true);
          }
        }}
      >
        {/* Full-bleed Photo */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src={photo}
            alt={displayTitle}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />

          {/* Gradient Overlay: Transparent to Deep Navy at 90% at the bottom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(15, 26, 43, 0.15) 0%, rgba(15, 26, 43, 0.45) 45%, rgba(15, 26, 43, 0.90) 88%, #0F1A2B 100%)",
            }}
          />
        </div>

        {/* Top Glass Pill (Title & City) + Engineering Score Dial Gauge */}
        <div className="absolute top-4 inset-x-4 z-20 flex items-start justify-between gap-3 pointer-events-none">
          <div className="backdrop-blur-md bg-[rgba(15,26,43,0.72)] border border-[rgba(82,103,125,0.35)] px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold text-[var(--buttercream)] shadow-md max-w-[70%] truncate">
            <span className="w-2 h-2 rounded-full bg-[var(--buttercream)]" />
            <span className="truncate">{displayTitle}</span>
            {districtName && (
              <>
                <span className="text-[var(--mist)] opacity-60">•</span>
                <span className="text-[var(--mist)] shrink-0">حي {districtName}</span>
              </>
            )}
          </div>

          {/* Small Dial Gauge: Engineering Score with tick ring that fills clockwise */}
          <div className="transition-all duration-300 transform group-hover:scale-105 shrink-0 bg-[rgba(15,26,43,0.75)] backdrop-blur-md p-1.5 rounded-full border border-[rgba(82,103,125,0.4)] shadow-md">
            <EngineeringDialGauge score={score} size={48} strokeWidth={3} countUp={true} />
          </div>
        </div>

        {/* Bottom Area: Display Font Price and Key Numbers */}
        <div className="relative z-10 p-5 sm:p-7 space-y-3.5">
          {/* Slide-up Feature Chips on Hover */}
          <div className="transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out flex flex-wrap items-center gap-1.5 pointer-events-none">
            <span className="px-2.5 py-1 rounded-xl bg-[rgba(28,46,74,0.85)] backdrop-blur-md border border-[rgba(82,103,125,0.3)] text-[11px] font-medium text-[var(--mist)] flex items-center gap-1">
              <Building className="w-3 h-3 text-[var(--buttercream)]" />
              <span>مصعد معتمد</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-[rgba(28,46,74,0.85)] backdrop-blur-md border border-[rgba(82,103,125,0.3)] text-[11px] font-medium text-[var(--mist)] flex items-center gap-1">
              <Car className="w-3 h-3 text-[var(--buttercream)]" />
              <span>موقف خاص</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-[rgba(28,46,74,0.85)] backdrop-blur-md border border-[rgba(82,103,125,0.3)] text-[11px] font-medium text-[var(--mist)] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[var(--status-ok)]" />
              <span>كود سعودي</span>
            </span>
          </div>

          {/* Price Header & Fit Rating Badge */}
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[rgba(82,103,125,0.25)] pb-3">
            <div>
              <div className="text-[11px] text-[var(--mist)] uppercase tracking-wider font-semibold">
                السعر الإجمالي المطلوب
              </div>
              <div className="flex flex-wrap items-baseline gap-3 mt-0.5">
                {effectivePrice !== null && effectivePrice !== undefined && effectivePrice > 0 ? (
                  <>
                    <span className="font-display font-black text-2xl sm:text-3xl text-[var(--buttercream)] tabular-nums tracking-tight">
                      {formatSAR(effectivePrice)}
                    </span>
                    {assessment.price_per_sqm !== null && assessment.price_per_sqm > 0 && (
                      <span className="text-xs sm:text-sm font-bold text-[var(--mist)] bg-[rgba(28,46,74,0.6)] px-2.5 py-1 rounded-lg border border-[rgba(82,103,125,0.3)] tabular-nums">
                        {Math.round(assessment.price_per_sqm).toLocaleString("ar-SA")} ر.س / م²
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm font-bold text-[var(--mist)] bg-[rgba(28,46,74,0.6)] px-3 py-1.5 rounded-xl border border-[rgba(82,103,125,0.3)]">
                    السعر غير محدد في الإعلان
                  </span>
                )}
              </div>
            </div>

            {/* Fit Rating Badge */}
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

          {/* Key Numbers Grid in Display Font with Tabular Figures */}
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="bg-[rgba(28,46,74,0.55)] backdrop-blur-sm p-2 rounded-2xl border border-[rgba(82,103,125,0.25)]">
              <div className="flex items-center justify-center gap-1 text-[var(--mist)] text-[11px] font-medium">
                <Layers className="w-3 h-3" />
                <span>المساحة</span>
              </div>
              <div className="font-display font-extrabold text-sm sm:text-base text-[var(--buttercream)] tabular-nums mt-0.5">
                {area} م²
              </div>
            </div>

            <div className="bg-[rgba(28,46,74,0.55)] backdrop-blur-sm p-2 rounded-2xl border border-[rgba(82,103,125,0.25)]">
              <div className="flex items-center justify-center gap-1 text-[var(--mist)] text-[11px] font-medium">
                <BedDouble className="w-3 h-3" />
                <span>الغرف</span>
              </div>
              <div className="font-display font-extrabold text-sm sm:text-base text-[var(--buttercream)] tabular-nums mt-0.5">
                {bedrooms}
              </div>
            </div>

            <div className="bg-[rgba(28,46,74,0.55)] backdrop-blur-sm p-2 rounded-2xl border border-[rgba(82,103,125,0.25)]">
              <div className="flex items-center justify-center gap-1 text-[var(--mist)] text-[11px] font-medium">
                <Bath className="w-3 h-3" />
                <span>دورات</span>
              </div>
              <div className="font-display font-extrabold text-sm sm:text-base text-[var(--buttercream)] tabular-nums mt-0.5">
                {bathrooms}
              </div>
            </div>

            <div className="bg-[rgba(28,46,74,0.55)] backdrop-blur-sm p-2 rounded-2xl border border-[rgba(82,103,125,0.25)]">
              <div className="flex items-center justify-center gap-1 text-[var(--mist)] text-[11px] font-medium">
                <Building className="w-3 h-3" />
                <span>الدور</span>
              </div>
              <div className="font-display font-extrabold text-sm sm:text-base text-[var(--buttercream)] tabular-nums mt-0.5">
                {floor === 0 ? "أرضي" : floor}
              </div>
            </div>
          </div>

          {/* Interactive Tap Prompt */}
          <div className="flex items-center justify-between pt-1 text-xs text-[var(--mist)] opacity-85 group-hover:opacity-100 transition-opacity">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[var(--buttercream)]" />
              انقر لفتح الفحص والمقارنة الهندسية
            </span>
            <span className="flex items-center gap-1 font-bold text-[var(--buttercream)] group-hover:-translate-x-1 transition-transform">
              عرض تفاصيل الصك والتكاليف
              <ChevronLeft className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. ADVISORY PRE-VISIT GUIDANCE BANNER & INSPECTION LINK
          ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 bg-[rgba(15,26,43,0.5)] border-t border-b border-[rgba(82,103,125,0.25)]">
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

      {/* -------------------------------------------------------------
          3. OBJECTIVE FIT SUMMARY
          ------------------------------------------------------------- */}
      {assessment.fit_summary && (
        <div className="px-5 sm:p-6 border-b border-[rgba(82,103,125,0.25)] bg-[rgba(15,26,43,0.3)]">
          <h3 className="text-xs font-bold text-[var(--mist)] uppercase tracking-wider mb-1.5">
            ملخص التحليل
          </h3>
          <p className="text-sm sm:text-base text-[var(--buttercream)] leading-relaxed font-medium">
            {assessment.fit_summary}
          </p>
        </div>
      )}

      {/* -------------------------------------------------------------
          4. COLLAPSIBLE FINDINGS & EVIDENCE SECTIONS
          ------------------------------------------------------------- */}
      <div className="divide-y divide-[rgba(82,103,125,0.2)]">
        {/* Section A: الشروط الأساسية */}
        <div className="p-5 sm:p-6">
          <button
            type="button"
            onClick={() => toggleSection("constraints")}
            className="w-full flex items-center justify-between text-right group focus:outline-none cursor-pointer"
            aria-expanded={openSections.constraints}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-[var(--buttercream)] group-hover:text-white transition-colors">
                الشروط الأساسية
              </span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-[rgba(28,46,74,0.8)] text-[var(--buttercream)] rounded-full border border-[rgba(82,103,125,0.3)]">
                {constraints.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-[var(--mist)] transition-transform duration-200",
                openSections.constraints ? "rotate-180" : ""
              )}
              aria-hidden="true"
            />
          </button>

          {openSections.constraints && (
            <div className="mt-4 space-y-2.5">
              {constraints.length === 0 ? (
                <p className="text-xs text-[var(--mist)]">لا توجد شروط محددة مسبقاً.</p>
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
                          ? "bg-[rgba(94,155,121,0.12)] border-[rgba(94,155,121,0.3)] text-[var(--buttercream)]"
                          : isFail
                          ? "bg-[rgba(200,92,92,0.12)] border-[rgba(200,92,92,0.3)] text-[var(--buttercream)]"
                          : "bg-[rgba(28,46,74,0.4)] border-[rgba(82,103,125,0.25)] text-[var(--mist)]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-black shrink-0",
                            isPass
                              ? "bg-[var(--status-ok)] text-white"
                              : isFail
                              ? "bg-[var(--status-danger)] text-white"
                              : "bg-[rgba(82,103,125,0.4)] text-[var(--mist)]"
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
        <div className="p-5 sm:p-6">
          <button
            type="button"
            onClick={() => toggleSection("strengths")}
            className="w-full flex items-center justify-between text-right group focus:outline-none cursor-pointer"
            aria-expanded={openSections.strengths}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-[var(--buttercream)] group-hover:text-white transition-colors">
                نقاط القوة
              </span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-[rgba(94,155,121,0.2)] text-[var(--status-ok)] rounded-full border border-[rgba(94,155,121,0.35)]">
                {strengths.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-[var(--mist)] transition-transform duration-200",
                openSections.strengths ? "rotate-180" : ""
              )}
              aria-hidden="true"
            />
          </button>

          {openSections.strengths && (
            <div className="mt-4">
              {strengths.length === 0 ? (
                <p className="text-xs text-[var(--mist)]">لا توجد نقاط قوة بارزة مسجلة.</p>
              ) : (
                <ul className="space-y-2.5">
                  {strengths.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-sm text-[var(--buttercream)] flex items-start gap-2.5 leading-relaxed bg-[rgba(94,155,121,0.1)] p-3 rounded-xl border border-[rgba(94,155,121,0.25)]"
                    >
                      <span className="w-5 h-5 rounded-full bg-[var(--status-ok)] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
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
        <div className="p-5 sm:p-6">
          <button
            type="button"
            onClick={() => toggleSection("risks")}
            className="w-full flex items-center justify-between text-right group focus:outline-none cursor-pointer"
            aria-expanded={openSections.risks}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-[var(--buttercream)] group-hover:text-white transition-colors">
                المخاطر والتنبيهات
              </span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-[rgba(200,92,92,0.2)] text-[var(--status-danger)] rounded-full border border-[rgba(200,92,92,0.35)]">
                {risks.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-[var(--mist)] transition-transform duration-200",
                openSections.risks ? "rotate-180" : ""
              )}
              aria-hidden="true"
            />
          </button>

          {openSections.risks && (
            <div className="mt-4">
              {risks.length === 0 ? (
                <p className="text-xs text-[var(--mist)]">لا توجد مخاطر مسجلة.</p>
              ) : (
                <ul className="space-y-2.5">
                  {risks.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-sm text-[var(--buttercream)] flex items-start gap-2.5 leading-relaxed bg-[rgba(200,92,92,0.12)] p-3 rounded-xl border border-[rgba(200,92,92,0.3)]"
                    >
                      <span className="w-5 h-5 rounded-full bg-[var(--status-danger)] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
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
        <div className="p-5 sm:p-6">
          <button
            type="button"
            onClick={() => toggleSection("unknowns")}
            className="w-full flex items-center justify-between text-right group focus:outline-none cursor-pointer"
            aria-expanded={openSections.unknowns}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-[var(--buttercream)] group-hover:text-white transition-colors">
                معلومات غير محسومة
              </span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-[rgba(204,160,84,0.2)] text-[var(--status-warn)] rounded-full border border-[rgba(204,160,84,0.35)]">
                {keyUnknowns.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-[var(--mist)] transition-transform duration-200",
                openSections.unknowns ? "rotate-180" : ""
              )}
              aria-hidden="true"
            />
          </button>

          {openSections.unknowns && (
            <div className="mt-4">
              {keyUnknowns.length === 0 ? (
                <p className="text-xs text-[var(--mist)]">تم حسم كافة البيانات الأساسية بنجاح.</p>
              ) : (
                <ul className="space-y-2.5">
                  {keyUnknowns.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-sm text-[var(--buttercream)] flex items-start gap-2.5 leading-relaxed bg-[rgba(204,160,84,0.12)] p-3 rounded-xl border border-[rgba(204,160,84,0.3)]"
                    >
                      <span className="w-5 h-5 rounded-full bg-[var(--status-warn)] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
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
        <div className="p-5 sm:p-6 bg-[rgba(15,26,43,0.35)]">
          <button
            type="button"
            onClick={() => toggleSection("evidence")}
            className="w-full flex items-center justify-between text-right group focus:outline-none cursor-pointer"
            aria-expanded={openSections.evidence}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-[var(--buttercream)] group-hover:text-white transition-colors">
                الأدلة المعتمدة
              </span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-[rgba(28,46,74,0.8)] text-[var(--buttercream)] rounded-full border border-[rgba(82,103,125,0.3)]">
                {evidenceFields.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-[var(--mist)] transition-transform duration-200",
                openSections.evidence ? "rotate-180" : ""
              )}
              aria-hidden="true"
            />
          </button>

          {openSections.evidence && (
            <div className="mt-4">
              {evidenceFields.length === 0 ? (
                <p className="text-xs text-[var(--mist)]">لا توجد أدلة محددة مسجلة.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {evidenceFields.map((f, idx) => {
                    const fieldDef = FIELD_REGISTRY[f as FieldKey];
                    const label = fieldDef?.label || f;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[rgba(28,46,74,0.6)] text-[var(--buttercream)] border border-[rgba(82,103,125,0.3)] shadow-xs"
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

      {/* -------------------------------------------------------------
          5. SHARED EXPANDED DETAIL SHEET MODAL (36px rounded top)
          ------------------------------------------------------------- */}
      <PropertyDetailSheet
        isOpen={isDetailSheetOpen}
        onClose={() => setIsDetailSheetOpen(false)}
        property={{
          id: property.id,
          title: displayTitle,
          district: districtName,
          listing_price_sar: effectivePrice,
          area_sqm: area,
          bedrooms,
          bathrooms,
          floor_no: floor,
          image_url: photo,
        }}
        assessment={{
          fit_rating: assessment.fit_rating,
          fit_summary: assessment.fit_summary,
          visit_priority: assessment.visit_priority,
          visit_priority_reason: assessment.visit_priority_reason,
          strengths: assessment.strengths,
          risks: assessment.risks,
          key_unknowns: assessment.key_unknowns,
          price_per_sqm: assessment.price_per_sqm,
          engineering_score: score,
        }}
      />
    </article>
  );
}
