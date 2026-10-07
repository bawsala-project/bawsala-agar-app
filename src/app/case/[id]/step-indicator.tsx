"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";

export function StepIndicator({ caseId }: { caseId: string }) {
  const segment = useSelectedLayoutSegment();

  const isNeeds = segment === "needs";
  const isProperties = segment === "properties";
  const isPreflight = segment === "preflight";
  const isResults = segment === "results" || segment === "compare";

  return (
    <nav aria-label="مراحل القرار" className="w-full flex items-center justify-center gap-3 py-4 text-sm">
      <Link
        href={`/case/${caseId}/needs`}
        className={cn(
          "transition-colors",
          isNeeds
            ? "font-bold text-blue-600 underline underline-offset-4"
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        الاحتياج
      </Link>

      <span className="text-gray-400 select-none" aria-hidden="true">
        ←
      </span>

      <Link
        href={`/case/${caseId}/properties`}
        className={cn(
          "transition-colors",
          isProperties
            ? "font-bold text-blue-600 underline underline-offset-4"
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        العقارات
      </Link>

      <span className="text-gray-400 select-none" aria-hidden="true">
        ←
      </span>

      <Link
        href={`/case/${caseId}/preflight`}
        className={cn(
          "transition-colors",
          isPreflight
            ? "font-bold text-blue-600 underline underline-offset-4"
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        الفحص المبدئي
      </Link>

      <span className="text-gray-400 select-none" aria-hidden="true">
        ←
      </span>

      <Link
        href={`/case/${caseId}/results`}
        className={cn(
          "transition-colors",
          isResults
            ? "font-bold text-blue-600 underline underline-offset-4"
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        النتائج
      </Link>
    </nav>
  );
}
