import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { MockLanguageModelV4 } from "ai/test";
import type { Database, Json, Tables } from "@/types/database";

const state = vi.hoisted(() => ({
  client: null as unknown,
  ip: "203.0.113.77",
  modelMode: "ok" as "ok" | "throw",
  modelOutput: {} as Record<string, unknown>,
  lastPrompt: "",
}));

const fetchListingMock = vi.hoisted(() =>
  vi.fn(async () => ({ ok: false as const, code: "fetch_failed" }))
);

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("next/headers", () => ({
  headers: () => new Headers({ "x-forwarded-for": state.ip }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/lib/supabase/server", () => ({ createClient: () => state.client }));
vi.mock("@/lib/extraction/fetch-listing", () => ({ fetchListing: fetchListingMock }));
vi.mock("@/lib/ai/client", async () => {
  const { MockLanguageModelV4: Model } = await import("ai/test");
  return {
    analysisModel: new Model({
      doGenerate: async (options) => {
        state.lastPrompt = JSON.stringify(options.prompt);
        if (state.modelMode === "throw") {
          throw new Error("simulated model timeout");
        }
        return {
          content: [{ type: "text" as const, text: JSON.stringify(state.modelOutput) }],
          finishReason: { unified: "stop" as const, raw: undefined },
          usage: {
            inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
            outputTokens: { total: 1, text: 1, reasoning: 0 },
          },
          warnings: [],
        };
      },
    }),
    extractionModel: undefined,
  };
});

import { adminSupabase } from "@/lib/supabase/admin";
import { requireCase } from "@/lib/auth";
import { addProperty } from "@/actions/properties";
import { saveRequirements } from "@/actions/requirements";
import { startAnalysis } from "@/actions/analysis";
import { evaluateConstraints, pricePerSqm, type RequirementsRow } from "@/lib/analysis/constraints";
import { admitPropertyAssessment, type AdmittedPropertyAssessment } from "@/lib/analysis/admit";
import { resolveComparison, type PropertyAssessmentWithProperty } from "@/lib/analysis/compare";
import { resolveFacts, type PropertyFact, type ResolveFactsResult } from "@/lib/evidence/resolve";
import { runExtraction } from "@/lib/extraction/run-extraction";
import { loadPreflightData } from "@/lib/preflight/load";
import { evaluatePreflight } from "@/lib/preflight/evaluate";
import { loadDashboardCases } from "@/lib/dashboard/cases";
import { resetRateLimits } from "@/lib/security/rate-limit";
import { buildAIAnalysisPayload } from "@/lib/security/allowlists";
import { buildAnalysisPrompt, type ModelPropertyAssessment } from "@/lib/ai/prompts/analysis";
import { ANALYSIS_RUNTIME_VERSION } from "@/lib/ai/version";

type DbClient = SupabaseClient<Database>;

const stamp = Date.now();
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

function redirectTarget(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  expect(message.startsWith("REDIRECT:")).toBe(true);
  return message.slice("REDIRECT:".length);
}

async function rejection(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => null,
    (e: unknown) => e
  );
}

let guestA: DbClient;
let guestAId = "";
let guestASession: Session;
let guestB: DbClient;
let guestBId = "";
const caseIds: string[] = [];
const storagePaths: string[] = [];

async function createCase(ownerId: string, status = "properties_complete"): Promise<string> {
  const row = must(
    await adminSupabase
      .from("decision_cases")
      .insert({ city: "الرياض", owner_id: ownerId, status })
      .select("id")
      .single()
  );
  caseIds.push(row.id);
  return row.id;
}

interface RequirementsSeed {
  max_budget_sar: number;
  min_bedrooms?: number;
  min_area_sqm?: number | null;
  hard_constraints?: Json;
  preferences?: Json;
  important_locations?: Json;
}

async function seedRequirements(caseId: string, seed: RequirementsSeed): Promise<RequirementsRow> {
  must(
    await adminSupabase
      .from("requirements")
      .insert({
        case_id: caseId,
        max_budget_sar: seed.max_budget_sar,
        purchase_method: "cash",
        household_size: 4,
        min_bedrooms: seed.min_bedrooms ?? 3,
        min_area_sqm: seed.min_area_sqm ?? null,
        hard_constraints: seed.hard_constraints ?? [],
        preferences: seed.preferences ?? [],
        important_locations: seed.important_locations ?? [],
      })
      .select("case_id")
      .single()
  );
  return getRequirements(caseId);
}

async function getRequirements(caseId: string): Promise<RequirementsRow> {
  return must(await adminSupabase.from("requirements").select("*").eq("case_id", caseId).single());
}

async function getCase(caseId: string): Promise<Tables<"decision_cases">> {
  return must(await adminSupabase.from("decision_cases").select("*").eq("id", caseId).single());
}

async function seedProperty(caseId: string, title: string, district?: string): Promise<string> {
  const row = must(
    await adminSupabase
      .from("properties")
      .insert({ case_id: caseId, input_mode: "manual", title, district: district ?? null })
      .select("id")
      .single()
  );
  return row.id;
}

interface FactSeed {
  field: string;
  value: Json;
  source?: string;
  scope?: string;
  raw_text?: string;
}

async function seedFacts(propertyId: string, facts: FactSeed[]): Promise<void> {
  const { error } = await adminSupabase.from("property_facts").insert(
    facts.map((f) => ({
      property_id: propertyId,
      field: f.field,
      value: f.value,
      source: f.source ?? "manual",
      scope: f.scope ?? "unit",
      raw_text: f.raw_text ?? String(f.value),
    }))
  );
  if (error) throw new Error(error.message);
}

async function loadFacts(propertyId: string): Promise<PropertyFact[]> {
  return must(
    await adminSupabase
      .from("property_facts")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: true })
      .order("field", { ascending: true })
  );
}

async function loadResolved(propertyId: string): Promise<ResolveFactsResult> {
  return resolveFacts(await loadFacts(propertyId));
}

function knownFields(resolved: ResolveFactsResult): string[] {
  return Object.entries(resolved.fields)
    .filter((entry) => entry[1].status === "known")
    .map((entry) => entry[0]);
}

function criticalKnownCount(resolved: ResolveFactsResult): number {
  return [
    resolved.fields.listing_price_sar.status === "known",
    resolved.fields.area_sqm.status === "known",
    resolved.fields.bedrooms.status === "known",
  ].filter(Boolean).length;
}

function modelAssessment(
  evidence: string[],
  fit: ModelPropertyAssessment["fit_rating"] = "strong",
  priority: ModelPropertyAssessment["visit_priority"] = "high"
): ModelPropertyAssessment {
  return {
    fit_rating: fit,
    fit_summary: "العقار يناسب الميزانية والمساحة وعدد الغرف المطلوبة",
    strengths: ["السعر ضمن الميزانية"],
    risks: [],
    key_unknowns: [],
    visit_priority: priority,
    visit_priority_reason: "يوصى بالمعاينة الميدانية",
    evidence_fields: evidence,
  };
}

function admit(
  propertyId: string,
  requirements: RequirementsRow,
  resolved: ResolveFactsResult,
  model: ModelPropertyAssessment
): AdmittedPropertyAssessment {
  const result = admitPropertyAssessment({
    propertyId,
    modelOutput: model,
    knownFactFields: knownFields(resolved),
    constraintResults: evaluateConstraints(requirements, resolved),
    pricePerSqm: pricePerSqm(resolved),
    criticalFieldsKnownCount: criticalKnownCount(resolved),
  });
  if (!result.ok) throw new Error(result.reason);
  return result.assessment;
}

function comparable(id: string, a: AdmittedPropertyAssessment): PropertyAssessmentWithProperty {
  return {
    id,
    property_id: a.property_id,
    fit_rating: a.fit_rating,
    fit_summary: a.fit_summary,
    strengths: a.strengths,
    risks: a.risks,
    key_unknowns: a.key_unknowns,
    visit_priority: a.visit_priority,
    visit_priority_reason: a.visit_priority_reason,
    evidence_fields: a.evidence_fields,
    constraint_results: a.constraint_results,
    price_per_sqm: a.price_per_sqm,
  };
}

async function seedPaidPayment(caseId: string, tag: string): Promise<void> {
  must(
    await adminSupabase
      .from("payments")
      .insert({
        case_id: caseId,
        provider: "mock",
        amount_sar: 10,
        status: "paid",
        idempotency_key: `acceptance-${tag}-${stamp}`,
      })
      .select("id")
      .single()
  );
}

interface RequirementsPayload {
  max_budget_sar: number;
  min_bedrooms?: number;
  hard_constraints?: Array<{ key: string; label: string; value?: number }>;
  preferences?: Array<{ label: string; weight: string }>;
  important_locations?: Array<{ label: string; address_text: string; frequency: string }>;
}

async function saveRequirementsAs(caseId: string, payload: RequirementsPayload): Promise<void> {
  state.client = guestA;
  const error = await rejection(
    saveRequirements(caseId, {
      purchase_method: "cash",
      household_size: 4,
      min_bedrooms: 3,
      hard_constraints: [],
      preferences: [],
      important_locations: [],
      ...payload,
    })
  );
  expect(redirectTarget(error)).toBe(`/case/${caseId}/properties`);
}

beforeAll(async () => {
  guestA = freshClient();
  const a = await guestA.auth.signInAnonymously();
  if (a.error || !a.data.user || !a.data.session) throw a.error ?? new Error("guest A sign-in failed");
  guestAId = a.data.user.id;
  guestASession = a.data.session;

  guestB = freshClient();
  const b = await guestB.auth.signInAnonymously();
  if (b.error || !b.data.user) throw b.error ?? new Error("guest B sign-in failed");
  guestBId = b.data.user.id;
});

beforeEach(() => {
  resetRateLimits();
  fetchListingMock.mockClear();
  state.client = guestA;
  state.modelMode = "ok";
  state.lastPrompt = "";
});

afterAll(async () => {
  if (caseIds.length > 0) {
    await adminSupabase.from("decision_cases").delete().in("id", caseIds);
  }
  if (storagePaths.length > 0) {
    await adminSupabase.storage.from("property-images").remove(storagePaths);
  }
  for (const id of [guestAId, guestBId].filter(Boolean)) {
    await adminSupabase.auth.admin.deleteUser(id);
  }
});

describe("Block 1: Requirements & constraint enforcement (T01, T02, T06, T07, T10, T16)", () => {
  it("T01: price, floor and missing elevator fail all three constraints; fit is capped to weak; property cannot out-rank a compliant one", async () => {
    const caseId = await createCase(guestAId);
    const requirements = await seedRequirements(caseId, {
      max_budget_sar: 900000,
      min_area_sqm: 100,
      hard_constraints: [
        { key: "elevator_required", label: "وجود مصعد" },
        { key: "max_floor", label: "أقصى دور (2)", value: 2 },
      ],
    });

    const bad = await seedProperty(caseId, "شقة مخالفة");
    await seedFacts(bad, [
      { field: "listing_price_sar", value: 1100000 },
      { field: "area_sqm", value: 120 },
      { field: "bedrooms", value: 3 },
      { field: "floor_no", value: 3 },
      { field: "elevator", value: false },
    ]);
    const good = await seedProperty(caseId, "شقة مطابقة");
    await seedFacts(good, [
      { field: "listing_price_sar", value: 850000 },
      { field: "area_sqm", value: 120 },
      { field: "bedrooms", value: 3 },
      { field: "floor_no", value: 1 },
      { field: "elevator", value: true },
    ]);

    const badResolved = await loadResolved(bad);
    const constraints = evaluateConstraints(requirements, badResolved);
    const byKey = Object.fromEntries(constraints.map((c) => [c.key, c.result]));
    expect(byKey.budget).toBe("fail");
    expect(byKey.elevator_required).toBe("fail");
    expect(byKey.max_floor).toBe("fail");

    const badAdmitted = admit(
      bad,
      requirements,
      badResolved,
      modelAssessment(["listing_price_sar", "area_sqm", "bedrooms"], "strong", "high")
    );
    expect(badAdmitted.fit_rating).toBe("weak");
    expect(badAdmitted.visit_priority).toBe("medium");

    const goodResolved = await loadResolved(good);
    const goodAdmitted = admit(good, requirements, goodResolved, modelAssessment(["listing_price_sar"]));
    expect(goodAdmitted.fit_rating).toBe("strong");

    const comparison = resolveComparison(
      [comparable("a-bad", badAdmitted), comparable("a-good", goodAdmitted)],
      requirements
    );
    expect(comparison.items[0].property_id).toBe(good);
    const badItem = comparison.items.find((i) => i.property_id === bad)!;
    expect(badItem.rank).toBe(2);
    expect(badItem.constraint_summary.fail).toBe(3);
  });

  it("T02: important locations are stored as structured data and no commute minutes are fabricated", async () => {
    const caseId = await createCase(guestAId, "draft");
    const locations = [
      { label: "مقر العمل", address_text: "حي العليا، الرياض", frequency: "daily" },
      { label: "مدرسة الأبناء", address_text: "حي الملقا", frequency: "weekly" },
    ];
    await saveRequirementsAs(caseId, { max_budget_sar: 900000, important_locations: locations });

    const stored = await getRequirements(caseId);
    expect(stored.important_locations).toEqual(locations);
    for (const loc of stored.important_locations as Array<Record<string, unknown>>) {
      expect(Object.keys(loc).sort()).toEqual(["address_text", "frequency", "label"]);
    }

    const propertyId = await seedProperty(caseId, "شقة الموقع");
    await seedFacts(propertyId, [{ field: "listing_price_sar", value: 800000 }]);
    const constraints = evaluateConstraints(stored, await loadResolved(propertyId));
    expect(constraints.map((c) => c.key).filter((k) => /commute|location/i.test(k))).toEqual([]);

    const payload = buildAIAnalysisPayload(stored, [], {});
    expect(payload.requirements).not.toHaveProperty("important_locations");
  });

  it("T06: raising the budget bumps state_version, flips the 950k property to pass and leaves properties and facts untouched", async () => {
    const caseId = await createCase(guestAId, "draft");
    await saveRequirementsAs(caseId, { max_budget_sar: 800000 });
    const propertyId = await seedProperty(caseId, "شقة 950");
    await seedFacts(propertyId, [
      { field: "listing_price_sar", value: 950000 },
      { field: "area_sqm", value: 130 },
      { field: "bedrooms", value: 3 },
    ]);

    const before = await getRequirements(caseId);
    const versionBefore = (await getCase(caseId)).state_version;
    const factsBefore = await loadFacts(propertyId);
    const propertyBefore = must(
      await adminSupabase.from("properties").select("*").eq("id", propertyId).single()
    );
    const resolved = await loadResolved(propertyId);
    expect(evaluateConstraints(before, resolved).find((c) => c.key === "budget")?.result).toBe("fail");

    await saveRequirementsAs(caseId, { max_budget_sar: 1100000 });

    const after = await getRequirements(caseId);
    expect(Number(after.max_budget_sar)).toBe(1100000);
    expect((await getCase(caseId)).state_version).toBeGreaterThan(versionBefore);
    expect(evaluateConstraints(after, resolved).find((c) => c.key === "budget")?.result).toBe("pass");
    expect(await loadFacts(propertyId)).toEqual(factsBefore);
    expect(
      must(await adminSupabase.from("properties").select("*").eq("id", propertyId).single())
    ).toEqual(propertyBefore);
  });

  it("T07: changing important locations commits atomically and keeps existing facts intact", async () => {
    const caseId = await createCase(guestAId, "draft");
    await saveRequirementsAs(caseId, {
      max_budget_sar: 900000,
      important_locations: [{ label: "مقر العمل", address_text: "حي العليا", frequency: "daily" }],
    });
    const propertyId = await seedProperty(caseId, "شقة العمل");
    await seedFacts(propertyId, [
      { field: "listing_price_sar", value: 700000 },
      { field: "area_sqm", value: 110 },
    ]);
    const factsBefore = await loadFacts(propertyId);
    const versionBefore = (await getCase(caseId)).state_version;

    const updated = [
      { label: "مقر العمل", address_text: "حي الملقا", frequency: "daily" },
      { label: "منزل الأهل", address_text: "حي النرجس", frequency: "weekly" },
    ];
    await saveRequirementsAs(caseId, { max_budget_sar: 900000, important_locations: updated });

    const stored = await getRequirements(caseId);
    expect(stored.important_locations).toEqual(updated);
    expect(Number(stored.max_budget_sar)).toBe(900000);
    expect((await getCase(caseId)).state_version).toBeGreaterThan(versionBefore);
    expect(await loadFacts(propertyId)).toEqual(factsBefore);
  });

  it("T10: when every property violates a hard constraint none is rated strong and none passes all constraints", async () => {
    const caseId = await createCase(guestAId);
    const requirements = await seedRequirements(caseId, {
      max_budget_sar: 900000,
      hard_constraints: [{ key: "elevator_required", label: "وجود مصعد" }],
    });
    const specs = [
      { title: "فوق الميزانية", facts: [{ field: "listing_price_sar", value: 1300000 }] },
      {
        title: "بدون مصعد",
        facts: [
          { field: "listing_price_sar", value: 800000 },
          { field: "floor_no", value: 4 },
          { field: "elevator", value: false },
        ],
      },
      {
        title: "الأمرين معاً",
        facts: [
          { field: "listing_price_sar", value: 1500000 },
          { field: "floor_no", value: 5 },
          { field: "elevator", value: false },
        ],
      },
    ];
    const admitted: AdmittedPropertyAssessment[] = [];
    for (const spec of specs) {
      const id = await seedProperty(caseId, spec.title);
      await seedFacts(id, [
        ...spec.facts,
        { field: "area_sqm", value: 120 },
        { field: "bedrooms", value: 3 },
      ]);
      admitted.push(
        admit(id, requirements, await loadResolved(id), modelAssessment(["listing_price_sar"], "strong", "high"))
      );
    }

    expect(admitted.map((a) => a.fit_rating)).toEqual(["weak", "weak", "weak"]);
    const comparison = resolveComparison(
      admitted.map((a, i) => comparable(`t10-${i}`, a)),
      requirements
    );
    expect(comparison.items.some((i) => i.fit_rating === "strong")).toBe(false);
    expect(comparison.items.every((i) => i.constraint_summary.fail > 0)).toBe(true);
  });

  it("T16: a guest case survives a new client restoring the saved session", async () => {
    const created = must(
      await guestA
        .from("decision_cases")
        .insert({ city: "جدة", owner_id: guestAId })
        .select("id, status")
        .single()
    );
    caseIds.push(created.id);

    const returning = freshClient();
    const { data, error } = await returning.auth.setSession({
      access_token: guestASession.access_token,
      refresh_token: guestASession.refresh_token,
    });
    expect(error).toBeNull();
    expect(data.user?.id).toBe(guestAId);
    expect(data.user?.is_anonymous).toBe(true);

    const restored = must(
      await returning.from("decision_cases").select("id, status, owner_id").eq("id", created.id).single()
    );
    expect(restored).toEqual({ id: created.id, status: "draft", owner_id: guestAId });
  });
});

describe("Block 2: Multi-modal ingestion & edge cases (T11, T12, T13, T19, T20, T23)", () => {
  it("T11: an image-mode property is saved without URL scraping and a failed extraction does not abort the case", async () => {
    const caseId = await createCase(guestAId, "needs_complete");
    const missingPath = `${guestAId}/${caseId}/not-uploaded.png`;

    const result = await addProperty(caseId, { input_mode: "image", image_paths: [missingPath] });
    expect(result).toEqual({ success: true });
    expect(fetchListingMock).not.toHaveBeenCalled();

    const property = must(
      await adminSupabase.from("properties").select("*").eq("case_id", caseId).single()
    );
    expect(property.input_mode).toBe("image");
    expect(property.source_url).toBeNull();
    expect(property.image_paths).toEqual([missingPath]);

    const runs = must(
      await adminSupabase.from("extraction_runs").select("status, error_code").eq("property_id", property.id)
    );
    expect(runs).toEqual([{ status: "failed", error_code: "image_download_failed" }]);
    expect((await getCase(caseId)).status).toBe("properties_complete");
  });

  it("T12: partial image extraction stores only what was extracted; every other field stays unknown", async () => {
    const caseId = await createCase(guestAId);
    const path = `${guestAId}/${caseId}/t12-${stamp}.png`;
    const onePixelPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    const upload = await adminSupabase.storage
      .from("property-images")
      .upload(path, onePixelPng, { contentType: "image/png" });
    expect(upload.error).toBeNull();
    storagePaths.push(path);

    const propertyId = must(
      await adminSupabase
        .from("properties")
        .insert({ case_id: caseId, input_mode: "image", image_paths: [path] })
        .select("id")
        .single()
    ).id;

    const imageModel = new MockLanguageModelV4({
      doGenerate: async () => ({
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              facts: [
                { field: "listing_price_sar", raw: "900000", evidence: "السعر 900,000 ريال" },
                { field: "area_sqm", raw: "150", evidence: "المساحة 150 م²" },
              ],
            }),
          },
        ],
        finishReason: { unified: "stop" as const, raw: undefined },
        usage: {
          inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 1, text: 1, reasoning: 0 },
        },
        warnings: [],
      }),
    });

    expect(await runExtraction(propertyId, { modelOverride: imageModel })).toEqual({
      ok: true,
      factsCount: 2,
    });

    const facts = await loadFacts(propertyId);
    expect(facts.map((f) => f.field).sort()).toEqual(["area_sqm", "listing_price_sar"]);
    expect(facts.every((f) => f.source === "image" && f.evidence_verified === false)).toBe(true);

    const resolved = resolveFacts(facts);
    expect(resolved.fields.listing_price_sar).toMatchObject({ status: "known", value: 900000 });
    expect(resolved.fields.area_sqm).toMatchObject({ status: "known", value: 150 });
    for (const key of ["bedrooms", "bathrooms", "floor_no", "building_floors", "property_age_years", "elevator", "private_parking", "district"] as const) {
      expect(resolved.fields[key]).toEqual({ status: "unknown" });
    }
  });

  it("T13: a single property passes preflight and is analyzed standalone, without a market-best ranking", async () => {
    const caseId = await createCase(guestAId);
    const requirements = await seedRequirements(caseId, {
      max_budget_sar: 800000,
      min_area_sqm: 100,
    });
    const propertyId = await seedProperty(caseId, "شقة وحيدة");
    await seedFacts(propertyId, [
      { field: "listing_price_sar", value: 700000 },
      { field: "area_sqm", value: 130 },
      { field: "bedrooms", value: 3 },
    ]);
    await seedPaidPayment(caseId, "t13");
    state.modelOutput = modelAssessment(["listing_price_sar", "area_sqm", "bedrooms"]);

    const preflight = evaluatePreflight(await loadPreflightData(caseId, guestA));
    expect(preflight.ready).toBe(true);

    const error = await rejection(startAnalysis(caseId));
    expect(redirectTarget(error)).toBe(`/case/${caseId}/results`);

    const run = must(
      await adminSupabase
        .from("analysis_runs")
        .select("id, status")
        .eq("case_id", caseId)
        .eq("status", "committed")
        .single()
    );
    const assessments = must(
      await adminSupabase.from("property_assessments").select("*").eq("run_id", run.id)
    );
    expect(assessments).toHaveLength(1);
    expect(assessments[0].property_id).toBe(propertyId);
    expect(assessments[0].fit_rating).toBe("strong");
    expect((await getCase(caseId)).status).toBe("analyzed");

    const comparison = resolveComparison(
      [
        {
          ...assessments[0],
          strengths: assessments[0].strengths as unknown as string[],
          risks: assessments[0].risks as unknown as string[],
          key_unknowns: assessments[0].key_unknowns as unknown as string[],
          constraint_results: assessments[0].constraint_results as unknown as PropertyAssessmentWithProperty["constraint_results"],
          price_per_sqm: assessments[0].price_per_sqm === null ? null : Number(assessments[0].price_per_sqm),
        },
      ],
      requirements
    );
    expect(comparison.mode).toBe("insufficient");
    expect(comparison.close_options).toBe(false);
    expect(comparison.items).toHaveLength(1);
    expect(comparison.items[0].rank).toBeNull();
  });

  it("T19: adding the same listing URL twice returns the Arabic duplicate error and stores one row", async () => {
    const caseId = await createCase(guestAId, "needs_complete");
    const payload = { input_mode: "url", source_url: "https://example.com/ad/101" };

    expect(await addProperty(caseId, payload)).toEqual({ success: true });
    expect(await addProperty(caseId, payload)).toEqual({
      errors: { source_url: ["هذا الرابط مضاف مسبقًا"] },
    });

    const rows = must(
      await adminSupabase.from("properties").select("id").eq("case_id", caseId).eq("source_url", payload.source_url)
    );
    expect(rows).toHaveLength(1);
  });

  it("T20: long Arabic notes round-trip intact; over-limit notes and titles are rejected with Arabic messages and no row", async () => {
    const caseId = await createCase(guestAId, "needs_complete");
    const longNotes = "عقار مميز بإطلالة رائعة ".repeat(15).trim();
    expect(longNotes.length).toBeGreaterThan(300);

    expect(
      await addProperty(caseId, { input_mode: "manual", title: "شقة الملاحظات", notes: longNotes })
    ).toEqual({ success: true });
    const stored = must(
      await adminSupabase.from("properties").select("notes").eq("case_id", caseId).single()
    );
    expect(stored.notes).toBe(longNotes);

    const tooLong = await addProperty(caseId, {
      input_mode: "manual",
      title: "شقة",
      notes: "ب".repeat(1001),
    });
    expect(tooLong).toEqual({ errors: { notes: ["الحد الأقصى للملاحظات 1000 حرف"] } });

    const longTitle = await addProperty(caseId, { input_mode: "manual", title: "ت".repeat(121) });
    expect(longTitle).toEqual({ errors: { title: ["الحد الأقصى للعنوان 120 حرفاً"] } });

    const { count } = await adminSupabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("case_id", caseId);
    expect(count).toBe(1);
  });

  it("T23: two units in the same district stay separate rows with separate facts", async () => {
    const caseId = await createCase(guestAId, "needs_complete");
    expect(
      await addProperty(caseId, {
        input_mode: "manual",
        title: "شقة 4",
        district: "الياسمين",
        area_sqm: 90,
        listing_price_sar: 600000,
      })
    ).toEqual({ success: true });
    expect(
      await addProperty(caseId, {
        input_mode: "manual",
        title: "شقة 12",
        district: "الياسمين",
        area_sqm: 120,
        listing_price_sar: 780000,
      })
    ).toEqual({ success: true });

    const props = must(
      await adminSupabase
        .from("properties")
        .select("id, title, district")
        .eq("case_id", caseId)
        .order("title")
    );
    expect(props).toHaveLength(2);
    expect(new Set(props.map((p) => p.id)).size).toBe(2);
    expect(props.map((p) => p.title).sort()).toEqual(["شقة 12", "شقة 4"]);
    expect(props.every((p) => p.district === "الياسمين")).toBe(true);

    const byTitle = new Map<string, ResolveFactsResult>();
    for (const p of props) {
      byTitle.set(p.title ?? "", await loadResolved(p.id));
    }
    expect(byTitle.get("شقة 4")!.fields.area_sqm).toMatchObject({ status: "known", value: 90 });
    expect(byTitle.get("شقة 12")!.fields.area_sqm).toMatchObject({ status: "known", value: 120 });
    expect(byTitle.get("شقة 4")!.claims.unit.map((c) => c.raw_text)).toEqual(["شقة 4"]);
    expect(byTitle.get("شقة 12")!.claims.unit.map((c) => c.raw_text)).toEqual(["شقة 12"]);
  });
});

describe("Block 3: Evidence normalization, certainty & conflicts (T03, T04, T18, T21, T22, T25)", () => {
  it("T03: a property with price only has 1 critical field known and is admitted as insufficient_evidence", async () => {
    const caseId = await createCase(guestAId);
    const requirements = await seedRequirements(caseId, { max_budget_sar: 900000, min_area_sqm: 100 });
    const propertyId = await seedProperty(caseId, "بيانات ناقصة");
    await seedFacts(propertyId, [{ field: "listing_price_sar", value: 800000 }]);
    const resolved = await loadResolved(propertyId);

    expect(criticalKnownCount(resolved)).toBe(1);
    expect(criticalKnownCount(resolved)).toBeLessThan(3);
    const constraints = evaluateConstraints(requirements, resolved);
    expect(constraints.find((c) => c.key === "bedrooms")?.result).toBe("unknown");
    expect(constraints.find((c) => c.key === "min_area")?.result).toBe("unknown");

    const admitted = admit(propertyId, requirements, resolved, modelAssessment(["listing_price_sar"], "strong", "high"));
    expect(admitted.fit_rating).toBe("insufficient_evidence");
    expect(admitted.visit_priority).toBe("insufficient_evidence");

    const withTwo = await seedProperty(caseId, "بيانات جزئية");
    await seedFacts(withTwo, [
      { field: "listing_price_sar", value: 800000 },
      { field: "area_sqm", value: 120 },
    ]);
    const resolvedTwo = await loadResolved(withTwo);
    expect(criticalKnownCount(resolvedTwo)).toBe(2);
    expect(admit(withTwo, requirements, resolvedTwo, modelAssessment(["listing_price_sar"])).fit_rating).toBe("strong");
  });

  it("T04: 140 (url) vs 125 (image) resolves to conflicting with both candidates and is never averaged", async () => {
    const caseId = await createCase(guestAId);
    const requirements = await seedRequirements(caseId, { max_budget_sar: 900000, min_area_sqm: 100 });
    const propertyId = await seedProperty(caseId, "تعارض مساحة");
    await seedFacts(propertyId, [
      { field: "area_sqm", value: 140, source: "url" },
      { field: "area_sqm", value: 125, source: "image" },
      { field: "listing_price_sar", value: 900000, source: "url" },
    ]);

    const resolved = await loadResolved(propertyId);
    const area = resolved.fields.area_sqm;
    expect(area.status).toBe("conflicting");
    if (area.status !== "conflicting") throw new Error("unreachable");
    expect(area.candidates.map((c) => c.value).sort()).toEqual([125, 140]);
    expect(area.candidates.find((c) => c.value === 140)?.sources).toEqual(["url"]);
    expect(area.candidates.find((c) => c.value === 125)?.sources).toEqual(["image"]);
    expect(area).not.toHaveProperty("value");
    expect(JSON.stringify(resolved.fields)).not.toContain("132.5");

    expect(pricePerSqm(resolved)).toBeNull();
    expect(evaluateConstraints(requirements, resolved).find((c) => c.key === "min_area")?.result).toBe("unknown");
    const preflight = evaluatePreflight({
      requirements,
      properties: [{ id: propertyId, label: "تعارض مساحة", resolved }],
    });
    expect(preflight.ready).toBe(false);
    expect(preflight.blockers.some((b) => b.code === "CRITICAL_CONFLICT" && b.field === "area_sqm")).toBe(true);
  });

  it("T18: reported facts stay reported (even when repeated) until an explicit user correction makes them user_stated", async () => {
    const caseId = await createCase(guestAId);
    const propertyId = await seedProperty(caseId, "شقة معلنة");
    await seedFacts(propertyId, [
      { field: "area_sqm", value: 120, source: "url" },
      { field: "area_sqm", value: 120, source: "image" },
      { field: "listing_claim", value: "مصعد حديث", source: "url", raw_text: "مصعد حديث" },
    ]);

    const reported = await loadResolved(propertyId);
    expect(reported.fields.area_sqm).toMatchObject({ status: "known", value: 120, certainty: "reported" });
    expect(reported.fields.elevator).toEqual({ status: "unknown" });
    expect(reported.claims.unit.map((c) => c.raw_text)).toEqual(["مصعد حديث"]);

    await seedFacts(propertyId, [{ field: "area_sqm", value: 118, source: "user_correction" }]);
    const corrected = await loadResolved(propertyId);
    expect(corrected.fields.area_sqm).toMatchObject({ status: "known", value: 118, certainty: "user_stated" });
    expect(corrected.fields.elevator).toEqual({ status: "unknown" });
  });

  it("T21/T22: a neighborhood claim stays under claims.neighborhood and never becomes a unit fact or district", async () => {
    const caseId = await createCase(guestAId);
    const propertyId = await seedProperty(caseId, "شقة قرب الحديقة");
    await seedFacts(propertyId, [
      { field: "listing_claim", value: "قريب من الحديقة", source: "url", scope: "neighborhood", raw_text: "قريب من الحديقة" },
    ]);

    const resolved = await loadResolved(propertyId);
    expect(resolved.claims.neighborhood.map((c) => c.raw_text)).toEqual(["قريب من الحديقة"]);
    expect(resolved.claims.unit).toEqual([]);
    expect(resolved.claims.building).toEqual([]);
    for (const field of Object.values(resolved.fields)) {
      expect(field).toEqual({ status: "unknown" });
    }
  });

  it("T25: empty preferences yield only the base and hard-constraint results, with nothing invented", async () => {
    const caseId = await createCase(guestAId);
    const requirements = await seedRequirements(caseId, {
      max_budget_sar: 900000,
      preferences: [],
      hard_constraints: [{ key: "private_parking", label: "موقف خاص" }],
    });
    expect(requirements.preferences).toEqual([]);

    const propertyId = await seedProperty(caseId, "شقة بلا تفضيلات");
    await seedFacts(propertyId, [{ field: "listing_price_sar", value: 800000 }]);
    const resolved = await loadResolved(propertyId);

    const constraints = evaluateConstraints(requirements, resolved);
    expect(constraints.map((c) => c.key)).toEqual(["budget", "bedrooms", "private_parking"]);
    expect(constraints.find((c) => c.key === "private_parking")?.result).toBe("unknown");

    const payload = buildAIAnalysisPayload(requirements, [], {});
    const { prompt } = buildAnalysisPrompt({
      propertyLabel: "شقة بلا تفضيلات",
      requirements: payload.requirements,
      constraints,
      knownFacts: payload.facts,
      unknownFieldKeys: [],
      conflictingFieldKeys: [],
      listingClaims: [],
    });
    expect(prompt).not.toContain("التفضيلات الشخصية");
  });
});

describe("Block 4: Analysis outcomes, pricing & reassessment (T05, T08, T09, T14, T15, T24)", () => {
  it("T05/T24: price per sqm is price/area; with no area it is null and the assessment is insufficient_evidence", async () => {
    const caseId = await createCase(guestAId);
    const requirements = await seedRequirements(caseId, { max_budget_sar: 1000000 });
    const full = await seedProperty(caseId, "سعر ومساحة");
    await seedFacts(full, [
      { field: "listing_price_sar", value: 900000 },
      { field: "area_sqm", value: 150 },
    ]);
    const priceOnly = await seedProperty(caseId, "سعر فقط");
    await seedFacts(priceOnly, [{ field: "listing_price_sar", value: 900000 }]);

    expect(pricePerSqm(await loadResolved(full))).toBe(6000);

    const resolved = await loadResolved(priceOnly);
    expect(pricePerSqm(resolved)).toBeNull();
    const admitted = admit(priceOnly, requirements, resolved, modelAssessment(["listing_price_sar"]));
    expect(admitted.price_per_sqm).toBeNull();
    expect(admitted.fit_rating).toBe("insufficient_evidence");
  });

  it("T08: an elevator defect committed through commit_reassessment is logged with previous/new rating, diff and runtime version", async () => {
    const caseId = await createCase(guestAId);
    await seedRequirements(caseId, {
      max_budget_sar: 800000,
      hard_constraints: [{ key: "elevator_required", label: "وجود مصعد" }],
    });
    const propertyId = await seedProperty(caseId, "شقة المصعد");
    const run = must(
      await adminSupabase
        .from("analysis_runs")
        .insert({
          case_id: caseId,
          base_state_version: 1,
          status: "committed",
          model: "gemini-flash-lite",
          prompt_version: "acceptance",
          finished_at: new Date().toISOString(),
        })
        .select("id")
        .single()
    );
    const assessment = must(
      await adminSupabase
        .from("property_assessments")
        .insert({
          run_id: run.id,
          property_id: propertyId,
          constraint_results: [
            { key: "elevator_required", labelAr: "وجود مصعد", result: "unknown", detailAr: "غير مؤكد" },
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
        })
        .select("id")
        .single()
    );
    const item = must(
      await adminSupabase
        .from("inspection_items")
        .insert({
          property_id: propertyId,
          category: "building_services",
          question_ar: "هل المصعد متوفر ويعمل؟",
          why_it_matters_ar: "الوصول للأدوار العليا",
          how_to_check_ar: "معاينة عمل المصعد",
          priority: "high",
          trigger_reason: "unknown_fact",
          affected_assessment_types: ["fit"],
        })
        .select("id")
        .single()
    );
    must(
      await adminSupabase
        .from("inspection_findings")
        .insert({
          inspection_item_id: item.id,
          property_id: propertyId,
          result: "problem",
          note: "المصعد معطل بالكامل",
        })
        .select("id")
        .single()
    );

    const baseVersion = (await getCase(caseId)).state_version;
    const diff = {
      previousFitRating: "partial",
      newFitRating: "weak",
      previousVisitPriority: "medium",
      newVisitPriority: "low",
      addedRisks: ["المصعد معطل"],
      resolvedUnknowns: ["المصعد"],
      explanationAr: "تغير التوافق بعد اكتشاف عطل المصعد",
    };
    const { data: outcome, error } = await adminSupabase.rpc("commit_reassessment", {
      p_case_id: caseId,
      p_property_id: propertyId,
      p_base_state_version: baseVersion,
      p_new_assessment: {
        fit_rating: "weak",
        fit_summary: "المصعد معطل",
        strengths: [],
        risks: ["المصعد معطل"],
        key_unknowns: [],
        visit_priority: "low",
        visit_priority_reason: "عطل في المصعد",
        constraint_results: [
          { key: "elevator_required", labelAr: "وجود مصعد", result: "fail", detailAr: "المصعد معطل" },
        ],
      },
      p_diff: diff,
      p_runtime_version: ANALYSIS_RUNTIME_VERSION,
    });
    expect(error).toBeNull();
    expect(outcome).toBe("committed");

    const log = must(
      await adminSupabase.from("reassessment_logs").select("*").eq("assessment_id", assessment.id).single()
    );
    expect(log.previous_fit_rating).toBe("partial");
    expect(log.new_fit_rating).toBe("weak");
    expect(log.previous_visit_priority).toBe("medium");
    expect(log.new_visit_priority).toBe("low");
    expect(log.base_state_version).toBe(baseVersion);
    expect(log.diff).toEqual(diff);
    expect(log.analysis_runtime_version).toBe(ANALYSIS_RUNTIME_VERSION);

    const updated = must(
      await adminSupabase.from("property_assessments").select("fit_rating, constraint_results").eq("id", assessment.id).single()
    );
    expect(updated.fit_rating).toBe("weak");
    expect(updated.constraint_results).toEqual([
      { key: "elevator_required", labelAr: "وجود مصعد", result: "fail", detailAr: "المصعد معطل" },
    ]);
  });

  it("T09: two equal strong options are flagged as close and receive distinct ranks", async () => {
    const caseId = await createCase(guestAId);
    const requirements = await seedRequirements(caseId, { max_budget_sar: 900000 });
    const run = must(
      await adminSupabase
        .from("analysis_runs")
        .insert({
          case_id: caseId,
          base_state_version: 1,
          status: "committed",
          model: "gemini-flash-lite",
          prompt_version: "acceptance",
          finished_at: new Date().toISOString(),
        })
        .select("id")
        .single()
    );

    const specs = [
      { title: "خيار أ", price: 800000 },
      { title: "خيار ب", price: 810000 },
    ];
    for (const spec of specs) {
      const id = await seedProperty(caseId, spec.title);
      await seedFacts(id, [
        { field: "listing_price_sar", value: spec.price },
        { field: "area_sqm", value: 130 },
        { field: "bedrooms", value: 3 },
      ]);
      const admitted = admit(id, requirements, await loadResolved(id), modelAssessment(["listing_price_sar"]));
      must(
        await adminSupabase
          .from("property_assessments")
          .insert({
            run_id: run.id,
            property_id: id,
            constraint_results: admitted.constraint_results as unknown as Json,
            price_per_sqm: admitted.price_per_sqm,
            fit_rating: admitted.fit_rating,
            fit_summary: admitted.fit_summary,
            strengths: admitted.strengths,
            risks: admitted.risks,
            key_unknowns: admitted.key_unknowns,
            visit_priority: admitted.visit_priority,
            visit_priority_reason: admitted.visit_priority_reason,
            evidence_fields: admitted.evidence_fields,
          })
          .select("id")
          .single()
      );
    }

    const rows = must(
      await adminSupabase
        .from("property_assessments")
        .select("*, properties(*, property_facts(*))")
        .eq("run_id", run.id)
    );
    expect(rows).toHaveLength(2);
    const comparison = resolveComparison(
      rows.map((row) => ({
        ...row,
        strengths: row.strengths as unknown as string[],
        risks: row.risks as unknown as string[],
        key_unknowns: row.key_unknowns as unknown as string[],
        constraint_results: row.constraint_results as unknown as PropertyAssessmentWithProperty["constraint_results"],
        price_per_sqm: row.price_per_sqm === null ? null : Number(row.price_per_sqm),
        properties: row.properties,
      })),
      requirements
    );

    expect(comparison.items.map((i) => i.fit_rating)).toEqual(["strong", "strong"]);
    expect(comparison.close_options).toBe(true);
    expect(comparison.tradeoff_summary_ar).toBeDefined();
    expect(comparison.items.map((i) => i.rank)).toEqual([1, 2]);
    expect(new Set(comparison.items.map((i) => i.property_id)).size).toBe(2);
  });

  it("T14: the prompt sent for analysis is built only from committed facts and requirements", async () => {
    const caseId = await createCase(guestAId);
    await seedRequirements(caseId, { max_budget_sar: 777000, min_area_sqm: 90 });
    const propertyId = await seedProperty(caseId, "شقة الاختبار");
    await seedFacts(propertyId, [
      { field: "listing_price_sar", value: 640000 },
      { field: "area_sqm", value: 137 },
      { field: "bedrooms", value: 3 },
      { field: "listing_claim", value: "واجهة شمالية", source: "url", raw_text: "واجهة شمالية" },
    ]);
    await seedPaidPayment(caseId, "t14");
    state.modelOutput = modelAssessment(["listing_price_sar", "area_sqm"]);

    const uncommitted = "قيمة-غير-محفوظة-98765";
    const error = await rejection(startAnalysis(caseId));
    expect(redirectTarget(error)).toBe(`/case/${caseId}/results`);

    expect(state.lastPrompt).toContain("[listing_price_sar]");
    expect(state.lastPrompt).toContain("640000");
    expect(state.lastPrompt).toContain("[area_sqm]");
    expect(state.lastPrompt).toContain("137");
    expect(state.lastPrompt).toContain("واجهة شمالية");
    expect(state.lastPrompt).toContain("777");
    expect(state.lastPrompt).not.toContain(uncommitted);
    expect(state.lastPrompt).not.toContain(guestAId);
    expect(state.lastPrompt).not.toContain(caseId);
  });

  it("T15: a failing model run is recorded as failed and the case is not promoted to analyzed", async () => {
    const caseId = await createCase(guestAId);
    await seedRequirements(caseId, { max_budget_sar: 800000 });
    const propertyId = await seedProperty(caseId, "شقة الفشل");
    await seedFacts(propertyId, [
      { field: "listing_price_sar", value: 700000 },
      { field: "area_sqm", value: 130 },
      { field: "bedrooms", value: 3 },
    ]);
    await seedPaidPayment(caseId, "t15");
    state.modelMode = "throw";
    const statusBefore = (await getCase(caseId)).status;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await startAnalysis(caseId);
    warn.mockRestore();

    expect(result).toEqual({ error: "تعذر إكمال التحليل. حاول مرة أخرى." });
    const run = must(
      await adminSupabase.from("analysis_runs").select("id, status, outcome_code, finished_at").eq("case_id", caseId).single()
    );
    expect(run.status).toBe("failed");
    expect(run.outcome_code).toBe("model_error");
    expect(run.finished_at).not.toBeNull();

    expect((await getCase(caseId)).status).toBe(statusBefore);
    expect(statusBefore).toBe("properties_complete");
    const { count } = await adminSupabase
      .from("property_assessments")
      .select("id", { count: "exact", head: true })
      .eq("run_id", run.id);
    expect(count).toBe(0);
  });
});

describe("Block 5: Critical release gate - tenant isolation (T17)", () => {
  it("T17: user B cannot read, list, update or delete user A's case, requirements or properties", async () => {
    const caseId = must(
      await guestA.from("decision_cases").insert({ city: "الرياض", owner_id: guestAId }).select("id").single()
    ).id;
    caseIds.push(caseId);
    await seedRequirements(caseId, { max_budget_sar: 900000 });
    const propertyId = await seedProperty(caseId, "عقار خاص بالمستخدم أ");
    await seedFacts(propertyId, [{ field: "listing_price_sar", value: 850000 }]);

    const own = await guestA.from("decision_cases").select("id").eq("id", caseId);
    expect(own.data).toEqual([{ id: caseId }]);
    expect((await loadDashboardCases(guestA)).map((c) => c.id)).toContain(caseId);

    const read = await guestB.from("decision_cases").select("*").eq("id", caseId);
    expect(read.error).toBeNull();
    expect(read.data).toEqual([]);
    expect((await guestB.from("decision_cases").select("id")).data).toEqual([]);
    expect(await loadDashboardCases(guestB)).toEqual([]);
    expect((await guestB.from("requirements").select("*").eq("case_id", caseId)).data).toEqual([]);
    expect((await guestB.from("properties").select("*").eq("case_id", caseId)).data).toEqual([]);
    expect((await guestB.from("property_facts").select("*").eq("property_id", propertyId)).data).toEqual([]);
    expect(await rejection(requireCase(caseId, guestB))).toEqual(new Error("NOT_FOUND"));

    const update = await guestB
      .from("decision_cases")
      .update({ city: "جدة" })
      .eq("id", caseId)
      .select("id");
    expect(update.data ?? []).toEqual([]);
    const del = await guestB.from("decision_cases").delete().eq("id", caseId).select("id");
    expect(del.data ?? []).toEqual([]);
    const reqUpdate = await guestB
      .from("requirements")
      .update({ max_budget_sar: 1 })
      .eq("case_id", caseId)
      .select("case_id");
    expect(reqUpdate.data ?? []).toEqual([]);

    const intact = await getCase(caseId);
    expect(intact.owner_id).toBe(guestAId);
    expect(intact.city).toBe("الرياض");
    expect(intact.deleted_at).toBeNull();
    expect(Number((await getRequirements(caseId)).max_budget_sar)).toBe(900000);
  });
});
