"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatSAR } from "@/lib/utils";
import { FIELD_REGISTRY, FieldKey, ResolvableFieldKey } from "@/lib/evidence/fields";
import { ResolveFactsResult, PropertyFact } from "@/lib/evidence/resolve";
import { submitCorrection } from "@/actions/evidence";
import type { Database } from "@/types/database";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyDetailsViewProps {
  caseId: string;
  property: PropertyRow;
  facts: PropertyFact[];
  resolved: ResolveFactsResult;
}

function getSourceLabel(source: string): string {
  switch (source) {
    case "url":
      return "الرابط";
    case "image":
      return "الصورة";
    case "manual":
    case "user_correction":
      return "إدخالك";
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
      <Button
        type="button"
        variant="secondary"
        pending={pending}
        disabled={pending}
        onClick={handleAdopt}
        className="text-xs px-2.5 py-1.5 h-auto"
      >
        اعتمد هذه القيمة
      </Button>
      {error && <span className="text-[11px] text-red-600 font-medium">{error}</span>}
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
        value: val,
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
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center mt-2 w-full">
      <div className="flex-1 w-full">
        <Input
          id={`corr-${field}`}
          name="value"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder || `أدخل ${label}`}
          error={error || undefined}
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        disabled={pending || !val.trim()}
        className="text-xs px-3 py-2 w-full sm:w-auto h-auto flex-shrink-0"
      >
        {buttonLabel}
      </Button>
    </form>
  );
}

export function PropertyDetailsView({
  caseId,
  property,
  facts,
  resolved,
}: PropertyDetailsViewProps) {
  // Editing state for known fields
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
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header and back link */}
      <div>
        <Link
          href={`/case/${caseId}/properties`}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 mb-3"
        >
          ← العودة إلى العقارات
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-xs text-gray-500 mt-1">
              مراجعة وتدقيق الحقائق المستخرجة وتأكيدها لاتخاذ قرار الشراء
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded bg-gray-100 text-gray-700 self-start sm:self-center">
            {property.input_mode === "url"
              ? "رابط إلكتروني"
              : property.input_mode === "image"
              ? "صور إعلان"
              : "إدخال يدوي"}
          </span>
        </div>
      </div>

      {/* Group A: معلومات متعارضة */}
      {conflictingFields.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-red-200 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <h2 className="text-lg font-bold text-red-900">
              معلومات متعارضة ({conflictingFields.length})
            </h2>
          </div>

          <div className="space-y-4">
            {conflictingFields.map((field) => {
              const res = resolved.fields[field];
              if (res.status !== "conflicting") return null;
              const def = FIELD_REGISTRY[field];

              return (
                <div
                  key={field}
                  className="p-4 bg-red-50/50 rounded-lg border border-red-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900">{def.label}</h3>
                    {def.isCritical && (
                      <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                        أساسي
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600">
                    تم رصد قيم مختلفة لهذه المعلومة من مصادر متعددة، يرجى اعتماد القيمة الصحيحة أو إدخال القيمة الفعلية:
                  </p>

                  {/* Candidates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {res.candidates.map((cand, idx) => {
                      const candFacts = facts.filter((f) => cand.factIds.includes(f.id));
                      const quotes = candFacts
                        .map((f) => f.evidence_text)
                        .filter(Boolean) as string[];

                      return (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-md border border-gray-200 flex flex-col justify-between gap-2 shadow-sm"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-sm font-bold text-gray-900">
                                {formatFieldValue(field, cand.value)}
                              </span>
                              <div className="flex gap-1 flex-wrap">
                                {cand.sources.map((s, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium"
                                  >
                                    {getSourceLabel(s)}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {quotes.length > 0 && (
                              <p className="text-xs text-gray-500 italic mt-1.5 line-clamp-2">
                                &quot;{quotes[0]}&quot;
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-gray-100">
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

                  {/* Manual Override */}
                  <div className="pt-2 border-t border-red-200">
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      أو أدخل قيمة أخرى مختلفة:
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

      {/* Group B: معلومات ناقصة */}
      {unknownFields.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">
              معلومات ناقصة ({unknownFields.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {unknownFields.map((field) => {
              const def = FIELD_REGISTRY[field];

              return (
                <div
                  key={field}
                  className="p-4 bg-white rounded-lg border border-gray-200 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">{def.label}</span>
                    {def.isCritical ? (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        مهم للمقارنة
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">غير متوفر</span>
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

      {/* Group C: معلومات معروفة */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-green-200 pb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
          <h2 className="text-lg font-bold text-gray-900">
            معلومات معروفة ({knownFields.length})
          </h2>
        </div>

        {knownFields.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            لم يتم تأكيد أو استخراج معلومات معروفة بعد
          </p>
        ) : (
          <div className="divide-y divide-gray-100 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {knownFields.map((field) => {
              const res = resolved.fields[field];
              if (res.status !== "known") return null;
              const def = FIELD_REGISTRY[field];
              const isEditing = editingField === field;

              // Find evidence quote from facts
              const relatedFacts = facts.filter((f) => res.factIds.includes(f.id));
              const evidenceQuote = relatedFacts.find((f) => f.evidence_text)?.evidence_text;

              return (
                <div key={field} className="p-4 space-y-2 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">{def.label}:</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">
                        {formatFieldValue(field, res.value)}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          res.certainty === "user_stated"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {res.certainty === "user_stated" ? "من إدخالك" : "من الإعلان"}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditingField(isEditing ? null : field)}
                      className="text-xs text-blue-600 hover:text-blue-800 self-start sm:self-center px-2 py-1 h-auto"
                    >
                      {isEditing ? "إلغاء" : "تصحيح"}
                    </Button>
                  </div>

                  {evidenceQuote && (
                    <details className="text-xs text-gray-600 pt-1">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700 select-none">
                        عرض الدليل من الإعلان
                      </summary>
                      <blockquote className="mt-1.5 p-2 bg-gray-50 rounded border-r-2 border-gray-300 italic text-gray-700">
                        &quot;{evidenceQuote}&quot;
                      </blockquote>
                    </details>
                  )}

                  {isEditing && (
                    <div className="pt-2 border-t border-gray-100 mt-2">
                      <InlineCorrectionForm
                        caseId={caseId}
                        propertyId={property.id}
                        field={field}
                        label={def.label}
                        buttonLabel="تحديث"
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

      {/* Listing Claims Section */}
      <section className="space-y-4 pt-4 border-t border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900">مميزات وادعاءات تسويقية</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            ادعاءات من الإعلان لم يتم التحقق منها.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Unit Claims */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-1">
              الوحدة ({resolved.claims.unit.length})
            </h3>
            {resolved.claims.unit.length === 0 ? (
              <p className="text-xs text-gray-400">لا توجد ادعاءات مسجلة</p>
            ) : (
              <ul className="text-xs text-gray-700 space-y-1.5">
                {resolved.claims.unit.map((c) => (
                  <li key={c.id} className="flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{c.raw_text || String(c.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Building Claims */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-1">
              المبنى ({resolved.claims.building.length})
            </h3>
            {resolved.claims.building.length === 0 ? (
              <p className="text-xs text-gray-400">لا توجد ادعاءات مسجلة</p>
            ) : (
              <ul className="text-xs text-gray-700 space-y-1.5">
                {resolved.claims.building.map((c) => (
                  <li key={c.id} className="flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{c.raw_text || String(c.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Neighborhood Claims */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-1">
              الحي ({resolved.claims.neighborhood.length})
            </h3>
            {resolved.claims.neighborhood.length === 0 ? (
              <p className="text-xs text-gray-400">لا توجد ادعاءات مسجلة</p>
            ) : (
              <ul className="text-xs text-gray-700 space-y-1.5">
                {resolved.claims.neighborhood.map((c) => (
                  <li key={c.id} className="flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{c.raw_text || String(c.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
