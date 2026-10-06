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
    containerClass: "bg-sandstone/15 text-sandstone border border-sandstone/30",
  },
  micro_location: {
    defaultLabel: "موقع دقيق",
    icon: MapPin,
    containerClass: "bg-cocoa/50 text-sandstone border border-sandstone/25",
  },
  neighborhood: {
    defaultLabel: "نطاق الحي",
    icon: Compass,
    containerClass: "bg-transparent text-driftwood border border-driftwood/45 border-dashed",
  },
  market: {
    defaultLabel: "السوق العام",
    icon: Globe2,
    containerClass: "bg-transparent text-driftwood/90 border border-driftwood/35 border-dashed",
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
      className={`inline-flex items-center tracking-wide font-normal transition-colors ${sizeClasses} ${config.containerClass} ${className}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
      <span className="leading-none">{displayLabel}</span>
    </span>
  );
}
