"use client";

import React from "react";
import { Building2, MapPin, Compass, Globe2 } from "lucide-react";

export type ScopeType = "property" | "micro_location" | "neighborhood" | "market";

interface ScopeTagProps {
  scope: ScopeType;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const SCOPE_CONFIG: Record<
  ScopeType,
  {
    defaultLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    containerClass: string;
  }
> = {
  property: {
    defaultLabel: "عقار",
    icon: Building2,
    containerClass: "bg-[#FAF6EF] text-[#130F08] border border-[#E9DFD0] shadow-2xs",
  },
  micro_location: {
    defaultLabel: "موقع دقيق",
    icon: MapPin,
    containerClass: "bg-[#14756E]/10 text-[#14756E] border border-[#14756E]/30 font-semibold",
  },
  neighborhood: {
    defaultLabel: "نطاق الحي",
    icon: Compass,
    containerClass: "bg-white text-[#130F08] border border-[#E9DFD0] border-dashed",
  },
  market: {
    defaultLabel: "السوق العام",
    icon: Globe2,
    containerClass: "bg-white text-[#130F08] border border-[#E9DFD0]",
  },
};

export function ScopeTag({
  scope,
  label,
  size = "md",
  className = "",
}: ScopeTagProps) {
  const config = SCOPE_CONFIG[scope] || SCOPE_CONFIG.property;
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2.5 py-1 gap-1.5 rounded-full"
      : "text-xs md:text-sm px-3.5 py-1.5 gap-2 rounded-full";

  return (
    <span
      className={`inline-flex items-center font-normal transition-colors select-none ${sizeClasses} ${config.containerClass} ${className}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
      <span className="leading-none">{displayLabel}</span>
    </span>
  );
}
