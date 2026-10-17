"use client";

import React from "react";
import { BawsalaCompass } from "./bawsala-compass";

interface BawsalaEmptyStateProps {
  className?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconSize?: number;
}

/**
 * BawsalaEmptyState: Brand empty state component in quiet editorial cream and paper styling
 */
export function BawsalaEmptyState({
  className = "",
  title,
  description,
  actionLabel,
  onAction,
  iconSize = 64,
}: BawsalaEmptyStateProps) {
  return (
    <div
      className={`rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto select-none shadow-[0_20px_60px_rgba(15,26,43,0.06)] ${className}`}
    >
      {/* Compass in Clean Cream Container */}
      <div className="relative mb-5 p-3 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)]">
        <BawsalaCompass size={iconSize} needleRotation={15} />
      </div>

      <h3 className="font-body font-bold text-lg sm:text-xl text-[var(--navy)] mb-2 tracking-tight">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-[var(--dusty-blue)] leading-relaxed mb-6 max-w-sm">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-full bg-[var(--navy)] text-[var(--cream)] hover:bg-[var(--midnight)] text-xs font-semibold py-2.5 px-6 shadow-xs transition-all cursor-pointer"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
