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
  ChevronLeft,
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
  strong: { label: "ملاءمة قوية", bg: "bg-[#E9F4EE]", text: "text-[#1E6B43]", border: "border-[#C5E4D4]" },
  partial: { label: "ملاءمة جزئية", bg: "bg-[#FFF9EC]", text: "text-[#9A6700]", border: "border-[#F9E2AF]" },
  weak: { label: "ملاءمة ضعيفة", bg: "bg-[#FDF1F0]", text: "text-[#A62626]", border: "border-[#F6CBC8]" },
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
  const pricePerSqm =
    assessment.price_per_sqm || (price && area ? Math.round(price / area) : null);

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
  const unknownCount = constraints.filter((c) => c.result === "unknown").length;

  const title = property.title || `شقة في حي ${property.district || "غير محدد"}`;
  const districtLabel = property.district ? `حي ${property.district}` : "الحي غير مذكور";

  const verdict =
    assessment.fit_summary || assessment.main_advantage_ar || assessment.visit_priority_reason;
  const tradeoff =
    assessment.tradeoffs?.[0] ||
    assessment.main_tradeoff_ar ||
    assessment.risks?.[0] ||
    (assessment.key_unknowns?.[0] ? `غير مؤكد: ${assessment.key_unknowns[0]}` : "");

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
    unknownCount,
    title,
    districtLabel,
    verdict,
    tradeoff,
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
        /* ================= VERDICT CARD (#1 or standalone) ================= */
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full rounded-[28px] bg-[var(--paper)] border border-[var(--mist)] shadow-[0_24px_64px_rgba(15,26,43,0.07)] overflow-hidden"
          dir="rtl"
        >
          {/* Accent spine signals "the answer" without decoration noise */}
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 right-0 w-1.5 ${isStandalone ? "bg-[var(--navy)]" : "bg-[#1E6B43]"}`}
          />

          <div className="p-5 sm:p-8 lg:grid lg:grid-cols-12 lg:gap-10">
            {/* Identity + numbers */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {isStandalone ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--navy)] text-[var(--cream)] text-xs font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        الخلاصة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E6B43] text-white text-xs font-bold">
                        <Trophy className="w-3.5 h-3.5" />
                        {isProvisionalWinner ? "#1 · مبدئياً" : "#1 · الأنسب لك"}
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${m.fitBadge.bg} ${m.fitBadge.text} ${m.fitBadge.border}`}
                    >
                      {m.fitBadge.label}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-xl sm:text-3xl text-[var(--navy)] leading-snug">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--dusty-blue)] flex items-center gap-1">
                      <MapPin className="w-4 h-4 shrink-0" />
                      {m.districtLabel}
                      {property.city ? ` · ${property.city}` : ""}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center gap-1">
                  <DecisionFitGauge score={m.score} size={64} strokeWidth={4} countUp />
                  <span className="text-[11px] font-semibold text-[var(--dusty-blue)] whitespace-nowrap">
                    {m.confidenceLabel}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {m.price ? (
                  <span className="font-body font-extrabold text-3xl sm:text-4xl text-[var(--navy)] tabular-nums">
                    {formatSAR(m.price)}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-[#9A6700]">السعر غير مذكور</span>
                )}
                {m.pricePerSqm && (
                  <span className="text-sm text-[var(--dusty-blue)] tabular-nums">
                    {m.pricePerSqm.toLocaleString("en-US")} ر.س/م²
                  </span>
                )}
              </div>

              {m.specs.length > 0 && (
                <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-[var(--navy)]">
                  {m.specs.map(({ icon: Icon, text }) => (
                    <li key={text} className="inline-flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-[var(--dusty-blue)]" />
                      <span className="tabular-nums">{text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Verdict + actions */}
            <div className="lg:col-span-5 mt-6 lg:mt-0 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-r lg:pr-10 border-[var(--mist)] flex flex-col gap-5">
              {m.verdict && (
                <p className="text-base leading-relaxed text-[var(--navy)] font-medium line-clamp-3">
                  {m.verdict}
                </p>
              )}

              {m.tradeoff && (
                <p className="flex items-start gap-2 text-sm text-[#9A6700] leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{m.tradeoff}</span>
                </p>
              )}

              {m.constraints.length > 0 && (
                <div className="flex flex-wrap gap-1.5" aria-label={`شروطك ${m.passCount}/${m.constraints.length}`}>
                  {m.constraints.slice(0, 5).map((c, i) => {
                    const Icon = c.result === "pass" ? CheckCircle2 : c.result === "fail" ? XCircle : HelpCircle;
                    const tone =
                      c.result === "pass"
                        ? "text-[#1E6B43] bg-[#E9F4EE]"
                        : c.result === "fail"
                          ? "text-[#A62626] bg-[#FDF1F0]"
                          : "text-[#9A6700] bg-[#FFF9EC]";
                    return (
                      <span
                        key={`${c.key}-${i}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${tone}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {c.labelAr}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="mt-auto grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(true)}
                  className="h-12 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] active:scale-[0.98] text-[var(--cream)] text-sm font-bold transition-all cursor-pointer"
                >
                  التفاصيل
                </button>
                {caseId && (
                  <Link
                    href={`/case/${caseId}/inspection?propertyId=${property.id}`}
                    className="h-12 inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--mist)] hover:border-[var(--navy)] active:scale-[0.98] text-[var(--navy)] text-sm font-bold transition-all no-underline"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    المعاينة
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.article>
      ) : (
        /* ================= COMPACT ROW (#2 – #5) ================= */
        <motion.button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="group w-full text-right flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-[20px] bg-[var(--paper)] border border-[var(--mist)] hover:border-[var(--navy)]/40 active:scale-[0.99] transition-all cursor-pointer"
          dir="rtl"
        >
          <span className="shrink-0 w-9 h-9 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] font-extrabold text-sm flex items-center justify-center tabular-nums">
            {effectiveRank}
          </span>

          <span className="min-w-0 flex-1 space-y-1">
            <span className="block font-bold text-[15px] text-[var(--navy)] truncate">{m.title}</span>
            <span className="flex items-center gap-2 text-[13px] text-[var(--dusty-blue)] min-w-0">
              <span className={`shrink-0 font-semibold ${m.fitBadge.text}`}>{m.fitBadge.label}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">
                {[m.districtLabel, ...m.specs.slice(0, 2).map((s) => s.text)].join(" · ")}
              </span>
            </span>
          </span>

          <span className="shrink-0 flex items-center gap-3">
            <span className="hidden sm:block font-extrabold text-sm text-[var(--navy)] tabular-nums">
              {m.price ? formatSAR(m.price) : "—"}
            </span>
            <DecisionFitGauge score={m.score} size={40} strokeWidth={3.5} countUp />
            <ChevronLeft className="w-4 h-4 text-[var(--dusty-blue)] group-hover:-translate-x-0.5 transition-transform" />
          </span>
        </motion.button>
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

  return (
    <div className="space-y-8" dir="rtl">
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
        <section className="space-y-3">
          <h3 className="font-display font-bold text-base sm:text-lg text-[var(--navy)]">
            بقية الشقق
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3">
            {runnersUp.map((entry, idx) => (
              <PropertyCardRedesigned
                key={entry.property.id}
                property={entry.property}
                assessment={entry.assessment}
                caseId={caseId}
                index={idx + 1}
                rank={entry.rank ?? idx + 2}
                isTopWinner={false}
                isStandalone={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
