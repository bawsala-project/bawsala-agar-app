"use client";

import React from "react";
import { CircleButton } from "./CircleButton";
import { GlassPill } from "./GlassPill";

export interface ActionBarProps {
  primaryLabel: string;
  onPrimaryAction?: () => void;
  startIcon?: React.ReactNode;
  startAriaLabel?: string;
  onStartAction?: () => void;
  endIcon?: React.ReactNode;
  endAriaLabel?: string;
  onEndAction?: () => void;
  primaryVariant?: "glass" | "sandstone";
  pinned?: boolean;
  className?: string;
}

export function ActionBar({
  primaryLabel,
  onPrimaryAction,
  startIcon,
  startAriaLabel,
  onStartAction,
  endIcon,
  endAriaLabel,
  onEndAction,
  primaryVariant = "sandstone",
  pinned = true,
  className = "",
}: ActionBarProps) {
  return (
    <div
      className={`flex items-center gap-3 z-30 select-none ${
        pinned
          ? "fixed inset-x-5 bottom-[calc(20px+var(--safe-bottom))] max-w-[393px] mx-auto"
          : "w-full"
      } ${className}`}
      dir="rtl"
    >
      {/* Start Circle Button (if startIcon provided) */}
      {startIcon && (
        <CircleButton
          icon={startIcon}
          ariaLabel={startAriaLabel || ""}
          onClick={onStartAction}
          variant="glass"
        />
      )}

      {/* Center Wide GlassPill with label and arrow */}
      <div className="flex-1 min-w-0">
        <GlassPill
          label={primaryLabel}
          size="56"
          variant={primaryVariant}
          showArrow
          fullWidth
          onClick={onPrimaryAction}
        />
      </div>

      {/* End Circle Button (if endIcon provided) */}
      {endIcon && (
        <CircleButton
          icon={endIcon}
          ariaLabel={endAriaLabel || ""}
          onClick={onEndAction}
          variant="glass"
        />
      )}
    </div>
  );
}
