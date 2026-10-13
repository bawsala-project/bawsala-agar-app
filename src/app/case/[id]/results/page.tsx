import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Scale, Info } from "lucide-react";
import { getSessionUser, requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveFacts, type PropertyFact } from "@/lib/evidence/resolve";
import type { ConstraintResult } from "@/lib/analysis/constraints";
import { AccountLinkBanner } from "@/components/account-link-banner";
import { PropertyCard, type PropertyCardAssessment, type PropertyCardProperty } from "./property-card";
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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10">
      {banner}

      {/* Insufficient compare notice */}
      {searchParams?.notice === "insufficient_compare" && (
        <div
          role="status"
          aria-live="polite"
          className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs sm:text-sm flex items-start gap-3.5 shadow-sm animate-in fade-in duration-200"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="font-extrabold text-slate-900">
              تنبيه: تتطلب مقارنة الخيارات وجود عقارين مرشحين على الأقل.
            </p>
            <p className="text-amber-800 text-xs leading-relaxed">
              لديك عقار واحد محلل حالياً؛ يمكنك إضافة عقارات إضافية من صفحة العقارات لتحليلها ومقارنتها جنباً إلى جنب.
            </p>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="relative bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-6 overflow-hidden">
        {/* Subtle Ambient Background Light */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/70">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                المرحلة 4 من 4 • تقرير القرار النهائي
              </span>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
                {propertyCount} {propertyCount === 1 ? "عقار محلل" : "عقارات محللة"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              تقرير تقييم العقارات
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              نتائج تحليل مطابقة العقارات لمتطلباتك وشروطك المحددة، مع إرشادات المعاينة الميدانية الاستشارية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-center shrink-0">
            <Link
              href={`/case/${params.id}/preflight`}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-4 py-2.5 rounded-xl transition-all shadow-xs"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>← الفحص المبدئي</span>
            </Link>

            {showComparisonCTA && (
              <Link
                href={`/case/${params.id}/compare`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-slate-900/10 transition-all active:scale-[0.98]"
              >
                <Scale className="w-4 h-4" />
                <span>{comparisonLabel}</span>
                <span aria-hidden="true">←</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Property Cards List */}
      <section aria-label="قائمة تقييم العقارات" className="space-y-8">
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
            resolved.fields.listing_price_sar.status === "known"
              ? Number(resolved.fields.listing_price_sar.value)
              : p?.listing_price_sar ?? null;

          const resolvedDistrict =
            resolved.fields.district.status === "known"
              ? String(resolved.fields.district.value)
              : p?.district ?? null;

          const assessmentData: PropertyCardAssessment = {
            id: a.id,
            property_id: a.property_id,
            fit_rating: a.fit_rating,
            fit_summary: a.fit_summary,
            strengths: (a.strengths as unknown as string[]) || [],
            risks: (a.risks as unknown as string[]) || [],
            key_unknowns: (a.key_unknowns as unknown as string[]) || [],
            visit_priority: a.visit_priority,
            visit_priority_reason: a.visit_priority_reason,
            evidence_fields: a.evidence_fields || [],
            constraint_results: (a.constraint_results as unknown as ConstraintResult[]) || [],
            price_per_sqm: a.price_per_sqm ? Number(a.price_per_sqm) : null,
          };

          const propertyData: PropertyCardProperty = {
            id: p?.id || a.property_id,
            title: p?.title,
            district: p?.district,
            listing_price_sar: p?.listing_price_sar,
            source_url: p?.source_url,
            input_mode: p?.input_mode,
            notes: p?.notes,
          };

          return (
            <PropertyCard
              key={a.id}
              caseId={params.id}
              assessment={assessmentData}
              property={propertyData}
              resolvedPrice={resolvedPrice}
              resolvedDistrict={resolvedDistrict}
              index={index}
            />
          );
        })}
      </section>

      {/* Bottom Comparison CTA (if 2+ properties exist) */}
      {showComparisonCTA && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Light */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1.5 text-center sm:text-right relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold mb-1">
              <Scale className="w-3.5 h-3.5" />
              <span>مصفوفة التحليل المقارن</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              جاهز لمفاضلة ومقارنة الخيارات؟
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              استعرض جدول المقارنة جنباً إلى جنب لاكتشاف الفروقات الجوهرية بين العقارات المرشحة.
            </p>
          </div>

          <Link
            href={`/case/${params.id}/compare`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-md shadow-blue-600/30 transition-all active:scale-[0.98] shrink-0 relative z-10"
          >
            <span>{comparisonLabel}</span>
            <span aria-hidden="true">←</span>
          </Link>
        </div>
      )}
    </div>
  );
}
