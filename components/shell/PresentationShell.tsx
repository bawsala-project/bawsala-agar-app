"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import {
  PhoneFrame,
  DEVICE_PRESETS,
  DevicePreset,
} from "./PhoneFrame";
import { RotateCcw, RotateCw, Monitor, Eye, ChevronRight, ChevronLeft } from "lucide-react";

export interface ScreenItem {
  id: string;
  name: string;
  path: string;
}

export const SCREENS: ScreenItem[] = [
  { id: "welcome", name: "الرئيسية", path: "/welcome" },
  { id: "start", name: "ابدأ", path: "/start" },
  { id: "needs", name: "الاحتياج", path: "/case/demo/needs" },
  { id: "properties", name: "العقارات", path: "/case/demo/properties" },
  { id: "preflight", name: "الفحص", path: "/case/demo/preflight" },
  { id: "checkout", name: "الدفع", path: "/case/demo/checkout" },
  { id: "analyzing", name: "التحليل", path: "/case/demo/analyzing" },
  { id: "results", name: "النتائج", path: "/case/demo/results" },
  { id: "property", name: "التفاصيل", path: "/case/demo/property/p1" },
  { id: "compare", name: "المقارنة", path: "/case/demo/compare" },
  { id: "inspection", name: "المعاينة", path: "/case/demo/inspection" },
  { id: "reassess", name: "إعادة التقييم", path: "/case/demo/reassess" },
  { id: "dashboard", name: "لوحتي", path: "/dashboard" },
  { id: "styleguide", name: "دليل المكونات", path: "/styleguide" },
  { id: "preview", name: "الموكاب التنفيذي ✨", path: "/preview" },
];

function isPathActive(screenPath: string, currentPath: string): boolean {
  if (screenPath === currentPath) return true;
  if (screenPath === "/welcome" && currentPath === "/") return true;
  if (screenPath === "/case/demo/property/p1" && currentPath.startsWith("/case/demo/property/")) return true;
  return false;
}

export function PresentationShell() {
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[0]);
  const [currentPath, setCurrentPath] = useState<string>("/welcome");
  const [iframeSrc, setIframeSrc] = useState<string>("/welcome");
  const [iframeKey, setIframeKey] = useState<number>(1);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [viewport, setViewport] = useState({ width: 1200, height: 800 });

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Mobile viewport redirect: on real phones (viewport under 768px), redirect to /welcome
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        window.location.replace("/welcome");
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 2. Measure viewport container with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setViewport({ width, height });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Navigate child app without reload so demo state is preserved
  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "bawsala:navigate", path },
        "*"
      );
    }
  }, []);

  // Replay intro: clear intro seen flag and remount iframe at /welcome
  const handleReplayIntro = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("bawsala_intro_seen");
        iframeRef.current?.contentWindow?.sessionStorage.removeItem("bawsala_intro_seen");
      } catch {}
    }
    setCurrentPath("/welcome");
    setIframeSrc("/welcome");
    setIframeKey((k) => k + 1);
  };

  // Reset demo: clear all demo storage and remount iframe at /welcome
  const handleResetDemo = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.clear();
        localStorage.clear();
        iframeRef.current?.contentWindow?.sessionStorage.clear();
        iframeRef.current?.contentWindow?.localStorage.clear();
      } catch {}
    }
    setCurrentPath("/welcome");
    setIframeSrc("/welcome");
    setIframeKey((k) => k + 1);
  };

  // Navigate journey order
  const handlePrevScreen = () => {
    const currentIndex = SCREENS.findIndex((s) => isPathActive(s.path, currentPath));
    const targetIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    navigateTo(SCREENS[targetIndex].path);
  };

  const handleNextScreen = () => {
    const currentIndex = SCREENS.findIndex((s) => isPathActive(s.path, currentPath));
    const targetIndex =
      currentIndex >= 0 && currentIndex < SCREENS.length - 1
        ? currentIndex + 1
        : SCREENS.length - 1;
    navigateTo(SCREENS[targetIndex].path);
  };

  const actionsRef = useRef({
    replay: handleReplayIntro,
    reset: handleResetDemo,
    prev: handlePrevScreen,
    next: handleNextScreen,
    togglePresentation: () => setIsPresentationMode((prev) => !prev),
  });

  useEffect(() => {
    actionsRef.current = {
      replay: handleReplayIntro,
      reset: handleResetDemo,
      prev: handlePrevScreen,
      next: handleNextScreen,
      togglePresentation: () => setIsPresentationMode((prev) => !prev),
    };
  });

  const triggerKeyAction = (key: string) => {
    const lower = key.toLowerCase();
    if (lower === "r") {
      actionsRef.current.replay();
    } else if (lower === "d") {
      actionsRef.current.reset();
    } else if (lower === "p") {
      actionsRef.current.togglePresentation();
    } else if (key === "ArrowLeft") {
      actionsRef.current.prev();
    } else if (key === "ArrowRight") {
      actionsRef.current.next();
    }
  };

  // Global keyboard shortcuts and iframe messaging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if (["r", "R", "d", "D", "p", "P", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        triggerKeyAction(e.key);
      }
    };

    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      if (e.data.type === "bawsala:route" && typeof e.data.path === "string") {
        setCurrentPath(e.data.path);
      } else if (e.data.type === "bawsala:key" && typeof e.data.key === "string") {
        triggerKeyAction(e.data.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Exact auto-fit geometry:
  const bezel = 12;
  const frameWidth = selectedDevice.width + bezel * 2;
  const frameHeight = selectedDevice.height + bezel * 2;
  const isDesktop = viewport.width >= 1024;
  const panelWidth = !isPresentationMode && isDesktop ? 280 : 0;

  const scale = Math.max(
    0.2,
    Math.min(
      1,
      (viewport.height - 64) / frameHeight,
      (viewport.width - panelWidth - 48) / frameWidth
    )
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden flex items-center justify-center select-none bg-espresso text-sandstone"
      dir="rtl"
    >
      {/* 1. Backdrop: espresso with soft radial lift of cocoa at 35% near top */}
      <div className="absolute inset-0 pointer-events-none bg-radial-lift" />

      {/* 2. 3% Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 3. Top-start: small BAWSALA wordmark and caption "نموذج تفاعلي" */}
      <header className="absolute top-6 start-6 z-20 flex flex-col gap-1 items-start pointer-events-none">
        <Wordmark width={96} height={16} className="text-sandstone" />
        <span className="text-[13px] text-muted font-normal leading-none">
          نموذج تفاعلي
        </span>
      </header>

      {/* 4. Center Work Area: Phone Mockup + Side Panel */}
      <main className="relative z-10 flex items-center justify-center w-full h-full gap-8 px-6">
        {/* Scaled Phone Frame Container */}
        <div
          style={{
            width: Math.round(frameWidth * scale),
            height: Math.round(frameHeight * scale),
            position: "relative",
            flexShrink: 0,
            transition: "width 0.2s ease-out, height 0.2s ease-out",
          }}
        >
          <div
            style={{
              width: frameWidth,
              height: frameHeight,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              position: "absolute",
              top: 0,
              left: "50%",
              marginLeft: -(frameWidth / 2),
              transition: "transform 0.2s ease-out",
            }}
          >
            <PhoneFrame
              device={selectedDevice}
              iframeRef={iframeRef}
              iframeSrc={iframeSrc}
              iframeKey={iframeKey}
            />
          </div>
        </div>

        {/* 5. Side Panel: desktop only, glass-dark with muted text */}
        {!isPresentationMode && (
          <aside className="hidden lg:flex flex-col w-[240px] shrink-0 max-h-[calc(100vh-64px)] rounded-[24px] p-3 text-muted z-20 shadow-2xl overflow-hidden justify-between bawsala-glass-dark">
            {/* Section 1: Screens List in Journey Order */}
            <div className="flex flex-col gap-1 pb-2 border-b border-stroke min-h-0 flex-1 overflow-hidden">
              <div className="flex items-center justify-between px-1 shrink-0">
                <span className="text-[11px] font-medium text-muted">
                  رحلة المستخدم
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevScreen}
                    disabled={SCREENS.findIndex((s) => isPathActive(s.path, currentPath)) <= 0}
                    className="p-1 rounded-full text-muted hover:text-sandstone hover:bg-surface-2/40 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="الشاشة السابقة"
                    aria-label="الشاشة السابقة"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextScreen}
                    disabled={SCREENS.findIndex((s) => isPathActive(s.path, currentPath)) >= SCREENS.length - 1}
                    className="p-1 rounded-full text-muted hover:text-sandstone hover:bg-surface-2/40 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="الشاشة التالية"
                    aria-label="الشاشة التالية"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto scrollbar-none flex flex-col gap-0.5 pe-0.5">
                {SCREENS.map((screen, idx) => {
                  const isActive = isPathActive(screen.path, currentPath);
                  return (
                    <button
                      key={screen.id}
                      type="button"
                      onClick={() => navigateTo(screen.path)}
                      className={`w-full flex items-center justify-between px-2.5 py-1 rounded-full text-[12px] transition-all cursor-pointer ${
                        isActive
                          ? "bg-sandstone text-espresso font-medium shadow-xs"
                          : "text-muted hover:text-sandstone hover:bg-surface-2/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`text-[10px] tabular-nums ${
                            isActive ? "text-espresso/60" : "text-muted/60"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate">{screen.name}</span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-espresso shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Device Size Switcher */}
            <div className="flex flex-col gap-1 py-2 border-b border-stroke shrink-0">
              <span className="text-[11px] font-medium text-muted px-1">
                حجم الجهاز
              </span>
              <div className="flex flex-col gap-1">
                {DEVICE_PRESETS.map((preset) => {
                  const isActive = preset.id === selectedDevice.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedDevice(preset)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[12px] text-right transition-all cursor-pointer ${
                        isActive
                          ? "bg-surface-2 text-sandstone border border-stroke shadow-xs"
                          : "text-muted hover:text-sandstone hover:bg-surface-2/30"
                      }`}
                    >
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[11px] font-medium">
                          {preset.name}
                        </span>
                        <span className={`text-[10px] tabular-nums mt-0.5 ${isActive ? "text-sandstone/70" : "text-muted/60"}`}>
                          <bdi dir="ltr">{preset.width} × {preset.height}</bdi>
                        </span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sandstone shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Action Buttons */}
            <div className="flex flex-col gap-1 pt-2 shrink-0">
              {/* Replay Intro */}
              <button
                type="button"
                onClick={handleReplayIntro}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-full text-[11px] text-sandstone bg-surface-2/50 hover:bg-surface-2 transition-colors cursor-pointer border border-stroke/40"
                title="إعادة تشغيل المشهد الحركي (مفتاح R)"
              >
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-3 h-3 text-sandstone" />
                  <span>إعادة المشهد</span>
                </div>
                <kbd className="text-[9px] font-sans px-1.5 py-0.2 rounded-full bg-espresso text-muted border border-stroke">
                  R
                </kbd>
              </button>

              {/* Reset Demo */}
              <button
                type="button"
                onClick={handleResetDemo}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-full text-[11px] text-sandstone bg-surface-2/50 hover:bg-surface-2 transition-colors cursor-pointer border border-stroke/40"
                title="إعادة ضبط بيانات النموذج (مفتاح D)"
              >
                <div className="flex items-center gap-1.5">
                  <RotateCw className="w-3 h-3 text-sandstone" />
                  <span>إعادة ضبط النموذج</span>
                </div>
                <kbd className="text-[9px] font-sans px-1.5 py-0.2 rounded-full bg-espresso text-muted border border-stroke">
                  D
                </kbd>
              </button>

              {/* Presentation Mode */}
              <button
                type="button"
                onClick={() => setIsPresentationMode(true)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-full text-[11px] text-sandstone bg-surface-2/50 hover:bg-surface-2 transition-colors cursor-pointer border border-stroke/40"
                title="إخفاء لوحة التحكم للقطات الشاشة (مفتاح P)"
              >
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-sandstone" />
                  <span>وضع العرض</span>
                </div>
                <kbd className="text-[9px] font-sans px-1.5 py-0.2 rounded-full bg-espresso text-muted border border-stroke">
                  P
                </kbd>
              </button>
            </div>
          </aside>
        )}

        {/* Exit Presentation Mode Floating Trigger */}
        {isPresentationMode && (
          <button
            type="button"
            onClick={() => setIsPresentationMode(false)}
            className="fixed bottom-6 end-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] text-sandstone bg-surface-2/90 border border-stroke backdrop-blur-md shadow-xl hover:bg-surface-3 transition-all cursor-pointer"
            title="الخروج من وضع العرض (مفتاح P)"
          >
            <Monitor className="w-3.5 h-3.5 text-sandstone" />
            <span>إظهار اللوحة (P)</span>
          </button>
        )}
      </main>
    </div>
  );
}
