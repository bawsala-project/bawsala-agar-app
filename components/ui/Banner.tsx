"use client";

import React from "react";
import { CircleButton } from "./CircleButton";
import { ArrowLeft } from "lucide-react";

export interface BannerProps {
  title: string;
  description?: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  buttonAriaLabel?: string;
  className?: string;
}

export function Banner({
  title,
  description,
  value,
  children,
  onClick,
  buttonAriaLabel = "فتح",
  className = "",
}: BannerProps) {
  return (
    <div
      onClick={onClick}
      className={`relative w-full rounded-[28px] p-5 bg-gradient-to-b from-espresso to-cocoa border border-stroke overflow-hidden flex items-center justify-between gap-4 select-none cursor-pointer transition-all hover:brightness-105 active:scale-[0.99] shadow-lg ${className}`}
      dir="rtl"
    >
      {/* Subtle Topographic Contour Lines in Sandstone at 8% */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-100"
        viewBox="0 0 400 160"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M-20,40 C60,20 140,70 220,50 C300,30 380,80 440,60"
          fill="none"
          stroke="var(--sandstone)"
          strokeOpacity="0.08"
          strokeWidth="1.5"
        />
        <path
          d="M-20,70 C70,50 150,100 230,80 C310,60 390,110 440,90"
          fill="none"
          stroke="var(--sandstone)"
          strokeOpacity="0.08"
          strokeWidth="1.5"
        />
        <path
          d="M-20,100 C80,80 160,130 240,110 C320,90 400,140 440,120"
          fill="none"
          stroke="var(--sandstone)"
          strokeOpacity="0.08"
          strokeWidth="1.5"
        />
        <path
          d="M-20,130 C90,110 170,160 250,140 C330,120 410,170 440,150"
          fill="none"
          stroke="var(--sandstone)"
          strokeOpacity="0.08"
          strokeWidth="1.5"
        />
      </svg>

      {/* Content: Title, Value & Description */}
      <div className="relative z-10 flex flex-col gap-1 min-w-0 flex-1">
        <h4 className="text-[15px] font-medium text-sandstone leading-snug truncate">
          {title}
        </h4>
        {value && (
          <div className="flex items-baseline gap-2 my-0.5">
            {value}
          </div>
        )}
        {description && (
          <p className="text-[13px] font-normal text-muted leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
        {children}
      </div>

      {/* Circular Arrow Button */}
      <div className="relative z-10 shrink-0">
        <CircleButton
          icon={<ArrowLeft className="w-5 h-5 text-sandstone" />}
          ariaLabel={buttonAriaLabel}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          variant="glass"
        />
      </div>
    </div>
  );
}
