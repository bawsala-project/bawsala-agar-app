"use client";

import React from "react";
import { motion } from "framer-motion";
import { BawsalaCompass } from "./bawsala-compass";

interface BawsalaLoadingProps {
  className?: string;
  size?: number;
  message?: string;
  submessage?: string;
}

/**
 * BawsalaLoading: Loading indicator featuring an animated compass with:
 * - Smooth continuous dial rotation
 * - Subtle needle oscillation
 * - Light editorial cream and navy ink styling
 */
export function BawsalaLoading({
  className = "",
  size = 64,
  message = "جارٍ تحليل ملاءمة الخيارات…",
  submessage = "مطابقة الشقق مع ميزانيتك وأولوياتك",
}: BawsalaLoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center select-none ${className}`}>
      {/* Animated Compass Unit */}
      <div className="relative mb-4 flex items-center justify-center">
        {/* Looping Compass Spin Container */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
          className="text-[var(--navy)]"
        >
          <BawsalaCompass size={size} needleRotation={15} />
        </motion.div>
      </div>

      {/* Message & Submessage */}
      {message && (
        <h4 className="font-display font-bold text-sm sm:text-base text-[var(--navy)] tracking-tight">
          {message}
        </h4>
      )}

      {submessage && (
        <p className="text-xs text-[var(--dusty-blue)] mt-1.5 font-normal max-w-xs">
          {submessage}
        </p>
      )}
    </div>
  );
}
