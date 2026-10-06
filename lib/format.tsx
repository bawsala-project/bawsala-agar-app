import React from "react";

/**
 * Unicode isolate helper for string contexts (e.g. metadata, alt text, or pure strings)
 * \u2066 is LEFT-TO-RIGHT ISOLATE (LRI)
 * \u2069 is POP DIRECTIONAL ISOLATE (PDI)
 */
export function isolateLtr(str: string): string {
  return `\u2066${str}\u2069`;
}

/**
 * Format a number using Western digits and comma thousands separators.
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
  if (isNaN(n)) return String(num);
  return n.toLocaleString("en-US");
}

/**
 * Format price in SAR, returning Unicode-isolated string.
 */
export function formatPriceString(amount: number | string): string {
  return isolateLtr(`${formatNumber(amount)} ر.س`);
}

/**
 * Format area in square meters, returning Unicode-isolated string.
 */
export function formatAreaString(area: number | string): string {
  return isolateLtr(`${formatNumber(area)} م²`);
}

/**
 * BdiNumber Component
 * Enforces tabular numerals, Western digits, and wraps in <bdi dir="ltr"> so that
 * numbers with units (e.g. "870,000 ر.س" or "160 م²") never scramble in Arabic RTL layouts.
 */
export interface BdiNumberProps {
  value: number | string;
  unit?: string;
  className?: string;
  children?: React.ReactNode;
}

export function BdiNumber({
  value,
  unit,
  className = "",
  children,
}: BdiNumberProps) {
  const content = children ?? (
    <>
      {typeof value === "number" ? formatNumber(value) : value}
      {unit ? ` ${unit}` : ""}
    </>
  );

  return (
    <bdi dir="ltr" className={`tabular-nums font-sans inline-block ${className}`}>
      {content}
    </bdi>
  );
}
