"use client";

import React from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { RankingViewMode } from "@/lib/store";

interface StatusPillProps {
  status: RankingViewMode;
  className?: string;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  RankingViewMode,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    containerClass: string;
  }
> = {
  ranked: {
    label: "ترتيب واضح ومكتمل",
    icon: CheckCircle2,
    containerClass: "bg-[#14756E]/12 text-[#14756E] font-semibold border border-[#14756E]/40 shadow-2xs",
  },
  provisional: {
    label: "ترتيب مبدئي قابل للتحديث",
    icon: Clock,
    containerClass: "bg-[#FAF6EF] text-[#130F08] font-semibold border border-[#E9DFD0] shadow-2xs",
  },
  insufficient: {
    label: "لا تكفي البيانات للمقارنة القاطعة",
    icon: AlertCircle,
    containerClass: "bg-white text-[#C2643A] font-semibold border border-[#C2643A]/40 border-dashed",
  },
};

export function StatusPill({
  status,
  className = "",
  size = "md",
}: StatusPillProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ranked;
  const Icon = config.icon;

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2.5 py-1 gap-1.5 rounded-full"
      : "text-xs md:text-sm px-3.5 py-1.5 gap-2 rounded-full";

  return (
    <span
      className={`inline-flex items-center select-none ${sizeClasses} ${config.containerClass} ${className}`}
    >
      <Icon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      <span className="leading-none">{config.label}</span>
    </span>
  );
}
