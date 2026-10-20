"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ClipboardCheck,
  FileEdit,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Building,
  ShieldCheck,
  Coins,
  Compass,
  Scale,
} from "lucide-react";
import { formatSAR } from "@/lib/utils";
import { DecisionFitGauge } from "./decision-fit-gauge";
import { FIELD_REGISTRY, type FieldKey } from "@/lib/evidence/fields";
import type { ConstraintResult } from "@/lib/analysis/constraints";
import type { ResolvedField } from "@/lib/evidence/resolve";
import type {
  ConfidenceLevel,
  DailyLifeAssessment,
  FairPriceAssessment,
  AffordabilityAssessment,
  TradeoffSummary,
} from "@/lib/analysis/axes";

export interface PropertyDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  rank?: number | null;
  isStandalone?: boolean;
  property: {
    id: string;
    title?: string | null;
    district?: string | null;
    city?: string | null;
    listing_price_sar?: number | null;
    area_sqm?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    floor_no?: number | null;
    image_url?: string | null;
    resolvedFields?: Partial<Record<FieldKey, ResolvedField>>;
  };
  assessment: {
    fit_rating: "strong" | "partial" | "weak" | "insufficient_evidence" | string;
    fit_summary: string;
    visit_priority: "high" | "medium" | "low" | "insufficient_evidence" | string;
    visit_priority_reason: string;
    main_advantage_ar?: string;
    main_tradeoff_ar?: string;
    what_could_change_rank_ar?: string;
    strengths: string[];
    risks: string[];
    key_unknowns?: string[];
    constraint_results?: ConstraintResult[];
    decision_fit_score?: number;
    price_per_sqm?: number | null;
    overall_confidence?: ConfidenceLevel;
    confidence_label_ar?: string;
    confidence_reason_ar?: string;
    daily_life?: DailyLifeAssessment;
    price_axis?: FairPriceAssessment;
    affordability_axis?: AffordabilityAssessment;
    tradeoffs?: TradeoffSummary;
  };
}

const FIT_RATING_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  strong: {
    label: "ملاءمة قوية لاحتياجك",
    bg: "bg-[#E9F4EE]",
    text: "text-[#1E6B43]",
    border: "border-[#C5E4D4]",
  },
  partial: {
    label: "ملاءمة جزئية (مع مفاضلات)",
    bg: "bg-[#FFF9EC]",
    text: "text-[#9A6700]",
    border: "border-[#F9E2AF]",
  },
  weak: {
    label: "ملاءمة ضعيفة لاحتياجك",
    bg: "bg-[#FDF1F0]",
    text: "text-[#A62626]",
    border: "border-[#F6CBC8]",
  },
  insufficient_evidence: {
    label: "بيانات غير كافية للحسم",
    bg: "bg-[var(--cream)]",
    text: "text-[var(--dusty-blue)]",
    border: "border-[var(--mist)]",
  },
};

const PRIORITY_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  high: {
    label: "أولوية المعاينة: مرتفعة",
    bg: "bg-[#E9F4EE]",
    text: "text-[#1E6B43]",
    border: "border-[#C5E4D4]",
  },
  medium: {
    label: "أولوية المعاينة: متوسطة",
    bg: "bg-[#FFF9EC]",
    text: "text-[#9A6700]",
    border: "border-[#F9E2AF]",
  },
  low: {
    label: "أولوية المعاينة: منخفضة",
    bg: "bg-[#FDF1F0]",
    text: "text-[#A62626]",
    border: "border-[#F6CBC8]",
  },
  insufficient_evidence: {
    label: "أولوية المعاينة: تحتاج استكمال بيانات",
    bg: "bg-[var(--cream)]",
    text: "text-[var(--dusty-blue)]",
    border: "border-[var(--mist)]",
  },
};

const CONFIDENCE_MAP: Record<
  ConfidenceLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  high: {
    label: "ثقة عالية في النتيجة",
    bg: "bg-[#E9F4EE]",
    text: "text-[#1E6B43]",
    border: "border-[#C5E4D4]",
  },
  medium: {
    label: "ثقة متوسطة (توجد نواقص محدودة)",
    bg: "bg-[#FFF9EC]",
    text: "text-[#9A6700]",
    border: "border-[#F9E2AF]",
  },
  low: {
    label: "ثقة منخفضة (بيانات أساسية ناقصة)",
    bg: "bg-[#FDF1F0]",
    text: "text-[#A62626]",
    border: "border-[#F6CBC8]",
  },
};

const CORE_DECISION_FIELDS: FieldKey[] = [
  "listing_price_sar",
  "area_sqm",
  "bedrooms",
  "bathrooms",
  "floor_no",
  "building_floors",
  "property_age_years",
  "elevator",
  "private_parking",
  "district",
];

function formatFieldDisplayValue(key: FieldKey, value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "غير مذكور في الإعلان";
  }
  const meta = FIELD_REGISTRY[key];
  if (meta?.valueType === "boolean") {
    if (value === true || value === "true" || value === "yes") return "متوفر ✓";
    if (value === false || value === "false" || value === "no") return "غير متوفر ✗";
  }
  if (key === "listing_price_sar" && typeof value === "number" && value > 0) {
    return formatSAR(value);
  }
  if (key === "area_sqm" && typeof value === "number" && value > 0) {
    return `${value} م²`;
  }
  if (key === "property_age_years" && typeof value === "number") {
    return value === 0 ? "جديد (أول ساكن)" : `${value} سنوات`;
  }
  if (key === "floor_no" && typeof value === "number") {
    return value === 0 ? "الأرضي" : `الدور ${value}`;
  }
  return String(value);
}

export function PropertyDetailSheet({
  isOpen,
  onClose,
  caseId,
  rank,
  isStandalone = false,
  property,
  assessment,
}: PropertyDetailSheetProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fitConfig =
    FIT_RATING_MAP[assessment.fit_rating] || FIT_RATING_MAP.insufficient_evidence;
  const priorityConfig =
    PRIORITY_MAP[assessment.visit_priority] || PRIORITY_MAP.insufficient_evidence;
  const confidenceLevel: ConfidenceLevel =
    assessment.overall_confidence ||
    (assessment.fit_rating === "insufficient_evidence"
      ? "low"
      : (assessment.key_unknowns?.length ?? 0) <= 1
        ? "high"
        : "medium");
  const confidenceConfig = CONFIDENCE_MAP[confidenceLevel];

  const score =
    assessment.decision_fit_score ||
    (assessment.fit_rating === "strong"
      ? 89
      : assessment.fit_rating === "partial"
        ? 74
        : 58);

  const constraints = assessment.constraint_results || [];
  const strengths = assessment.strengths || [];
  const risks = assessment.risks || [];
  const keyUnknowns = assessment.key_unknowns || [];

  const pricePerSqm =
    assessment.price_per_sqm ||
    (property.listing_price_sar && property.area_sqm && property.area_sqm > 0
      ? Math.round(property.listing_price_sar / property.area_sqm)
      : null);

  const factGrid = CORE_DECISION_FIELDS.map((key) => {
    const meta = FIELD_REGISTRY[key];
    const resolved = property.resolvedFields?.[key];

    if (resolved) {
      const isKnown = resolved.status === "known" && resolved.value !== null;
      return {
        key,
        label: meta.label,
        known: isKnown,
        valueText: isKnown
          ? formatFieldDisplayValue(key, resolved.value)
          : "غير مذكور في الإعلان",
      };
    }

    const fallbackMap: Partial<Record<FieldKey, unknown>> = {
      listing_price_sar: property.listing_price_sar,
      area_sqm: property.area_sqm,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      floor_no: property.floor_no,
    };
    const val = fallbackMap[key];
    const isKnown = val !== null && val !== undefined && val !== "" && val !== 0;

    return {
      key,
      label: meta.label,
      known: isKnown,
      valueText: isKnown ? formatFieldDisplayValue(key, val) : "غير مذكور في الإعلان",
    };
  });

  const knownCount = factGrid.filter((f) => f.known).length;
  const missingCount = factGrid.length - knownCount;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="property-detail-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F1A2B]/80 backdrop-blur-md"
        />

        {/* Sheet Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0.6 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[92vh] bg-[var(--paper)] text-[var(--navy)] rounded-t-[32px] sm:rounded-[32px] border border-[var(--mist)] shadow-2xl overflow-y-auto z-10 flex flex-col"
        >
          {/* Sticky Top Bar */}
          <div className="sticky top-0 z-30 backdrop-blur-md bg-[var(--paper)]/95 px-5 sm:px-7 py-4 border-b border-[var(--mist)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {!isStandalone && rank ? (
                <span
                  className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-extrabold shrink-0 ${
                    rank === 1
                      ? "bg-[#1E6B43] text-white"
                      : "bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]"
                  }`}
                >
                  {rank === 1 ? `#1 · الخيار المتصدر` : `#${rank}`}
                </span>
              ) : (
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-extrabold shrink-0 bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]">
                  تحليل قرار منفرد
                </span>
              )}
              <div className="min-w-0">
                <h2
                  id="property-detail-title"
                  className="font-display font-bold text-base sm:text-xl text-[var(--navy)] truncate"
                >
                  {property.title || "تفاصيل الشقة المرشحة"}
                </h2>
                <p className="text-sm text-[var(--dusty-blue)] flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>
                    {property.district ? `حي ${property.district}` : "الحي غير محدد"}
                    {property.city ? ` — ${property.city}` : ""}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="إغلاق تفاصيل العقار"
              className="p-2 rounded-full bg-[var(--cream)] hover:bg-[var(--mist)]/40 text-[var(--navy)] border border-[var(--mist)] transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 sm:p-7 space-y-6">
            {/* PART 1: OVERVIEW CARD (IMAGE + PRICE + FIT + CONFIDENCE) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-[var(--cream)] p-4 sm:p-5 rounded-[24px] border border-[var(--mist)]">
              {/* Core Specs & Decision Summary */}
              <div className="md:col-span-12 flex flex-col justify-between space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--mist)] pb-4">
                  <div>
                    <span className="text-[11px] text-[var(--dusty-blue)] font-medium block">
                      السعر وسعر المتر
                    </span>
                    {property.listing_price_sar && property.listing_price_sar > 0 ? (
                      <div className="flex flex-wrap items-baseline gap-2.5 mt-1">
                        <span className="font-body font-extrabold text-2xl sm:text-3xl text-[var(--navy)] tabular-nums">
                          {formatSAR(property.listing_price_sar)}
                        </span>
                        {pricePerSqm && (
                          <span className="text-xs font-bold text-[var(--dusty-blue)] bg-[var(--paper)] px-2.5 py-1 rounded-lg border border-[var(--mist)] tabular-nums">
                            {pricePerSqm.toLocaleString("en-US")} ر.س / م²
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-block mt-1 text-sm font-bold text-[#9A6700] bg-[#FFF9EC] px-3 py-1 rounded-lg border border-[#F9E2AF]">
                        السعر غير مذكور
                      </span>
                    )}
                  </div>

                  {/* Secondary Fit Indicator */}
                  <div className="flex items-center gap-2.5 bg-[var(--paper)] px-3.5 py-2 rounded-2xl border border-[var(--mist)]">
                    <DecisionFitGauge
                      score={score}
                      size={44}
                      strokeWidth={3.5}
                      countUp={true}
                    />
                    <div>
                      <div className={`text-xs font-bold ${fitConfig.text}`}>
                        {fitConfig.label}
                      </div>
                      <div className="text-xs font-extrabold text-[var(--navy)]">
                        {score} / 100
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confidence + Priority Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${confidenceConfig.bg} ${confidenceConfig.text} ${confidenceConfig.border}`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{assessment.confidence_label_ar || confidenceConfig.label}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}
                  >
                    <span>{priorityConfig.label}</span>
                  </span>
                </div>

                {/* Quick 4-stat Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-[var(--paper)] p-2.5 rounded-xl border border-[var(--mist)]">
                    <div className="text-[11px] text-[var(--dusty-blue)] flex items-center gap-1">
                      <Maximize className="w-3 h-3" />
                      <span>المساحة</span>
                    </div>
                    <div className="font-body font-bold text-xs sm:text-sm text-[var(--navy)] mt-0.5 tabular-nums">
                      {property.area_sqm ? `${property.area_sqm} م²` : "غير مذكور"}
                    </div>
                  </div>
                  <div className="bg-[var(--paper)] p-2.5 rounded-xl border border-[var(--mist)]">
                    <div className="text-[11px] text-[var(--dusty-blue)] flex items-center gap-1">
                      <BedDouble className="w-3 h-3" />
                      <span>الغرف</span>
                    </div>
                    <div className="font-body font-bold text-xs sm:text-sm text-[var(--navy)] mt-0.5 tabular-nums">
                      {property.bedrooms ? `${property.bedrooms} غرف` : "غير مذكور"}
                    </div>
                  </div>
                  <div className="bg-[var(--paper)] p-2.5 rounded-xl border border-[var(--mist)]">
                    <div className="text-[11px] text-[var(--dusty-blue)] flex items-center gap-1">
                      <Bath className="w-3 h-3" />
                      <span>دورات المياه</span>
                    </div>
                    <div className="font-body font-bold text-xs sm:text-sm text-[var(--navy)] mt-0.5 tabular-nums">
                      {property.bathrooms ? `${property.bathrooms}` : "غير مذكور"}
                    </div>
                  </div>
                  <div className="bg-[var(--paper)] p-2.5 rounded-xl border border-[var(--mist)]">
                    <div className="text-[11px] text-[var(--dusty-blue)] flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      <span>الدور</span>
                    </div>
                    <div className="font-body font-bold text-xs sm:text-sm text-[var(--navy)] mt-0.5 tabular-nums">
                      {property.floor_no !== null && property.floor_no !== undefined
                        ? property.floor_no === 0
                          ? "الأرضي"
                          : `الدور ${property.floor_no}`
                        : "غير مذكور"}
                    </div>
                  </div>
                </div>

                {/* Fit & Recommendation Summary */}
                <div className="bg-[var(--paper)] p-3.5 rounded-xl border border-[var(--mist)] space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--navy)]">
                      الخلاصة
                    </span>
                  </div>
                  <p className="text-sm text-[var(--navy)] leading-relaxed">
                    {assessment.fit_summary ||
                      assessment.visit_priority_reason ||
                      "قُيّم حسب الشواهد المتوفرة."}
                  </p>
                  {assessment.confidence_reason_ar && (
                    <p className="text-sm text-[var(--dusty-blue)] pt-1 border-t border-[var(--mist)]/60">
                      <strong className="text-[var(--navy)]">الثقة: </strong>
                      {assessment.confidence_reason_ar}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* PART 1B: 5-AXIS BUYER-PROPERTY DECISION BREAKDOWN */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--paper)] p-5 sm:p-6 space-y-4">
              <div className="border-b border-[var(--mist)] pb-3">
                <h3 className="font-body font-bold text-base text-[var(--navy)]">
                  محاور القرار الخمسة
                </h3>
                <p className="text-sm text-[var(--dusty-blue)] mt-0.5">
                  الشقة مقابل احتياجك وميزانيتك
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Axis 1: Daily Life & Micro-location */}
                <div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--navy)] flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[var(--navy)]" />
                      <span>الموقع والتنقل</span>
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]">
                      {assessment.daily_life?.label_ar || "حسب بيانات الحي"}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--dusty-blue)] leading-relaxed">
                    {assessment.daily_life?.summary_ar ||
                      (property.district
                        ? `حي ${property.district} — جرّب المسار وقت الذروة.`
                        : "الحي غير محدد — تحقّق من الموقع.")}
                  </p>
                </div>

                {/* Axis 2: Fair Price */}
                <div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--navy)] flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-[var(--navy)]" />
                      <span>سعر المتر</span>
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]">
                      {assessment.price_axis?.label_ar ||
                        (pricePerSqm ? `${pricePerSqm.toLocaleString("en-US")} ر.س/م²` : "غير مكتمل")}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--dusty-blue)] leading-relaxed">
                    {assessment.price_axis?.summary_ar ||
                      (pricePerSqm
                        ? `${pricePerSqm.toLocaleString("en-US")} ر.س للمتر (من السعر والمساحة المعلنة).`
                        : "السعر أو المساحة ناقصة.")}
                  </p>
                </div>

                {/* Axis 3: Affordability */}
                <div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--navy)] flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-[var(--navy)]" />
                      <span>القدرة المالية</span>
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]">
                      {assessment.affordability_axis?.label_ar || "حسب ميزانيتك"}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--dusty-blue)] leading-relaxed">
                    {assessment.affordability_axis?.summary_ar ||
                      "السعر مقابل ميزانيتك وطريقة الشراء."}
                  </p>
                </div>

                {/* Axis 4: Main Trade-off & What Could Change Decision */}
                <div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--navy)] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--navy)]" />
                      <span>المفاضلة الرئيسية</span>
                    </span>
                  </div>
                  <p className="text-sm text-[var(--dusty-blue)] leading-relaxed">
                    <strong className="text-[var(--navy)]">المفاضلة: </strong>
                    {assessment.tradeoffs?.[0] ||
                      assessment.main_tradeoff_ar ||
                      "لا مفاضلة جوهرية."}
                  </p>
                  {assessment.what_could_change_rank_ar && (
                    <p className="text-sm text-[#9A6700] leading-relaxed">
                      <strong>ما قد يغير القرار: </strong>
                      {assessment.what_could_change_rank_ar}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* PART 2: HARD CONSTRAINTS BREAKDOWN */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--paper)] p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--mist)] pb-3">
                <div>
                  <h3 className="font-body font-bold text-base text-[var(--navy)]">
                    شروطك الأساسية ({constraints.length})
                  </h3>
                  <p className="text-sm text-[var(--dusty-blue)] mt-0.5">
                    كل شرط حددته في ملفك
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-full bg-[#E9F4EE] text-[#1E6B43]">
                    {constraints.filter((c) => c.result === "pass").length} مطابق
                  </span>
                  {constraints.some((c) => c.result === "fail") && (
                    <span className="px-2.5 py-1 rounded-full bg-[#FDF1F0] text-[#A62626]">
                      {constraints.filter((c) => c.result === "fail").length} مخالف
                    </span>
                  )}
                  {constraints.some((c) => c.result === "unknown") && (
                    <span className="px-2.5 py-1 rounded-full bg-[#FFF9EC] text-[#9A6700]">
                      {constraints.filter((c) => c.result === "unknown").length} غير مؤكد
                    </span>
                  )}
                </div>
              </div>

              {constraints.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {constraints.map((c, idx) => {
                    const isPass = c.result === "pass";
                    const isFail = c.result === "fail";
                    return (
                      <div
                        key={`${c.key}-${idx}`}
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-1.5 ${
                          isPass
                            ? "bg-[#E9F4EE]/50 border-[#C5E4D4]"
                            : isFail
                              ? "bg-[#FDF1F0]/60 border-[#F6CBC8]"
                              : "bg-[#FFF9EC]/60 border-[#F9E2AF]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-body font-bold text-xs sm:text-sm text-[var(--navy)]">
                            {c.labelAr}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isPass
                                ? "bg-[#E9F4EE] text-[#1E6B43]"
                                : isFail
                                  ? "bg-[#FDF1F0] text-[#A62626]"
                                  : "bg-[#FFF9EC] text-[#9A6700]"
                            }`}
                          >
                            {isPass ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>مطابق</span>
                              </>
                            ) : isFail ? (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>غير مطابق</span>
                              </>
                            ) : (
                              <>
                                <HelpCircle className="w-3 h-3" />
                                <span>غير مؤكد</span>
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--dusty-blue)] leading-relaxed">
                          {c.detailAr}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[var(--dusty-blue)]">
                  لا نتائج شروط بعد.
                </p>
              )}
            </div>

            {/* PART 3: VERIFIED FACTS VS. MISSING FIELDS */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--cream)] p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--mist)] pb-3">
                <div>
                  <h4 className="font-body font-bold text-base text-[var(--navy)]">
                    المؤكد مقابل الناقص
                  </h4>
                  <p className="text-sm text-[var(--dusty-blue)] mt-0.5">
                    النواقص تخفض الثقة
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-full bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]">
                    {knownCount} مؤكد
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#FFF9EC] text-[#9A6700] border border-[#F9E2AF]">
                    {missingCount} ناقص
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {factGrid.map((f) => (
                  <div
                    key={f.key}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-1.5 ${
                      f.known
                        ? "bg-[var(--paper)] border-[var(--mist)]"
                        : "bg-[#FFF9EC]/60 border-[#F9E2AF]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-[var(--dusty-blue)]">
                        {f.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          f.known
                            ? "bg-[var(--cream)] text-[var(--navy)]"
                            : "bg-[#FFF9EC] text-[#9A6700]"
                        }`}
                      >
                        {f.known ? "مؤكد" : "ناقص"}
                      </span>
                    </div>
                    <div
                      className={`font-body text-xs sm:text-sm ${
                        f.known
                          ? "font-extrabold text-[var(--navy)] tabular-nums"
                          : "font-semibold text-[#9A6700]"
                      }`}
                    >
                      {f.valueText}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Risks / Unknowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="rounded-[20px] border border-[#C5E4D4] bg-[#E9F4EE]/60 p-4 space-y-2.5">
                <h4 className="font-body font-bold text-xs sm:text-sm text-[#1E6B43]">
                  ✓ المزايا ({strengths.length})
                </h4>
                {strengths.length > 0 ? (
                  <ul className="space-y-1.5">
                    {strengths.map((s, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-[var(--navy)] flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-[#1E6B43] font-bold shrink-0">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--dusty-blue)]">
                    لا مزايا إضافية.
                  </p>
                )}
              </div>

              {/* Risks & Unknowns */}
              <div className="rounded-[20px] border border-[#F6CBC8] bg-[#FDF1F0]/60 p-4 space-y-2.5">
                <h4 className="font-body font-bold text-xs sm:text-sm text-[#A62626] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>المخاطر والنواقص ({risks.length + keyUnknowns.length})</span>
                </h4>
                {risks.length > 0 || keyUnknowns.length > 0 ? (
                  <ul className="space-y-1.5">
                    {risks.map((r, idx) => (
                      <li
                        key={`r-${idx}`}
                        className="text-xs text-[var(--navy)] flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-[#A62626] font-bold shrink-0">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                    {keyUnknowns.map((u, idx) => (
                      <li
                        key={`u-${idx}`}
                        className="text-xs text-[#9A6700] flex items-start gap-2 leading-relaxed"
                      >
                        <span className="font-bold shrink-0">؟</span>
                        <span>ناقصة: {u}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--dusty-blue)]">
                    لا مخاطر حرجة.
                  </p>
                )}
              </div>
            </div>

            {/* PART 4: ACTION FOOTER (INSPECTION & FACT MANAGEMENT) */}
            {caseId && (
              <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--paper)] p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-body font-bold text-xs sm:text-sm text-[var(--navy)]">
                    الخطوة التالية
                  </div>
                  <p className="text-sm text-[var(--dusty-blue)]">
                    حدّث البيانات أو ابدأ المعاينة.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <Link
                    href={`/case/${caseId}/properties/${property.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--cream)] hover:bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] hover:border-[var(--navy)] text-xs font-body font-bold transition-all no-underline"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>تعديل بيانات العقار</span>
                  </Link>
                  <Link
                    href={`/case/${caseId}/inspection?propertyId=${property.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] text-xs font-body font-bold transition-all no-underline"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>بدء المعاينة الميدانية ←</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
