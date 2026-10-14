"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { HeroCompassWatermark } from "@/components/brand/compass-watermark";
import { MagneticButton } from "./magnetic-button";

interface HeroSectionProps {
  onStartClick?: () => void;
  className?: string;
}

export function HeroSection({ onStartClick, className = "" }: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);

  // Slow Parallax on scroll: house moves up 40px slower than the page
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const rawHouseY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const houseParallaxY = useSpring(rawHouseY, { stiffness: 90, damping: 24 });

  // Stretched kashida representation for "هندسي محايد"
  const kashidaPhrase = "هندسيـــــ محايـــــد";

  return (
    <section
      ref={containerRef}
      dir="rtl"
      className={`relative bg-[var(--cream)] pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-16 md:pb-24 lg:pb-32 overflow-visible select-none z-20 ${className}`}
    >
      {/* Giant Faint 4% Navy Rotating Compass Watermark behind the hero */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-0">
        <HeroCompassWatermark
          size={820}
          className="opacity-100"
        />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-20 min-h-[580px] lg:min-h-[660px] xl:min-h-[700px] flex flex-col justify-between">
        
        {/* TEXT & CTAS: Top Right on Desktop, Headline Sits Above the House */}
        <div className="w-full lg:max-w-[620px] lg:mr-0 lg:ml-auto space-y-6 sm:space-y-8 text-right relative z-30">
          {/* Headline: Navy Display Font on 3 Comfortable Lines with Masked Rise */}
          <div className="space-y-1 sm:space-y-2">
            {/* Line 1: اتخذ قرار شراء مسكنك */}
            <div className="overflow-hidden py-1">
              <motion.h1
                initial={{ y: "115%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                className="font-display font-black text-3xl sm:text-5xl lg:text-[54px] xl:text-[58px] text-[var(--navy)] tracking-tight leading-[1.3]"
              >
                اتخذ قرار شراء مسكنك
              </motion.h1>
            </div>

            {/* Line 2: بأرقام قطعية وتدقيق */}
            <div className="overflow-hidden py-1">
              <motion.div
                initial={{ y: "115%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
                className="font-display font-black text-3xl sm:text-5xl lg:text-[54px] xl:text-[58px] text-[var(--navy)] tracking-tight leading-[1.3]"
              >
                بأرقام قطعية وتدقيق
              </motion.div>
            </div>

            {/* Line 3: هندسي محايد (with Stretched Kashida in --midnight) */}
            <div className="overflow-hidden py-1">
              <motion.div
                initial={{ y: "115%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className="font-display font-black text-3xl sm:text-5xl lg:text-[54px] xl:text-[58px] text-[var(--midnight)] tracking-tight leading-[1.3]"
              >
                {kashidaPhrase}
              </motion.div>
            </div>
          </div>

          {/* Subtext in Dusty-Blue */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-[var(--dusty-blue)] text-base sm:text-lg leading-[1.8] max-w-[52ch] font-normal"
          >
            نكشف الفوارق الخفية بين المساحات الترويجية والواقع الفعلي للصك ومخطط البناء، ونزن تكاليف التشغيل المخفية قبل دفع أي عربون أو توقيع تمويل عقاري.
          </motion.p>

          {/* TWO BUTTONS ONLY: Primary (Navy Fill) & Ghost (1px Navy Border) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="pt-1 flex flex-wrap items-center gap-4"
          >
            {/* Primary CTA (Navy Fill, Cream Text: ابدأ دراسة قرار جديدة) */}
            <MagneticButton
              href="#consultation-card"
              onClick={onStartClick}
              variant="primary"
            >
              ابدأ دراسة قرار جديدة
            </MagneticButton>

            {/* Ghost Button (1px Navy Border: استعراض جلسات التقييم) */}
            <MagneticButton
              href="#active-sessions"
              variant="ghost"
              showArrow={false}
            >
              استعراض جلسات التقييم
            </MagneticButton>
          </motion.div>
        </div>

        {/* CUTOUT HOUSE IMAGE (Transparent PNG)
            - Desktop: ~58-60% width, anchored bottom-left, bleeding slightly off left edge, overlaps card by 48px
            - Tablet: 70% width, centered under text
            - Mobile: 110% width, overlapping card by 32px
        */}
        <motion.div
          style={{ y: houseParallaxY }}
          className="relative z-20 w-full lg:w-[58%] xl:w-[60%] lg:absolute lg:bottom-[-48px] xl:bottom-[-56px] lg:left-[-32px] xl:left-[-48px] md:w-[70%] md:mx-auto md:relative md:left-auto md:bottom-[-40px] md:mt-10 mt-8 sm:mt-10 will-change-transform pointer-events-auto"
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 1.0,
              delay: 0.25, // 200ms after headline reveals begin
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative group w-[110%] -mr-[5%] -ml-[5%] md:w-full md:m-0"
          >
            {/* Soft Ground Shadow: Flat ellipse, navy at 10% opacity, blurred 30px */}
            <div
              className="absolute -bottom-2 sm:-bottom-3 left-[6%] right-[6%] h-8 sm:h-12 rounded-[100%] bg-[var(--navy)]/10 blur-[30px] pointer-events-none -z-10"
              aria-hidden="true"
            />

            {/* Cutout House with subtle hover window brightening */}
            <Image
              src="/images/house-cutout.png"
              alt="نموذج فيلا سكنية حديثة خاضعة للتدقيق الهندسي - بوصلة العقار"
              width={1100}
              height={691}
              priority
              sizes="(max-width: 640px) 110vw, (max-width: 1024px) 70vw, 720px"
              className="w-full h-auto object-contain select-none transition-[filter] duration-400 ease-out hover:brightness-[1.06]"
            />
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
