"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
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
  ExternalLink,
  CheckCircle2,
  X,
  Plus,
} from "lucide-react";
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

function getShortLabel(field: FieldKey): string {
  return FIELD_REGISTRY[field].label
    .replace(" (ريال)", "")
    .replace(" (م²)", "")
    .replace(" (سنوات)", "");
}

function formatFieldValue(field: FieldKey, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (field === "listing_price_sar" && typeof value === "number") {
    return `${value.toLocaleString("en-US")} ر.س`;
  }
  if (field === "area_sqm") {
    return `${Number(value).toLocaleString("en-US")} م²`;
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
    if (value === 0) return "جديد";
    return `${value} سنوات`;
  }
  return String(value);
}

function QuickSelectPill({
  caseId,
  propertyId,
  field,
  value,
  label,
  active,
  onSuccess,
}: {
  caseId: string;
  propertyId: string;
  field: FieldKey;
  value: string;
  label: string;
  active?: boolean;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const res = await submitCorrection(caseId, propertyId, {
        field,
        value,
      });
      if (!res?.errors) {
        onSuccess?.();
      }
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-[0.97] disabled:opacity-50 ${
        active
          ? "bg-[var(--navy)] text-[var(--cream)] border border-[var(--navy)] shadow-xs"
          : "bg-[var(--paper)] hover:bg-[var(--navy)] text-[var(--navy)] hover:text-[var(--cream)] border border-[var(--mist)] hover:border-[var(--navy)]"
      }`}
    >
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
      <span>{label}</span>
    </button>
  );
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
    <div className="flex flex-col items-start gap-1 w-full">
      <button
        type="button"
        disabled={pending}
        onClick={handleAdopt}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--navy)] hover:bg-[var(--midnight)] disabled:opacity-50 text-[var(--cream)] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
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
  compact = false,
  onSuccess,
}: {
  caseId: string;
  propertyId: string;
  field: FieldKey;
  label: string;
  placeholder?: string;
  buttonLabel?: string;
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const [val, setVal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const def = FIELD_REGISTRY[field];

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

  // Render 1-Tap Boolean Selector for boolean fields
  if (def.valueType === "boolean") {
    return (
      <div className="flex items-center gap-2 pt-1">
        <QuickSelectPill
          caseId={caseId}
          propertyId={propertyId}
          field={field}
          value="متوفر"
          label="✓ متوفر"
          onSuccess={onSuccess}
        />
        <QuickSelectPill
          caseId={caseId}
          propertyId={propertyId}
          field={field}
          value="غير متوفر"
          label="✕ غير متوفر"
          onSuccess={onSuccess}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-1.5">
      <div className="flex items-center gap-1.5 w-full">
        <input
          id={`corr-${field}`}
          name="value"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder || `أدخل ${label}...`}
          className={`flex-1 min-w-0 rounded-xl bg-[var(--paper)] border border-[var(--mist)] text-xs text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:outline-none focus:border-[var(--navy)] transition-all font-medium ${
            compact ? "px-3 py-1.5" : "px-3.5 py-2"
          }`}
        />
        <button
          type="submit"
          disabled={pending || !val.trim()}
          className={`shrink-0 rounded-xl bg-[var(--navy)] hover:bg-[var(--midnight)] disabled:opacity-40 text-[var(--cream)] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98] ${
            compact ? "px-3 py-1.5" : "px-4 py-2"
          }`}
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <span>{buttonLabel}</span>
          )}
        </button>
      </div>
      {error && <p className="text-sm text-[#A62626] font-medium">{error}</p>}
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
  const [expandedConflictManual, setExpandedConflictManual] = useState<Record<string, boolean>>({});
  const [expandedUnknownField, setExpandedUnknownField] = useState<FieldKey | null>(null);
  const [expandedQuoteField, setExpandedQuoteField] = useState<FieldKey | null>(null);
  const [activeClaimTab, setActiveClaimTab] = useState<"all" | "unit" | "building" | "neighborhood">("all");

  // Build a human-friendly title using resolved district/city when property.title is missing
  const resolvedDistrict =
    resolved.fields.district?.status === "known"
      ? String(resolved.fields.district.value)
      : property.district;

  const urlHost = property.source_url
    ? (() => {
        try {
          return new URL(property.source_url).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })()
    : null;

  const displayName =
    property.title ||
    (resolvedDistrict
      ? `عقار في حي ${resolvedDistrict}${city ? ` — ${city}` : ""}`
      : city
      ? `عقار سكني — ${city}`
      : urlHost || "تفاصيل العقار");

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

  const criticalUnknownFields = unknownFields.filter((k) => FIELD_REGISTRY[k].isCritical);

  const knownFields = resolvableKeys.filter(
    (k) => resolved.fields[k].status === "known"
  );

  const allClaims = [
    ...resolved.claims.unit.map((c) => ({ ...c, bucket: "الوحدة" })),
    ...resolved.claims.building.map((c) => ({ ...c, bucket: "المبنى" })),
    ...resolved.claims.neighborhood.map((c) => ({ ...c, bucket: "الحي" })),
  ];

  const displayedClaims =
    activeClaimTab === "all"
      ? allClaims
      : activeClaimTab === "unit"
      ? resolved.claims.unit.map((c) => ({ ...c, bucket: "الوحدة" }))
      : activeClaimTab === "building"
      ? resolved.claims.building.map((c) => ({ ...c, bucket: "المبنى" }))
      : resolved.claims.neighborhood.map((c) => ({ ...c, bucket: "الحي" }));

  const totalFieldsCount = resolvableKeys.length;

  return (
    <div className="space-y-5">
      {/* 1. FULL-WIDTH HORIZONTAL HEADER BAR */}
      <div className="bg-[var(--paper)] rounded-[24px] border border-[var(--mist)] p-5 sm:p-6 shadow-[0_12px_40px_rgba(15,26,43,0.03)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Right: Title & Context Badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/case/${caseId}/properties`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--cream)] hover:bg-[var(--navy)] text-[var(--navy)] hover:text-[var(--cream)] border border-[var(--mist)] hover:border-[var(--navy)] text-xs font-medium transition-all"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العقارات المرشحة</span>
              </Link>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] text-xs font-medium">
                {property.input_mode === "url" ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-[var(--navy)]" />
                    <span>{urlHost || "رابط إلكتروني"}</span>
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

              {property.source_url && (
                <a
                  href={property.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--cream)] hover:border-[var(--navy)] text-[var(--navy)] border border-[var(--mist)] text-xs font-medium transition-all"
                >
                  <span>فتح الإعلان الأصلي</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* Readiness Pill */}
              {conflictingFields.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8] text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A62626] animate-pulse" />
                  <span>{conflictingFields.length} تعارض يحتاج حسم</span>
                </span>
              ) : criticalUnknownFields.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9EC] text-[#9A6700] border border-[#F9E2AF] text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9A6700]" />
                  <span>ينقصه {criticalUnknownFields.length} بيانات أساسية</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4] text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6B43]" />
                  <span>مكتمل البيانات الأساسية ({knownFields.length}/{totalFieldsCount})</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[var(--navy)] tracking-tight font-display">
              {displayName}
            </h1>
          </div>

          {/* Left: Primary Next Step CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/case/${caseId}/preflight`} className="w-full md:w-auto">
              <button
                type="button"
                className="w-full md:w-auto px-6 py-3 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <span>المتابعة للفحص المبدئي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. GROUP A: CONFLICTING FIELDS (Full-Width Horizontal Grid, Only If Conflicts Exist) */}
      {conflictingFields.length > 0 && (
        <section className="bg-[var(--paper)] rounded-[24px] border border-[#F6CBC8] shadow-[0_12px_40px_rgba(15,26,43,0.03)] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A62626] animate-pulse" />
              <h2 className="text-base font-bold text-[var(--navy)] font-display flex items-center gap-2">
                <span>قيم متعارضة</span>
                <span className="text-xs font-body font-semibold px-2.5 py-0.5 rounded-full bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8]">
                  {conflictingFields.length}
                </span>
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#A62626] bg-[#FDF1F0] px-3 py-1 rounded-full border border-[#F6CBC8] font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>اختر الرقم المطابق للصك</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {conflictingFields.map((field) => {
              const res = resolved.fields[field];
              if (res.status !== "conflicting") return null;
              const def = FIELD_REGISTRY[field];
              const isManualOpen = !!expandedConflictManual[field];

              return (
                <div
                  key={field}
                  className="p-4 bg-[var(--cream)] rounded-2xl border border-[var(--mist)] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[var(--navy)] font-body">
                        {def.label}
                      </h3>
                      {def.isCritical && (
                        <span className="text-[10px] font-semibold text-[#A62626] bg-[#FDF1F0] border border-[#F6CBC8] px-2 py-0.5 rounded-full">
                          شرط حتمي
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedConflictManual((prev) => ({
                          ...prev,
                          [field]: !prev[field],
                        }))
                      }
                      className="text-xs font-medium text-[var(--dusty-blue)] hover:text-[var(--navy)] inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isManualOpen ? "إغلاق" : "قيمة أخرى"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {res.candidates.map((cand, idx) => {
                      const candFacts = facts.filter((f) => cand.factIds.includes(f.id));
                      const quotes = candFacts
                        .map((f) => f.evidence_text)
                        .filter(Boolean) as string[];

                      return (
                        <div
                          key={idx}
                          className="bg-[var(--paper)] p-3.5 rounded-xl border border-[var(--mist)] flex flex-col justify-between gap-3 hover:border-[var(--navy)] transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-base font-bold text-[var(--navy)] font-body tabular-nums">
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
                              <p className="text-sm text-[var(--dusty-blue)] italic bg-[var(--cream)] px-2.5 py-1.5 rounded-lg border-r-2 border-[var(--navy)] line-clamp-2">
                                &quot;{quotes[0]}&quot;
                              </p>
                            )}
                          </div>

                          <AdoptCandidateButton
                            caseId={caseId}
                            propertyId={property.id}
                            field={field}
                            value={cand.value}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {isManualOpen && (
                    <div className="pt-2.5 border-t border-[var(--mist)]">
                      <InlineCorrectionForm
                        caseId={caseId}
                        propertyId={property.id}
                        field={field}
                        label={def.label}
                        placeholder={`أدخل ${def.label} كما في الإعلان أو حسب علمك...`}
                        buttonLabel="اعتماد"
                        compact
                        onSuccess={() =>
                          setExpandedConflictManual((prev) => ({
                            ...prev,
                            [field]: false,
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. GROUP C: CONFIRMED FACTS (Full-Width Horizontal Multi-Column Responsive Grid) */}
      <section className="bg-[var(--paper)] rounded-[24px] border border-[var(--mist)] shadow-[0_12px_40px_rgba(15,26,43,0.03)] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--mist)]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E6B43]" />
            <h2 className="text-base font-bold text-[var(--navy)] font-display flex items-center gap-2">
              <span>حقائق مؤكدة</span>
              <span className="text-xs font-body font-semibold px-2.5 py-0.5 rounded-full bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]">
                {knownFields.length}
              </span>
            </h2>
          </div>
          <span className="text-xs text-[var(--dusty-blue)]">
            تدخل مباشرة في المقارنة
          </span>
        </div>

        {knownFields.length === 0 ? (
          <div className="text-center py-6 bg-[var(--cream)] rounded-2xl border border-dashed border-[var(--mist)]">
            <p className="text-sm font-medium text-[var(--navy)]">
              لا حقائق مؤكدة بعد
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {knownFields.map((field) => {
              const res = resolved.fields[field];
              if (res.status !== "known") return null;
              const def = FIELD_REGISTRY[field];
              const isEditing = editingField === field;
              const isQuoteOpen = expandedQuoteField === field;

              const relatedFacts = facts.filter((f) => res.factIds.includes(f.id));
              const evidenceQuote = relatedFacts.find((f) => f.evidence_text)?.evidence_text;

              return (
                <div
                  key={field}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                    isEditing
                      ? "sm:col-span-2 md:col-span-3 lg:col-span-2 bg-[var(--cream)] border-[var(--navy)]"
                      : "bg-[var(--cream)]/60 hover:bg-[var(--cream)] border-[var(--mist)]"
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Top Row: Label + Edit Icon */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--dusty-blue)] font-medium whitespace-nowrap">
                        {getShortLabel(field)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingField(isEditing ? null : field)}
                        title={isEditing ? "إلغاء التعديل" : "تصحيح القيمة"}
                        className="p-1.5 rounded-lg bg-[var(--paper)] hover:bg-[var(--navy)] text-[var(--navy)] hover:text-[var(--cream)] border border-[var(--mist)] transition-colors cursor-pointer shrink-0"
                      >
                        {isEditing ? (
                          <X className="w-3.5 h-3.5" />
                        ) : (
                          <Edit3 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Middle Row: Full Untruncated Value */}
                    <div className="text-base sm:text-lg font-extrabold text-[var(--navy)] font-body tabular-nums leading-snug whitespace-nowrap">
                      {formatFieldValue(field, res.value)}
                    </div>
                  </div>

                  {/* Bottom Row: Source Pill + Quote Toggle */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--mist)]/70">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--paper)] text-[var(--dusty-blue)] border border-[var(--mist)] font-medium">
                      {res.certainty === "user_stated" ? "مؤكد يدوياً" : "تلقائي"}
                    </span>

                    {evidenceQuote && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedQuoteField(isQuoteOpen ? null : field)
                        }
                        className="text-[11px] font-medium text-[var(--navy)] hover:underline cursor-pointer"
                      >
                        {isQuoteOpen ? "إخفاء الدليل" : "عرض الدليل"}
                      </button>
                    )}
                  </div>

                  {isQuoteOpen && evidenceQuote && (
                    <blockquote className="p-2.5 bg-[var(--paper)] rounded-xl border-r-2 border-[var(--navy)] text-sm text-[var(--navy)] italic leading-relaxed">
                      &quot;{evidenceQuote}&quot;
                    </blockquote>
                  )}

                  {isEditing && (
                    <div className="pt-2 border-t border-[var(--mist)]">
                      <InlineCorrectionForm
                        caseId={caseId}
                        propertyId={property.id}
                        field={field}
                        label={def.label}
                        buttonLabel="حفظ"
                        compact
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

      {/* 4. GROUP B: MISSING / UNKNOWN FIELDS (Full-Width Horizontal 3-Column Grid) */}
      {unknownFields.length > 0 && (
        <section className="bg-[var(--paper)] rounded-[24px] border border-[var(--mist)] shadow-[0_12px_40px_rgba(15,26,43,0.03)] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9A6700]" />
              <h2 className="text-base font-bold text-[var(--navy)] font-display flex items-center gap-2">
                <span>بيانات ناقصة</span>
                <span className="text-xs font-body font-semibold px-2.5 py-0.5 rounded-full bg-[#FFF9EC] text-[#9A6700] border border-[#F9E2AF]">
                  {unknownFields.length}
                </span>
              </h2>
            </div>
            <span className="text-xs text-[var(--dusty-blue)]">
              حدّد المتاح بنقرة لرفع الدقة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unknownFields.map((field) => {
              const def = FIELD_REGISTRY[field];
              const isExpanded = expandedUnknownField === field || def.isCritical;

              // Boolean fields render direct 1-click pills horizontally
              if (def.valueType === "boolean") {
                return (
                  <div
                    key={field}
                    className="p-3.5 bg-[var(--cream)]/70 rounded-2xl border border-[var(--mist)] flex items-center justify-between gap-3"
                  >
                    <span className="text-xs sm:text-sm font-bold text-[var(--navy)]">
                      {def.label}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <QuickSelectPill
                        caseId={caseId}
                        propertyId={property.id}
                        field={field}
                        value="متوفر"
                        label="✓ متوفر"
                      />
                      <QuickSelectPill
                        caseId={caseId}
                        propertyId={property.id}
                        field={field}
                        value="غير متوفر"
                        label="✕ لا يوجد"
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={field}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    def.isCritical
                      ? "bg-[#FFF9EC]/50 border-[#F9E2AF] space-y-2.5"
                      : "bg-[var(--cream)]/70 border-[var(--mist)] space-y-2.5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[var(--navy)]">
                        {def.label}
                      </span>
                      {def.isCritical && (
                        <span className="text-[10px] font-semibold text-[#9A6700] bg-[#FFF9EC] border border-[#F9E2AF] px-2 py-0.5 rounded-full">
                          أساسي
                        </span>
                      )}
                    </div>

                    {!def.isCritical && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedUnknownField(
                            expandedUnknownField === field ? null : field
                          )
                        }
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--paper)] hover:bg-[var(--navy)] text-[var(--navy)] hover:text-[var(--cream)] border border-[var(--mist)] text-xs font-medium transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <X className="w-3 h-3" />
                            <span>إلغاء</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>إضافة</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="space-y-2 pt-1 border-t border-[var(--mist)]/70">
                      {field === "bedrooms" && (
                        <div className="flex flex-wrap gap-1">
                          {["2", "3", "4", "5", "6"].map((num) => (
                            <QuickSelectPill
                              key={num}
                              caseId={caseId}
                              propertyId={property.id}
                              field={field}
                              value={num}
                              label={`${num} غرف`}
                            />
                          ))}
                        </div>
                      )}
                      {field === "floor_no" && (
                        <div className="flex flex-wrap gap-1">
                          {[
                            { label: "أرضي", val: "0" },
                            { label: "الأول", val: "1" },
                            { label: "الثاني", val: "2" },
                            { label: "الثالث", val: "3" },
                          ].map((preset) => (
                            <QuickSelectPill
                              key={preset.val}
                              caseId={caseId}
                              propertyId={property.id}
                              field={field}
                              value={preset.val}
                              label={preset.label}
                              onSuccess={() => setExpandedUnknownField(null)}
                            />
                          ))}
                        </div>
                      )}
                      {field === "property_age_years" && (
                        <div className="flex flex-wrap gap-1">
                          {[
                            { label: "جديد (0)", val: "0" },
                            { label: "سنة واحدة", val: "1" },
                            { label: "3 سنوات", val: "3" },
                            { label: "5 سنوات", val: "5" },
                          ].map((preset) => (
                            <QuickSelectPill
                              key={preset.val}
                              caseId={caseId}
                              propertyId={property.id}
                              field={field}
                              value={preset.val}
                              label={preset.label}
                              onSuccess={() => setExpandedUnknownField(null)}
                            />
                          ))}
                        </div>
                      )}
                      {field === "bathrooms" && (
                        <div className="flex flex-wrap gap-1">
                          {["2", "3", "4", "5"].map((num) => (
                            <QuickSelectPill
                              key={num}
                              caseId={caseId}
                              propertyId={property.id}
                              field={field}
                              value={num}
                              label={num}
                              onSuccess={() => setExpandedUnknownField(null)}
                            />
                          ))}
                        </div>
                      )}
                      <InlineCorrectionForm
                        caseId={caseId}
                        propertyId={property.id}
                        field={field}
                        label={def.label}
                        placeholder={`أدخل ${def.label}...`}
                        buttonLabel="حفظ"
                        compact
                        onSuccess={() => setExpandedUnknownField(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. GROUP D: MARKETING CLAIMS (Full-Width Horizontal Grid with Inline Filter Pills) */}
      {allClaims.length > 0 && (
        <section className="bg-[var(--paper)] rounded-[24px] border border-[var(--mist)] shadow-[0_12px_40px_rgba(15,26,43,0.03)] p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--navy)]" />
              <h2 className="text-base font-bold text-[var(--navy)] font-display flex items-center gap-2">
                <span>ادعاءات تسويقية</span>
                <span className="text-xs font-body font-semibold px-2.5 py-0.5 rounded-full bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] tabular-nums">
                  {allClaims.length}
                </span>
              </h2>
            </div>

            {/* Inline Filter Pills (Only shows non-empty categories when helpful) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveClaimTab("all")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  activeClaimTab === "all"
                    ? "bg-[var(--navy)] text-[var(--cream)]"
                    : "bg-[var(--cream)] text-[var(--dusty-blue)] hover:text-[var(--navy)] border border-[var(--mist)]"
                }`}
              >
                الكل ({allClaims.length})
              </button>
              {resolved.claims.unit.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveClaimTab("unit")}
                  className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 transition-all cursor-pointer ${
                    activeClaimTab === "unit"
                      ? "bg-[var(--navy)] text-[var(--cream)]"
                      : "bg-[var(--cream)] text-[var(--dusty-blue)] hover:text-[var(--navy)] border border-[var(--mist)]"
                  }`}
                >
                  <Home className="w-3 h-3" />
                  <span>الوحدة ({resolved.claims.unit.length})</span>
                </button>
              )}
              {resolved.claims.building.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveClaimTab("building")}
                  className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 transition-all cursor-pointer ${
                    activeClaimTab === "building"
                      ? "bg-[var(--navy)] text-[var(--cream)]"
                      : "bg-[var(--cream)] text-[var(--dusty-blue)] hover:text-[var(--navy)] border border-[var(--mist)]"
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>المبنى ({resolved.claims.building.length})</span>
                </button>
              )}
              {resolved.claims.neighborhood.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveClaimTab("neighborhood")}
                  className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 transition-all cursor-pointer ${
                    activeClaimTab === "neighborhood"
                      ? "bg-[var(--navy)] text-[var(--cream)]"
                      : "bg-[var(--cream)] text-[var(--dusty-blue)] hover:text-[var(--navy)] border border-[var(--mist)]"
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>الحي ({resolved.claims.neighborhood.length})</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {displayedClaims.map((c) => (
              <div
                key={c.id}
                className="px-3.5 py-2.5 rounded-xl bg-[var(--cream)]/70 border border-[var(--mist)] flex items-center justify-between gap-2 text-xs text-[var(--navy)]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)] shrink-0" />
                  <span className="leading-snug">{c.raw_text || String(c.value)}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--paper)] text-[var(--dusty-blue)] border border-[var(--mist)] shrink-0">
                  {c.bucket}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

