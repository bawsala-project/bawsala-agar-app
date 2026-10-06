"use client";

import React from "react";
import { useFormState as useActionState } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PreflightResult } from "@/lib/preflight/evaluate";
import { startAnalysis, AnalysisActionState } from "@/actions/analysis";

interface PreflightViewProps {
  caseId: string;
  evaluation: PreflightResult;
}

export function PreflightView({ caseId, evaluation }: PreflightViewProps) {
  const initialActionState: AnalysisActionState = {};
  const actionWithId = startAnalysis.bind(null, caseId);
  const [state, formAction, isPending] = useActionState(actionWithId, initialActionState);

  const blockersCount = evaluation.blockers.length;
  const warningsCount = evaluation.warnings.length;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Status Line */}
      <div className="border-b border-gray-200 pb-5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الفحص المبدئي للحالة</h1>
            <p className="text-xs text-gray-500 mt-1">
              التحقق التلقائي من اكتمال البيانات وجاهزيتها للتحليل والمقارنة
            </p>
          </div>

          <div>
            {evaluation.ready ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                <span className="w-2 h-2 rounded-full bg-green-600" />
                جاهز للتحليل
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                يلزم إكمال {blockersCount} عنصر قبل التحليل
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Global Form Error Message if any */}
      {state.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          {state.error}
        </div>
      )}

      {/* Blockers Section */}
      {blockersCount > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-red-200 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <h2 className="text-lg font-bold text-red-900">
              متطلبات يجب إكمالها ({blockersCount})
            </h2>
          </div>

          <div className="space-y-3">
            {evaluation.blockers.map((blocker, idx) => {
              let actionLink = "";
              let actionText = "";

              if (blocker.code === "NO_REQUIREMENTS") {
                actionLink = `/case/${caseId}/needs`;
                actionText = "تحديد الاحتياجات";
              } else if (blocker.code === "NO_PROPERTIES") {
                actionLink = `/case/${caseId}/properties`;
                actionText = "إضافة عقارات";
              } else if (blocker.propertyId) {
                actionLink = `/case/${caseId}/properties/${blocker.propertyId}`;
                actionText = "تدقيق العقار";
              }

              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-50/60 rounded-lg border border-red-200"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-red-600 font-bold text-sm mt-0.5">•</span>
                    <div>
                      <p className="text-sm font-semibold text-red-950">
                        {blocker.messageAr}
                      </p>
                      <span className="text-[11px] text-red-700/80 font-mono">
                        [{blocker.code}]
                      </span>
                    </div>
                  </div>

                  {actionLink && (
                    <Link
                      href={actionLink}
                      className="inline-flex items-center justify-center text-xs font-bold text-red-700 hover:text-red-900 bg-white hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded transition-colors self-start sm:self-center flex-shrink-0"
                    >
                      {actionText} ←
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Warnings Section */}
      {warningsCount > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">
              تنبيهات وملاحظات ({warningsCount})
            </h2>
          </div>

          <p className="text-xs text-gray-500">
            هذه الملاحظات لا تمنع بدء التحليل، ولكن معالجتها ترفع من دقة وموثوقية تقرير القرار:
          </p>

          <div className="space-y-2">
            {evaluation.warnings.map((warning, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/50 rounded-lg border border-amber-200"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-amber-600 font-bold text-sm mt-0.5">•</span>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-800">
                      {warning.messageAr}
                    </p>
                    <span className="text-[10px] text-gray-500 font-mono">
                      [{warning.code}]
                    </span>
                  </div>
                </div>

                {warning.propertyId && (
                  <Link
                    href={`/case/${caseId}/properties/${warning.propertyId}`}
                    className="inline-flex items-center justify-center text-xs font-medium text-amber-900 hover:text-amber-950 bg-white hover:bg-amber-100/50 border border-amber-300 px-2.5 py-1 rounded transition-colors self-start sm:self-center flex-shrink-0"
                  >
                    تدقيق العقار ←
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ready Banner when no blockers and no warnings */}
      {evaluation.ready && warningsCount === 0 && (
        <div className="p-6 bg-green-50 rounded-lg border border-green-200 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xl font-bold">
            ✓
          </div>
          <h3 className="text-base font-bold text-green-900">
            جميع متطلبات وعقارات المقارنة مكتملة وجاهزة
          </h3>
          <p className="text-xs text-green-700 max-w-md mx-auto">
            تم استخراج وتأكيد الحقائق الأساسية ومطابقتها مع ميزانيتك وشروطك بنجاح. يمكنك الآن الانتقال لمرحلة التحليل الشامل.
          </p>
        </div>
      )}

      {/* Actions and Start Analysis Button */}
      <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href={`/case/${caseId}/properties`}
          className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors order-2 sm:order-1"
        >
          ← العودة إلى قائمة العقارات
        </Link>

        <form action={formAction} className="w-full sm:w-auto order-1 sm:order-2">
          <Button
            type="submit"
            variant="primary"
            pending={isPending}
            disabled={!evaluation.ready || isPending}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold shadow-sm"
          >
            ابدأ التحليل
          </Button>
        </form>
      </div>
    </div>
  );
}
