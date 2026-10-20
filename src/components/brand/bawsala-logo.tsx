"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BawsalaCompass } from "./bawsala-compass";
import { BawsalaWordmark } from "./bawsala-wordmark";

interface BawsalaLogoProps {
  className?: string;
  compassSize?: number;
  wordmarkSize?: "sm" | "md" | "lg" | "xl";
  /** Whether compass spins subtly on hover */
  animateHover?: boolean;
  /** Whether to show the Arabic title "بوصلة العقار" alongside */
  withArabicName?: boolean;
  /** Optional badge next to title */
  badgeText?: string;
  /** Optional link destination */
  href?: string;
  /** Horizontal or vertical layout */
  orientation?: "horizontal" | "vertical";
}

/**
 * BawsalaLogo: Clean editorial brand lockup consisting of:
 * - <BawsalaCompass />: Thin-line navy compass dial (no double border, no dark box)
 * - Optional Arabic display title "بوصلة العقار" in navy display font
 * - <BawsalaWordmark />: Thin, widely-spaced Latin mark "BAWSALA"
 */
export function BawsalaLogo({
  className = "",
  compassSize = 34,
  wordmarkSize = "md",
  animateHover = true,
  withArabicName = true,
  badgeText,
  href,
  orientation = "horizontal",
}: BawsalaLogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  const content = (
    <div
      dir="ltr"
      lang="en"
      style={{ direction: "ltr", unicodeBidi: "isolate" }}
      aria-label="BAWSALA"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group inline-flex items-center gap-3 transition-colors duration-200 text-[var(--navy)] ${
        orientation === "vertical" ? "flex-col text-center" : "flex-row"
      } ${className}`}
    >
      {/* Clean Compass (No double border, no dark box) */}
      <div className="relative flex items-center justify-center shrink-0 text-[var(--navy)]">
        <BawsalaCompass
          size={compassSize}
          isHovered={isHovered}
          animateHover={animateHover}
        />
      </div>

      {/* Brand Names (Arabic Display + Latin Wordmark) */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-2">
          {withArabicName && (
            <span className="font-display font-black text-base sm:text-lg text-[var(--navy)] tracking-tight leading-tight">
              بوصلة العقار
            </span>
          )}

          {badgeText && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] whitespace-nowrap">
              {badgeText}
            </span>
          )}
        </div>

        <BawsalaWordmark
          size={wordmarkSize}
          className="text-[var(--dusty-blue)] group-hover:text-[var(--navy)] transition-colors mt-0.5"
          tracking="0.32em"
        />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy)] rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
