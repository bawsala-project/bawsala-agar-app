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
    containerClass: "bg-[#F2EBE2] text-[#130F08] font-medium border border-[#F2EBE2] shadow-sm",
  },
  provisional: {
    label: "ترتيب مبدئي قابل للتحديث",
    icon: Clock,
    containerClass: "bg-[#3D271A]/70 text-[#F2EBE2] border border-[#645A4E]/50",
  },
  insufficient: {
    label: "لا تكفي البيانات للمقارنة القاطعة",
    icon: AlertCircle,
    containerClass: "bg-[#130F08]/80 text-[#D7CBBE] border border-[#645A4E]/60 border-dashed",
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
      className={`inline-flex items-center tracking-wide select-none ${sizeClasses} ${config.containerClass} ${className}`}
    >
      <Icon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      <span className="leading-none">{config.label}</span>
    </span>
  );
}
