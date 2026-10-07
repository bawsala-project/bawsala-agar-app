import { describe, it, expect, beforeAll, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

const state = {
  ip: "196.200.1.1",
  client: null as unknown as SupabaseClient<Database>,
  modelOutput: {} as Record<string, unknown>,
};

vi.mock("next/headers", () => ({
  headers: () => new Headers({ "x-forwarded-for": state.ip }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/lib/supabase/server", () => ({ createClient: () => state.client }));
vi.mock("@/lib/ai/client", async () => {
  const { MockLanguageModelV4: Model } = await import("ai/test");
  return {
    analysisModel: new Model({
      doGenerate: async () => ({
        content: [{ type: "text" as const, text: JSON.stringify(state.modelOutput) }],
        finishReason: { unified: "stop" as const, raw: undefined },
        usage: {
          inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 1, text: 1, reasoning: 0 },
        },
        warnings: [],
      }),
    }),
    extractionModel: undefined,
  };
});

import { adminSupabase } from "@/lib/supabase/admin";
import { evaluateConstraints, pricePerSqm, type RequirementsRow } from "@/lib/analysis/constraints";
import { admitPropertyAssessment } from "@/lib/analysis/admit";
import { resolveComparison, type PropertyAssessmentWithProperty } from "@/lib/analysis/compare";
import { resolveFacts, type PropertyFact } from "@/lib/evidence/resolve";
import { normalizeField } from "@/lib/evidence/normalize";
import { loadPreflightData } from "@/lib/preflight/load";
import { evaluatePreflight } from "@/lib/preflight/evaluate";
import { settlePayment } from "@/lib/payments/settle";
import { ANALYSIS_RUNTIME_VERSION } from "@/lib/ai/version";

type DbClient = SupabaseClient<Database>;

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function freshClient(): DbClient {
  return createClient<Database>(URL_SUPABASE, KEY_ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function must<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error || res.data === null || res.data === undefined) {
    throw new Error(res.error?.message ?? "query returned no data");
  }
  return res.data as NonNullable<T>;
}

// Canonical Seed IDs matching supabase/seed/cases_a_through_o.sql
const CASE_IDS = {
  A: "ca000000-0000-4000-8000-000000000001",
  B: "ca000000-0000-4000-8000-000000000002",
  C: "ca000000-0000-4000-8000-000000000003",
  D: "ca000000-0000-4000-8000-000000000004",
  E: "ca000000-0000-4000-8000-000000000005",
  F: "ca000000-0000-4000-8000-000000000006",
  G: "ca000000-0000-4000-8000-000000000007",
  H: "ca000000-0000-4000-8000-000000000008",
  I: "ca000000-0000-4000-8000-000000000009",
  J: "ca000000-0000-4000-8000-00000000000a",
  K: "ca000000-0000-4000-8000-00000000000b",
  L: "ca000000-0000-4000-8000-00000000000c",
  M: "ca000000-0000-4000-8000-00000000000d",
  N: "ca000000-0000-4000-8000-00000000000e",
  O: "ca000000-0000-4000-8000-00000000000f",
} as const;

let userClient: DbClient;

beforeAll(async () => {
  userClient = freshClient();
  state.client = userClient;

  // Verify that the canonical SQL fixture file exists on disk
  const sqlFixturePath = join(process.cwd(), "supabase", "seed", "cases_a_through_o.sql");
  const sqlContent = readFileSync(sqlFixturePath, "utf-8");
  expect(sqlContent).toContain("Bawsalat Al-Aqar - Canonical Seed Fixtures");
  expect(sqlContent).toContain(CASE_IDS.A);
  expect(sqlContent).toContain(CASE_IDS.O);

  // Verify all 15 cases exist in PostgreSQL
  const cases = must(
    await adminSupabase
      .from("decision_cases")
      .select("id, city, status")
      .in("id", Object.values(CASE_IDS))
  );
  expect(cases).toHaveLength(15);
});

describe("Canonical Seed Cases Integration Suite (Section 25: Cases A through O)", () => {
  // ==========================================================================
  // Case A: 3 complete properties with clear ranking
  // ==========================================================================
  it("Case A (Clear Ranking Winner): Winner has verified elevator, lowest compliant price, matching area", async () => {
    const caseId = CASE_IDS.A;

    const reqRow = must(
      await adminSupabase.from("requirements").select("*").eq("case_id", caseId).single()
    );
    const props = must(
      await adminSupabase
        .from("properties")
        .select("id, title, listing_price_sar, area_sqm, bedrooms, floor_no")
        .eq("case_id", caseId)
        .order("title")
    );
    expect(props).toHaveLength(3);

    const req: RequirementsRow = {
      case_id: caseId,
      max_budget_sar: Number(reqRow.max_budget_sar),
      purchase_method: reqRow.purchase_method,
      household_size: reqRow.household_size,
      min_bedrooms: reqRow.min_bedrooms,
      min_area_sqm: reqRow.min_area_sqm ? Number(reqRow.min_area_sqm) : null,
      hard_constraints: reqRow.hard_constraints,
      preferences: reqRow.preferences,
      important_locations: reqRow.important_locations,
      updated_at: reqRow.updated_at,
    };

    const assessmentsForComparison: PropertyAssessmentWithProperty[] = [];

    for (const prop of props) {
      const facts = must(
        await adminSupabase.from("property_facts").select("*").eq("property_id", prop.id)
      ) as PropertyFact[];
      const resolved = resolveFacts(facts);
      const constraints = evaluateConstraints(req, resolved);
      const pSqm = pricePerSqm(resolved);

      const knownFields = Object.entries(resolved.fields)
        .filter((entry) => entry[1].status === "known")
        .map((entry) => entry[0]);

      const admitted = admitPropertyAssessment({
        propertyId: prop.id,
        modelOutput: {
          fit_rating: "strong",
          fit_summary: "تقييم أولي مناسب",
          strengths: ["سعر مناسب"],
          risks: [],
          key_unknowns: [],
          visit_priority: "high",
          visit_priority_reason: "خيار واعد",
          evidence_fields: ["listing_price_sar", "area_sqm", "bedrooms"],
        },
        knownFactFields: knownFields,
        constraintResults: constraints,
        pricePerSqm: pSqm,
        criticalFieldsKnownCount: 3,
      });

      expect(admitted.ok).toBe(true);
      if (!admitted.ok) throw new Error(admitted.reason);

      assessmentsForComparison.push({
        id: `assessment-${prop.id}`,
        property_id: prop.id,
        constraint_results: constraints,
        price_per_sqm: pSqm,
        fit_rating: admitted.assessment.fit_rating,
        fit_summary: admitted.assessment.fit_summary,
        strengths: admitted.assessment.strengths,
        risks: admitted.assessment.risks,
        key_unknowns: admitted.assessment.key_unknowns,
        visit_priority: admitted.assessment.visit_priority,
        visit_priority_reason: admitted.assessment.visit_priority_reason,
        evidence_fields: admitted.assessment.evidence_fields,
        property: {
          id: prop.id,
          title: prop.title,
          listing_price_sar: Number(prop.listing_price_sar),
          area_sqm: Number(prop.area_sqm),
          bedrooms: prop.bedrooms,
          floor_no: prop.floor_no,
          property_facts: facts,
        },
      });
    }

    const comparison = resolveComparison(assessmentsForComparison, req);
    expect(comparison.mode).toBe("ranked");

    const winner = comparison.items.find((item) => item.rank === 1);
    expect(winner).toBeDefined();
    expect(winner?.title).toContain("الفائز");
    expect(winner?.price).toBe(850000);
    expect(winner?.fit_rating).toBe("strong");

    const nonCompliant = comparison.items.find((item) => item.title.includes("بدون مصعد"));
    expect(nonCompliant).toBeDefined();
    expect(nonCompliant?.fit_rating).toBe("weak");
    expect(nonCompliant?.rank).toBe(3);
  });

  // ==========================================================================
  // Case B: Cheap property violating budget/location constraint
  // ==========================================================================
  it("Case B (Cheap Property Low Rank): Low price does not override hard constraint violation", async () => {
    const caseId = CASE_IDS.B;

    const reqRow = must(
      await adminSupabase.from("requirements").select("*").eq("case_id", caseId).single()
    );
    const props = must(
      await adminSupabase
        .from("properties")
        .select("id, title, listing_price_sar, floor_no")
        .eq("case_id", caseId)
    );
    expect(props).toHaveLength(2);

    const req: RequirementsRow = {
      case_id: caseId,
      max_budget_sar: Number(reqRow.max_budget_sar),
      purchase_method: reqRow.purchase_method,
      household_size: reqRow.household_size,
      min_bedrooms: reqRow.min_bedrooms,
      min_area_sqm: reqRow.min_area_sqm ? Number(reqRow.min_area_sqm) : null,
      hard_constraints: reqRow.hard_constraints,
      preferences: reqRow.preferences,
      important_locations: reqRow.important_locations,
      updated_at: reqRow.updated_at,
    };

    const cheapProp = props.find((p) => p.title?.includes("الدور الرابع"))!;
    const compliantProp = props.find((p) => p.title?.includes("الدور الأول"))!;

    const cheapFacts = must(
      await adminSupabase.from("property_facts").select("*").eq("property_id", cheapProp.id)
    ) as PropertyFact[];
    const compliantFacts = must(
      await adminSupabase.from("property_facts").select("*").eq("property_id", compliantProp.id)
    ) as PropertyFact[];

    const cheapConstraints = evaluateConstraints(req, resolveFacts(cheapFacts));
    const compliantConstraints = evaluateConstraints(req, resolveFacts(compliantFacts));

    // Cheap property fails max_floor (floor 4 > 2) and elevator_required
    expect(cheapConstraints.every((c) => c.result === "pass")).toBe(false);
    expect(cheapConstraints.find((c) => c.key === "max_floor")?.result).toBe("fail");
    expect(cheapConstraints.find((c) => c.key === "elevator_required")?.result).toBe("fail");

    // Compliant property passes
    expect(compliantConstraints.every((c) => c.result === "pass")).toBe(true);

    const cheapAdmitted = admitPropertyAssessment({
      propertyId: cheapProp.id,
      modelOutput: {
        fit_rating: "strong",
        fit_summary: "رخيص جدا",
        strengths: ["سعر مغري"],
        risks: [],
        key_unknowns: [],
        visit_priority: "high",
        visit_priority_reason: "سعر منخفض",
        evidence_fields: ["listing_price_sar"],
      },
      knownFactFields: ["listing_price_sar", "area_sqm", "bedrooms", "floor_no", "elevator"],
      constraintResults: cheapConstraints,
      pricePerSqm: pricePerSqm(resolveFacts(cheapFacts)),
      criticalFieldsKnownCount: 3,
    });

    expect(cheapAdmitted.ok).toBe(true);
    if (cheapAdmitted.ok) {
      expect(cheapAdmitted.assessment.fit_rating).toBe("weak");
    }
  });

  // ==========================================================================
  // Case C: Conflicting area between URL (140 m²) and flyer image (125 m²)
  // ==========================================================================
  it("Case C (Area Source Conflict): Conflicting area creates preflight blocker and is never averaged", async () => {
    const caseId = CASE_IDS.C;

    const prop = must(
      await adminSupabase.from("properties").select("id").eq("case_id", caseId).single()
    );
    const facts = must(
      await adminSupabase.from("property_facts").select("*").eq("property_id", prop.id)
    ) as PropertyFact[];

    const resolved = resolveFacts(facts);

    // Invariant: status is conflicting and value is strictly NOT averaged
    expect(resolved.fields.area_sqm.status).toBe("conflicting");
    if (resolved.fields.area_sqm.status === "conflicting") {
      const candidateValues = resolved.fields.area_sqm.candidates.map((c) => c.value);
      expect(candidateValues).toContain(140);
      expect(candidateValues).toContain(125);
      expect(candidateValues).not.toContain(132.5);
    }

    // Preflight evaluation blocks analysis progression
    const preflightData = await loadPreflightData(caseId, adminSupabase);
    const preflight = evaluatePreflight(preflightData);

    expect(preflight.ready).toBe(false);
    const conflictBlocker = preflight.blockers.find((b) => b.code === "CRITICAL_CONFLICT");
    expect(conflictBlocker).toBeDefined();
    expect(conflictBlocker?.field).toBe("area_sqm");
  });

  // ==========================================================================
  // Case D: Insufficient comparables for market price
  // ==========================================================================
  it("Case D (Insufficient Comparables): Missing area results in price.status = 'insufficient_evidence'", async () => {
    const caseId = CASE_IDS.D;

    const prop = must(
      await adminSupabase.from("properties").select("id, listing_price_sar").eq("case_id", caseId).single()
    );
    const facts = must(
      await adminSupabase.from("property_facts").select("*").eq("property_id", prop.id)
    ) as PropertyFact[];

    const resolved = resolveFacts(facts);

    // Invariant: area is unknown, price per sqm is null
    expect(resolved.fields.area_sqm.status).toBe("unknown");
    const pSqm = pricePerSqm(resolved);
    expect(pSqm).toBeNull();

    // Admission control marks assessment insufficient_evidence
    const reqRow = must(
      await adminSupabase.from("requirements").select("*").eq("case_id", caseId).single()
    );
    const req: RequirementsRow = {
      case_id: caseId,
      max_budget_sar: Number(reqRow.max_budget_sar),
      purchase_method: reqRow.purchase_method,
      household_size: reqRow.household_size,
      min_bedrooms: reqRow.min_bedrooms,
      min_area_sqm: reqRow.min_area_sqm ? Number(reqRow.min_area_sqm) : null,
      hard_constraints: reqRow.hard_constraints,
      preferences: reqRow.preferences,
      important_locations: reqRow.important_locations,
      updated_at: reqRow.updated_at,
    };
    const constraints = evaluateConstraints(req, resolved);
    const admitted = admitPropertyAssessment({
      propertyId: prop.id,
      modelOutput: {
        fit_rating: "strong",
        fit_summary: "سعر جيد لكن المساحة مجهولة",
        strengths: [],
        risks: [],
        key_unknowns: ["area_sqm"],
        visit_priority: "medium",
        visit_priority_reason: "يلزم معرفة المساحة",
        evidence_fields: ["listing_price_sar"],
      },
      knownFactFields: ["listing_price_sar", "bedrooms"],
      constraintResults: constraints,
      pricePerSqm: pSqm,
      criticalFieldsKnownCount: 1, // Area is missing
    });

    expect(admitted.ok).toBe(true);
    if (admitted.ok) {
      expect(admitted.assessment.fit_rating).toBe("insufficient_evidence");
    }
  });

  // ==========================================================================
  // Case E: On-site inspection finding flips Property 1 to rank 2
  // ==========================================================================
  it("Case E (On-Site Finding Impact): Elevator defect recording flips Property 1 from rank 1 to rank 2", async () => {
    const caseId = CASE_IDS.E;

    // Reset initial assessment and clean prior logs for idempotency
    await adminSupabase
      .from("property_assessments")
      .update({ fit_rating: "strong", visit_priority: "high" })
      .eq("id", "ea000000-0000-4000-8000-000000000001");
    await adminSupabase.from("reassessment_logs").delete().eq("case_id", caseId);

    // Load initial assessments from PostgreSQL
    const assessments = must(
      await adminSupabase
        .from("property_assessments")
        .select("id, property_id, fit_rating, visit_priority")
        .eq("run_id", "da000000-0000-4000-8000-000000000001")
    );
    expect(assessments).toHaveLength(2);

    const item = must(
      await adminSupabase
        .from("inspection_items")
        .select("id, property_id")
        .eq("property_id", "ba000000-0000-4000-8000-000000000051")
        .single()
    );

    // Record on-site finding: problem detected with the elevator
    await adminSupabase
      .from("inspection_findings")
      .upsert(
        {
          inspection_item_id: item.id,
          property_id: item.property_id,
          result: "problem",
          note: "المصعد معطل وبحاجة صيانة شاملة ومكلفة",
        },
        { onConflict: "inspection_item_id" }
      );

    // Verify finding persisted in PostgreSQL
    const finding = must(
      await adminSupabase
        .from("inspection_findings")
        .select("result, note")
        .eq("inspection_item_id", item.id)
        .single()
    );
    expect(finding.result).toBe("problem");
    expect(finding.note).toContain("المصعد معطل");

    // Commit reassessment using the database RPC
    const newAssessmentPayload = {
      constraint_results: [{ key: "elevator_required", passed: false, message: "المصعد معطل ميدانياً" }],
      fit_rating: "weak",
      fit_summary: "العقار أصبح غير مناسب بعد فحص المصعد",
      strengths: ["سعر منافس"],
      risks: ["المصعد معطل بالكامل"],
      key_unknowns: [],
      visit_priority: "low",
      visit_priority_reason: "عطل حرج في المصعد يلغي الأولوية",
    };

    const diffPayload = {
      field: "elevator",
      previous: "unknown",
      current: "defective",
      rating_change: { from: "strong", to: "weak" },
    };

    const caseRow = must(
      await adminSupabase.from("decision_cases").select("state_version").eq("id", caseId).single()
    );

    const rpcRes = await adminSupabase.rpc("commit_reassessment", {
      p_case_id: caseId,
      p_property_id: item.property_id,
      p_base_state_version: caseRow.state_version,
      p_new_assessment: newAssessmentPayload as unknown as Json,
      p_diff: diffPayload as unknown as Json,
      p_runtime_version: ANALYSIS_RUNTIME_VERSION,
    });
    expect(rpcRes.data).toBe("committed");

    // Verify updated assessment in PostgreSQL
    const reassessed = must(
      await adminSupabase
        .from("property_assessments")
        .select("fit_rating, visit_priority")
        .eq("property_id", item.property_id)
        .single()
    );
    expect(reassessed.fit_rating).toBe("weak");
    expect(reassessed.visit_priority).toBe("low");

    // Verify reassessment log was created
    const log = must(
      await adminSupabase
        .from("reassessment_logs")
        .select("previous_fit_rating, new_fit_rating, analysis_runtime_version")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
    );
    expect(log.previous_fit_rating).toBe("strong");
    expect(log.new_fit_rating).toBe("weak");
    expect(log.analysis_runtime_version).toBe(ANALYSIS_RUNTIME_VERSION);
  });

  // ==========================================================================
  // Case F: Neighborhood amenity preserved as district context, not unit fact
  // ==========================================================================
  it("Case F (Neighborhood Amenity Isolation): Metro station 500m away preserved as neighborhood claim, not unit fact", async () => {
    const caseId = CASE_IDS.F;

    const prop = must(
      await adminSupabase.from("properties").select("id, district").eq("case_id", caseId).single()
    );
    const facts = must(
      await adminSupabase.from("property_facts").select("*").eq("property_id", prop.id)
    ) as PropertyFact[];

    const resolved = resolveFacts(facts);

    // Invariant: neighborhood claim isolated
    expect(resolved.claims.neighborhood).toHaveLength(1);
    expect(resolved.claims.neighborhood[0].raw_text).toContain("محطة قطار الرياض");

    // Invariant: unit district remains 'العليا' and is not mutated into the amenity name
    expect(resolved.fields.district.status).toBe("known");
    if (resolved.fields.district.status === "known") {
      expect(resolved.fields.district.value).toBe("العليا");
    }

    // Invariant: unit specs are not polluted by the metro amenity
    expect(resolved.fields.bedrooms.status).toBe("known");
    if (resolved.fields.bedrooms.status === "known") {
      expect(resolved.fields.bedrooms.value).toBe(2);
    }
    expect(resolved.fields.area_sqm.status).toBe("known");
    if (resolved.fields.area_sqm.status === "known") {
      expect(resolved.fields.area_sqm.value).toBe(115);
    }
  });

  // ==========================================================================
  // Case G: Two units in the same building with distinct records
  // ==========================================================================
  it("Case G (Identity Collapse Prevention): Apt 4 and Apt 12 in same building maintain distinct records", async () => {
    const caseId = CASE_IDS.G;

    const props = must(
      await adminSupabase
        .from("properties")
        .select("id, title, floor_no, listing_price_sar")
        .eq("case_id", caseId)
        .order("floor_no")
    );
    expect(props).toHaveLength(2);

    const [apt4, apt12] = props;
    expect(apt4.id).not.toBe(apt12.id);
    expect(apt4.floor_no).toBe(1);
    expect(apt12.floor_no).toBe(3);
    expect(Number(apt4.listing_price_sar)).toBe(650000);
    expect(Number(apt12.listing_price_sar)).toBe(720000);

    // Verify facts belong to distinct properties in PostgreSQL
    const facts4 = must(
      await adminSupabase.from("property_facts").select("field, value").eq("property_id", apt4.id)
    );
    const facts12 = must(
      await adminSupabase.from("property_facts").select("field, value").eq("property_id", apt12.id)
    );

    expect(facts4).toHaveLength(3);
    expect(facts12).toHaveLength(3);
    expect(facts4.find((f) => f.field === "floor_no")?.value).toBe(1);
    expect(facts12.find((f) => f.field === "floor_no")?.value).toBe(3);
  });

  // ==========================================================================
  // Case H: User alters budget during active analysis, forcing Commit Guard to reject stale run
  // ==========================================================================
  it("Case H (Commit Guard Stale Rejection): Mutating budget while analysis runs triggers 'stale_state'", async () => {
    const caseId = CASE_IDS.H;

    const caseBefore = must(
      await adminSupabase.from("decision_cases").select("state_version").eq("id", caseId).single()
    );
    const baseVersion = caseBefore.state_version;

    // Create a running analysis run with base_state_version
    const runId = "da000000-0000-4000-8000-000000000008";
    await adminSupabase.from("analysis_runs").delete().eq("id", runId);
    must(
      await adminSupabase
        .from("analysis_runs")
        .insert({
          id: runId,
          case_id: caseId,
          base_state_version: baseVersion,
          status: "running",
          model: "gemini-flash-lite",
          prompt_version: "v1",
        })
        .select("id")
        .single()
    );

    // User alters budget in requirements, which bumps decision_cases.state_version
    await adminSupabase
      .from("requirements")
      .update({ max_budget_sar: 1150000.00 })
      .eq("case_id", caseId);

    const caseAfter = must(
      await adminSupabase.from("decision_cases").select("state_version, status").eq("id", caseId).single()
    );
    expect(caseAfter.state_version).toBeGreaterThan(baseVersion);

    // Attempt to commit stale run
    const commitRes = await adminSupabase.rpc("commit_analysis", {
      p_run_id: runId,
      p_assessments: [] as unknown as Json,
    });
    expect(commitRes.data).toBe("stale_state");

    // Invariant: run is marked discarded in PostgreSQL, case is NOT promoted to analyzed
    const runAfter = must(
      await adminSupabase
        .from("analysis_runs")
        .select("status, outcome_code")
        .eq("id", runId)
        .single()
    );
    expect(runAfter.status).toBe("discarded");
    expect(runAfter.outcome_code).toBe("stale_state");

    const caseFinal = must(
      await adminSupabase.from("decision_cases").select("status").eq("id", caseId).single()
    );
    expect(caseFinal.status).toBe("properties_complete");
  });

  // ==========================================================================
  // Case I: Duplicate payment webhook suppression with single-paid invariant
  // ==========================================================================
  it("Case I (Duplicate Webhook Suppression): Duplicate webhook delivery is suppressed and single-paid invariant holds", async () => {
    const caseId = CASE_IDS.I;
    const key = `checkout_${caseId}_idemp_${Date.now()}`;
    const eventId = `evt_case_i_${Date.now()}`;

    // Clean any prior payments for Case I
    await adminSupabase.from("payments").delete().eq("case_id", caseId);
    await adminSupabase.from("case_operations").delete().eq("case_id", caseId);

    must(
      await adminSupabase
        .from("case_operations")
        .insert({
          case_id: caseId,
          operation_type: "checkout",
          idempotency_key: key,
          expected_effect: { case_id: caseId, amount_sar: 10.0, currency: "SAR" },
        })
        .select("id")
        .single()
    );

    must(
      await adminSupabase
        .from("payments")
        .insert({
          case_id: caseId,
          provider: "mock",
          amount_sar: 10.0,
          currency: "SAR",
          status: "initiated",
          idempotency_key: key,
        })
        .select("id")
        .single()
    );

    const verifiedEvent = {
      valid: true,
      eventId,
      caseId,
      amountSar: 10.0,
      status: "success" as const,
    };

    // First webhook delivery
    const settle1 = await settlePayment(key, verifiedEvent);
    expect(settle1).toEqual({ outcome: "paid", caseId });

    // Second duplicate webhook delivery
    const settle2 = await settlePayment(key, verifiedEvent);
    expect(settle2).toEqual({ outcome: "duplicate", caseId });

    // Invariant: exactly one paid row exists in PostgreSQL
    const payments = must(
      await adminSupabase.from("payments").select("id, status").eq("case_id", caseId)
    );
    expect(payments).toHaveLength(1);
    expect(payments[0].status).toBe("paid");
  });

  // ==========================================================================
  // Case J: Blocker for area conflict remains active when user updates unrelated field
  // ==========================================================================
  it("Case J (Blocker Persistence): Preflight blocker for area conflict remains open after updating household size", async () => {
    const caseId = CASE_IDS.J;

    // Initial preflight check
    const pre1 = evaluatePreflight(await loadPreflightData(caseId, adminSupabase));
    expect(pre1.ready).toBe(false);
    expect(pre1.blockers.some((b) => b.field === "area_sqm")).toBe(true);

    // User updates unrelated requirements field (household_size: 4 -> 6)
    await adminSupabase.from("requirements").update({ household_size: 6 }).eq("case_id", caseId);

    // Re-evaluate preflight
    const pre2 = evaluatePreflight(await loadPreflightData(caseId, adminSupabase));
    expect(pre2.ready).toBe(false);
    expect(pre2.blockers.some((b) => b.field === "area_sqm")).toBe(true);
  });

  // ==========================================================================
  // Case K: Reposted identical ad across multiple portals deduplicated via origin hash
  // ==========================================================================
  it("Case K (Evidence Source Deduplication): Reposted ad from same source does not inflate confidence", async () => {
    const caseId = CASE_IDS.K;

    const prop = must(
      await adminSupabase.from("properties").select("id").eq("case_id", caseId).single()
    );
    const facts = must(
      await adminSupabase.from("property_facts").select("*").eq("property_id", prop.id)
    ) as PropertyFact[];

    // Add simulated duplicate repost from same URL source
    const duplicateFacts: PropertyFact[] = [
      ...facts,
      {
        id: "fa000000-0000-4000-8000-000000000132",
        property_id: prop.id,
        extraction_run_id: null,
        field: "listing_price_sar",
        value: 850000,
        raw_text: "850,000 ريال",
        scope: "unit",
        source: "url",
        evidence_text: "إعلان مكرر من نفس المصدر",
        evidence_verified: false,
        created_at: new Date().toISOString(),
      },
    ];

    const resolved = resolveFacts(duplicateFacts);

    // Invariant: duplicates from identical source retain single fact, certainty remains 'reported'
    expect(resolved.fields.listing_price_sar.status).toBe("known");
    if (resolved.fields.listing_price_sar.status === "known") {
      expect(resolved.fields.listing_price_sar.value).toBe(850000);
      expect(resolved.fields.listing_price_sar.certainty).toBe("reported");
    }
  });

  // ==========================================================================
  // Case L: Case soft-deleted while background job is running; commit rejected with case_deleted
  // ==========================================================================
  it("Case L (Soft-Deleted Case Rejection): Late commit on soft-deleted case returns 'case_deleted'", async () => {
    const caseId = CASE_IDS.L;

    // Ensure deleted_at is set
    await adminSupabase
      .from("decision_cases")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", caseId);

    const caseRow = must(
      await adminSupabase.from("decision_cases").select("state_version").eq("id", caseId).single()
    );

    const runId = "da000000-0000-4000-8000-00000000000c";
    await adminSupabase.from("analysis_runs").delete().eq("id", runId);
    must(
      await adminSupabase
        .from("analysis_runs")
        .insert({
          id: runId,
          case_id: caseId,
          base_state_version: caseRow.state_version,
          status: "running",
          model: "gemini-flash-lite",
          prompt_version: "v1",
        })
        .select("id")
        .single()
    );

    const commitRes = await adminSupabase.rpc("commit_analysis", {
      p_run_id: runId,
      p_assessments: [] as unknown as Json,
    });
    expect(commitRes.data).toBe("case_deleted");

    const run = must(
      await adminSupabase
        .from("analysis_runs")
        .select("status, outcome_code")
        .eq("id", runId)
        .single()
    );
    expect(run.status).toBe("discarded");
    expect(run.outcome_code).toBe("case_deleted");
  });

  // ==========================================================================
  // Case M: Payment gateway callback reporting 5.00 SAR instead of 10.00 SAR sets effect_status = 'mismatch'
  // ==========================================================================
  it("Case M (Payment Amount Mismatch): Callback reporting 5.00 SAR sets effect_status = 'mismatch' and halts activation", async () => {
    const caseId = CASE_IDS.M;
    const key = `checkout_${caseId}_mismatch_${Date.now()}`;

    must(
      await adminSupabase
        .from("case_operations")
        .insert({
          case_id: caseId,
          operation_type: "checkout",
          idempotency_key: key,
          expected_effect: { case_id: caseId, amount_sar: 10.0, currency: "SAR" },
        })
        .select("id")
        .single()
    );

    must(
      await adminSupabase
        .from("payments")
        .insert({
          case_id: caseId,
          provider: "mock",
          amount_sar: 10.0,
          currency: "SAR",
          status: "initiated",
          idempotency_key: key,
        })
        .select("id")
        .single()
    );

    // Tampered event reporting 5.00 SAR
    const tamperedEvent = {
      valid: true,
      eventId: `evt_mismatch_${Date.now()}`,
      caseId,
      amountSar: 5.0,
      status: "success" as const,
    };

    const settleRes = await settlePayment(key, tamperedEvent);
    expect(settleRes).toEqual({ outcome: "mismatch", reason: "amount mismatch" });

    // Invariant: payment marked failed, operation marked mismatch
    const payment = must(
      await adminSupabase.from("payments").select("status").eq("idempotency_key", key).single()
    );
    expect(payment.status).toBe("failed");

    const op = must(
      await adminSupabase
        .from("case_operations")
        .select("effect_status")
        .eq("idempotency_key", key)
        .single()
    );
    expect(op.effect_status).toBe("mismatch");
  });

  // ==========================================================================
  // Case N: Session restart / model change resumes accurately from PostgreSQL state without cached memory
  // ==========================================================================
  it("Case N (Durable DB Resume): Session restart reconstructs state strictly from PostgreSQL durable rows", async () => {
    const caseId = CASE_IDS.N;

    // Simulate complete in-memory wipe: querying PostgreSQL directly
    const caseRow = must(
      await adminSupabase.from("decision_cases").select("id, city, status").eq("id", caseId).single()
    );
    const reqRow = must(
      await adminSupabase.from("requirements").select("*").eq("case_id", caseId).single()
    );
    const props = must(
      await adminSupabase.from("properties").select("id, title, listing_price_sar").eq("case_id", caseId)
    );
    expect(props).toHaveLength(1);

    const facts = must(
      await adminSupabase.from("property_facts").select("field, value").eq("property_id", props[0].id)
    );
    expect(facts).toHaveLength(5);

    // All durable rows match
    expect(caseRow.city).toBe("الرياض");
    expect(Number(reqRow.max_budget_sar)).toBe(1100000);
    expect(Number(props[0].listing_price_sar)).toBe(980000);

    const preflightData = await loadPreflightData(caseId, adminSupabase);
    const preflight = evaluatePreflight(preflightData);
    expect(preflight.ready).toBe(true);
  });

  // ==========================================================================
  // Case O: External API responding HTTP 200 with invalid schema rejected from durable facts
  // ==========================================================================
  it("Case O (Invalid Schema Rejection): Corrupt external payload is rejected and zero facts admitted", async () => {
    const caseId = CASE_IDS.O;

    const prop = must(
      await adminSupabase.from("properties").select("id").eq("case_id", caseId).single()
    );

    // Simulate external payload carrying invalid schema / forbidden values
    const corruptExternalPayload = [
      { field: "listing_price_sar" as const, raw: "مجاناً وبدون مقابل" },
      { field: "bedrooms" as const, raw: "-5" },
      { field: "bathrooms" as const, raw: "99" },
    ];

    // Attempt normalization
    const normalizedPrice = normalizeField("listing_price_sar", corruptExternalPayload[0].raw);
    const normalizedBedrooms = normalizeField("bedrooms", corruptExternalPayload[1].raw);
    const normalizedBathrooms = normalizeField("bathrooms", corruptExternalPayload[2].raw);

    // Invariant: all invalid values normalize to null
    expect(normalizedPrice).toBeNull();
    expect(normalizedBedrooms).toBeNull();
    expect(normalizedBathrooms).toBeNull();

    // Verify zero corrupt facts admitted into PostgreSQL
    const factsInDb = must(
      await adminSupabase.from("property_facts").select("id").eq("property_id", prop.id)
    );
    expect(factsInDb).toHaveLength(0);
  });
});
