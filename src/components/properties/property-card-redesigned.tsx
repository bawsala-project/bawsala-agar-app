"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatSAR } from "@/lib/utils";
import type { ConstraintResult } from "@/lib/analysis/constraints";
import { PropertyDetailSheet } from "./property-detail-sheet";

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
  notes?: string | null;
}

export interface PropertyAssessmentData {
  fit_rating: string;
  fit_summary: string;
  visit_priority: string;
  visit_priority_reason: string;
  strengths?: string[];
  risks?: string[];
  key_unknowns?: string[];
  constraint_results?: ConstraintResult[];
  constraint_summary?: {
    pass: number;
    fail: number;
    unknown: number;
  };
  main_advantage_ar?: string;
  main_tradeoff_ar?: string;
  value_badge_ar?: string | null;
  engineering_score?: number;
  price_per_sqm?: number | null;
}

interface PropertyCardRedesignedProps {
  property: PropertyCardData;
  assessment?: PropertyAssessmentData;
  index?: number;
  rank?: number;
  caseId?: string;
  className?: string;
  onOpenDetail?: () => void;
}

/**
 * Laurel Wreath + Stars SVG emblem for Podium Pedestals (1, 2, 3)
 */
function PodiumEmblem({
  rank,
  isDark,
}: {
  rank: number;
  isDark: boolean;
}) {
  const textColor = isDark ? "text-[#FAF8F3]" : "text-[var(--navy)]";
  const accentColor = isDark ? "text-[#D8C292]" : "text-[var(--dusty-blue)]/70";

  return (
    <div className="flex flex-col items-center select-none pt-2 sm:pt-3">
      {/* Three subtle stars */}
      <div className={`flex items-center gap-1 ${accentColor} text-[8px] sm:text-[9px] leading-none mb-0.5`}>
        <span>★</span>
        <span className="-mt-1 text-[10px] sm:text-[11px]">★</span>
        <span>★</span>
      </div>

      {/* Pedestal Rank Numeral */}
      <span
        className={`font-body font-extrabold text-3xl sm:text-4xl leading-none tabular-nums ${textColor}`}
        dir="ltr"
      >
        {rank}
      </span>

      {/* Minimalist Laurel Arc SVG */}
      <svg
        viewBox="0 0 64 20"
        className={`w-11 sm:w-12 h-3.5 -mt-0.5 ${accentColor}`}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M10 4C12 11 20 16 32 16C44 16 52 11 54 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />
        <circle cx="32" cy="16" r="1.5" fill="currentColor" />
      </svg>
    </div>
  );
}

export function PropertyCardRedesigned({
  property,
  assessment,
  index = 0,
  rank,
  caseId,
  className = "",
  onOpenDetail,
}: PropertyCardRedesignedProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const effectiveRank = rank ?? index + 1;
  const isWinner = effectiveRank === 1;

  const score =
    assessment?.engineering_score ??
    (assessment?.fit_rating === "strong"
      ? 88
      : assessment?.fit_rating === "partial"
      ? 74
      : 62);

  const roundedPpsqm =
    assessment?.price_per_sqm && assessment.price_per_sqm > 0
      ? Math.round(assessment.price_per_sqm)
      : property.listing_price_sar && property.area_sqm && property.area_sqm > 0
      ? Math.round(property.listing_price_sar / property.area_sqm)
      : null;

  const rankLabel =
    effectiveRank === 1
      ? "المركز الأول"
      : effectiveRank === 2
      ? "المركز الثاني"
      : effectiveRank === 3
      ? "المركز الثالث"
      : effectiveRank === 4
      ? "المركز الرابع"
      : "المركز الخامس";

  const locationParts = [property.city, property.district].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join("، ") : null;

  const specParts: string[] = [];
  if (property.area_sqm) specParts.push(`${property.area_sqm} م²`);
  if (property.bedrooms) specParts.push(`${property.bedrooms} غرف`);
  if (property.bathrooms) specParts.push(`${property.bathrooms} دورات مياه`);
  if (property.floor_no !== null && property.floor_no !== undefined) {
    specParts.push(`الدور ${property.floor_no}`);
  }
  const specsLine = specParts.join("  ·  ");

  const topAdvantage =
    assessment?.main_advantage_ar ||
    assessment?.strengths?.[0] ||
    assessment?.value_badge_ar ||
    "خيار متوازن للمعاينة";

  const topTradeoff =
    assessment?.main_tradeoff_ar ||
    assessment?.risks?.[0] ||
    assessment?.key_unknowns?.[0] ||
    null;

  const passCount =
    assessment?.constraint_summary?.pass ??
    assessment?.constraint_results?.filter((c) => c.result === "pass").length ??
    0;
  const failCount =
    assessment?.constraint_summary?.fail ??
    assessment?.constraint_results?.filter((c) => c.result === "fail").length ??
    0;
  const unknownCount =
    assessment?.constraint_summary?.unknown ??
    assessment?.constraint_results?.filter((c) => c.result === "unknown").length ??
    0;
  const hasConstraints = passCount + failCount + unknownCount > 0;

  const handleOpen = () => {
    if (onOpenDetail) {
      onOpenDetail();
    } else {
      setSheetOpen(true);
    }
  };

  return (
    <>
      <article
        dir="rtl"
        className={`flex flex-col justify-between bg-[var(--paper)] rounded-[24px] p-5 sm:p-6 border border-[var(--navy)]/20 shadow-[0_14px_40px_rgba(15,26,43,0.06)] transition-all duration-200 ${className}`}
      >
        <div>
          {/* 1. Card Header: Rank Pill + Title + Score */}
          <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[var(--mist)]/50">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isWinner
                      ? "bg-[var(--navy)] text-[var(--cream)]"
                      : "bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]"
                  }`}
                >
                  #{effectiveRank} · {rankLabel}
                </span>

                {isWinner && (
                  <span className="text-[11px] font-bold text-[#2D6A4F]">
                    الخيار الأفضل
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-body font-bold text-[var(--navy)] leading-snug truncate pt-0.5">
                {property.title || `شقة في ${property.district || "الحي المحدد"}`}
              </h3>

              <p className="text-xs text-[var(--dusty-blue)] truncate">
                {[locationText, specsLine].filter(Boolean).join("  ·  ")}
              </p>
            </div>

            <div className="text-left shrink-0 pl-1">
              <span
                className="block text-2xl sm:text-[28px] font-body font-extrabold text-[var(--navy)] leading-none tabular-nums"
                dir="ltr"
              >
                {score}%
              </span>
              <span className="block text-[10px] text-[var(--dusty-blue)] mt-1">
                درجة الملاءمة
              </span>
            </div>
          </div>

          {/* 2. Numbers Row: Price & Price/m² */}
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-[var(--mist)]/50">
            <div>
              <span className="block text-[11px] text-[var(--dusty-blue)]">
                السعر الإجمالي
              </span>
              <span className="text-lg sm:text-xl font-body font-extrabold text-[var(--navy)] tabular-nums">
                {property.listing_price_sar
                  ? formatSAR(property.listing_price_sar)
                  : "غير محدد"}
              </span>
            </div>

            <div className="border-r border-[var(--mist)]/50 pr-4">
              <span className="block text-[11px] text-[var(--dusty-blue)]">
                سعر المتر المربع
              </span>
              <span className="text-sm sm:text-base font-bold text-[var(--navy)] tabular-nums mt-0.5 block">
                {roundedPpsqm
                  ? `${roundedPpsqm.toLocaleString("en-US")} ر.س / م²`
                  : "غير متوفر"}
              </span>
            </div>
          </div>

          {/* 3. Two-Line Executive Verdict */}
          <div className="py-3 space-y-1.5">
            <div className="flex items-start gap-2 text-xs text-[var(--navy)] leading-relaxed">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] shrink-0 mt-1.5"
                aria-hidden="true"
              />
              <span className="line-clamp-1 font-medium">{topAdvantage}</span>
            </div>

            {topTradeoff && (
              <div className="flex items-start gap-2 text-xs text-[var(--dusty-blue)] leading-relaxed">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#9A6700] shrink-0 mt-1.5"
                  aria-hidden="true"
                />
                <span className="line-clamp-1">{topTradeoff}</span>
              </div>
            )}

            {hasConstraints && (
              <p className="text-[11px] text-[var(--dusty-blue)] pt-0.5">
                الشروط: <strong className="text-[var(--navy)]">{passCount} مطابق</strong>
                {failCount > 0 ? `  ·  ${failCount} تعارض` : ""}
                {unknownCount > 0 ? `  ·  ${unknownCount} للتحقق` : ""}
              </p>
            )}
          </div>
        </div>

        {/* 4. Action Row */}
        <div className="pt-3 border-t border-[var(--mist)]/50 flex items-center gap-2.5">
          {caseId && (
            <Link
              href={`/case/${caseId}/inspection?propertyId=${property.id}`}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)]"
            >
              معاينة العقار ←
            </Link>
          )}

          <button
            type="button"
            onClick={handleOpen}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-[var(--navy)] bg-[var(--cream)] hover:bg-[var(--mist)]/40 border border-[var(--mist)] transition-all"
          >
            التفاصيل
          </button>
        </div>
      </article>

      <PropertyDetailSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        caseId={caseId}
        rank={effectiveRank}
        property={{
          id: property.id,
          title: property.title,
          district: property.district,
          city: property.city,
          listing_price_sar: property.listing_price_sar,
          area_sqm: property.area_sqm,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          floor_no: property.floor_no,
        }}
        assessment={
          assessment
            ? {
                fit_rating: assessment.fit_rating,
                fit_summary: assessment.fit_summary,
                visit_priority: assessment.visit_priority,
                visit_priority_reason: assessment.visit_priority_reason,
                strengths: assessment.strengths || [],
                risks: assessment.risks || [],
                key_unknowns: assessment.key_unknowns || [],
                constraint_results: assessment.constraint_results || [],
                main_advantage_ar: assessment.main_advantage_ar,
                main_tradeoff_ar: assessment.main_tradeoff_ar,
                engineering_score: score,
                price_per_sqm: roundedPpsqm,
              }
            : undefined
        }
      />
    </>
  );
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  property: PropertyCardData;
  assessment: PropertyAssessmentData;
}

/**
 * Compact price formatter for Podium labels (e.g., 1,350,000 -> "1.35M ر.س" or "520K ر.س")
 */
function formatCompactSAR(price?: number | null): string {
  if (!price || price <= 0) return "—";
  if (price >= 1_000_000) {
    const millions = (price / 1_000_000).toFixed(2).replace(/\.?0+$/, "");
    return `${millions}M ر.س`;
  }
  if (price >= 1_000) {
    return `${Math.round(price / 1_000)}K ر.س`;
  }
  return `${price} ر.س`;
}

export function ResultsLeaderboard({
  entries,
  caseId,
}: {
  entries: LeaderboardEntry[];
  caseId: string;
}) {
  const [selectedRank, setSelectedRank] = useState<number>(1);
  const count = entries.length;

  if (count === 1) {
    const single = entries[0];
    return (
      <div className="max-w-xl mx-auto">
        <PropertyCardRedesigned
          property={single.property}
          assessment={single.assessment}
          index={0}
          rank={1}
          caseId={caseId}
        />
      </div>
    );
  }

  // Arrange columns in classic Olympic Podium order:
  // In RTL: Right column = #2, Center column = #1 (Tallest), Left column = #3
  const podiumOrder: LeaderboardEntry[] =
    count >= 3
      ? [entries[1], entries[0], entries[2]]
      : [entries[1], entries[0]];

  const activeEntry =
    entries.find((e) => e.rank === selectedRank) || entries[0];

  // Check if titles are identical so we can append area_sqm on the podium label for clarity
  const titleCounts = new Map<string, number>();
  for (const e of entries) {
    const t = e.property.title || "";
    titleCounts.set(t, (titleCounts.get(t) || 0) + 1);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-2" dir="rtl">
      {/* =====================================================================
          1. INTERACTIVE 2 — 1 — 3 ARCHITECTURAL PODIUM STAGE
          ===================================================================== */}
      <section
        aria-label="منصة ترتيب العقارات"
        className="relative pt-2 px-1 sm:px-6 overflow-hidden"
      >
        {/* Subtle radial architectural halo behind #1 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 50% 42%, rgba(15, 26, 43, 0.06) 0%, rgba(15, 26, 43, 0.02) 42%, transparent 72%)",
          }}
        />

        <div
          role="tablist"
          aria-label="اختر عقاراً من المنصة لعرض تفاصيله"
          className={`relative z-10 grid items-end gap-2 sm:gap-3 ${
            count >= 3 ? "grid-cols-3" : "grid-cols-2 max-w-md mx-auto"
          }`}
        >
          {podiumOrder.map((entry) => {
            const isRank1 = entry.rank === 1;
            const isRank2 = entry.rank === 2;
            const isSelected = entry.rank === selectedRank;
            const score = entry.assessment.engineering_score ?? 75;

            const baseTitle =
              entry.property.title ||
              `شقة في ${entry.property.district || "الحي"}`;
            const isDuplicateTitle = (titleCounts.get(baseTitle) || 0) > 1;
            const podiumLabel =
              isDuplicateTitle && entry.property.area_sqm
                ? `${baseTitle} (${entry.property.area_sqm} م²)`
                : baseTitle;

            // Pedestal heights (Center #1 is tallest, #2 is medium, #3 is shortest)
            const pedestalHeightClass = isRank1
              ? "h-[112px] sm:h-[132px]"
              : isRank2
              ? "h-[82px] sm:h-[96px]"
              : "h-[68px] sm:h-[80px]";

            // 3D Top Bevel surface color
            const topBevelStyle: React.CSSProperties = isRank1
              ? {
                  background: "linear-gradient(180deg, #273E63 0%, #16263F 100%)",
                  clipPath: "polygon(9% 0%, 91% 0%, 100% 100%, 0% 100%)",
                }
              : isRank2
              ? {
                  background: "linear-gradient(180deg, #FAF8F3 0%, #E5DFD2 100%)",
                  clipPath: "polygon(9% 0%, 91% 0%, 100% 100%, 0% 100%)",
                }
              : {
                  background: "linear-gradient(180deg, #FAF8F3 0%, #ECE7DC 100%)",
                  clipPath: "polygon(9% 0%, 91% 0%, 100% 100%, 0% 100%)",
                };

            // Front pedestal face gradient (fades into --cream at bottom)
            const frontFaceStyle: React.CSSProperties = isRank1
              ? {
                  background:
                    "linear-gradient(180deg, #0F1A2B 0%, rgba(15, 26, 43, 0.90) 62%, rgba(243, 239, 231, 0) 100%)",
                }
              : isRank2
              ? {
                  background:
                    "linear-gradient(180deg, #DDD6C7 0%, rgba(221, 214, 199, 0.72) 62%, rgba(243, 239, 231, 0) 100%)",
                }
              : {
                  background:
                    "linear-gradient(180deg, #E7E1D4 0%, rgba(231, 225, 212, 0.65) 62%, rgba(243, 239, 231, 0) 100%)",
                };

            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedRank(entry.rank)}
                className={`group flex flex-col items-center text-center focus:outline-none transition-transform duration-200 ${
                  isSelected ? "-translate-y-1" : " opacity-85 hover:opacity-100 hover:-translate-y-0.5"
                }`}
              >
                {/* Floating Architectural Score Tile (replaces avatar in reference design) */}
                <div className="relative mb-2">
                  {/* Top Pin Dot */}
                  <span
                    aria-hidden="true"
                    className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-[var(--cream)] transition-colors ${
                      isSelected
                        ? "bg-[var(--navy)]"
                        : isRank1
                        ? "bg-[#9A6700]"
                        : "bg-[var(--mist)]"
                    }`}
                  />

                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[var(--paper)] border-2 border-[var(--navy)] shadow-[0_10px_24px_rgba(15,26,43,0.12)]"
                        : "bg-[var(--paper)]/90 border border-[var(--mist)] group-hover:border-[var(--navy)]/50 shadow-sm"
                    }`}
                  >
                    <span
                      className="text-base sm:text-lg font-body font-extrabold text-[var(--navy)] leading-none tabular-nums"
                      dir="ltr"
                    >
                      {score}%
                    </span>
                    <span className="text-[9px] text-[var(--dusty-blue)] mt-0.5">
                      ملاءمة
                    </span>
                  </div>
                </div>

                {/* Property Name */}
                <span
                  className={`text-xs sm:text-sm font-bold leading-tight line-clamp-1 max-w-full px-1 ${
                    isSelected ? "text-[var(--navy)]" : "text-[var(--navy)]/80"
                  }`}
                >
                  {podiumLabel}
                </span>

                {/* Compact Price Metric under name */}
                <span
                  className="text-[11px] font-medium text-[var(--dusty-blue)] tabular-nums mt-0.5 mb-2.5"
                  dir="rtl"
                >
                  {formatCompactSAR(entry.property.listing_price_sar)}
                </span>

                {/* 3D Beveled Podium Pillar */}
                <div className="w-full flex flex-col items-stretch">
                  {/* 3D Top Bevel Trapezoid */}
                  <div className="h-3.5 sm:h-4 w-full" style={topBevelStyle} />

                  {/* Front Face with Numeral & Laurel */}
                  <div
                    className={`w-full ${pedestalHeightClass} border-t ${
                      isRank1 ? "border-white/25" : "border-white/70"
                    } flex flex-col items-center justify-start relative`}
                    style={frontFaceStyle}
                  >
                    <PodiumEmblem rank={entry.rank} isDark={isRank1} />

                    {/* Active indicator pill at bottom of selected pillar */}
                    {isSelected && (
                      <span
                        className={`mt-auto mb-2 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isRank1
                            ? "bg-white/15 text-white"
                            : "bg-[var(--navy)]/10 text-[var(--navy)]"
                        }`}
                      >
                        معروض أدناه
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Additional Ranked Candidates (#4 - #5) when more than 3 properties exist */}
        {entries.length > 3 && (
          <div className="relative z-10 mt-3 pt-3 border-t border-[var(--mist)]/60 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-semibold text-[var(--dusty-blue)] ml-1">
              خيارات إضافية في الترتيب:
            </span>
            {entries.slice(3).map((extra) => {
              const isSelected = extra.rank === selectedRank;
              const extraTitle =
                extra.property.title ||
                `شقة في ${extra.property.district || "الحي"}`;
              return (
                <button
                  key={extra.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedRank(extra.rank)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-body transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] font-bold shadow-xs"
                      : "bg-[var(--paper)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)] font-medium"
                  }`}
                >
                  <span className="font-bold tabular-nums">#{extra.rank}</span>
                  <span className="truncate max-w-[160px]">{extraTitle}</span>
                  <span className="text-[11px] opacity-80 tabular-nums">
                    ({formatCompactSAR(extra.property.listing_price_sar)})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================================
          2. FOCUSED DETAIL CARD FOR SELECTED PODIUM RANK
          ===================================================================== */}
      <div className="relative z-20 -mt-2">
        <PropertyCardRedesigned
          key={activeEntry.id}
          property={activeEntry.property}
          assessment={activeEntry.assessment}
          index={activeEntry.rank - 1}
          rank={activeEntry.rank}
          caseId={caseId}
        />
      </div>
    </div>
  );
}
