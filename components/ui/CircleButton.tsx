"use client";

import React from "react";

export interface CircleButtonProps {
  icon: React.ReactNode;
  ariaLabel: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  isPressed?: boolean;
  variant?: "glass" | "surface";
}

export function CircleButton({
  icon,
  ariaLabel,
  onClick,
  disabled = false,
  className = "",
  isPressed = false,
  variant = "glass",
}: CircleButtonProps) {
  const isSurface = variant === "surface";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`relative inline-flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-full text-sandstone transition-all duration-150 cursor-pointer select-none disabled:opacity-40 disabled:pointer-events-none ${
        isSurface
          ? "bg-surface-2 border border-stroke hover:bg-surface-3"
          : "bawsala-glass hover:brightness-110"
      } ${isPressed ? "scale-[0.97] brightness-90 ring-1 ring-sandstone/30" : "active:scale-[0.97]"} ${className}`}
    >
      <div className="flex items-center justify-center w-5 h-5 pointer-events-none">
        {icon}
      </div>
    </button>
  );
}
