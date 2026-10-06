"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { 
  RotateCcw, 
  Palette, 
  Smartphone, 
  Sun, 
  Moon, 
  ExternalLink,
  SlidersHorizontal,
  Compass
} from "lucide-react";

import { 
  PhoneFrame, 
  DEVICE_PRESETS, 
  DevicePreset 
} from "@/components/preview/PhoneFrame";

export default function PreviewPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[0]);
  const [backdropMode, setBackdropMode] = useState<"dark" | "light">("dark");
  const [iframeKey, setIframeKey] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [isClient, setIsClient] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Mobile screen redirect: if viewport width < 768px, redirect to "/"
  useEffect(() => {
    setIsClient(true);
    const checkRedirect = () => {
      if (window.innerWidth < 768) {
        router.replace("/");
      }
    };
    checkRedirect();
    window.addEventListener("resize", checkRedirect);
    return () => window.removeEventListener("resize", checkRedirect);
  }, [router]);

  // 2. Auto-scale phone to fit viewport height without scrolling
  // Exact requested formula: scale = min(1, (window.innerHeight - 64) / phoneTotalHeight)
  useEffect(() => {
    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const phoneTotalHeight = selectedDevice.height + 24; // 12px bezel on top and bottom
      const computedScale = Math.min(1, Math.max(0.4, (windowHeight - 64) / phoneTotalHeight));
      setScale(computedScale);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedDevice]);

  // 3. Replay Intro inside the iframe (clears sessionStorage & increments key)
  const handleReplayIntro = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.sessionStorage.removeItem("bawsala_intro_seen");
      } catch {
        // Fallback for security restrictions
      }
      setIframeKey((prev) => prev + 1);
    }
  };

  if (!isClient) {
    return null;
  }

  const isDark = backdropMode === "dark";

  return (
    <div
      className={`relative w-full h-screen overflow-hidden flex flex-col items-center justify-center transition-colors duration-500 select-none ${
        isDark ? "bg-[#130F08] text-[#D7CBBE]" : "bg-[#251F19] text-[#D7CBBE]"
      }`}
      dir="rtl"
    >
      {/* Background Radial Glow & Studio Texture */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: isDark
            ? "radial-gradient(circle at 50% 50%, rgba(61, 39, 26, 0.45) 0%, rgba(19, 15, 8, 0.95) 75%)"
            : "radial-gradient(circle at 50% 50%, rgba(215, 203, 190, 0.16) 0%, rgba(32, 26, 21, 0.98) 85%)",
        }}
      />

      {/* Subtle background noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#D7CBBE 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* Top Floating Controls Bar */}
      <header className="absolute top-4 inset-x-0 z-40 max-w-5xl mx-auto px-6 flex items-center justify-between pointer-events-auto">
        {/* Brand label */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 group text-xs text-[#D7CBBE]/80 hover:text-[#D7CBBE] transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-[#3D271A]/70 border border-[#645A4E]/40 flex items-center justify-center text-[#D7CBBE] group-hover:border-[#D7CBBE]/50 transition-all">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-serif tracking-widest text-[11px] uppercase block leading-none">BAWSALA</span>
              <span className="text-[10px] text-[#645A4E]">عرض الهاتف (Mockup Preview)</span>
            </div>
          </Link>
        </div>

        {/* Global links */}
        <div className="flex items-center gap-2">
          {/* Styleguide link */}
          <Link
            href="/styleguide"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#D7CBBE]/80 hover:text-[#D7CBBE] bg-[#130F08]/60 hover:bg-[#130F08]/90 border border-[#645A4E]/30 backdrop-blur-md transition-all active:scale-95 shadow-sm"
            title="دليل المكونات (Styleguide)"
          >
            <Palette className="w-3.5 h-3.5 text-[#D7CBBE]" />
            <span className="hidden sm:inline">دليل المكونات</span>
          </Link>

          {/* Standalone window link */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#D7CBBE]/80 hover:text-[#D7CBBE] bg-[#130F08]/60 hover:bg-[#130F08]/90 border border-[#645A4E]/30 backdrop-blur-md transition-all active:scale-95 shadow-sm"
            title="فتح التطبيق في نافذة مستقلة"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#D7CBBE]" />
            <span className="hidden sm:inline">نافذة كاملة</span>
          </a>
        </div>
      </header>

      {/* Main Preview Center Area */}
      <main className="relative z-20 flex items-center justify-center w-full h-full p-2 overflow-hidden">
        {/* Animated Phone Container: Fade + Rise in (y: 40 -> 0), followed by 6s subtle idle float of 4px */}
        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 40, filter: "blur(12px)" }
          }
          animate={
            shouldReduceMotion
              ? { opacity: 1, y: 0 }
              : {
                  opacity: 1,
                  y: [0, -4, 0],
                  filter: "blur(0px)",
                }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0.2 }
              : {
                  opacity: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                  filter: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                  y: {
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.5, 1],
                  },
                }
          }
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
          className="transition-transform duration-200 ease-out shrink-0"
        >
          <PhoneFrame
            device={selectedDevice}
            iframeRef={iframeRef}
            iframeSrc={`/?embed=1&k=${iframeKey}`}
          />
        </motion.div>

        {/* Desktop Side Controls Panel (Vertically centered next to the phone) */}
        <aside 
          className="hidden xl:flex flex-col gap-4 absolute right-8 top-1/2 -translate-y-1/2 z-30 p-4 rounded-2xl bawsala-glass-dark border border-[#645A4E]/35 backdrop-blur-xl w-64 shadow-2xl"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center gap-2 pb-3 border-b border-[#645A4E]/25">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D7CBBE]" />
            <span className="text-xs font-medium text-[#D7CBBE]">لوحة التحكم بالعرض</span>
          </div>

          {/* Replay Intro Button */}
          <button
            type="button"
            onClick={handleReplayIntro}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#D7CBBE] text-[#130F08] hover:bg-[#D7CBBE]/90 font-medium text-xs transition-all active:scale-97 cursor-pointer shadow-md"
            title="إعادة تشغيل حركة الدخول وحذف ذاكرة الجلسة"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة المشهد الحركي</span>
            </div>
            <kbd className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-[#130F08]/15 border border-[#130F08]/20">
              R
            </kbd>
          </button>

          {/* Device Size Switcher */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] text-[#645A4E] block">أبعاد الهاتف (width × height)</span>
            <div className="space-y-1.5">
              {DEVICE_PRESETS.map((preset) => {
                const isActive = preset.id === selectedDevice.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedDevice(preset)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#3D271A] text-[#D7CBBE] border border-[#D7CBBE]/40 shadow-sm"
                        : "bg-[#130F08]/40 hover:bg-[#130F08]/80 text-[#D7CBBE]/70 border border-[#645A4E]/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className={`w-3.5 h-3.5 ${isActive ? "text-[#D7CBBE]" : "text-[#645A4E]"}`} />
                      <span>{preset.name}</span>
                    </div>
                    {/* Explicit LTR wrapper so numbers are strictly width x height */}
                    <bdi dir="ltr" className="text-[11px] tabular-nums font-sans text-[#D7CBBE]/80">
                      {preset.width} × {preset.height}
                    </bdi>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backdrop Mode Toggle */}
          <div className="pt-2 border-t border-[#645A4E]/20 flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#645A4E]">إضاءة الاستوديو</span>
            <button
              type="button"
              onClick={() => setBackdropMode((m) => (m === "dark" ? "light" : "dark"))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#130F08]/60 hover:bg-[#130F08] border border-[#645A4E]/30 text-xs text-[#D7CBBE] cursor-pointer transition-colors active:scale-95"
            >
              {isDark ? (
                <>
                  <Sun className="w-3 h-3 text-[#D7CBBE]" />
                  <span>داكن (Espresso)</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-[#D7CBBE]" />
                  <span>استوديو ناعم</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </main>

      {/* Bottom Compact Controls Bar (for tablets/narrower screens) */}
      <footer className="xl:hidden absolute bottom-4 inset-x-0 z-30 flex items-center justify-center gap-2 pointer-events-auto px-4">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bawsala-glass-dark border border-[#645A4E]/30 backdrop-blur-xl shadow-xl">
          {/* Replay */}
          <button
            type="button"
            onClick={handleReplayIntro}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D7CBBE] text-[#130F08] text-xs font-medium cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة المشهد</span>
          </button>

          {/* Device selector quick pills */}
          <div className="flex items-center gap-1">
            {DEVICE_PRESETS.slice(0, 3).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedDevice(p)}
                className={`px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  p.id === selectedDevice.id
                    ? "bg-[#3D271A] text-[#D7CBBE] border border-[#D7CBBE]/30"
                    : "text-[#645A4E] hover:text-[#D7CBBE]"
                }`}
              >
                {p.name.replace("iPhone ", "")}
              </button>
            ))}
          </div>

          {/* Backdrop toggle */}
          <button
            type="button"
            onClick={() => setBackdropMode((m) => (m === "dark" ? "light" : "dark"))}
            className="p-1.5 rounded-xl text-[#D7CBBE]/80 hover:text-[#D7CBBE] cursor-pointer"
            title="تبديل إضاءة الخلفية"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
