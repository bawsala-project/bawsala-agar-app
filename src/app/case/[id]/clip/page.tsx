"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, AlertCircle, X } from "lucide-react";
import { BawsalaCompass } from "@/components/brand/bawsala-compass";

export default function ClipPage({ params }: { params: { id: string } }) {
  const caseId = params.id;

  const [status, setStatus] = useState<"processing" | "success" | "error" | "waiting">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualText, setManualText] = useState("");
  const [receivedData, setReceivedData] = useState<{ title?: string; price?: number } | null>(null);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.data || event.data.type !== "BAWSALA_CLIP_PAYLOAD") return;

      const { url, title, pageText, html } = event.data;
      setStatus("processing");

      try {
        const response = await fetch("/api/clip-property", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId, url, title, pageText, html }),
        });

        const res = await response.json();
        if (response.ok && res.success) {
          setReceivedData({ title: res.property?.title, price: res.property?.listing_price_sar });
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

    window.addEventListener("message", handleMessage);

    const timer = setTimeout(() => {
      setStatus((prev) => (prev === "processing" ? "waiting" : prev));
    }, 4000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timer);
    };
  }, [caseId]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl && !manualText) {
      setErrorMessage("يرجى إدخال الرابط أو لصق نص الإعلان على الأقل.");
      return;
    }

    setStatus("processing");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/clip-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          url: manualUrl,
          title: manualTitle,
          pageText: manualText,
        }),
      });

      const res = await response.json();
      if (response.ok && res.success) {
        setReceivedData({ title: res.property?.title, price: res.property?.listing_price_sar });
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
    <main className="min-h-screen bg-[var(--cream)] flex flex-col items-center justify-center p-4 sm:p-6" dir="rtl">
      <div className="w-full max-w-lg bg-[var(--paper)] rounded-[28px] shadow-[0_20px_60px_rgba(15,26,43,0.06)] border border-[var(--mist)] p-6 sm:p-10 space-y-6 relative overflow-hidden text-[var(--navy)]">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-[var(--mist)] pb-5 relative z-10">
          <div className="w-14 h-14 rounded-full bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] flex items-center justify-center mx-auto shadow-xs p-2.5">
            <BawsalaCompass size={32} animateHover />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--navy)] tracking-tight">
            كليبر بوصلة العقار
          </h1>
          <p className="text-xs text-[var(--dusty-blue)]">
            استيراد مباشر لمواصفات العقار وتجاوز حظر المنصات
          </p>
        </div>

        {/* State 1: Processing */}
        {status === "processing" && (
          <div className="text-center py-8 space-y-5 relative z-10">
            <div className="w-14 h-14 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-6 h-6 text-[var(--navy)] animate-pulse" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold font-display text-[var(--navy)]">
                جارٍ قراءة مواصفات الشقة…
              </h2>
              <p className="text-sm text-[var(--dusty-blue)] max-w-xs mx-auto leading-relaxed">
                نستخرج السعر والمساحة والغرف.
              </p>
            </div>

            {receivedData?.title && (
              <p className="text-xs bg-[var(--cream)] border border-[var(--mist)] p-2.5 rounded-xl text-[var(--navy)] font-bold truncate max-w-sm mx-auto">
                {receivedData.title}
              </p>
            )}
          </div>
        )}

        {/* State 2: Success */}
        {status === "success" && (
          <div className="text-center py-6 space-y-5 relative z-10">
            <div className="w-14 h-14 rounded-full bg-[var(--cream)] text-[var(--status-ok,#34D399)] border border-[var(--mist)] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold font-display text-[var(--navy)]">
                تمت إضافة العقار
              </h2>
              <p className="text-sm text-[var(--dusty-blue)] leading-relaxed max-w-xs mx-auto">
                حُفظت مواصفاته في حالتك.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/case/${caseId}/properties`}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-semibold text-base shadow-sm transition-all opacity-100"
              >
                <span className="text-[var(--cream)] text-base font-semibold opacity-100">العودة لقائمة العقارات</span>
                <span aria-hidden="true" className="text-[var(--cream)] opacity-100">←</span>
              </Link>

              {typeof window !== "undefined" && window.opener && (
                <button
                  type="button"
                  onClick={() => window.close()}
                  className="btn-ghost w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-transparent hover:bg-[var(--paper)] border border-[var(--navy)] text-[var(--navy)] font-semibold text-base transition-all opacity-100"
                >
                  <X className="w-4 h-4 text-[var(--navy)] opacity-100" />
                  <span className="text-[var(--navy)] text-base font-semibold opacity-100">إغلاق النافذة</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* State 3: Error */}
        {status === "error" && (
          <div className="text-center py-6 space-y-5 relative z-10">
            <div className="w-14 h-14 rounded-full bg-[var(--cream)] text-[var(--status-danger,#C85C5C)] border border-[var(--mist)] flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold font-display text-[var(--navy)]">
                تعذر استخراج المواصفات
              </h2>
              <p className="text-sm text-[var(--status-danger)] font-bold max-w-xs mx-auto">{errorMessage}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setStatus("waiting");
                setErrorMessage(null);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--cream)] hover:bg-[var(--paper)] border border-[var(--mist)] text-[var(--navy)] font-bold text-xs transition-all cursor-pointer"
            >
              <span>المحاولة يدويًا باللصق</span>
            </button>
          </div>
        )}

        {/* State 4: Waiting / Manual Input */}
        {status === "waiting" && (
          <form onSubmit={handleManualSubmit} className="space-y-4 relative z-10">
            <div className="bg-[var(--cream)] border border-[var(--mist)] rounded-2xl p-4 text-sm text-[var(--navy)] space-y-1 shadow-xs">
              <p className="font-extrabold text-[var(--navy)]">استيراد يدوي</p>
              <p className="text-[var(--dusty-blue)] leading-relaxed font-normal">
                انسخ صفحة الإعلان كاملة <kbd className="bg-[var(--paper)] px-2 py-0.5 rounded border border-[var(--mist)] font-mono font-bold text-[var(--navy)]">Ctrl+A</kbd> ثم <kbd className="bg-[var(--paper)] px-2 py-0.5 rounded border border-[var(--mist)] font-mono font-bold text-[var(--navy)]">Ctrl+C</kbd> والصقها هنا.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="manual_clip_url" className="block text-xs font-bold text-[var(--navy)]">
                رابط الإعلان (URL)
              </label>
              <input
                id="manual_clip_url"
                type="url"
                required
                placeholder="https://sa.aqar.fm/..."
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className="w-full text-base sm:text-sm px-4 py-3 rounded-2xl border border-[var(--mist)] focus:border-[var(--navy)] outline-none text-[var(--navy)] bg-[var(--cream)] placeholder:text-[var(--dusty-blue)]/50 transition-all shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="manual_clip_title" className="block text-xs font-bold text-[var(--navy)]">
                عنوان الإعلان (اختياري)
              </label>
              <input
                id="manual_clip_title"
                type="text"
                placeholder="فيلا للبيع في حي الأندلس..."
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full text-base sm:text-sm px-4 py-3 rounded-2xl border border-[var(--mist)] focus:border-[var(--navy)] outline-none text-[var(--navy)] bg-[var(--cream)] placeholder:text-[var(--dusty-blue)]/50 transition-all shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="manual_clip_text" className="block text-xs font-bold text-[var(--navy)]">
                نص الإعلان أو بيانات الصفحة
              </label>
              <textarea
                id="manual_clip_text"
                rows={5}
                required
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="الصق نص صفحة الإعلان هنا..."
                className="w-full text-base sm:text-sm p-4 rounded-2xl border border-[var(--mist)] focus:border-[var(--navy)] outline-none text-[var(--navy)] bg-[var(--cream)] placeholder:text-[var(--dusty-blue)]/50 resize-none transition-all shadow-xs font-mono"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-[var(--status-danger)] font-bold bg-[var(--status-danger)]/10 p-3 rounded-xl border border-[var(--status-danger)]/20">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-semibold text-base shadow-sm transition-all cursor-pointer opacity-100"
            >
              <Sparkles className="w-4 h-4 text-[var(--cream)] opacity-100 shrink-0" />
              <span className="text-[var(--cream)] text-base font-semibold opacity-100">استيراد العقار</span>
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
