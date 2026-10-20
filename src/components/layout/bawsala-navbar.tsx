"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BawsalaCompass } from "@/components/brand/bawsala-compass";

export interface BawsalaNavbarProps {
  latestCaseId?: string | null;
  sessionCount?: number;
  activeId?: string;
  className?: string;
}

export function BawsalaNavbar({
  sessionCount = 0,
  className = "",
}: BawsalaNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      dir="rtl"
      aria-label="التنقل الرئيسي"
      className={`fixed inset-x-0 z-40 flex items-center justify-center pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isScrolled ? "top-4 sm:top-5 px-4" : "top-0 px-0"
      } ${className}`}
    >
      <div
        className={`pointer-events-auto w-full select-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled
            ? "max-w-4xl rounded-full bg-[var(--paper)]/80 backdrop-blur-md border border-[var(--mist)] py-2 sm:py-2.5 px-5 sm:px-7 shadow-[0_16px_48px_rgba(15,26,43,0.08)]"
            : "max-w-full rounded-none bg-[var(--navy)] border-b border-white/10 py-3.5 sm:py-4 px-6 sm:px-10 shadow-xs"
        }`}
      >
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          {/* RIGHT: Minimalist Logo Lockup */}
          <Link
            href="/"
            aria-label="الصفحة الرئيسية لبوصلة العقار"
            className="flex items-center gap-2.5 group shrink-0 min-h-[40px] focus-visible:ring-2 focus-visible:ring-[var(--navy)] rounded-full px-1 no-underline"
          >
            <div
              className={`flex items-center justify-center transition-colors duration-500 ${
                isScrolled ? "text-[var(--navy)]" : "text-white"
              }`}
            >
              <BawsalaCompass size={24} animateHover />
            </div>
            <span
              className={`font-display font-bold text-base sm:text-lg tracking-tight whitespace-nowrap transition-colors duration-500 ${
                isScrolled ? "text-[var(--navy)]" : "text-white"
              }`}
            >
              بوصلة العقار
            </span>
          </Link>

          {/* LEFT: Start CTA Button & Optional Sessions Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {sessionCount > 0 && (
              <Link
                href="#active-sessions"
                aria-label={`جلسات التقييم: ${sessionCount}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-500 group min-h-[36px] no-underline ${
                  isScrolled
                    ? "bg-[var(--cream)] border border-[var(--mist)] text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:border-[var(--navy)] shadow-xs"
                    : "bg-white/10 border border-white/15 text-white/90 hover:bg-white/15 hover:text-white"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                    isScrolled ? "bg-[var(--navy)]" : "bg-white"
                  }`}
                />
                <span className="text-xs font-medium whitespace-nowrap hidden sm:inline">
                  حالاتي
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold transition-colors duration-500 ${
                    isScrolled
                      ? "bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]"
                      : "bg-white/15 text-white border border-white/20"
                  }`}
                >
                  {sessionCount}
                </span>
              </Link>
            )}

            <a
              href="#consultation-card"
              className={`group inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] min-h-[38px] no-underline ${
                isScrolled
                  ? "bg-[var(--navy)] text-white shadow-sm hover:bg-[var(--midnight)]"
                  : "bg-white text-[var(--navy)] shadow-sm hover:bg-[var(--cream)]"
              }`}
            >
              <span className={isScrolled ? "text-white" : "text-[var(--navy)]"}>ابدأ الآن</span>
              <ArrowLeft
                className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-0.5 ${
                  isScrolled ? "text-white" : "text-[var(--navy)]"
                }`}
              />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
