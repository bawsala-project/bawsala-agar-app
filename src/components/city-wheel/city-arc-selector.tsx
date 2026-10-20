"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CompassLoader, type CompassLoaderState } from "@/components/brand/compass-loader";
import { type AllowedCity } from "@/lib/constants/cities";
import { ChevronUp, ChevronDown, Check } from "lucide-react";

export interface CityData {
  name: AllowedCity;
  heading: number; // Azimuth in degrees (0 - 360)
  cardinal: string;
  region: string;
  code: string;
  coordinates: string;
  elevation: string;
  description: string;
}

export const CITIES_DATA: CityData[] = [
  {
    name: "الرياض",
    heading: 45,
    cardinal: "شمال شرق • NNE",
    region: "منطقة الرياض (العاصمة)",
    code: "RUH-01",
    coordinates: "24°42'42\"N 46°40'23\"E",
    elevation: "612m فوق سطح البحر",
    description: "تنوع واسع في الشقق السكنية، ومفاضلة محاور العمل والمشاوير والميزانية",
  },
  {
    name: "جدة",
    heading: 260,
    cardinal: "غرب جنوب • WSW",
    region: "الساحل الغربي • مكة المكرمة",
    code: "JED-02",
    coordinates: "21°32'36\"N 39°10'22\"E",
    elevation: "12m فوق سطح البحر",
    description: "مفاضلة الشقق الساحلية، جودة العزل المائي ومواقف السيارات واتحاد الملاك",
  },
  {
    name: "الدمام",
    heading: 78,
    cardinal: "شرق شمال • ENE",
    region: "حاضرة المنطقة الشرقية",
    code: "DMM-03",
    coordinates: "26°26'03\"N 50°06'11\"E",
    elevation: "10m فوق سطح البحر",
    description: "خيارات شقق عائلية واسعة، مفاضلة القرب من الواجهة والخدمات اليومية",
  },
  {
    name: "الخبر",
    heading: 92,
    cardinal: "شرق مباشر • E",
    region: "المنطقة الشرقية • الساحل",
    code: "KHB-04",
    coordinates: "26°17'05\"N 50°12'30\"E",
    elevation: "8m فوق سطح البحر",
    description: "مجمعات شقق عصرية، مطابقة رسوم اتحاد الملاك وجودة المرافق المشتركة",
  },
  {
    name: "مكة المكرمة",
    heading: 245,
    cardinal: "غرب جنوب • WSW",
    region: "منطقة مكة المكرمة • الحرم",
    code: "MAK-05",
    coordinates: "21°25'00\"N 39°49'00\"E",
    elevation: "277m فوق سطح البحر",
    description: "شقق سكنية مركزية، مطابقة أولوية الوصول والمواقف واحتياج الأسرة",
  },
  {
    name: "المدينة المنورة",
    heading: 315,
    cardinal: "شمال غرب • NW",
    region: "منطقة المدينة المنورة • الحرم",
    code: "MED-06",
    coordinates: "24°28'07\"N 39°36'40\"E",
    elevation: "608m فوق سطح البحر",
    description: "أحياء سكنية هادئة، ملاءمة المساحة والخدمات وميزانية الشراء المحددة",
  },
];

export interface CityArcSelectorProps {
  initialCity?: AllowedCity;
  onSelectCity?: (city: AllowedCity, data: CityData) => void;
  onConfirm?: (city: AllowedCity, data: CityData) => void;
  title?: string;
  eyebrow?: string;
  isFullScreen?: boolean;
  className?: string;
}

// Gentle synthetic audio tick feedback
function playSyntheticTick() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(680, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch {
    // AudioContext blocked or not supported
  }
}

export function CityArcSelector({
  initialCity = "الرياض",
  onSelectCity,
  onConfirm,
  title = "اختر مدينتك",
  eyebrow = "الخطوة الأولى • النطاق الجغرافي",
  isFullScreen = false,
  className = "",
}: CityArcSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Find initial city index
  const initialIndex = Math.max(
    0,
    CITIES_DATA.findIndex((c) => c.name === initialCity)
  );

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isConfirming, setIsConfirming] = useState(false);
  const [loaderState, setLoaderState] = useState<CompassLoaderState>("pointing");

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const lastWheelTimeRef = useRef(0);

  const currentCity = CITIES_DATA[activeIndex] || CITIES_DATA[0];

  // Haptic & Sound Feedback on snap
  const triggerSnapFeedback = useCallback(() => {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch {
      // Ignored
    }
    playSyntheticTick();
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(CITIES_DATA.length - 1, index));
      if (clamped !== activeIndex) {
        setActiveIndex(clamped);
        triggerSnapFeedback();
        if (onSelectCity) {
          onSelectCity(CITIES_DATA[clamped].name, CITIES_DATA[clamped]);
        }
      }
    },
    [activeIndex, onSelectCity, triggerSnapFeedback]
  );

  const nextCity = useCallback(() => {
    if (activeIndex < CITIES_DATA.length - 1) {
      goToIndex(activeIndex + 1);
    }
  }, [activeIndex, goToIndex]);

  const prevCity = useCallback(() => {
    if (activeIndex > 0) {
      goToIndex(activeIndex - 1);
    }
  }, [activeIndex, goToIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isConfirming) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        prevCity();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        nextCity();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Wheel interaction with inertia debouncing
  const handleWheel = (e: React.WheelEvent) => {
    if (isConfirming) return;
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 140) return;

    if (Math.abs(e.deltaY) > 22) {
      lastWheelTimeRef.current = now;
      if (e.deltaY > 0) {
        nextCity();
      } else {
        prevCity();
      }
    }
  };

  // Pointer drag/swipe interactions
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isConfirming) return;
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragOffset(0);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - dragStartY;
    setDragOffset(deltaY);

    if (Math.abs(deltaY) > 55) {
      if (deltaY < 0 && activeIndex < CITIES_DATA.length - 1) {
        nextCity();
        setDragStartY(e.clientY);
        setDragOffset(0);
      } else if (deltaY > 0 && activeIndex > 0) {
        prevCity();
        setDragStartY(e.clientY);
        setDragOffset(0);
      }
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragOffset(0);
  };

  // Handle Confirm
  const handleConfirm = () => {
    if (isConfirming) return;
    setIsConfirming(true);
    setLoaderState("locking");

    if (onConfirm) {
      setTimeout(() => {
        onConfirm(currentCity.name, currentCity);
      }, 700);
    }
  };

  return (
    <div
      dir="rtl"
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="اختيار المدينة المستهدفة"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-full overflow-visible select-none transition-colors duration-500 focus:outline-hidden ${
        isFullScreen
          ? "min-h-screen py-8 px-4 flex flex-col justify-between"
          : "min-h-[580px] sm:min-h-[640px] py-8 px-4 flex flex-col justify-between"
      } ${className}`}
    >
      {/* TOP HEADER SECTION */}
      <div className="relative z-20 w-full max-w-2xl mx-auto flex flex-col items-center text-center">
        {/* Top-Center CompassLoader pointing to current city heading */}
        <div className="mb-3">
          <CompassLoader
            size={72}
            state={loaderState}
            targetAngle={currentCity.heading}
            showProgressLine={false}
          />
        </div>

        {/* Eyebrow & Title */}
        <AnimatePresence mode="wait">
          {!isConfirming ? (
            <motion.div
              key="dial-header"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-1.5"
            >
              <div className="text-xs font-medium text-[var(--dusty-blue)] tracking-wider">
                {eyebrow}
              </div>
              <h2 className="font-display font-black text-2xl sm:text-4xl text-[var(--navy)] tracking-tight">
                {title}
              </h2>
            </motion.div>
          ) : (
            <motion.div
              key="confirmed-header"
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1.05, y: -10 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-2 py-2"
            >
              <span className="text-xs font-medium text-[var(--dusty-blue)]">
                تم اعتماد النطاق الجغرافي
              </span>
              <h2 className="font-display font-black text-4xl sm:text-6xl text-[var(--navy)] tracking-tight">
                {currentCity.name}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN ARC / DRUM SELECTOR STAGE */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex items-center justify-between my-auto py-8 min-h-[380px] sm:min-h-[440px] overflow-visible">
        
        {/* SVG Dial Arc Line (Thin navy half-circle arc: 1px, 30% opacity) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible -z-0">
          <svg
            viewBox="0 0 500 500"
            className="w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] overflow-visible select-none"
          >
            {/* Half-circle arc line */}
            <path
              d="M 250 40 A 210 210 0 0 1 250 460"
              stroke="rgba(15, 26, 43, 0.30)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />

            {/* Small Navy Dot at the Center/Apex of the Arc */}
            <circle
              cx="460"
              cy="250"
              r="4"
              fill="var(--navy)"
            />
          </svg>
        </div>

        {/* SIDE VERTICAL SCRUBBER (Left side in RTL) */}
        <div className="relative z-20 flex flex-col items-center justify-center pl-2 sm:pl-4 select-none">
          <button
            type="button"
            onClick={prevCity}
            disabled={activeIndex === 0}
            aria-label="المدينة السابقة"
            className="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--mist)] text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:border-[var(--navy)] disabled:opacity-25 disabled:cursor-not-allowed transition-all bg-[var(--paper)] cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          {/* Calibrated Scrubber Rail */}
          <div className="relative w-4 h-36 sm:h-44 flex flex-col items-center justify-between my-3">
            <div className="absolute top-0 bottom-0 w-[1px] bg-[var(--mist)] left-1/2 -translate-x-1/2" />

            {/* Sliding Navy Indicator Bead */}
            <motion.div
              animate={{
                top: `${(activeIndex / (CITIES_DATA.length - 1)) * 100}%`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="absolute -left-1 w-6 h-6 -translate-y-1/2 flex items-center justify-center z-10 pointer-events-none"
            >
              <div className="w-3 h-3 rounded-full bg-[var(--navy)] shadow-xs" />
            </motion.div>

            {/* Clickable notches for each city */}
            {CITIES_DATA.map((city, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <button
                  key={city.code}
                  type="button"
                  onClick={() => goToIndex(idx)}
                  className="relative z-0 py-1 px-1 cursor-pointer focus:outline-hidden"
                  title={city.name}
                >
                  <div
                    className={`h-[1px] transition-all rounded-full ${
                      isCurrent
                        ? "w-4 bg-[var(--navy)]"
                        : "w-2 bg-[var(--mist)] hover:bg-[var(--dusty-blue)]"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={nextCity}
            disabled={activeIndex === CITIES_DATA.length - 1}
            aria-label="المدينة التالية"
            className="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--mist)] text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:border-[var(--navy)] disabled:opacity-25 disabled:cursor-not-allowed transition-all bg-[var(--paper)] cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* DRUM WHEEL CITIES STAGE (Center/Right in RTL) */}
        <div
          className={`relative z-20 flex-1 h-[340px] sm:h-[400px] flex items-center justify-center overflow-visible transition-opacity duration-400 ${
            isConfirming ? "opacity-15 pointer-events-none" : "opacity-100"
          }`}
        >
          {CITIES_DATA.map((city, index) => {
            const rawOffset = index - activeIndex - (isDragging ? dragOffset / 75 : 0);
            const absOffset = Math.abs(rawOffset);

            // Hide items further than 2.6 steps away
            if (absOffset > 2.6) return null;

            const isSelected = index === activeIndex;

            // Geometry along the drum arc (up to ±40°)
            const rotationDeg = Math.max(-40, Math.min(40, rawOffset * 20));
            const yShift = rawOffset * 95;
            const xShift = -Math.abs(rawOffset) * 28; // Curves along arc
            const scale = Math.max(0.55, 1 - absOffset * 0.22);
            const opacity = Math.max(0.18, 1 - absOffset * 0.42);
            const blurPx = Math.min(6, absOffset * 2.2);

            return (
              <motion.div
                key={city.name}
                initial={false}
                animate={{
                  x: xShift,
                  y: yShift,
                  rotateZ: rotationDeg,
                  scale,
                  opacity,
                  filter: `blur(${blurPx.toFixed(1)}px)`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 26,
                  mass: 0.8,
                }}
                onClick={() => {
                  if (!isSelected) {
                    goToIndex(index);
                  }
                }}
                style={{
                  transformOrigin: "center right",
                }}
                className={`absolute flex items-center gap-4 cursor-pointer select-none overflow-visible transition-colors ${
                  isSelected ? "z-30 cursor-default" : "z-10 hover:opacity-80"
                }`}
              >
                {/* Center Navy Dot on Arc beside the Selected City */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2.5 h-2.5 rounded-full bg-[var(--navy)] shrink-0 hidden sm:block"
                  />
                )}

                {/* THE CITY NAME (Clamp 56px to 112px, Huge Navy Type, Zero Clipping) */}
                <h3
                  className={`font-display font-black tracking-tight whitespace-nowrap overflow-visible leading-[1.3] transition-colors duration-200 ${
                    isSelected
                      ? "text-[clamp(56px,8.5vw,112px)] text-[var(--navy)]"
                      : "text-[clamp(34px,5.5vw,68px)] text-[var(--mist)] hover:text-[var(--dusty-blue)]"
                  }`}
                >
                  {city.name}
                </h3>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION: Confirmation Button & Specs */}
      <div className="relative z-30 w-full max-w-md mx-auto flex flex-col items-center gap-3 pt-2">
        {/* Selected City Subtitle Info */}
        <div className="text-center font-normal text-xs text-[var(--dusty-blue)] min-h-[20px]">
          {!isConfirming && (
            <span>
              {currentCity.region} • {currentCity.elevation}
            </span>
          )}
        </div>

        {/* Fixed Navy Pill Button "تأكيد" */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isConfirming}
          className="btn-primary w-full sm:w-auto min-w-[200px] px-9 py-4 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] active:scale-98 text-[var(--cream)] font-semibold text-base flex items-center justify-center gap-2.5 shadow-[0_20px_60px_rgba(15,26,43,0.06)] transition-all cursor-pointer disabled:bg-[var(--navy)] disabled:text-[var(--cream)]/70 disabled:cursor-not-allowed disabled:opacity-100"
        >
          {isConfirming ? (
            <span className="text-[var(--cream)] text-base font-semibold opacity-100">جاري الاعتماد…</span>
          ) : (
            <>
              <span className="text-[var(--cream)] text-base font-semibold opacity-100">تأكيد</span>
              <Check className="w-4 h-4 text-[var(--cream)] opacity-100 shrink-0" />
            </>
          )}
        </button>

        {/* Navigation Hint */}
        <p className="text-[11px] text-[var(--dusty-blue)] opacity-70">
          استخدم الأسهم ↑ ↓ أو اسحب لتغيير المدينة
        </p>
      </div>
    </div>
  );
}
