"use client";

import React from "react";

export function PropertyCardSkeleton() {
  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] min-h-[380px] sm:min-h-[420px] p-6 flex flex-col justify-between shadow-[0_20px_60px_rgba(15,26,43,0.04)]"
      dir="rtl"
    >
      {/* Soft mist shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-[rgba(189,196,212,0.18)] to-transparent pointer-events-none" />

      {/* Top Image placeholder */}
      <div className="w-full h-48 rounded-[24px] bg-[var(--cream)] border border-[var(--mist)] animate-pulse mb-4" />

      {/* Content Skeleton */}
      <div className="space-y-4">
        {/* Title and city */}
        <div className="space-y-2">
          <div className="w-24 h-4 rounded-full bg-[var(--mist)]/40 animate-pulse" />
          <div className="w-3/4 h-6 rounded-lg bg-[var(--mist)]/30 animate-pulse" />
        </div>

        {/* Price and dial gauge */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--mist)]">
          <div className="w-32 h-6 rounded-lg bg-[var(--mist)]/40 animate-pulse" />
          <div className="w-12 h-12 rounded-full bg-[var(--cream)] border border-[var(--mist)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ComparisonMatrixSkeleton() {
  return (
    <div
      className="relative rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] p-6 space-y-6 overflow-hidden shadow-[0_20px_60px_rgba(15,26,43,0.04)]"
      dir="rtl"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-[rgba(189,196,212,0.18)] to-transparent pointer-events-none" />

      {/* Header Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[var(--mist)] pb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] animate-pulse p-4 space-y-3"
          >
            <div className="w-20 h-5 rounded-full bg-[var(--mist)]/40" />
            <div className="w-3/4 h-5 rounded bg-[var(--mist)]/30" />
            <div className="w-1/2 h-7 rounded bg-[var(--mist)]/40" />
          </div>
        ))}
      </div>

      {/* Rows Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="h-14 rounded-xl bg-[var(--cream)] border border-[var(--mist)] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
