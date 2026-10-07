import { redirect } from "next/navigation";
import Link from "next/link";
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
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {banner}
      {/* Insufficient compare notice */}
      {searchParams?.notice === "insufficient_compare" && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-sm animate-in fade-in duration-200"
        >
          <span className="text-base select-none mt-0.5" aria-hidden="true">
            ℹ️
          </span>
          <div className="space-y-0.5">
            <p className="font-bold">
              تنبيه: تتطلب مقارنة الخيارات وجود عقارين مرشحين على الأقل.
            </p>
            <p className="text-amber-800/90 text-xs">
              لديك عقار واحد محلل حالياً؛ يمكنك إضافة عقارات إضافية من صفحة العقارات لتحليلها ومقارنتها جنباً إلى جنب.
            </p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              تقرير تقييم العقارات
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {propertyCount} {propertyCount === 1 ? "عقار محلل" : "عقارات محللة"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl">
            نتائج تحليل مطابقة العقارات لمتطلباتك وشروطك المحددة، مع إرشادات المعاينة الميدانية الاستشارية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/case/${params.id}/preflight`}
            className="text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-2 transition-colors"
          >
            ← الفحص المبدئي
          </Link>

          {showComparisonCTA && (
            <Link
              href={`/case/${params.id}/compare`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98]"
            >
              <span>{comparisonLabel}</span>
              <span aria-hidden="true">←</span>
            </Link>
          )}
        </div>
      </div>

      {/* Property Cards List */}
      <section aria-label="قائمة تقييم العقارات" className="space-y-6">
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
        <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/60 p-4 sm:p-6 rounded-2xl border">
          <div className="space-y-1 text-center sm:text-right">
            <h3 className="text-base font-bold text-gray-900">
              جاهز لمفاضلة ومقارنة الخيارات؟
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              استعرض جدول المقارنة جنباً إلى جنب لاكتشاف الفروقات الجوهرية بين العقارات المرشحة.
            </p>
          </div>

          <Link
            href={`/case/${params.id}/compare`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] shrink-0"
          >
            <span>{comparisonLabel}</span>
            <span aria-hidden="true">←</span>
          </Link>
        </div>
      )}
    </div>
  );
}
