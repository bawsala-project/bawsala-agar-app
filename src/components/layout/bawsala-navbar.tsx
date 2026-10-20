"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Building2, UserCheck, Scale } from "lucide-react";
import { BawsalaCompass } from "@/components/brand/bawsala-compass";

export interface NavLinkItem {
  id: string;
  label: string;
  mobileLabel: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface BawsalaNavbarProps {
  latestCaseId?: string | null;
  sessionCount?: number;
  activeId?: string;
  className?: string;
}

export function BawsalaNavbar({
  latestCaseId,
  sessionCount = 0,
  activeId = "home",
  className = "",
}: BawsalaNavbarProps) {
  const [activeTab, setActiveTab] = useState(activeId);
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  const links: NavLinkItem[] = [
    {
      id: "home",
      label: "الرئيسية والبدء",
      mobileLabel: "الرئيسية",
      href: "/",
      icon: Home,
    },
    {
      id: "profile",
      label: "ملف المشتري",
      mobileLabel: "المشتري",
      href: latestCaseId ? `/case/${latestCaseId}/profile` : "#consultation-card",
      icon: UserCheck,
    },
    {
      id: "properties",
      label: "العقارات المرشحة",
      mobileLabel: "العقارات",
      href: latestCaseId ? `/case/${latestCaseId}/properties` : "#consultation-card",
      icon: Building2,
    },
    {
      id: "compare",
      label: "مصفوفة المقارنة",
      mobileLabel: "المقارنة",
      href: latestCaseId ? `/case/${latestCaseId}/compare` : "#consultation-card",
      icon: Scale,
    },
  ];

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 40 && currentScrollY > lastScrollY) {
        setIsScrolledDown(true);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 20) {
        setIsScrolledDown(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top Floating Navbar (Desktop & Mobile Header) */}
      <nav
        dir="rtl"
        aria-label="التنقل الرئيسي"
        className={`fixed top-4 sm:top-6 inset-x-0 z-40 flex items-center justify-center px-4 pointer-events-none ${className}`}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className={`pointer-events-auto flex items-center justify-between rounded-full bg-[var(--paper)] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] transition-all duration-300 max-w-5xl w-full select-none ${
            isScrolledDown
              ? "py-2 px-4 sm:px-6 gap-3"
              : "py-2.5 sm:py-3 px-5 sm:px-8 gap-4 sm:gap-6"
          }`}
        >
          {/* RIGHT: Logo Lockup without double border (Compass-Left, Wordmark-Right in LTR order) */}
          <Link
            href="/"
            aria-label="BAWSALA - بوصلة العقار"
            className="group shrink-0 min-h-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-[var(--navy)] rounded-full px-1 no-underline"
            onClick={() => setActiveTab("home")}
          >
            <div
              dir="ltr"
              lang="en"
              style={{ direction: "ltr", unicodeBidi: "isolate" }}
              aria-label="BAWSALA"
              className="flex items-center gap-2.5"
            >
              <div className="text-[var(--navy)] flex items-center justify-center shrink-0">
                <BawsalaCompass size={26} fullOpacity animateHover />
              </div>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="font-wordmark font-normal text-sm sm:text-base text-[var(--navy)] uppercase tracking-[0.2em] leading-none"
                  style={{ letterSpacing: "0.2em" }}
                >
                  BAWSALA
                </span>
                <span className="text-[var(--mist)] text-xs hidden sm:inline select-none">•</span>
                <span className="font-display font-bold text-xs sm:text-sm text-[var(--dusty-blue)] tracking-tight whitespace-nowrap pr-0.5">
                  بوصلة العقار
                </span>
              </div>
            </div>
          </Link>

          {/* CENTER: Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2" role="menubar">
            {links.map((link) => {
              const isActive = activeTab === link.id;

              return (
                <Link
                  key={link.id}
                  href={link.href}
                  role="menuitem"
                  aria-label={link.label}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActiveTab(link.id)}
                  className={`relative px-4 py-2 rounded-full text-xs transition-colors flex flex-col items-center justify-center min-h-[44px] focus-visible:ring-2 focus-visible:ring-[var(--navy)] no-underline ${
                    isActive
                      ? "text-[var(--navy)] font-bold"
                      : "text-[var(--dusty-blue)] hover:text-[var(--navy)] font-medium"
                  }`}
                >
                  <span className="relative inline-block whitespace-nowrap">
                    {link.label}
                  </span>

                  {/* Active Indicator: small navy dot that glides between links */}
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active-dot"
                      className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-[var(--navy)] pointer-events-none"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* LEFT: Sessions Counter Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="#active-sessions"
              aria-label={`حالات الاستشارة: ${sessionCount}`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-xs text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:border-[var(--navy)] transition-all group shadow-xs min-h-[40px] focus-visible:ring-2 focus-visible:ring-[var(--navy)] no-underline"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)]" />
              <span className="text-xs font-medium whitespace-nowrap">حالات الاستشارة</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--paper)] text-[var(--navy)] text-[11px] font-mono font-bold border border-[var(--mist)]">
                {sessionCount}
              </span>
            </Link>
          </div>
        </motion.div>
      </nav>

      {/* Mobile Bottom Tab Bar (< md) on Paper / Cream */}
      <nav
        dir="rtl"
        aria-label="شريط التنقل السفلي"
        className="fixed bottom-3 inset-x-3 max-w-lg mx-auto z-40 md:hidden pointer-events-none"
      >
        <div className="pointer-events-auto bg-[var(--paper)] border border-[var(--mist)] rounded-2xl shadow-[0_20px_60px_rgba(15,26,43,0.08)] p-1.5 flex items-center justify-around safe-area-inset-bottom">
          {links.map((link) => {
            const isActive = activeTab === link.id;
            const Icon = link.icon;

            return (
              <Link
                key={link.id}
                href={link.href}
                aria-label={link.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveTab(link.id)}
                className={`flex-1 min-h-[48px] min-w-[48px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-all relative touch-manipulation focus-visible:ring-2 focus-visible:ring-[var(--navy)] no-underline ${
                  isActive
                    ? "text-[var(--navy)] font-bold bg-[var(--cream)]"
                    : "text-[var(--dusty-blue)] hover:text-[var(--navy)] active:scale-95"
                }`}
              >
                <div className="relative flex flex-col items-center">
                  <Icon className="w-4 h-4" />
                  {isActive && (
                    <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[var(--navy)]" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight leading-none whitespace-nowrap mt-0.5">
                  {link.mobileLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
