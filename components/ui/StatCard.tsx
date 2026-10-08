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
      className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-[28px] bg-surface-2 border border-stroke min-h-[150px] overflow-hidden select-none min-w-0 ${className}`}
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
      <div className="flex items-baseline gap-1.5 mt-4 min-w-0 overflow-hidden">
        <bdi
          dir="ltr"
          className={`${
            isLong
              ? "text-[24px] sm:text-[26px]"
              : isMedium
              ? "text-[30px] sm:text-[32px]"
              : "text-[36px] sm:text-[40px]"
          } font-medium text-ink leading-none tabular-nums tracking-tight truncate`}
        >
          {value}
        </bdi>
        {unit && (
          <span className="text-[13px] font-normal text-muted leading-none shrink-0">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
