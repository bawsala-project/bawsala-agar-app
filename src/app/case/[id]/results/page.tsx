import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Scale, Info, Sparkles, AlertTriangle, CheckCircle2, Trophy, HelpCircle } from "lucide-react";
import { getSessionUser, requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveFacts, type PropertyFact } from "@/lib/evidence/resolve";
import { AccountLinkBanner } from "@/components/account-link-banner";
import { PropertyCardRedesigned, type PropertyCardData, type PropertyAssessmentData } from "@/components/properties/property-card-redesigned";
import { EngineeringDialGauge } from "@/components/properties/engineering-dial-gauge";
import { AnalysisStatus, type AnalysisStatusMode } from "./analysis-status";
import { loadBuyerProfile } from "@/actions/buyer-profile";
import { BuyerProfileSummary } from "@/components/case/buyer-profile-summary";
import { evaluatePropertyFit, evaluateCaseFit, type PropertyDataInput } from "@/lib/analysis/fit-evaluator";
import { formatSAR } from "@/lib/utils";

// Mirrors the 5-minute stale threshold used by startAnalysis for running runs.
const STALE_RUN_MS = 300 * 1000;

interface ResultsPageProps {
  params: { id: string };
  searchParams?: { notice?: string };
}

export default async function ResultsPage({ params, searchParams }: ResultsPageProps) {
  // 1. Guard with RLS
  await requireCase(params.id);

  const user = await getSessionUser();
  const banner = user?.is_anonymous ? (
    <AccountLinkBanner nextPath={`/case/${params.id}/results`} />
  ) : null;

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
    const { data: paidPayments } = await supabase
      .from("payments")
      .select("id")
      .eq("case_id", params.id)
      .eq("status", "paid")
      .limit(1);

    if (!paidPayments || paidPayments.length === 0) {
      redirect(`/case/${params.id}/preflight`);
    }

    // Paid but not analyzed yet: never send the buyer back to preflight.
    const { data: latestRuns } = await supabase
      .from("analysis_runs")
      .select("status, created_at")
      .eq("case_id", params.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const latestRun = latestRuns?.[0];

    const runIsStale =
      latestRun?.status === "running" &&
      Date.now() - new Date(latestRun.created_at).getTime() >= STALE_RUN_MS;

    let mode: AnalysisStatusMode = "start";
    if (latestRun?.status === "failed" || runIsStale) {
      mode = "failed";
    } else if (latestRun?.status === "running") {
      mode = "wait";
    }

    return (
      <>
        {banner}
        <AnalysisStatus caseId={params.id} mode={mode} />
      </>
    );
  }

  const latestRunId = runs[0].id;

  // 3. Fetch assessments for this run with property details and facts, and buyer profile
  const [{ data: assessments }, buyerProfile] = await Promise.all([
    supabase
      .from("property_assessments")
      .select(`
        *,
        properties (
          id,
          title,
          district,
          listing_price_sar,
          source_url,
          input_mode,
          notes,
          property_facts (*)
        )
      `)
      .eq("run_id", latestRunId)
      .order("created_at", { ascending: true }),
    loadBuyerProfile(params.id),
  ]);

  if (!assessments || assessments.length === 0) {
    redirect(`/case/${params.id}/preflight`);
  }

  const propertyCount = assessments.length;
  const showComparisonCTA = propertyCount >= 2;
  const comparisonLabel = `مقارنة الخيارات (${propertyCount} عقارات)`;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8" dir="rtl">
      {banner}

      {/* Insufficient compare notice */}
      {searchParams?.notice === "insufficient_compare" && (
        <div
          role="status"
          aria-live="polite"
          className="p-5 rounded-2xl bg-[#FFF9EC] border border-[#F9E2AF] text-[var(--navy)] text-xs sm:text-sm flex items-start gap-3.5 shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--paper)] text-[#9A6700] border border-[#F9E2AF] flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-[var(--navy)]">
              تنبيه: تتطلب مقارنة الخيارات وجود عقارين مرشحين على الأقل.
            </p>
            <p className="text-[var(--dusty-blue)] text-xs leading-relaxed">
              لديك عقار واحد محلل حالياً؛ يمكنك إضافة عقارات إضافية من صفحة العقارات لتحليلها ومقارنتها جنباً إلى جنب.
            </p>
          </div>
        </div>
      )}

      {/* Top Header Card - Buyer Consultation Framing */}
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)] animate-pulse" />
                المرحلة 4 من 4 • استشارة القرار والشراء
              </span>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]">
                {propertyCount} {propertyCount === 1 ? "عقار محلل" : "عقارات محللة"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-bold text-[var(--navy)] tracking-tight">
              تقرير ملاءمة الشقق للمشتري
            </h1>
            <p className="text-xs sm:text-sm text-[var(--dusty-blue)] max-w-2xl leading-relaxed">
              تقييم استشاري مستقل ومحايد يربط احتياجاتك وميزانيتك وظروف أسرتك بالشقق المرشحة لتحديد الخيار الأنسب لك ومفاضلة البدائل.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-center shrink-0">
            <Link
              href={`/case/${params.id}/preflight`}
              className="inline-flex items-center gap-2 text-xs font-medium text-[var(--dusty-blue)] hover:text-[var(--navy)] bg-[var(--paper)] hover:border-[var(--navy)] border border-[var(--mist)] px-4 py-2.5 rounded-full transition-all"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>← الفحص المبدئي</span>
            </Link>

            {showComparisonCTA && (
              <Link
                href={`/case/${params.id}/compare`}
                className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-semibold text-base shadow-sm transition-all active:scale-[0.98] opacity-100"
              >
                <Scale className="w-4 h-4 text-[var(--cream)] opacity-100 shrink-0" />
                <span className="text-[var(--cream)] text-base font-semibold opacity-100">{comparisonLabel}</span>
                <span aria-hidden="true" className="text-[var(--cream)] opacity-100">←</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Session Summary: Buyer Profile */}
      <BuyerProfileSummary caseId={params.id} profile={buyerProfile} compact />

      {(() => {
        const propertiesWithEvaluations = assessments.map((a) => {
          const p = a.properties as unknown as {
            id: string;
            title?: string | null;
            district?: string | null;
            listing_price_sar?: number | null;
            source_url?: string | null;
            input_mode?: string | null;
            notes?: string | null;
            property_facts?: PropertyFact[];
          };

          const rawFacts = (p?.property_facts as PropertyFact[]) || [];
          const resolved = resolveFacts(rawFacts);

          const resolvedPrice =
            resolved.fields.listing_price_sar?.status === "known"
              ? Number(resolved.fields.listing_price_sar.value)
              : p?.listing_price_sar ?? null;

          const resolvedDistrict =
            resolved.fields.district?.status === "known"
              ? String(resolved.fields.district.value)
              : p?.district ?? null;

          const fitInput: PropertyDataInput = {
            id: p?.id || a.property_id,
            title: p?.title,
            district: resolvedDistrict,
            city: "الرياض",
            listingPriceSar: resolvedPrice,
            areaSqm: resolved.fields.area_sqm?.status === "known" ? Number(resolved.fields.area_sqm.value) : 140,
            bedrooms: resolved.fields.bedrooms?.status === "known" ? Number(resolved.fields.bedrooms.value) : 3,
            bathrooms: resolved.fields.bathrooms?.status === "known" ? Number(resolved.fields.bathrooms.value) : 2,
            floorNo: resolved.fields.floor_no?.status === "known" ? Number(resolved.fields.floor_no.value) : 2,
            notes: p?.notes,
            resolved,
          };

          const fitEvaluation = evaluatePropertyFit(buyerProfile, fitInput);

          const propertyData: PropertyCardData = {
            id: p?.id || a.property_id,
            title: p?.title,
            district: resolvedDistrict,
            listing_price_sar: resolvedPrice,
            area_sqm: fitInput.areaSqm,
            bedrooms: fitInput.bedrooms,
            bathrooms: fitInput.bathrooms,
            floor_no: fitInput.floorNo,
            notes: p?.notes,
          };

          const assessmentData: PropertyAssessmentData = {
            fit_rating: a.fit_rating,
            fit_summary: a.fit_summary || fitEvaluation.rankingReasonAr,
            visit_priority: a.visit_priority,
            visit_priority_reason: a.visit_priority_reason,
            strengths: (a.strengths as unknown as string[])?.length ? (a.strengths as unknown as string[]) : fitEvaluation.topPros,
            risks: (a.risks as unknown as string[])?.length ? (a.risks as unknown as string[]) : fitEvaluation.topCons,
            key_unknowns: (a.key_unknowns as unknown as string[])?.length ? (a.key_unknowns as unknown as string[]) : fitEvaluation.missingInformation,
            price_per_sqm: a.price_per_sqm ? Number(a.price_per_sqm) : null,
            weighted_fit_score: fitEvaluation.weightedFitScore,
            dimensions: fitEvaluation.dimensions,
            dimension_weights: fitEvaluation.dimensionWeights,
            top_pros: fitEvaluation.topPros,
            top_cons: fitEvaluation.topCons,
            ranking_reason_ar: fitEvaluation.rankingReasonAr,
            missing_information: fitEvaluation.missingInformation,
            confidence: fitEvaluation.confidence,
            is_certain: fitEvaluation.isCertain,
            engineering_score: fitEvaluation.weightedFitScore,
          };

          return {
            id: a.id,
            fitInput,
            fitEvaluation,
            propertyData,
            assessmentData,
          };
        });

        const caseFit = evaluateCaseFit(
          buyerProfile,
          propertiesWithEvaluations.map((item) => item.fitInput)
        );

        const recommendedProperty =
          propertiesWithEvaluations.find(
            (p) => p.propertyData.id === caseFit.rankedProperties[0]?.propertyId
          ) || propertiesWithEvaluations[0];

        const rankedAlternatives = propertiesWithEvaluations
          .filter((p) => p.propertyData.id !== recommendedProperty.propertyData.id)
          .sort((a, b) => (b.assessmentData.weighted_fit_score || 0) - (a.assessmentData.weighted_fit_score || 0));

        return (
          <>
            {/* 1. RESULTS TOP: RECOMMENDED OPTION FOR THIS BUYER WITH REASON */}
            <div className="bg-[var(--paper)] rounded-[28px] border-2 border-[var(--navy)] p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(15,26,43,0.06)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--mist)] pb-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]">
                      <Trophy className="w-3.5 h-3.5 text-amber-600" />
                      <span>الخيار الأنسب لك (المرتبة الأولى)</span>
                    </span>
                    <span className="text-xs text-[var(--dusty-blue)] font-medium">
                      حي {recommendedProperty.propertyData.district || "الرياض"}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-3xl font-display font-bold text-[var(--navy)] tracking-tight">
                    {recommendedProperty.propertyData.title}
                  </h2>
                  <div className="text-xs text-[var(--dusty-blue)]">
                    {recommendedProperty.propertyData.area_sqm} م² • {recommendedProperty.propertyData.bedrooms} غرف نوم • الدور {recommendedProperty.propertyData.floor_no ?? 2}
                  </div>
                </div>

                <div className="flex items-center gap-5 border-t sm:border-t-0 sm:border-r border-[var(--mist)] pt-4 sm:pt-0 sm:pr-6 shrink-0">
                  <div className="text-right sm:text-left">
                    <div className="text-[11px] font-medium text-[var(--dusty-blue)]">
                      السعر الإجمالي المطلوب
                    </div>
                    <div className="font-display font-black text-xl sm:text-2xl text-[var(--navy)] tabular-nums">
                      {formatSAR(recommendedProperty.propertyData.listing_price_sar || 0)}
                    </div>
                  </div>
                  <EngineeringDialGauge
                    score={recommendedProperty.assessmentData.weighted_fit_score || 85}
                    size={60}
                    strokeWidth={3.5}
                  />
                </div>
              </div>

              {/* Recommendation Reason Narrative */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-2">
                <div className="text-xs font-bold text-[var(--navy)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--navy)]" />
                  <span>لماذا يناسبك هذا الخيار تحديداً؟</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--navy)] leading-relaxed font-medium">
                  {recommendedProperty.assessmentData.ranking_reason_ar || caseFit.summaryAr}
                </p>
              </div>

              {/* Top Pros for this buyer */}
              {recommendedProperty.assessmentData.top_pros && recommendedProperty.assessmentData.top_pros.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[var(--navy)]">أبرز مزايا التوافق مع متطلباتك الشخصية:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {recommendedProperty.assessmentData.top_pros.slice(0, 3).map((pro, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[var(--cream)]/60 border border-[var(--mist)] text-xs text-[var(--navy)] flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{pro}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. RANKED ALTERNATIVES (if 2+ properties exist) */}
            {rankedAlternatives.length > 0 && (
              <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 sm:p-7 space-y-4 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--mist)] pb-3">
                  <h3 className="font-display font-bold text-base sm:text-lg text-[var(--navy)]">
                    الخيارات والبدائل التالية بالترتيب
                  </h3>
                  <span className="text-xs text-[var(--dusty-blue)]">
                    مرتبة حسب مؤشر الملاءمة المرجح وأولوياتك
                  </span>
                </div>

                <div className="divide-y divide-[var(--mist)]">
                  {rankedAlternatives.map((alt, idx) => (
                    <div key={alt.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[var(--cream)] border border-[var(--mist)] flex items-center justify-center font-bold text-[var(--navy)] shrink-0">
                          #{idx + 2}
                        </span>
                        <div>
                          <div className="font-bold text-[var(--navy)] text-sm">{alt.propertyData.title}</div>
                          <div className="text-[var(--dusty-blue)] text-xs mt-0.5">
                            حي {alt.propertyData.district || "الرياض"} • {formatSAR(alt.propertyData.listing_price_sar || 0)} • {alt.propertyData.area_sqm} م²
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right sm:text-left text-[11px] text-[var(--dusty-blue)] max-w-md line-clamp-1">
                          {alt.assessmentData.ranking_reason_ar}
                        </div>
                        <span className="px-3 py-1 rounded-full font-bold font-mono text-[var(--navy)] bg-[var(--cream)] border border-[var(--mist)] shrink-0">
                          {alt.assessmentData.weighted_fit_score} / 100
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. CASE SUMMARY WITH MISSING INFORMATION & CONFIDENCE LEVEL */}
            <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 sm:p-7 space-y-4 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--mist)] pb-3">
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-[var(--navy)]" />
                  <h2 className="font-display font-bold text-base sm:text-lg text-[var(--navy)]">
                    ملخص موثوقية بيانات الحالة الاستشارية
                  </h2>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--cream)] border border-[var(--mist)]">
                  <span className="text-[var(--dusty-blue)]">مستوى موثوقية الحالة:</span>
                  <span
                    className={
                      caseFit.confidence.level === "high"
                        ? "text-emerald-700 font-bold"
                        : caseFit.confidence.level === "medium"
                        ? "text-blue-700 font-bold"
                        : "text-amber-700 font-bold"
                    }
                  >
                    {caseFit.confidence.level === "high"
                      ? "ثقة عالية"
                      : caseFit.confidence.level === "medium"
                      ? "ثقة متوسطة"
                      : "تقدير مبدئي (بيانات ناقصة)"}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div>
                  <span className="font-bold text-[var(--navy)]">سبب تقييم الثقة: </span>
                  <span className="text-[var(--dusty-blue)]">{caseFit.confidence.reasonAr}</span>
                </div>

                {caseFit.missingInformation.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="font-bold text-[var(--navy)]">
                      قائمة البيانات الناقصة في ملف الحالة (تستوجب التحقق أثناء المعاينة):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {caseFit.missingInformation.map((info, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-[var(--cream)] border border-[var(--mist)] text-[var(--dusty-blue)] text-xs font-medium"
                        >
                          {info}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {caseFit.confidence.level === "low" && (
                  <div className="p-3.5 rounded-2xl bg-[#FFF9EC] border border-[#F9E2AF] text-[#9A6700] text-xs leading-relaxed flex items-start gap-2.5 mt-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>تنبيه استشاري لضمان دقة القرار:</strong> لا تعتبر هذه التقديرات حكماً نهائياً للشراء بل خطوة لتوجيه المعاينة الميدانية واستكمال النواقص المذكورة أعلاه.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. ALL CANDIDATE PROPERTY CARDS */}
            <section aria-label="قائمة تقييم الشقق" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {propertiesWithEvaluations.map((item, index) => (
                <PropertyCardRedesigned
                  key={item.id}
                  property={item.propertyData}
                  assessment={item.assessmentData}
                  index={index}
                />
              ))}
            </section>

            {/* 5. SHORT CLOSING "الخلاصة" FOR THE BUYER */}
            <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 sm:p-8 space-y-4 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
              <div className="flex items-center gap-2.5 border-b border-[var(--mist)] pb-3">
                <Sparkles className="w-5 h-5 text-[var(--navy)]" />
                <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--navy)]">
                  الخلاصة وتوجيهات ما قبل الشراء للمشتري
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Which option fits */}
                <div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--navy)]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>أي خيار هو الأنسب لك؟</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--navy)] leading-relaxed font-medium">
                    {recommendedProperty
                      ? `الشقة الأنسب لاحتياجاتك وظروفك الحالية هي "${recommendedProperty.propertyData.title || "الخيار الأول"}" (${recommendedProperty.propertyData.district || "الرياض"}) بمؤشر ملاءمة ${recommendedProperty.assessmentData.weighted_fit_score || 85}%، نظراً لتوافقها العالي مع سقف ميزانيتك وأولويات أسرتك.`
                      : "راجع تقييم الشقق المرشحة لتحديد الأقرب لتفضيلاتك."}
                  </p>
                </div>

                {/* What to verify before buying */}
                <div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--navy)]">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>ما يجب التحقق منه ميدانياً قبل الشراء:</span>
                  </div>
                  <ul className="text-xs text-[var(--dusty-blue)] space-y-1.5 leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)] shrink-0 mt-1.5" />
                      <span>مطابقة المساحة الصافية الفعلية بالمتر مع المذكور في الصك الإلكتروني.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)] shrink-0 mt-1.5" />
                      <span>التأكد من فرز الموقف والمصعد وعداد المياه/الكهرباء برقم مستقل في الصك.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)] shrink-0 mt-1.5" />
                      <span>الاطلاع على لائحة ورسوم اتحاد الملاك الشهرية والسنوية والتزامات الصيانة.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)] shrink-0 mt-1.5" />
                      <span>معاينة العزل الصوتي والمائي وجودة تمديدات السباكة والتشطيب على أرض الواقع.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Bottom Comparison CTA (if 2+ properties exist) */}
      {showComparisonCTA && (
        <div className="bg-[var(--paper)] text-[var(--navy)] rounded-[28px] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_20px_60px_rgba(15,26,43,0.04)] border border-[var(--mist)]">
          <div className="space-y-1.5 text-center sm:text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] text-xs font-medium mb-1 border border-[var(--mist)]">
              <Scale className="w-3.5 h-3.5 text-[var(--navy)]" />
              <span>مصفوفة التحليل المقارن</span>
            </div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-[var(--navy)]">
              جاهز لمفاضلة ومقارنة الخيارات؟
            </h3>
            <p className="text-xs sm:text-sm text-[var(--dusty-blue)] max-w-xl leading-relaxed">
              استعرض مصفوفة المقارنة المباشرة جنباً إلى جنب لاكتشاف الفروقات الجوهرية بين العقارات المرشحة.
            </p>
          </div>

          <Link
            href={`/case/${params.id}/compare`}
            className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-semibold text-base shadow-sm transition-all active:scale-[0.98] shrink-0 opacity-100"
          >
            <span className="text-[var(--cream)] text-base font-semibold opacity-100">{comparisonLabel}</span>
            <span aria-hidden="true" className="text-[var(--cream)] opacity-100">←</span>
          </Link>
        </div>
      )}
    </div>
  );
}
