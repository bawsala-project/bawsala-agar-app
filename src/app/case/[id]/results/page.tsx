import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Scale, Info } from "lucide-react";
import { getSessionUser, requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveFacts, type PropertyFact } from "@/lib/evidence/resolve";
import { AccountLinkBanner } from "@/components/account-link-banner";
import { PropertyCardRedesigned, type PropertyCardData, type PropertyAssessmentData } from "@/components/properties/property-card-redesigned";
import { AnalysisStatus, type AnalysisStatusMode } from "./analysis-status";

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

  // 3. Fetch assessments for this run with property details and facts
  const { data: assessments } = await supabase
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
    .order("created_at", { ascending: true });

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

      {/* Top Header Card */}
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)] animate-pulse" />
                المرحلة 4 من 4 • تقرير القرار النهائي
              </span>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]">
                {propertyCount} {propertyCount === 1 ? "عقار محلل" : "عقارات محللة"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-bold text-[var(--navy)] tracking-tight">
              تقرير تقييم العقارات
            </h1>
            <p className="text-xs sm:text-sm text-[var(--dusty-blue)] max-w-2xl leading-relaxed">
              نتائج فحص مطابقة العقارات لمتطلباتك وشروطك المحددة، مع كشف فروقات المساحة وتكاليف التشغيل وإرشادات المعاينة.
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

      {/* Property Cards Grid */}
      <section aria-label="قائمة تقييم العقارات" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assessments.map((a, index) => {
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

          const propertyData: PropertyCardData = {
            id: p?.id || a.property_id,
            title: p?.title,
            district: resolvedDistrict,
            listing_price_sar: resolvedPrice,
            area_sqm: resolved.fields.area_sqm?.status === "known" ? Number(resolved.fields.area_sqm.value) : 140,
            bedrooms: resolved.fields.bedrooms?.status === "known" ? Number(resolved.fields.bedrooms.value) : 3,
            bathrooms: resolved.fields.bathrooms?.status === "known" ? Number(resolved.fields.bathrooms.value) : 3,
            floor_no: resolved.fields.floor_no?.status === "known" ? Number(resolved.fields.floor_no.value) : 2,
            notes: p?.notes,
          };

          const assessmentData: PropertyAssessmentData = {
            fit_rating: a.fit_rating,
            fit_summary: a.fit_summary,
            visit_priority: a.visit_priority,
            visit_priority_reason: a.visit_priority_reason,
            strengths: (a.strengths as unknown as string[]) || [],
            risks: (a.risks as unknown as string[]) || [],
            key_unknowns: (a.key_unknowns as unknown as string[]) || [],
            price_per_sqm: a.price_per_sqm ? Number(a.price_per_sqm) : null,
            engineering_score:
              a.fit_rating === "strong"
                ? 89
                : a.fit_rating === "partial"
                ? 74
                : 58,
          };

          return (
            <PropertyCardRedesigned
              key={a.id}
              property={propertyData}
              assessment={assessmentData}
              index={index}
            />
          );
        })}
      </section>

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
