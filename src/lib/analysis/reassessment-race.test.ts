import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { adminSupabase } from "@/lib/supabase/admin";
import { reassessPropertyAction } from "@/actions/analysis";
import * as auth from "@/lib/auth";

describe("Reassessment Race Condition & Atomic Commit (Acceptance 2)", () => {
  let testUserId: string;
  let testCaseId: string;
  let testPropId: string;
  let testItemId: string;
  let runId: string;

  beforeAll(async () => {
    // 1. Get or create auth user
    const {
      data: { users },
    } = await adminSupabase.auth.admin.listUsers();

    if (users && users.length > 0) {
      testUserId = users[0].id;
    } else {
      const { data: u } = await adminSupabase.auth.admin.createUser({
        email: `test-reassess-${Date.now()}@bawsala.local`,
      });
      testUserId = u!.user!.id;
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
    const { error: reqErr } = await adminSupabase.from("requirements").insert({
      case_id: testCaseId,
      max_budget_sar: 800000,
      min_bedrooms: 3,
      purchase_method: "cash",
      household_size: 4,
      hard_constraints: ["elevator_required"],
    });
    if (reqErr) throw reqErr;

    // 4. Create property
    const { data: prop } = await adminSupabase
      .from("properties")
      .insert({
        case_id: testCaseId,
        input_mode: "manual",
        title: "شقة تجربة إعادة التقييم",
        floor_no: 3,
      })
      .select()
      .single();

    testPropId = prop!.id;

    // 5. Create committed analysis run & assessment
    const { data: run } = await adminSupabase
      .from("analysis_runs")
      .insert({
        case_id: testCaseId,
        base_state_version: 1,
        status: "committed",
        model: "gemini-flash-lite",
        prompt_version: "2026-10-06.1",
        finished_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    runId = run!.id;

    await adminSupabase.from("property_assessments").insert({
      run_id: runId,
      property_id: testPropId,
      constraint_results: [
        {
          key: "elevator_required",
          labelAr: "مصعد",
          result: "unknown",
          detailAr: "غير مؤكد",
        },
      ],
      price_per_sqm: 6000,
      fit_rating: "partial",
      fit_summary: "تقييم أولي قبل المعاينة",
      strengths: ["الموقع"],
      risks: ["عدم التأكد من المصعد"],
      key_unknowns: ["المصعد"],
      visit_priority: "medium",
      visit_priority_reason: "بحاجة لمعاينة",
      evidence_fields: ["listing_price_sar"],
    });

    // 6. Create inspection item and finding
    const { data: item } = await adminSupabase
      .from("inspection_items")
      .insert({
        property_id: testPropId,
        category: "building_services",
        question_ar: "هل المصعد متوفر ويعمل؟",
        why_it_matters_ar: "الوصول للدور 3",
        how_to_check_ar: "معاينة عمل المصعد وتاريخ آخر صيانة",
        priority: "high",
        trigger_reason: "unknown_fact",
        affected_assessment_types: ["fit"],
      })
      .select()
      .single();

    testItemId = item!.id;

    await adminSupabase.from("inspection_findings").insert({
      inspection_item_id: testItemId,
      property_id: testPropId,
      result: "problem",
      note: "المصعد معطل بالكامل",
    });
  });

  afterAll(async () => {
    if (testCaseId) {
      await adminSupabase.from("decision_cases").delete().eq("id", testCaseId);
    }
  });

  it("Acceptance 2: modifying case requirements while viewing findings rejects commit_reassessment with stale_state", async () => {
    // 1. Read current state_version
    const { data: caseRow } = await adminSupabase
      .from("decision_cases")
      .select("state_version")
      .eq("id", testCaseId)
      .single();

    const staleVersion = caseRow!.state_version;

    // 2. Another tab modifies requirements -> triggers state_version increment
    await adminSupabase
      .from("requirements")
      .update({ max_budget_sar: 850000 })
      .eq("case_id", testCaseId);

    const { data: updatedCase } = await adminSupabase
      .from("decision_cases")
      .select("state_version")
      .eq("id", testCaseId)
      .single();

    expect(updatedCase!.state_version).toBeGreaterThan(staleVersion);

    // 3. Direct commit_reassessment call with staleVersion returns 'stale_state'
    const { data: outcome } = await adminSupabase.rpc("commit_reassessment", {
      p_case_id: testCaseId,
      p_property_id: testPropId,
      p_base_state_version: staleVersion,
      p_new_assessment: {
        fit_rating: "weak",
        fit_summary: "محدث",
        strengths: [],
        risks: ["المصعد معطل"],
        key_unknowns: [],
        visit_priority: "low",
        visit_priority_reason: "معطل",
        constraint_results: [],
        evidence_fields: [],
        price_per_sqm: 6000,
      },
      p_diff: {
        previousFitRating: "partial",
        newFitRating: "weak",
        previousVisitPriority: "medium",
        newVisitPriority: "low",
        addedRisks: ["المصعد معطل"],
        resolvedUnknowns: [],
        explanationAr: "تغير التوافق",
      },
    });

    expect(outcome).toBe("stale_state");
  });

  it("commits successfully when base_state_version matches, updating assessment and recording in reassessment_logs", async () => {
    // Mock requireCase to allow testUserId
    const { data: currentCase } = await adminSupabase
      .from("decision_cases")
      .select("*")
      .eq("id", testCaseId)
      .single();

    vi.spyOn(auth, "requireCase").mockResolvedValue(currentCase!);

    // Call reassessPropertyAction
    const result = await reassessPropertyAction(testCaseId, testPropId, adminSupabase);

    expect(result.success).toBe(true);
    expect(result.diff).toBeDefined();
    expect(result.diff?.newFitRating).toBe("weak");
    expect(result.diff?.addedRisks.length).toBeGreaterThan(0);

    // Verify database record in reassessment_logs
    const { data: logs } = await adminSupabase
      .from("reassessment_logs")
      .select("*")
      .eq("case_id", testCaseId)
      .eq("property_id", testPropId);

    expect(logs?.length).toBeGreaterThanOrEqual(1);
    expect(logs![0].new_fit_rating).toBe("weak");
    expect(logs![0].previous_fit_rating).toBe("partial");

    // Verify property_assessments was updated
    const { data: updatedAsmt } = await adminSupabase
      .from("property_assessments")
      .select("*")
      .eq("run_id", runId)
      .eq("property_id", testPropId)
      .single();

    expect(updatedAsmt?.fit_rating).toBe("weak");
    expect(updatedAsmt?.visit_priority).toBe("low");
  });
});
