import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Scale,
  Trophy,
  AlertTriangle,
  Info,
  ArrowRight,
  MapPin,
  Lightbulb,
  Search,
  ClipboardCheck,
} from "lucide-react";
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
    badgeClasses: "bg-emerald-50 text-emerald-800 border-emerald-300/80 shadow-xs",
  },
  partial: {
    label: "توافق جزئي",
    badgeClasses: "bg-amber-50 text-amber-800 border-amber-300/80 shadow-xs",
  },
  weak: {
    label: "توافق ضعيف",
    badgeClasses: "bg-rose-50 text-rose-800 border-rose-300/80 shadow-xs",
  },
  insufficient_evidence: {
    label: "بيانات غير كافية",
    badgeClasses: "bg-slate-100 text-slate-800 border-slate-300/80 shadow-xs",
  },
};

const VISIT_PRIORITY_LABELS: Record<string, { label: string; badgeClasses: string }> = {
  high: {
    label: "معاينة مرتفعة",
    badgeClasses: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  medium: {
    label: "معاينة متوسطة",
    badgeClasses: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  low: {
    label: "معاينة منخفضة",
    badgeClasses: "bg-rose-100 text-rose-800 border border-rose-200",
  },
  insufficient_evidence: {
    label: "معاينة غير محددة",
    badgeClasses: "bg-slate-200 text-slate-800 border border-slate-300",
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10">
      {/* Top Header Card */}
      <div className="relative bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-6 overflow-hidden">
        {/* Subtle Ambient Background Light */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/70">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                المرحلة 4 من 4 • مصفوفة المقارنة المباشرة
              </span>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
                {items.length} عقارات
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              مقارنة الخيارات جنباً إلى جنب
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              مقارنة موضوعية وترتيب مشتق من نتائج التحليل المعتمدة لمساعدتك في اتخاذ القرار والمفاضلة الذكية.
            </p>
          </div>

          <div className="self-start sm:self-center shrink-0">
            <Link
              href={`/case/${params.id}/results`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-4 py-2.5 rounded-xl transition-all shadow-xs"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة إلى النتائج الفردية</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mode Banner */}
      <div
        role="region"
        aria-label="حالة الترتيب والمقارنة"
        className={cn(
          "rounded-3xl border p-5 sm:p-6 flex items-start gap-4 shadow-sm transition-all",
          mode === "ranked"
            ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950"
            : mode === "provisional"
            ? "bg-amber-50/70 border-amber-200/80 text-amber-950"
            : "bg-slate-50 border-slate-200 text-slate-900"
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-bold",
            mode === "ranked"
              ? "bg-emerald-600 text-white"
              : mode === "provisional"
              ? "bg-amber-500 text-white"
              : "bg-slate-800 text-white"
          )}
        >
          {mode === "ranked" ? (
            <Trophy className="w-5 h-5" />
          ) : mode === "provisional" ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Info className="w-5 h-5" />
          )}
        </div>

        <div className="space-y-1.5 flex-1">
          <h2 className="text-base sm:text-lg font-extrabold text-inherit">
            {summaryAr}
          </h2>
          <p className="text-xs sm:text-sm text-inherit opacity-90 leading-relaxed font-normal">
            {mode === "ranked"
              ? "الترتيب يعتمد أولاً على تفادي مخالفة أي شروط ملزمة، ثم على مستوى التوافق الإجمالي وأفضل قيمة لسعر المتر المربع."
              : mode === "provisional"
              ? "هناك شروط أساسية أو بيانات حاسمة غير مؤكدة في إعلانات الخيارات المتصدرة؛ التحقق الميداني قد يغير الترتيب الحالي."
              : "البيانات المسجلة محدودة؛ نوصي بإضافة المزيد من التفاصيل لإجراء مقارنة دقيقة."}
          </p>
        </div>
      </div>

      {/* Close Options Notice */}
      {close_options && (
        <div
          role="status"
          className="rounded-2xl border border-blue-200 bg-blue-50/80 text-blue-950 p-5 flex items-start gap-3.5 shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <Scale className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-blue-900">
              خيارات متقاربة جدًا
            </h3>
            <p className="text-xs text-blue-800/90 leading-relaxed">
              الخيارات الأولى متطابقة أو متقاربة للغاية في السعر ومستوى التوافق (فارق أقل من 5%)؛ احرص على مراجعة الفروقات والمفاضلات النوعية أدناه قبل اتخاذ القرار.
            </p>
          </div>
        </div>
      )}

      {/* Side-by-side Grid */}
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
                "bg-white rounded-3xl border flex flex-col shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-slate-300 relative",
                isRank1
                  ? "border-blue-400 ring-2 ring-blue-500/20"
                  : "border-slate-200/80"
              )}
            >
              {/* Card Header & Rank */}
              <div
                className={cn(
                  "p-5 sm:p-6 border-b space-y-3",
                  isRank1 ? "bg-blue-50/40 border-blue-100" : "bg-slate-50/40 border-slate-100"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black shadow-xs",
                        item.rank === 1
                          ? "bg-amber-400 text-amber-950"
                          : item.rank === 2
                          ? "bg-slate-200 text-slate-800"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {item.rank ? `#${item.rank}` : "-"}
                    </span>
                    <span className="text-xs font-extrabold text-slate-600">
                      {item.rank === 1 ? "الخيار الأفضل" : item.rank === 2 ? "الخيار الثاني" : "الخيار الثالث"}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold border",
                      fitConfig.badgeClasses
                    )}
                  >
                    {fitConfig.label}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  {item.district && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>حي {item.district}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Rows Comparison */}
              <div className="divide-y divide-slate-100 text-xs sm:text-sm flex-1">
                {/* Row 1: Badges */}
                <div className="p-4 bg-white flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-bold text-xs">أولوية المعاينة</span>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-bold shadow-xs",
                      priorityConfig.badgeClasses
                    )}
                  >
                    {priorityConfig.label}
                  </span>
                </div>

                {/* Row 2: Price & Price/m² & Budget Delta */}
                <div className="p-4 bg-white space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-slate-400 font-bold text-xs">سعر العرض</span>
                    <span className="text-lg sm:text-xl font-black text-slate-900">
                      {item.price ? formatSAR(item.price) : "غير محدد"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="text-slate-400 font-medium">سعر المتر المربع</span>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.price_per_sqm
                        ? `${Math.round(item.price_per_sqm).toLocaleString("ar-SA")} ر.س / م²`
                        : "غير متوفر"}
                    </span>
                  </div>

                  {item.price_delta_budget !== null && (
                    <div className="pt-1">
                      {item.price_delta_budget < 0 ? (
                        <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          توفير {formatSAR(Math.abs(item.price_delta_budget))} عن الميزانية
                        </span>
                      ) : item.price_delta_budget > 0 ? (
                        <span className="inline-block text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                          يتجاوز الميزانية بـ {formatSAR(item.price_delta_budget)}
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                          يطابق الميزانية القصوى تماماً
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Row 3: Area & Bedrooms */}
                <div className="p-4 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold text-xs">المساحة</span>
                    <span className="font-extrabold text-slate-900">
                      {item.area_sqm ? `${item.area_sqm} م²` : "غير متوفرة"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold text-xs">غرف النوم</span>
                    <span className="font-extrabold text-slate-900">
                      {item.bedrooms !== null ? `${item.bedrooms} غرف نوم` : "غير متوفرة"}
                    </span>
                  </div>
                </div>

                {/* Row 4: Hard Constraints Status */}
                <div className="p-4 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold text-xs">الشروط الملزمة</span>
                    <span className="font-bold text-slate-700 text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.constraint_summary.pass} مطابق / {item.constraint_summary.fail} غير مطابق
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {item.constraints.slice(0, 4).map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-slate-600 truncate max-w-[170px]">{c.labelAr}</span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0",
                            c.result === "pass"
                              ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                              : c.result === "fail"
                              ? "text-rose-700 bg-rose-50 border border-rose-200/60"
                              : "text-amber-700 bg-amber-50 border border-amber-200/60"
                          )}
                        >
                          {c.result === "pass" ? "مطابق" : c.result === "fail" ? "مخالف" : "غير مؤكد"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 5: لماذا هذا الترتيب؟ */}
                <div className="p-4 bg-slate-50/50 space-y-2.5">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>لماذا هذا الترتيب؟</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-950">
                      <span className="font-extrabold block text-emerald-800 mb-0.5">أبرز ميزة تنافسية:</span>
                      <p className="leading-relaxed font-medium">{item.main_advantage_ar}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-rose-950">
                      <span className="font-extrabold block text-rose-800 mb-0.5">أبرز تضحية أو قيد:</span>
                      <p className="leading-relaxed font-medium">{item.main_tradeoff_ar}</p>
                    </div>
                  </div>
                </div>

                {/* Row 6: ما الذي قد يغيّر الترتيب؟ */}
                <div className="p-4 bg-white space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-blue-600" />
                    <span>ما الذي قد يغيّر الترتيب؟</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                    {item.what_could_change_rank_ar}
                  </p>
                </div>
              </div>

              {/* Row 7: Action Button */}
              <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 mt-auto">
                <Link
                  href={`/case/${params.id}/inspection?propertyId=${item.property_id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold bg-slate-900 hover:bg-blue-600 text-white shadow-sm transition-all active:scale-[0.98]"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>قائمة المعاينة الميدانية</span>
                  <span aria-hidden="true">←</span>
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {/* Bottom Navigation */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex items-center justify-between">
        <Link
          href={`/case/${params.id}/results`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى النتائج الفردية</span>
        </Link>
      </div>
    </div>
  );
}
