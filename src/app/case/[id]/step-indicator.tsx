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
    { key: "preflight", label: "فحص الجاهزية", href: `/case/${caseId}/preflight`, stepNum: 3 },
    { key: "results", label: "النتائج", href: `/case/${caseId}/results`, stepNum: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => {
    if (s.key === "results") {
      return segment === "results" || segment === "compare";
    }
    return segment === s.key;
  });

  const activeIdx = Math.max(currentStepIndex, 0);
  const activeStep = steps[activeIdx];

  return (
    <>
    {/* Mobile compact progress & clickable step navigation (below sm) */}
    <div className="sm:hidden w-full select-none space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-[var(--navy)]">
        <span>الخطوة {activeStep.stepNum} من {steps.length} · {activeStep.label}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5" role="navigation" aria-label="مراحل القرار للجوال">
        {steps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isPast = idx < currentStepIndex;
          return (
            <Link
              key={step.key}
              href={step.href}
              prefetch={false}
              className={cn(
                "px-2 py-1.5 rounded-xl text-[11px] flex items-center justify-center gap-1 text-center transition-all no-underline border",
                isActive
                  ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] font-bold shadow-xs"
                  : isPast
                  ? "bg-[var(--paper)] text-[var(--navy)] border-[var(--mist)] font-semibold"
                  : "bg-[var(--cream)]/60 text-[var(--dusty-blue)] border-[var(--mist)]/60 font-medium"
              )}
            >
              {isPast ? (
                <CheckCircle2 className="w-3 h-3 text-[#1E6B43] shrink-0" />
              ) : (
                <span className="text-[10px] font-bold">{step.stepNum}.</span>
              )}
              <span className="truncate">{step.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
    <nav aria-label="مراحل القرار" className="hidden sm:flex items-center gap-1.5 p-1 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-xs font-semibold text-[var(--dusty-blue)] select-none">
      {steps.map((step, idx) => {
        const isActive = idx === currentStepIndex;
        const isPast = idx < currentStepIndex;

        return (
          <div key={step.key} className="flex items-center gap-1">
            <Link
              href={step.href}
              prefetch={false}
              className={cn(
                "px-3.5 py-1.5 sm:py-2 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap no-underline focus:outline-hidden",
                isActive
                  ? "bg-[var(--navy)] text-[var(--cream)] shadow-xs font-bold"
                  : isPast
                  ? "bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] hover:bg-[var(--cream)] font-medium"
                  : "text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:bg-[var(--paper)] font-medium"
              )}
            >
              {isPast ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--navy)] shrink-0" />
              ) : (
                <span
                  className={cn(
                    "w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0",
                    isActive
                      ? "bg-[var(--cream)] text-[var(--navy)] font-black"
                      : "bg-[var(--mist)]/40 text-[var(--dusty-blue)]"
                  )}
                >
                  {step.stepNum}
                </span>
              )}
              <span>{step.label}</span>
            </Link>

            {idx < steps.length - 1 && (
              <span className="text-[var(--mist)] select-none text-[11px] hidden sm:inline" aria-hidden="true">
                •
              </span>
            )}
          </div>
        );
      })}
    </nav>
    </>
  );
}
