"use client";

import React from "react";
import { Building2, Camera } from "lucide-react";

interface PropertyPlaceholderImageProps {
  tone?: "sandstone" | "cocoa" | "driftwood";
  aspectRatio?: "video" | "square" | "wide";
  className?: string;
  badge?: string;
  title?: string;
}

export function PropertyPlaceholderImage({
  tone = "sandstone",
  aspectRatio = "video",
  className = "",
  badge,
  title,
}: PropertyPlaceholderImageProps) {
  const ratioClass = {
    video: "aspect-[16/10]",
    square: "aspect-square",
    wide: "aspect-[21/9]",
  }[aspectRatio];

  const toneConfig = {
    sandstone: {
      gradient: "from-[#3D271A] via-[#524436] to-[#8C7D6F]",
      lineColor: "rgba(215, 203, 190, 0.18)",
      glow: "rgba(215, 203, 190, 0.12)",
      accent: "#D7CBBE",
    },
    cocoa: {
      gradient: "from-[#130F08] via-[#2F1E14] to-[#4D382B]",
      lineColor: "rgba(100, 90, 78, 0.22)",
      glow: "rgba(61, 39, 26, 0.25)",
      accent: "#A8643C",
    },
    driftwood: {
      gradient: "from-[#1E1914] via-[#3C342C] to-[#645A4E]",
      lineColor: "rgba(242, 235, 226, 0.15)",
      glow: "rgba(100, 90, 78, 0.18)",
      accent: "#F2EBE2",
    },
  }[tone];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[20px] bg-gradient-to-br ${toneConfig.gradient} ${ratioClass} ${className} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-center select-none`}
    >
      {/* Delicate Architectural Window Grid & Concrete Texture Overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`arch-grid-${tone}`}
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 36 0 L 0 0 0 36"
              fill="none"
              stroke={toneConfig.lineColor}
              strokeWidth="1"
            />
            {/* Minimalist diagonal architectural beam */}
            <path
              d="M 0 36 L 36 0"
              fill="none"
              stroke={toneConfig.lineColor}
              strokeWidth="0.5"
              strokeDasharray="2,4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#arch-grid-${tone})`} />
      </svg>

      {/* Atmospheric center glow */}
      <div
        className="absolute w-2/3 h-2/3 rounded-full blur-2xl pointer-events-none"
        style={{ background: toneConfig.glow }}
      />

      {/* Architectural Icon Graphic */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 opacity-60 hover:opacity-80 transition-opacity">
        <Building2 className="w-8 h-8 text-[#F2EBE2] stroke-[1.2]" />
        <span className="text-[11px] font-sans tracking-wide text-[#F2EBE2]/70 uppercase">
          مخطط معماري
        </span>
      </div>

      {/* Image Slot Badge */}
      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#130F08]/65 backdrop-blur-md border border-[#F2EBE2]/15 text-[10px] text-[#F2EBE2]/90">
        <Camera className="w-3 h-3" />
        <span>{badge || "صورة توضيحية"}</span>
      </div>
    </div>
  );
}
