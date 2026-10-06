"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion, animate } from "framer-motion";
import { MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion";

/**
 * Skeleton Shimmer helper
 */
interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
  height?: string | number;
  width?: string | number;
}

export function Skeleton({
  className = "",
  rounded = "lg",
  height,
  width,
}: SkeletonProps) {
  const roundedClass = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      className={`skeleton-shimmer border border-[#645A4E]/20 ${roundedClass} ${className}`}
      style={{
        height: height ?? undefined,
        width: width ?? undefined,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Animated Progress Line helper
 */
interface AnimatedProgressLineProps {
  value: number; // 0 to 100
  height?: number;
  className?: string;
  accentColor?: string;
}

export function AnimatedProgressLine({
  value,
  height = 4,
  className = "",
  accentColor = "bg-[#D7CBBE]",
}: AnimatedProgressLineProps) {
  const shouldReduceMotion = useReducedMotion();
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`w-full bg-[#3D271A]/60 rounded-full overflow-hidden border border-[#645A4E]/30 relative ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={`h-full ${accentColor} rounded-full`}
        initial={{ width: "0%" }}
        animate={{ width: `${clampedValue}%` }}
        transition={
          shouldReduceMotion
            ? { duration: 0.2 }
            : {
                duration: 0.9,
                ease: MOTION_EASINGS.default,
              }
        }
      />
    </div>
  );
}

/**
 * Animated Number / Count-up helper
 */
interface CountUpNumberProps {
  from?: number;
  to: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export function CountUpNumber({
  from = 0,
  to,
  duration = 1.2,
  formatter = (v) => Math.round(v).toLocaleString("ar-SA"),
  className = "",
}: CountUpNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? to : from);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(to);
      return;
    }

    const controls = animate(from, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    return () => controls.stop();
  }, [from, to, duration, shouldReduceMotion]);

  return <span className={className}>{formatter(displayValue)}</span>;
}

/**
 * Animated Input with floating label and animated focus ring
 */
interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function AnimatedInput({
  label,
  error,
  id,
  value,
  onChange,
  className = "",
  ...props
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || React.useId();
  const hasValue = Boolean(value && String(value).length > 0);

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className={`relative rounded-xl transition-all duration-300 border ${
          error
            ? "border-[#A8643C] shadow-[0_0_12px_rgba(168,100,60,0.2)]"
            : isFocused
            ? "border-[#D7CBBE] shadow-[0_0_15px_rgba(215,203,190,0.18)]"
            : "border-[#645A4E]/40 hover:border-[#645A4E]/80"
        } bg-[#130F08]/60 backdrop-blur-md`}
      >
        <input
          id={inputId}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pt-6 pb-2.5 px-4 bg-transparent text-[#D7CBBE] placeholder-transparent focus:outline-none text-sm md:text-base font-normal leading-normal"
          placeholder={label}
          {...props}
        />

        {/* Floating animated label */}
        <motion.label
          htmlFor={inputId}
          initial={false}
          animate={{
            y: isFocused || hasValue ? -10 : 0,
            scale: isFocused || hasValue ? 0.75 : 1,
            color: error ? "#A8643C" : isFocused ? "#D7CBBE" : "#645A4E",
          }}
          transition={{ duration: MOTION_DURATIONS.micro, ease: MOTION_EASINGS.default }}
          style={{ originX: 1, originY: 0 }}
          className="absolute right-4 top-3.5 pointer-events-none text-sm font-normal select-none"
        >
          {label}
        </motion.label>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-[#A8643C] mt-1.5 px-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
