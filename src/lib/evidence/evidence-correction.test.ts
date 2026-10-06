import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { submitCorrection } from "@/actions/evidence";
import { resolveFacts, PropertyFact } from "./resolve";
import { adminSupabase } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

describe("Evidence correction and conflict resolution", () => {
  let testUserId: string;
  let testCaseId: string;
  let testPropId: string;

  beforeAll(async () => {
    // 1. Get or create auth user
    const {
      data: { users },
    } = await adminSupabase.auth.admin.listUsers();

    if (users && users.length > 0) {
      testUserId = users[0].id;
    } else {
      const { data: newUser } = await adminSupabase.auth.admin.createUser({
        email: `test-evidence-${Date.now()}@bawsala.local`,
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

    // 3. Create property
    const { data: testProp } = await adminSupabase
      .from("properties")
      .insert({
        case_id: testCaseId,
        input_mode: "url",
        source_url: "https://example.com/listing-conflict-test",
      })
      .select()
      .single();

    testPropId = testProp!.id;
  });

  afterAll(async () => {
    if (testCaseId) {
      await adminSupabase.from("decision_cases").delete().eq("id", testCaseId);
    }
  });

  it("Acceptance 5: rejects unknown field keys or listing_claim", async () => {
    const res1 = await submitCorrection(
      testCaseId,
      testPropId,
      {
        field: "unknown_key_xyz",
        value: "100",
      },
      adminSupabase
    );
    expect(res1.errors?.field).toBeDefined();

    const res2 = await submitCorrection(
      testCaseId,
      testPropId,
      {
        field: "listing_claim",
        value: "ادعاء",
      },
      adminSupabase
    );
    expect(res2.errors?.field).toBeDefined();
  });

  it("Acceptance 2: entering '١٢٠ م²' stores 120, while out of bounds 5 shows error and stores nothing", async () => {
    // Count facts before
    const { data: factsBefore } = await adminSupabase
      .from("property_facts")
      .select("*")
      .eq("property_id", testPropId)
      .eq("field", "area_sqm");

    const countBefore = factsBefore?.length ?? 0;

    // 1. Out of bounds (5 < 20)
    const errRes = await submitCorrection(
      testCaseId,
      testPropId,
      {
        field: "area_sqm",
        value: "5",
      },
      adminSupabase
    );
    expect(errRes.errors?.area_sqm).toBeDefined();

    const { data: factsAfterFailed } = await adminSupabase
      .from("property_facts")
      .select("*")
      .eq("property_id", testPropId)
      .eq("field", "area_sqm");

    expect(factsAfterFailed?.length).toBe(countBefore);

    // 2. Arabic digits with unit "١٢٠ م²" -> stores 120
    const successRes = await submitCorrection(
      testCaseId,
      testPropId,
      {
        field: "area_sqm",
        value: "١٢٠ م²",
      },
      adminSupabase
    );
    expect(successRes.success).toBe(true);

    const { data: factsAfterSuccess } = await adminSupabase
      .from("property_facts")
      .select("*")
      .eq("property_id", testPropId)
      .eq("field", "area_sqm")
      .eq("source", "user_correction");

    expect(factsAfterSuccess?.length).toBe(1);
    expect(Number(factsAfterSuccess![0].value)).toBe(120);
    expect(factsAfterSuccess![0].raw_text).toBe("١٢٠ م²");
  });

  it("Acceptance 3: each correction increments case state_version", async () => {
    const { data: caseBefore } = await adminSupabase
      .from("decision_cases")
      .select("state_version")
      .eq("id", testCaseId)
      .single();

    const versionBefore = caseBefore!.state_version;

    await submitCorrection(
      testCaseId,
      testPropId,
      {
        field: "bedrooms",
        value: "4",
      },
      adminSupabase
    );

    const { data: caseAfter } = await adminSupabase
      .from("decision_cases")
      .select("state_version")
      .eq("id", testCaseId)
      .single();

    expect(caseAfter!.state_version).toBe(versionBefore + 1);
  });

  it("Acceptance 1: seeds conflict (url 140 vs image 125) -> choosing 125 moves field to known with user_stated and keeps originals", async () => {
    // Clean previous area_sqm facts for this clean conflict test
    await adminSupabase
      .from("property_facts")
      .delete()
      .eq("property_id", testPropId)
      .eq("field", "area_sqm");

    // Insert url fact: area_sqm = 140
    await adminSupabase.from("property_facts").insert({
      property_id: testPropId,
      field: "area_sqm",
      value: 140,
      raw_text: "140 م²",
      scope: "unit",
      source: "url",
      evidence_text: "المساحة 140 متر مربع",
      evidence_verified: true,
    });

    // Insert image fact: area_sqm = 125
    await adminSupabase.from("property_facts").insert({
      property_id: testPropId,
      field: "area_sqm",
      value: 125,
      raw_text: "125 م²",
      scope: "unit",
      source: "image",
      evidence_text: "المساحة الإجمالية 125م",
      evidence_verified: false,
    });

    // Fetch facts & resolve
    const { data: facts } = await adminSupabase
      .from("property_facts")
      .select("*")
      .eq("property_id", testPropId);

    const resolved = resolveFacts((facts as PropertyFact[]) || []);
    const areaResolution = resolved.fields.area_sqm;

    expect(areaResolution.status).toBe("conflicting");
    if (areaResolution.status === "conflicting") {
      expect(areaResolution.candidates.length).toBe(2);
      const values = areaResolution.candidates.map((c) => Number(c.value));
      expect(values).toContain(140);
      expect(values).toContain(125);
    }

    // Now choose 125
    const adoptRes = await submitCorrection(
      testCaseId,
      testPropId,
      {
        field: "area_sqm",
        value: "125",
      },
      adminSupabase
    );
    expect(adoptRes.success).toBe(true);

    // Verify all 3 rows still exist (url, image, user_correction)
    const { data: finalFacts } = await adminSupabase
      .from("property_facts")
      .select("*")
      .eq("property_id", testPropId)
      .eq("field", "area_sqm");

    expect(finalFacts?.length).toBe(3);
    const sources = finalFacts?.map((f) => f.source);
    expect(sources).toContain("url");
    expect(sources).toContain("image");
    expect(sources).toContain("user_correction");

    // Re-resolve: must now be known with user_stated and value 125
    const finalResolved = resolveFacts((finalFacts as PropertyFact[]) || []);
    expect(finalResolved.fields.area_sqm.status).toBe("known");
    if (finalResolved.fields.area_sqm.status === "known") {
      expect(Number(finalResolved.fields.area_sqm.value)).toBe(125);
      expect(finalResolved.fields.area_sqm.certainty).toBe("user_stated");
    }
  });

  it("Acceptance 4: foreign user gets 404; forged post rejected", async () => {
    // 1. Foreign user client (RLS returns no case) throws notFound (404)
    const foreignUserClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: new Error("Case not found or unauthorized") }),
          }),
        }),
      }),
    };

    await expect(
      submitCorrection(
        testCaseId,
        testPropId,
        { field: "area_sqm", value: "100" },
        foreignUserClient as unknown as SupabaseClient<Database>
      )
    ).rejects.toThrow();

    // 2. Forged property ID on a valid case returns form error
    const res = await submitCorrection(
      testCaseId,
      "00000000-0000-0000-0000-000000000000",
      {
        field: "area_sqm",
        value: "100",
      },
      adminSupabase
    );
    expect(res.errors?.form).toBeDefined();
  });
});
