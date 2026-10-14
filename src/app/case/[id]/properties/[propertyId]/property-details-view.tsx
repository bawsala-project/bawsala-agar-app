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
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] disabled:opacity-50 text-[var(--cream)] text-xs font-display font-medium transition-all shadow-xs cursor-pointer active:scale-[0.98]"
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
      {error && <span className="text-[11px] text-[#A62626] font-medium">{error}</span>}
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
          className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-xs text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all font-medium"
        />
        {error && <p className="text-[11px] text-[#A62626] font-medium mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending || !val.trim()}
        className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] disabled:opacity-50 text-[var(--cream)] text-xs font-display font-medium transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
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
    <div className="space-y-8">
      {/* Top Navigation & Breadcrumb */}
      <div>
        <Link
          href={`/case/${caseId}/properties`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--paper)] border border-[var(--mist)] text-xs font-medium text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:border-[var(--navy)] transition-all shadow-xs mb-4"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة لقائمة العقارات المرشحة</span>
        </Link>

        <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,26,43,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--navy)]" />
                <span>تدقيق الحقائق والأدلة</span>
              </span>
              {city && (
                <span className="px-2.5 py-1 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] text-xs font-medium">
                  {city}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] text-xs font-medium">
                {property.input_mode === "url" ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-[var(--navy)]" />
                    <span>رابط إلكتروني</span>
                  </>
                ) : property.input_mode === "image" ? (
                  <>
                    <Camera className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                    <span>صور الإعلان</span>
                  </>
                ) : (
                  <>
                    <FileEdit className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                    <span>إدخال يدوي</span>
                  </>
                )}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-bold text-[var(--navy)] tracking-tight font-display">
              {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--dusty-blue)] leading-relaxed">
              مراجعة وتدقيق الحقائق المستخرجة من الإعلانات وفض التعارضات بناءً على الصك ومخطط البناء
            </p>
          </div>

          <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--mist)]">
            <div className="text-right">
              <div className="text-[11px] text-[var(--dusty-blue)]">إجمالي الحقائق</div>
              <div className="text-sm font-bold text-[var(--navy)] font-display tabular-nums">
                {facts.length} معلومة مسجلة
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group A: Conflicting Fields */}
      {conflictingFields.length > 0 && (
        <section className="bg-[var(--paper)] rounded-[28px] border border-[#F6CBC8] shadow-[0_20px_60px_rgba(15,26,43,0.04)] p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A62626] animate-pulse" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--navy)] flex items-center gap-2 font-display">
                  <span>معلومات متعارضة تتطلب فض النزاع</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8]">
                    {conflictingFields.length}
                  </span>
                </h2>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                  رُصدت أرقام متضاربة من مصادر مختلفة (مثل اختلاف المساحة في الرابط عن صورة المخطط)
                </p>
              </div>
            </div>
          </div>

          {/* Principle explanation */}
          <div className="bg-[#FDF1F0] border border-[#F6CBC8] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#A62626] leading-relaxed font-medium">
            <AlertTriangle className="w-4 h-4 text-[#A62626] shrink-0 mt-0.5" />
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
                  className="p-5 bg-[var(--cream)] rounded-2xl border border-[var(--mist)] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-[var(--navy)] flex items-center gap-2 font-display">
                      <span>{def.label}</span>
                      {def.isCritical && (
                        <span className="text-[10px] font-semibold text-[#A62626] bg-[#FDF1F0] border border-[#F6CBC8] px-2 py-0.5 rounded-full">
                          شرط حتمي
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-[var(--dusty-blue)]">اختر القيمة الصحيحة</span>
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
                          className="bg-[var(--paper)] p-4 rounded-2xl border border-[var(--mist)] flex flex-col justify-between gap-3 shadow-xs hover:border-[var(--navy)] transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-base font-bold text-[var(--navy)] font-display tabular-nums">
                                {formatFieldValue(field, cand.value)}
                              </span>
                              <div className="flex gap-1 flex-wrap">
                                {cand.sources.map((s, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] font-medium"
                                  >
                                    {getSourceLabel(s)}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {quotes.length > 0 && (
                              <blockquote className="text-xs text-[var(--dusty-blue)] italic mt-2 p-2 bg-[var(--cream)] rounded-xl border-r-2 border-[var(--navy)] line-clamp-2">
                                &quot;{quotes[0]}&quot;
                              </blockquote>
                            )}
                          </div>

                          <div className="pt-2 border-t border-[var(--mist)]">
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
                  <div className="pt-3 border-t border-[var(--mist)]">
                    <p className="text-xs font-medium text-[var(--navy)] mb-1">
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

      {/* Group B: Missing / Unknown Fields */}
      {unknownFields.length > 0 && (
        <section className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.04)] p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#9A6700]" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--navy)] flex items-center gap-2 font-display">
                  <span>معلومات ناقصة ومطلوبة للتقييم</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FFF9EC] text-[#9A6700] border border-[#F9E2AF]">
                    {unknownFields.length}
                  </span>
                </h2>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
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
                  className="p-4 sm:p-5 bg-[var(--cream)] rounded-2xl border border-[var(--mist)] space-y-2 hover:border-[var(--navy)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-[var(--navy)]">{def.label}</span>
                    {def.isCritical ? (
                      <span className="text-[10px] font-semibold text-[#9A6700] bg-[#FFF9EC] border border-[#F9E2AF] px-2 py-0.5 rounded-full">
                        مهم للمقارنة
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--dusty-blue)]">غير متوفر</span>
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

      {/* Group C: Known Fields */}
      <section className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.04)] p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--mist)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1E6B43]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--navy)] flex items-center gap-2 font-display">
                <span>حقائق مؤكدة ومدققة</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]">
                  {knownFields.length}
                </span>
              </h2>
              <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                بيانات تم التحقق من مصدرها وتثبيتها للاستخدام في محرك المقارنة والتقييم
              </p>
            </div>
          </div>
        </div>

        {knownFields.length === 0 ? (
          <div className="text-center py-8 bg-[var(--cream)] rounded-2xl border border-dashed border-[var(--mist)]">
            <p className="text-xs font-medium text-[var(--navy)]">لم يتم تأكيد أي معلومات بعد</p>
            <p className="text-[11px] text-[var(--dusty-blue)] mt-1">
              قم بفض التعارضات أو إدخال المعلومات الناقصة أعلاه
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--mist)] rounded-2xl border border-[var(--mist)] overflow-hidden bg-[var(--paper)]">
            {knownFields.map((field) => {
              const res = resolved.fields[field];
              if (res.status !== "known") return null;
              const def = FIELD_REGISTRY[field];
              const isEditing = editingField === field;

              // Find evidence quote from facts
              const relatedFacts = facts.filter((f) => res.factIds.includes(f.id));
              const evidenceQuote = relatedFacts.find((f) => f.evidence_text)?.evidence_text;

              return (
                <div key={field} className="p-4 sm:p-5 space-y-2 hover:bg-[var(--cream)]/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-[var(--dusty-blue)]">{def.label}:</span>
                      <span className="text-sm sm:text-base font-bold text-[var(--navy)] font-display tabular-nums">
                        {formatFieldValue(field, res.value)}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          res.certainty === "user_stated"
                            ? "bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]"
                            : "bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]"
                        }`}
                      >
                        {res.certainty === "user_stated" ? "إدخال شخصي" : "مستخرج من الإعلان"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingField(isEditing ? null : field)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--navy)] hover:text-[var(--midnight)] self-start sm:self-center px-3 py-1 rounded-full border border-[var(--mist)] hover:border-[var(--navy)] bg-[var(--cream)] transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? "إلغاء التعديل" : "تصحيح"}</span>
                    </button>
                  </div>

                  {evidenceQuote && (
                    <details className="text-xs text-[var(--dusty-blue)] pt-1 group">
                      <summary className="cursor-pointer text-[var(--dusty-blue)] hover:text-[var(--navy)] select-none inline-flex items-center gap-1 font-medium">
                        <span>عرض نص الدليل المقتبس</span>
                        <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                      </summary>
                      <blockquote className="mt-2 p-3 bg-[var(--cream)] rounded-xl border-r-2 border-[var(--navy)] text-[var(--navy)] italic">
                        &quot;{evidenceQuote}&quot;
                      </blockquote>
                    </details>
                  )}

                  {isEditing && (
                    <div className="pt-3 border-t border-[var(--mist)] mt-2">
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

      {/* Group D: Listing Claims */}
      <section className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.04)] p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--mist)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--navy)] font-display">
                مميزات وادعاءات تسويقية (غير مدققة رسمياً)
              </h2>
              <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                نصوص وادعاءات منسوخة من وصف المسوق لم تخضع بعد للتحقق الميداني
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Unit Claims */}
          <div className="bg-[var(--cream)] p-5 rounded-2xl border border-[var(--mist)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--mist)] pb-2">
              <h3 className="text-xs font-medium text-[var(--navy)] flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-[var(--navy)]" />
                <span>مواصفات الوحدة</span>
              </h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--paper)] text-[var(--dusty-blue)] border border-[var(--mist)]">
                {resolved.claims.unit.length}
              </span>
            </div>
            {resolved.claims.unit.length === 0 ? (
              <p className="text-xs text-[var(--dusty-blue)] italic">لا توجد ادعاءات مسجلة</p>
            ) : (
              <ul className="text-xs text-[var(--navy)] space-y-2">
                {resolved.claims.unit.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <span className="text-[var(--navy)] font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{c.raw_text || String(c.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Building Claims */}
          <div className="bg-[var(--cream)] p-5 rounded-2xl border border-[var(--mist)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--mist)] pb-2">
              <h3 className="text-xs font-medium text-[var(--navy)] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[var(--navy)]" />
                <span>مواصفات المبنى</span>
              </h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--paper)] text-[var(--dusty-blue)] border border-[var(--mist)]">
                {resolved.claims.building.length}
              </span>
            </div>
            {resolved.claims.building.length === 0 ? (
              <p className="text-xs text-[var(--dusty-blue)] italic">لا توجد ادعاءات مسجلة</p>
            ) : (
              <ul className="text-xs text-[var(--navy)] space-y-2">
                {resolved.claims.building.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <span className="text-[var(--navy)] font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{c.raw_text || String(c.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Neighborhood Claims */}
          <div className="bg-[var(--cream)] p-5 rounded-2xl border border-[var(--mist)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--mist)] pb-2">
              <h3 className="text-xs font-medium text-[var(--navy)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--navy)]" />
                <span>الحي والخدمات</span>
              </h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--paper)] text-[var(--dusty-blue)] border border-[var(--mist)]">
                {resolved.claims.neighborhood.length}
              </span>
            </div>
            {resolved.claims.neighborhood.length === 0 ? (
              <p className="text-xs text-[var(--dusty-blue)] italic">لا توجد ادعاءات مسجلة</p>
            ) : (
              <ul className="text-xs text-[var(--navy)] space-y-2">
                {resolved.claims.neighborhood.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <span className="text-[var(--navy)] font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{c.raw_text || String(c.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Bottom Action Footer */}
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 shadow-[0_20px_60px_rgba(15,26,43,0.04)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href={`/case/${caseId}/properties`}
          className="inline-flex items-center gap-2 text-xs font-medium text-[var(--dusty-blue)] hover:text-[var(--navy)] transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لحصر العقارات</span>
        </Link>

        <Link href={`/case/${caseId}/preflight`} className="w-full sm:w-auto">
          <button
            type="button"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-display font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98]"
          >
            <span>المتابعة إلى بوابة الفحص المبدئي</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}
