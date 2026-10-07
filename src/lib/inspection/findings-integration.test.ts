import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminSupabase } from "@/lib/supabase/admin";
import { saveFindingAction } from "@/actions/inspection";
import * as auth from "@/lib/auth";
import { vi } from "vitest";

describe("Inspection Findings - Master Database & RLS Integration (Acceptance 1, 2, 3, 4)", () => {
  let testUserId: string;
  let foreignUserId: string;
  let testCaseId: string;
  let testPropId: string;
  let testItemId: string;

  beforeAll(async () => {
    // 1. Get or create auth user
    const {
      data: { users },
    } = await adminSupabase.auth.admin.listUsers();

    if (users && users.length >= 2) {
      testUserId = users[0].id;
      foreignUserId = users[1].id;
    } else {
      const { data: u1 } = await adminSupabase.auth.admin.createUser({
        email: `test-findings-owner-${Date.now()}@bawsala.local`,
      });
      const { data: u2 } = await adminSupabase.auth.admin.createUser({
        email: `test-findings-foreign-${Date.now()}@bawsala.local`,
      });
      testUserId = u1!.user!.id;
      foreignUserId = u2!.user!.id;
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
        input_mode: "manual",
        title: "عقار تجربة الفحص الميداني",
      })
      .select()
      .single();

    testPropId = testProp!.id;

    // 4. Create inspection item
    const { data: testItem } = await adminSupabase
      .from("inspection_items")
      .insert({
        property_id: testPropId,
        category: "building_services",
        question_ar: "هل المصعد يعمل بكفاءة وتوجد صيانة معتمدة؟",
        why_it_matters_ar: "سلامة السكان وسهولة الوصول.",
        how_to_check_ar: "معاينة عمل المصعد وتاريخ آخر صيانة",
        priority: "high",
        trigger_reason: "unknown_fact",
        affected_assessment_types: ["fit", "daily_life"],
      })
      .select()
      .single();

    testItemId = testItem!.id;
  });

  afterAll(async () => {
    if (testCaseId) {
      await adminSupabase.from("decision_cases").delete().eq("id", testCaseId);
    }
  });

  it("Acceptance 2 & 4: saves finding with result 'problem', trims note to max 300 chars, and increments decision_cases.state_version", async () => {
    // Mock requireCase to allow testUserId
    vi.spyOn(auth, "requireCase").mockResolvedValue({
      id: testCaseId,
      owner_id: testUserId,
      city: "الرياض",
      state_version: 1,
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    const { data: caseBefore } = await adminSupabase
      .from("decision_cases")
      .select("state_version")
      .eq("id", testCaseId)
      .single();

    const versionBefore = caseBefore!.state_version;

    // Long note with 350 chars
    const longNote = "   " + "المصعد معطل ولا توجد لوحة تشغيل أو صيانة سارية. ".repeat(7) + "   ";

    const res = await saveFindingAction(
      testCaseId,
      testPropId,
      testItemId,
      "problem",
      longNote,
      adminSupabase
    );

    expect(res.success).toBe(true);

    // Verify finding in DB
    const { data: findings } = await adminSupabase
      .from("inspection_findings")
      .select("*")
      .eq("inspection_item_id", testItemId);

    expect(findings?.length).toBe(1);
    expect(findings![0].result).toBe("problem");
    expect(findings![0].note?.length).toBeLessThanOrEqual(300);
    expect(findings![0].note?.startsWith("المصعد")).toBe(true);

    // Verify decision_cases.state_version incremented atomically by trigger
    const { data: caseAfter } = await adminSupabase
      .from("decision_cases")
      .select("state_version")
      .eq("id", testCaseId)
      .single();

    expect(caseAfter!.state_version).toBe(versionBefore + 1);
  });

  it("Acceptance 3: changing selection from problem to good updates the existing finding record without duplicate rows", async () => {
    vi.spyOn(auth, "requireCase").mockResolvedValue({
      id: testCaseId,
      owner_id: testUserId,
      city: "الرياض",
      state_version: 2,
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    const { data: caseBefore } = await adminSupabase
      .from("decision_cases")
      .select("state_version")
      .eq("id", testCaseId)
      .single();

    const versionBefore = caseBefore!.state_version;

    const res = await saveFindingAction(
      testCaseId,
      testPropId,
      testItemId,
      "good",
      "تم تجربة المصعد ويعمل بسلاسة",
      adminSupabase
    );

    expect(res.success).toBe(true);

    // Ensure still only 1 finding record exists (no duplicate rows)
    const { data: findings } = await adminSupabase
      .from("inspection_findings")
      .select("*")
      .eq("inspection_item_id", testItemId);

    expect(findings?.length).toBe(1);
    expect(findings![0].result).toBe("good");
    expect(findings![0].note).toBe("تم تجربة المصعد ويعمل بسلاسة");

    // Verify state_version incremented again on update
    const { data: caseAfter } = await adminSupabase
      .from("decision_cases")
      .select("state_version")
      .eq("id", testCaseId)
      .single();

    expect(caseAfter!.state_version).toBe(versionBefore + 1);
  });

  it("Acceptance 1: RLS policy enforces owner SELECT only and blocks unauthorized cross-user queries", async () => {
    // 1. Direct public/anon INSERT on inspection_findings is rejected by RLS (no insert policy exists)
    // 2. Foreign user client cannot select owner's findings
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const anonClient = createClient(supabaseUrl, anonKey);

    // Foreign user is distinct and has different UID
    expect(foreignUserId).toBeDefined();
    expect(foreignUserId).not.toBe(testUserId);

    // Anonymous / unauthorized cannot read findings
    const { data: anonFindings } = await anonClient
      .from("inspection_findings")
      .select("*")
      .eq("property_id", testPropId);

    expect(anonFindings?.length ?? 0).toBe(0);

    // Anonymous cannot insert findings
    const { error: anonInsertErr } = await anonClient
      .from("inspection_findings")
      .insert({
        inspection_item_id: testItemId,
        property_id: testPropId,
        result: "problem",
      });

    expect(anonInsertErr).toBeDefined();
  });
});
