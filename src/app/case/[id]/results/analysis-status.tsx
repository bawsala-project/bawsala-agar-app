"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RotateCcw } from "lucide-react";
import { startAnalysis } from "@/actions/analysis";
import { CompassLoader } from "@/components/brand/compass-loader";
import { PRICE_PER_CONSULTATION_SAR } from "@/config/product";

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
      <div className="w-full max-w-xl mx-auto py-16 px-4" role="alert" dir="rtl">
        <div className="bg-[var(--paper)] rounded-[28px] border border-[#F6CBC8] shadow-[0_20px_60px_rgba(15,26,43,0.04)] p-8 sm:p-10 text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FDF1F0] text-[#A62626] flex items-center justify-center border border-[#F6CBC8]">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold text-[var(--navy)]">
              تعذر استكمال التحليل الآلي
            </h2>
            <p className="text-sm text-[var(--dusty-blue)] max-w-md mx-auto leading-relaxed">
              تم تأكيد دفعتك ({PRICE_PER_CONSULTATION_SAR} ر.س)، ولكن حدث عارض أثناء معالجة مطابقة الشقق.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-[#FDF1F0] rounded-xl border border-[#F6CBC8] text-xs font-mono text-[#A62626] text-right">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void run()}
              className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-semibold text-base shadow-sm transition-all active:scale-[0.98] disabled:bg-[var(--navy)] disabled:text-[var(--cream)]/70 disabled:cursor-not-allowed disabled:opacity-100 cursor-pointer opacity-100"
            >
              <RotateCcw className="w-4 h-4 text-[var(--cream)] opacity-100 shrink-0" />
              <span className="text-[var(--cream)] text-base font-semibold opacity-100">إعادة تشغيل التحليل مجانًا</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-xl mx-auto py-16 px-4 text-center space-y-8 select-none"
      role="status"
      aria-live="polite"
      dir="rtl"
    >
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-8 sm:p-12 shadow-[0_20px_60px_rgba(15,26,43,0.04)] relative overflow-hidden space-y-6">
        {/* CompassLoader component */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <CompassLoader
            size={72}
            state="searching"
            showProgressLine={true}
            messages={[
              "نطابق مواصفات الشقق مع احتياجات أسرتك وميزانيتك…",
              "نحسب أثر الموقع والمشاوير اليومية وتكاليف التشغيل…",
              "نحلل تناسب المساحة وسعر المتر ومحددات المشتري…",
              "ندقق مؤشرات جودة البناء والصك والمخاطر المحتملة…",
              "نصيغ التوصية المستقلة لمساعدتك على حسم القرار…",
            ]}
          />
        </div>

        <div className="relative z-10 space-y-2 max-w-md mx-auto pt-2">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-[var(--navy)] tracking-tight">
            تم تأكيد الدفع بنجاح — جارٍ تحليل ملاءمة الشقق
          </h2>
          <p className="text-xs sm:text-sm text-[var(--dusty-blue)] leading-relaxed">
            محرك بوصلة العقار يربط كل شقة بملف المشتري ويحلل أبعاد الملاءمة الخمسة بدقة
          </p>
        </div>

        {error && (
          <p className="relative z-10 text-xs text-[#A62626] bg-[#FDF1F0] p-3 rounded-xl border border-[#F6CBC8] max-w-sm mx-auto">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
