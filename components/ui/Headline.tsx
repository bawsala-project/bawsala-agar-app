"use client";

import React from "react";
import Image from "next/image";

export interface HeadlineProps {
  children?: React.ReactNode;
  beforeText?: string;
  afterText?: string;
  capsuleImage?: string;
  capsuleAlt?: string;
  className?: string;
}

export function Headline({
  children,
  beforeText,
  afterText,
  capsuleImage,
  capsuleAlt = "عقار مختار",
  className = "",
}: HeadlineProps) {
  return (
    <h1
      className={`text-[46px] font-medium text-ink leading-[1.2] tracking-normal select-none ${className}`}
      style={{ textWrap: "balance" }}
      dir="rtl"
    >
      {beforeText && <span className="block">{beforeText}</span>}

      {(capsuleImage || afterText) && (
        <span className="inline-flex items-center gap-2.5 whitespace-nowrap align-middle mt-1">
          {capsuleImage && (
            <span
              className="relative inline-block w-[72px] h-[36px] rounded-full overflow-hidden border border-stroke shadow-xs shrink-0 -translate-y-0.5"
              aria-hidden="true"
            >
              <Image
                src={capsuleImage}
                alt={capsuleAlt}
                fill
                sizes="72px"
                className="object-cover object-center photo-grade"
              />
            </span>
          )}
          {afterText && <span>{afterText}</span>}
        </span>
      )}

      {children}
    </h1>
  );
}
