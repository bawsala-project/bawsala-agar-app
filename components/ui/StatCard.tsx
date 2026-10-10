"use client";

import React from "react";
import { CircleButton } from "./CircleButton";

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  onIconClick?: () => void;
  iconAriaLabel?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  onIconClick,
  iconAriaLabel = "إجراء إضافي",
  className = "",
}: StatCardProps) {
  const valueStr = String(value);
  const isLong = valueStr.length > 6;
  const isMedium = valueStr.length > 4;

  return (
    <div
      className={`relative flex flex-col justify-between p-3.5 sm:p-5 rounded-[28px] bg-surface-2 border border-stroke min-h-[140px] sm:min-h-[150px] overflow-hidden select-none min-w-0 ${className}`}
      dir="rtl"
    >
      {/* Top Row: label top-start, circular icon button top-end */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <span className="text-[13px] font-medium text-muted leading-tight truncate">
          {label}
        </span>

        {icon && (
          <div className="shrink-0 -mt-1 -me-1">
            <CircleButton
              icon={icon}
              ariaLabel={iconAriaLabel}
              onClick={onIconClick}
              variant="glass"
            />
          </div>
        )}
      </div>

      {/* Bottom: big number 40/500 with long-number adaptation + small unit 14 muted */}
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mt-auto min-w-0">
        <bdi
          dir="ltr"
          className={`${
            isLong
              ? "text-[20px] sm:text-[24px]"
              : isMedium
              ? "text-[24px] sm:text-[28px]"
              : "text-[28px] sm:text-[36px]"
          } font-medium text-ink leading-none tabular-nums tracking-tight whitespace-nowrap`}
        >
          {value}
        </bdi>
        {unit && (
          <span className="text-[12px] sm:text-[13px] font-normal text-muted leading-none shrink-0">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
