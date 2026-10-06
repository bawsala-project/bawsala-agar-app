"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bookmark, Check } from "lucide-react";
import { CompassIcon } from "@/components/brand/CompassIcon";
import { useAppStore } from "@/lib/store";
import { LoginSheet } from "@/components/ui/LoginSheet";
import { AddPropertySheet } from "@/components/ui/AddPropertySheet";
import { COPY } from "@/lib/copy";

interface AppShellProps {
  children: React.ReactNode;
  showStepper?: boolean;
  activeStep?: "needs" | "properties" | "preflight" | "results" | "inspection";
  backHref?: string;
  hideTopBar?: boolean;
  pageTitle?: string;
}

export function AppShell({
  children,
  showStepper = false,
  activeStep,
  backHref,
  hideTopBar = false,
  pageTitle,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setLoginSheetOpen, toast, clearToast, resetDemo } = useAppStore();
  const [isScrolled, setIsScrolled] = useState(false);

  // Hidden key 'D' listener to reset demo state anytime
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "d" || e.key === "D") && !e.metaKey && !e.ctrlKey) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          resetDemo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetDemo]);

  // Track window scroll for glass top-bar
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const steps = COPY.journeySteps;
  const currentStepIndex = steps.findIndex((s) => s.id === activeStep);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FAF6EF] text-[#130F08] overflow-x-hidden" dir="rtl">
      {/* 1. Global Ambient Backdrop (Light luxury warm atmosphere) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft sand warm radial glow at top */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-60"
          style={{
            background: "radial-gradient(circle, rgba(233, 223, 208, 0.7) 0%, rgba(250, 246, 239, 0) 70%)",
          }}
        />

        {/* Subtle survey grid paper texture */}
        <div className="absolute inset-0 survey-grid-paper opacity-50 pointer-events-none" />
      </div>

      {/* 2. Main Centered 430px-wide Column for Mobile-First Display */}
      <div className="relative z-10 mx-auto w-full max-w-[430px] min-h-screen flex flex-col justify-between shadow-[0_10px_40px_rgba(19,15,8,0.06)] bg-[#FAF6EF] border-x border-[#E9DFD0]">
        {/* Top Bar */}
        {!hideTopBar && (
          <header
            className={`sticky top-0 z-40 w-full transition-all duration-300 ${
              isScrolled
                ? "glass-light border-b border-[#E9DFD0] shadow-xs"
                : "bg-transparent border-b border-transparent"
            }`}
          >
            <div className="px-5 h-14 flex items-center justify-between">
              {/* Back Arrow (points right in RTL) */}
              <button
                type="button"
                onClick={handleBack}
                className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 text-[#130F08] hover:bg-[#E9DFD0]/60 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                aria-label="الرجوع للخلف"
              >
                <ArrowRight className="w-5 h-5 text-[#130F08]" />
              </button>

              {/* Center Brand Compass & Wordmark */}
              <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                <CompassIcon size={24} className="text-[#130F08] group-hover:rotate-12 transition-transform" />
                <span className="text-xs uppercase font-semibold tracking-wider text-[#130F08]">
                  BAWSALA
                </span>
              </Link>

              {/* Account / Save Glyph (triggers Login bottom sheet) */}
              <button
                type="button"
                onClick={() => setLoginSheetOpen(true)}
                className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 text-[#130F08] hover:bg-[#E9DFD0]/60 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                title="حفظ الحالة / تسجيل الدخول"
                aria-label="حفظ الحالة"
              >
                <Bookmark className="w-4 h-4 text-[#130F08]" />
              </button>
            </div>

            {/* Journey Stepper under Top Bar on Case screens */}
            {showStepper && (
              <div className="px-6 pb-3 pt-1 border-b border-[#E9DFD0]/80">
                <div className="relative flex items-center justify-between" dir="rtl">
                  {/* Background track line */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-3 left-3 h-[2px] bg-[#E9DFD0] -z-0" />

                  {/* Active animated progress fill line */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 right-3 h-[2px] bg-[#E3A83A] -z-0"
                    initial={false}
                    animate={{
                      width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%`,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 30,
                    }}
                  />

                  {/* 5 Step Dots */}
                  {steps.map((step, idx) => {
                    const isCompleted = idx < currentStepIndex;
                    const isActive = idx === currentStepIndex;

                    return (
                      <div key={step.id} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`h-2.5 transition-all duration-300 rounded-full flex items-center justify-center ${
                            isActive
                              ? "w-8 bg-[#130F08] shadow-sm"
                              : isCompleted
                              ? "w-2.5 bg-[#14756E]"
                              : "w-2.5 bg-[#E9DFD0] border border-[#130F08]/15"
                          }`}
                        />
                        <span
                          className={`text-[11px] mt-1.5 transition-colors select-none ${
                            isActive
                              ? "text-[#130F08] font-semibold"
                              : isCompleted
                              ? "text-[#14756E] font-medium"
                              : "text-[#130F08]/50"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </header>
        )}

        {/* Content Area with RTL-aware animated entrance */}
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
      </div>

      {/* Global Bottom Sheets */}
      <LoginSheet />
      <AddPropertySheet />

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 inset-x-0 mx-auto max-w-sm px-4 z-50 pointer-events-none flex justify-center"
          >
            <div className="px-5 py-3 rounded-full glass-light border border-[#130F08]/15 shadow-xl text-xs font-medium text-[#130F08] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#14756E] shrink-0" />
              <span>{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
