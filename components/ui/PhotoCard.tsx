"use client";

import React from "react";
import Image from "next/image";
import { CircleButton } from "./CircleButton";
import { GlassPill } from "./GlassPill";

export interface PhotoCardProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  subtitle?: string;
  topChipIcon?: React.ReactNode;
  topChipLabel?: string;
  chips?: string[];
  pillLabel?: string;
  onPillAction?: () => void;
  circleActions?: Array<{
    icon: React.ReactNode;
    ariaLabel: string;
    onClick?: () => void;
  }>;
  height?: number | string;
  className?: string;
}

export function PhotoCard({
  imageSrc,
  imageAlt,
  title,
  subtitle,
  topChipIcon,
  topChipLabel,
  chips = [],
  pillLabel,
  onPillAction,
  circleActions = [],
  height = 420,
  className = "",
}: PhotoCardProps) {
  // Max 3 chips per card according to DESIGN_RULES
  const displayChips = chips.slice(0, 3);
  // 1-3 circle buttons
  const displayCircleActions = circleActions.slice(0, 3);

  return (
    <div
      className={`relative w-full rounded-[32px] overflow-hidden select-none border border-stroke shadow-xl flex flex-col justify-between p-4 ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
      dir="rtl"
    >
      {/* 1. Full-bleed photo with photo grade: saturate(0.9) contrast(1.05) sepia(0.06) */}
      <div className="absolute inset-0 pointer-events-none">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-cover object-center photo-grade"
        />

        {/* Espresso Scrim Overlay */}
        <div className="absolute inset-0 scrim-warm-card" />
      </div>

      {/* 2. Top-Start: Glass Chip with icon circle + title */}
      <div className="relative z-10 flex items-start justify-between w-full">
        {topChipLabel && (
          <div className="inline-flex items-center gap-2 h-10 px-3.5 rounded-full bawsala-glass text-sandstone shadow-md">
            {topChipIcon && (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-3 text-sandstone shrink-0 border border-stroke">
                {topChipIcon}
              </span>
            )}
            <span className="text-[13px] font-medium leading-none">
              {topChipLabel}
            </span>
          </div>
        )}
      </div>

      {/* 3. Bottom Block: Title, Optional Chips, and Glass Bottom Bar */}
      <div className="relative z-10 flex flex-col gap-3 w-full">
        {/* Title & Subtitle */}
        <div className="flex flex-col gap-1 px-1">
          <h3 className="text-[20px] font-semibold text-ink leading-snug drop-shadow-xs">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[14px] text-muted font-normal leading-normal">
              {subtitle}
            </p>
          )}
        </div>

        {/* Optional Chips (max 3) */}
        {displayChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            {displayChips.map((chip, idx) => (
              <span
                key={idx}
                className="h-[32px] px-3 rounded-full text-[12px] font-medium bg-surface-2 border border-stroke text-sandstone backdrop-blur-md flex items-center"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Glass Bottom Bar with a pill and 1-3 circle buttons */}
        {(pillLabel || displayCircleActions.length > 0) && (
          <div className="w-full flex items-center gap-2.5 p-2 rounded-[24px] bawsala-glass-dark border border-stroke shadow-lg">
            {pillLabel && (
              <div className="flex-1 min-w-0">
                <GlassPill
                  label={pillLabel}
                  size="48"
                  variant="sandstone"
                  fullWidth
                  showArrow
                  onClick={onPillAction}
                />
              </div>
            )}

            {displayCircleActions.map((action, idx) => (
              <CircleButton
                key={idx}
                icon={action.icon}
                ariaLabel={action.ariaLabel}
                onClick={action.onClick}
                variant="glass"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
