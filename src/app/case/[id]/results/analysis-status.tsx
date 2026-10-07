"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
    router.refresh();
  }, [caseId, router]);

  useEffect(() => {
    if (mode === "start" && !started.current) {
      started.current = true;
      void run();
    }
  }, [mode, run]);

  useEffect(() => {
    if (mode === "failed") return;
    const timer = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [mode, router]);

  if (mode === "failed") {
    return (
      <div className="text-center py-16 px-4 space-y-4" role="alert">
        <p className="text-sm text-gray-800 max-w-md mx-auto">
          تم تأكيد دفعتك (10 ر.س)، ولكن حدث خطأ تقني أثناء معالجة التحليل.
        </p>
        {error && <p className="text-xs text-red-700">{error}</p>}
        <Button variant="primary" pending={busy} onClick={() => void run()}>
          إعادة تشغيل التحليل مجانًا
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-16 px-4" role="status" aria-live="polite">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        تم تأكيد الدفع بنجاح — جارٍ تحليل العقارات...
      </h2>
      <p className="text-sm text-gray-600 mb-4">يستغرق التحليل بضع ثوانٍ لمطابقة الشروط وفحص المخاطر</p>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
