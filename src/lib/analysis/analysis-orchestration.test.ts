import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminSupabase } from "@/lib/supabase/admin";
import { evaluateConstraints } from "./constraints";
import { admitPropertyAssessment } from "./admit";
import type { ModelPropertyAssessment } from "@/lib/ai/prompts/analysis";
import { makeEmptyResolved } from "./test-helpers";

describe("Analysis Orchestration & Commit Race Handling (Acceptance 4 & 5)", () => {
  let testUserId: string;
  let testCaseId: string;
  let testPropId: string;

  beforeAll(async () => {
    // 1. Get or create test user
    const {
      data: { users },
    } = await adminSupabase.auth.admin.listUsers();

    if (users && users.length > 0) {
      testUserId = users[0].id;
    } else {
      const { data: newUser } = await adminSupabase.auth.admin.createUser({
        email: `test-analysis-${Date.now()}@bawsala.local`,
      });
      testUserId = newUser!.user!.id;
    }

    // 2. Create case
    const { data: testCase } = await adminSupabase
      .from("decision_cases")
      .insert({
        city: "الرياض",
        status: "draft",
        owner_id: testUserId,
      })
      .select()
      .single();

    testCaseId = testCase!.id;

    // 3. Create requirements
    await adminSupabase.from("requirements").insert({
      case_id: testCaseId,
      max_budget_sar: 800000,
      purchase_method: "cash",
      household_size: 4,
      min_bedrooms: 3,
      min_area_sqm: 100,
    });

    // 4. Create property
    const { data: prop } = await adminSupabase
      .from("properties")
      .insert({
        case_id: testCaseId,
        input_mode: "manual",
        title: "شقة الياسمين للتحليل",
      })
      .select()
      .single();

    testPropId = prop!.id;
  });

  afterAll(async () => {
    if (testCaseId) {
      await adminSupabase.from("decision_cases").delete().eq("id", testCaseId);
    }
  });

  it("Acceptance 5: property exceeding budget shows budget constraint as fail and fit as weak, regardless of model output", async () => {
    // Fetch requirements (budget: 800,000)
    const { data: req } = await adminSupabase
      .from("requirements")
      .select("*")
      .eq("case_id", testCaseId)
      .single();

    // Property price is 950,000 (exceeds 800,000)
    const resolved = makeEmptyResolved();
    resolved.fields.listing_price_sar = {
      status: "known",
      value: 950000,
      certainty: "reported",
      factIds: ["f1"],
    };
    resolved.fields.area_sqm = {
      status: "known",
      value: 130,
      certainty: "reported",
      factIds: ["f2"],
    };
    resolved.fields.bedrooms = {
      status: "known",
      value: 3,
      certainty: "reported",
      factIds: ["f3"],
    };

    // 1. Constraint evaluation
    const constraints = evaluateConstraints(req!, resolved);
    const budgetConstraint = constraints.find((c) => c.key === "budget");
    expect(budgetConstraint?.result).toBe("fail");

    // 2. Model outputs 'strong' and 'high'
    const modelOutput: ModelPropertyAssessment = {
      fit_rating: "strong",
      fit_summary: "العقار ممتاز وسعره مناسب جداً للمشتري",
      strengths: ["تشطيبات فاخرة"],
      risks: [],
      key_unknowns: [],
      visit_priority: "high",
      visit_priority_reason: "ينصح بالمعاينة السريعة",
      evidence_fields: ["listing_price_sar", "area_sqm", "bedrooms"],
    };

    // 3. Admission applies deterministic overrides
    const admission = admitPropertyAssessment({
      propertyId: testPropId,
      modelOutput,
      knownFactFields: ["listing_price_sar", "area_sqm", "bedrooms"],
      constraintResults: constraints,
      pricePerSqm: 7307.69,
      criticalFieldsKnownCount: 3,
    });

    expect(admission.ok).toBe(true);
    if (admission.ok) {
      // Deterministically overridden to 'weak'
      expect(admission.assessment.fit_rating).toBe("weak");
      // Visit priority cannot be 'high'
      expect(admission.assessment.visit_priority).not.toBe("high");
      expect(admission.assessment.visit_priority).toBe("medium");
    }
  });

  it("Acceptance 4: live race test - changing requirements while analysis runs discards run as stale_state", async () => {
    // 1. Read current case state_version
    const { data: initialCase } = await adminSupabase
      .from("decision_cases")
      .select("state_version")
      .eq("id", testCaseId)
      .single();

    const baseVersion = initialCase!.state_version;

    // 2. Create a running analysis run matching baseVersion
    const { data: run1 } = await adminSupabase
      .from("analysis_runs")
      .insert({
        case_id: testCaseId,
        base_state_version: baseVersion,
        status: "running",
        model: "gemini-flash-lite",
        prompt_version: "2026-10-06.1",
      })
      .select("id")
      .single();

    const run1Id = run1!.id;

    // 3. Simulate another tab changing the budget -> triggers DB state_version increment
    await adminSupabase
      .from("requirements")
      .update({ max_budget_sar: 850000 })
      .eq("case_id", testCaseId);

    const { data: bumpedCase } = await adminSupabase
      .from("decision_cases")
      .select("state_version")
      .eq("id", testCaseId)
      .single();

    expect(bumpedCase!.state_version).toBeGreaterThan(baseVersion);

    // 4. Analysis run 1 finishes and calls commit_analysis
    const sampleAssessment = {
      property_id: testPropId,
      constraint_results: [],
      price_per_sqm: 7000.0,
      fit_rating: "partial",
      fit_summary: "ملخص التحليل المبدئي",
      strengths: ["سعر مناسب"],
      risks: [],
      key_unknowns: [],
      visit_priority: "medium",
      visit_priority_reason: "معاينة عادية",
      evidence_fields: ["listing_price_sar"],
    };

    const { data: commitRes1 } = await adminSupabase.rpc("commit_analysis", {
      p_run_id: run1Id,
      p_assessments: [sampleAssessment],
    });

    // Must be rejected as stale_state
    expect(commitRes1).toBe("stale_state");

    // Verify run status was updated to discarded with stale_state
    const { data: run1After } = await adminSupabase
      .from("analysis_runs")
      .select("status, outcome_code")
      .eq("id", run1Id)
      .single();

    expect(run1After!.status).toBe("discarded");
    expect(run1After!.outcome_code).toBe("stale_state");

    // Zero assessments written
    const { count: assessmentCount1 } = await adminSupabase
      .from("property_assessments")
      .select("id", { count: "exact", head: true })
      .eq("run_id", run1Id);

    expect(assessmentCount1).toBe(0);

    // 5. Re-running now uses the new state_version and commits successfully
    const newBaseVersion = bumpedCase!.state_version;

    const { data: run2 } = await adminSupabase
      .from("analysis_runs")
      .insert({
        case_id: testCaseId,
        base_state_version: newBaseVersion,
        status: "running",
        model: "gemini-flash-lite",
        prompt_version: "2026-10-06.1",
      })
      .select("id")
      .single();

    const run2Id = run2!.id;

    const { data: commitRes2 } = await adminSupabase.rpc("commit_analysis", {
      p_run_id: run2Id,
      p_assessments: [sampleAssessment],
    });

    expect(commitRes2).toBe("committed");

    // Run 2 is committed and assessments are written
    const { data: run2After } = await adminSupabase
      .from("analysis_runs")
      .select("status")
      .eq("id", run2Id)
      .single();

    expect(run2After!.status).toBe("committed");

    const { count: assessmentCount2 } = await adminSupabase
      .from("property_assessments")
      .select("id", { count: "exact", head: true })
      .eq("run_id", run2Id);

    expect(assessmentCount2).toBe(1);

    // Decision case status is now analyzed
    const { data: finalCase } = await adminSupabase
      .from("decision_cases")
      .select("status")
      .eq("id", testCaseId)
      .single();

    expect(finalCase!.status).toBe("analyzed");
  });
});
