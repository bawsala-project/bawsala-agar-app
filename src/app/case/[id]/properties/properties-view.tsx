"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { formatSAR } from "@/lib/utils";
import { addProperty, removeProperty, retryExtraction, importClippedProperty, PropertyActionState } from "@/actions/properties";
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
    <Button
      type="submit"
      variant="primary"
      pending={pending}
      disabled={disabled || pending}
      className="w-full sm:w-auto"
    >
      {children}
    </Button>
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
      <Button
        type="button"
        variant="secondary"
        pending={pending}
        disabled={pending}
        onClick={handleRetry}
        className="text-xs px-2.5 py-1 h-auto"
      >
        {label}
      </Button>
      {error && <span className="text-[11px] text-red-600 font-medium">{error}</span>}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("يرجى لصق نص أو محتوى الإعلان");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const res = await importClippedProperty(caseId, {
        source_url: sourceUrl,
        propertyId,
        text: text.trim(),
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.error || "فشل استخراج البيانات من النص الملصق.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h3 className="font-bold text-gray-900 text-base">استيراد نص الإعلان (تجاوز الحظر)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          افتح صفحة الإعلان في متصفحك، اضغط <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300 font-mono text-[11px]">Ctrl+A</kbd> ثم <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300 font-mono text-[11px]">Ctrl+C</kbd> والصق النص هنا. سيقوم الذكاء الاصطناعي باستخراج كافة المواصفات والأسعار وتدقيقها فوراً.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            rows={7}
            required
            placeholder="الصق نص صفحة الإعلان هنا..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={pending}
            className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={onClose}
              className="text-xs px-3"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              pending={pending}
              disabled={pending}
              className="text-xs px-4"
            >
              {pending ? "جارٍ تحليل المواصفات..." : "استخراج المواصفات فوراً"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BookmarkletBanner({ caseId }: { caseId: string }) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const bookmarkletCode = `javascript:(function(){try{var u=window.location.href,t=document.title,nd='';if(window.__NEXT_DATA__?.props?.pageProps){try{nd='[بيانات المنصة]: '+JSON.stringify(window.__NEXT_DATA__.props.pageProps)+'\\n\\n';}catch(e){}}var b=(document.body.innerText||'').slice(0,35000);var w=window.open('${origin}/case/${caseId}/clip','bawsala_clipper','width=520,height=650');var h=function(e){if(e.data==='bawsala-ready'){w.postMessage({type:'bawsala-clip-data',url:u,title:t,text:nd+b},'*');window.removeEventListener('message',h);}};window.addEventListener('message',h);}catch(err){alert('خطأ: '+err.message);}})();`;

  const copyCode = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-blue-50 border border-blue-200/70 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-blue-900 text-sm">
          <span>📌</span>
          <span>كليبر المتصفح لتجاوز حظر المنصات (عقار / وصلت)</span>
        </div>
        <p className="text-xs text-blue-800/80 leading-relaxed max-w-xl">
          لتجاوز حظر Cloudflare: اسحب الزر أدناه إلى <strong>شريط الإشارات (Bookmarks Bar)</strong> في متصفحك. عند تصفح أي إعلان، اضغط الزر ليتم استيراد كافة المواصفات فوراً!
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href={bookmarkletCode}
          draggable="true"
          onClick={(e) => {
            if (e.isTrusted && !e.defaultPrevented) {
              window.open(`${origin}/case/${caseId}/clip`, "bawsala_clipper", "width=520,height=650");
              e.preventDefault();
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm cursor-grab active:cursor-grabbing transition-colors"
          title="اسحب هذا الزر إلى شريط إشارات المتصفح"
        >
          <span>📌</span>
          <span>اسحب لإشارات المتصفح</span>
        </a>

        <button
          type="button"
          onClick={copyCode}
          className="px-2.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-medium transition-colors"
        >
          {copied ? "✓ تم نسخ الكود" : "نسخ الكود"}
        </button>
      </div>
    </div>
  );
}

export function PropertiesView({
  caseId,
  userId,
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
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessCount, setUploadSuccessCount] = useState(0);

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
      setUploadedPaths([]);
      setUploadSuccessCount(0);
      setUploadError(null);
    }
  }, [imageState]);

  const handleDelete = async (propId: string) => {
    setDeletingId(propId);
    await removeProperty(caseId, propId);
    setDeletingId(null);
  };

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (files.length > 4) {
      setUploadError("الحد الأقصى هو 4 صور");
      return;
    }

    // Validate all files first
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setUploadError(validation.error);
        return;
      }
    }

    // Upload to Supabase bucket
    setIsUploading(true);
    const supabase = createClient();
    const paths: string[] = [];

    for (const file of files) {
      const res = await uploadPropertyImage(supabase, userId, caseId, file);
      if ("error" in res) {
        setUploadError(res.error);
        setIsUploading(false);
        return;
      }
      paths.push(res.path);
    }

    setUploadedPaths(paths);
    setUploadSuccessCount(paths.length);
    setIsUploading(false);
  };

  const isMaxReached = properties.length >= 5;
  const parsedManualPrice = Number(manualPrice);
  const showPricePreview = !isNaN(parsedManualPrice) && parsedManualPrice > 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header and counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العقارات المرشحة</h1>
          <p className="text-sm text-gray-600 mt-1">
            أضف الشقق أو العقارات التي ترغب في المقارنة بينها (من 1 إلى 5 عقارات)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
            {properties.length} من 5
          </span>
        </div>
      </div>

      {/* Bookmarklet Clipper Banner */}
      <BookmarkletBanner caseId={caseId} />

      {/* Properties List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">قائمة العقارات المضافة</h2>

        {properties.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-sm text-gray-500">لم تتم إضافة أي عقار بعد</p>
            <p className="text-xs text-gray-400 mt-1">
              استخدم النموذج أدناه لإضافة أول عقار
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((p) => {
              const thumbnail =
                p.image_paths && p.image_paths.length > 0
                  ? signedThumbnails[p.image_paths[0]]
                  : null;

              const modeLabel =
                p.input_mode === "url"
                  ? "رابط"
                  : p.input_mode === "image"
                  ? "صور"
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt="صورة العقار"
                        width={64}
                        height={64}
                        unoptimized
                        className="w-16 h-16 object-cover rounded-md border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium flex-shrink-0 border border-gray-200">
                        {modeLabel}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                          {modeLabel}
                        </span>
                        <Link
                          href={`/case/${caseId}/properties/${p.id}`}
                          className="text-sm sm:text-base font-bold text-gray-900 hover:text-blue-600 truncate transition-colors inline-block"
                        >
                          {displayName}
                        </Link>
                      </div>

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
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-gray-600">
                            {displayPrice && (
                              <span className="font-semibold text-blue-600">
                                {formatSAR(Number(displayPrice))}
                              </span>
                            )}
                            {displayArea && <span>{displayArea} م²</span>}
                            {displayBedrooms && <span>{displayBedrooms} غرف</span>}
                            {displayFloor !== null && displayFloor !== undefined && (
                              <span>الدور {displayFloor}</span>
                            )}
                          </div>
                        );
                      })()}

                      {p.notes && p.input_mode !== "image" && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{p.notes}</p>
                      )}

                      {/* Extraction Status & Summary */}
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
                          <div className="space-y-1.5 mt-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {latestRun?.status === "running" && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                  جارٍ التحليل
                                </span>
                              )}

                              {latestRun?.status === "succeeded" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                  تم استخراج {factsCount} معلومة
                                </span>
                              )}

                              {latestRun?.status === "failed" && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                    تعذر الاستخراج
                                  </span>
                                  <RetryExtractionButton caseId={caseId} propertyId={p.id} />
                                </div>
                              )}

                              {!latestRun && (
                                <RetryExtractionButton
                                  caseId={caseId}
                                  propertyId={p.id}
                                  label="استخراج البيانات"
                                />
                              )}

                              {/* Per-property summary: N متعارضة · M ناقصة */}
                              <span className="text-xs text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded font-medium">
                                {conflictingCount} متعارضة · {unknownCount} ناقصة
                              </span>
                            </div>

                            {latestRun?.status === "failed" && p.input_mode === "url" && (
                              <div className="space-y-2 mt-1">
                                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 leading-relaxed">
                                  منصة العقار تفرض حظر Cloudflare على القراءة التلقائية للرابط.
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => setQuickPasteProp({ id: p.id, url: p.source_url || "" })}
                                    className="text-xs px-3 py-1.5 h-auto bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                  >
                                    📋 استيراد سريع (لصق بيانات الصفحة)
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link href={`/case/${caseId}/properties/${p.id}`}>
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs px-2.5 py-1.5 h-auto text-blue-700 hover:bg-blue-50"
                      >
                        تدقيق وتفاصيل
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      pending={deletingId === p.id}
                      disabled={deletingId === p.id}
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-3 py-1.5 h-auto"
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add panel: Hidden when n = 5 */}
      {!isMaxReached ? (
        <section className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
            إضافة عقار جديد
          </h2>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "url"
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              رابط
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "image"
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              صور
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "manual"
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              إدخال يدوي
            </button>
          </div>

          {/* Tab 1: URL */}
          {activeTab === "url" && (
            <form ref={urlFormRef} action={urlAction} className="space-y-4">
              <input type="hidden" name="input_mode" value="url" />

              <Input
                id="source_url"
                name="source_url"
                label="رابط إعلان العقار (يبدأ بـ https://)"
                placeholder="https://sa.aqar.fm/..."
                error={urlState?.errors?.source_url?.[0]}
              />

              <Input
                id="url_notes"
                name="notes"
                label="ملاحظات (اختياري)"
                placeholder="مثال: الواجهة ممتازة، الحي هادئ"
                error={urlState?.errors?.notes?.[0]}
              />

              {urlState?.errors?.form?.[0] && (
                <FieldError message={urlState.errors.form[0]} />
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رفع صور العقار أو لقطات الشاشة (1 إلى 4 صور)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFilesSelect}
                  disabled={isUploading}
                  className="w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  الصيغ المدعومة: JPEG, PNG, WebP (بحد أقصى 8 ميجابايت للصورة)
                </p>

                {isUploading && (
                  <p className="text-xs text-blue-600 mt-1 animate-pulse">
                    جارٍ رفع الصور...
                  </p>
                )}

                {uploadSuccessCount > 0 && !isUploading && (
                  <p className="text-xs text-green-600 mt-1">
                    تم رفع {uploadSuccessCount} صور بنجاح
                  </p>
                )}

                {uploadError && <FieldError message={uploadError} />}
                {imageState?.errors?.image_paths?.[0] && (
                  <FieldError message={imageState.errors.image_paths[0]} />
                )}
              </div>

              <Input
                id="image_notes"
                name="notes"
                label="ملاحظات (اختياري)"
                placeholder="مثال: لقطة شاشة للمواصفات والأسعار"
                error={imageState?.errors?.notes?.[0]}
              />

              {imageState?.errors?.form?.[0] && (
                <FieldError message={imageState.errors.form[0]} />
              )}

              <div className="pt-2">
                <FormSubmitButton disabled={isUploading || uploadedPaths.length === 0}>
                  إضافة العقار
                </FormSubmitButton>
              </div>
            </form>
          )}

          {/* Tab 3: Manual */}
          {activeTab === "manual" && (
            <form ref={manualFormRef} action={manualAction} className="space-y-4">
              <input type="hidden" name="input_mode" value="manual" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="manual_title"
                  name="title"
                  label="عنوان العقار (مطلوب العنوان أو الحي)"
                  placeholder="مثال: شقة مودرن للبيع"
                  error={manualState?.errors?.title?.[0]}
                />

                <Input
                  id="manual_district"
                  name="district"
                  label="الحي"
                  placeholder="مثال: حي الياسمين"
                  error={manualState?.errors?.district?.[0]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    id="manual_price"
                    name="listing_price_sar"
                    type="number"
                    label="السعر (ريال)"
                    placeholder="مثال: 750000"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    error={manualState?.errors?.listing_price_sar?.[0]}
                  />
                  {showPricePreview && (
                    <p className="text-xs font-medium text-blue-600 mt-1">
                      المعاينة: {formatSAR(parsedManualPrice)}
                    </p>
                  )}
                </div>

                <Input
                  id="manual_area"
                  name="area_sqm"
                  type="number"
                  step="any"
                  label="المساحة (م²)"
                  placeholder="مثال: 150"
                  error={manualState?.errors?.area_sqm?.[0]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="manual_bedrooms"
                  name="bedrooms"
                  type="number"
                  label="عدد غرف النوم"
                  placeholder="مثال: 3"
                  error={manualState?.errors?.bedrooms?.[0]}
                />

                <Input
                  id="manual_floor"
                  name="floor_no"
                  type="number"
                  label="رقم الدور"
                  placeholder="مثال: 2"
                  error={manualState?.errors?.floor_no?.[0]}
                />
              </div>

              <Input
                id="manual_notes"
                name="notes"
                label="ملاحظات (اختياري)"
                placeholder="أي تفاصيل أخرى ترغب في تدوينها"
                error={manualState?.errors?.notes?.[0]}
              />

              {manualState?.errors?.form?.[0] && (
                <FieldError message={manualState.errors.form[0]} />
              )}

              <div className="pt-2">
                <FormSubmitButton>إضافة العقار</FormSubmitButton>
              </div>
            </form>
          )}
        </section>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-700">
          تم الوصول إلى الحد الأقصى للمقارنة (5 عقارات). يمكنك حذف عقار لإضافة غيره.
        </div>
      )}

      {/* Continue button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-500">
          {properties.length === 0
            ? "أضف عقاراً واحداً على الأقل للمتابعة إلى الفحص المبدئي"
            : `جاهز للمتابعة (${properties.length} عقارات)`}
        </span>

        {properties.length >= 1 ? (
          <Link href={`/case/${caseId}/preflight`} className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto">
              متابعة إلى الفحص المبدئي
            </Button>
          </Link>
        ) : (
          <Button variant="primary" disabled className="w-full sm:w-auto">
            متابعة إلى الفحص المبدئي
          </Button>
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
