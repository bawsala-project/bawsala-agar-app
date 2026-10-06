"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SurveyBracketsProps {
  children?: React.ReactNode;
  active?: boolean;
  size?: number; // length of the bracket arms in pixels
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export function SurveyBrackets({
  children,
  active = true,
  size = 10,
  color = "#D7CBBE",
  className = "",
  strokeWidth = 1.5,
}: SurveyBracketsProps) {
  return (
    <div className={`relative ${className}`}>
      {children}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Top-Right Bracket (RTL primary top corner) */}
            <svg
              className="absolute top-0 right-0"
              width={size + 4}
              height={size + 4}
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d={`M 16 ${size + 2} L 16 0 L ${16 - (size + 2)} 0`}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Top-Left Bracket */}
            <svg
              className="absolute top-0 left-0"
              width={size + 4}
              height={size + 4}
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d={`M 0 ${size + 2} L 0 0 L ${size + 2} 0`}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Bottom-Right Bracket */}
            <svg
              className="absolute bottom-0 right-0"
              width={size + 4}
              height={size + 4}
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d={`M 16 ${16 - (size + 2)} L 16 16 L ${16 - (size + 2)} 16`}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Bottom-Left Bracket */}
            <svg
              className="absolute bottom-0 left-0"
              width={size + 4}
              height={size + 4}
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d={`M 0 ${16 - (size + 2)} L 0 16 L ${size + 2} 16`}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
