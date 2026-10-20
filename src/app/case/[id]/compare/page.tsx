import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Scale,
  Trophy,
  AlertTriangle,
  Info,
  ArrowRight,
} from "lucide-react";
import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  resolveComparison,
  computePoolFitScores,
  type PropertyAssessmentWithProperty,
} from "@/lib/analysis/compare";
import {
  ComparisonMatrix,
  type ComparisonItem,
} from "@/components/properties/comparison-matrix";
import { DecisionFollowupQA } from "@/components/properties/decision-followup-qa";

import type { ConstraintResult } from "@/lib/analysis/constraints";

interface ComparePageProps {
  params: { id: string };
}

export default async function ComparePage({ params }: ComparePageProps) {
  // 1. Guard with RLS
  const decisionCase = await requireCase(params.id);

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

  // 4. If only 1 property exists, redirect to results with notice
  if (!assessments || assessments.length < 2) {
    redirect(`/case/${params.id}/results?notice=insufficient_compare`);
  }

  // 5. Pure Comparison Resolver
  const comparison = resolveComparison(
    assessments as unknown as PropertyAssessmentWithProperty[],
    requirements
  );

  const { mode, items, summaryAr, close_options } = comparison;
  const poolScores = computePoolFitScores(
    items,
    requirements?.max_budget_sar ?? null
  );

  const assessmentMap = new Map(
    (
      assessments as unknown as Array<{
        property_id: string;
        properties?: {
          floor_no?: number | null;
          property_facts?: Array<{ bathrooms?: number | null }> | null;
        } | null;
        fit_summary?: string;
        visit_priority_reason?: string;
        constraint_results?: ConstraintResult[];
      }>
    ).map((a) => [a.property_id, a])
  );

  // Map to ComparisonItem for the ComparisonMatrix component
  const matrixItems: ComparisonItem[] = items.map((it, idx) => {
    const rawAssessment = assessmentMap.get(it.property_id);
    const rawProp = rawAssessment?.properties;
    const fact = Array.isArray(rawProp?.property_facts)
      ? rawProp?.property_facts[0]
      : undefined;

    return {
      id: it.property_id,
      rank: it.rank ?? idx + 1,
      title: it.title,
      district: it.district,
      city: decisionCase.city,
      listing_price_sar: it.price || 0,
      price_per_sqm: it.price_per_sqm,
      price_delta_budget: it.price_delta_budget,
      area_sqm: it.area_sqm,
      bedrooms: it.bedrooms,
      bathrooms: fact?.bathrooms ?? null,
      floor_no: rawProp?.floor_no ?? null,
      fit_rating: it.fit_rating,
      visit_priority: it.visit_priority,
      visit_priority_reason: rawAssessment?.visit_priority_reason || "",
      fit_summary: rawAssessment?.fit_summary || it.main_advantage_ar || "",
      main_advantage_ar: it.main_advantage_ar,
      main_tradeoff_ar: it.main_tradeoff_ar,
      what_could_change_rank_ar: it.what_could_change_rank_ar,
      strengths: it.strengths,
      risks: it.risks,
      key_unknowns: it.key_unknowns,
      constraint_summary: it.constraint_summary,
      constraint_results: Array.isArray(rawAssessment?.constraint_results)
        ? rawAssessment?.constraint_results
        : it.constraints,
      decision_fit_score: poolScores[idx] ?? 75,
      overall_confidence: it.overall_confidence,
      confidence_label_ar: it.confidence_label_ar,
      confidence_reason_ar: it.confidence_reason_ar,
      daily_life: it.daily_life,
      price_axis: it.price_axis,
      affordability_axis: it.affordability_axis,
      tradeoffs: it.tradeoffs,
    };
  });

  return (
    <div
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8"
      dir="rtl"
    >
      {/* Top Header Card */}
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]">
                {items.length} شقق مرشحة
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-bold text-[var(--navy)] tracking-tight">
              مقارنة الخيارات
            </h1>
          </div>

          <div className="self-start sm:self-center shrink-0">
            <Link
              href={`/case/${params.id}/results`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[var(--dusty-blue)] hover:text-[var(--navy)] bg-[var(--paper)] hover:border-[var(--navy)] border border-[var(--mist)] px-5 py-2.5 rounded-full transition-all"
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
        className={`rounded-[28px] border p-5 sm:p-6 flex items-start gap-4 shadow-sm transition-all ${
          mode === "ranked"
            ? "bg-[#E9F4EE] border-[#C5E4D4]"
            : mode === "provisional"
              ? "bg-[#FFF9EC] border-[#F9E2AF]"
              : "bg-[var(--paper)] border-[var(--mist)]"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 font-bold ${
            mode === "ranked"
              ? "bg-[#1E6B43] text-[var(--cream)]"
              : mode === "provisional"
                ? "bg-[#9A6700] text-[var(--cream)]"
                : "bg-[var(--navy)] text-[var(--cream)]"
          }`}
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
          <h2 className="text-base sm:text-lg font-display font-bold text-[var(--navy)]">
            {summaryAr}
          </h2>
          <p className="text-sm text-[var(--dusty-blue)] leading-relaxed font-normal">
            {mode === "ranked"
              ? "الشروط الملزمة أولاً، ثم الملاءمة وسعر المتر."
              : mode === "provisional"
                ? "بيانات حاسمة غير مؤكدة؛ المعاينة قد تغيّر الترتيب."
                : "البيانات محدودة؛ أكمل الناقص لمقارنة أدق."}
          </p>
        </div>
      </div>

      {/* Close Options Notice */}
      {close_options && (
        <div
          role="status"
          className="rounded-[28px] border border-[#F9E2AF] bg-[#FFF9EC] p-5 flex items-start gap-3.5 shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--paper)] text-[#9A6700] border border-[#F9E2AF] flex items-center justify-center shrink-0 mt-0.5">
            <Scale className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-body font-bold text-[var(--navy)]">
              خيارات متقاربة جدًا
            </h3>
            <p className="text-sm text-[var(--dusty-blue)] leading-relaxed">
              الفارق أقل من 5%؛ راجع المفاضلات أدناه.
            </p>
          </div>
        </div>
      )}

      {/* Comparison Matrix Component */}
      <section aria-label="مصفوفة المقارنة المباشرة">
        <ComparisonMatrix items={matrixItems} caseId={params.id} />
      </section>

      {/* Interactive Follow-Up Q&A */}
      <DecisionFollowupQA
        caseId={params.id}
        items={items}
        mode={mode}
        closeOptions={close_options}
        isStandalone={false}
        maxBudgetSar={requirements?.max_budget_sar ?? null}
        purchaseMethod={requirements?.purchase_method ?? null}
      />
    </div>
  );
}
