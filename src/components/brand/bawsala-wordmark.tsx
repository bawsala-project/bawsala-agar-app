"use client";

import React from "react";

interface BawsalaWordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional English subtitle under BAWSALA */
  withSubtitle?: boolean;
  subtitleText?: string;
  /** Custom tracking override (default: 0.35em) */
  tracking?: string;
}

const SIZE_STYLES = {
  sm: {
    title: "text-sm",
    subtitle: "text-[9px] tracking-[0.38em]",
  },
  md: {
    title: "text-lg sm:text-xl",
    subtitle: "text-[10px] tracking-[0.42em]",
  },
  lg: {
    title: "text-2xl sm:text-3xl",
    subtitle: "text-xs tracking-[0.45em]",
  },
  xl: {
    title: "text-4xl sm:text-5xl lg:text-6xl",
    subtitle: "text-sm sm:text-base tracking-[0.5em]",
  },
};

/**
 * BawsalaWordmark: The Latin brand mark "BAWSALA"
 * Thin, widely-spaced capitals with high contrast and classical elegance.
 * Uses currentColor to adapt to any background context.
 */
export function BawsalaWordmark({
  className = "",
  size = "md",
  withSubtitle = false,
  subtitleText = "INDEPENDENT PROPERTY ADVISORY",
  tracking = "0.35em",
}: BawsalaWordmarkProps) {
  const sizeConfig = SIZE_STYLES[size];

  return (
    <div
      dir="ltr"
      lang="en"
      style={{ direction: "ltr", unicodeBidi: "isolate" }}
      aria-label="BAWSALA"
      className={`inline-flex flex-col items-center justify-center select-none text-current ${className}`}
    >
      <span
        aria-hidden="true"
        className={`wordmark-latin font-wordmark font-normal uppercase leading-none ${sizeConfig.title}`}
        style={{ letterSpacing: tracking }}
      >
        BAWSALA
      </span>

      {withSubtitle && (
        <span
          aria-hidden="true"
          className={`wordmark-latin uppercase text-[var(--mist)] mt-1.5 opacity-75 font-normal ${sizeConfig.subtitle}`}
        >
          {subtitleText}
        </span>
      )}
    </div>
  );
}
