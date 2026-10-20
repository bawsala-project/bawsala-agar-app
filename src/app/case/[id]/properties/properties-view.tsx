"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Globe,
  Camera,
  FileEdit,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";
import { BawsalaCompass } from "@/components/brand/bawsala-compass";
import { FieldError } from "@/components/ui/field-error";
import {
  addProperty,
  removeProperty,
  retryExtraction,
  importClippedProperty,
  PropertyActionState,
} from "@/actions/properties";
import { createClient } from "@/lib/supabase/client";
import { validateImageFile, uploadPropertyImage } from "@/lib/storage";
import { resolveFacts, PropertyFact } from "@/lib/evidence/resolve";
import type { Database } from "@/types/database";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

export type PropertyWithExtraction = PropertyRow & {
  extraction_runs?: Array<{
    id: string;
    status: string;
    error_code: string | null;
    started_at: string;
    finished_at: string | null;
  }>;
  property_facts?: PropertyFact[];
};

interface PropertiesViewProps {
  caseId: string;
  userId: string;
  city?: string | null;
  properties: PropertyWithExtraction[];
  signedThumbnails: Record<string, string>;
}

function FormSubmitButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="btn-primary w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] disabled:bg-[var(--navy)] disabled:text-[var(--cream)]/70 disabled:cursor-not-allowed disabled:opacity-100 text-[var(--cream)] font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] opacity-100"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[var(--cream)] opacity-100 shrink-0" />
          <span className="text-[var(--cream)] text-base font-semibold opacity-100">جاري الإضافة والتحليل...</span>
        </>
      ) : (
        <>
          <span className="text-[var(--cream)] text-base font-semibold opacity-100">{children}</span>
          <Plus className="w-4 h-4 text-[var(--cream)] opacity-100 shrink-0" />
        </>
      )}
    </button>
  );
}

function getUrlHost(urlString: string | null): string {
  if (!urlString) return "";
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch {
    return urlString;
  }
}

function RetryExtractionButton({
  caseId,
  propertyId,
  label = "إعادة المحاولة",
}: {
  caseId: string;
  propertyId: string;
  label?: string;
}) {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const handleRetry = () => {
    setError(null);
    startTransition(async () => {
      const res = await retryExtraction(caseId, propertyId);
      if (!res.success && res.error) {
        if (res.error === "attempt_limit") {
          setError("الحد الأقصى 5 محاولات");
        } else {
          setError("فشلت المحاولة");
        }
      }
    });
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={handleRetry}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--cream)] hover:bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${pending ? "animate-spin" : ""}`} />
        <span>{label}</span>
      </button>
      {error && <span className="text-[11px] text-[#A62626] font-medium">{error}</span>}
    </div>
  );
}

function QuickPasteModal({
  caseId,
  propertyId,
  sourceUrl,
  isOpen,
  onClose,
}: {
  caseId: string;
  propertyId: string;
  sourceUrl: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!text.trim()) {
      setError("الرجاء لصق نص الصفحة أو مواصفات الإعلان أولاً");
      return;
    }
    setError(null);
    setPending(true);

    const res = await importClippedProperty(caseId, {
      propertyId,
      source_url: sourceUrl,
      text: text,
      title: "استيراد سريع - مواصفات منسوخة",
    });

    setPending(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || "تعذر الاستيراد، تأكد من صحة النص");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--navy)]/30 backdrop-blur-sm">
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.1)] max-w-lg w-full p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--mist)]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[var(--cream)] text-[var(--navy)] flex items-center justify-center border border-[var(--mist)]">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-body font-bold text-[var(--navy)]">
                استيراد سريع لبيانات الإعلان
              </h3>
              <p className="text-sm text-[var(--dusty-blue)]">
                الصق نص الإعلان مباشرة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:bg-[var(--cream)] rounded-xl transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-[var(--dusty-blue)] leading-relaxed bg-[var(--cream)] border border-[var(--mist)] p-3.5 rounded-2xl">
          افتح الإعلان، حدد الكل (<kbd className="bg-[var(--paper)] px-1.5 py-0.5 rounded border border-[var(--mist)] font-mono text-[11px] text-[var(--navy)]">Ctrl+A</kbd> أو <kbd className="bg-[var(--paper)] px-1.5 py-0.5 rounded border border-[var(--mist)] font-mono text-[11px] text-[var(--navy)]">⌘+A</kbd>)، ثم الصق هنا.
        </p>

        <div className="space-y-2">
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="الصق نص أو مواصفات الإعلان المنسوخة هنا..."
            className="w-full text-xs p-4 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all font-mono"
          />
          {error && (
            <div className="p-3 rounded-xl bg-[#FDF1F0] border border-[#F6CBC8] text-[#A62626] text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="px-4 py-2 rounded-full border border-[var(--mist)] text-xs font-medium text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:border-[var(--navy)] transition-all cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={pending}
            className="px-6 py-2 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] text-xs font-body font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {pending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جارٍ قراءة بيانات الشقة...</span>
              </>
            ) : (
              <span>إضافة الشقة المرشحة ←</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PropertiesView({
  caseId,
  userId,
  city,
  properties,
  signedThumbnails,
}: PropertiesViewProps) {
  const [activeTab, setActiveTab] = useState<"url" | "image" | "manual">("url");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quickPasteProp, setQuickPasteProp] = useState<{ id: string; url: string } | null>(null);

  // Forms actions
  const addActionWithId = addProperty.bind(null, caseId);
  const initialActionState: PropertyActionState = { errors: {} };

  // URL Tab state
  const [urlState, urlAction] = useActionState(addActionWithId, initialActionState);
  const urlFormRef = useRef<HTMLFormElement>(null);

  // Manual Tab state
  const [manualState, manualAction] = useActionState(addActionWithId, initialActionState);
  const manualFormRef = useRef<HTMLFormElement>(null);
  const [manualPrice, setManualPrice] = useState("");

  // Image Tab state
  const [imageState, imageAction] = useActionState(addActionWithId, initialActionState);
  const imageFormRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ path: string; name: string; previewUrl: string }>
  >([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadedPaths = uploadedImages.map((img) => img.path);

  // Reset forms on success
  useEffect(() => {
    if (urlState?.success) {
      urlFormRef.current?.reset();
    }
  }, [urlState]);

  useEffect(() => {
    if (manualState?.success) {
      manualFormRef.current?.reset();
      setManualPrice("");
    }
  }, [manualState]);

  useEffect(() => {
    if (imageState?.success) {
      imageFormRef.current?.reset();
      setUploadedImages([]);
      setUploadError(null);
    }
  }, [imageState]);

  const handleDelete = async (propId: string) => {
    setDeletingId(propId);
    await removeProperty(caseId, propId);
    setDeletingId(null);
  };

  const handleRemoveUploadedImage = (pathToRemove: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.path !== pathToRemove));
    setUploadError(null);
  };

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 4 - uploadedImages.length;
    if (remainingSlots <= 0) {
      setUploadError("الحد الأقصى هو 4 صور لكل عقار. احذف صورة إذا أردت استبدالها.");
      e.target.value = "";
      return;
    }

    if (files.length > remainingSlots) {
      setUploadError(
        `الحد الأقصى هو 4 صور لكل عقار (متبقي ${remainingSlots} ${
          remainingSlots === 1 ? "صورة" : "صور"
        } فقط).`
      );
      e.target.value = "";
      return;
    }

    // Validate all files first
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setUploadError(validation.error);
        e.target.value = "";
        return;
      }
    }

    // Upload to Supabase bucket and append to existing uploadedImages
    setIsUploading(true);
    const supabase = createClient();
    const newlyUploaded: Array<{ path: string; name: string; previewUrl: string }> = [];

    for (const file of files) {
      const res = await uploadPropertyImage(supabase, userId, caseId, file);
      if ("error" in res) {
        setUploadError(res.error);
        setIsUploading(false);
        e.target.value = "";
        return;
      }
      const previewUrl =
        typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(file)
          : "";
      newlyUploaded.push({
        path: res.path,
        name: file.name,
        previewUrl,
      });
    }

    setUploadedImages((prev) => [...prev, ...newlyUploaded]);
    setIsUploading(false);
    e.target.value = "";
  };

  const isMaxReached = properties.length >= 5;
  const parsedManualPrice = Number(manualPrice);
  const showPricePreview = !isNaN(parsedManualPrice) && parsedManualPrice > 0;

  return (
    <div className="space-y-8">
      {/* Hero / Page Intro */}
      <section className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--mist)] text-[var(--dusty-blue)] text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--navy)]" />
          <span>المرحلة الثانية</span>
          {city && (
            <>
              <span>•</span>
              <span className="font-bold text-[var(--navy)]">{city}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold font-display text-[var(--navy)] tracking-tight leading-[1.3]">
          أضف الشقق المرشحة <br className="hidden sm:block" />
          <span className="text-[var(--midnight)]">
            من 1 إلى 5 شقق
          </span>
        </h1>
        <p className="text-sm text-[var(--dusty-blue)] leading-relaxed max-w-2xl mx-auto">
          برابط، أو صور، أو يدوياً.
        </p>
      </section>

      {/* Properties List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
            <h2 className="text-base sm:text-lg font-bold font-display text-[var(--navy)]">
              العقارات المضافة
            </h2>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--paper)] text-[var(--dusty-blue)] border border-[var(--mist)]">
            {properties.length} من 5 عقارات
          </span>
        </div>

        {properties.length === 0 ? (
          <div className="bg-[var(--paper)] rounded-[28px] border border-dashed border-[var(--mist)] p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] mx-auto flex items-center justify-center p-3">
              <BawsalaCompass size={32} animateHover />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--navy)] font-body">لا عقارات بعد</h3>
              <p className="text-sm text-[var(--dusty-blue)] max-w-sm mx-auto leading-relaxed">
                أضف أول شقة من النموذج أدناه.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {properties.map((p, index) => {
              const thumbnail =
                p.image_paths && p.image_paths.length > 0
                  ? signedThumbnails[p.image_paths[0]]
                  : null;

              const modeLabel =
                p.input_mode === "url"
                  ? "رابط إعلان"
                  : p.input_mode === "image"
                  ? "صور مرفوعة"
                  : "إدخال يدوي";

              const displayName =
                p.input_mode === "url"
                  ? getUrlHost(p.source_url)
                  : p.input_mode === "manual"
                  ? [p.title, p.district].filter(Boolean).join(" - ")
                  : p.notes || `صور العقار (${p.image_paths.length})`;

              return (
                <div
                  key={p.id}
                  className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,26,43,0.04)] hover:border-[var(--navy)] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden text-[var(--navy)]"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail or Icon */}
                    {thumbnail ? (
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[var(--mist)] shrink-0">
                        <Image
                          src={thumbnail}
                          alt="صورة العقار"
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-[var(--cream)] flex flex-col items-center justify-center text-[var(--navy)] font-bold shrink-0 border border-[var(--mist)] text-xs gap-1">
                        {p.input_mode === "url" ? (
                          <Globe className="w-5 h-5 text-[var(--navy)]" />
                        ) : p.input_mode === "image" ? (
                          <Camera className="w-5 h-5 text-[var(--dusty-blue)]" />
                        ) : (
                          <FileEdit className="w-5 h-5 text-[var(--dusty-blue)]" />
                        )}
                        <span className="text-[10px] text-[var(--dusty-blue)]">عقار #{index + 1}</span>
                      </div>
                    )}

                    {/* Content Details */}
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]">
                          {modeLabel}
                        </span>
                        <Link
                          href={`/case/${caseId}/properties/${p.id}`}
                          className="text-sm sm:text-base font-body font-bold text-[var(--navy)] hover:text-[var(--midnight)] truncate transition-colors inline-block"
                        >
                          {displayName}
                        </Link>
                      </div>

                      {/* Fact Chips */}
                      {(() => {
                        const resolved = resolveFacts(p.property_facts || []);
                        const displayPrice =
                          p.listing_price_sar ||
                          (resolved.fields.listing_price_sar?.status === "known"
                            ? Number(resolved.fields.listing_price_sar.value)
                            : null);
                        const displayArea =
                          p.area_sqm ||
                          (resolved.fields.area_sqm?.status === "known"
                            ? Number(resolved.fields.area_sqm.value)
                            : null);
                        const displayBedrooms =
                          p.bedrooms ||
                          (resolved.fields.bedrooms?.status === "known"
                            ? Number(resolved.fields.bedrooms.value)
                            : null);
                        const displayFloor =
                          p.floor_no ??
                          (resolved.fields.floor_no?.status === "known"
                            ? Number(resolved.fields.floor_no.value)
                            : null);

                        return (
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {displayPrice && (
                              <span className="font-body font-bold text-[var(--navy)] bg-[var(--cream)] border border-[var(--mist)] px-3 py-1 rounded-xl tabular-nums">
                                {Number(displayPrice).toLocaleString("en-US")} ر.س
                              </span>
                            )}
                            {displayArea && (
                              <span className="bg-[var(--cream)] text-[var(--dusty-blue)] font-medium px-2.5 py-1 rounded-xl border border-[var(--mist)] tabular-nums">
                                {displayArea} م²
                              </span>
                            )}
                            {displayBedrooms && (
                              <span className="bg-[var(--cream)] text-[var(--dusty-blue)] font-medium px-2.5 py-1 rounded-xl border border-[var(--mist)] tabular-nums">
                                {displayBedrooms} غرف
                              </span>
                            )}
                            {displayFloor !== null && displayFloor !== undefined && (
                              <span className="bg-[var(--cream)] text-[var(--dusty-blue)] font-medium px-2.5 py-1 rounded-xl border border-[var(--mist)] tabular-nums">
                                الدور {displayFloor}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {p.notes && p.input_mode !== "image" && (
                        <p className="text-sm text-[var(--dusty-blue)] truncate max-w-md">{p.notes}</p>
                      )}

                      {/* Extraction Status & Conflict Counts */}
                      {(() => {
                        const latestRun =
                          p.extraction_runs && p.extraction_runs.length > 0
                            ? [...p.extraction_runs].sort(
                                (a, b) =>
                                  new Date(b.started_at).getTime() -
                                  new Date(a.started_at).getTime()
                              )[0]
                            : null;
                        const factsCount = p.property_facts?.length ?? 0;
                        const resolved = resolveFacts(p.property_facts || []);
                        const conflictingCount = Object.values(resolved.fields).filter(
                          (f) => f.status === "conflicting"
                        ).length;
                        const unknownCount = Object.values(resolved.fields).filter(
                          (f) => f.status === "unknown"
                        ).length;

                        return (
                          <div className="space-y-2 pt-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {latestRun?.status === "running" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)] animate-pulse" />
                                  جارٍ قراءة بيانات الشقة...
                                </span>
                              )}

                              {latestRun?.status === "succeeded" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6B43]" />
                                  تم استخراج {factsCount} حقيقة مدققة
                                </span>
                              )}

                              {latestRun?.status === "failed" && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8]">
                                    <AlertTriangle className="w-3.5 h-3.5 text-[#A62626]" />
                                    تعذر الاستخراج الآلي
                                  </span>
                                  <RetryExtractionButton caseId={caseId} propertyId={p.id} />
                                </div>
                              )}

                              {!latestRun && (
                                <RetryExtractionButton
                                  caseId={caseId}
                                  propertyId={p.id}
                                  label="بدء الاستخراج"
                                />
                              )}

                              <span className="text-[11px] text-[var(--dusty-blue)] bg-[var(--cream)] border border-[var(--mist)] px-2.5 py-0.5 rounded-full font-medium">
                                {conflictingCount} متعارضة • {unknownCount} ناقصة
                              </span>
                            </div>

                            {latestRun?.status === "failed" && p.input_mode === "url" && (
                              <div className="space-y-2 bg-[#FFF9EC] border border-[#F9E2AF] rounded-2xl p-3">
                                <p className="text-sm text-[var(--navy)] leading-relaxed font-medium">
                                  المنصة تمنع الجلب الآلي.
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setQuickPasteProp({ id: p.id, url: p.source_url || "" })
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] text-xs font-body font-bold transition-all shadow-xs cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>استيراد سريع (لصق بيانات الصفحة)</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--mist)]">
                    <Link
                      href={`/case/${caseId}/properties/${p.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--navy)] text-[var(--cream)] hover:bg-[var(--midnight)] text-xs font-body font-bold transition-colors cursor-pointer"
                    >
                      <span>مراجعة البيانات</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      disabled={deletingId === p.id}
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-[var(--dusty-blue)] hover:text-[#A62626] hover:bg-[#FDF1F0] rounded-xl transition-all cursor-pointer"
                      title="حذف العقار"
                    >
                      {deletingId === p.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#A62626]" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Property Panel */}
      {!isMaxReached ? (
        <section className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.04)] p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-[var(--navy)]">
                  إضافة عقار مرشح جديد
                </h2>
                <p className="text-sm text-[var(--dusty-blue)] mt-0.5">
                  نستخرج البيانات ونتحقق منها
                </p>
              </div>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]">
              {5 - properties.length} خانات متبقية
            </span>
          </div>

          {/* Segmented Mode Selector */}
          <div className="inline-flex p-1.5 rounded-full bg-[var(--cream)] border border-[var(--mist)] gap-1.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`px-5 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "url"
                  ? "bg-[var(--navy)] text-[var(--cream)] shadow-xs"
                  : "text-[var(--dusty-blue)] hover:text-[var(--navy)]"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>رابط الإعلان</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={`px-5 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "image"
                  ? "bg-[var(--navy)] text-[var(--cream)] shadow-xs"
                  : "text-[var(--dusty-blue)] hover:text-[var(--navy)]"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>لقطات شاشة / صور</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`px-5 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "manual"
                  ? "bg-[var(--navy)] text-[var(--cream)] shadow-xs"
                  : "text-[var(--dusty-blue)] hover:text-[var(--navy)]"
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>إدخال يدوي</span>
            </button>
          </div>

          {/* Tab 1: URL */}
          {activeTab === "url" && (
            <form ref={urlFormRef} action={urlAction} className="space-y-4">
              <input type="hidden" name="input_mode" value="url" />

              <div className="space-y-2">
                <label htmlFor="source_url" className="block text-xs font-medium text-[var(--navy)]">
                  رابط إعلان العقار (sa.aqar.fm أو wasalt.com)
                </label>
                <input
                  id="source_url"
                  name="source_url"
                  type="url"
                  required
                  placeholder="https://sa.aqar.fm/شقق-للبيع/..."
                  className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-xs sm:text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all font-mono"
                />
                {urlState?.errors?.source_url?.[0] && (
                  <FieldError message={urlState.errors.source_url[0]} />
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="url_notes" className="block text-xs font-medium text-[var(--navy)]">
                  ملاحظات أولية (اختياري)
                </label>
                <input
                  id="url_notes"
                  name="notes"
                  type="text"
                  placeholder="مثال: الواجهة جنوبية، قريب من الخدمات"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-xs sm:text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all"
                />
                {urlState?.errors?.notes?.[0] && (
                  <FieldError message={urlState.errors.notes[0]} />
                )}
              </div>

              {urlState?.errors?.form?.[0] && (
                <div className="p-3 rounded-xl bg-[#FDF1F0] border border-[#F6CBC8] text-[#A62626] text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{urlState.errors.form[0]}</span>
                </div>
              )}

              <div className="pt-2">
                <FormSubmitButton>إضافة العقار</FormSubmitButton>
              </div>
            </form>
          )}

          {/* Tab 2: Images */}
          {activeTab === "image" && (
            <form ref={imageFormRef} action={imageAction} className="space-y-4">
              <input type="hidden" name="input_mode" value="image" />
              <input
                type="hidden"
                name="image_paths"
                value={JSON.stringify(uploadedPaths)}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-[var(--navy)]">
                    صور الإعلان (1–4)
                  </label>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]">
                    {uploadedImages.length} / 4 صور مرفوعة
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFilesSelect}
                  disabled={isUploading || uploadedImages.length >= 4}
                  className="hidden"
                />

                {uploadedImages.length < 4 && (
                  <div
                    onClick={() => {
                      if (!isUploading && uploadedImages.length < 4) {
                        fileInputRef.current?.click();
                      }
                    }}
                    className="p-6 rounded-2xl border-2 border-dashed border-[var(--mist)] bg-[var(--cream)] hover:bg-[var(--paper)] hover:border-[var(--navy)] transition-all text-center cursor-pointer space-y-2.5"
                  >
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] text-xs font-bold shadow-xs transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      <span>
                        {uploadedImages.length === 0
                          ? "اختر حتى 4 صور"
                          : `إضافة صورة أخرى (متبقي ${4 - uploadedImages.length} من 4)`}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--dusty-blue)]">
                      JPEG أو PNG أو WebP • حتى 8MB
                    </p>
                  </div>
                )}

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {uploadedImages.map((img, idx) => (
                      <div
                        key={img.path}
                        className="relative rounded-2xl border border-[var(--mist)] bg-[var(--cream)] p-2.5 flex flex-col gap-2 group"
                      >
                        <div className="relative w-full h-24 rounded-xl overflow-hidden bg-[var(--paper)] border border-[var(--mist)] flex items-center justify-center">
                          {img.previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img.previewUrl}
                              alt={img.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-6 h-6 text-[var(--dusty-blue)]" />
                          )}
                          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-[var(--navy)]/85 text-[var(--cream)] text-[10px] font-bold">
                            {`صورة #${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedImage(img.path)}
                            className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8] flex items-center justify-center hover:bg-[#A62626] hover:text-white transition-colors cursor-pointer"
                            title="حذف الصورة"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] text-[var(--navy)] font-medium truncate px-1">
                          {img.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {isUploading && (
                  <div className="flex items-center gap-2 text-xs text-[var(--navy)]">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--navy)]" />
                    <span>جارٍ رفع الصور...</span>
                  </div>
                )}

                {uploadedImages.length > 0 && !isUploading && (
                  <div className="flex items-center gap-2 text-xs text-[#1E6B43]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      تم رفع {uploadedImages.length} من 4 صور بنجاح وجاهزة للتحليل
                    </span>
                  </div>
                )}

                {uploadError && (
                  <div className="p-3 rounded-xl bg-[#FDF1F0] border border-[#F6CBC8] text-[#A62626] text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {imageState?.errors?.image_paths?.[0] && (
                  <FieldError message={imageState.errors.image_paths[0]} />
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="image_notes" className="block text-xs font-medium text-[var(--navy)]">
                  ملاحظات (اختياري)
                </label>
                <input
                  id="image_notes"
                  name="notes"
                  type="text"
                  placeholder="مثال: لقطات شاشة من حساب تويتر المطور"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-xs sm:text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all"
                />
                {imageState?.errors?.notes?.[0] && (
                  <FieldError message={imageState.errors.notes[0]} />
                )}
              </div>

              {imageState?.errors?.form?.[0] && (
                <div className="p-3 rounded-xl bg-[#FDF1F0] border border-[#F6CBC8] text-[#A62626] text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{imageState.errors.form[0]}</span>
                </div>
              )}

              <div className="pt-2">
                <FormSubmitButton disabled={isUploading || uploadedPaths.length === 0}>
                  إضافة الصور
                </FormSubmitButton>
              </div>
            </form>
          )}

          {/* Tab 3: Manual */}
          {activeTab === "manual" && (
            <form ref={manualFormRef} action={manualAction} className="space-y-4">
              <input type="hidden" name="input_mode" value="manual" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="manual_title" className="block text-xs font-medium text-[var(--navy)]">
                    عنوان العقار <span className="text-[#A62626]">*</span>
                  </label>
                  <input
                    id="manual_title"
                    name="title"
                    type="text"
                    required
                    placeholder="مثال: شقة مودرن بواجهة جنوبية"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-xs sm:text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all"
                  />
                  {manualState?.errors?.title?.[0] && (
                    <FieldError message={manualState.errors.title[0]} />
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="manual_price" className="block text-xs font-medium text-[var(--navy)]">
                    السعر المطلوب (ر.س) <span className="text-[#A62626]">*</span>
                  </label>
                  <input
                    id="manual_price"
                    name="listing_price_sar"
                    type="number"
                    required
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder="مثال: 850000"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-xs sm:text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all tabular-nums"
                  />
                  {showPricePreview && (
                    <p className="text-sm text-[var(--navy)] font-body font-bold tabular-nums">
                      المبلغ: {parsedManualPrice.toLocaleString("en-US")} ر.س
                    </p>
                  )}
                  {manualState?.errors?.listing_price_sar?.[0] && (
                    <FieldError message={manualState.errors.listing_price_sar[0]} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="manual_area" className="block text-xs font-medium text-[var(--navy)]">
                    المساحة الإجمالية (م²) <span className="text-[#A62626]">*</span>
                  </label>
                  <input
                    id="manual_area"
                    name="area_sqm"
                    type="number"
                    step="0.1"
                    required
                    placeholder="مثال: 145"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-xs sm:text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all tabular-nums"
                  />
                  {manualState?.errors?.area_sqm?.[0] && (
                    <FieldError message={manualState.errors.area_sqm[0]} />
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="manual_district" className="block text-xs font-medium text-[var(--navy)]">
                    الحي (اختياري)
                  </label>
                  <input
                    id="manual_district"
                    name="district"
                    type="text"
                    placeholder="مثال: حي الملقا"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-xs sm:text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all"
                  />
                  {manualState?.errors?.district?.[0] && (
                    <FieldError message={manualState.errors.district[0]} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="manual_bedrooms" className="block text-xs font-medium text-[var(--navy)]">
                    عدد غرف النوم
                  </label>
                  <input
                    id="manual_bedrooms"
                    name="bedrooms"
                    type="number"
                    placeholder="مثال: 3"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-xs sm:text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all"
                  />
                  {manualState?.errors?.bedrooms?.[0] && (
                    <FieldError message={manualState.errors.bedrooms[0]} />
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="manual_floor" className="block text-xs font-medium text-[var(--navy)]">
                    رقم الدور
                  </label>
                  <input
                    id="manual_floor"
                    name="floor_no"
                    type="number"
                    placeholder="مثال: 2"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-xs sm:text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all"
                  />
                  {manualState?.errors?.floor_no?.[0] && (
                    <FieldError message={manualState.errors.floor_no[0]} />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="manual_notes" className="block text-xs font-medium text-[var(--navy)]">
                  ملاحظات (اختياري)
                </label>
                <input
                  id="manual_notes"
                  name="notes"
                  type="text"
                  placeholder="أي تفاصيل أخرى (مثال: مطبخ راكب، مصعد، موقف خاص)"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-xs sm:text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all"
                />
                {manualState?.errors?.notes?.[0] && (
                  <FieldError message={manualState.errors.notes[0]} />
                )}
              </div>

              {manualState?.errors?.form?.[0] && (
                <div className="p-3 rounded-xl bg-[#FDF1F0] border border-[#F6CBC8] text-[#A62626] text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{manualState.errors.form[0]}</span>
                </div>
              )}

              <div className="pt-2">
                <FormSubmitButton>حفظ العقار</FormSubmitButton>
              </div>
            </form>
          )}
        </section>
      ) : (
        <div className="bg-[var(--paper)] border border-[var(--mist)] rounded-[28px] p-6 text-center text-xs sm:text-sm font-medium text-[var(--dusty-blue)]">
          وصلت للحد الأقصى (5). احذف عقاراً لإضافة بديل.
        </div>
      )}

      {/* Continue Action Bar */}
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 shadow-[0_20px_60px_rgba(15,26,43,0.04)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-[var(--dusty-blue)]">
          <ShieldCheck className="w-4 h-4 text-[#1E6B43] shrink-0" />
          <span>
            {properties.length === 0
              ? "أضف عقاراً واحداً للمتابعة"
              : properties.length === 1 ? "جاهز للفحص المجاني (عقار واحد)" : `جاهز للفحص المجاني (${properties.length} شقق)`}
          </span>
        </div>

        {properties.length >= 1 ? (
          <Link href={`/case/${caseId}/preflight`} className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-body font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98]"
            >
              <span>متابعة للفحص المبدئي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] font-body font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-not-allowed opacity-60"
          >
            <span>متابعة للفحص المبدئي</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Paste Modal */}
      {quickPasteProp && (
        <QuickPasteModal
          caseId={caseId}
          propertyId={quickPasteProp.id}
          sourceUrl={quickPasteProp.url}
          isOpen={true}
          onClose={() => setQuickPasteProp(null)}
        />
      )}
    </div>
  );
}
