import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser, requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveFacts } from "@/lib/evidence/resolve";
import {
  resolveComparison,
  computePoolFitScores,
  type PropertyAssessmentWithProperty,
} from "@/lib/analysis/compare";
import { AccountLinkBanner } from "@/components/account-link-banner";
import { ResultsLeaderboard } from "@/components/properties/property-card-redesigned";
import { DecisionFollowupQA } from "@/components/properties/decision-followup-qa";
import { AnalysisStatus, type AnalysisStatusMode } from "./analysis-status";
import { formatSAR } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { ConstraintResult } from "@/lib/analysis/constraints";
import { Scale, SlidersHorizontal, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

const STALE_RUN_MS = 300 * 1000;

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
type FactRow = Database["public"]["Tables"]["property_facts"]["Row"];
type AssessmentRow = Database["public"]["Tables"]["property_assessments"]["Row"];

type AssessmentWithJoinedProperty = AssessmentRow & {
  properties?:
    | (Partial<PropertyRow> & {
        property_facts?: FactRow[] | null;
      })
    | null;
};

interface ResultsPageProps {
  params: { id: string };
  searchParams?: { notice?: string; reanalyze?: string };
}

export default async function ResultsPage({
  params,
  searchParams,
}: ResultsPageProps) {
  // 1. Guard access via RLS
  const currentCase = await requireCase(params.id);
  const user = await getSessionUser();
  const verifiedCookieEmail = cookies().get("bawsala_verified_email")?.value;
  const banner =
    user?.is_anonymous && !verifiedCookieEmail ? (
      <AccountLinkBanner nextPath={`/case/${params.id}/results`} />
    ) : null;

  const supabase = createClient();

  // 2. Fetch latest committed analysis run for this case
  const { data: committedRuns } = await supabase
    .from("analysis_runs")
    .select("*")
    .eq("case_id", params.id)
    .eq("status", "committed")
    .order("finished_at", { ascending: false })
    .limit(1);

  const latestCommittedRun =
    committedRuns && committedRuns.length > 0 ? committedRuns[0] : null;

  const isCommittedRunStale =
    !latestCommittedRun ||
    (typeof latestCommittedRun.base_state_version === "number" &&
      currentCase.state_version > latestCommittedRun.base_state_version);

  const wantsReanalyze = searchParams?.reanalyze === "1" && isCommittedRunStale;

  if (!latestCommittedRun || wantsReanalyze) {
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
    if (!wantsReanalyze && (latestRun?.status === "failed" || runIsStale)) {
      mode = "failed";
    } else if (latestRun?.status === "running" && !runIsStale) {
      mode = "wait";
    }

    return (
      <>
        {banner}
        <AnalysisStatus caseId={params.id} mode={mode} />
      </>
    );
  }

  // 3. Fetch property_assessments with joined properties + facts, and optional requirements
  const assessmentsTable = supabase.from("property_assessments");
  const assessmentsRes = await assessmentsTable
    .select(
      `
      *,
      properties (
        *,
        property_facts (*)
      )
    `
    )
    .eq("run_id", latestCommittedRun.id)
    .order("created_at", { ascending: true });

  const joinedAssessments: AssessmentWithJoinedProperty[] =
    (assessmentsRes?.data as unknown as AssessmentWithJoinedProperty[]) || [];

  if (joinedAssessments.length === 0) {
    redirect(`/case/${params.id}/preflight`);
  }

  let requirements: Database["public"]["Tables"]["requirements"]["Row"] | null =
    null;
  try {
    const reqQuery = supabase.from("requirements");
    if (reqQuery && typeof reqQuery.select === "function") {
      const reqRes = await reqQuery
        .select("*")
        .eq("case_id", params.id)
        .maybeSingle();
      requirements = reqRes?.data || null;
    }
  } catch {
    requirements = null;
  }

  // 4. Build comparison pool and property/fact lookup maps
  const propById = new Map<string, Partial<PropertyRow>>();
  const factsByPropId = new Map<string, FactRow[]>();
  const assessmentByPropId = new Map<string, AssessmentWithJoinedProperty>();
  const comparisonPool: PropertyAssessmentWithProperty[] = [];

  for (const item of joinedAssessments) {
    const joinedProp = item.properties || { id: item.property_id };
    const propId = joinedProp.id || item.property_id;
    const propFacts = Array.isArray(joinedProp.property_facts)
      ? joinedProp.property_facts
      : [];

    propById.set(propId, joinedProp);
    factsByPropId.set(propId, propFacts);
    assessmentByPropId.set(propId, item);

    comparisonPool.push({
      id: item.id,
      property_id: propId,
      fit_rating: item.fit_rating,
      fit_summary: item.fit_summary,
      visit_priority: item.visit_priority,
      visit_priority_reason: item.visit_priority_reason,
      price_per_sqm: item.price_per_sqm,
      evidence_fields: Array.isArray(item.evidence_fields)
        ? (item.evidence_fields as unknown as string[])
        : [],
      constraint_results: Array.isArray(item.constraint_results)
        ? (item.constraint_results as unknown as ConstraintResult[])
        : [],
      strengths: Array.isArray(item.strengths)
        ? (item.strengths as unknown as string[])
        : [],
      risks: Array.isArray(item.risks)
        ? (item.risks as unknown as string[])
        : [],
      key_unknowns: Array.isArray(item.key_unknowns)
        ? (item.key_unknowns as unknown as string[])
        : [],
      properties: {
        id: propId,
        title: joinedProp.title ?? null,
        district: joinedProp.district ?? null,
        listing_price_sar: joinedProp.listing_price_sar ?? null,
        area_sqm: joinedProp.area_sqm ?? null,
        bedrooms: joinedProp.bedrooms ?? null,
        source_url: joinedProp.source_url ?? null,
        input_mode: joinedProp.input_mode ?? null,
        notes: joinedProp.notes ?? null,
        property_facts: propFacts,
      },
    });
  }

  const comparison = resolveComparison(comparisonPool, requirements);
  const rankedItems = comparison.items;
  const poolScores = computePoolFitScores(
    rankedItems,
    requirements?.max_budget_sar ?? null
  );

  const isStandalone = rankedItems.length === 1;

  // 5. Map ranked items into ResultsLeaderboard entries with resolved evidence and all 5 decision axes
  const entries = rankedItems.map((rankedItem, idx) => {
    const prop = propById.get(rankedItem.property_id) || {
      id: rankedItem.property_id,
    };
    const rawAssessment = assessmentByPropId.get(rankedItem.property_id);
    const propFacts = factsByPropId.get(rankedItem.property_id) || [];
    const resolved = resolveFacts(propFacts);

    const resolvedPrice =
      resolved.fields.listing_price_sar.status === "known" &&
      typeof resolved.fields.listing_price_sar.value === "number"
        ? resolved.fields.listing_price_sar.value
        : (prop.listing_price_sar ?? null);

    const resolvedDistrict =
      resolved.fields.district.status === "known" &&
      typeof resolved.fields.district.value === "string"
        ? resolved.fields.district.value
        : (prop.district ?? null);

    const resolvedArea =
      resolved.fields.area_sqm.status === "known" &&
      typeof resolved.fields.area_sqm.value === "number"
        ? resolved.fields.area_sqm.value
        : (prop.area_sqm ?? null);

    const resolvedBedrooms =
      resolved.fields.bedrooms.status === "known" &&
      typeof resolved.fields.bedrooms.value === "number"
        ? resolved.fields.bedrooms.value
        : (prop.bedrooms ?? null);

    const resolvedBathrooms =
      resolved.fields.bathrooms.status === "known" &&
      typeof resolved.fields.bathrooms.value === "number"
        ? resolved.fields.bathrooms.value
        : null;

    const resolvedFloor =
      resolved.fields.floor_no.status === "known" &&
      typeof resolved.fields.floor_no.value === "number"
        ? resolved.fields.floor_no.value
        : (prop.floor_no ?? null);

    const constraints: ConstraintResult[] =
      rankedItem.constraints && rankedItem.constraints.length > 0
        ? rankedItem.constraints
        : Array.isArray(rawAssessment?.constraint_results)
          ? (rawAssessment!.constraint_results as unknown as ConstraintResult[])
          : [];

    const decisionFitScore = poolScores[idx] ?? 75;

    return {
      rank: isStandalone ? null : (rankedItem.rank ?? idx + 1),
      property: {
        id: rankedItem.property_id,
        title: rankedItem.title,
        district: resolvedDistrict,
        city: currentCase.city,
        listing_price_sar: resolvedPrice,
        area_sqm: resolvedArea,
        bedrooms: resolvedBedrooms,
        bathrooms: resolvedBathrooms,
        floor_no: resolvedFloor,
        resolvedFields: resolved.fields,
      },
      assessment: {
        fit_rating: rankedItem.fit_rating,
        fit_summary:
          rawAssessment?.fit_summary || rankedItem.main_advantage_ar || "",
        visit_priority: rankedItem.visit_priority,
        visit_priority_reason: rawAssessment?.visit_priority_reason || "",
        main_advantage_ar: rankedItem.main_advantage_ar,
        main_tradeoff_ar: rankedItem.main_tradeoff_ar,
        what_could_change_rank_ar: rankedItem.what_could_change_rank_ar,
        ranking_reason_ar: rankedItem.ranking_reason_ar,
        preferences_impact_ar: rankedItem.preferences_impact_ar,
        score_vs_rank_note_ar: rankedItem.score_vs_rank_note_ar,
        strengths: rankedItem.strengths,
        risks: rankedItem.risks,
        key_unknowns: rankedItem.key_unknowns,
        constraint_results: constraints,
        decision_fit_score: decisionFitScore,
        price_per_sqm: rankedItem.price_per_sqm,
        overall_confidence: rankedItem.overall_confidence,
        confidence_label_ar: rankedItem.confidence_label_ar,
        confidence_reason_ar: rankedItem.confidence_reason_ar,
        daily_life: rankedItem.daily_life,
        price_axis: rankedItem.price_axis,
        affordability_axis: rankedItem.affordability_axis,
        tradeoffs: rankedItem.tradeoffs,
      },
    };
  });

  const isStale =
    typeof latestCommittedRun.base_state_version === "number" &&
    currentCase.state_version > latestCommittedRun.base_state_version;
  const propertyCount = entries.length;
  const showInsufficientCompareNotice =
    searchParams?.notice === "insufficient_compare";

  const purchaseMethodLabel =
    requirements?.purchase_method === "cash"
      ? "شراء نقدي (كاش)"
      : requirements?.purchase_method === "finance" ||
          requirements?.purchase_method === "mortgage"
        ? "تمويل عقاري"
        : "غير محدد";

  const hardConstraintsCount = Array.isArray(requirements?.hard_constraints)
    ? requirements.hard_constraints.length
    : 0;

  return (
    <div className="max-w-[1040px] mx-auto space-y-6 sm:space-y-8" dir="rtl">
      {banner}
      {/* Header: Unified executive header card with balanced title, action & criteria bar */}
      <header className="rounded-[24px] bg-[var(--paper)] border border-[var(--mist)] p-5 sm:p-6 shadow-[0_12px_36px_rgba(15,26,43,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--dusty-blue)]">
              <span className="w-2 h-2 rounded-full bg-[#1E6B43]" aria-hidden="true" />
              <span>
                {isStandalone ? "1 عقار محلل" : `${propertyCount} عقارات محللة`}
                {currentCase.city ? ` · ${currentCase.city}` : ""}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[var(--navy)] tracking-tight font-display leading-tight">
              {isStandalone ? "نتيجة قرار الشراء" : "ترتيب الشقق المرشحة"}
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {propertyCount >= 2 ? (
              <Link
                href={`/case/${params.id}/compare`}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] text-xs sm:text-sm font-bold transition-all no-underline shadow-xs"
              >
                <Scale className="w-4 h-4" />
                <span>{`مقارنة الخيارات (${propertyCount} عقارات) ←`}</span>
              </Link>
            ) : (
              <Link
                href={`/case/${params.id}/properties`}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] text-xs sm:text-sm font-bold transition-all no-underline shadow-xs"
              >
                <Building2 className="w-4 h-4" />
                <span>إضافة عقار آخر +</span>
              </Link>
            )}
          </div>
        </div>

        {/* Your criteria — balanced wrap strip with inline edit action */}
        {requirements && (
          <div className="pt-3.5 border-t border-[var(--mist)]/70 flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm">
            <div className="flex flex-wrap [flex-wrap:balance] items-center gap-2">
              <span className="text-xs font-bold text-[var(--dusty-blue)] me-1">
                معاييرك:
              </span>
              {[
                requirements.max_budget_sar
                  ? `حتى ${formatSAR(Number(requirements.max_budget_sar))}`
                  : null,
                purchaseMethodLabel !== "غير محدد" ? purchaseMethodLabel : null,
                requirements.household_size
                  ? `${requirements.household_size} أفراد · ${requirements.min_bedrooms}+ غرف`
                  : null,
                hardConstraintsCount > 0 ? `${hardConstraintsCount} شروط ملزمة` : null,
              ]
                .filter(Boolean)
                .map((chip) => (
                  <span
                    key={chip as string}
                    className="shrink-0 px-3 py-1 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] font-semibold tabular-nums whitespace-nowrap"
                  >
                    {chip}
                  </span>
                ))}
            </div>
            <Link
              href={`/case/${params.id}/needs`}
              className="ms-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--cream)]/70 hover:bg-[var(--cream)] border border-transparent hover:border-[var(--mist)] text-[var(--dusty-blue)] hover:text-[var(--navy)] text-xs font-bold whitespace-nowrap transition-colors no-underline"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              تعديل المعايير
            </Link>
          </div>
        )}
      </header>

      {/* Stale State Warning Banner */}
      {isStale && (
        <div
          role="alert"
          className="rounded-[24px] border border-[#F9E2AF] bg-[#FFF9EC] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--paper)] text-[#9A6700] border border-[#F9E2AF] font-bold shrink-0 mt-0.5"
              aria-hidden="true"
            >
              !
            </span>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[var(--navy)]">
                تم تعديل البيانات بعد هذا التحليل
              </h2>
              <p className="text-sm text-[var(--dusty-blue)] leading-relaxed">
                أعد التحليل لتحديث التوصية.
              </p>
            </div>
          </div>

          <Link
            href={`/case/${params.id}/results?reanalyze=1`}
            className="w-full sm:w-auto text-center px-5 py-2.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] text-xs font-bold shadow-xs transition-all shrink-0 no-underline"
          >
            إعادة التحليل ←
          </Link>
        </div>
      )}

      {/* Insufficient Compare Notice Banner */}
      {showInsufficientCompareNotice && (
        <div
          role="status"
          className="rounded-[24px] border border-[var(--mist)] bg-[var(--paper)] p-4 flex items-center justify-between gap-4 text-sm text-[var(--navy)] shadow-xs"
        >
          <span>المقارنة تحتاج عقارين على الأقل.</span>
          <Link
            href={`/case/${params.id}/properties`}
            className="font-bold underline hover:text-[var(--dusty-blue)] shrink-0"
          >
            إضافة عقار آخر +
          </Link>
        </div>
      )}

      {/* Ranked Leaderboard OR Standalone Decision Card */}
      <ResultsLeaderboard entries={entries} caseId={params.id} />

      {/* Interactive Follow-Up Q&A within the same case (Free in-case consultation) */}
      <DecisionFollowupQA
        caseId={params.id}
        items={rankedItems}
        mode={comparison.mode}
        closeOptions={comparison.close_options}
        isStandalone={isStandalone}
        maxBudgetSar={requirements?.max_budget_sar ?? null}
        purchaseMethod={requirements?.purchase_method ?? null}
      />

      {/* Mobile thumb-zone action bar */}
      <div className="sm:hidden sticky bottom-0 z-30 -mx-4 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[var(--paper)]/95 backdrop-blur-md border-t border-[var(--mist)] flex items-center gap-2.5">
        {propertyCount >= 2 ? (
          <Link
            href={`/case/${params.id}/compare`}
            className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--navy)] active:scale-[0.98] text-[var(--cream)] text-sm font-bold transition-transform no-underline"
          >
            <Scale className="w-4 h-4" />
            <span>{`مقارنة الخيارات (${propertyCount} عقارات)`}</span>
          </Link>
        ) : (
          <Link
            href={`/case/${params.id}/properties`}
            className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--navy)] active:scale-[0.98] text-[var(--cream)] text-sm font-bold transition-transform no-underline"
          >
            <Building2 className="w-4 h-4" />
            <span>إضافة عقار آخر</span>
          </Link>
        )}
      </div>
    </div>
  );
}
