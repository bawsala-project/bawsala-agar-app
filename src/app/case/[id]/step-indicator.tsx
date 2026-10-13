"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  caseId: string;
}

export function StepIndicator({ caseId }: StepIndicatorProps) {
  const segment = useSelectedLayoutSegment();

  const steps = [
    { key: "needs", label: "الاحتياج", href: `/case/${caseId}/needs`, stepNum: 1 },
    { key: "properties", label: "العقارات", href: `/case/${caseId}/properties`, stepNum: 2 },
    { key: "preflight", label: "الفحص المبدئي", href: `/case/${caseId}/preflight`, stepNum: 3 },
    { key: "results", label: "النتائج", href: `/case/${caseId}/results`, stepNum: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => {
    if (s.key === "results") {
      return segment === "results" || segment === "compare";
    }
    return segment === s.key;
  });

  return (
    <nav aria-label="مراحل القرار" className="flex items-center gap-1.5 p-1.5 rounded-full bg-slate-100/70 border border-slate-200/40 text-xs font-semibold text-slate-600">
      {steps.map((step, idx) => {
        const isActive = idx === currentStepIndex;
        const isPast = idx < currentStepIndex;

        return (
          <div key={step.key} className="flex items-center gap-1.5">
            <Link
              href={step.href}
              className={cn(
                "px-3.5 py-1.5 sm:py-2 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap",
                isActive
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : isPast
                  ? "bg-white text-slate-800 border border-slate-200/60 hover:border-slate-300 font-semibold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/60 font-medium"
              )}
            >
              {isPast ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span
                  className={cn(
                    "w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                  )}
                >
                  {step.stepNum}
                </span>
              )}
              <span>{step.label}</span>
            </Link>

            {idx < steps.length - 1 && (
              <span className="text-slate-300 select-none text-[11px] hidden sm:inline" aria-hidden="true">
                •
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
