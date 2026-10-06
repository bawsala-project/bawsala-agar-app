"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export type MaskShape = "capsule" | "arch" | "circle" | "squircle";

interface MaskedImageProps {
  shape?: MaskShape;
  tone?: "sandstone" | "cocoa" | "driftwood";
  src?: string;
  alt?: string;
  className?: string;
  floatingChip?: React.ReactNode;
  chipPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  aspectRatio?: string;
}

export function MaskedImage({
  shape = "squircle",
  tone = "sandstone",
  src,
  alt = "عقار بوصلة",
  className = "",
  floatingChip,
  chipPosition = "top-right",
  aspectRatio,
}: MaskedImageProps) {
  // Shape classes and radius
  const shapeClasses: Record<MaskShape, string> = {
    capsule: "rounded-full",
    arch: "rounded-t-full rounded-b-[28px]",
    circle: "rounded-full aspect-square",
    squircle: "rounded-[36px]",
  };

  // Tone gradients and overlay lines
  const toneGradients: Record<string, string> = {
    sandstone: "from-[#3D271A] via-[#524436] to-[#8C7D6F]",
    cocoa: "from-[#130F08] via-[#2F1E14] to-[#4D382B]",
    driftwood: "from-[#1E1914] via-[#3C342C] to-[#645A4E]",
  };

  const positionClasses: Record<string, string> = {
    "top-right": "top-3 right-3",
    "top-left": "top-3 left-3",
    "bottom-right": "bottom-3 right-3",
    "bottom-left": "bottom-3 left-3",
  };

  return (
    <div
      className={`relative overflow-hidden select-none bg-gradient-to-br ${toneGradients[tone]} ${shapeClasses[shape]} ${aspectRatio || ""} ${className} border border-[#F2EBE2]/15 shadow-inner`}
    >
      {/* Real Image or Generative Palette-based Architectural Placeholder */}
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 480px) 100vw, 430px"
          className="object-cover object-center"
        />
      ) : (
        <>
          {/* Subtle architectural concrete/window line grid */}
          <svg
            className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id={`masked-grid-${tone}-${shape}`}
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke={tone === "sandstone" ? "rgba(215, 203, 190, 0.25)" : "rgba(242, 235, 226, 0.18)"}
                  strokeWidth="0.75"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#masked-grid-${tone}-${shape})`} />
            {/* Elegant architectural diagonal rays */}
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(242, 235, 226, 0.12)" strokeWidth="1" />
            <circle cx="70%" cy="30%" r="40" fill="none" stroke="rgba(215, 203, 190, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>

          {/* Deep ambient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#130F08]/80 via-transparent to-[#130F08]/20" />
        </>
      )}

      {/* Floating Glass Label Chip */}
      {floatingChip && (
        <div className={`absolute z-10 ${positionClasses[chipPosition]}`}>
          {typeof floatingChip === "string" ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full bawsala-glass-dark border border-[#F2EBE2]/30 text-xs font-medium text-[#F2EBE2] backdrop-blur-md shadow-sm">
              {floatingChip}
            </span>
          ) : (
            floatingChip
          )}
        </div>
      )}

      {/* Subtle top inner edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F2EBE2]/35 to-transparent pointer-events-none" />
    </div>
  );
}
