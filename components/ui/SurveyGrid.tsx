"use client";

import React from "react";

interface SurveyGridProps {
  variant?: "dark" | "paper";
  className?: string;
  children?: React.ReactNode;
  radialFade?: boolean;
}

export function SurveyGrid({
  variant = "dark",
  className = "",
  children,
  radialFade = true,
}: SurveyGridProps) {
  const isDark = variant === "dark";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 24px Hairline Grid Pattern with radial mask fade */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isDark ? "survey-grid-dark" : "survey-grid-paper"
        }`}
        style={
          radialFade
            ? {
                maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)",
                WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)",
              }
            : undefined
        }
      />

      {/* Optional Inner Content */}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
