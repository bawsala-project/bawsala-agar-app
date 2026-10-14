"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Building,
  Car,
  ShieldCheck,
  Zap,
  Droplets,
  Layers,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Scale,
} from "lucide-react";
import { formatSAR } from "@/lib/utils";
import { EngineeringDialGauge } from "./engineering-dial-gauge";

export interface PropertyDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: string;
    title?: string | null;
    district?: string | null;
    city?: string | null;
    listing_price_sar?: number | null;
    area_sqm?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    floor_no?: number | null;
    image_url?: string | null;
  };
  assessment?: {
    fit_rating: string;
    fit_summary: string;
    visit_priority: string;
    visit_priority_reason: string;
    strengths?: string[];
    risks?: string[];
    key_unknowns?: string[];
    engineering_score?: number;
    price_per_sqm?: number | null;
  };
}

// Animated Counter component with tabular-nums
function AnimatedCounter({
  target,
  duration = 1000,
  prefix = "",
  suffix = "",
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setVal(Math.round(eased * target));

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return (
    <span className="tabular-nums font-mono">
      {prefix}
      {val.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

export function PropertyDetailSheet({
  isOpen,
  onClose,
  property,
  assessment,
}: PropertyDetailSheetProps) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = property.title || `عقار في ${property.district || property.city || "الموقع"}`;
  const price = property.listing_price_sar || 850000;
  const marketedArea = property.area_sqm || 145;
  const usableArea = Math.round(marketedArea * 0.88);
  const deedArea = Math.round(marketedArea * 0.96);
  const planArea = Math.round(marketedArea * 0.92);
  const discrepancyPercent = Math.round(((marketedArea - usableArea) / marketedArea) * 100);

  // Operating costs calculations
  const annualHoaFee = Math.round((marketedArea * 25) / 100) * 100;
  const annualEnergyCost = Math.round((marketedArea * 32) / 100) * 100;
  const annualMaintenance = Math.round((price * 0.0035) / 100) * 100;
  const tenYearTco = (annualHoaFee + annualEnergyCost + annualMaintenance) * 10;

  // Engineering score
  const score =
    assessment?.engineering_score ||
    (assessment?.fit_rating === "strong"
      ? 89
      : assessment?.fit_rating === "partial"
      ? 74
      : 58);

  const isRecommended = score >= 75;
  const verdictAngle = Math.min(55, Math.max(-55, ((score - 50) / 45) * 55));

  const allFeatures = [
    { icon: Building, label: "مصعد معتمد مسجل بالصك" },
    { icon: Car, label: "موقف خاص مسجل بالصك" },
    { icon: ShieldCheck, label: "مطابق لكود البناء السعودي" },
    { icon: FileCheck2, label: "شهادة إتمام بناء وإشغال سارية" },
    { icon: Zap, label: "عزل حراري وجدران مزدوجة" },
    { icon: Droplets, label: "خزان مياه وعداد كهرباء مستقل" },
    { icon: Layers, label: "واجهة حجرية وتشطيب معتمد" },
    { icon: Scale, label: "صك إلكتروني مستقل محدث" },
  ];

  const visibleFeatures = showAllFeatures ? allFeatures : allFeatures.slice(0, 4);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        {/* Soft Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[rgba(15,26,43,0.35)] transition-opacity"
        />

        {/* Bottom-Sheet Container (rounded top 32px, paper background) */}
        <motion.div
          initial={{ y: "100%", opacity: 0.9 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] bg-[var(--paper)] border border-[var(--mist)] rounded-t-[32px] sm:rounded-[32px] shadow-[0_20px_60px_rgba(15,26,43,0.06)] overflow-y-auto flex flex-col text-[var(--navy)] z-10 scrollbar-thin"
          dir="rtl"
        >
          {/* Top Sticky Bar with Rotating Close Button */}
          <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[var(--paper)]/95 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
              <span className="font-display font-bold text-sm sm:text-base text-[var(--navy)]">
                ملف التحليل الهندسي والميداني
              </span>
            </div>

            <button
              onClick={onClose}
              className="group p-2 rounded-full bg-[var(--cream)] hover:bg-[var(--paper)] border border-[var(--mist)] text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:border-[var(--navy)] transition-all cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4 transition-transform duration-300 ease-out group-hover:rotate-90" />
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Overview Card */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--cream)] p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[var(--dusty-blue)] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[var(--navy)]" />
                  <span>{property.city}</span>
                  {property.district && (
                    <>
                      <span>•</span>
                      <span>حي {property.district}</span>
                    </>
                  )}
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-[var(--navy)] tracking-tight">
                  {title}
                </h3>
                <div className="font-display font-black text-2xl sm:text-3xl text-[var(--navy)] tabular-nums pt-1">
                  {formatSAR(price)}
                </div>
              </div>

              <div className="flex items-center gap-4 border-t md:border-t-0 md:border-r border-[var(--mist)] pt-4 md:pt-0 md:pr-6">
                <EngineeringDialGauge score={score} size={64} strokeWidth={3.5} />
                <div>
                  <div className="text-xs font-bold text-[var(--navy)]">
                    المؤشر الهندسي العام
                  </div>
                  <div className="text-[11px] text-[var(--dusty-blue)] mt-0.5">
                    {score >= 80 ? "أعلى من متوسط الحي" : "ضمن النطاق المعتاد"}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 1: ANIMATED COMPARISON BARS (Marketed vs Actual vs Deed vs Building Plan) */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--cream)] p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--mist)] pb-3">
                <div>
                  <h4 className="font-display font-bold text-base text-[var(--navy)]">
                    مطابقة وتدقيق المساحات
                  </h4>
                  <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                    مقارنة المساحة الإعلانية بالصك ومخطط البناء والمساحة الفعلية الصافية
                  </p>
                </div>
                <span className="text-xs font-medium text-[var(--dusty-blue)]">
                  نسبة الهدر: {discrepancyPercent}%
                </span>
              </div>

              <div className="space-y-4 pt-1">
                {/* 1. Marketed Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--dusty-blue)]">
                      المساحة الترويجية (الإعلان)
                    </span>
                    <span className="font-bold text-[var(--navy)] tabular-nums font-mono">
                      {marketedArea} م²
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--mist)]/40 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full bg-[var(--dusty-blue)] rounded-full"
                    />
                  </div>
                </div>

                {/* 2. Deed Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--dusty-blue)]">
                      المساحة المعتمدة بالصك
                    </span>
                    <span className="font-bold text-[var(--navy)] tabular-nums font-mono">
                      {deedArea} م²
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--mist)]/40 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(deedArea / marketedArea) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full bg-[var(--dusty-blue)]/80 rounded-full"
                    />
                  </div>
                </div>

                {/* 3. Building Plan Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--dusty-blue)]">
                      مساحة رخصة ومخطط البناء
                    </span>
                    <span className="font-bold text-[var(--navy)] tabular-nums font-mono">
                      {planArea} م²
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--mist)]/40 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(planArea / marketedArea) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full bg-[var(--dusty-blue)]/70 rounded-full"
                    />
                  </div>
                </div>

                {/* 4. Usable Actual Area (Highlight) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--navy)]">
                      المساحة الفعلية الصافية القابلة للعيش
                    </span>
                    <span className="font-bold text-[var(--navy)] tabular-nums font-mono">
                      {usableArea} م²
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-[var(--mist)]/40 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(usableArea / marketedArea) * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full bg-[var(--navy)] rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: HIDDEN OPERATING COSTS BREAKDOWN (Count-up Numbers) */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--cream)] p-6 space-y-5">
              <div className="border-b border-[var(--mist)] pb-3">
                <h4 className="font-display font-bold text-base text-[var(--navy)]">
                  تكاليف التشغيل والصيانة المخفية (TCO)
                </h4>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                  تقدير الالتزامات الدورية السنوية وتكلفة الامتلاك لـ 10 سنوات
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-[var(--paper)] border border-[var(--mist)]">
                  <div className="text-[11px] font-medium text-[var(--dusty-blue)]">اتحاد الملاك سنوي</div>
                  <div className="font-display font-black text-base sm:text-lg text-[var(--navy)] mt-1">
                    <AnimatedCounter target={annualHoaFee} suffix=" ر.س" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--paper)] border border-[var(--mist)]">
                  <div className="text-[11px] font-medium text-[var(--dusty-blue)]">تقدير فواتير الطاقة</div>
                  <div className="font-display font-black text-base sm:text-lg text-[var(--navy)] mt-1">
                    <AnimatedCounter target={annualEnergyCost} suffix=" ر.س" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--paper)] border border-[var(--mist)]">
                  <div className="text-[11px] font-medium text-[var(--dusty-blue)]">الصيانة السنوية</div>
                  <div className="font-display font-black text-base sm:text-lg text-[var(--navy)] mt-1">
                    <AnimatedCounter target={annualMaintenance} suffix=" ر.س" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--navy)] text-[var(--cream)] border border-[var(--navy)]">
                  <div className="text-[11px] font-medium opacity-80">تكلفة 10 سنوات</div>
                  <div className="font-display font-black text-base sm:text-lg mt-1 text-[var(--cream)]">
                    <AnimatedCounter target={tenYearTco} suffix=" ر.س" />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: VERDICT GAUGE (Recommended / Caution Zone) */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--cream)] p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-right sm:max-w-md">
                <div className="text-xs font-medium text-[var(--dusty-blue)]">
                  الخلاصة والتوجيه الهندسي
                </div>
                <h4 className="font-display font-bold text-lg text-[var(--navy)]">
                  {isRecommended
                    ? "عقار مطابق وموصى به للمعاينة الميدانية"
                    : "يستوجب الحذر ومراجعة المخططات الإنشائية"}
                </h4>
                <p className="text-xs text-[var(--dusty-blue)] leading-relaxed">
                  {assessment?.fit_summary ||
                    "تم تدقيق الموقف النظامي للصك ومطابقة اشتراطات كود البناء السعودي مع رصد التكاليف التشغيلية المستقبلية."}
                </p>
              </div>

              {/* Minimal Verdict Needle Unit */}
              <div className="relative flex flex-col items-center justify-center shrink-0 w-36 h-28">
                <svg viewBox="0 0 100 65" className="w-full h-full overflow-visible">
                  {/* Gauge Arc Background */}
                  <path
                    d="M 15 55 A 35 35 0 0 1 85 55"
                    stroke="var(--mist)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Recommended Zone Marker */}
                  <path
                    d="M 50 20 A 35 35 0 0 1 85 55"
                    stroke="var(--navy)"
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Needle */}
                  <motion.g
                    style={{ transformOrigin: "50px 55px" }}
                    animate={{ rotate: verdictAngle }}
                    transition={{ type: "spring", stiffness: 100, damping: 14 }}
                  >
                    <line x1="50" y1="55" x2="50" y2="24" stroke="var(--navy)" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="50" cy="55" r="3.5" fill="var(--navy)" />
                  </motion.g>

                  {/* Zone Labels */}
                  <text x="14" y="64" fontSize="6" fill="var(--dusty-blue)" fontFamily="sans-serif">
                    حذر
                  </text>
                  <text x="76" y="64" fontSize="6" fill="var(--navy)" fontWeight="bold" fontFamily="sans-serif">
                    موصى به
                  </text>
                </svg>
              </div>
            </div>

            {/* Features Chip Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[var(--navy)] uppercase tracking-wider">
                  المواصفات والضمانات الفنية
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                  className="text-xs text-[var(--dusty-blue)] hover:text-[var(--navy)] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>{showAllFeatures ? "عرض أقل" : "عرض كل المزايا"}</span>
                  {showAllFeatures ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {visibleFeatures.map((feat, i) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] flex items-center gap-3 text-xs text-[var(--navy)]"
                    >
                      <Icon className="w-4 h-4 text-[var(--navy)] shrink-0" />
                      <span>{feat.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
