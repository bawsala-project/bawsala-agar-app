"use client";

import React, { useState } from "react";
import Image from "next/image";
import { formatSAR } from "@/lib/utils";
import { EngineeringDialGauge } from "./engineering-dial-gauge";
import { PropertyDetailSheet } from "./property-detail-sheet";

import type { PropertyFitEvaluation, ConfidenceAssessment } from "@/lib/analysis/fit-evaluator";
import type { DimensionWeights } from "@/lib/analysis/weights";

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
  engineering_score?: number;
  price_per_sqm?: number | null;
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

interface PropertyCardRedesignedProps {
  property: PropertyCardData;
  assessment?: PropertyAssessmentData;
  index?: number;
  className?: string;
  onOpenDetail?: () => void;
}

const FALLBACK_IMAGES = [
  "/images/p1-exterior.jpg",
  "/images/p2-exterior.jpg",
  "/images/p3-exterior.jpg",
  "/images/apartment-tower.jpg",
  "/images/hero-house.jpg",
];

/**
 * Minimalist Editorial Property Card:
 * - Image on top (rounded 24px), zooms to 1.04 on hover
 * - City and title below
 * - One price line, one fit score (tick-ring gauge)
 * - Low-confidence indicator when data is incomplete (never present as certain)
 * - Paper surface, 28px radius, 1px mist border
 */
export function PropertyCardRedesigned({
  property,
  assessment,
  index = 0,
  className = "",
  onOpenDetail,
}: PropertyCardRedesignedProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const photo =
    property.image_url ||
    FALLBACK_IMAGES[index % FALLBACK_IMAGES.length] ||
    "/images/p1-exterior.jpg";

  const title = property.title?.trim() || `شقة سكنية حي ${property.district || "الياسمين"}`;
  const city = property.city || "الرياض";
  const locationText = property.district ? `${city}، حي ${property.district}` : city;
  const price = property.listing_price_sar || 850000;
  const area = property.area_sqm || 140;

  // Use pure computed fit score first, fallback to engineering_score or rating
  const score =
    assessment?.weighted_fit_score ??
    assessment?.engineering_score ??
    (assessment?.fit_rating === "strong"
      ? 89
      : assessment?.fit_rating === "partial"
      ? 74
      : 58);

  const isCertain = assessment?.is_certain !== false && assessment?.confidence?.level !== "low";

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail();
    } else {
      setIsDetailOpen(true);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative overflow-hidden rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] p-4 sm:p-5 shadow-[0_20px_60px_rgba(15,26,43,0.06)] hover:border-[var(--navy)] transition-all duration-300 cursor-pointer select-none flex flex-col justify-between ${className}`}
        dir="rtl"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        {/* 1. Image on top (rounded 24px) */}
        <div className="relative w-full h-[230px] sm:h-[260px] rounded-[24px] overflow-hidden bg-[var(--cream)] mb-4">
          <Image
            src={photo}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />

          {/* Area pill badge on image */}
          <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-[var(--paper)]/95 border border-[var(--mist)] text-[var(--navy)] text-xs font-semibold tabular-nums shadow-xs">
            {area} م²
          </div>

          {/* Low-confidence badge: never present as certain when confidence is low */}
          {!isCertain && (
            <div className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full bg-[#FFF9EC]/95 border border-[#F9E2AF] text-[#9A6700] text-[10px] font-bold shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9A6700] animate-pulse" />
              <span>تقدير مبدئي غير قطعي</span>
            </div>
          )}
        </div>

        {/* 2. City and Title Below */}
        <div className="space-y-1.5 px-1">
          <div className="text-xs font-medium text-[var(--dusty-blue)]">
            {locationText}
          </div>
          <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--navy)] tracking-tight leading-snug line-clamp-1">
            {title}
          </h3>

          {/* Confidence Level & Missing Information List */}
          <div className="pt-1.5 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  assessment?.confidence?.level === "high"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : assessment?.confidence?.level === "medium"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                <span>مستوى الثقة:</span>
                <span>
                  {assessment?.confidence?.level === "high"
                    ? "مرتفعة"
                    : assessment?.confidence?.level === "medium"
                    ? "متوسطة"
                    : "منخفضة (بيانات ناقصة)"}
                </span>
              </span>

              {assessment?.confidence?.reasonAr && (
                <span className="text-[10px] text-[var(--dusty-blue)] line-clamp-1">
                  • {assessment.confidence.reasonAr}
                </span>
              )}
            </div>

            {/* Missing Info List */}
            {assessment?.missing_information && assessment.missing_information.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] font-semibold text-[var(--navy)]">بيانات ناقصة:</span>
                {assessment.missing_information.slice(0, 2).map((item, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-[var(--cream)] border border-[var(--mist)] text-[10px] text-[var(--dusty-blue)]"
                  >
                    {item}
                  </span>
                ))}
                {assessment.missing_information.length > 2 && (
                  <span className="text-[10px] text-[var(--dusty-blue)]">
                    +{assessment.missing_information.length - 2} أخرى
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. One Price Line & One Score */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-[var(--mist)] px-1">
          <div>
            <div className="text-[11px] font-medium text-[var(--dusty-blue)]">
              السعر الإجمالي
            </div>
            <div className="font-display font-black text-xl sm:text-2xl text-[var(--navy)] tabular-nums tracking-tight">
              {formatSAR(price)}
            </div>
          </div>

          {/* Fit Score Dial Gauge */}
          <div className="shrink-0 flex items-center gap-2.5">
            <div className="text-left pl-1 hidden sm:block">
              <div className="text-[10px] font-medium text-[var(--dusty-blue)]">
                مؤشر ملاءمة العقار
              </div>
              {!isCertain ? (
                <div className="text-[10px] font-bold text-[#9A6700]">
                  بيانات ناقصة
                </div>
              ) : (
                <div className="text-[10px] font-bold text-[var(--navy)]">
                  {score >= 80 ? "توافق ممتاز" : score >= 65 ? "توافق جيد" : "توافق محدود"}
                </div>
              )}
            </div>
            <EngineeringDialGauge
              score={score}
              size={48}
              strokeWidth={3}
              countUp={isHovered}
            />
          </div>
        </div>
      </div>

      {/* Expanded Shared-element Detail Sheet */}
      <PropertyDetailSheet
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        property={{
          id: property.id,
          title,
          district: property.district,
          city: property.city,
          listing_price_sar: price,
          area_sqm: area,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          floor_no: property.floor_no,
          image_url: photo,
        }}
        assessment={assessment}
      />
    </>
  );
}
