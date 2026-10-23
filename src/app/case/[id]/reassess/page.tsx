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
  ShieldCheck,
} from "lucide-react";
import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatSAR, cn } from "@/lib/utils";
import { reassessPropertyAction } from "@/actions/analysis";
import { resolveFacts, type PropertyFact } from "@/lib/evidence/resolve";
import type {
  ReassessmentDiff,
  FitRating,
  VisitPriority,
} from "@/lib/analysis/reassess";
import type { ConfidenceLevel } from "@/lib/analysis/axes";

export const dynamic = "force-dynamic";

interface ReassessPageProps {
  params: { id: string };
  searchParams?: { propertyId?: string };
}

const FIT_RATING_LABELS: Record<
  FitRating,
  { label: string; badgeClasses: string }
> = {
  strong: {
    label: "توافق قوي",
    badgeClasses: "bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]",
  },
  partial: {
    label: "توافق جزئي",
    badgeClasses: "bg-[#FFF9EC] text-[#9A6700] border border-[#F9E2AF]",
  },
  weak: {
    label: "توافق ضعيف",
    badgeClasses: "bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8]",
  },
  insufficient_evidence: {
    label: "بيانات غير كافية",
    badgeClasses:
      "bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]",
  },
};

const VISIT_PRIORITY_LABELS: Record<
  VisitPriority,
  { label: string; badgeClasses: string }
> = {
  high: {
    label: "معاينة مرتفعة",
    badgeClasses: "bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]",
  },
  medium: {
    label: "معاينة متوسطة",
    badgeClasses: "bg-[#FFF9EC] text-[#9A6700] border border-[#F9E2AF]",
  },
  low: {
    label: "معاينة منخفضة",
    badgeClasses: "bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8]",
  },
  insufficient_evidence: {
    label: "معاينة غير محددة",
    badgeClasses:
      "bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]",
  },
};

const CONFIDENCE_LABELS: Record<
  ConfidenceLevel,
  { label: string; badgeClasses: string }
> = {
  high: {
    label: "ثقة عالية",
    badgeClasses: "bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]",
  },
  medium: {
    label: "ثقة متوسطة",
    badgeClasses: "bg-[#FFF9EC] text-[#9A6700] border border-[#F9E2AF]",
  },
  low: {
    label: "ثقة منخفضة",
    badgeClasses: "bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8]",
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

  // 2. Fetch properties for this case (with property_facts so user-corrected values appear)
  const { data: properties, error: propErr } = await supabase
    .from("properties")
    .select(
      "id, title, district, listing_price_sar, area_sqm, bedrooms, floor_no, property_facts(*)"
    )
    .eq("case_id", params.id)
    .order("created_at", { ascending: true });

  if (propErr || !properties || properties.length === 0) {
    redirect(`/case/${params.id}/properties`);
  }

  // Determine active property
  const activePropertyId = searchParams?.propertyId || properties[0].id;
  const activeProperty =
    properties.find((p) => p.id === activePropertyId) || properties[0];

  const activeFacts = Array.isArray(
    (activeProperty as { property_facts?: PropertyFact[] }).property_facts
  )
    ? ((activeProperty as { property_facts?: PropertyFact[] }).property_facts ?? [])
    : [];
  const activeResolved = resolveFacts(activeFacts);
  const displayPrice =
    activeResolved.fields.listing_price_sar?.status === "known"
      ? Number(activeResolved.fields.listing_price_sar.value)
      : activeProperty.listing_price_sar;
  const displayArea =
    activeResolved.fields.area_sqm?.status === "known"
      ? Number(activeResolved.fields.area_sqm.value)
      : activeProperty.area_sqm;

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
    const reassessResult = await reassessPropertyAction(
      params.id,
      activeProperty.id
    );
    if (reassessResult.success && reassessResult.diff) {
      diff = reassessResult.diff;
    } else if (reassessResult.stale) {
      isStale = true;
      errorMessage =
        reassessResult.messageAr ||
        "تغيّرت بيانات أو اشتراطات العقار أثناء المعاينة.";
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

  const currentFit =
    (currentAssessment?.fit_rating as FitRating) || "insufficient_evidence";
  const currentVisit =
    (currentAssessment?.visit_priority as VisitPriority) ||
    "insufficient_evidence";
  const fitInfo =
    FIT_RATING_LABELS[currentFit] || FIT_RATING_LABELS.insufficient_evidence;
  const visitInfo =
    VISIT_PRIORITY_LABELS[currentVisit] ||
    VISIT_PRIORITY_LABELS.insufficient_evidence;

  const compareHref = hasMultipleProperties
    ? `/case/${params.id}/compare`
    : `/case/${params.id}/results`;
  const compareLabel = hasMultipleProperties
    ? "العودة إلى مقارنة الخيارات المحدّثة ←"
    : "العودة إلى نتيجة استشارة القرار المحدّثة ←";

  return (
    <div
      className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8 font-body text-[var(--navy)]"
      dir="rtl"
    >
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <Link
          href={`/case/${params.id}/inspection?propertyId=${activeProperty.id}`}
          className="inline-flex items-center gap-2 text-[var(--dusty-blue)] hover:text-[var(--navy)] bg-[var(--paper)] border border-[var(--mist)] hover:border-[var(--navy)] px-4 py-2 rounded-full font-medium transition-all shadow-xs"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة لقائمة الفحص الميداني</span>
        </Link>
        <span className="text-[var(--dusty-blue)] font-medium">
          المرحلة: تحديث قرار الشراء بعد المعاينة (مشمول مجاناً ضمن الحالة)
        </span>
      </div>

      {/* Header Card */}
      <header className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.04)] p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] text-xs font-medium">
            <RotateCcw className="w-3.5 h-3.5 text-[var(--navy)]" />
            <span>تحديث القرار ومستوى الثقة بعد الزيارة</span>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] shadow-xs">
            {findingsCount || 0} شواهد ميدانية مسجلة
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--navy)] tracking-tight">
            نتائج إعادة التقييم بعد المعاينة الميدانية
          </h1>
          <p className="text-xs sm:text-sm text-[var(--dusty-blue)] max-w-2xl leading-relaxed">
            يجيب هذا التحديث عن ثلاثة أسئلة حاسمة بعد زيارتك للشقة: ما الذي تغير؟ وهل تغير الترتيب أو مستوى الثقة؟ ولماذا؟
          </p>
        </div>
      </header>

      {/* Property Switcher Tabs (if 2+ properties exist) */}
      {hasMultipleProperties && (
        <div className="space-y-2.5">
          <label className="text-xs font-medium text-[var(--dusty-blue)] block">
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
                    "px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 flex items-center gap-2 border shadow-xs",
                    isActive
                      ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] shadow-sm"
                      : "bg-[var(--paper)] text-[var(--navy)] hover:border-[var(--navy)] border-[var(--mist)]"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isActive ? "bg-[var(--cream)]" : "bg-[var(--dusty-blue)]"
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
          className="p-5 sm:p-6 rounded-[28px] bg-[#FFF9EC] border border-[#F9E2AF] text-[var(--navy)] text-xs sm:text-sm space-y-3 shadow-sm"
        >
          <div className="flex items-center gap-2.5 font-bold text-[#9A6700]">
            <AlertTriangle className="w-5 h-5 text-[#9A6700]" />
            <span>تنبيه: تزامن غير مكتمل (بيانات محدثة)</span>
          </div>
          <p className="text-[var(--dusty-blue)] leading-relaxed font-medium">
            {errorMessage ||
              "تغيّرت بيانات أو اشتراطات العقار أثناء المعاينة. تم منع التعديل التلقائي لضمان الدقة."}
          </p>
          <div className="pt-1">
            <Link
              href={`/case/${params.id}/inspection?propertyId=${activeProperty.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--navy)] text-[var(--cream)] font-medium text-xs hover:bg-[var(--midnight)] transition-colors shadow-xs"
            >
              <span>مراجعة قائمة الفحص والمحاولة مجدداً</span>
              <span aria-hidden="true">←</span>
            </Link>
          </div>
        </div>
      )}

      {/* Property Overview Card */}
      <section className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-5 sm:p-7 shadow-[0_20px_60px_rgba(15,26,43,0.04)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--mist)] pb-5">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-[var(--dusty-blue)] bg-[var(--cream)] px-2.5 py-1 rounded-full border border-[var(--mist)]">
              العقار قيد المراجعة
            </span>
            <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--navy)] mt-2">
              {activeLabel}
            </h2>
            {activeProperty.district && (
              <p className="text-xs text-[var(--dusty-blue)] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--navy)] shrink-0" />
                <span>حي {activeProperty.district}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium border",
                fitInfo.badgeClasses
              )}
            >
              <span>{fitInfo.label}</span>
            </span>

            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                visitInfo.badgeClasses
              )}
            >
              <span>{visitInfo.label}</span>
            </span>
          </div>
        </div>

        {/* Pricing and Key Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[var(--cream)] p-3.5 rounded-2xl border border-[var(--mist)]">
            <span className="text-[var(--dusty-blue)] font-medium block mb-1">
              السعر المعروض
            </span>
            <span className="font-bold text-[var(--navy)] tabular-nums text-sm sm:text-base font-body">
              {displayPrice
                ? formatSAR(Number(displayPrice))
                : "غير محدد"}
            </span>
          </div>

          <div className="bg-[var(--cream)] p-3.5 rounded-2xl border border-[var(--mist)]">
            <span className="text-[var(--dusty-blue)] font-medium block mb-1">
              المساحة
            </span>
            <span className="font-bold text-[var(--navy)] tabular-nums text-sm sm:text-base font-body">
              {displayArea
                ? `${displayArea} م²`
                : "غير محددة"}
            </span>
          </div>

          <div className="bg-[var(--cream)] p-3.5 rounded-2xl border border-[var(--mist)]">
            <span className="text-[var(--dusty-blue)] font-medium block mb-1">
              سعر المتر المربع
            </span>
            <span className="font-bold text-[var(--navy)] tabular-nums text-sm sm:text-base font-body">
              {currentAssessment?.price_per_sqm
                ? `${formatSAR(Number(currentAssessment.price_per_sqm))} / م²`
                : "غير متوفر"}
            </span>
          </div>

          <div className="bg-[var(--cream)] p-3.5 rounded-2xl border border-[var(--mist)]">
            <span className="text-[var(--dusty-blue)] font-medium block mb-1">
              نتائج الفحص المسجلة
            </span>
            <span className="font-bold text-[var(--navy)] tabular-nums text-sm sm:text-base font-body">
              {findingsCount || 0} شواهد
            </span>
          </div>
        </div>
      </section>

      {/* Visual Diff Box: "ما الذي تغير؟ وهل تغير الترتيب أو مستوى الثقة؟ ولماذا؟" */}
      {diff ? (
        <section
          aria-labelledby="diff-heading"
          className="rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,26,43,0.04)] space-y-6 relative overflow-hidden"
        >
          <div className="flex items-center gap-3.5 border-b border-[var(--mist)] pb-5">
            <div className="w-10 h-10 rounded-2xl bg-[var(--cream)] text-[var(--navy)] flex items-center justify-center shrink-0 border border-[var(--mist)]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="diff-heading"
                className="text-base sm:text-lg font-bold font-display text-[var(--navy)]"
              >
                ما الذي تغير بعد المعاينة الميدانية؟
              </h2>
              <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                الفروقات المباشرة في الملاءمة، ومستوى الثقة، والترتيب التنافسي بعد تسجيل مشاهداتك الميدانية.
              </p>
            </div>
          </div>

          {/* Rating, Confidence, Priority & Competitive Rank Transitions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fit Rating Diff Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-2.5">
              <span className="text-xs font-bold text-[var(--navy)] block">
                تغير درجة التوافق الإجمالية:
              </span>
              <div className="flex items-center gap-2.5 flex-wrap text-xs font-bold">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full border",
                    FIT_RATING_LABELS[diff.previousFitRating]?.badgeClasses ||
                      "bg-[var(--cream)] text-[var(--dusty-blue)] border-[var(--mist)]"
                  )}
                >
                  {FIT_RATING_LABELS[diff.previousFitRating]?.label ||
                    diff.previousFitRating}
                </span>

                <span
                  className="text-[var(--dusty-blue)] text-sm font-bold"
                  aria-hidden="true"
                >
                  ←
                </span>

                <span
                  className={cn(
                    "px-3 py-1 rounded-full border shadow-xs",
                    FIT_RATING_LABELS[diff.newFitRating]?.badgeClasses ||
                      "bg-[var(--cream)] text-[var(--dusty-blue)] border-[var(--mist)]"
                  )}
                >
                  {FIT_RATING_LABELS[diff.newFitRating]?.label ||
                    diff.newFitRating}
                </span>
              </div>

              {diff.previousFitRating !== diff.newFitRating ? (
                <p className="text-[11px] text-[#A62626] font-medium pt-1">
                  {diff.newFitRating === "weak"
                    ? "⚠️ انخفض التقييم إلى توافق ضعيف لمخالفة اشتراط أساسي أثناء المعاينة."
                    : "تغيرت درجة الملاءمة بناءً على الشواهد الميدانية المعتمدة."}
                </p>
              ) : (
                <p className="text-[11px] text-[var(--dusty-blue)] pt-1 font-medium">
                  درجة الملاءمة لم تتأثر بالشواهد الميدانية الحالية.
                </p>
              )}
            </div>

            {/* Confidence Level Diff Card */}
            {diff.previousConfidence && diff.newConfidence && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-2.5">
                <span className="text-xs font-bold text-[var(--navy)] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--navy)]" />
                  <span>تغير مستوى الثقة في النتيجة:</span>
                </span>
                <div className="flex items-center gap-2.5 flex-wrap text-xs font-bold">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full border",
                      CONFIDENCE_LABELS[diff.previousConfidence]?.badgeClasses
                    )}
                  >
                    {CONFIDENCE_LABELS[diff.previousConfidence]?.label}
                  </span>

                  <span
                    className="text-[var(--dusty-blue)] text-sm font-bold"
                    aria-hidden="true"
                  >
                    ←
                  </span>

                  <span
                    className={cn(
                      "px-3 py-1 rounded-full border shadow-xs",
                      CONFIDENCE_LABELS[diff.newConfidence]?.badgeClasses
                    )}
                  >
                    {CONFIDENCE_LABELS[diff.newConfidence]?.label}
                  </span>
                </div>

                <p className="text-[11px] text-[var(--dusty-blue)] pt-1 font-medium">
                  {diff.previousConfidence !== diff.newConfidence
                    ? "ارتفع/تغير مستوى الثقة نتيجة حسم النقاط غير المؤكدة على أرض الواقع."
                    : "مستوى الثقة مستقر بناءً على البيانات المتوفرة حالياً."}
                </p>
              </div>
            )}

            {/* Visit Priority Diff Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-2.5">
              <span className="text-xs font-bold text-[var(--navy)] block">
                تغير أولوية المعاينة والتوصية:
              </span>
              <div className="flex items-center gap-2.5 flex-wrap text-xs font-bold">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full border",
                    VISIT_PRIORITY_LABELS[diff.previousVisitPriority]
                      ?.badgeClasses ||
                      "bg-[var(--cream)] text-[var(--dusty-blue)] border-[var(--mist)]"
                  )}
                >
                  {VISIT_PRIORITY_LABELS[diff.previousVisitPriority]?.label ||
                    diff.previousVisitPriority}
                </span>

                <span
                  className="text-[var(--dusty-blue)] text-sm font-bold"
                  aria-hidden="true"
                >
                  ←
                </span>

                <span
                  className={cn(
                    "px-3 py-1 rounded-full border shadow-xs",
                    VISIT_PRIORITY_LABELS[diff.newVisitPriority]?.badgeClasses ||
                      "bg-[var(--cream)] text-[var(--dusty-blue)] border-[var(--mist)]"
                  )}
                >
                  {VISIT_PRIORITY_LABELS[diff.newVisitPriority]?.label ||
                    diff.newVisitPriority}
                </span>
              </div>

              <p className="text-[11px] text-[var(--dusty-blue)] pt-1 font-medium">
                {diff.previousVisitPriority !== diff.newVisitPriority
                  ? "تم تحديث مستوى التوصية ليعكس واقع الزيارة."
                  : "مستوى التوصية مستقر."}
              </p>
            </div>

            {/* Competitive Rank Diff Card (when 2+ properties exist) */}
            {diff.previousRank && diff.newRank && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-2.5">
                <span className="text-xs font-bold text-[var(--navy)] block">
                  تغير الترتيب التنافسي بين الخيارات:
                </span>
                <div className="flex items-center gap-2.5 flex-wrap text-xs font-bold">
                  <span className="px-3 py-1 rounded-full border bg-[var(--paper)] text-[var(--navy)] border-[var(--mist)]">
                    {`المركز #${diff.previousRank}`}
                  </span>

                  <span
                    className="text-[var(--dusty-blue)] text-sm font-bold"
                    aria-hidden="true"
                  >
                    ←
                  </span>

                  <span
                    className={cn(
                      "px-3 py-1 rounded-full border shadow-xs",
                      diff.newRank > diff.previousRank
                        ? "bg-[#FDF1F0] text-[#A62626] border-[#F6CBC8]"
                        : diff.newRank < diff.previousRank
                          ? "bg-[#E9F4EE] text-[#1E6B43] border-[#C5E4D4]"
                          : "bg-[var(--paper)] text-[var(--navy)] border-[var(--mist)]"
                    )}
                  >
                    {`المركز #${diff.newRank}`}
                  </span>
                </div>

                <p
                  className={cn(
                    "text-[11px] pt-1 font-medium",
                    diff.newRank > diff.previousRank
                      ? "text-[#A62626]"
                      : diff.newRank < diff.previousRank
                        ? "text-[#1E6B43]"
                        : "text-[var(--dusty-blue)]"
                  )}
                >
                  {diff.newRank > diff.previousRank
                    ? `⚠️ تراجع ترتيب العقار من المركز #${diff.previousRank} إلى المركز #${diff.newRank} بعد المعاينة.`
                    : diff.newRank < diff.previousRank
                      ? `تقدم ترتيب العقار من المركز #${diff.previousRank} إلى المركز #${diff.newRank} بعد المعاينة.`
                      : `حافظ العقار على المركز #${diff.newRank} بين خياراتك المقارنة.`}
                </p>
              </div>
            )}
          </div>

          {/* Added Risks / Detected Problems */}
          <div className="space-y-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-[var(--navy)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#A62626]" />
              <span>مخاطر وملاحظات سلبية جديدة رُصدت ميدانياً:</span>
            </h3>

            {diff.addedRisks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {diff.addedRisks.map((risk, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-[#FDF1F0] border border-[#F6CBC8] text-[#A62626] text-xs font-medium flex items-start gap-2.5"
                  >
                    <span className="text-[#A62626] select-none text-base leading-none">
                      •
                    </span>
                    <span className="leading-relaxed">{risk}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#E9F4EE] border border-[#C5E4D4] text-[#1E6B43] text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1E6B43]" />
                <span>لم تُسجل أي ملاحظات سلبية جديدة أثناء المعاينة.</span>
              </div>
            )}
          </div>

          {/* Resolved Unknowns */}
          <div className="space-y-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-[var(--navy)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1E6B43]" />
              <span>معلومات كانت ناقصة وتم حسمها وتأكيدها ميدانياً:</span>
            </h3>

            {diff.resolvedUnknowns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {diff.resolvedUnknowns.map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-[#E9F4EE] border border-[#C5E4D4] text-[#1E6B43] text-xs font-medium flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#1E6B43] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-[var(--dusty-blue)] text-xs">
                لا توجد نقاط غير مؤكدة تم حسمها في هذه الزيارة.
              </div>
            )}
          </div>

          {/* Explanation Text: "٢. لماذا؟" */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] space-y-1.5">
            <span className="text-xs font-bold text-[var(--navy)] block">
              ٢. لماذا؟ (ملخص الأثر الميداني على قرار الشراء):
            </span>
            <p className="text-xs sm:text-sm leading-relaxed font-normal text-[var(--dusty-blue)]">
              {diff.explanationAr}
            </p>
          </div>
        </section>
      ) : !hasFindings ? (
        /* Empty State: No Findings Recorded Yet */
        <section className="rounded-[28px] border border-dashed border-[var(--mist)] bg-[var(--paper)] p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--cream)] text-[var(--navy)] flex items-center justify-center mx-auto border border-[var(--mist)]">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base sm:text-lg font-display font-bold text-[var(--navy)]">
              لم تسجل أي نتائج فحص لهذا العقار حتى الآن
            </h2>
            <p className="text-xs sm:text-sm text-[var(--dusty-blue)] leading-relaxed font-normal">
              قم بزيارة قائمة الفحص الميداني لتسجيل ملاحظاتك (سليم / مشكلة / لم أتحقق) ليتم تحديث
              ملاءمة العقار ومستوى الثقة تلقائياً بناءً على ما شاهدته.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/case/${params.id}/inspection?propertyId=${activeProperty.id}`}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-body font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <span>الانتقال لقائمة الفحص الميداني</span>
              <span aria-hidden="true">←</span>
            </Link>
          </div>
        </section>
      ) : null}

      {/* Primary Action Buttons & Footer CTAs */}
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,26,43,0.04)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href={`/case/${params.id}/inspection?propertyId=${activeProperty.id}`}
          className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[var(--mist)] bg-[var(--paper)] hover:border-[var(--navy)] text-[var(--dusty-blue)] hover:text-[var(--navy)] font-medium text-xs sm:text-sm transition-all text-center"
        >
          ← تعديل نتائج الفحص الميداني
        </Link>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5">
          <Link
            href={`/case/${params.id}/results`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[var(--mist)] bg-[var(--paper)] hover:border-[var(--navy)] text-[var(--dusty-blue)] hover:text-[var(--navy)] font-medium text-xs sm:text-sm transition-all text-center"
          >
            لوحة نتيجة القرار
          </Link>

          <Link
            href={compareHref}
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-body font-bold text-xs sm:text-sm transition-all shadow-sm text-center inline-flex items-center justify-center gap-2"
          >
            <Scale className="w-4 h-4 text-[var(--cream)]" />
            <span>{compareLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
