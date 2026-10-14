"use client";

import React, { useState } from "react";
import Image from "next/image";
import { formatSAR } from "@/lib/utils";
import { EngineeringDialGauge } from "./engineering-dial-gauge";
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
  engineering_score?: number;
  price_per_sqm?: number | null;
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
 * - One price line, one score (tick-ring gauge)
 * - Paper surface, 28px radius, 1px mist border
 * - Maximum 2 font sizes, spacious whitespace
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

  const score =
    assessment?.engineering_score ||
    (assessment?.fit_rating === "strong"
      ? 89
      : assessment?.fit_rating === "partial"
      ? 74
      : 58);

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
        </div>

        {/* 2. City and Title Below */}
        <div className="space-y-1.5 px-1">
          <div className="text-xs font-medium text-[var(--dusty-blue)]">
            {locationText}
          </div>
          <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--navy)] tracking-tight leading-snug line-clamp-1">
            {title}
          </h3>
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

          {/* Engineering Score Dial Gauge */}
          <div className="shrink-0 flex items-center gap-2">
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
