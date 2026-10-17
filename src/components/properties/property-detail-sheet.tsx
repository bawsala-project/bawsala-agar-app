"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ClipboardCheck,
  FileEdit,
  AlertTriangle,
  Sparkles,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { formatSAR } from "@/lib/utils";
import type { ConstraintResult } from "@/lib/analysis/constraints";

export interface PropertyDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  rank?: number | null;
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
    constraint_results?: ConstraintResult[];
    main_advantage_ar?: string;
    main_tradeoff_ar?: string;
    engineering_score?: number;
    price_per_sqm?: number | null;
  };
}

function getFitRatingMeta(rating?: string) {
  switch (rating) {
    case "strong":
      return {
        label: "توافق قوي مع متطلباتك",
        badgeClass: "bg-[#E9F4EE] text-[#1E6B43] border-[#C5E4D4]",
      };
    case "partial":
      return {
        label: "توافق جزئي (يتضمن مفاضلات)",
        badgeClass: "bg-[#FFF9EC] text-[#9A6700] border-[#F9E2AF]",
      };
    case "weak":
      return {
        label: "توافق ضعيف (يخالف شروطاً أساسية)",
        badgeClass: "bg-[#FDF1F0] text-[#A62626] border-[#F6CBC8]",
      };
    default:
      return {
        label: "بيانات غير كافية للحكم الكامل",
        badgeClass: "bg-[var(--cream)] text-[var(--dusty-blue)] border-[var(--mist)]",
      };
  }
}

function getVisitPriorityMeta(priority?: string) {
  switch (priority) {
    case "high":
    case "first":
      return {
        label: "أولوية المعاينة: مرتفعة",
        badgeClass: "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)]",
      };
    case "medium":
    case "second":
      return {
        label: "أولوية المعاينة: متوسطة",
        badgeClass: "bg-[#FFF9EC] text-[#9A6700] border-[#F9E2AF]",
      };
    case "low":
    case "third":
      return {
        label: "أولوية المعاينة: منخفضة",
        badgeClass: "bg-[#FDF1F0] text-[#A62626] border-[#F6CBC8]",
      };
    default:
      return {
        label: "أولوية المعاينة: قيد التحقق",
        badgeClass: "bg-[var(--cream)] text-[var(--dusty-blue)] border-[var(--mist)]",
      };
  }
}

export function PropertyDetailSheet({
  isOpen,
  onClose,
  caseId,
  rank,
  property,
  assessment,
}: PropertyDetailSheetProps) {
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

  const title =
    property.title ||
    `عقار في ${property.district ? `حي ${property.district}` : property.city || "الموقع"}`;

  const hasKnownPrice =
    typeof property.listing_price_sar === "number" && property.listing_price_sar > 0;
  const hasKnownArea =
    typeof property.area_sqm === "number" && property.area_sqm > 0;

  const pricePerSqm =
    assessment?.price_per_sqm ??
    (hasKnownPrice && hasKnownArea
      ? Math.round(property.listing_price_sar! / property.area_sqm!)
      : null);

  const fitMeta = getFitRatingMeta(assessment?.fit_rating);
  const visitMeta = getVisitPriorityMeta(assessment?.visit_priority);

  const strengths = assessment?.strengths || [];
  const risks = assessment?.risks || [];
  const keyUnknowns = assessment?.key_unknowns || [];
  const constraints = assessment?.constraint_results || [];

  const passCount = constraints.filter((c) => c.result === "pass").length;
  const failCount = constraints.filter((c) => c.result === "fail").length;
  const unknownCount = constraints.filter((c) => c.result === "unknown").length;

  const factGrid: Array<{
    key: string;
    label: string;
    known: boolean;
    valueText: string;
  }> = [
    {
      key: "listing_price_sar",
      label: "السعر المعلن",
      known: hasKnownPrice,
      valueText: hasKnownPrice
        ? formatSAR(property.listing_price_sar!)
        : "غير مذكور في الإعلان",
    },
    {
      key: "area_sqm",
      label: "المساحة المعلنة",
      known: hasKnownArea,
      valueText: hasKnownArea ? `${property.area_sqm} م²` : "غير مذكورة في الإعلان",
    },
    {
      key: "price_per_sqm",
      label: "سعر المتر المربع المحسوب",
      known: pricePerSqm !== null && pricePerSqm > 0,
      valueText:
        pricePerSqm !== null && pricePerSqm > 0
          ? `${pricePerSqm.toLocaleString("en-US")} ر.س / م²`
          : "يتطلب توفر السعر والمساحة معاً",
    },
    {
      key: "bedrooms",
      label: "غرف النوم",
      known: typeof property.bedrooms === "number" && property.bedrooms > 0,
      valueText:
        typeof property.bedrooms === "number" && property.bedrooms > 0
          ? `${property.bedrooms} غرف`
          : "غير مذكور في الإعلان",
    },
    {
      key: "bathrooms",
      label: "دورات المياه",
      known: typeof property.bathrooms === "number" && property.bathrooms > 0,
      valueText:
        typeof property.bathrooms === "number" && property.bathrooms > 0
          ? `${property.bathrooms} دورات مياه`
          : "غير مذكور في الإعلان",
    },
    {
      key: "floor_no",
      label: "رقم الدور",
      known: typeof property.floor_no === "number" && property.floor_no >= 0,
      valueText:
        typeof property.floor_no === "number" && property.floor_no >= 0
          ? property.floor_no === 0
            ? "الدور الأرضي (0)"
            : `الدور ${property.floor_no}`
          : "غير مذكور في الإعلان",
    },
    {
      key: "district",
      label: "الحي",
      known: Boolean(property.district && property.district.trim().length > 0),
      valueText:
        property.district && property.district.trim().length > 0
          ? `حي ${property.district}`
          : "غير مذكور في الإعلان",
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        {/* Soft Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[rgba(15,26,43,0.45)] backdrop-blur-xs transition-opacity"
        />

        {/* Bottom-Sheet Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0.9 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] bg-[var(--paper)] border border-[var(--mist)] rounded-t-[32px] sm:rounded-[32px] shadow-[0_20px_60px_rgba(15,26,43,0.12)] overflow-y-auto flex flex-col text-[var(--navy)] z-10 scrollbar-thin"
          dir="rtl"
        >
          {/* Top Sticky Bar */}
          <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[var(--paper)]/95 backdrop-blur-md border-b border-[var(--mist)]">
            <div className="flex items-center gap-2.5">
              {rank && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-body font-bold tabular-nums ${
                    rank === 1
                      ? "bg-[var(--navy)] text-[var(--cream)]"
                      : "bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]"
                  }`}
                >
                  المركز #{rank}
                </span>
              )}
              <span className="font-display font-bold text-sm sm:text-base text-[var(--navy)]">
                ملف تقييم العقار وتدقيق الشواهد
              </span>
            </div>

            <div className="flex items-center gap-2">
              {caseId && (
                <Link
                  href={`/case/${caseId}/inspection?propertyId=${property.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--navy)] text-[var(--cream)] text-xs font-body font-bold hover:bg-[var(--midnight)] transition-all no-underline"
                >
                  <span>قائمة المعاينة الميدانية ←</span>
                </Link>
              )}
              <button
                onClick={onClose}
                className="group p-2 rounded-full bg-[var(--cream)] hover:bg-[var(--paper)] border border-[var(--mist)] text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:border-[var(--navy)] transition-all cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4 transition-transform duration-300 ease-out group-hover:rotate-90" />
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Overview Card */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--cream)] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--dusty-blue)] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[var(--navy)]" />
                  <span>{property.city || "المدينة غير محددة"}</span>
                  <span>•</span>
                  <span>
                    {property.district ? `حي ${property.district}` : "الحي غير محدد في الإعلان"}
                  </span>
                </div>
                <h3 className="font-body font-extrabold text-xl sm:text-2xl text-[var(--navy)] tracking-tight">
                  {title}
                </h3>
                <div className="flex flex-wrap items-baseline gap-3 pt-1">
                  {hasKnownPrice ? (
                    <span className="font-body font-extrabold text-2xl sm:text-3xl text-[var(--navy)] tabular-nums">
                      {formatSAR(property.listing_price_sar!)}
                    </span>
                  ) : (
                    <span className="font-body font-bold text-base sm:text-lg text-[#9A6700]">
                      السعر غير محدد في الإعلان
                    </span>
                  )}
                  {pricePerSqm !== null && pricePerSqm > 0 && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--paper)] border border-[var(--mist)] text-[var(--navy)] tabular-nums">
                      {pricePerSqm.toLocaleString("en-US")} ر.س / م²
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-2.5 border-t md:border-t-0 md:border-r border-[var(--mist)] pt-4 md:pt-0 md:pr-6">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${fitMeta.badgeClass}`}
                >
                  {fitMeta.label}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${visitMeta.badgeClass}`}
                >
                  {visitMeta.label}
                </span>
              </div>
            </div>

            {/* PART 1: EXECUTIVE FIT & PRE-VISIT ADVISORY GUIDANCE */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--paper)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--mist)] pb-3">
                <div>
                  <h4 className="font-body font-bold text-base text-[var(--navy)]">
                    الخلاصة التحليلية وتوصية المعاينة
                  </h4>
                  <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                    تقييم مبني حصرياً على الحقائق المسجلة ومطابقتها مع شروطك دون أي افتراضات غير موثقة
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[var(--navy)] leading-relaxed">
                {assessment?.fit_summary ||
                  "يعتمد هذا التقييم على مقارنة البيانات المتوفرة في الإعلان مع ميزانيتك ومتطلباتك الأساسية."}
              </p>

              {(assessment?.main_advantage_ar || assessment?.main_tradeoff_ar) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {assessment?.main_advantage_ar && (
                    <div className="rounded-2xl border border-[#C5E4D4] bg-[#E9F4EE]/50 p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E6B43]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>أبرز ميزة مرصودة</span>
                      </div>
                      <p className="text-xs text-[var(--navy)] leading-relaxed">
                        {assessment.main_advantage_ar}
                      </p>
                    </div>
                  )}
                  {assessment?.main_tradeoff_ar && (
                    <div className="rounded-2xl border border-[#F9E2AF] bg-[#FFF9EC]/70 p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#9A6700]">
                        <Scale className="w-3.5 h-3.5" />
                        <span>أبرز مفاضلة أو نقطة حذر</span>
                      </div>
                      <p className="text-xs text-[var(--navy)] leading-relaxed">
                        {assessment.main_tradeoff_ar}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {assessment?.visit_priority_reason && (
                <div className="rounded-2xl bg-[var(--cream)] border border-[var(--mist)] p-3.5 space-y-1">
                  <div className="text-xs font-bold text-[var(--navy)]">
                    سبب أولوية المعاينة الميدانية:
                  </div>
                  <p className="text-xs text-[var(--dusty-blue)] leading-relaxed">
                    {assessment.visit_priority_reason}
                  </p>
                  <p className="text-[11px] text-[var(--dusty-blue)]/80 pt-1">
                    * هذه التوصية استشارية لترتيب زياراتك الميدانية والتحقق من النقاط الناقصة؛ القرار النهائي يعود لك بعد المعاينة.
                  </p>
                </div>
              )}
            </div>

            {/* PART 2: BUYER REQUIREMENTS & HARD CONSTRAINTS AUDIT */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--cream)] p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--mist)] pb-3">
                <div>
                  <h4 className="font-body font-bold text-base text-[var(--navy)]">
                    نتائج فحص الشروط والمحددات الأساسية
                  </h4>
                  <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                    مطابقة شروطك الإلزامية (الميزانية، الغرف، المساحة، والاشتراطات الخاصة) مع بيانات العقار
                  </p>
                </div>

                {constraints.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]">
                      مطابق: {passCount}
                    </span>
                    {failCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8]">
                        مخالف: {failCount}
                      </span>
                    )}
                    {unknownCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFF9EC] text-[#9A6700] border border-[#F9E2AF]">
                        غير مؤكد: {unknownCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {constraints.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {constraints.map((c, idx) => {
                    const isPass = c.result === "pass";
                    const isFail = c.result === "fail";
                    return (
                      <div
                        key={`${c.key}-${idx}`}
                        className={`rounded-2xl border p-3.5 space-y-1.5 ${
                          isPass
                            ? "bg-[var(--paper)] border-[#C5E4D4]"
                            : isFail
                            ? "bg-[#FDF1F0]/70 border-[#F6CBC8]"
                            : "bg-[#FFF9EC]/70 border-[#F9E2AF]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-body font-bold text-xs text-[var(--navy)]">
                            {c.labelAr}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isPass
                                ? "bg-[#E9F4EE] text-[#1E6B43]"
                                : isFail
                                ? "bg-[#FDF1F0] text-[#A62626]"
                                : "bg-[#FFF9EC] text-[#9A6700]"
                            }`}
                          >
                            {isPass ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>مطابق</span>
                              </>
                            ) : isFail ? (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>غير مطابق</span>
                              </>
                            ) : (
                              <>
                                <HelpCircle className="w-3 h-3" />
                                <span>غير مؤكد</span>
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--dusty-blue)] leading-relaxed">
                          {c.detailAr}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[var(--dusty-blue)]">
                  لا توجد نتائج شروط مفصلة مسجلة لهذا العقار بعد.
                </p>
              )}
            </div>

            {/* PART 3: VERIFIED FACTS VS. MISSING FIELDS + STRENGTHS / RISKS / UNKNOWNS */}
            <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--cream)] p-5 sm:p-6 space-y-4">
              <div className="border-b border-[var(--mist)] pb-3">
                <h4 className="font-body font-bold text-base text-[var(--navy)]">
                  سجل الحقائق المرصودة مقابل البيانات غير المذكورة
                </h4>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                  نفصل هنا بوضوح بين البيانات المؤكدة في الإعلان وبين المعلومات الناقصة التي لم نفترض لها أرقاماً
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {factGrid.map((f) => (
                  <div
                    key={f.key}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-1.5 ${
                      f.known
                        ? "bg-[var(--paper)] border-[var(--mist)]"
                        : "bg-[#FFF9EC]/60 border-[#F9E2AF]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-[var(--dusty-blue)]">
                        {f.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          f.known
                            ? "bg-[var(--cream)] text-[var(--navy)]"
                            : "bg-[#FFF9EC] text-[#9A6700]"
                        }`}
                      >
                        {f.known ? "مؤكد" : "ناقص"}
                      </span>
                    </div>
                    <div
                      className={`font-body text-xs sm:text-sm ${
                        f.known
                          ? "font-extrabold text-[var(--navy)] tabular-nums"
                          : "font-semibold text-[#9A6700]"
                      }`}
                    >
                      {f.valueText}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Risks / Unknowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="rounded-[20px] border border-[#C5E4D4] bg-[#E9F4EE]/60 p-4 space-y-2.5">
                <h4 className="font-body font-bold text-xs sm:text-sm text-[#1E6B43]">
                  ✓ نقاط القوة والمزايا المرصودة ({strengths.length})
                </h4>
                {strengths.length > 0 ? (
                  <ul className="space-y-1.5">
                    {strengths.map((s, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-[var(--navy)] flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-[#1E6B43] font-bold shrink-0">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--dusty-blue)]">
                    لا توجد نقاط قوة إضافية مسجلة.
                  </p>
                )}
              </div>

              {/* Risks & Unknowns */}
              <div className="rounded-[20px] border border-[#F6CBC8] bg-[#FDF1F0]/60 p-4 space-y-2.5">
                <h4 className="font-body font-bold text-xs sm:text-sm text-[#A62626] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>المخاطر والنقاط غير المحسومة ({risks.length + keyUnknowns.length})</span>
                </h4>
                {risks.length > 0 || keyUnknowns.length > 0 ? (
                  <ul className="space-y-1.5">
                    {risks.map((r, idx) => (
                      <li
                        key={`r-${idx}`}
                        className="text-xs text-[var(--navy)] flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-[#A62626] font-bold shrink-0">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                    {keyUnknowns.map((u, idx) => (
                      <li
                        key={`u-${idx}`}
                        className="text-xs text-[#9A6700] flex items-start gap-2 leading-relaxed"
                      >
                        <span className="font-bold shrink-0">؟</span>
                        <span>غير مؤكد بالإعلان (يتطلب التحقق ميدانياً): {u}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--dusty-blue)]">
                    لا توجد مخاطر أو نواقص حرجة مسجلة.
                  </p>
                )}
              </div>
            </div>

            {/* PART 4: ACTION FOOTER (INSPECTION & FACT MANAGEMENT) */}
            {caseId && (
              <div className="rounded-[24px] border border-[var(--mist)] bg-[var(--paper)] p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-body font-bold text-xs sm:text-sm text-[var(--navy)]">
                    الخطوة العملية التالية لهذا العقار
                  </div>
                  <p className="text-xs text-[var(--dusty-blue)]">
                    يمكنك مراجعة شواهد الإعلان وتعديلها، أو الانتقال مباشرة إلى قائمة التحقق الميداني.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <Link
                    href={`/case/${caseId}/properties/${property.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--cream)] hover:bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] hover:border-[var(--navy)] text-xs font-body font-bold transition-all no-underline"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>تعديل بيانات العقار</span>
                  </Link>
                  <Link
                    href={`/case/${caseId}/inspection?propertyId=${property.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] text-xs font-body font-bold transition-all no-underline"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>بدء المعاينة الميدانية ←</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
