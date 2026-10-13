"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  X,
} from "lucide-react";
import { importClippedProperty } from "@/actions/properties";

export default function ClipReceiverPage({
  params,
}: {
  params: { id: string };
}) {
  const caseId = params.id;

  const [receivedData, setReceivedData] = useState<{
    url: string;
    title: string;
    text: string;
  } | null>(null);

  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualText, setManualText] = useState("");

  const [status, setStatus] = useState<"waiting" | "processing" | "success" | "error">("waiting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handshake with window.opener (Bookmarklet / Extension)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === "bawsala-clip-data") {
        const payload = event.data;
        setReceivedData({
          url: payload.url || "",
          title: payload.title || "",
          text: payload.text || "",
        });

        // Trigger automatic import and extraction
        setStatus("processing");
        try {
          const res = await importClippedProperty(caseId, {
            source_url: payload.url,
            title: payload.title,
            text: payload.text,
          });

          if (res.success) {
            setStatus("success");
          } else {
            setStatus("error");
            setErrorMessage(res.error || "تعذر استخراج البيانات من المحتوى.");
          }
        } catch (err: unknown) {
          setStatus("error");
          setErrorMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Notify opener that receiver is mounted and ready
    if (window.opener) {
      window.opener.postMessage("bawsala-ready", "*");
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [caseId]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim() || !manualText.trim()) {
      setErrorMessage("يرجى إدخال الرابط ونص الإعلان على الأقل.");
      return;
    }

    setStatus("processing");
    setErrorMessage(null);

    try {
      const res = await importClippedProperty(caseId, {
        source_url: manualUrl.trim(),
        title: manualTitle.trim() || undefined,
        text: manualText.trim(),
      });

      if (res.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(res.error || "تعذر استخراج البيانات من المحتوى.");
      }
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6" dir="rtl">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10 space-y-6 relative overflow-hidden">
        {/* Subtle Ambient Background Light */}
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-blue-50/70 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 border-b border-slate-100 pb-5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Bookmark className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            كليبر بوصلة العقار
          </h1>
          <p className="text-xs text-slate-500">
            استيراد مباشر لمواصفات العقار وتجاوز حظر المنصات
          </p>
        </div>

        {/* State 1: Processing */}
        {status === "processing" && (
          <div className="text-center py-8 space-y-5 relative z-10">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-blue-100 animate-ping opacity-30" />
              <div className="relative w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-blue-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                جارٍ تحليل وتدقيق المواصفات...
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                يقوم الذكاء الاصطناعي باستخراج السعر، المساحة، الغرف، ومطابقتها مع شروطك.
              </p>
            </div>

            {receivedData?.title && (
              <p className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-slate-700 font-bold truncate max-w-sm mx-auto">
                {receivedData.title}
              </p>
            )}
          </div>
        )}

        {/* State 2: Success */}
        {status === "success" && (
          <div className="text-center py-6 space-y-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                تم استيراد وتحليل العقار بنجاح!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                تمت إضافة العقار وحفظ كافة مواصفاته الموثقة في قرارك الشرائي.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link
                href={`/case/${caseId}/properties`}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all"
              >
                <span>العودة لقائمة العقارات</span>
                <span aria-hidden="true">←</span>
              </Link>

              {typeof window !== "undefined" && window.opener && (
                <button
                  type="button"
                  onClick={() => window.close()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>إغلاق هذه النافذة</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* State 3: Error */}
        {status === "error" && (
          <div className="text-center py-6 space-y-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-slate-900">
                تعذر استخراج المواصفات
              </h2>
              <p className="text-xs text-rose-600 font-bold max-w-xs mx-auto">{errorMessage}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setStatus("waiting");
                setErrorMessage(null);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
            >
              <span>المحاولة يدويًا باللصق</span>
            </button>
          </div>
        )}

        {/* State 4: Waiting / Manual Input */}
        {status === "waiting" && (
          <form onSubmit={handleManualSubmit} className="space-y-4 relative z-10">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 space-y-1 shadow-xs">
              <p className="font-extrabold">💡 استيراد فوري بدون حظر:</p>
              <p className="text-amber-800 leading-relaxed font-normal">
                إذا لم تفتح هذه النافذة عبر كليبر الإشارات المرجعية، افتح صفحة الإعلان في متصفحك، اضغط <kbd className="bg-white px-2 py-0.5 rounded border border-amber-300 font-mono font-bold">Ctrl+A</kbd> ثم <kbd className="bg-white px-2 py-0.5 rounded border border-amber-300 font-mono font-bold">Ctrl+C</kbd> والصق النص أدناه.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="manual_clip_url" className="block text-xs font-extrabold text-slate-700">
                رابط الإعلان (URL)
              </label>
              <div className="relative">
                <input
                  id="manual_clip_url"
                  type="url"
                  required
                  placeholder="https://sa.aqar.fm/..."
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400 transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="manual_clip_title" className="block text-xs font-extrabold text-slate-700">
                عنوان الإعلان (اختياري)
              </label>
              <input
                id="manual_clip_title"
                type="text"
                placeholder="فيلا للبيع في حي الأندلس..."
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400 transition-all shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="manual_clip_text" className="block text-xs font-extrabold text-slate-700">
                نص الإعلان أو بيانات الصفحة (Paste Page Content)
              </label>
              <textarea
                id="manual_clip_text"
                rows={6}
                required
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="الصق نص صفحة الإعلان هنا..."
                className="w-full text-xs sm:text-sm p-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400 resize-none transition-all shadow-xs font-mono"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span>تحليل واستيراد العقار فوراً</span>
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
