"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { HeroCompassWatermark } from "@/components/brand/compass-watermark";
import { MagneticButton } from "./magnetic-button";

interface HeroSectionProps {
  onStartClick?: () => void;
  className?: string;
}

export function HeroSection({ onStartClick, className = "" }: HeroSectionProps) {
  return (
    <section
      dir="rtl"
      className={`relative bg-[var(--cream)] pt-24 sm:pt-28 lg:pt-32 pb-10 sm:pb-12 lg:pb-14 overflow-hidden select-none z-20 ${className}`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 sm:gap-10 lg:gap-8 xl:gap-12">
          {/* RIGHT COLUMN (RTL): Editorial Headline, Description & CTAs */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-center lg:text-right relative z-30">
            {/* Subtle Scope Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--mist)] text-xs font-bold text-[var(--navy)] shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
              <span>مساعد مستقل لمشتري الشقق</span>
            </motion.div>

            {/* Headline: Navy Display Font on 3 Clean, Non-Overlapping Lines */}
            <h1 className="font-display font-black text-[28px] sm:text-[36px] md:text-[40px] lg:text-[38px] xl:text-[44px] text-[var(--navy)] tracking-tight leading-[1.3] space-y-1">
              <span className="block overflow-hidden py-0.5">
                <motion.span
                  initial={{ y: "110%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                  className="block"
                >
                  اتخذ قرار شراء شقتك
                </motion.span>
              </span>

              <span className="block overflow-hidden py-0.5">
                <motion.span
                  initial={{ y: "110%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                  className="block"
                >
                  بناءً على احتياجك وميزانيتك
                </motion.span>
              </span>

              <span className="block overflow-hidden py-0.5">
                <motion.span
                  initial={{ y: "110%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                  className="block text-[var(--midnight)]"
                >
                  بوضوح وثقة مستقلة
                </motion.span>
              </span>
            </h1>

            {/* Subtext in Dusty-Blue */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="text-[var(--dusty-blue)] text-sm sm:text-base leading-[1.85] max-w-[52ch] font-normal mx-auto lg:mx-0"
            >
              قارن حتى 5 شقق مرشحة بما يناسب أسرتك وميزانيتك.
            </motion.p>

            {/* Primary & Ghost CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
              className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4"
            >
              <MagneticButton
                href="#consultation-card"
                onClick={onStartClick}
                variant="primary"
              >
                ابدأ استشارتك
              </MagneticButton>

              <MagneticButton
                href="#active-sessions"
                variant="ghost"
                showArrow={false}
              >
                حالاتي
              </MagneticButton>
            </motion.div>
          </div>

          {/* LEFT COLUMN (RTL): Cutout Property Illustration + Contained Compass Watermark */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            {/* Contained Faint Compass Watermark directly behind the building */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
              <HeroCompassWatermark size={480} className="opacity-100" />
            </div>

            <motion.div
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.85,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative w-full max-w-[500px] lg:max-w-[540px] mx-auto"
            >
              {/* Soft Ground Shadow */}
              <div
                className="absolute -bottom-2 left-[8%] right-[8%] h-7 sm:h-10 rounded-[100%] bg-[var(--navy)]/10 blur-[24px] pointer-events-none -z-10"
                aria-hidden="true"
              />

              <Image
                src="/images/house-cutout.png"
                alt="بوصلة العقار - مساعد ذكي ومستقل لاتخاذ قرار شراء شقة سكنية في السعودية"
                width={1100}
                height={691}
                priority
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 70vw, 540px"
                className="w-full h-auto block object-contain select-none transition-[filter] duration-400 ease-out hover:brightness-[1.04]"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
