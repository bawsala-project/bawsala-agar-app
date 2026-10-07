import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatSAR, cn } from "@/lib/utils";
import { reassessPropertyAction } from "@/actions/analysis";
import type {
  ReassessmentDiff,
  FitRating,
  VisitPriority,
} from "@/lib/analysis/reassess";

interface ReassessPageProps {
  params: { id: string };
  searchParams?: { propertyId?: string };
}

const FIT_RATING_LABELS: Record<FitRating, { label: string; badgeClasses: string }> = {
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

const VISIT_PRIORITY_LABELS: Record<VisitPriority, { label: string; badgeClasses: string }> = {
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

function getPropertyLabel(
  prop: { title?: string | null; district?: string | null },
  idx: number
): string {
  if (prop.title) return prop.title;
  if (prop.district) return `عقار ${prop.district}`;
  return `عقار ${idx + 1}`;
}

export default async function ReassessPage({
  params,
  searchParams,
}: ReassessPageProps) {
  // 1. Guard with RLS
  await requireCase(params.id);

  const supabase = createClient();

  // 2. Fetch properties for this case
  const { data: properties, error: propErr } = await supabase
    .from("properties")
    .select("id, title, district, listing_price_sar, area_sqm, bedrooms, floor_no")
    .eq("case_id", params.id)
    .order("created_at", { ascending: true });

  if (propErr || !properties || properties.length === 0) {
    redirect(`/case/${params.id}/properties`);
  }

  // Determine active property
  const activePropertyId = searchParams?.propertyId || properties[0].id;
  const activeProperty =
    properties.find((p) => p.id === activePropertyId) || properties[0];

  // 3. Fetch latest committed run
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

  // 4. Count findings for active property
  const { count: findingsCount } = await supabase
    .from("inspection_findings")
    .select("id", { count: "exact", head: true })
    .eq("property_id", activeProperty.id);

  const hasFindings = (findingsCount || 0) > 0;

  // 5. Execute or load reassessment
  let diff: ReassessmentDiff | null = null;
  let isStale = false;
  let errorMessage: string | null = null;

  if (hasFindings) {
    const reassessResult = await reassessPropertyAction(params.id, activeProperty.id);
    if (reassessResult.success && reassessResult.diff) {
      diff = reassessResult.diff;
    } else if (reassessResult.stale) {
      isStale = true;
      errorMessage = reassessResult.messageAr || "تغيّرت بيانات أو اشتراطات العقار أثناء المعاينة.";
    } else {
      errorMessage = reassessResult.error || "تعذر إكمال إعادة التقييم.";
    }
  }

  // 6. Fetch updated assessment for this property
  const { data: currentAssessment } = await supabase
    .from("property_assessments")
    .select("*")
    .eq("run_id", latestRunId)
    .eq("property_id", activeProperty.id)
    .maybeSingle();

  const activeIdx = properties.findIndex((p) => p.id === activeProperty.id);
  const activeLabel = getPropertyLabel(activeProperty, activeIdx);
  const hasMultipleProperties = properties.length > 1;

  const currentFit = (currentAssessment?.fit_rating as FitRating) || "insufficient_evidence";
  const currentVisit = (currentAssessment?.visit_priority as VisitPriority) || "insufficient_evidence";
  const fitInfo = FIT_RATING_LABELS[currentFit] || FIT_RATING_LABELS.insufficient_evidence;
  const visitInfo = VISIT_PRIORITY_LABELS[currentVisit] || VISIT_PRIORITY_LABELS.insufficient_evidence;

  const compareHref = hasMultipleProperties
    ? `/case/${params.id}/compare`
    : `/case/${params.id}/results`;
  const compareLabel = hasMultipleProperties
    ? "العودة إلى مقارنة الخيارات المحدّثة ←"
    : "العودة إلى تقرير التقييم المحدّث ←";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8" dir="rtl">
      {/* Breadcrumb / Navigation */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <Link
          href={`/case/${params.id}/inspection?propertyId=${activeProperty.id}`}
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
        >
          <span aria-hidden="true">→</span>
          <span>العودة لقائمة الفحص الميداني</span>
        </Link>
        <span className="text-gray-400">المرحلة: إعادة التقييم الميداني</span>
      </div>

      {/* Header Banner */}
      <header className="rounded-2xl bg-gradient-to-l from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-7 shadow-lg space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
          <span>🔄</span>
          <span>تحديث التقييم بعد الزيارة</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
          نتائج إعادة التقييم بعد المعاينة الميدانية
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          إعادة تقييم محاور المطابقة المتأثرة بالشواهد الميدانية الفعلية فقط، مع تثبيت بقية المحاور والأسعار دون تغيير.
        </p>
      </header>

      {/* Property Switcher Tabs (if 2+ properties exist) */}
      {hasMultipleProperties && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 block">
            اختر العقار لاستعراض إعادة تقييمه:
          </label>
          <div
            className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar"
            role="tablist"
            aria-label="قوائم إعادة تقييم العقارات"
          >
            {properties.map((prop, idx) => {
              const isActive = prop.id === activeProperty.id;
              const label = getPropertyLabel(prop, idx);
              return (
                <Link
                  key={prop.id}
                  href={`/case/${params.id}/reassess?propertyId=${prop.id}`}
                  role="tab"
                  aria-selected={isActive}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-2 border",
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isActive ? "bg-white" : "bg-gray-300"
                    )}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Stale State Banner */}
      {isStale && (
        <div
          role="alert"
          className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm space-y-2 shadow-sm"
        >
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <span className="text-base">⚠️</span>
            <span>تنبيه: تزامن غير مكتمل (بيانات محدثة)</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            {errorMessage || "تغيّرت بيانات أو اشتراطات العقار أثناء المعاينة الميدانية. تم منع التعديل التلقائي لضمان الدقة."}
          </p>
          <div className="pt-1">
            <Link
              href={`/case/${params.id}/inspection?propertyId=${activeProperty.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors"
            >
              مراجعة قائمة الفحص والمحاولة مجدداً
            </Link>
          </div>
        </div>
      )}

      {/* Property Overview Card */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              العقار قيد المراجعة
            </span>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-1">
              {activeLabel}
            </h2>
            {activeProperty.district && (
              <p className="text-xs text-gray-500">حي {activeProperty.district}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border",
                fitInfo.badgeClasses
              )}
            >
              <span>{fitInfo.label}</span>
            </span>

            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                visitInfo.badgeClasses
              )}
            >
              <span>{visitInfo.label}</span>
            </span>
          </div>
        </div>

        {/* Pricing and Key Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="text-gray-500 block">السعر المعروض</span>
            <span className="font-extrabold text-gray-900 text-sm">
              {activeProperty.listing_price_sar
                ? formatSAR(Number(activeProperty.listing_price_sar))
                : "غير محدد"}
            </span>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="text-gray-500 block">المساحة</span>
            <span className="font-extrabold text-gray-900 text-sm">
              {activeProperty.area_sqm ? `${activeProperty.area_sqm} م²` : "غير محددة"}
            </span>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="text-gray-500 block">سعر المتر المربع</span>
            <span className="font-extrabold text-gray-900 text-sm">
              {currentAssessment?.price_per_sqm
                ? `${formatSAR(Number(currentAssessment.price_per_sqm))} / م²`
                : "غير متوفر"}
            </span>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="text-gray-500 block">نتائج الفحص المسجلة</span>
            <span className="font-extrabold text-blue-600 text-sm">
              {findingsCount || 0} شواهد
            </span>
          </div>
        </div>
      </section>

      {/* Visual Diff Box: "ما الذي تغير؟" */}
      {diff ? (
        <section
          aria-labelledby="diff-heading"
          className="rounded-2xl border-2 border-blue-200 bg-white p-5 sm:p-7 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl shrink-0 border border-blue-200">
              ⚖️
            </div>
            <div>
              <h2
                id="diff-heading"
                className="text-base sm:text-lg font-black text-gray-900"
              >
                ما الذي تغير بعد المعاينة الميدانية؟
              </h2>
              <p className="text-xs text-gray-500">
                الفروقات المباشرة الناتجة عن شواهدك المسجلة على أرض الواقع مقارنة بالتحليل الأولي.
              </p>
            </div>
          </div>

          {/* Rating & Priority Transitions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fit Rating Diff Card */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs font-bold text-gray-600 block">
                تغير درجة التوافق الإجمالية:
              </span>
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-lg border",
                    FIT_RATING_LABELS[diff.previousFitRating]?.badgeClasses || "bg-gray-100 text-gray-600"
                  )}
                >
                  {FIT_RATING_LABELS[diff.previousFitRating]?.label || diff.previousFitRating}
                </span>

                <span className="text-gray-400 text-sm font-bold" aria-hidden="true">
                  ←
                </span>

                <span
                  className={cn(
                    "px-2.5 py-1 rounded-lg border shadow-xs",
                    FIT_RATING_LABELS[diff.newFitRating]?.badgeClasses || "bg-gray-100 text-gray-600"
                  )}
                >
                  {FIT_RATING_LABELS[diff.newFitRating]?.label || diff.newFitRating}
                </span>
              </div>

              {diff.previousFitRating !== diff.newFitRating ? (
                <p className="text-[11px] text-rose-700 font-semibold pt-1">
                  {diff.newFitRating === "weak"
                    ? "⚠️ انخفض التقييم إلى توافق ضعيف لمخالفة اشتراط أساسي أثناء المعاينة."
                    : "تغيرت درجة التوافق بناءً على الشواهد الميدانية المعتمدة."}
                </p>
              ) : (
                <p className="text-[11px] text-gray-500 pt-1">
                  درجة التوافق لم تتأثر بالشواهد الميدانية الحالية.
                </p>
              )}
            </div>

            {/* Visit Priority Diff Card */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs font-bold text-gray-600 block">
                تغير أولوية المعاينة والتوصية:
              </span>
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-lg",
                    VISIT_PRIORITY_LABELS[diff.previousVisitPriority]?.badgeClasses || "bg-gray-100 text-gray-600"
                  )}
                >
                  {VISIT_PRIORITY_LABELS[diff.previousVisitPriority]?.label || diff.previousVisitPriority}
                </span>

                <span className="text-gray-400 text-sm font-bold" aria-hidden="true">
                  ←
                </span>

                <span
                  className={cn(
                    "px-2.5 py-1 rounded-lg shadow-xs",
                    VISIT_PRIORITY_LABELS[diff.newVisitPriority]?.badgeClasses || "bg-gray-100 text-gray-600"
                  )}
                >
                  {VISIT_PRIORITY_LABELS[diff.newVisitPriority]?.label || diff.newVisitPriority}
                </span>
              </div>

              <p className="text-[11px] text-gray-500 pt-1">
                {diff.previousVisitPriority !== diff.newVisitPriority
                  ? "تم تحديث مستوى التوصية ليعكس واقع الزيارة."
                  : "مستوى التوصية مستقر."}
              </p>
            </div>
          </div>

          {/* Added Risks / Detected Problems */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="text-rose-600">⚠️</span>
              <span>مخاطر وملاحظات سلبية جديدة رُصدت ميدانياً:</span>
            </h3>

            {diff.addedRisks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {diff.addedRisks.map((risk, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-start gap-2"
                  >
                    <span className="text-rose-500 select-none">•</span>
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <span>✅</span>
                <span>لم تُسجل أي ملاحظات سلبية جديدة أثناء المعاينة.</span>
              </div>
            )}
          </div>

          {/* Resolved Unknowns */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">✨</span>
              <span>اشتراطات ونقاط غير مؤكدة تم حسمها وتأكيدها:</span>
            </h3>

            {diff.resolvedUnknowns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {diff.resolvedUnknowns.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-start gap-2"
                  >
                    <span className="text-emerald-600">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-xs">
                لا توجد نقاط غير مؤكدة تم حسمها في هذه الزيارة.
              </div>
            )}
          </div>

          {/* Explanation Text */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1.5">
            <span className="text-xs font-bold text-blue-900 block">
              ملخص الأثر الميداني على القرار:
            </span>
            <p className="text-xs sm:text-sm leading-relaxed">
              {diff.explanationAr}
            </p>
          </div>
        </section>
      ) : !hasFindings ? (
        /* Empty State: No Findings Recorded Yet */
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto border border-amber-100">
            📝
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-base sm:text-lg font-black text-gray-900">
              لم تسجل أي نتائج فحص لهذا العقار حتى الآن
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              قم بزيارة قائمة الفحص الميداني لتسجيل ملاحظاتك (سليم / مشكلة / لم أتحقق) ليتم تحديث
              مطابقة العقار تلقائياً بناءً على ما شاهدته.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/case/${params.id}/inspection?propertyId=${activeProperty.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <span>الانتقال لقائمة الفحص الميداني</span>
              <span aria-hidden="true">←</span>
            </Link>
          </div>
        </section>
      ) : null}

      {/* Primary Action Buttons & Footer CTAs */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 pt-6">
        <Link
          href={`/case/${params.id}/inspection?propertyId=${activeProperty.id}`}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs sm:text-sm transition-colors text-center"
        >
          ← تعديل نتائج الفحص الميداني
        </Link>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
          <Link
            href={`/case/${params.id}/results`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs sm:text-sm transition-colors text-center"
          >
            تقرير التقييم التفصيلي
          </Link>

          <Link
            href={compareHref}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md text-center inline-flex items-center justify-center gap-1.5"
          >
            <span>{compareLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
