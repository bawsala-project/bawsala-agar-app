"use client";

import React from "react";

export type PriorityLevel = "high" | "medium" | "low" | "insufficient_data";

interface VisitPriorityBadgeProps {
  level: PriorityLevel;
  className?: string;
  size?: "sm" | "md";
  showDialOnly?: boolean;
}

const PRIORITY_DATA: Record<
  PriorityLevel,
  {
    label: string;
    description: string;
    needleRotation: number;
    arcFillCount: number;
    badgeStyle: string;
  }
> = {
  high: {
    label: "أولوية مرتفعة",
    description: "تطابق معايير القرار الاستثماري بدقة",
    needleRotation: 30, // Sharp upward needle
    arcFillCount: 3,
    badgeStyle: "bg-sandstone/15 text-sandstone border-sandstone/40",
  },
  medium: {
    label: "أولوية متوسطة",
    description: "توازن بين المميزات والاعتبارات الثانوية",
    needleRotation: 85,
    arcFillCount: 2,
    badgeStyle: "bg-cocoa/30 text-sandstone/90 border-sandstone/25",
  },
  low: {
    label: "أولوية منخفضة",
    description: "فرصة بديلة غير ملحة للمعاينة الميدانية",
    needleRotation: 145,
    arcFillCount: 1,
    badgeStyle: "bg-espresso/60 text-driftwood border-driftwood/30",
  },
  insufficient_data: {
    label: "بيانات غير كافية",
    description: "يتطلب جمع مدخلات أساسية لتحديد الأولوية",
    needleRotation: 0,
    arcFillCount: 0,
    badgeStyle: "bg-espresso/40 text-driftwood border-driftwood/40 border-dashed",
  },
};

export function VisitPriorityBadge({
  level,
  className = "",
  size = "md",
  showDialOnly = false,
}: VisitPriorityBadgeProps) {
  const data = PRIORITY_DATA[level] || PRIORITY_DATA.insufficient_data;
  const isSm = size === "sm";

  // Stylized 3-arc dial indicator in neutral sandstone & driftwood
  const dial = (
    <div
      className={`relative flex items-center justify-center shrink-0 ${
        isSm ? "w-4 h-4" : "w-5 h-5"
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
        {/* Background track */}
        <circle
          cx="16"
          cy="16"
          r="13"
          fill="none"
          stroke="#645A4E"
          strokeWidth="2"
          strokeOpacity="0.25"
          strokeDasharray={level === "insufficient_data" ? "2 3" : undefined}
        />

        {/* Dynamic arc segments */}
        {data.arcFillCount >= 1 && (
          <path
            d="M 6 22 A 13 13 0 0 1 5 13"
            fill="none"
            stroke="#D7CBBE"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity={data.arcFillCount === 1 ? "0.6" : "0.85"}
          />
        )}
        {data.arcFillCount >= 2 && (
          <path
            d="M 8 9 A 13 13 0 0 1 19 4"
            fill="none"
            stroke="#D7CBBE"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.9"
          />
        )}
        {data.arcFillCount >= 3 && (
          <path
            d="M 23 6 A 13 13 0 0 1 28 17"
            fill="none"
            stroke="#D7CBBE"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="1"
          />
        )}

        {/* Miniature needle indicator */}
        <g
          transform={`rotate(${data.needleRotation} 16 16)`}
          className="transition-transform duration-500 ease-out"
        >
          <line
            x1="16"
            y1="6"
            x2="16"
            y2="16"
            stroke="#D7CBBE"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeOpacity={level === "insufficient_data" ? "0.3" : "0.95"}
          />
          <circle
            cx="16"
            cy="16"
            r="1.8"
            fill="#D7CBBE"
            fillOpacity={level === "insufficient_data" ? "0.3" : "0.95"}
          />
        </g>
      </svg>
    </div>
  );

  if (showDialOnly) {
    return dial;
  }

  return (
    <div
      className={`inline-flex items-center border transition-all ${
        isSm ? "px-2.5 py-1 text-xs gap-1.5 rounded-md" : "px-3 py-1.5 text-xs md:text-sm gap-2 rounded-lg"
      } ${data.badgeStyle} ${className}`}
    >
      {dial}
      <span className="font-medium leading-none">{data.label}</span>
    </div>
  );
}
