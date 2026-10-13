import Link from "next/link";
import { redirect } from "next/navigation";
import {
  RotateCcw,
  Scale,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ClipboardList,
  MapPin,
} from "lucide-react";
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

const VISIT_PRIORITY_LABELS: Record<VisitPriority, { label: string; badgeClasses: string }> = {
  high: {
    label: "معاينة مرتفعة",
    badgeClasses: "bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs",
  },
  medium: {
    label: "معاينة متوسطة",
    badgeClasses: "bg-amber-100 text-amber-800 border border-amber-200 shadow-xs",
  },
  low: {
    label: "معاينة منخفضة",
    badgeClasses: "bg-rose-100 text-rose-800 border border-rose-200 shadow-xs",
  },
  insufficient_evidence: {
    label: "معاينة غير محددة",
    badgeClasses: "bg-slate-200 text-slate-800 border border-slate-300 shadow-xs",
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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8" dir="rtl">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <Link
          href={`/case/${params.id}/inspection?propertyId=${activeProperty.id}`}
          className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl font-bold transition-all shadow-xs"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة لقائمة الفحص الميداني</span>
        </Link>
        <span className="text-slate-400 font-medium">المرحلة: إعادة التقييم الميداني</span>
      </div>

      {/* Header Card */}
      <header className="relative bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4 overflow-hidden">
        {/* Subtle Ambient Background Light */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/70 text-xs font-bold">
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span>تحديث التقييم بعد الزيارة</span>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
            {findingsCount || 0} شواهد ميدانية مسجلة
          </span>
        </div>

        <div className="space-y-1 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            نتائج إعادة التقييم بعد المعاينة الميدانية
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            إعادة تقييم محاور المطابقة المتأثرة بالشواهد الميدانية الفعلية فقط، مع تثبيت بقية المحاور والأسعار دون تغيير.
          </p>
        </div>
      </header>

      {/* Property Switcher Tabs (if 2+ properties exist) */}
      {hasMultipleProperties && (
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-500 block">
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
                    "px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all shrink-0 flex items-center gap-2 border shadow-xs",
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200/80"
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isActive ? "bg-blue-400" : "bg-slate-300"
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
          className="p-5 sm:p-6 rounded-3xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs sm:text-sm space-y-3 shadow-sm"
        >
          <div className="flex items-center gap-2.5 font-extrabold text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>تنبيه: تزامن غير مكتمل (بيانات محدثة)</span>
          </div>
          <p className="text-amber-800 leading-relaxed font-medium">
            {errorMessage || "تغيّرت بيانات أو اشتراطات العقار أثناء المعاينة. تم منع التعديل التلقائي لضمان الدقة."}
          </p>
          <div className="pt-1">
            <Link
              href={`/case/${params.id}/inspection?propertyId=${activeProperty.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-xs"
            >
              <span>مراجعة قائمة الفحص والمحاولة مجدداً</span>
              <span aria-hidden="true">←</span>
            </Link>
          </div>
        </div>
      )}

      {/* Property Overview Card */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 shadow-xs">
              العقار قيد المراجعة
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
              {activeLabel}
            </h2>
            {activeProperty.district && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>حي {activeProperty.district}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border",
                fitInfo.badgeClasses
              )}
            >
              <span>{fitInfo.label}</span>
            </span>

            <span
              className={cn(
                "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold",
                visitInfo.badgeClasses
              )}
            >
              <span>{visitInfo.label}</span>
            </span>
          </div>
        </div>

        {/* Pricing and Key Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold block mb-1">السعر المعروض</span>
            <span className="font-black text-slate-900 text-sm sm:text-base">
              {activeProperty.listing_price_sar
                ? formatSAR(Number(activeProperty.listing_price_sar))
                : "غير محدد"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold block mb-1">المساحة</span>
            <span className="font-black text-slate-900 text-sm sm:text-base">
              {activeProperty.area_sqm ? `${activeProperty.area_sqm} م²` : "غير محددة"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold block mb-1">سعر المتر المربع</span>
            <span className="font-black text-slate-900 text-sm sm:text-base">
              {currentAssessment?.price_per_sqm
                ? `${formatSAR(Number(currentAssessment.price_per_sqm))} / م²`
                : "غير متوفر"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold block mb-1">نتائج الفحص المسجلة</span>
            <span className="font-black text-blue-600 text-sm sm:text-base">
              {findingsCount || 0} شواهد
            </span>
          </div>
        </div>
      </section>

      {/* Visual Diff Box: "ما الذي تغير؟" */}
      {diff ? (
        <section
          aria-labelledby="diff-heading"
          className="rounded-3xl border-2 border-blue-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-50/70 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="diff-heading"
                className="text-base sm:text-lg font-extrabold text-slate-900"
              >
                ما الذي تغير بعد المعاينة الميدانية؟
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                الفروقات المباشرة الناتجة عن شواهدك المسجلة على أرض الواقع مقارنة بالتحليل الأولي.
              </p>
            </div>
          </div>

          {/* Rating & Priority Transitions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            {/* Fit Rating Diff Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
              <span className="text-xs font-extrabold text-slate-700 block">
                تغير درجة التوافق الإجمالية:
              </span>
              <div className="flex items-center gap-2.5 flex-wrap text-xs font-extrabold">
                <span
                  className={cn(
                    "px-3 py-1.5 rounded-xl border",
                    FIT_RATING_LABELS[diff.previousFitRating]?.badgeClasses || "bg-slate-100 text-slate-600"
                  )}
                >
                  {FIT_RATING_LABELS[diff.previousFitRating]?.label || diff.previousFitRating}
                </span>

                <span className="text-slate-400 text-sm font-black" aria-hidden="true">
                  ←
                </span>

                <span
                  className={cn(
                    "px-3 py-1.5 rounded-xl border shadow-xs",
                    FIT_RATING_LABELS[diff.newFitRating]?.badgeClasses || "bg-slate-100 text-slate-600"
                  )}
                >
                  {FIT_RATING_LABELS[diff.newFitRating]?.label || diff.newFitRating}
                </span>
              </div>

              {diff.previousFitRating !== diff.newFitRating ? (
                <p className="text-[11px] text-rose-700 font-bold pt-1">
                  {diff.newFitRating === "weak"
                    ? "⚠️ انخفض التقييم إلى توافق ضعيف لمخالفة اشتراط أساسي أثناء المعاينة."
                    : "تغيرت درجة التوافق بناءً على الشواهد الميدانية المعتمدة."}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 pt-1 font-medium">
                  درجة التوافق لم تتأثر بالشواهد الميدانية الحالية.
                </p>
              )}
            </div>

            {/* Visit Priority Diff Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
              <span className="text-xs font-extrabold text-slate-700 block">
                تغير أولوية المعاينة والتوصية:
              </span>
              <div className="flex items-center gap-2.5 flex-wrap text-xs font-extrabold">
                <span
                  className={cn(
                    "px-3 py-1.5 rounded-xl",
                    VISIT_PRIORITY_LABELS[diff.previousVisitPriority]?.badgeClasses || "bg-slate-100 text-slate-600"
                  )}
                >
                  {VISIT_PRIORITY_LABELS[diff.previousVisitPriority]?.label || diff.previousVisitPriority}
                </span>

                <span className="text-slate-400 text-sm font-black" aria-hidden="true">
                  ←
                </span>

                <span
                  className={cn(
                    "px-3 py-1.5 rounded-xl shadow-xs",
                    VISIT_PRIORITY_LABELS[diff.newVisitPriority]?.badgeClasses || "bg-slate-100 text-slate-600"
                  )}
                >
                  {VISIT_PRIORITY_LABELS[diff.newVisitPriority]?.label || diff.newVisitPriority}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 pt-1 font-medium">
                {diff.previousVisitPriority !== diff.newVisitPriority
                  ? "تم تحديث مستوى التوصية ليعكس واقع الزيارة."
                  : "مستوى التوصية مستقر."}
              </p>
            </div>
          </div>

          {/* Added Risks / Detected Problems */}
          <div className="space-y-2.5 relative z-10">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>مخاطر وملاحظات سلبية جديدة رُصدت ميدانياً:</span>
            </h3>

            {diff.addedRisks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {diff.addedRisks.map((risk, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80 text-rose-950 text-xs font-bold flex items-start gap-2.5 shadow-xs"
                  >
                    <span className="text-rose-500 select-none text-base leading-none">•</span>
                    <span className="leading-relaxed">{risk}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>لم تُسجل أي ملاحظات سلبية جديدة أثناء المعاينة.</span>
              </div>
            )}
          </div>

          {/* Resolved Unknowns */}
          <div className="space-y-2.5 relative z-10">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>اشتراطات ونقاط غير مؤكدة تم حسمها وتأكيدها:</span>
            </h3>

            {diff.resolvedUnknowns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {diff.resolvedUnknowns.map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 text-emerald-950 text-xs font-bold flex items-start gap-2.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                لا توجد نقاط غير مؤكدة تم حسمها في هذه الزيارة.
              </div>
            )}
          </div>

          {/* Explanation Text */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200 text-blue-950 space-y-1.5 relative z-10 shadow-xs">
            <span className="text-xs font-extrabold text-blue-900 block">
              ملخص الأثر الميداني على القرار:
            </span>
            <p className="text-xs sm:text-sm leading-relaxed font-medium">
              {diff.explanationAr}
            </p>
          </div>
        </section>
      ) : !hasFindings ? (
        /* Empty State: No Findings Recorded Yet */
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto border border-amber-200/60 shadow-xs">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              لم تسجل أي نتائج فحص لهذا العقار حتى الآن
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
              قم بزيارة قائمة الفحص الميداني لتسجيل ملاحظاتك (سليم / مشكلة / لم أتحقق) ليتم تحديث
              مطابقة العقار تلقائياً بناءً على ما شاهدته.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/case/${params.id}/inspection?propertyId=${activeProperty.id}`}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all"
            >
              <span>الانتقال لقائمة الفحص الميداني</span>
              <span aria-hidden="true">←</span>
            </Link>
          </div>
        </section>
      ) : null}

      {/* Primary Action Buttons & Footer CTAs */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href={`/case/${params.id}/inspection?propertyId=${activeProperty.id}`}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200/80 bg-slate-50 hover:bg-white text-slate-700 font-bold text-xs sm:text-sm transition-all text-center shadow-xs"
        >
          ← تعديل نتائج الفحص الميداني
        </Link>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5">
          <Link
            href={`/case/${params.id}/results`}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm transition-all text-center shadow-xs"
          >
            تقرير التقييم التفصيلي
          </Link>

          <Link
            href={compareHref}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 text-center inline-flex items-center justify-center gap-2"
          >
            <Scale className="w-4 h-4" />
            <span>{compareLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
