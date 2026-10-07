import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatSAR, cn } from "@/lib/utils";
import { resolveComparison, type PropertyAssessmentWithProperty } from "@/lib/analysis/compare";

interface ComparePageProps {
  params: { id: string };
}

const FIT_RATING_LABELS: Record<string, { label: string; badgeClasses: string }> = {
  strong: {
    label: "توافق قوي",
    badgeClasses: "bg-emerald-50 text-emerald-800 border-emerald-300",
  },
  partial: {
    label: "توافق جزئي",
    badgeClasses: "bg-amber-50 text-amber-800 border-amber-300",
  },
  weak: {
    label: "توافق ضعيف",
    badgeClasses: "bg-rose-50 text-rose-800 border-rose-300",
  },
  insufficient_evidence: {
    label: "بيانات غير كافية",
    badgeClasses: "bg-slate-100 text-slate-800 border-slate-300",
  },
};

const VISIT_PRIORITY_LABELS: Record<string, { label: string; badgeClasses: string }> = {
  high: {
    label: "معاينة مرتفعة",
    badgeClasses: "bg-emerald-100 text-emerald-800",
  },
  medium: {
    label: "معاينة متوسطة",
    badgeClasses: "bg-amber-100 text-amber-800",
  },
  low: {
    label: "معاينة منخفضة",
    badgeClasses: "bg-rose-100 text-rose-800",
  },
  insufficient_evidence: {
    label: "معاينة غير محددة",
    badgeClasses: "bg-slate-200 text-slate-800",
  },
};

export default async function ComparePage({ params }: ComparePageProps) {
  // 1. Guard with RLS
  await requireCase(params.id);

  // 2. Fetch requirements and latest committed run
  const supabase = createClient();

  const { data: requirements } = await supabase
    .from("requirements")
    .select("*")
    .eq("case_id", params.id)
    .maybeSingle();

  const { data: runs } = await supabase
    .from("analysis_runs")
    .select("id, status")
    .eq("case_id", params.id)
    .eq("status", "committed")
    .order("finished_at", { ascending: false })
    .limit(1);

  if (!runs || runs.length === 0) {
    redirect(`/case/${params.id}/preflight`);
  }

  const latestRunId = runs[0].id;

  // 3. Fetch property assessments with property details and facts
  const { data: assessments } = await supabase
    .from("property_assessments")
    .select(`
      *,
      properties (
        id,
        title,
        district,
        listing_price_sar,
        area_sqm,
        bedrooms,
        floor_no,
        source_url,
        input_mode,
        notes,
        property_facts (*)
      )
    `)
    .eq("run_id", latestRunId);

  // 4. Acceptance 3: If only 1 property exists, redirect to results with notice
  if (!assessments || assessments.length < 2) {
    redirect(`/case/${params.id}/results?notice=insufficient_compare`);
  }

  // 5. Pure Comparison Resolver
  const comparison = resolveComparison(
    assessments as unknown as PropertyAssessmentWithProperty[],
    requirements
  );

  const { mode, items, summaryAr, close_options } = comparison;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              مقارنة الخيارات جنباً إلى جنب
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {items.length} عقارات
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
            مقارنة موضوعية وترتيب مشتق من نتائج التحليل المعتمدة لمساعدتك في اتخاذ القرار والمفاضلة الذكية.
          </p>
        </div>

        <div>
          <Link
            href={`/case/${params.id}/results`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-700 hover:text-blue-600 bg-white border border-gray-300 hover:border-blue-400 rounded-lg px-3.5 py-2 transition-all shadow-sm"
          >
            <span>←</span>
            <span>العودة إلى النتائج الفردية</span>
          </Link>
        </div>
      </div>

      {/* Mode Banner */}
      <div
        role="region"
        aria-label="حالة الترتيب والمقارنة"
        className={cn(
          "rounded-xl border p-4 sm:p-5 flex items-start gap-3.5 shadow-sm transition-all",
          mode === "ranked"
            ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
            : mode === "provisional"
            ? "bg-amber-50/80 border-amber-200 text-amber-950"
            : "bg-slate-50 border-slate-200 text-slate-900"
        )}
      >
        <span className="text-lg select-none shrink-0 mt-0.5" aria-hidden="true">
          {mode === "ranked" ? "🏆" : mode === "provisional" ? "⚠️" : "ℹ️"}
        </span>
        <div className="space-y-1">
          <h2 className="text-sm sm:text-base font-bold text-inherit">
            {summaryAr}
          </h2>
          <p className="text-xs text-inherit opacity-90 leading-relaxed">
            {mode === "ranked"
              ? "الترتيب يعتمد أولاً على تفادي مخالفة أي شروط ملزمة، ثم على مستوى التوافق الإجمالي وأفضل قيمة لسعر المتر المربع."
              : mode === "provisional"
              ? "هناك شروط أساسية أو بيانات حاسمة غير مؤكدة في إعلانات الخيارات المتصدرة؛ التحقق الميداني قد يغير الترتيب الحالي."
              : "البيانات المسجلة محدودة؛ نوصي بإضافة المزيد من التفاصيل لإجراء مقارنة دقيقة."}
          </p>
        </div>
      </div>

      {/* Close Options Notice (if scores/prices are within 5% delta) */}
      {close_options && (
        <div
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50/80 text-blue-950 p-4 flex items-start gap-3 shadow-sm"
        >
          <span className="text-base shrink-0 select-none mt-0.5" aria-hidden="true">
            ⚖️
          </span>
          <div className="space-y-0.5">
            <h3 className="text-xs sm:text-sm font-bold text-blue-900">
              خيارات متقاربة جدًا
            </h3>
            <p className="text-xs text-blue-800/90 leading-relaxed">
              الخيارات الأولى متطابقة أو متقاربة للغاية في السعر ومستوى التوافق (فارق أقل من 5%)؛ احرص على مراجعة الفروقات والمفاضلات النوعية أدناه قبل اتخاذ القرار.
            </p>
          </div>
        </div>
      )}

      {/* Side-by-side Grid (Desktop) / Horizontal Snap Carousel (Mobile) */}
      <section
        aria-label="جدول مقارنة العقارات"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {items.map((item) => {
          const fitConfig = FIT_RATING_LABELS[item.fit_rating] || FIT_RATING_LABELS.insufficient_evidence;
          const priorityConfig = VISIT_PRIORITY_LABELS[item.visit_priority] || VISIT_PRIORITY_LABELS.insufficient_evidence;

          const isRank1 = item.rank === 1;

          return (
            <article
              key={item.property_id}
              className={cn(
                "bg-white rounded-2xl border flex flex-col shadow-sm overflow-hidden transition-all hover:shadow-md",
                isRank1
                  ? "border-blue-400 ring-2 ring-blue-500/20"
                  : "border-gray-200"
              )}
            >
              {/* Card Header & Rank */}
              <div
                className={cn(
                  "p-4 sm:p-5 border-b space-y-2.5",
                  isRank1 ? "bg-blue-50/40 border-blue-100" : "bg-gray-50/40 border-gray-100"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shadow-sm",
                        item.rank === 1
                          ? "bg-amber-400 text-amber-950"
                          : item.rank === 2
                          ? "bg-slate-300 text-slate-800"
                          : "bg-amber-700/30 text-amber-900"
                      )}
                    >
                      {item.rank ? `#${item.rank}` : "-"}
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      {item.rank === 1 ? "الخيار الأفضل" : item.rank === 2 ? "الخيار الثاني" : "الخيار الثالث"}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                      fitConfig.badgeClasses
                    )}
                  >
                    {fitConfig.label}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  {item.district && (
                    <p className="text-xs text-gray-500 mt-0.5">📍 حي {item.district}</p>
                  )}
                </div>
              </div>

              {/* Rows Comparison */}
              <div className="divide-y divide-gray-100 text-xs sm:text-sm flex-1">
                {/* Row 1: Badges */}
                <div className="p-3.5 sm:p-4 bg-white flex items-center justify-between gap-2">
                  <span className="text-gray-400 font-medium">أولوية المعاينة</span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-md text-xs font-bold",
                      priorityConfig.badgeClasses
                    )}
                  >
                    {priorityConfig.label}
                  </span>
                </div>

                {/* Row 2: Price & Price/m² & Budget Delta */}
                <div className="p-3.5 sm:p-4 bg-white space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-gray-400 font-medium">سعر العرض</span>
                    <span className="text-base sm:text-lg font-extrabold text-gray-900">
                      {item.price ? formatSAR(item.price) : "غير محدد"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>سعر المتر المربع</span>
                    <span className="font-semibold text-gray-700">
                      {item.price_per_sqm
                        ? `${Math.round(item.price_per_sqm).toLocaleString("ar-SA")} ر.س / م²`
                        : "غير متوفر"}
                    </span>
                  </div>

                  {item.price_delta_budget !== null && (
                    <div className="pt-1">
                      {item.price_delta_budget < 0 ? (
                        <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          توفير {formatSAR(Math.abs(item.price_delta_budget))} عن الميزانية
                        </span>
                      ) : item.price_delta_budget > 0 ? (
                        <span className="inline-block text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                          يتجاوز الميزانية بـ {formatSAR(item.price_delta_budget)}
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                          يطابق الميزانية القصوى تماماً
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Row 3: Area & Bedrooms */}
                <div className="p-3.5 sm:p-4 bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-medium">المساحة</span>
                    <span className="font-bold text-gray-900">
                      {item.area_sqm ? `${item.area_sqm} م²` : "غير متوفرة"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-medium">غرف النوم</span>
                    <span className="font-bold text-gray-900">
                      {item.bedrooms !== null ? `${item.bedrooms} غرف نوم` : "غير متوفرة"}
                    </span>
                  </div>
                </div>

                {/* Row 4: Hard Constraints Status */}
                <div className="p-3.5 sm:p-4 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-medium">الشروط الملزمة</span>
                    <span className="font-semibold text-gray-700 text-xs">
                      {item.constraint_summary.pass} مطابق / {item.constraint_summary.fail} غير مطابق
                    </span>
                  </div>

                  <div className="space-y-1">
                    {item.constraints.slice(0, 4).map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-gray-600 truncate max-w-[170px]">{c.labelAr}</span>
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded text-[11px] font-bold shrink-0",
                            c.result === "pass"
                              ? "text-emerald-700 bg-emerald-50"
                              : c.result === "fail"
                              ? "text-rose-700 bg-rose-50"
                              : "text-amber-700 bg-amber-50"
                          )}
                        >
                          {c.result === "pass" ? "مطابق" : c.result === "fail" ? "مخالف" : "غير مؤكد"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 5: لماذا هذا الترتيب؟ */}
                <div className="p-3.5 sm:p-4 bg-gray-50/50 space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>لماذا هذا الترتيب؟</span>
                  </h4>

                  <div className="space-y-1.5 text-xs">
                    <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-950">
                      <span className="font-bold block text-emerald-800 mb-0.5">أبرز ميزة تنافسية:</span>
                      <p className="leading-relaxed">{item.main_advantage_ar}</p>
                    </div>

                    <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-100 text-rose-950">
                      <span className="font-bold block text-rose-800 mb-0.5">أبرز تضحية أو قيد:</span>
                      <p className="leading-relaxed">{item.main_tradeoff_ar}</p>
                    </div>
                  </div>
                </div>

                {/* Row 6: ما الذي قد يغيّر الترتيب؟ */}
                <div className="p-3.5 sm:p-4 bg-white space-y-1.5">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <span>🔍</span>
                    <span>ما الذي قد يغيّر الترتيب؟</span>
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100">
                    {item.what_could_change_rank_ar}
                  </p>
                </div>
              </div>

              {/* Row 7: Action Button */}
              <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                <Link
                  href={`/case/${params.id}/inspection?propertyId=${item.property_id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-gray-900 hover:bg-black text-white shadow-sm transition-all active:scale-[0.98]"
                >
                  <span>قائمة المعاينة الميدانية</span>
                  <span aria-hidden="true">←</span>
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {/* Bottom Navigation */}
      <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
        <Link
          href={`/case/${params.id}/results`}
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span>←</span>
          <span>العودة إلى النتائج الفردية</span>
        </Link>
      </div>
    </div>
  );
}
