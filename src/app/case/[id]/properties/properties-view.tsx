"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Building2,
  Globe,
  Camera,
  FileEdit,
  Plus,
  Trash2,
  Loader2,
  Coins,
  Bookmark,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";
import { FieldError } from "@/components/ui/field-error";
import { formatSAR } from "@/lib/utils";
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
      className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>جاري الإضافة والتحليل...</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <Plus className="w-4 h-4" />
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
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${pending ? "animate-spin" : ""}`} />
        <span>{label}</span>
      </button>
      {error && <span className="text-[11px] text-rose-600 font-bold">{error}</span>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                استيراد نص الإعلان المباشر
              </h3>
              <p className="text-[11px] text-slate-400">تجاوز حظر Cloudflare لمنصات الإعلانات</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
          افتح صفحة الإعلان في متصفحك، اضغط{" "}
          <kbd className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-[11px] shadow-xs">
            Ctrl + A
          </kbd>{" "}
          ثم{" "}
          <kbd className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-[11px] shadow-xs">
            Ctrl + C
          </kbd>{" "}
          والصق النص أدناه. سيقوم الذكاء الاصطناعي باستخراج كافة المواصفات والأسعار وتدقيقها فوراً.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            rows={7}
            required
            placeholder="الصق نص صفحة الإعلان هنا..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={pending}
            className="w-full text-xs p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-mono"
          />

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={pending}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>جارٍ تحليل المواصفات...</span>
                </>
              ) : (
                <span>استخراج المواصفات فوراً</span>
              )}
            </button>
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
    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-slate-800">
      {/* Ambient background glow */}
      <div className="absolute -top-20 -left-20 w-52 h-52 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-1.5 max-w-xl">
        <div className="flex items-center gap-2 font-bold text-white text-sm sm:text-base">
          <Bookmark className="w-4 h-4 text-blue-400" />
          <span>كليبر المتصفح المباشر (تجاوز حظر المنصات العقارية)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-light">
          لتجاوز حظر Cloudflare لمنصات (عقار / وصلت): اسحب الزر أدناه إلى{" "}
          <strong className="text-white font-bold">شريط الإشارات (Bookmarks Bar)</strong> في متصفحك.
          عند تصفح أي عقار، اضغطه فقط ليتم استيراد كافة المواصفات والأسعار تلقائياً إلى جلستك!
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
        <a
          href={bookmarkletCode}
          draggable="true"
          onClick={(e) => {
            if (e.isTrusted && !e.defaultPrevented) {
              window.open(
                `${origin}/case/${caseId}/clip`,
                "bawsala_clipper",
                "width=520,height=650"
              );
              e.preventDefault();
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 shadow-sm cursor-grab active:cursor-grabbing transition-colors"
          title="اسحب هذا الزر إلى شريط إشارات المتصفح"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>اسحب لإشارات المتصفح</span>
        </a>

        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>تم النسخ</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-300" />
              <span>نسخ الكود</span>
            </>
          )}
        </button>
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
    <div className="space-y-10">
      {/* Hero / Page Intro */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-slate-700 text-xs font-medium shadow-xs">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>المرحلة الثانية • حصر وتدقيق العقارات المرشحة</span>
          {city && (
            <>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-blue-600">{city}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.3]">
          حصر العقارات للمقارنة الهندسية <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-slate-900 via-slate-800 to-blue-600">
            من 2 إلى 5 خيارات للمفاضلة
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto">
          أدخل العقارات عبر الروابط المباشرة أو الصور أو الإدخال اليدوي. نقوم باستخراج مواصفات كل عقار وتحويلها إلى بيانات قطعية دون أي تزييف إعلاني.
        </p>
      </section>

      {/* Bookmarklet Clipper Banner */}
      <BookmarkletBanner caseId={caseId} />

      {/* ============================================================== */}
      {/* Properties List */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              العقارات المضافة قيد الدراسة
            </h2>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/50">
            {properties.length} من 5 عقارات
          </span>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">لم تقم بإضافة أي عقار حتى الآن</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              أضف أول عقار باستخدام النموذج أدناه عبر رابط الإعلان أو الصور أو المواصفات اليدوية.
            </p>
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
                  className="bg-white rounded-3xl border border-slate-200/70 p-5 sm:p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail or Icon */}
                    {thumbnail ? (
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                        <Image
                          src={thumbnail}
                          alt="صورة العقار"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 font-bold shrink-0 border border-slate-200/60 text-xs gap-1">
                        {p.input_mode === "url" ? (
                          <Globe className="w-5 h-5 text-blue-600" />
                        ) : p.input_mode === "image" ? (
                          <Camera className="w-5 h-5 text-slate-600" />
                        ) : (
                          <FileEdit className="w-5 h-5 text-slate-600" />
                        )}
                        <span className="text-[10px] text-slate-400">عقار #{index + 1}</span>
                      </div>
                    )}

                    {/* Content Details */}
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {modeLabel}
                        </span>
                        <Link
                          href={`/case/${caseId}/properties/${p.id}`}
                          className="text-sm sm:text-base font-extrabold text-slate-900 hover:text-blue-600 truncate transition-colors inline-block"
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
                              <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl">
                                {formatSAR(Number(displayPrice))}
                              </span>
                            )}
                            {displayArea && (
                              <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-xl">
                                {displayArea} م²
                              </span>
                            )}
                            {displayBedrooms && (
                              <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-xl">
                                {displayBedrooms} غرف
                              </span>
                            )}
                            {displayFloor !== null && displayFloor !== undefined && (
                              <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-xl">
                                الدور {displayFloor}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {p.notes && p.input_mode !== "image" && (
                        <p className="text-xs text-slate-400 truncate max-w-md">{p.notes}</p>
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
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                  جارٍ الاستخراج والتدقيق...
                                </span>
                              )}

                              {latestRun?.status === "succeeded" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  تم استخراج {factsCount} حقيقة مدققة
                                </span>
                              )}

                              {latestRun?.status === "failed" && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
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

                              <span className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-full font-medium">
                                {conflictingCount} متعارضة • {unknownCount} ناقصة
                              </span>
                            </div>

                            {latestRun?.status === "failed" && p.input_mode === "url" && (
                              <div className="space-y-2 bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3">
                                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                                  منصة الإعلان تفرض حماية Cloudflare وتمنع الجلب الخارجي.
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setQuickPasteProp({ id: p.id, url: p.source_url || "" })
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <Link
                      href={`/case/${caseId}/properties/${p.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition-colors cursor-pointer"
                    >
                      <span>تدقيق وتفاصيل</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      disabled={deletingId === p.id}
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="حذف العقار"
                    >
                      {deletingId === p.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
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

      {/* ============================================================== */}
      {/* Add Property Panel: Hidden when n = 5 */}
      {/* ============================================================== */}
      {!isMaxReached ? (
        <section className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  إضافة عقار مرشح جديد
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  أدخل بيانات العقار للاستخراج الآلي والتدقيق الهندسي
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/40">
              {5 - properties.length} خانات متبقية
            </span>
          </div>

          {/* Segmented Mode Selector */}
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/50 gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "url"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>رابط الإعلان</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "image"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>لقطات شاشة / صور</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "manual"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
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
                <label htmlFor="source_url" className="block text-xs font-bold text-slate-700">
                  رابط إعلان العقار (sa.aqar.fm أو wasalt.com)
                </label>
                <input
                  id="source_url"
                  name="source_url"
                  type="url"
                  required
                  placeholder="https://sa.aqar.fm/شقق-للبيع/..."
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-mono"
                />
                {urlState?.errors?.source_url?.[0] && (
                  <FieldError message={urlState.errors.source_url[0]} />
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="url_notes" className="block text-xs font-bold text-slate-700">
                  ملاحظات أولية (اختياري)
                </label>
                <input
                  id="url_notes"
                  name="notes"
                  type="text"
                  placeholder="مثال: الواجهة جنوبية، قريب من الخدمات"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
                {urlState?.errors?.notes?.[0] && (
                  <FieldError message={urlState.errors.notes[0]} />
                )}
              </div>

              {urlState?.errors?.form?.[0] && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{urlState.errors.form[0]}</span>
                </div>
              )}

              <div className="pt-2">
                <FormSubmitButton>إضافة العقار والبدء بالاستخراج</FormSubmitButton>
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

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  رفع صور العقار أو لقطات شاشة الإعلان (1 إلى 4 صور)
                </label>
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/60 transition-colors text-center cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFilesSelect}
                    disabled={isUploading}
                    className="w-full text-xs text-slate-500 file:me-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-blue-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    الصيغ المدعومة: JPEG, PNG, WebP (بحد أقصى 8 ميجابايت لكل صورة)
                  </p>
                </div>

                {isUploading && (
                  <p className="text-xs text-blue-600 mt-1 animate-pulse font-medium">
                    جارٍ رفع الصور وتأمين الروابط...
                  </p>
                )}

                {uploadSuccessCount > 0 && !isUploading && (
                  <p className="text-xs text-emerald-600 mt-1 font-bold">
                    ✓ تم رفع {uploadSuccessCount} صور بنجاح
                  </p>
                )}

                {uploadError && <FieldError message={uploadError} />}
                {imageState?.errors?.image_paths?.[0] && (
                  <FieldError message={imageState.errors.image_paths[0]} />
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="image_notes" className="block text-xs font-bold text-slate-700">
                  ملاحظات على الصور (اختياري)
                </label>
                <input
                  id="image_notes"
                  name="notes"
                  type="text"
                  placeholder="مثال: لقطة شاشة للمواصفات والأسعار والموقع"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
                {imageState?.errors?.notes?.[0] && (
                  <FieldError message={imageState.errors.notes[0]} />
                )}
              </div>

              {imageState?.errors?.form?.[0] && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{imageState.errors.form[0]}</span>
                </div>
              )}

              <div className="pt-2">
                <FormSubmitButton disabled={isUploading || uploadedPaths.length === 0}>
                  إضافة العقار وبدء التعرف البصري (OCR)
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
                  <label htmlFor="manual_title" className="block text-xs font-bold text-slate-700">
                    عنوان العقار
                  </label>
                  <input
                    id="manual_title"
                    name="title"
                    type="text"
                    placeholder="مثال: شقة مودرن فاخرة للبيع"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  />
                  {manualState?.errors?.title?.[0] && (
                    <FieldError message={manualState.errors.title[0]} />
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="manual_district" className="block text-xs font-bold text-slate-700">
                    الحي السكني
                  </label>
                  <input
                    id="manual_district"
                    name="district"
                    type="text"
                    placeholder="مثال: حي النرجس"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  />
                  {manualState?.errors?.district?.[0] && (
                    <FieldError message={manualState.errors.district[0]} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="manual_price" className="block text-xs font-bold text-slate-700">
                    السعر المطلوب (ريال)
                  </label>
                  <input
                    id="manual_price"
                    name="listing_price_sar"
                    type="number"
                    placeholder="مثال: 850000"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  />
                  {showPricePreview && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold mt-1">
                      <Coins className="w-3.5 h-3.5 text-blue-600" />
                      <span>{formatSAR(parsedManualPrice)}</span>
                    </div>
                  )}
                  {manualState?.errors?.listing_price_sar?.[0] && (
                    <FieldError message={manualState.errors.listing_price_sar[0]} />
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="manual_area" className="block text-xs font-bold text-slate-700">
                    المساحة الصافية (م²)
                  </label>
                  <input
                    id="manual_area"
                    name="area_sqm"
                    type="number"
                    step="any"
                    placeholder="مثال: 160"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  />
                  {manualState?.errors?.area_sqm?.[0] && (
                    <FieldError message={manualState.errors.area_sqm[0]} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="manual_bedrooms" className="block text-xs font-bold text-slate-700">
                    عدد غرف النوم
                  </label>
                  <input
                    id="manual_bedrooms"
                    name="bedrooms"
                    type="number"
                    placeholder="مثال: 3"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  />
                  {manualState?.errors?.bedrooms?.[0] && (
                    <FieldError message={manualState.errors.bedrooms[0]} />
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="manual_floor" className="block text-xs font-bold text-slate-700">
                    رقم الدور
                  </label>
                  <input
                    id="manual_floor"
                    name="floor_no"
                    type="number"
                    placeholder="مثال: 2"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  />
                  {manualState?.errors?.floor_no?.[0] && (
                    <FieldError message={manualState.errors.floor_no[0]} />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="manual_notes" className="block text-xs font-bold text-slate-700">
                  ملاحظات ومميزات أخرى (اختياري)
                </label>
                <input
                  id="manual_notes"
                  name="notes"
                  type="text"
                  placeholder="أي تفاصيل أخرى (مثال: مطبخ راكب، مصعد، موقف خاص)"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
                {manualState?.errors?.notes?.[0] && (
                  <FieldError message={manualState.errors.notes[0]} />
                )}
              </div>

              {manualState?.errors?.form?.[0] && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{manualState.errors.form[0]}</span>
                </div>
              )}

              <div className="pt-2">
                <FormSubmitButton>حفظ العقار وتدقيق البيانات</FormSubmitButton>
              </div>
            </form>
          )}
        </section>
      ) : (
        <div className="bg-slate-100/80 border border-slate-200/80 rounded-3xl p-6 text-center text-xs sm:text-sm font-bold text-slate-700">
          تم الوصول إلى الحد الأقصى للمقارنة المعتمد (5 عقارات). يمكنك حذف أي عقار لإضافة خيار بديل.
        </div>
      )}

      {/* ============================================================== */}
      {/* Continue Action Bar */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {properties.length === 0
              ? "أضف عقاراً واحداً على الأقل للمتابعة إلى بوابة الفحص المبدئي"
              : `جاهز للمتابعة (${properties.length} عقارات مضافة)`}
          </span>
        </div>

        {properties.length >= 1 ? (
          <Link href={`/case/${caseId}/preflight`} className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
            >
              <span>متابعة إلى بوابة الفحص المبدئي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-200 text-slate-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-not-allowed"
          >
            <span>متابعة إلى بوابة الفحص المبدئي</span>
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
