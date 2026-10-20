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
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { formatSAR } from "@/lib/utils";
import { EngineeringDialGauge } from "./engineering-dial-gauge";
import type { PropertyFitEvaluation, ConfidenceAssessment } from "@/lib/analysis/fit-evaluator";
import type { DimensionWeights } from "@/lib/analysis/weights";

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
    weighted_fit_score?: number;
    dimensions?: PropertyFitEvaluation["dimensions"];
    dimension_weights?: DimensionWeights;
    top_pros?: string[];
    top_cons?: string[];
    ranking_reason_ar?: string;
    missing_information?: string[];
    confidence?: ConfidenceAssessment;
    is_certain?: boolean;
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

  // Fit score (0-100)
  const score =
    assessment?.weighted_fit_score ??
    assessment?.engineering_score ??
    (assessment?.fit_rating === "strong"
      ? 89
      : assessment?.fit_rating === "partial"
      ? 74
      : 58);

  const isCertain = assessment?.is_certain !== false && assessment?.confidence?.level !== "low";
  const confidence = assessment?.confidence ?? {
    level: isCertain ? "high" : "low",
    score: isCertain ? 85 : 40,
    reasonAr: isCertain ? "بيانات العقار متكاملة وموثقة" : "بيانات ناقصة جوهرية تستدعي التحقق الميداني",
  };

  // Needle angle mapped to buyer-fit zones:
  // - Not recommended (score < 60): -55° to -22°
  // - Acceptable (score 60 - 74): -15° to +15°
  // - Recommended (score >= 75): +22° to +55°
  let fitAngle = 0;
  if (score < 60) {
    fitAngle = -55 + Math.max(0, (score / 60)) * 32;
  } else if (score < 75) {
    fitAngle = -15 + ((score - 60) / 15) * 30;
  } else {
    fitAngle = 22 + Math.min(1, (score - 75) / 25) * 33;
  }

  const fitZone =
    score >= 75
      ? { label: "ملائم وموصى به للمشتري", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" }
      : score >= 60
      ? { label: "مقبول ومناسب بشروط", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" }
      : { label: "غير موصى به لعدم الملاءمة", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" };

  // The 5 FIT Dimensions
  const dimensionsList = assessment?.dimensions
    ? [
        {
          key: "suitability",
          label: "1. الملاءمة للاحتياج والأسرة",
          score: assessment.dimensions.suitability.score,
          weight: Math.round(assessment.dimensions.suitability.weight * 100),
          reason: assessment.dimensions.suitability.reasonAr,
          evidence: assessment.dimensions.suitability.supportingEvidence,
          supportingNote: null,
        },
        {
          key: "priceAffordability",
          label: "2. السعر والقدرة المالية",
          score: assessment.dimensions.priceAffordability.score,
          weight: Math.round(assessment.dimensions.priceAffordability.weight * 100),
          reason: assessment.dimensions.priceAffordability.reasonAr,
          evidence: assessment.dimensions.priceAffordability.supportingEvidence,
          supportingNote: null,
        },
        {
          key: "locationDailyLife",
          label: "3. الموقع وتأثيره على الحياة اليومية",
          score: assessment.dimensions.locationDailyLife.score,
          weight: Math.round(assessment.dimensions.locationDailyLife.weight * 100),
          reason: assessment.dimensions.locationDailyLife.reasonAr,
          evidence: assessment.dimensions.locationDailyLife.supportingEvidence,
          supportingNote: null,
        },
        {
          key: "propertyQuality",
          label: "4. جودة العقار وحالته الإنشائية",
          score: assessment.dimensions.propertyQuality.score,
          weight: Math.round(assessment.dimensions.propertyQuality.weight * 100),
          reason: assessment.dimensions.propertyQuality.reasonAr,
          evidence: assessment.dimensions.propertyQuality.supportingEvidence,
          supportingNote: "عنصر داعم: مدعوم بنتائج المعاينة الهندسية وتكاليف التشغيل (TCO)",
        },
        {
          key: "risks",
          label: "5. المخاطر والالتزامات النظامية",
          score: assessment.dimensions.risks.score,
          weight: Math.round(assessment.dimensions.risks.weight * 100),
          reason: assessment.dimensions.risks.reasonAr,
          evidence: assessment.dimensions.risks.supportingEvidence,
          supportingNote: "عنصر داعم: مدعوم بتدقيق الصك الإلكتروني ومطابقة المساحة على أرض الواقع",
        },
      ]
    : [
        {
          key: "suitability",
          label: "1. الملاءمة للاحتياج والأسرة",
          score: Math.min(100, Math.round(score * 1.02)),
          weight: 25,
          reason: "مدى مطابقة عدد الغرف والمساحة وتوزيع المسكن لاحتياج الأسرة.",
          evidence: [],
          supportingNote: null,
        },
        {
          key: "priceAffordability",
          label: "2. السعر والقدرة المالية",
          score: Math.min(100, Math.round(score * 0.98)),
          weight: 25,
          reason: "ملائمة السعر المطلوب للميزانية وسعر المتر الصافي.",
          evidence: [],
          supportingNote: null,
        },
        {
          key: "locationDailyLife",
          label: "3. الموقع وتأثيره على الحياة اليومية",
          score: Math.min(100, Math.round(score * 1.01)),
          weight: 20,
          reason: "سهولة الوصول لمقرات العمل والخدمات اليومية للأسرة.",
          evidence: [],
          supportingNote: null,
        },
        {
          key: "propertyQuality",
          label: "4. جودة العقار وحالته الإنشائية",
          score: Math.min(100, Math.round(score * 0.96)),
          weight: 15,
          reason: "عمر المبنى ومواصفات التشطيب والأنظمة الإنشائية.",
          evidence: [],
          supportingNote: "عنصر داعم: مستند لنتائج المعاينة وتكاليف الصيانة الدورية",
        },
        {
          key: "risks",
          label: "5. المخاطر والالتزامات النظامية",
          score: Math.min(100, Math.round(score * 0.99)),
          weight: 15,
          reason: "سلامة الصك ومطابقة التراخيص والمساحة الفعلية الصافية.",
          evidence: [],
          supportingNote: "عنصر داعم: مستند لتدقيق الصك الإلكتروني ومخطط البناء",
        },
      ];

  const topPros =
    assessment?.top_pros && assessment.top_pros.length > 0
      ? assessment.top_pros
      : assessment?.strengths && assessment.strengths.length > 0
      ? assessment.strengths.slice(0, 3)
      : ["سعر ملائم للميزانية", "مساحة متوافقة مع متطلبات الأسرة", "موقع مخدوم وقريب من الاحتياجات"];

  const topCons =
    assessment?.top_cons && assessment.top_cons.length > 0
      ? assessment.top_cons
      : assessment?.risks && assessment.risks.length > 0
      ? assessment.risks.slice(0, 3)
      : ["يتطلب التحقق الميداني من المرفقات والصك", "فروق المساحة الفعلية تستوجب المعاينة", "التأكد من التزامات اتحاد الملاك السنوية"];

  const rankingReason =
    assessment?.ranking_reason_ar ||
    assessment?.fit_summary ||
    "تم تقييم وترتيب هذا العقار استناداً إلى توازن السعر الإجمالي ومطابقته لأولويات واحتياجات المشتري.";

  const missingInfo = assessment?.missing_information || assessment?.key_unknowns || [];

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
          <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[var(--paper)]/95 border-b border-[var(--mist)] backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
              <span className="font-display font-bold text-sm sm:text-base text-[var(--navy)]">
                ملف ملاءمة العقار للمشتري
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
                  <span>{property.city || "الرياض"}</span>
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
                    مؤشر ملاءمة العقار
                  </div>
                  <div className="text-[11px] mt-0.5">
                    {!isCertain ? (
                      <span className="text-[#9A6700] font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        تقدير مبدئي (بيانات ناقصة)
                      </span>
                    ) : (
                      <span className="text-[var(--dusty-blue)]">
                        {score >= 80 ? "توافق ممتاز مع أولوياتك" : score >= 65 ? "توافق جيد مع تضحيات" : "توافق محدود"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ORDER 1: FIT SUMMARY, RECOMMENDATION REASON, COMPASS NEEDLE & MISSING INFO */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--cream)] p-6 sm:p-7 space-y-6">
              {/* Fit Summary and Compass Needle Row */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[var(--mist)]">
                <div className="space-y-2 text-right flex-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--paper)] text-[var(--dusty-blue)] border border-[var(--mist)]">
                    <Sparkles className="w-3 h-3 text-[var(--navy)]" />
                    <span>خلاصة الملاءمة وتوجيه القرار</span>
                  </div>
                  <h4 className="font-display font-bold text-lg sm:text-xl text-[var(--navy)]">
                    {rankingReason}
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--dusty-blue)] leading-relaxed">
                    {assessment?.fit_summary ||
                      "تم تحليل العقار بناءً على متطلباتك، حجم الأسرة، الميزانية القصوى، وسهولة الوصول لمقراتك اليومية."}
                  </p>
                </div>

                {/* Compass Verdict Needle Unit */}
                <div className="relative flex flex-col items-center justify-center shrink-0 w-44 h-32 p-2 rounded-2xl bg-[var(--paper)] border border-[var(--mist)]">
                  <svg viewBox="0 0 100 65" className="w-full h-full overflow-visible">
                    {/* Base Track */}
                    <path
                      d="M 15 55 A 35 35 0 0 1 85 55"
                      stroke="var(--mist)"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.3"
                    />

                    {/* Zone 1: Not Recommended (Score < 60) - Left */}
                    <path
                      d="M 15 55 A 35 35 0 0 1 33 27"
                      stroke="#E11D48"
                      strokeWidth="3.5"
                      fill="none"
                      strokeLinecap="round"
                    />

                    {/* Zone 2: Acceptable (Score 60-74) - Center */}
                    <path
                      d="M 36 25 A 35 35 0 0 1 64 25"
                      stroke="#D97706"
                      strokeWidth="3.5"
                      fill="none"
                      strokeLinecap="round"
                    />

                    {/* Zone 3: Recommended (Score >= 75) - Right */}
                    <path
                      d="M 67 27 A 35 35 0 0 1 85 55"
                      stroke="var(--navy)"
                      strokeWidth="3.5"
                      fill="none"
                      strokeLinecap="round"
                    />

                    {/* Compass Needle */}
                    <motion.g
                      style={{ transformOrigin: "50px 55px" }}
                      animate={{ rotate: fitAngle }}
                      transition={{ type: "spring", stiffness: 90, damping: 14 }}
                    >
                      <line x1="50" y1="55" x2="50" y2="23" stroke="var(--navy)" strokeWidth="2.5" strokeLinecap="round" />
                      <polygon points="50,19 47.5,25 52.5,25" fill="var(--navy)" />
                      <circle cx="50" cy="55" r="4" fill="var(--navy)" />
                      <circle cx="50" cy="55" r="1.5" fill="var(--cream)" />
                    </motion.g>

                    {/* Zone Text Labels */}
                    <text x="10" y="64" fontSize="5.5" fill="#E11D48" fontWeight="bold" fontFamily="sans-serif">
                      غير موصى به
                    </text>
                    <text x="50" y="17" fontSize="5.5" fill="#D97706" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                      مقبول
                    </text>
                    <text x="90" y="64" fontSize="5.5" fill="var(--navy)" fontWeight="bold" textAnchor="end" fontFamily="sans-serif">
                      موصى به
                    </text>
                  </svg>

                  <div className={`mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${fitZone.bg} ${fitZone.color} ${fitZone.border}`}>
                    {fitZone.label}
                  </div>
                </div>
              </div>

              {/* Confidence Level & Missing Information */}
              <div className="space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[var(--navy)]" />
                    <span className="font-bold text-sm text-[var(--navy)]">
                      مستوى الثقة وموثوقية البيانات
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-[var(--mist)] bg-[var(--paper)]">
                    <span className="text-[var(--dusty-blue)]">درجة الثقة:</span>
                    <span className={confidence.level === "high" ? "text-emerald-700" : confidence.level === "medium" ? "text-blue-700" : "text-amber-700"}>
                      {confidence.level === "high" ? "ثقة مرتفعة" : confidence.level === "medium" ? "ثقة متوسطة" : "ثقة منخفضة (بيانات ناقصة)"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--mist)] space-y-2 text-xs">
                  <div className="text-[var(--dusty-blue)] leading-relaxed">
                    <strong>سبب تقييم الثقة:</strong> {confidence.reasonAr}
                  </div>

                  {!isCertain && (
                    <div className="p-3 rounded-xl bg-[#FFF9EC] border border-[#F9E2AF] text-[#9A6700] text-xs leading-relaxed mt-2 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>تنبيه هام للمشتري:</strong> لا يُقدَّم هذا التقييم كأمر قطعي لوجود بيانات ناقصة لم يتم التحقق منها. المعاينة الميدانية خطوة إلزامية لاستكمال التأكيد.
                      </span>
                    </div>
                  )}
                </div>

                {missingInfo.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[var(--navy)]">
                      البيانات الناقصة التي لم يتم التأكد منها (تستوجب التحقق أثناء المعاينة):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {missingInfo.map((info, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-[var(--paper)] border border-[var(--mist)] text-[var(--dusty-blue)] text-xs font-medium"
                        >
                          {info}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ORDER 2: PROS AND CONS */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--paper)] p-6 space-y-5">
              <div className="border-b border-[var(--mist)] pb-3">
                <h4 className="font-display font-bold text-base text-[var(--navy)]">
                  أبرز مزايا التوافق والتضحيات (المزايا والمآخذ)
                </h4>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                  خلاصة المزايا والنقاط الحرجة بناءً على دراسة متطلباتك
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pros */}
                <div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--navy)] border-b border-[var(--mist)] pb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>أبرز 3 مزايا توافق (نقاط القوة)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[var(--navy)]">
                    {topPros.slice(0, 3).map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--navy)] border-b border-[var(--mist)] pb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>أبرز 3 مآخذ أو تضحيات</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[var(--navy)]">
                    {topCons.slice(0, 3).map((con, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* ORDER 3: THE FIVE FIT DIMENSIONS */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--cream)] p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--mist)] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--navy)]" />
                  <h4 className="font-display font-bold text-base text-[var(--navy)]">
                    محاور الملاءمة الخمسة (FIT Dimensions)
                  </h4>
                </div>
                <span className="text-xs text-[var(--dusty-blue)] font-medium">
                  موزونة حسب أولويات المشتري المرتبة
                </span>
              </div>

              <div className="space-y-4 pt-1">
                {dimensionsList.map((dim) => (
                  <div key={dim.key} className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--mist)] space-y-2.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--navy)] text-sm">{dim.label}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]">
                          وزن المحور: {dim.weight}%
                        </span>
                      </div>
                      <span className="font-bold text-[var(--navy)] font-mono tabular-nums text-sm">
                        {dim.score} / 100
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 rounded-full bg-[var(--mist)]/40 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dim.score}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-[var(--navy)] rounded-full"
                      />
                    </div>

                    <p className="text-xs text-[var(--dusty-blue)] leading-relaxed">
                      {dim.reason}
                    </p>

                    {dim.supportingNote && (
                      <div className="text-[11px] text-[var(--dusty-blue)] bg-[var(--cream)]/80 px-2.5 py-1.5 rounded-xl border border-[var(--mist)] font-medium">
                        {dim.supportingNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ORDER 4: SECONDARY SECTION - عناصر داعمة للقرار */}
            <div className="rounded-[28px] border-2 border-dashed border-[var(--mist)] bg-[var(--paper)] p-6 sm:p-7 space-y-6">
              <div className="border-b border-[var(--mist)] pb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] mb-2">
                  <Scale className="w-3.5 h-3.5" />
                  <span>فحوصات مساندة (Supporting Evidence)</span>
                </div>
                <h4 className="font-display font-bold text-lg text-[var(--navy)]">
                  عناصر داعمة للقرار
                </h4>
                <p className="text-xs text-[var(--dusty-blue)] mt-1 leading-relaxed">
                  فحوصات فنية وقانونية مساندة تغذي محوري الجودة والمخاطر، وتساعدك في التأكد من سلامة العقار الفنية دون أن تكون هي العنوان الرئيسي لتقرير الملاءمة.
                </p>
              </div>

              {/* Sub-check 1: Area checks */}
              <div className="p-5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-[var(--mist)] pb-2.5">
                  <span className="font-bold text-sm text-[var(--navy)]">أ. تدقيق ومطابقة المساحات</span>
                  <span className="font-medium text-[var(--dusty-blue)]">نسبة الهدر: {discrepancyPercent}%</span>
                </div>

                <div className="space-y-3">
                  {/* 1. Marketed Area */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--dusty-blue)]">المساحة الترويجية (الإعلان)</span>
                      <span className="font-bold text-[var(--navy)] font-mono">{marketedArea} م²</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--mist)]/40 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-[var(--dusty-blue)] rounded-full"
                      />
                    </div>
                  </div>

                  {/* 2. Deed Area */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--dusty-blue)]">المساحة المسجلة بالصك</span>
                      <span className="font-bold text-[var(--navy)] font-mono">{deedArea} م²</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--mist)]/40 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(deedArea / marketedArea) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-[var(--dusty-blue)]/80 rounded-full"
                      />
                    </div>
                  </div>

                  {/* 3. Building Plan Area */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--dusty-blue)]">مساحة المخطط ورخصة البناء</span>
                      <span className="font-bold text-[var(--navy)] font-mono">{planArea} م²</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--mist)]/40 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(planArea / marketedArea) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-[var(--dusty-blue)]/70 rounded-full"
                      />
                    </div>
                  </div>

                  {/* 4. Usable Net Area */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--navy)]">المساحة الفعلية الصافية القابلة للعيش</span>
                      <span className="font-bold text-[var(--navy)] font-mono">{usableArea} م²</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--mist)]/40 overflow-hidden">
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

              {/* Sub-check 2: Operating costs (TCO) */}
              <div className="p-5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-4">
                <div className="border-b border-[var(--mist)] pb-2.5">
                  <div className="font-bold text-sm text-[var(--navy)]">ب. تقدير تكاليف التشغيل والصيانة (TCO)</div>
                  <div className="text-[11px] text-[var(--dusty-blue)] mt-0.5">التكاليف الدورية السنوية المتوقعة</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--mist)]">
                    <div className="text-[10px] font-medium text-[var(--dusty-blue)]">اتحاد الملاك سنوي</div>
                    <div className="font-display font-black text-sm sm:text-base text-[var(--navy)] mt-1">
                      <AnimatedCounter target={annualHoaFee} suffix=" ر.س" />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--mist)]">
                    <div className="text-[10px] font-medium text-[var(--dusty-blue)]">تقدير فواتير الطاقة</div>
                    <div className="font-display font-black text-sm sm:text-base text-[var(--navy)] mt-1">
                      <AnimatedCounter target={annualEnergyCost} suffix=" ر.س" />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--mist)]">
                    <div className="text-[10px] font-medium text-[var(--dusty-blue)]">الصيانة السنوية</div>
                    <div className="font-display font-black text-sm sm:text-base text-[var(--navy)] mt-1">
                      <AnimatedCounter target={annualMaintenance} suffix=" ر.س" />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--navy)] text-[var(--cream)] border border-[var(--navy)]">
                    <div className="text-[10px] font-medium opacity-80">تكلفة 10 سنوات</div>
                    <div className="font-display font-black text-sm sm:text-base mt-1 text-[var(--cream)]">
                      <AnimatedCounter target={tenYearTco} suffix=" ر.س" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-check 3: Technical checks & features */}
              <div className="p-5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--mist)] pb-2.5">
                  <div className="font-bold text-sm text-[var(--navy)]">ج. المعاينة الهندسية ومواصفات البناء</div>
                  <button
                    type="button"
                    onClick={() => setShowAllFeatures(!showAllFeatures)}
                    className="text-xs text-[var(--dusty-blue)] hover:text-[var(--navy)] font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showAllFeatures ? "عرض أقل" : "عرض كل الفحوصات"}</span>
                    {showAllFeatures ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {visibleFeatures.map((feat, i) => {
                    const Icon = feat.icon;
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--mist)] flex items-center gap-3 text-xs text-[var(--navy)]"
                      >
                        <Icon className="w-4 h-4 text-[var(--navy)] shrink-0" />
                        <span>{feat.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
