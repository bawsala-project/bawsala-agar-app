import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatSAR } from "@/lib/utils";
import type { ConstraintResult } from "@/lib/analysis/constraints";

interface ResultsPageProps {
  params: { id: string };
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  // 1. Guard with RLS
  await requireCase(params.id);

  // 2. Fetch latest committed run
  const supabase = createClient();
  const { data: runs } = await supabase
    .from("analysis_runs")
    .select("id, status, created_at, finished_at")
    .eq("case_id", params.id)
    .eq("status", "committed")
    .order("finished_at", { ascending: false })
    .limit(1);

  if (!runs || runs.length === 0) {
    redirect(`/case/${params.id}/preflight`);
  }

  const latestRunId = runs[0].id;

  // 3. Fetch assessments for this run
  const { data: assessments } = await supabase
    .from("property_assessments")
    .select(`
      *,
      properties (
        id,
        title,
        district,
        source_url,
        input_mode,
        notes
      )
    `)
    .eq("run_id", latestRunId);

  if (!assessments || assessments.length === 0) {
    redirect(`/case/${params.id}/preflight`);
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تقرير تقييم العقارات</h1>
          <p className="text-xs text-gray-500 mt-1">
            نتائج تحليل مطابقة العقارات لمتطلباتك وشروطك المحددة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/case/${params.id}/preflight`}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← الفحص المبدئي
          </Link>
        </div>
      </div>

      {/* Property Assessments List */}
      <div className="space-y-6">
        {assessments.map((a) => {
          const p = a.properties;
          let label = p?.title || p?.district || "";
          if (!label) {
            if (p?.input_mode === "url" && p?.source_url) {
              try {
                label = new URL(p.source_url).hostname;
              } catch {
                label = "رابط إلكتروني";
              }
            } else {
              label = p?.notes || "عقار بدون عنوان";
            }
          }

          const constraints = (a.constraint_results as unknown as ConstraintResult[]) || [];
          const strengths = (a.strengths as unknown as string[]) || [];
          const risks = (a.risks as unknown as string[]) || [];
          const keyUnknowns = (a.key_unknowns as unknown as string[]) || [];

          return (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm"
            >
              {/* Card Header: Title, Fit Rating, Visit Priority */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{label}</h2>
                  {a.price_per_sqm && (
                    <span className="text-xs text-blue-700 font-semibold mt-0.5 inline-block">
                      سعر المتر التقريبي: {formatSAR(Number(a.price_per_sqm))} / م²
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Fit Rating Badge */}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                      a.fit_rating === "strong"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : a.fit_rating === "partial"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : a.fit_rating === "weak"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {a.fit_rating === "strong"
                      ? "ملائم بقوة"
                      : a.fit_rating === "partial"
                      ? "ملائم جزئياً"
                      : a.fit_rating === "weak"
                      ? "ضعيف الملاءمة"
                      : "أدلة غير كافية"}
                  </span>

                  {/* Visit Priority Badge */}
                  <span className="text-xs px-2.5 py-1 rounded bg-gray-100 text-gray-700 font-medium">
                    أولوية المعاينة:{" "}
                    <strong className="text-gray-900">
                      {a.visit_priority === "high"
                        ? "عالية"
                        : a.visit_priority === "medium"
                        ? "متوسطة"
                        : a.visit_priority === "low"
                        ? "منخفضة"
                        : "غير محددة"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Fit Summary */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 mb-1">ملخص الملاءمة</h3>
                <p className="text-sm text-gray-800 leading-relaxed bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                  {a.fit_summary}
                </p>
              </div>

              {/* Constraints Evaluation List */}
              {constraints.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-500">فحص الشروط والمحددات المبرمجة</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {constraints.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className={`p-2.5 rounded border text-xs flex flex-col justify-between gap-1 ${
                          c.result === "pass"
                            ? "bg-green-50/50 border-green-200 text-green-900"
                            : c.result === "fail"
                            ? "bg-red-50/50 border-red-200 text-red-900"
                            : "bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{c.labelAr}</span>
                          <span>
                            {c.result === "pass"
                              ? "مطابق ✓"
                              : c.result === "fail"
                              ? "غير مطابق ✕"
                              : "غير مؤكد ؟"}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80">{c.detailAr}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Risks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Strengths */}
                <div className="p-3.5 bg-green-50/40 rounded-lg border border-green-100 space-y-1.5">
                  <h4 className="text-xs font-bold text-green-900">نقاط القوة</h4>
                  {strengths.length === 0 ? (
                    <p className="text-xs text-gray-400">لا توجد نقاط قوة مسجلة</p>
                  ) : (
                    <ul className="text-xs text-gray-700 space-y-1">
                      {strengths.map((s, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-1.5">
                          <span className="text-green-600 font-bold">+</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Risks */}
                <div className="p-3.5 bg-red-50/40 rounded-lg border border-red-100 space-y-1.5">
                  <h4 className="text-xs font-bold text-red-900">ملاحظات ومخاطر</h4>
                  {risks.length === 0 ? (
                    <p className="text-xs text-gray-400">لا توجد مخاطر مسجلة</p>
                  ) : (
                    <ul className="text-xs text-gray-700 space-y-1">
                      {risks.map((r, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-1.5">
                          <span className="text-red-600 font-bold">-</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Key Unknowns */}
              {keyUnknowns.length > 0 && (
                <div className="p-3 bg-amber-50/40 rounded-lg border border-amber-100 space-y-1">
                  <h4 className="text-xs font-bold text-amber-900">
                    معلومات هامة غير متوفرة يلزم التحقق منها
                  </h4>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    {keyUnknowns.map((u, uIdx) => (
                      <li key={uIdx} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Visit Priority Reason */}
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-600">
                <span className="font-semibold text-gray-700">مبرر أولوية المعاينة: </span>
                {a.visit_priority_reason}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Back Link */}
      <div className="pt-4 border-t border-gray-200">
        <Link
          href={`/case/${params.id}/properties`}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← العودة إلى قائمة العقارات
        </Link>
      </div>
    </div>
  );
}
