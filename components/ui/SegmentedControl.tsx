"use client";

import React from "react";
import { motion } from "framer-motion";

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  isProblem?: boolean;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = "",
  size = "md",
}: SegmentedControlProps<T>) {
  const isSm = size === "sm";

  return (
    <div
      className={`relative inline-flex items-center p-1 rounded-full bg-[#130F08]/60 border border-[#645A4E]/35 backdrop-blur-md select-none ${className}`}
      dir="rtl"
    >
      {options.map((option) => {
        const isSelected = option.id === value;
        const isProblem = option.isProblem && isSelected;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`relative z-10 flex items-center justify-center font-medium transition-colors cursor-pointer rounded-full ${
              isSm ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-xs md:text-sm"
            } ${
              isSelected
                ? isProblem
                  ? "text-[#A8643C] font-semibold"
                  : "text-[#130F08] font-semibold"
                : "text-[#D7CBBE]/75 hover:text-[#D7CBBE]"
            }`}
          >
            {/* Sliding Active Pill Background */}
            {isSelected && (
              <motion.div
                layoutId={`active-pill-${options.map((o) => o.id).join("-")}`}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 32,
                }}
                className={`absolute inset-0 rounded-full -z-10 shadow-sm ${
                  isProblem
                    ? "bg-[#3D271A] border border-[#A8643C] shadow-[0_0_12px_rgba(168,100,60,0.25)]"
                    : "bg-[#F2EBE2] border border-[#F2EBE2]"
                }`}
              />
            )}
            <span className="relative z-10 leading-none">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
