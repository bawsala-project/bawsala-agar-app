"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

export interface GlassPillProps {
  label: React.ReactNode;
  size?: "48" | "56";
  icon?: React.ReactNode;
  showArrow?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: "glass" | "sandstone";
  className?: string;
}

export function GlassPill({
  label,
  size = "48",
  icon,
  showArrow = false,
  onClick,
  disabled = false,
  fullWidth = false,
  variant = "glass",
  className = "",
}: GlassPillProps) {
  const is56 = size === "56";
  const isSandstone = variant === "sandstone";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-between rounded-full transition-all duration-150 select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] ${
        is56
          ? showArrow
            ? "h-[56px] ps-6 pe-2 text-[16px]"
            : "h-[56px] px-6 text-[16px]"
          : "h-[48px] px-5 text-[15px]"
      } ${
        isSandstone
          ? "bg-sandstone text-espresso font-semibold shadow-md hover:brightness-105"
          : "bawsala-glass text-sandstone font-medium hover:brightness-110"
      } ${fullWidth ? "w-full" : "w-auto"} ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <span className="flex items-center justify-center shrink-0 w-5 h-5">
            {icon}
          </span>
        )}
        <span className="truncate">{label}</span>
      </div>

      {showArrow && (
        <span
          className={`flex items-center justify-center shrink-0 w-10 h-10 rounded-full transition-transform duration-150 group-active:-translate-x-1 shadow-xs ${
            isSandstone
              ? "bg-espresso text-sandstone"
              : "bg-surface-3 text-sandstone"
          }`}
          aria-hidden="true"
        >
          {/* In RTL Arabic, the forward navigation arrow points left */}
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </span>
      )}
    </button>
  );
}
