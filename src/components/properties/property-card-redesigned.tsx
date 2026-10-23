"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Building,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  ClipboardCheck,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { formatSAR } from "@/lib/utils";
import { DecisionFitGauge } from "./decision-fit-gauge";
import { PropertyDetailSheet } from "./property-detail-sheet";
import type { ConstraintResult } from "@/lib/analysis/constraints";
import type { FieldKey } from "@/lib/evidence/fields";
import type { ResolvedField } from "@/lib/evidence/resolve";
import type {
  ConfidenceLevel,
  DailyLifeAssessment,
  FairPriceAssessment,
  AffordabilityAssessment,
  TradeoffSummary,
} from "@/lib/analysis/axes";

export interface PropertyCardData {
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
}

export interface PropertyAssessmentData {
  fit_rating: "strong" | "partial" | "weak" | "insufficient_evidence" | string;
  fit_summary: string;
  visit_priority: "high" | "medium" | "low" | "insufficient_evidence" | string;
  visit_priority_reason: string;
  main_advantage_ar?: string;
  main_tradeoff_ar?: string;
  what_could_change_rank_ar?: string;
  ranking_reason_ar?: string;
  preferences_impact_ar?: string;
  score_vs_rank_note_ar?: string;
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
}

export interface PropertyCardRedesignedProps {
  property: PropertyCardData;
  assessment: PropertyAssessmentData;
  caseId?: string;
  index?: number;
  rank?: number | null;
  isTopWinner?: boolean;
  isStandalone?: boolean;
}

type Tone = { label: string; bg: string; text: string; border: string };

const FIT_BADGE_MAP: Record<string, Tone> = {
  strong: {
    label: "ملاءمة قوية",
    bg: "bg-[#E9F4EE]",
    text: "text-[#1E6B43]",
    border: "border-[#C5E4D4]",
  },
  partial: {
    label: "ملاءمة جزئية",
    bg: "bg-[#FFF9EC]",
    text: "text-[#9A6700]",
    border: "border-[#F9E2AF]",
  },
  weak: {
    label: "ملاءمة ضعيفة",
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

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: "ثقة عالية",
  medium: "ثقة متوسطة",
  low: "ثقة منخفضة",
};

/** Derives every display value once so both card variants stay in sync. */
function getCardModel(property: PropertyCardData, assessment: PropertyAssessmentData) {
  const score =
    assessment.decision_fit_score ||
    (assessment.fit_rating === "strong" ? 89 : assessment.fit_rating === "partial" ? 74 : 58);

  const price =
    property.listing_price_sar && property.listing_price_sar > 0 ? property.listing_price_sar : null;
  const area = property.area_sqm && property.area_sqm > 0 ? property.area_sqm : null;
  const bedrooms = property.bedrooms ?? null;
  const bathrooms = property.bathrooms ?? null;
  const floorNo = property.floor_no ?? null;
  const rawPricePerSqm =
    assessment.price_per_sqm || (price && area ? price / area : null);
  const pricePerSqm = rawPricePerSqm ? Math.round(rawPricePerSqm) : null;

  const fitBadge = FIT_BADGE_MAP[assessment.fit_rating] || FIT_BADGE_MAP.insufficient_evidence;
  const confidenceLevel: ConfidenceLevel =
    assessment.overall_confidence ||
    (assessment.fit_rating === "insufficient_evidence"
      ? "low"
      : (assessment.key_unknowns?.length ?? 0) <= 1
        ? "high"
        : "medium");

  const constraints = assessment.constraint_results || [];
  const passCount = constraints.filter((c) => c.result === "pass").length;
  const failCount = constraints.filter((c) => c.result === "fail").length;
  const unknownCount = constraints.filter((c) => c.result === "unknown").length;

  const title = property.title || `شقة في حي ${property.district || "غير محدد"}`;
  const districtLabel = property.district ? `حي ${property.district}` : "الحي غير مذكور";

  const verdict =
    assessment.fit_summary || assessment.main_advantage_ar || assessment.visit_priority_reason;
  const rawTradeoff =
    assessment.tradeoffs?.[0] ||
    assessment.main_tradeoff_ar ||
    assessment.risks?.[0] ||
    (assessment.key_unknowns?.[0] ? `غير مؤكد: ${assessment.key_unknowns[0]}` : "");
  const tradeoff = rawTradeoff
    .replace(/من \(التحقق(\s+الميداني)?\s+من\s+/, "من (")
    .replace(/\.\)/g, ")");

  const rankingReason = assessment.ranking_reason_ar || "";
  const preferencesImpact = assessment.preferences_impact_ar || "";
  const scoreVsRankNote = assessment.score_vs_rank_note_ar || "";

  const specs = [
    area ? { icon: Maximize, text: `${area} م²` } : null,
    bedrooms !== null ? { icon: BedDouble, text: `${bedrooms} غرف` } : null,
    bathrooms !== null ? { icon: Bath, text: `${bathrooms} دورات` } : null,
    floorNo !== null ? { icon: Building, text: floorNo === 0 ? "الأرضي" : `الدور ${floorNo}` } : null,
  ].filter(Boolean) as { icon: typeof Maximize; text: string }[];

  return {
    score,
    price,
    pricePerSqm,
    fitBadge,
    confidenceLabel: assessment.confidence_label_ar || CONFIDENCE_LABEL[confidenceLevel],
    constraints,
    passCount,
    failCount,
    unknownCount,
    title,
    districtLabel,
    verdict,
    tradeoff,
    rankingReason,
    preferencesImpact,
    scoreVsRankNote,
    specs,
  };
}

export function PropertyCardRedesigned({
  property,
  assessment,
  caseId,
  index = 0,
  rank,
  isTopWinner = false,
  isStandalone = false,
}: PropertyCardRedesignedProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const m = getCardModel(property, assessment);
  const effectiveRank = isStandalone ? null : (rank ?? index + 1);
  const showHeroCard = isTopWinner || isStandalone;
  const isProvisionalWinner =
    !isStandalone &&
    (assessment.fit_rating === "weak" ||
      assessment.fit_rating === "insufficient_evidence" ||
      m.unknownCount > 0);

  return (
    <>
      {showHeroCard ? (
        /* ================= VERDICT HERO CARD (#1 or standalone) ================= */
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full rounded-[26px] bg-[var(--paper)] border border-[var(--mist)] shadow-[0_20px_54px_rgba(15,26,43,0.06)] overflow-hidden"
          dir="rtl"
        >
          {/* Accent spine on inline-start (right in RTL) */}
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 right-0 w-1.5 ${
              isStandalone ? "bg-[var(--navy)]" : "bg-[#1E6B43]"
            }`}
          />

          {/* ZONE 1: Identity, Specs, Price & Fit Score Header */}
          <div className="p-5 sm:p-7 pb-5 border-b border-[var(--mist)]/80 flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Identity + Location + Specs */}
            <div className="space-y-3 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {isStandalone ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--navy)] text-[var(--cream)] text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    الخلاصة
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E6B43] text-white text-xs font-bold shadow-xs">
                    <Trophy className="w-3.5 h-3.5" />
                    {isProvisionalWinner ? "#1 · مبدئياً" : "#1 · الأنسب لك"}
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${m.fitBadge.bg} ${m.fitBadge.text} ${m.fitBadge.border}`}
                >
                  {m.fitBadge.label}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[11px] font-bold text-[var(--dusty-blue)]">
                  {m.confidenceLabel}
                </span>
              </div>

              <div>
                <h3 className="font-display font-extrabold text-xl sm:text-2xl lg:text-[26px] text-[var(--navy)] leading-snug">
                  {m.title}
                </h3>
              </div>

              {/* Unified Location + Specs Strip */}
              <div className="flex flex-wrap [flex-wrap:balance] items-center gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--cream)] border border-[var(--mist)] text-xs font-bold text-[var(--navy)]">
                  <MapPin className="w-3.5 h-3.5 text-[var(--dusty-blue)] shrink-0" />
                  <span>
                    {m.districtLabel}
                    {property.city ? ` · ${property.city}` : ""}
                  </span>
                </span>
                {m.specs.map(({ icon: Icon, text }) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--cream)]/75 border border-[var(--mist)]/90 text-xs font-bold text-[var(--navy)] tabular-nums"
                  >
                    <Icon className="w-3.5 h-3.5 text-[var(--dusty-blue)] shrink-0" />
                    <span>{text}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Cohesive Price + Decision Fit Score Cluster */}
            <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-5 px-4 sm:px-5 py-3.5 rounded-2xl bg-[var(--cream)]/75 border border-[var(--mist)] shrink-0">
              <div className="space-y-0.5">
                <span className="block text-[11px] font-bold text-[var(--dusty-blue)]">
                  السعر المعروض
                </span>
                {m.price ? (
                  <span className="block font-body font-extrabold text-2xl sm:text-[28px] text-[var(--navy)] tabular-nums leading-tight">
                    {formatSAR(m.price)}
                  </span>
                ) : (
                  <span className="block text-sm font-bold text-[#9A6700]">
                    السعر غير مذكور
                  </span>
                )}
                {m.pricePerSqm && (
                  <span className="block text-xs font-semibold text-[var(--dusty-blue)] tabular-nums">
                    {m.pricePerSqm.toLocaleString("en-US")} ر.س/م²
                  </span>
                )}
              </div>

              <div className="w-px h-12 bg-[var(--mist)] shrink-0" aria-hidden="true" />

              <div className="flex flex-col items-center gap-1 shrink-0">
                <DecisionFitGauge score={m.score} size={58} strokeWidth={4.5} countUp />
                <span className="text-[10px] font-bold text-[var(--dusty-blue)] whitespace-nowrap">
                  درجة الملاءمة
                </span>
              </div>
            </div>
          </div>

          {/* ZONE 2: Balanced 2-Column Decision Intelligence Grid */}
          <div className="p-5 sm:p-7 py-5 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
            {/* Right Panel (7 cols): Ranking Reason, Verdict & Hard Constraints Proof */}
            <div className="lg:col-span-7 rounded-2xl bg-[#E9F4EE]/50 border border-[#C5E4D4] p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                {!isStandalone && m.rankingReason ? (
                  <p className="text-xs sm:text-sm leading-relaxed text-[var(--navy)] font-medium">
                    <strong className="font-bold text-[#1E6B43]">سبب الترتيب: </strong>
                    {m.rankingReason}
                  </p>
                ) : (
                  m.verdict && (
                    <p className="text-xs sm:text-sm leading-relaxed text-[var(--navy)] font-medium">
                      {m.verdict}
                    </p>
                  )
                )}

                {!isStandalone && m.verdict && m.verdict !== m.rankingReason && (
                  <p className="text-xs leading-relaxed text-[var(--dusty-blue)]">
                    {m.verdict}
                  </p>
                )}
              </div>

              {m.constraints.length > 0 && (
                <div
                  className="pt-3 border-t border-[#C5E4D4]/80 space-y-2"
                  aria-label={`شروطك ${m.passCount}/${m.constraints.length}`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1E6B43]">
                    <span>الشروط الملزمة ({m.passCount} من {m.constraints.length} مطابقة)</span>
                  </div>
                  <div className="flex flex-wrap [flex-wrap:balance] gap-1.5">
                    {m.constraints.slice(0, 6).map((c, i) => {
                      const Icon =
                        c.result === "pass"
                          ? CheckCircle2
                          : c.result === "fail"
                            ? XCircle
                            : HelpCircle;
                      const tone =
                        c.result === "pass"
                          ? "text-[#1E6B43] bg-[var(--paper)] border-[#C5E4D4]"
                          : c.result === "fail"
                            ? "text-[#A62626] bg-[#FDF1F0] border-[#F6CBC8]"
                            : "text-[#9A6700] bg-[#FFF9EC] border-[#F9E2AF]";
                      return (
                        <span
                          key={`${c.key}-${i}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${tone}`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{c.labelAr}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Left Panel (5 cols): Preferences Impact & Trade-offs / Field Verification */}
            <div className="lg:col-span-5 rounded-2xl bg-[var(--cream)]/60 border border-[var(--mist)] p-4 sm:p-5 flex flex-col justify-between gap-3.5">
              {m.preferencesImpact ? (
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--navy)]">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                    <span>تفضيلاتك الإضافية</span>
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-[var(--navy)] bg-[var(--paper)] border border-[var(--mist)] rounded-xl p-3 font-medium">
                    {m.preferencesImpact}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--navy)]">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                    <span>ملخص الملاءمة</span>
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-[var(--navy)] bg-[var(--paper)] border border-[var(--mist)] rounded-xl p-3">
                    {m.verdict || "الشقة متوافقة مع المعطيات الأساسية المدخلة."}
                  </p>
                </div>
              )}

              {m.tradeoff && (
                <div className="rounded-xl bg-[#FFF9EC] border border-[#F9E2AF] p-3 flex items-start gap-2 text-xs sm:text-[13px] text-[#9A6700] leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{m.tradeoff}</span>
                </div>
              )}
            </div>
          </div>

          {/* ZONE 3: Action Footer Bar */}
          <div className="px-5 sm:px-7 py-3.5 bg-[var(--cream)]/40 border-t border-[var(--mist)]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs font-semibold text-[var(--dusty-blue)]">
              افتح البطاقة التفصيلية لمراجعة المحاور الخمسة أو انتقل لقائمة التحقق الميداني عند الزيارة.
            </p>
            <div className="grid grid-cols-2 sm:flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsSheetOpen(true)}
                className="h-11 px-6 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] active:scale-[0.98] text-[var(--cream)] text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                التفاصيل
              </button>
              {caseId && (
                <Link
                  href={`/case/${caseId}/inspection?propertyId=${property.id}`}
                  className="h-11 px-5 inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--paper)] border border-[var(--mist)] hover:border-[var(--navy)] active:scale-[0.98] text-[var(--navy)] text-xs sm:text-sm font-bold transition-all no-underline"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>المعاينة</span>
                </Link>
              )}
            </div>
          </div>
        </motion.article>
      ) : (
        /* ================= RUNNER-UP CARD (#2 – #5) ================= */
        <motion.article
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="w-full rounded-[24px] bg-[var(--paper)] border border-[var(--mist)] hover:border-[var(--navy)]/40 shadow-[0_12px_32px_rgba(15,26,43,0.04)] transition-all overflow-hidden"
          dir="rtl"
        >
          {/* Top Identity, Specs, Price & Actions Row */}
          <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <span className="shrink-0 w-10 h-10 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] font-extrabold text-sm flex items-center justify-center tabular-nums">
                #{effectiveRank}
              </span>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-display font-bold text-base sm:text-lg text-[var(--navy)] leading-snug">
                    {m.title}
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${m.fitBadge.bg} ${m.fitBadge.text} ${m.fitBadge.border}`}
                  >
                    {m.fitBadge.label}
                  </span>
                </div>

                {/* Specs + Failed/Passed Constraint Chips */}
                <div className="flex flex-wrap [flex-wrap:balance] items-center gap-1.5 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] font-semibold">
                    <MapPin className="w-3 h-3 text-[var(--dusty-blue)]" />
                    {m.districtLabel}
                  </span>
                  {m.specs.map(({ icon: Icon, text }) => (
                    <span
                      key={text}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[var(--cream)]/70 border border-[var(--mist)]/80 text-[var(--navy)] font-semibold tabular-nums"
                    >
                      <Icon className="w-3 h-3 text-[var(--dusty-blue)]" />
                      {text}
                    </span>
                  ))}
                  {m.constraints
                    .filter((c) => c.result === "fail")
                    .map((c, idx) => (
                      <span
                        key={`fail-${c.key}-${idx}`}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#FDF1F0] border border-[#F6CBC8] text-[#A62626] font-bold"
                      >
                        <XCircle className="w-3 h-3 shrink-0" />
                        <span>مخالفة: {c.labelAr}</span>
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {/* Price + Score + Action Buttons */}
            <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--mist)]/60 shrink-0">
              <div className="text-right">
                <span className="block font-extrabold text-lg sm:text-xl text-[var(--navy)] tabular-nums leading-tight">
                  {m.price ? formatSAR(m.price) : "—"}
                </span>
                {m.pricePerSqm && (
                  <span className="block text-[11px] font-semibold text-[var(--dusty-blue)] tabular-nums">
                    {m.pricePerSqm.toLocaleString("en-US")} ر.س/م²
                  </span>
                )}
              </div>

              <DecisionFitGauge score={m.score} size={46} strokeWidth={4} countUp />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(true)}
                  className="h-10 px-4 rounded-full bg-[var(--cream)] hover:bg-[var(--navy)] text-[var(--navy)] hover:text-[var(--cream)] border border-[var(--mist)] hover:border-[var(--navy)] text-xs font-bold transition-colors cursor-pointer"
                >
                  التفاصيل
                </button>
                {caseId && (
                  <Link
                    href={`/case/${caseId}/inspection?propertyId=${property.id}`}
                    className="h-10 px-3.5 inline-flex items-center justify-center gap-1 rounded-full bg-[var(--paper)] border border-[var(--mist)] hover:border-[var(--navy)] text-[var(--navy)] text-xs font-bold transition-colors no-underline"
                    title="قائمة المعاينة"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">المعاينة</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Ranking Explanation & Price-vs-Rank Callout Grid */}
          {(m.rankingReason || m.tradeoff || m.preferencesImpact || m.scoreVsRankNote) && (
            <div className="px-4 sm:px-6 py-4 bg-[var(--cream)]/35 border-t border-[var(--mist)]/70 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch text-xs sm:text-[13px] leading-relaxed">
              <div
                className={`${
                  m.scoreVsRankNote ? "lg:col-span-7" : "lg:col-span-12"
                } space-y-1.5 flex flex-col justify-center`}
              >
                {(m.rankingReason || m.tradeoff) && (
                  <p className="text-[var(--navy)]">
                    <strong className="font-bold text-[var(--navy)]">سبب الترتيب: </strong>
                    {m.rankingReason || m.tradeoff}
                  </p>
                )}
                {m.preferencesImpact && (
                  <p className="text-[var(--dusty-blue)]">{m.preferencesImpact}</p>
                )}
              </div>

              {m.scoreVsRankNote && (
                <div className="lg:col-span-5 rounded-xl bg-[#FFF9EC] border border-[#F9E2AF] p-3 text-[#9A6700] font-medium flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{m.scoreVsRankNote}</span>
                </div>
              )}
            </div>
          )}
        </motion.article>
      )}

      <PropertyDetailSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        caseId={caseId}
        rank={effectiveRank}
        isStandalone={isStandalone}
        property={property}
        assessment={assessment}
      />
    </>
  );
}

export interface ResultsLeaderboardProps {
  entries: Array<{
    property: PropertyCardData;
    assessment: PropertyAssessmentData;
    rank?: number | null;
  }>;
  caseId?: string;
}

export function ResultsLeaderboard({ entries, caseId }: ResultsLeaderboardProps) {
  if (!entries || entries.length === 0) return null;

  const isStandalone = entries.length === 1;
  const [topWinner, ...runnersUp] = entries;
  const topScore =
    topWinner.assessment.decision_fit_score ||
    (topWinner.assessment.fit_rating === "strong"
      ? 89
      : topWinner.assessment.fit_rating === "partial"
        ? 74
        : 58);

  return (
    <div className="space-y-6 sm:space-y-8" dir="rtl">
      <PropertyCardRedesigned
        property={topWinner.property}
        assessment={topWinner.assessment}
        caseId={caseId}
        index={0}
        rank={isStandalone ? null : (topWinner.rank ?? 1)}
        isTopWinner={!isStandalone}
        isStandalone={isStandalone}
      />

      {runnersUp.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="font-display font-bold text-base sm:text-lg text-[var(--navy)]">
              بقية الشقق المرشحة
            </h3>
            <span className="text-xs font-semibold text-[var(--dusty-blue)]">
              مرتبة حسب تحقيق الشروط الملزمة ثم التفضيلات
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {runnersUp.map((entry, idx) => {
              const entryScore =
                entry.assessment.decision_fit_score ||
                (entry.assessment.fit_rating === "strong"
                  ? 89
                  : entry.assessment.fit_rating === "partial"
                    ? 74
                    : 58);
              const fallbackScoreNote =
                !entry.assessment.score_vs_rank_note_ar && entryScore >= topScore
                  ? `توضيح الترتيب مقابل النسبة (${entryScore}%): الترتيب يُقدّم الشقة الأعلى رتبة لأنها أوفى في تحقيق شروطك الملزمة المؤكدة وتفضيلاتك قبل السعر.`
                  : entry.assessment.score_vs_rank_note_ar;

              return (
                <PropertyCardRedesigned
                  key={entry.property.id}
                  property={entry.property}
                  assessment={{
                    ...entry.assessment,
                    score_vs_rank_note_ar: fallbackScoreNote,
                  }}
                  caseId={caseId}
                  index={idx + 1}
                  rank={entry.rank ?? idx + 2}
                  isTopWinner={false}
                  isStandalone={false}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
