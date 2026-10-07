"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importClippedProperty } from "@/actions/properties";

export default function ClipReceiverPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
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
  const [extractedFactsCount, setExtractedFactsCount] = useState<number | null>(null);

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
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-gray-100 pb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
            📌
          </div>
          <h1 className="text-xl font-bold text-gray-900">كليبر بوصلة العقار</h1>
          <p className="text-xs text-gray-500">
            استيراد مباشر لمواصفات العقار وتجاوز حظر المنصات
          </p>
        </div>

        {/* State 1: Processing */}
        {status === "processing" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h2 className="text-base font-bold text-gray-900">جارٍ تحليل وتدقيق المواصفات...</h2>
              <p className="text-xs text-gray-500">
                يقوم الذكاء الاصطناعي باستخراج السعر، المساحة، الغرف، ومطابقتها مع شروطك.
              </p>
            </div>
            {receivedData?.title && (
              <p className="text-xs bg-gray-50 p-2 rounded text-gray-700 font-medium truncate">
                {receivedData.title}
              </p>
            )}
          </div>
        )}

        {/* State 2: Success */}
        {status === "success" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-gray-900">تم استيراد وتحليل العقار بنجاح!</h2>
              <p className="text-xs text-gray-600">
                تمت إضافة العقار وحفظ كافة مواصفاته الموثقة في قرارك الشرائي.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Link href={`/case/${caseId}/properties`} className="w-full">
                <Button variant="primary" className="w-full">
                  العودة لقائمة العقارات
                </Button>
              </Link>
              {typeof window !== "undefined" && window.opener && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => window.close()}
                >
                  إغلاق هذه النافذة
                </Button>
              )}
            </div>
          </div>
        )}

        {/* State 3: Error */}
        {status === "error" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold">
              !
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-gray-900">تعذر استخراج المواصفات</h2>
              <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setStatus("waiting");
                setErrorMessage(null);
              }}
              className="text-xs"
            >
              المحاولة يدويًا باللصق
            </Button>
          </div>
        )}

        {/* State 4: Waiting / Manual Input */}
        {status === "waiting" && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">💡 استيراد فوري بدون حظر:</p>
              <p className="text-amber-800 leading-relaxed">
                إذا لم تفتح هذه النافذة عبر كليبر الإشارات المرجعية، افتح صفحة الإعلان في متصفحك، اضغط <kbd className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">Ctrl+A</kbd> ثم <kbd className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">Ctrl+C</kbd> والصق النص أدناه.
              </p>
            </div>

            <Input
              id="manual_clip_url"
              label="رابط الإعلان (URL)"
              placeholder="https://sa.aqar.fm/..."
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              required
            />

            <Input
              id="manual_clip_title"
              label="عنوان الإعلان (اختياري)"
              placeholder="فيلا للبيع في حي الأندلس..."
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
            />

            <div className="space-y-1.5">
              <label htmlFor="manual_clip_text" className="block text-sm font-medium text-gray-700">
                نص الإعلان أو بيانات الصفحة (Paste Page Content)
              </label>
              <textarea
                id="manual_clip_text"
                rows={6}
                required
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="الصق نص صفحة الإعلان هنا..."
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
            )}

            <Button type="submit" variant="primary" className="w-full">
              تحليل واستيراد العقار فوراً
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
