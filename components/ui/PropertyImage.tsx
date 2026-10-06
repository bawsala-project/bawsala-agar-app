"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { getImageUrl, PropertyImageManifestItem } from "@/lib/images";

export type PropertyImageShape =
  | "inherit"
  | "squircle"
  | "arch"
  | "capsule"
  | "circle"
  | "rounded-2xl"
  | "rounded-3xl";

interface PropertyImageProps {
  image?: PropertyImageManifestItem | null;
  src?: string | null;
  alt?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  containerClassName?: string;
  shape?: PropertyImageShape;
  tone?: "sandstone" | "cocoa" | "driftwood";
  overlaySlot?: React.ReactNode;
  overlayPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  aspectRatio?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

// Neutral warm Sand blur data URL for Next.js image loading
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNFMURGRDAiLz48L3N2Zz4=";

export function PropertyImage({
  image,
  src,
  alt,
  fill = true,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px",
  className = "",
  containerClassName = "",
  shape = "inherit",
  tone = "sandstone",
  overlaySlot,
  overlayPosition = "top-right",
  aspectRatio,
  onClick,
  children,
}: PropertyImageProps) {
  const [hasError, setHasError] = useState(false);

  // Resolve source URL
  const resolvedSrc = hasError
    ? null
    : src
    ? getImageUrl(src)
    : image?.file
    ? getImageUrl(image.file)
    : null;

  const resolvedAlt = alt || image?.alt || "صورة العقار";

  const shapeClasses: Record<PropertyImageShape, string> = {
    inherit: "rounded-[inherit]",
    squircle: "rounded-[28px]",
    arch: "rounded-t-full rounded-b-[24px]",
    capsule: "rounded-full",
    circle: "rounded-full aspect-square",
    "rounded-2xl": "rounded-2xl",
    "rounded-3xl": "rounded-3xl",
  };

  const overlayPosClasses: Record<string, string> = {
    "top-right": "top-3 right-3",
    "top-left": "top-3 left-3",
    "bottom-right": "bottom-3 right-3",
    "bottom-left": "bottom-3 left-3",
  };

  const toneFallbacks = {
    sandstone: {
      bg: "bg-[#E9DFD0]",
      border: "border-[#E9DFD0]",
      grid: "rgba(19, 15, 8, 0.08)",
      text: "text-[#130F08]/60",
    },
    cocoa: {
      bg: "bg-[#3D271A]/10",
      border: "border-[#3D271A]/20",
      grid: "rgba(61, 39, 26, 0.08)",
      text: "text-[#3D271A]/60",
    },
    driftwood: {
      bg: "bg-[#FAF6EF]",
      border: "border-[#E9DFD0]",
      grid: "rgba(19, 15, 8, 0.06)",
      text: "text-[#130F08]/50",
    },
  }[tone];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden select-none ${shapeClasses[shape]} ${
        aspectRatio || ""
      } ${containerClassName}`}
    >
      {resolvedSrc ? (
        <div className="relative w-full h-full">
          <Image
            src={resolvedSrc}
            alt={resolvedAlt}
            fill={fill}
            priority={priority}
            sizes={sizes}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            onError={() => setHasError(true)}
            className={`object-cover object-center transition-transform duration-500 ${className}`}
          />
          {/* Subtle top inner edge highlight for depth */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-10" />
        </div>
      ) : (
        /* Palette-tinted architectural fallback for properties with no image yet */
        <div
          className={`w-full h-full min-h-[100px] ${toneFallbacks.bg} border ${toneFallbacks.border} flex flex-col items-center justify-center relative p-4 text-center`}
        >
          {/* Subtle Architectural Grid Background */}
          <svg
            className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id={`arch-pattern-${tone}`}
                width="28"
                height="28"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 28 0 L 0 0 0 28"
                  fill="none"
                  stroke={toneFallbacks.grid}
                  strokeWidth="0.75"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#arch-pattern-${tone})`} />
          </svg>

          <div className="relative z-10 flex flex-col items-center gap-1.5 opacity-70">
            <Building2 className={`w-7 h-7 stroke-[1.4] ${toneFallbacks.text}`} />
            <span className={`text-[11px] font-medium ${toneFallbacks.text}`}>
              بانتظار الصور الميدانية
            </span>
          </div>
        </div>
      )}

      {/* Glass Chip Overlay Slot */}
      {overlaySlot && (
        <div
          className={`absolute z-20 pointer-events-auto ${overlayPosClasses[overlayPosition]}`}
        >
          {overlaySlot}
        </div>
      )}

      {/* Optional additional children / overlays */}
      {children}
    </div>
  );
}
