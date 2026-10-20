"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Info, ArrowLeft, Loader2, Compass, X } from "lucide-react";
import { startCase } from "@/actions/cases";
import type { AllowedCity } from "@/lib/constants/cities";
import { CityArcSelector } from "@/components/city-wheel";
import {
  MAX_PROPERTIES,
  MIN_PROPERTIES,
  EXPANSION_TYPES,
  ACTIVE_STRATEGIC_GOALS,
} from "@/config/product";

interface ConsultationCardProps {
  allowedCities: readonly AllowedCity[];
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full sm:w-auto px-8 py-4 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] active:scale-98 disabled:bg-[var(--navy)] disabled:text-[var(--cream)]/70 disabled:cursor-not-allowed text-[var(--cream)] font-semibold text-base flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-[0_20px_60px_rgba(15,26,43,0.06)] group opacity-100"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[var(--cream)] opacity-100 shrink-0" />
          <span className="text-[var(--cream)] text-base font-semibold opacity-100">
            جاري إعداد دراسة القرار…
          </span>
        </>
      ) : (
        <>
          <span className="text-[var(--cream)] text-base font-semibold tracking-tight opacity-100">
            بدء استشارة اختيار الشقة
          </span>
          <ArrowLeft className="w-4 h-4 text-[var(--cream)] opacity-100 transition-transform duration-200 group-hover:-translate-x-1.5 shrink-0" />
        </>
      )}
    </button>
  );
}

export function ConsultationCard({ allowedCities }: ConsultationCardProps) {
  const [selectedCity, setSelectedCity] = useState<string>(allowedCities[0] ?? "الرياض");
  const [selectedTypology, setSelectedTypology] = useState<string>("apartment");
  const [selectedIntent, setSelectedIntent] = useState<string>(ACTIVE_STRATEGIC_GOALS[0]?.id ?? "family");
  const [showArcModal, setShowArcModal] = useState<boolean>(false);

  // Step 3 City Selector Wheel Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const isSelfTriggeredClickRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Passive rAF updater: computes --d, --d-abs for each city button and --spin for compass
  const updatePhysics = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    if (containerRect.height === 0) return;
    const containerCenterY = containerRect.top + containerRect.height / 2;
    const halfHeight = containerRect.height / 2;

    if (compassRef.current) {
      const spin = container.scrollTop * 0.6;
      compassRef.current.style.setProperty("--spin", spin.toFixed(2));
    }

    const buttons = container.querySelectorAll<HTMLButtonElement>(".city-list-btn");
    buttons.forEach((btn) => {
      const btnRect = btn.getBoundingClientRect();
      const btnCenterY = btnRect.top + btnRect.height / 2;
      const diff = btnCenterY - containerCenterY;
      const d = Math.max(-1, Math.min(1, diff / halfHeight));
      const dAbs = Math.abs(d);

      btn.style.setProperty("--d", d.toFixed(3));
      btn.style.setProperty("--d-abs", dAbs.toFixed(3));
    });
  }, []);

  const handleScrollSettled = useCallback(() => {
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    if (containerRect.height === 0) return;
    const containerCenterY = containerRect.top + containerRect.height / 2;

    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".city-list-btn")
    );
    if (buttons.length === 0) return;

    let closestBtn: HTMLButtonElement | null = null;
    let minDistance = Infinity;

    for (const btn of buttons) {
      const rect = btn.getBoundingClientRect();
      const btnCenterY = rect.top + rect.height / 2;
      const dist = Math.abs(btnCenterY - containerCenterY);
      if (dist < minDistance) {
        minDistance = dist;
        closestBtn = btn;
      }
    }

    if (closestBtn) {
      const isAlreadySelected =
        closestBtn.getAttribute("aria-pressed") === "true" ||
        closestBtn.classList.contains("is-selected");

      if (!isAlreadySelected) {
        isSelfTriggeredClickRef.current = true;
        try {
          closestBtn.click();
        } finally {
          isSelfTriggeredClickRef.current = false;
        }
      }
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".city-list-btn")
    );
    const currentIndex = buttons.findIndex(
      (btn) =>
        btn.getAttribute("aria-pressed") === "true" ||
        btn.classList.contains("is-selected")
    );

    let nextIndex = currentIndex;
    if (e.key === "ArrowUp") {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (e.key === "ArrowDown") {
      nextIndex = Math.min(buttons.length - 1, currentIndex + 1);
    }

    if (nextIndex !== currentIndex && buttons[nextIndex]) {
      e.preventDefault();
      buttons[nextIndex].focus();
      buttons[nextIndex].click();
      isProgrammaticScrollRef.current = true;
      buttons[nextIndex].scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const btn = target.closest<HTMLButtonElement>(".city-list-btn");
    if (!btn) return;

    if (isSelfTriggeredClickRef.current) return;

    isProgrammaticScrollRef.current = true;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    btn.scrollIntoView({
      block: "center",
      behavior: prefersReduced ? "auto" : "smooth",
    });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          updatePhysics();
          rafIdRef.current = null;
        });
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        handleScrollSettled();
      }, 120);
    };

    const onScrollEnd = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      handleScrollSettled();
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("resize", updatePhysics, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", updatePhysics);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [updatePhysics, handleScrollSettled]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const selectedBtn = container.querySelector<HTMLButtonElement>(
      ".city-list-btn.is-selected"
    );
    if (selectedBtn) {
      isProgrammaticScrollRef.current = true;
      selectedBtn.scrollIntoView({ block: "center", behavior: "auto" });
    }
    updatePhysics();

    const timer = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      updatePhysics();
    }, 60);

    return () => clearTimeout(timer);
  }, [updatePhysics]);

  return (
    <div className="rounded-[28px] p-8 sm:p-10 space-y-8 sm:space-y-10 relative overflow-hidden bg-[var(--paper)] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] text-[var(--navy)]">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--mist)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
            <h2 className="text-xl font-display font-bold text-[var(--navy)]">بدء دراسة قرار شراء شقة</h2>
          </div>
          <p className="text-xs text-[var(--dusty-blue)] mt-1">
            حدد المدينة والهدف لمطابقة خيارات الشقق مع ميزانيتك واحتياجاتك
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--navy)]" />
          المرحلة الأولى مجانية
        </span>
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
              المدينة المستهدفة للشراء
            </label>
            <button
              type="button"
              onClick={() => setShowArcModal(true)}
              className="inline-flex items-center gap-1.5 text-[11px] text-[var(--navy)] hover:text-[var(--midnight)] font-medium px-3 py-1 rounded-full bg-[var(--cream)] border border-[var(--mist)] hover:border-[var(--navy)] transition-all cursor-pointer shadow-xs"
            >
              <Compass className="w-3.5 h-3.5 text-[var(--navy)]" />
              <span>عجلة القوس الدوارة</span>
            </button>
          </div>

          <div
            className="city-list rounded-2xl bg-[var(--cream)] border border-[var(--mist)] p-2"
            id="cityOptions"
            ref={scrollContainerRef}
            onClick={handleContainerClick}
            onKeyDown={handleKeyDown}
          >
            {allowedCities.map((city) => {
              const isSelected = selectedCity === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`city-list-btn ${isSelected ? "is-selected font-bold" : "is-unselected font-medium text-[var(--dusty-blue)]"}`}
                  aria-pressed={isSelected}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        {/* Parameter 2: Property Typology */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[var(--navy)] uppercase tracking-wider">
            نوع العقار المستهدف
          </label>
          {EXPANSION_TYPES ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="typologyOptions">
              {/* Apartment */}
              <button
                type="button"
                onClick={() => setSelectedTypology("apartment")}
                className={`p-5 rounded-[20px] border flex items-center gap-3.5 transition-all duration-200 text-right cursor-pointer ${
                  selectedTypology === "apartment"
                    ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] scale-[1.02] shadow-sm"
                    : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:-translate-y-1 hover:border-[var(--navy)]"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selectedTypology === "apartment"
                      ? "bg-[var(--midnight)] text-[var(--cream)]"
                      : "bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]"
                  }`}
                >
                  <svg className="w-5 h-5 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 7h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1m-3 5v-3a1 1 0 011-1h2a1 1 0 011 1v3"
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-xs font-bold">شقة تمليك</div>
                  <div className={`text-[11px] font-normal mt-0.5 ${selectedTypology === "apartment" ? "text-[var(--cream)]/80" : "text-[var(--dusty-blue)]"}`}>
                    مبنى مستقل أو مجمع مغلق
                  </div>
                </div>
              </button>

              {/* Villa */}
              <button
                type="button"
                onClick={() => setSelectedTypology("villa")}
                className={`p-5 rounded-[20px] border flex items-center gap-3.5 transition-all duration-200 text-right cursor-pointer ${
                  selectedTypology === "villa"
                    ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] scale-[1.02] shadow-sm"
                    : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:-translate-y-1 hover:border-[var(--navy)]"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selectedTypology === "villa"
                      ? "bg-[var(--midnight)] text-[var(--cream)]"
                      : "bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]"
                  }`}
                >
                  <svg className="w-5 h-5 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20v-9.5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 21v-6a1 1 0 011-1h4a1 1 0 011 1v6"
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-xs font-bold">فيلا مستقلة / دوبلكس</div>
                  <div className={`text-[11px] font-normal mt-0.5 ${selectedTypology === "villa" ? "text-[var(--cream)]/80" : "text-[var(--dusty-blue)]"}`}>
                    وحدات سكنية منفصلة
                  </div>
                </div>
              </button>

              {/* Townhouse */}
              <button
                type="button"
                onClick={() => setSelectedTypology("townhouse")}
                className={`p-5 rounded-[20px] border flex items-center gap-3.5 transition-all duration-200 text-right cursor-pointer ${
                  selectedTypology === "townhouse"
                    ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] scale-[1.02] shadow-sm"
                    : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:-translate-y-1 hover:border-[var(--navy)]"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selectedTypology === "townhouse"
                      ? "bg-[var(--midnight)] text-[var(--cream)]"
                      : "bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]"
                  }`}
                >
                  <svg className="w-5 h-5 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2 21h20M3 21V9.5L8.5 5 14 9.5V21M14 9.5L18.5 6 21 8.5V21M6.5 13h1.5m-1.5 3.5h1.5M10 21v-3.5a1 1 0 00-1-1H7.5a1 1 0 00-1 1V21m10.5-7.5h1.5M17 21v-3.5"
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-xs font-bold">تاون هاوس</div>
                  <div className={`text-[11px] font-normal mt-0.5 ${selectedTypology === "townhouse" ? "text-[var(--cream)]/80" : "text-[var(--dusty-blue)]"}`}>
                    نمط عصري مشترك
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div
              id="typologyOptions"
              className="p-5 rounded-[20px] border border-[var(--navy)] bg-[var(--navy)] text-[var(--cream)] flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--midnight)] text-[var(--cream)]">
                  <svg className="w-5 h-5 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 7h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1m-3 5v-3a1 1 0 011-1h2a1 1 0 011 1v3"
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-xs font-bold">شقة تمليك سكنية</div>
                  <div className="text-[11px] font-normal mt-0.5 text-[var(--cream)]/80">
                    مبنى مستقل أو مجمع مغلق
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-[var(--midnight)] text-[var(--cream)] border border-[var(--mist)]/20">
                محدد تلقائياً
              </span>
            </div>
          )}
        </div>

        {/* Parameter 3: Strategic Purchase Intent (Selection Cards) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[var(--navy)] uppercase tracking-wider">
            الهدف الاستراتيجي من الشراء
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="intentOptions">
            {ACTIVE_STRATEGIC_GOALS.map((goal) => {
              const isSelected = selectedIntent === goal.id;
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setSelectedIntent(goal.id)}
                  className={`p-4 rounded-[20px] border transition-all duration-200 text-center cursor-pointer ${
                    isSelected
                      ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] scale-[1.02] shadow-sm font-bold"
                      : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:-translate-y-1 hover:border-[var(--navy)]"
                  }`}
                >
                  <span className="block text-xs font-bold">{goal.label}</span>
                  <span
                    className={`block text-[11px] mt-0.5 font-normal ${
                      isSelected ? "text-[var(--cream)]/80" : "text-[var(--dusty-blue)]"
                    }`}
                  >
                    {goal.sublabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Session Workspace Title (Rounded Cream Well) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[var(--navy)]" htmlFor="session_title">
            عنوان ملف الاستشارة (اختياري)
          </label>
          <input
            name="session_title"
            id="session_title"
            className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-xs text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 focus:border-[var(--navy)] transition-all outline-hidden"
            placeholder="مثال: مقارنة شقق حي النرجس والملقا 2025"
            type="text"
          />
        </div>

        {/* Submit CTA Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--mist)]">
          <div className="flex items-center gap-2 text-xs text-[var(--dusty-blue)]">
            <Info className="w-4 h-4 text-[var(--dusty-blue)] shrink-0" />
            <span>يمكنك مقارنة من {MIN_PROPERTIES} إلى {MAX_PROPERTIES} شقق سكنية لكل حالة استشارة (10 ر.س فقط)</span>
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
