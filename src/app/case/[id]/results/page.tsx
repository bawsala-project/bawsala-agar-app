import { redirect } from "next/navigation";
import Link from "next/link";
import { Info } from "lucide-react";
import { getSessionUser, requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveFacts, type PropertyFact } from "@/lib/evidence/resolve";
import {
  resolveComparison,
  computePoolFitScores,
  type PropertyAssessmentWithProperty,
} from "@/lib/analysis/compare";
import type { ConstraintResult, RequirementsRow } from "@/lib/analysis/constraints";
import { AccountLinkBanner } from "@/components/account-link-banner";
import {
  ResultsLeaderboard,
  type LeaderboardEntry,
  type PropertyCardData,
  type PropertyAssessmentData,
} from "@/components/properties/property-card-redesigned";
import { AnalysisStatus, type AnalysisStatusMode } from "./analysis-status";

// Mirrors the 5-minute stale threshold used by startAnalysis for running runs.
const STALE_RUN_MS = 300 * 1000;

interface ResultsPageProps {
  params: { id: string };
  searchParams?: { notice?: string };
}

export default async function ResultsPage({ params, searchParams }: ResultsPageProps) {
  // 1. Guard with RLS & get case context
  const currentCase = await requireCase(params.id);

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

  // 3. Fetch assessments + requirements (safely guarded for test mocks)
  const reqTable = supabase.from("requirements") as unknown as {
    select?: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: RequirementsRow | null }>;
      };
    };
  };

  const [{ data: assessments }, reqResult] = await Promise.all([
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
    typeof reqTable?.select === "function"
      ? reqTable.select("*").eq("case_id", params.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const requirements = reqResult?.data ?? null;

  if (!assessments || assessments.length === 0) {
    redirect(`/case/${params.id}/preflight`);
  }

  // Round price_per_sqm up front so narrative strings never show .05 or .8 decimals
  const normalizedAssessments = assessments.map((a) => ({
    ...a,
    price_per_sqm: a.price_per_sqm ? Math.round(Number(a.price_per_sqm)) : null,
  })) as unknown as PropertyAssessmentWithProperty[];

  const typedRequirements = (requirements as unknown as RequirementsRow | null) ?? null;
  const comparison = resolveComparison(normalizedAssessments, typedRequirements);

  const assessmentById = new Map(assessments.map((a) => [a.id, a]));

  const rankedItems =
    comparison.items.length > 0
      ? comparison.items
      : normalizedAssessments.map((a, idx) => ({
          property_id: a.property_id,
          assessment_id: a.id,
          rank: idx + 1,
          title: a.properties?.title || `العقار #${idx + 1}`,
          district: a.properties?.district || "غير محدد",
          price: a.properties?.listing_price_sar ?? null,
          price_per_sqm: a.price_per_sqm,
          price_delta_budget: null,
          area_sqm: null,
          bedrooms: null,
          fit_rating: (a.fit_rating as "strong" | "partial" | "weak" | "insufficient_evidence") || "partial",
          visit_priority: (a.visit_priority as "high" | "medium" | "low" | "insufficient_evidence") || "medium",
          constraint_summary: { pass: 0, fail: 0, unknown: 0 },
          constraints: (a.constraint_results as unknown as ConstraintResult[]) || [],
          main_advantage_ar: (a.strengths as unknown as string[])?.[0] || "خيار متوازن للمعاينة",
          main_tradeoff_ar: (a.risks as unknown as string[])?.[0] || "",
          what_could_change_rank_ar: "",
          strengths: (a.strengths as unknown as string[]) || [],
          risks: (a.risks as unknown as string[]) || [],
          key_unknowns: (a.key_unknowns as unknown as string[]) || [],
        }));

  const finalScores = computePoolFitScores(
    rankedItems,
    typedRequirements?.max_budget_sar ?? null
  );

  const propertyCount = rankedItems.length;
  const showComparisonCTA = propertyCount >= 2;
  const comparisonLabel = `مقارنة الخيارات (${propertyCount} عقارات)`;

  // Build clean Leaderboard entries
  const entries: LeaderboardEntry[] = rankedItems.map((item, index) => {
    const rawAssessment = assessmentById.get(item.assessment_id) || assessments[index];
    const p = rawAssessment?.properties as unknown as {
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
      item.price ??
      (resolved.fields.listing_price_sar?.status === "known"
        ? Number(resolved.fields.listing_price_sar.value)
        : p?.listing_price_sar ?? null);

    const resolvedArea =
      item.area_sqm ??
      (resolved.fields.area_sqm?.status === "known"
        ? Number(resolved.fields.area_sqm.value)
        : null);

    const resolvedBedrooms =
      item.bedrooms ??
      (resolved.fields.bedrooms?.status === "known"
        ? Number(resolved.fields.bedrooms.value)
        : null);

    const resolvedBathrooms =
      resolved.fields.bathrooms?.status === "known"
        ? Number(resolved.fields.bathrooms.value)
        : null;

    const resolvedFloor =
      resolved.fields.floor_no?.status === "known"
        ? Number(resolved.fields.floor_no.value)
        : null;

    const resolvedDistrict =
      resolved.fields.district?.status === "known"
        ? String(resolved.fields.district.value)
        : p?.district ?? null;

    // Short, human-readable title (never truncates with ugly specs soup)
    const rawCustomTitle = p?.title?.trim();
    const cleanTitle =
      rawCustomTitle && rawCustomTitle !== "عقار بدون عنوان"
        ? rawCustomTitle
        : resolvedDistrict
        ? `شقة في ${resolvedDistrict}`
        : `العقار الخيار #${index + 1}`;

    const computedPpsqm =
      item.price_per_sqm ??
      (resolvedPrice && resolvedArea && resolvedArea > 0
        ? Math.round(resolvedPrice / resolvedArea)
        : null);

    const propertyData: PropertyCardData = {
      id: p?.id || item.property_id,
      title: cleanTitle,
      city: currentCase.city,
      district: resolvedDistrict,
      listing_price_sar: resolvedPrice,
      area_sqm: resolvedArea,
      bedrooms: resolvedBedrooms,
      bathrooms: resolvedBathrooms,
      floor_no: resolvedFloor,
      notes: p?.notes,
    };

    const assessmentData: PropertyAssessmentData = {
      fit_rating: item.fit_rating,
      fit_summary: rawAssessment?.fit_summary || item.main_advantage_ar,
      visit_priority: item.visit_priority,
      visit_priority_reason: rawAssessment?.visit_priority_reason || "",
      strengths: item.strengths,
      risks: item.risks,
      key_unknowns: item.key_unknowns,
      price_per_sqm: computedPpsqm ? Math.round(computedPpsqm) : null,
      engineering_score: finalScores[index],
      constraint_results: item.constraints,
      constraint_summary: item.constraint_summary,
      main_advantage_ar: item.main_advantage_ar,
      main_tradeoff_ar: item.main_tradeoff_ar,
    };

    return {
      id: item.assessment_id,
      rank: index + 1,
      property: propertyData,
      assessment: assessmentData,
    };
  });

  return (
    <div className="w-full space-y-5" dir="rtl">
      {banner}

      {/* Insufficient compare notice */}
      {searchParams?.notice === "insufficient_compare" && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-2xl bg-[#FFF9EC] border border-[#F9E2AF] text-[var(--navy)] text-xs sm:text-sm flex items-start gap-3"
        >
          <Info className="w-4 h-4 text-[#9A6700] shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            <strong className="font-bold">تنبيه:</strong> تتطلب مقارنة الخيارات وجود عقارين مرشحين على الأقل.
          </p>
        </div>
      )}

      {/* Centered Editorial Header aligned with the #1 Center Podium Axis */}
      <header className="max-w-2xl mx-auto text-center space-y-2 pt-1">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--navy)]">
          ترتيب الخيارات المرشحة
        </h1>
        <p className="text-xs font-medium text-[var(--dusty-blue)]">
          {[
            currentCase.city,
            `${propertyCount} ${propertyCount === 1 ? "عقار محلل" : "عقارات محللة"}`,
            "اضغط على أي مركز في المنصة لعرض تفاصيله",
          ]
            .filter(Boolean)
            .join("  ·  ")}
        </p>

        {showComparisonCTA && (
          <div className="pt-1 flex items-center justify-center gap-3">
            <Link
              href={`/case/${params.id}/compare`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--paper)] hover:bg-[var(--navy)] text-[var(--navy)] hover:text-[var(--cream)] border border-[var(--mist)] hover:border-[var(--navy)] font-bold text-xs transition-all shadow-sm"
            >
              <span>{comparisonLabel}</span>
              <span aria-hidden="true">←</span>
            </Link>
            <Link
              href={`/case/${params.id}/preflight`}
              className="text-xs font-semibold text-[var(--dusty-blue)] hover:text-[var(--navy)] px-2.5 py-1.5 transition-colors"
            >
              الفحص المبدئي
            </Link>
          </div>
        )}
      </header>

      {/* Interactive 2 — 1 — 3 Podium + Focused Detail Card */}
      <ResultsLeaderboard entries={entries} caseId={params.id} />
    </div>
  );
}
