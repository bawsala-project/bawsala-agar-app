"use server";

import { redirect } from "next/navigation";
import { requireCase } from "@/lib/auth";
import { loadPreflightData } from "@/lib/preflight/load";
import { evaluatePreflight } from "@/lib/preflight/evaluate";
import { evaluateConstraints, pricePerSqm } from "@/lib/analysis/constraints";
import { admitPropertyAssessment, AdmittedPropertyAssessment } from "@/lib/analysis/admit";
import { analyzeProperty } from "@/lib/ai/analyze";
import { PROMPT_VERSION, ModelPropertyAssessment } from "@/lib/ai/prompts/analysis";
import { adminSupabase } from "@/lib/supabase/admin";
import { FIELD_REGISTRY, FieldKey } from "@/lib/evidence/fields";

export interface AnalysisActionState {
  error?: string;
}

export async function startAnalysis(
  caseId: string,
  prevState?: AnalysisActionState,
  formData?: FormData
): Promise<AnalysisActionState> {
  void prevState;
  void formData;
  // 1. Guard access via RLS
  const currentCase = await requireCase(caseId);

  // 2. Load preflight data and re-run preflight evaluation on server
  const preflightData = await loadPreflightData(caseId);
  const evaluation = evaluatePreflight(preflightData);

  if (!evaluation.ready) {
    return {
      error:
        evaluation.blockers[0]?.messageAr ||
        "لا يمكن بدء التحليل؛ توجد متطلبات أو تعارضات يلزم حلها أولاً",
    };
  }

  // 3. Limit: max 10 runs per case
  const { count: totalRunsCount, error: countErr } = await adminSupabase
    .from("analysis_runs")
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseId);

  if (countErr) {
    return { error: "حدث خطأ أثناء فحص سجلات التحليل" };
  }

  if (totalRunsCount !== null && totalRunsCount >= 10) {
    return {
      error: "الحد الأقصى للتحليل هو 10 محاولات لهذه الحالة",
    };
  }

  // 4. Concurrency check: check for already running analysis
  const { data: runningRuns } = await adminSupabase
    .from("analysis_runs")
    .select("id, created_at")
    .eq("case_id", caseId)
    .eq("status", "running")
    .order("created_at", { ascending: false })
    .limit(1);

  if (runningRuns && runningRuns.length > 0) {
    const runningRun = runningRuns[0];
    const ageSeconds = (Date.now() - new Date(runningRun.created_at).getTime()) / 1000;

    if (ageSeconds < 300) {
      return {
        error: "التحليل قيد المعالجة حاليًا. يرجى الانتظار قليلاً.",
      };
    } else {
      // Older than 5 minutes: mark as failed/stale
      await adminSupabase
        .from("analysis_runs")
        .update({
          status: "failed",
          outcome_code: "stale",
          finished_at: new Date().toISOString(),
        })
        .eq("id", runningRun.id);
    }
  }

  // 5. Insert new running analysis_runs row
  const baseVersion = currentCase.state_version;
  const modelName = process.env.AI_ANALYSIS_MODEL || "gemini-flash-lite-latest";

  const { data: run, error: insertRunErr } = await adminSupabase
    .from("analysis_runs")
    .insert({
      case_id: caseId,
      base_state_version: baseVersion,
      status: "running",
      model: modelName,
      prompt_version: PROMPT_VERSION,
    })
    .select("id")
    .single();

  if (insertRunErr || !run) {
    return {
      error: "تعذر بدء جلسة التحليل. حاول مرة أخرى.",
    };
  }

  const runId = run.id;

  // 6. Prepare inputs and execute per-property AI assessments in parallel
  const requirements = preflightData.requirements!;
  const admittedAssessments: AdmittedPropertyAssessment[] = [];

  try {
    const propertyTasks = preflightData.properties.map(async (prop) => {
      const constraints = evaluateConstraints(requirements, prop.resolved);
      const perSqm = pricePerSqm(prop.resolved);

      const knownFacts: Array<{
        field: string;
        label: string;
        value: unknown;
        certainty: "reported" | "user_stated";
      }> = [];
      const knownFactFields: string[] = [];

      for (const [key, f] of Object.entries(prop.resolved.fields)) {
        if (f.status === "known") {
          knownFactFields.push(key);
          const fieldDef = FIELD_REGISTRY[key as FieldKey];
          knownFacts.push({
            field: key,
            label: fieldDef?.label || key,
            value: f.value,
            certainty: f.certainty,
          });
        }
      }

      const unknownFieldKeys = Object.entries(prop.resolved.fields)
        .filter((entry) => entry[1].status === "unknown")
        .map((entry) => FIELD_REGISTRY[entry[0] as FieldKey]?.label || entry[0]);

      const conflictingFieldKeys = Object.entries(prop.resolved.fields)
        .filter((entry) => entry[1].status === "conflicting")
        .map((entry) => FIELD_REGISTRY[entry[0] as FieldKey]?.label || entry[0]);

      const listingClaims: Array<{ scope: string; claim: string }> = [];
      for (const f of prop.resolved.claims.unit) {
        if (f.raw_text) listingClaims.push({ scope: "الوحدة", claim: f.raw_text });
      }
      for (const f of prop.resolved.claims.building) {
        if (f.raw_text) listingClaims.push({ scope: "المبنى", claim: f.raw_text });
      }
      for (const f of prop.resolved.claims.neighborhood) {
        if (f.raw_text) listingClaims.push({ scope: "الحي", claim: f.raw_text });
      }

      const criticalFieldsKnownCount = [
        prop.resolved.fields.listing_price_sar.status === "known",
        prop.resolved.fields.area_sqm.status === "known",
        prop.resolved.fields.bedrooms.status === "known",
      ].filter(Boolean).length;

      const promptInput = {
        propertyLabel: prop.label,
        city: currentCase.city,
        requirements,
        constraints,
        knownFacts,
        unknownFieldKeys,
        conflictingFieldKeys,
        listingClaims,
      };

      // Model call attempt 1
      let rawOutput: ModelPropertyAssessment;
      try {
        rawOutput = await analyzeProperty(promptInput);
      } catch {
        // Retry once on network or model error
        rawOutput = await analyzeProperty(promptInput);
      }

      // Check admission
      let admission = admitPropertyAssessment({
        propertyId: prop.id,
        modelOutput: rawOutput,
        knownFactFields,
        constraintResults: constraints,
        pricePerSqm: perSqm,
        criticalFieldsKnownCount,
      });

      // If admission rejected, retry once automatically
      if (!admission.ok) {
        try {
          rawOutput = await analyzeProperty(promptInput);
          admission = admitPropertyAssessment({
            propertyId: prop.id,
            modelOutput: rawOutput,
            knownFactFields,
            constraintResults: constraints,
            pricePerSqm: perSqm,
            criticalFieldsKnownCount,
          });
        } catch {
          // retry failed
        }
      }

      if (!admission.ok) {
        throw new Error(`Output admission rejected for property ${prop.id}: ${admission.reason}`);
      }

      return admission.assessment;
    });

    const results = await Promise.all(propertyTasks);
    admittedAssessments.push(...results);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const outcomeCode = message.includes("Output admission rejected")
      ? "invalid_output"
      : "model_error";

    await adminSupabase
      .from("analysis_runs")
      .update({
        status: "failed",
        outcome_code: outcomeCode,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    return {
      error: "تعذر إكمال التحليل. حاول مرة أخرى.",
    };
  }

  // 7. Atomic Commit via commit_analysis RPC
  const { data: commitOutcome, error: commitRpcErr } = await adminSupabase.rpc(
    "commit_analysis",
    {
      p_run_id: runId,
      p_assessments: admittedAssessments as unknown as import("@/types/database").Json,
    }
  );

  if (commitRpcErr || !commitOutcome) {
    await adminSupabase
      .from("analysis_runs")
      .update({
        status: "failed",
        outcome_code: "commit_error",
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    return {
      error: "تعذر إكمال التحليل. حاول مرة أخرى.",
    };
  }

  if (commitOutcome === "stale_state") {
    return {
      error: "تغيّرت بياناتك أثناء التحليل. أعد تشغيل التحليل لتعكس آخر التعديلات.",
    };
  }

  if (commitOutcome !== "committed") {
    return {
      error: "تعذر إكمال التحليل. حاول مرة أخرى.",
    };
  }

  // 8. Success: Redirect to results page
  redirect(`/case/${caseId}/results`);
}

export interface ReassessPropertyActionResult {
  success: boolean;
  error?: string;
  stale?: boolean;
  messageAr?: string;
  diff?: import("@/lib/analysis/reassess").ReassessmentDiff;
}

/**
 * Reassess a property based on on-site inspection findings.
 * - Reads current case state_version as base_state_version
 * - Resolves affected targets and executes pure reassessProperty
 * - Calls PostgreSQL function commit_reassessment atomically
 * - Rejects with stale_state if state changed while reassessing
 */
export async function reassessPropertyAction(
  caseId: string,
  propertyId: string,
  clientOverride?: import("@supabase/supabase-js").SupabaseClient<import("@/types/database").Database>
): Promise<ReassessPropertyActionResult> {
  const { createClient } = await import("@/lib/supabase/server");
  const { revalidatePath } = await import("next/cache");
  const { resolveAffectedTargets } = await import("@/lib/analysis/reassess-targets");
  const { reassessProperty } = await import("@/lib/analysis/reassess");

  // 1. Guard access via RLS and get current state_version
  const currentCase = await requireCase(caseId, clientOverride);
  const baseVersion = currentCase.state_version;

  const supabase = clientOverride ?? createClient();

  // 2. Fetch property details
  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .eq("case_id", caseId)
    .single();

  if (propErr || !property) {
    return { success: false, error: "العقار غير موجود أو لا ينتمي لهذه الحالة" };
  }

  // 3. Fetch case requirements
  const { data: requirements } = await supabase
    .from("requirements")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();

  // 4. Find latest committed run
  const { data: runs, error: runErr } = await supabase
    .from("analysis_runs")
    .select("id")
    .eq("case_id", caseId)
    .eq("status", "committed")
    .order("finished_at", { ascending: false })
    .limit(1);

  if (runErr || !runs || runs.length === 0) {
    return { success: false, error: "لا يوجد تحليل معتمد سابق لهذه الحالة" };
  }

  const latestRunId = runs[0].id;

  // 5. Fetch previous assessment for this property
  const { data: prevAssessment, error: asmtErr } = await supabase
    .from("property_assessments")
    .select("*")
    .eq("run_id", latestRunId)
    .eq("property_id", propertyId)
    .single();

  if (asmtErr || !prevAssessment) {
    return { success: false, error: "لم يتم العثور على تقييم سابق لهذا العقار" };
  }

  // 6. Fetch inspection items and findings
  const { data: items } = await supabase
    .from("inspection_items")
    .select("*")
    .eq("property_id", propertyId);

  const { data: findings } = await supabase
    .from("inspection_findings")
    .select("*")
    .eq("property_id", propertyId);

  const findingsMap = new Map((findings || []).map((f) => [f.inspection_item_id, f]));
  const itemsWithFindings = (items || []).map((item) => ({
    item,
    finding: findingsMap.get(item.id) || null,
  }));

  const targetFindings = resolveAffectedTargets(itemsWithFindings);

  // 7. Compute deterministic reassessment
  const inputAssessment = {
    ...prevAssessment,
    fit_rating: (prevAssessment.fit_rating as import("@/lib/analysis/reassess").FitRating) || "insufficient_evidence",
    visit_priority: (prevAssessment.visit_priority as import("@/lib/analysis/reassess").VisitPriority) || "insufficient_evidence",
    constraint_results: prevAssessment.constraint_results as unknown as import("@/lib/analysis/constraints").ConstraintResult[],
    strengths: (prevAssessment.strengths as unknown as string[]) || [],
    risks: (prevAssessment.risks as unknown as string[]) || [],
    key_unknowns: (prevAssessment.key_unknowns as unknown as string[]) || [],
    price_per_sqm: prevAssessment.price_per_sqm ? Number(prevAssessment.price_per_sqm) : null,
  };

  const { assessment: newAssessment, diff } = reassessProperty(
    inputAssessment,
    targetFindings,
    property,
    requirements
  );

  // 8. Atomic commit via PostgreSQL commit_reassessment RPC
  const { data: commitOutcome, error: rpcErr } = await adminSupabase.rpc(
    "commit_reassessment",
    {
      p_case_id: caseId,
      p_property_id: propertyId,
      p_base_state_version: baseVersion,
      p_new_assessment: newAssessment as unknown as import("@/types/database").Json,
      p_diff: diff as unknown as import("@/types/database").Json,
    }
  );

  if (rpcErr || !commitOutcome) {
    return {
      success: false,
      error: rpcErr?.message || "تعذر اعتماد إعادة التقييم في قاعدة البيانات",
    };
  }

  if (commitOutcome === "stale_state") {
    return {
      success: false,
      error: "stale_state",
      stale: true,
      messageAr: "تغيّرت بيانات أو اشتراطات العقار أثناء المعاينة. يرجى مراجعة التحديثات.",
    };
  }

  if (commitOutcome !== "committed") {
    return {
      success: false,
      error: commitOutcome,
    };
  }

  try {
    revalidatePath(`/case/${caseId}/results`);
    revalidatePath(`/case/${caseId}/compare`);
    revalidatePath(`/case/${caseId}/reassess`);
    revalidatePath(`/case/${caseId}/inspection`);
  } catch {
    // Ignore in non-request contexts
  }

  return {
    success: true,
    diff,
  };
}

