"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RotateCcw, Sparkles } from "lucide-react";
import { startAnalysis } from "@/actions/analysis";
import { Button } from "@/components/ui/button";

export type AnalysisStatusMode = "start" | "wait" | "failed";

interface AnalysisStatusProps {
  caseId: string;
  mode: AnalysisStatusMode;
}

const POLL_INTERVAL_MS = 3000;

export function AnalysisStatus({ caseId, mode }: AnalysisStatusProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const started = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    // On success the action redirects to the results; otherwise it returns an error.
    const result = await startAnalysis(caseId);
    if (result?.error) {
      setError(result.error);
    }
    setBusy(false);
    startTransition(() => {
      router.refresh();
    });
  }, [caseId, router]);

  useEffect(() => {
    if (mode === "start" && !started.current) {
      started.current = true;
      void run();
    }
  }, [mode, run]);

  useEffect(() => {
    if (mode === "failed") return;
    const timer = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [mode, router]);

  if (mode === "failed") {
    return (
      <div className="w-full max-w-xl mx-auto py-16 px-4" role="alert">
        <div className="bg-white rounded-3xl border border-rose-200/80 shadow-sm p-8 sm:p-10 text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">تعذر استكمال التحليل الآلي</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              تم تأكيد دفعتك (10 ر.س)، ولكن حدث خطأ تقني أثناء معالجة التحليل.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs font-mono text-rose-800 text-right">
              {error}
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="primary"
              pending={busy}
              onClick={() => void run()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة تشغيل التحليل مجانًا</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-xl mx-auto py-20 px-4 text-center space-y-6"
      role="status"
      aria-live="polite"
    >
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 rounded-3xl bg-blue-100 animate-ping opacity-30" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-slate-900 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Sparkles className="w-8 h-8 animate-pulse text-blue-200" />
        </div>
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          تم تأكيد الدفع بنجاح — جارٍ تحليل العقارات...
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          يستغرق التحليل بضع ثوانٍ لمطابقة الشروط وفحص المخاطر
        </p>
      </div>

      {/* Progress pulse dots */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>

      {error && (
        <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 max-w-sm mx-auto">
          {error}
        </p>
      )}
    </div>
  );
}
