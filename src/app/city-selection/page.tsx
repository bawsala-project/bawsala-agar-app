"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CityArcSelector, type CityData } from "@/components/city-wheel";
import { BawsalaLogo } from "@/components/brand/bawsala-logo";
import { type AllowedCity } from "@/lib/constants/cities";
import { ArrowRight, RotateCcw, CheckCircle2, ChevronLeft } from "lucide-react";

export default function CitySelectionPage() {
  const [selectedCity, setSelectedCity] = useState<AllowedCity>("الرياض");
  const [confirmedData, setConfirmedData] = useState<CityData | null>(null);

  const handleSelect = (city: AllowedCity) => {
    setSelectedCity(city);
  };

  const handleConfirm = (_city: AllowedCity, data: CityData) => {
    setConfirmedData(data);
  };

  return (
    <main className="min-h-screen bg-[var(--cream)] text-[var(--navy)] flex flex-col justify-between relative overflow-hidden" dir="rtl">
      {/* Top Floating Bar for Navigation */}
      <header className="relative z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--dusty-blue)] hover:text-[var(--navy)] transition-colors px-3.5 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--mist)] shadow-xs"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>الرئيسية</span>
        </Link>

        <Link href="/" className="opacity-90 hover:opacity-100 transition-opacity">
          <BawsalaLogo compassSize={28} wordmarkSize="sm" />
        </Link>

        <Link
          href="/styleguide"
          className="hidden sm:inline-flex text-xs font-medium text-[var(--dusty-blue)] hover:text-[var(--navy)] transition-colors px-3 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--mist)]"
        >
          دليل الهوية
        </Link>
      </header>

      {/* Main Wheel Viewport */}
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <CityArcSelector
          initialCity={selectedCity}
          onSelectCity={handleSelect}
          onConfirm={handleConfirm}
          isFullScreen={true}
        />
      </div>

      {/* Post-confirmation Action Drawer */}
      {confirmedData && (
        <div className="relative z-50 w-full max-w-xl mx-auto px-4 pb-6">
          <div className="p-4 rounded-[20px] bg-[var(--paper)] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[var(--status-ok,#34D399)] shrink-0" />
              <div>
                <div className="text-sm font-bold text-[var(--navy)]">
                  تم اختيار {confirmedData.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setConfirmedData(null)}
                className="min-h-[44px] px-3 py-2 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-sm text-[var(--dusty-blue)] hover:text-[var(--navy)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تغيير</span>
              </button>

              <Link
                href="/#consultation"
                className="min-h-[44px] flex-1 sm:flex-initial px-5 py-2 rounded-full bg-[var(--navy)] text-[var(--cream)] font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-[var(--midnight)] transition-all shadow-xs cursor-pointer"
              >
                <span>متابعة</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
