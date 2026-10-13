"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check,
  Edit3,
  Globe,
  Camera,
  FileEdit,
  Loader2,
  Building2,
  Home,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { formatSAR } from "@/lib/utils";
import { FIELD_REGISTRY, FieldKey, ResolvableFieldKey } from "@/lib/evidence/fields";
import { ResolveFactsResult, PropertyFact } from "@/lib/evidence/resolve";
import { submitCorrection } from "@/actions/evidence";
import type { Database } from "@/types/database";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyDetailsViewProps {
  caseId: string;
  property: PropertyRow;
  city?: string | null;
  facts: PropertyFact[];
  resolved: ResolveFactsResult;
}

function getSourceLabel(source: string): string {
  switch (source) {
    case "url":
      return "رابط الإعلان";
    case "image":
      return "صورة الإعلان";
    case "manual":
    case "user_correction":
      return "إدخالك الشخصي";
    default:
      return source;
  }
}

function formatFieldValue(field: FieldKey, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (field === "listing_price_sar" && typeof value === "number") {
    return formatSAR(value);
  }
  if (field === "area_sqm") {
    return `${value} م²`;
  }
  if (typeof value === "boolean") {
    return value ? "متوفر" : "غير متوفر";
  }
  if (field === "floor_no") {
    if (value === 0) return "الدور الأرضي";
    if (value === -1) return "قبو / سرداب";
    return `الدور ${value}`;
  }
  if (field === "property_age_years") {
    if (value === 0) return "جديد (0 سنة)";
    return `${value} سنوات`;
  }
  return String(value);
}

function AdoptCandidateButton({
  caseId,
  propertyId,
  field,
  value,
}: {
  caseId: string;
  propertyId: string;
  field: FieldKey;
  value: unknown;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAdopt = () => {
    setError(null);
    startTransition(async () => {
      const res = await submitCorrection(caseId, propertyId, {
        field,
        value: String(value),
      });
      if (res?.errors) {
        setError(res.errors[field]?.[0] || res.errors.form?.[0] || "تعذر اعتماد القيمة");
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={handleAdopt}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
      >
        {pending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>جارٍ الاعتماد...</span>
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>اعتمد هذه القيمة</span>
          </>
        )}
      </button>
      {error && <span className="text-[11px] text-rose-600 font-bold">{error}</span>}
    </div>
  );
}

function InlineCorrectionForm({
  caseId,
  propertyId,
  field,
  label,
  placeholder,
  buttonLabel = "حفظ",
  onSuccess,
}: {
  caseId: string;
  propertyId: string;
  field: FieldKey;
  label: string;
  placeholder?: string;
  buttonLabel?: string;
  onSuccess?: () => void;
}) {
  const [val, setVal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;

    setError(null);
    startTransition(async () => {
      const res = await submitCorrection(caseId, propertyId, {
        field,
        value: val.trim(),
      });
      if (res?.errors) {
        setError(res.errors[field]?.[0] || res.errors.form?.[0] || "قيمة غير صالحة");
      } else {
        setVal("");
        onSuccess?.();
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 items-start sm:items-center mt-2 w-full"
    >
      <div className="flex-1 w-full">
        <input
          id={`corr-${field}`}
          name="value"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder || `أدخل ${label}...`}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
        />
        {error && <p className="text-[11px] text-rose-600 font-bold mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending || !val.trim()}
        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
      >
        {pending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>جارٍ الحفظ...</span>
          </>
        ) : (
          <span>{buttonLabel}</span>
        )}
      </button>
    </form>
  );
}

export function PropertyDetailsView({
  caseId,
  property,
  city,
  facts,
  resolved,
}: PropertyDetailsViewProps) {
  const [editingField, setEditingField] = useState<FieldKey | null>(null);

  const displayName =
    property.title ||
    property.district ||
    (property.source_url ? new URL(property.source_url).hostname : "تفاصيل العقار");

  // Partition fields into conflicting, unknown, and known
  const resolvableKeys = Object.keys(resolved.fields) as ResolvableFieldKey[];

  const conflictingFields = resolvableKeys.filter(
    (k) => resolved.fields[k].status === "conflicting"
  );

  const unknownFields = resolvableKeys
    .filter((k) => resolved.fields[k].status === "unknown")
    .sort((a, b) => {
      const aCrit = FIELD_REGISTRY[a].isCritical ? 1 : 0;
      const bCrit = FIELD_REGISTRY[b].isCritical ? 1 : 0;
      return bCrit - aCrit;
    });

  const knownFields = resolvableKeys.filter(
    (k) => resolved.fields[k].status === "known"
  );

  return (
    <div className="space-y-10">
      {/* Top Navigation & Breadcrumb */}
      <div>
        <Link
          href={`/case/${caseId}/properties`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-slate-300 transition-all shadow-xs mb-4"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة لقائمة العقارات المرشحة</span>
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200/70 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>تدقيق الحقائق والأدلة</span>
              </span>
              {city && (
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {city}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                {property.input_mode === "url" ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>رابط إلكتروني</span>
                  </>
                ) : property.input_mode === "image" ? (
                  <>
                    <Camera className="w-3.5 h-3.5 text-slate-600" />
                    <span>صور الإعلان</span>
                  </>
                ) : (
                  <>
                    <FileEdit className="w-3.5 h-3.5 text-slate-600" />
                    <span>إدخال يدوي</span>
                  </>
                )}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
              مراجعة وتدقيق الحقائق المستخرجة من الإعلانات وفض التعارضات بناءً على الصك ومخطط البناء
            </p>
          </div>

          <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="text-right">
              <div className="text-[11px] text-slate-400">إجمالي الحقائق</div>
              <div className="text-sm font-extrabold text-slate-800">
                {facts.length} معلومة مسجلة
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* Group A: معلومات متعارضة (Conflicting Fields) */}
      {/* ============================================================== */}
      {conflictingFields.length > 0 && (
        <section className="bg-white rounded-3xl border border-rose-200/80 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-rose-50/50 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-4 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>معلومات متعارضة تتطلب فض النزاع</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    {conflictingFields.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  رُصدت أرقام متضاربة من مصادر مختلفة (مثل اختلاف المساحة في الرابط عن صورة المخطط)
                </p>
              </div>
            </div>
          </div>

          {/* Principle explanation */}
          <div className="bg-rose-50/60 border border-rose-200/60 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900 leading-relaxed font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">قاعدة بوصلة العقار القطعية (Zero Averaging):</span> لا
              نقوم بحساب المتوسط الحسابي للأرقام المتضاربة مطلقاً. يجب أن تعتمد القيمة الرسمية
              المطابقة للصك أو إدخال القيمة الحقيقية لمنع القرارات المضللة.
            </div>
          </div>

          <div className="space-y-4">
            {conflictingFields.map((field) => {
              const res = resolved.fields[field];
              if (res.status !== "conflicting") return null;
              const def = FIELD_REGISTRY[field];

              return (
                <div
                  key={field}
                  className="p-5 bg-slate-50/60 rounded-2xl border border-slate-200 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>{def.label}</span>
                      {def.isCritical && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          شرط حتمي
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-slate-400">اختر القيمة الصحيحة</span>
                  </div>

                  {/* Candidate Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {res.candidates.map((cand, idx) => {
                      const candFacts = facts.filter((f) => cand.factIds.includes(f.id));
                      const quotes = candFacts
                        .map((f) => f.evidence_text)
                        .filter(Boolean) as string[];

                      return (
                        <div
                          key={idx}
                          className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3 shadow-xs hover:border-slate-300 transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-base font-extrabold text-slate-900">
                                {formatFieldValue(field, cand.value)}
                              </span>
                              <div className="flex gap-1 flex-wrap">
                                {cand.sources.map((s, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold"
                                  >
                                    {getSourceLabel(s)}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {quotes.length > 0 && (
                              <blockquote className="text-xs text-slate-500 italic mt-2 p-2 bg-slate-50 rounded-xl border-r-2 border-slate-300 line-clamp-2">
                                &quot;{quotes[0]}&quot;
                              </blockquote>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <AdoptCandidateButton
                              caseId={caseId}
                              propertyId={property.id}
                              field={field}
                              value={cand.value}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Manual Override Alternative */}
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-700 mb-1">
                      أو أدخل القيمة الفعلية المعتمدة وفق الصك:
                    </p>
                    <InlineCorrectionForm
                      caseId={caseId}
                      propertyId={property.id}
                      field={field}
                      label={def.label}
                      buttonLabel="اعتماد القيمة البديلة"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* Group B: معلومات ناقصة (Missing / Unknown Fields) */}
      {/* ============================================================== */}
      {unknownFields.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>معلومات ناقصة ومطلوبة للتقييم</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                    {unknownFields.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  لم يتم العثور على هذه الحقائق في الإعلان. يمكنك إدخالها يدوياً لرفع دقة التقييم والمقارنة.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {unknownFields.map((field) => {
              const def = FIELD_REGISTRY[field];

              return (
                <div
                  key={field}
                  className="p-4 sm:p-5 bg-slate-50/50 rounded-2xl border border-slate-200/80 space-y-2 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">{def.label}</span>
                    {def.isCritical ? (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        مهم للمقارنة
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">غير متوفر</span>
                    )}
                  </div>

                  <InlineCorrectionForm
                    caseId={caseId}
                    propertyId={property.id}
                    field={field}
                    label={def.label}
                    placeholder={`أدخل ${def.label}...`}
                    buttonLabel="حفظ"
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* Group C: معلومات مؤكدة ومدققة (Known Fields) */}
      {/* ============================================================== */}
      <section className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>حقائق مؤكدة ومدققة</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  {knownFields.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                بيانات تم التحقق من مصدرها وتثبيتها للاستخدام في محرك المقارنة والتقييم
              </p>
            </div>
          </div>
        </div>

        {knownFields.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs font-bold text-slate-500">لم يتم تأكيد أي معلومات بعد</p>
            <p className="text-[11px] text-slate-400 mt-1">
              قم بفض التعارضات أو إدخال المعلومات الناقصة أعلاه
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/70 overflow-hidden bg-slate-50/30">
            {knownFields.map((field) => {
              const res = resolved.fields[field];
              if (res.status !== "known") return null;
              const def = FIELD_REGISTRY[field];
              const isEditing = editingField === field;

              // Find evidence quote from facts
              const relatedFacts = facts.filter((f) => res.factIds.includes(f.id));
              const evidenceQuote = relatedFacts.find((f) => f.evidence_text)?.evidence_text;

              return (
                <div key={field} className="p-4 sm:p-5 space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">{def.label}:</span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        {formatFieldValue(field, res.value)}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          res.certainty === "user_stated"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {res.certainty === "user_stated" ? "إدخال شخصي" : "مستخرج من الإعلان"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingField(isEditing ? null : field)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 self-start sm:self-center px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? "إلغاء التعديل" : "تصحيح"}</span>
                    </button>
                  </div>

                  {evidenceQuote && (
                    <details className="text-xs text-slate-600 pt-1 group">
                      <summary className="cursor-pointer text-slate-400 hover:text-slate-600 select-none inline-flex items-center gap-1 font-medium">
                        <span>عرض نص الدليل المقتبس</span>
                        <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                      </summary>
                      <blockquote className="mt-2 p-3 bg-white rounded-xl border-r-2 border-blue-500 text-slate-700 italic shadow-xs">
                        &quot;{evidenceQuote}&quot;
                      </blockquote>
                    </details>
                  )}

                  {isEditing && (
                    <div className="pt-3 border-t border-slate-200 mt-2">
                      <InlineCorrectionForm
                        caseId={caseId}
                        propertyId={property.id}
                        field={field}
                        label={def.label}
                        buttonLabel="تحديث القيمة"
                        onSuccess={() => setEditingField(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* Group D: ادعاءات ومميزات تسويقية (Listing Claims) */}
      {/* ============================================================== */}
      <section className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                مميزات وادعاءات تسويقية (غير مدققة رسمياً)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                نصوص وادعاءات منسوخة من وصف المسوق لم تخضع بعد للتحقق الميداني
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Unit Claims */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-blue-600" />
                <span>مواصفات الوحدة</span>
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                {resolved.claims.unit.length}
              </span>
            </div>
            {resolved.claims.unit.length === 0 ? (
              <p className="text-xs text-slate-400 italic">لا توجد ادعاءات مسجلة</p>
            ) : (
              <ul className="text-xs text-slate-700 space-y-2">
                {resolved.claims.unit.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{c.raw_text || String(c.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Building Claims */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>مواصفات المبنى</span>
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                {resolved.claims.building.length}
              </span>
            </div>
            {resolved.claims.building.length === 0 ? (
              <p className="text-xs text-slate-400 italic">لا توجد ادعاءات مسجلة</p>
            ) : (
              <ul className="text-xs text-slate-700 space-y-2">
                {resolved.claims.building.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{c.raw_text || String(c.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Neighborhood Claims */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>الحي والخدمات</span>
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                {resolved.claims.neighborhood.length}
              </span>
            </div>
            {resolved.claims.neighborhood.length === 0 ? (
              <p className="text-xs text-slate-400 italic">لا توجد ادعاءات مسجلة</p>
            ) : (
              <ul className="text-xs text-slate-700 space-y-2">
                {resolved.claims.neighborhood.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{c.raw_text || String(c.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Bottom Action Footer */}
      <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href={`/case/${caseId}/properties`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لحصر العقارات</span>
        </Link>

        <Link href={`/case/${caseId}/preflight`} className="w-full sm:w-auto">
          <button
            type="button"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          >
            <span>المتابعة إلى بوابة الفحص المبدئي</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}
