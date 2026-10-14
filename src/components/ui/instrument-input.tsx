"use client";

import React, { useState } from "react";

export interface InstrumentInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  wellClassName?: string;
}

export function InstrumentInput({
  label,
  hint,
  error,
  startIcon,
  endIcon,
  className = "",
  wellClassName = "",
  onFocus,
  onBlur,
  ...props
}: InstrumentInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div dir="rtl" className="w-full space-y-1.5 text-right">
      {label && (
        <label className="block text-xs font-bold text-[var(--navy)] tracking-tight">
          {label}
        </label>
      )}

      {/* Rounded Cream Well Container (1px Mist Border) */}
      <div
        className={`relative rounded-2xl bg-[var(--cream)] border transition-all duration-200 flex items-center px-4 py-3 min-h-[48px] overflow-hidden ${
          isFocused
            ? "border-[var(--navy)]"
            : error
            ? "border-[var(--status-danger)]"
            : "border-[var(--mist)] hover:border-[var(--dusty-blue)]"
        } ${wellClassName}`}
      >
        {startIcon && (
          <span className="shrink-0 ml-3 text-[var(--dusty-blue)] pointer-events-none">
            {startIcon}
          </span>
        )}

        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className={`w-full bg-transparent text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 text-xs sm:text-sm font-medium border-none outline-none ${className}`}
        />

        {endIcon && (
          <span className="shrink-0 mr-3 text-[var(--dusty-blue)] pointer-events-none">
            {endIcon}
          </span>
        )}
      </div>

      {error ? (
        <p className="text-[11px] text-[var(--status-danger)] font-medium">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-[var(--dusty-blue)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
