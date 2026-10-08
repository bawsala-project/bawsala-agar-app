"use client";

import React from "react";

export interface ChipItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
}

export interface ChipsRowProps {
  chips: ChipItem[];
  selectedId?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function ChipsRow({
  chips,
  selectedId,
  onChange,
  className = "",
}: ChipsRowProps) {
  return (
    <div
      className={`flex items-center gap-3 overflow-x-auto select-none scrollbar-none py-1 w-full max-w-full min-w-0 ${className}`}
      dir="rtl"
    >
      {chips.map((chip) => {
        const isActive = chip.id === selectedId;

        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChange?.(chip.id)}
            className={`inline-flex items-center gap-2 h-[40px] px-4 rounded-full text-[14px] transition-all duration-150 cursor-pointer shrink-0 active:scale-[0.97] ${
              isActive
                ? "bg-sandstone text-espresso font-semibold shadow-xs"
                : "bg-surface-2 text-muted border border-stroke font-medium hover:text-sandstone hover:bg-surface-3"
            }`}
          >
            {chip.icon && (
              <span className={`w-4 h-4 flex items-center justify-center shrink-0 ${isActive ? "text-espresso" : "text-muted"}`}>
                {chip.icon}
              </span>
            )}

            <span>{chip.label}</span>

            {chip.count !== undefined && (
              <span
                className={`text-[12px] tabular-nums px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-espresso/15 text-espresso"
                    : "bg-surface-3 text-muted"
                }`}
              >
                <bdi dir="ltr">{chip.count}</bdi>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
