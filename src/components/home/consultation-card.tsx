"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Info, ArrowLeft, Loader2, Compass, X, ChevronUp, ChevronDown } from "lucide-react";
import { startCase } from "@/actions/cases";
import type { AllowedCity } from "@/lib/constants/cities";
import { CityArcSelector, CITIES_DATA } from "@/components/city-wheel";
import { CompassLoader } from "@/components/brand/compass-loader";

// Gentle synthetic audio tick feedback for desktop arc wheel
function playDesktopWheelTick() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(680, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch {
    // Ignore if AudioContext is blocked
  }
}

interface ConsultationCardProps {
  allowedCities: readonly AllowedCity[];
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full sm:w-auto px-8 py-4 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] active:scale-98 disabled:bg-[var(--navy)] disabled:text-white/70 disabled:cursor-not-allowed text-white font-semibold text-base flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-[0_20px_60px_rgba(15,26,43,0.06)] group opacity-100"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white opacity-100 shrink-0" />
          <span className="text-white text-base font-semibold opacity-100">
            جارٍ التجهيز…
          </span>
        </>
      ) : (
        <>
          <span className="text-white text-base font-semibold tracking-tight opacity-100">
            ابدأ الاستشارة
          </span>
          <ArrowLeft className="w-4 h-4 text-white opacity-100 transition-transform duration-200 group-hover:-translate-x-1.5 shrink-0" />
        </>
      )}
    </button>
  );
}

export function ConsultationCard({ allowedCities }: ConsultationCardProps) {
  const [selectedCity, setSelectedCity] = useState<string>(allowedCities[0] ?? "الرياض");
  // Strictly locked to residential apartment buying per MVP v1.9 scope
  const selectedTypology = "apt";
  const [selectedIntent, setSelectedIntent] = useState<"family" | "upgrade">("family");
  const [showArcModal, setShowArcModal] = useState<boolean>(false);

  // Desktop Inline Arc Wheel & Compass State
  const desktopDrumRef = useRef<HTMLDivElement>(null);
  const lastWheelTimeRef = useRef<number>(0);
  const [isDraggingArc, setIsDraggingArc] = useState<boolean>(false);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState<number>(0);

  const activeCityIndex = Math.max(
    0,
    CITIES_DATA.findIndex((c) => c.name === selectedCity)
  );
  const activeCityData = CITIES_DATA[activeCityIndex] || CITIES_DATA[0];

  const selectCityByIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(CITIES_DATA.length - 1, index));
      const targetCity = CITIES_DATA[clamped];
      if (targetCity && targetCity.name !== selectedCity) {
        setSelectedCity(targetCity.name);
        playDesktopWheelTick();
      }
    },
    [selectedCity]
  );

  const handlePrevCity = useCallback(() => {
    if (activeCityIndex > 0) {
      selectCityByIndex(activeCityIndex - 1);
    }
  }, [activeCityIndex, selectCityByIndex]);

  const handleNextCity = useCallback(() => {
    if (activeCityIndex < CITIES_DATA.length - 1) {
      selectCityByIndex(activeCityIndex + 1);
    }
  }, [activeCityIndex, selectCityByIndex]);

  // Native non-passive wheel listener on desktop drum stage so scrolling over the drum spins cities cleanly
  useEffect(() => {
    const drumEl = desktopDrumRef.current;
    if (!drumEl) return;

    const onWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (Math.abs(e.deltaY) < 12) return;

      const canScrollDown = e.deltaY > 0 && activeCityIndex < CITIES_DATA.length - 1;
      const canScrollUp = e.deltaY < 0 && activeCityIndex > 0;

      if (canScrollDown || canScrollUp) {
        e.preventDefault();
        if (now - lastWheelTimeRef.current < 140) return;
        lastWheelTimeRef.current = now;
        if (e.deltaY > 0) {
          handleNextCity();
        } else {
          handlePrevCity();
        }
      }
    };

    drumEl.addEventListener("wheel", onWheel, { passive: false });
    return () => drumEl.removeEventListener("wheel", onWheel);
  }, [activeCityIndex, handleNextCity, handlePrevCity]);

  const handleArcPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDraggingArc(true);
    setDragStartY(e.clientY);
    setDragOffset(0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleArcPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingArc) return;
    const deltaY = e.clientY - dragStartY;
    setDragOffset(deltaY);

    if (Math.abs(deltaY) > 45) {
      if (deltaY < 0 && activeCityIndex < CITIES_DATA.length - 1) {
        handleNextCity();
        setDragStartY(e.clientY);
        setDragOffset(0);
      } else if (deltaY > 0 && activeCityIndex > 0) {
        handlePrevCity();
        setDragStartY(e.clientY);
        setDragOffset(0);
      }
    }
  };

  const handleArcPointerUp = () => {
    setIsDraggingArc(false);
    setDragOffset(0);
  };

  const handleArcKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      handlePrevCity();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleNextCity();
    }
  };

  return (
    <div className="rounded-[28px] p-6 sm:p-10 space-y-7 sm:space-y-10 relative overflow-hidden bg-[var(--paper)] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] text-[var(--navy)]">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-[var(--mist)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
            <h2 className="text-xl font-display font-bold text-[var(--navy)]">
              ابدأ استشارة جديدة
            </h2>
          </div>
        </div>

        <div className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-xs font-bold text-[var(--navy)] shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#1B6B45]" />
          <span>الفحص مجاني · الاستشارة 10 ر.س</span>
        </div>
      </div>

      <form action={startCase} className="space-y-8">
        {/* Hidden inputs for selected states */}
        <input type="hidden" name="city" value={selectedCity} />
        <input type="hidden" name="typology" value={selectedTypology} />
        <input type="hidden" name="purchase_intent" value={selectedIntent} />

        {/* Parameter 1: City Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <label className="text-xs font-bold text-[var(--navy)] uppercase tracking-wider" htmlFor="cityOptions">
              المدينة
            </label>

            {/* Status pill (Mobile & Desktop) */}
            <div className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-[var(--dusty-blue)] px-3 py-1 rounded-full bg-[var(--cream)] border border-[var(--mist)]/80">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)]" />
              <span className="font-bold text-[var(--navy)]">{activeCityData.name}</span>
            </div>
          </div>

          {/* MOBILE VIEW (< md): Live Interactive Compass + Clean 3-Column City Grid */}
          <div
            className="md:hidden rounded-[22px] bg-[var(--cream)] border border-[var(--mist)] p-3.5 space-y-3"
            id="cityOptions"
          >
            {/* Top: Live Compass Dial + Selected City + Prev/Next Steppers */}
            <div className="flex items-center justify-between gap-3 bg-[var(--paper)] px-3.5 py-2.5 rounded-2xl border border-[var(--mist)]/80 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1 rounded-xl bg-[var(--cream)] border border-[var(--mist)]/70 shrink-0">
                  <CompassLoader
                    size={46}
                    state="pointing"
                    targetAngle={activeCityData.heading}
                    messages={[]}
                    showProgressLine={false}
                    className="[&>div]:mb-0"
                  />
                </div>

                <div className="text-right min-w-0">
                  <div className="text-[11px] font-medium text-[var(--dusty-blue)]">
                    البوصلة موجهة نحو
                  </div>
                  <div className="text-lg font-display font-bold text-[var(--navy)] truncate">
                    {activeCityData.name}
                  </div>
                </div>
              </div>

              {/* Tactile Up/Down City Steppers */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevCity}
                  disabled={activeCityIndex === 0}
                  aria-label="المدينة السابقة"
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--mist)] text-[var(--navy)] bg-[var(--cream)] active:bg-[var(--navy)] active:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextCity}
                  disabled={activeCityIndex === CITIES_DATA.length - 1}
                  aria-label="المدينة التالية"
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--mist)] text-[var(--navy)] bg-[var(--cream)] active:bg-[var(--navy)] active:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom: Clean Spaced 3-Column City Grid (1-Tap Selection) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-semibold text-[var(--dusty-blue)]">
                  اختر مدينتك
                </span>
                <button
                  type="button"
                  onClick={() => setShowArcModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--navy)] hover:underline"
                >
                  <Compass className="w-3 h-3" />
                  <span>العجلة</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 max-h-[168px] overflow-y-auto p-0.5">
                {allowedCities.map((city) => {
                  const isSelected = selectedCity === city;
                  const cityIdx = CITIES_DATA.findIndex((c) => c.name === city);
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        if (cityIdx >= 0) {
                          selectCityByIndex(cityIdx);
                        } else {
                          setSelectedCity(city);
                        }
                      }}
                      aria-pressed={isSelected}
                      className={`min-h-[44px] py-2 px-2 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-[var(--navy)] text-white font-bold shadow-xs"
                          : "bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] font-medium active:scale-95"
                      }`}
                    >
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                      )}
                      <span className={`truncate ${isSelected ? "text-white" : "text-[var(--navy)]"}`}>
                        {city}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW (md+): Simplified Signature Scroll Arc Wheel & Live Compass */}
          <div
            ref={desktopDrumRef}
            tabIndex={0}
            role="listbox"
            aria-label="عجلة اختيار المدينة والبوصلة الجغرافية"
            onKeyDown={handleArcKeyDown}
            onPointerDown={handleArcPointerDown}
            onPointerMove={handleArcPointerMove}
            onPointerUp={handleArcPointerUp}
            onPointerCancel={handleArcPointerUp}
            className="hidden md:grid md:grid-cols-12 items-center gap-6 rounded-[24px] bg-[var(--cream)] border border-[var(--mist)] p-5 lg:p-6 relative overflow-hidden select-none focus:outline-hidden"
          >
            {/* RIGHT / CENTER STAGE (6 Cols): Simplified Curved Arc Wheel */}
            <div className="col-span-6 relative h-[230px] flex items-center justify-between overflow-hidden">
              {/* Clear Tactile Up/Down Stepper Controls (Right Edge in RTL) */}
              <div className="relative z-20 flex flex-col items-center justify-between h-[190px] py-1 pr-1 select-none">
                <button
                  type="button"
                  onClick={handlePrevCity}
                  disabled={activeCityIndex === 0}
                  aria-label="المدينة السابقة"
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-[var(--mist)] text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white hover:border-[var(--navy)] disabled:opacity-25 disabled:pointer-events-none transition-all bg-[var(--paper)] cursor-pointer shadow-xs"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>

                {/* Smooth Vertical Progress Track for 24 Cities */}
                <div className="relative w-1.5 flex-1 my-2.5 rounded-full bg-[var(--mist)]/50 overflow-hidden">
                  <motion.div
                    animate={{
                      top: `${(activeCityIndex / Math.max(1, CITIES_DATA.length - 1)) * 78}%`,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className="absolute inset-x-0 h-[22%] rounded-full bg-[var(--navy)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextCity}
                  disabled={activeCityIndex === CITIES_DATA.length - 1}
                  aria-label="المدينة التالية"
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-[var(--mist)] text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white hover:border-[var(--navy)] disabled:opacity-25 disabled:pointer-events-none transition-all bg-[var(--paper)] cursor-pointer shadow-xs"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Clean Calibrated Half-Circle Arc Line */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-0">
                <svg
                  viewBox="0 0 320 240"
                  className="w-full h-full overflow-visible select-none"
                >
                  <path
                    d="M 165 14 A 130 130 0 0 1 165 226"
                    stroke="rgba(15, 26, 43, 0.16)"
                    strokeWidth="1.2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 156 26 A 118 118 0 0 1 156 214"
                    stroke="rgba(189, 196, 212, 0.45)"
                    strokeWidth="0.8"
                    strokeDasharray="3 4"
                    fill="none"
                  />
                </svg>
              </div>

              {/* Rotating Arc Drum Cities Stage (Crisp, Zero Blur, Easy Click) */}
              <div className="relative z-10 flex-1 h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing">
                <div className="relative w-full flex-1 flex items-center justify-center">
                  {CITIES_DATA.map((city, index) => {
                    const rawOffset =
                      index - activeCityIndex - (isDraggingArc ? dragOffset / 55 : 0);
                    const absOffset = Math.abs(rawOffset);

                    if (absOffset > 2.1) return null;

                    const isSelected = index === activeCityIndex;
                    const rotationDeg = Math.max(-14, Math.min(14, rawOffset * 6));
                    const yShift = rawOffset * 52;
                    const xShift = -Math.abs(rawOffset) * 14;
                    const scale = isSelected ? 1 : Math.max(0.78, 1 - absOffset * 0.12);
                    const opacity = isSelected ? 1 : Math.max(0.45, 1 - absOffset * 0.3);

                    return (
                      <motion.button
                        key={city.name}
                        type="button"
                        initial={false}
                        animate={{
                          x: xShift,
                          y: yShift,
                          rotateZ: rotationDeg,
                          scale,
                          opacity,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 26,
                          mass: 0.8,
                        }}
                        onClick={() => selectCityByIndex(index)}
                        style={{
                          transformOrigin: "center right",
                        }}
                        className={`absolute flex items-center gap-2.5 px-4 py-1.5 rounded-full select-none whitespace-nowrap transition-colors ${
                          isSelected
                            ? "z-30 cursor-default"
                            : "z-10 cursor-pointer hover:opacity-100"
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2.5 h-2.5 rounded-full bg-[var(--navy)] shrink-0"
                          />
                        )}
                        <span
                          className={`font-body tracking-tight leading-[1.2] transition-colors duration-200 ${
                            isSelected
                              ? "font-extrabold text-3xl lg:text-[36px] text-[var(--navy)]"
                              : "font-bold text-lg lg:text-xl text-[var(--dusty-blue)] hover:text-[var(--navy)]"
                          }`}
                        >
                          {city.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Clear User Hint at Bottom of Wheel */}
                <div className="text-[11px] text-[var(--dusty-blue)] font-medium pb-0.5 pointer-events-none">
                  مرّر أو اضغط للاختيار
                </div>
              </div>
            </div>

            {/* LEFT STAGE (6 Cols): Clean Live Compass + All Saudi Cities Quick-Select Grid */}
            <div className="col-span-6 border-r border-[var(--mist)]/70 pr-6 flex flex-col justify-between h-[230px]">
              {/* Top: Live Compass Dial + City Name Only */}
              <div className="flex items-center gap-3.5 bg-[var(--paper)]/90 px-3.5 py-2.5 rounded-2xl border border-[var(--mist)]/80 shadow-2xs shrink-0">
                <div className="p-1 rounded-xl bg-[var(--cream)] border border-[var(--mist)]/70 shrink-0">
                  <CompassLoader
                    size={46}
                    state="pointing"
                    targetAngle={activeCityData.heading}
                    messages={[]}
                    showProgressLine={false}
                    className="[&>div]:mb-0"
                  />
                </div>

                <div className="text-right min-w-0 flex-1">
                  <div className="text-[11px] font-medium text-[var(--dusty-blue)]">
                    البوصلة موجهة نحو
                  </div>
                  <div className="text-lg font-body font-extrabold text-[var(--navy)] truncate">
                    {activeCityData.name}
                  </div>
                </div>
              </div>

              {/* Bottom: Scrollable 3-Column Grid for All 24 Saudi Cities */}
              <div className="flex-1 flex flex-col min-h-0 pt-2.5">
                <div className="text-[11px] font-semibold text-[var(--dusty-blue)] mb-1.5 shrink-0">
                  أو اختر مباشرة:
                </div>
                <div className="grid grid-cols-3 gap-1.5 overflow-y-auto pl-1 pr-0.5 py-0.5 flex-1">
                  {CITIES_DATA.map((city, idx) => {
                    const isCurrent = city.name === selectedCity;
                    return (
                      <button
                        key={city.code}
                        type="button"
                        onClick={() => selectCityByIndex(idx)}
                        className={`py-2 px-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isCurrent
                            ? "bg-[var(--navy)] text-white font-bold shadow-xs"
                            : "bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] hover:border-[var(--navy)] font-medium"
                        }`}
                      >
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                        )}
                        <span className={`truncate ${isCurrent ? "text-white" : "text-[var(--navy)]"}`}>
                          {city.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parameter 2: Strategic Purchase Intent — 2 Active Residential Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[var(--navy)] uppercase tracking-wider">
              الغرض من الشراء
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" id="intentOptions">
            <button
              type="button"
              onClick={() => setSelectedIntent("family")}
              aria-pressed={selectedIntent === "family"}
              className={`p-4 sm:p-5 rounded-[20px] border transition-all duration-200 text-right cursor-pointer flex items-center justify-between gap-3 ${
                selectedIntent === "family"
                  ? "bg-[var(--navy)] text-white border-[var(--navy)] shadow-sm"
                  : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)]"
              }`}
            >
              <div className="min-w-0">
                <span className={`block text-sm font-bold ${selectedIntent === "family" ? "text-white" : "text-[var(--navy)]"}`}>
                  سكن عائلي أول
                </span>
                <span className={`block text-sm mt-1 font-normal ${selectedIntent === "family" ? "text-white/80" : "text-[var(--dusty-blue)]"}`}>
                  يناسب احتياج أسرتك
                </span>
              </div>
              <span
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  selectedIntent === "family"
                    ? "border-white bg-white/15"
                    : "border-[var(--mist)] bg-[var(--paper)]"
                }`}
              >
                {selectedIntent === "family" && (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIntent("upgrade")}
              aria-pressed={selectedIntent === "upgrade"}
              className={`p-4 sm:p-5 rounded-[20px] border transition-all duration-200 text-right cursor-pointer flex items-center justify-between gap-3 ${
                selectedIntent === "upgrade"
                  ? "bg-[var(--navy)] text-white border-[var(--navy)] shadow-sm"
                  : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)]"
              }`}
            >
              <div className="min-w-0">
                <span className={`block text-sm font-bold ${selectedIntent === "upgrade" ? "text-white" : "text-[var(--navy)]"}`}>
                  ترقية مسكن عائلي
                </span>
                <span className={`block text-sm mt-1 font-normal ${selectedIntent === "upgrade" ? "text-white/80" : "text-[var(--dusty-blue)]"}`}>
                  موقع ومساحة أفضل
                </span>
              </div>
              <span
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  selectedIntent === "upgrade"
                    ? "border-white bg-white/15"
                    : "border-[var(--mist)] bg-[var(--paper)]"
                }`}
              >
                {selectedIntent === "upgrade" && (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Session Workspace Title (Rounded Cream Well) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[var(--navy)]" htmlFor="session_title">
            اسم الحالة (اختياري)
          </label>
          <input
            name="session_title"
            id="session_title"
            className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-base sm:text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 focus:border-[var(--navy)] transition-all outline-hidden"
            placeholder="مثال: شقق مرشحة في حي النرجس أو الملقا"
            type="text"
          />
        </div>

        {/* Submit CTA Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--mist)]">
          <div className="flex items-center gap-2 text-sm text-[var(--dusty-blue)]">
            <Info className="w-4 h-4 text-[var(--dusty-blue)] shrink-0" />
            <span>
              من 1 إلى 5 شقق في الحالة
            </span>
          </div>
          <SubmitButton />
        </div>
      </form>

      {/* Immersive City Arc Wheel Modal on Cream Background */}
      {showArcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,26,43,0.35)] p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[var(--cream)] border border-[var(--mist)] rounded-[28px] shadow-[0_20px_60px_rgba(15,26,43,0.06)] overflow-hidden my-auto p-4 sm:p-6">
            <button
              type="button"
              onClick={() => setShowArcModal(false)}
              className="absolute top-4 left-4 z-40 w-9 h-9 rounded-full bg-[var(--paper)] border border-[var(--mist)] text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:border-[var(--navy)] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
            <CityArcSelector
              initialCity={selectedCity as AllowedCity}
              onConfirm={(city) => {
                setSelectedCity(city);
                setTimeout(() => setShowArcModal(false), 500);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
