"use client";

import React from "react";

export interface WideCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  value?: React.ReactNode;
  children?: React.ReactNode;
  isToggle?: boolean;
  checked?: boolean;
  onToggle?: (checked: boolean) => void;
  onClick?: () => void;
  className?: string;
}

export function WideCard({
  title,
  subtitle,
  icon,
  value,
  children,
  isToggle = false,
  checked = false,
  onToggle,
  onClick,
  className = "",
}: WideCardProps) {
  const handleClick = () => {
    if (isToggle && onToggle) {
      onToggle(!checked);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      role={isToggle || onClick ? "button" : undefined}
      tabIndex={isToggle || onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && (isToggle || onClick)) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`w-full flex flex-col p-4 sm:p-5 rounded-[28px] bg-surface-2 border border-stroke transition-all select-none ${
        isToggle || onClick ? "cursor-pointer hover:bg-surface-3 active:scale-[0.99]" : ""
      } ${className}`}
      dir="rtl"
    >
      {/* Top Header Row: Icon + Title + Subtitle and Value/Toggle */}
      <div className="w-full flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-3 text-sandstone shrink-0 border border-stroke mt-0.5">
              {icon}
            </div>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[15px] sm:text-[16px] font-semibold text-sandstone leading-snug">
              {title}
            </span>
            {subtitle && (
              <span className="text-[13px] font-normal text-muted leading-tight mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* End Content: Value or Toggle */}
        <div className="shrink-0 ms-3">
          {isToggle ? (
            <div
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 p-0.5 ${
                checked ? "bg-sandstone" : "bg-surface-3 border border-stroke"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full transition-transform duration-200 shadow-xs ${
                  checked
                    ? "translate-x-[-20px] bg-espresso"
                    : "translate-x-0 bg-muted"
                }`}
              />
            </div>
          ) : (
            value && (
              <div className="text-[15px] font-medium text-sandstone">
                {value}
              </div>
            )
          )}
        </div>
      </div>

      {/* Children: Spans full width below header row */}
      {children && (
        <div className="mt-2.5 w-full">
          {children}
        </div>
      )}
    </div>
  );
}
