import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { adminSupabase } from "@/lib/supabase/admin";
import { requireCase } from "@/lib/auth";
import { softDeleteCaseAction } from "@/actions/cases";
import { caseOpenPath, deriveCaseStatus, loadDashboardCases } from "@/lib/dashboard/cases";
import type { Database } from "@/types/database";

describe("deriveCaseStatus and caseOpenPath", () => {
  it("derives the four dashboard statuses", () => {
    const base = { caseStatus: "needs_complete", analyzed: false, inspectionComplete: false };
    expect(deriveCaseStatus(base)).toBe("draft");
    expect(deriveCaseStatus({ ...base, caseStatus: "properties_complete" })).toBe("ready");
    expect(deriveCaseStatus({ ...base, analyzed: true })).toBe("analyzed");
    expect(deriveCaseStatus({ ...base, analyzed: true, inspectionComplete: true })).toBe("inspected");
  });

  it("routes analyzed cases to results and others to their next step", () => {
    expect(caseOpenPath("c1", "analyzed", "properties_complete")).toBe("/case/c1/results");
    expect(caseOpenPath("c1", "inspected", "properties_complete")).toBe("/case/c1/results");
    expect(caseOpenPath("c1", "ready", "properties_complete")).toBe("/case/c1/preflight");
    expect(caseOpenPath("c1", "draft", "needs_complete")).toBe("/case/c1/properties");
    expect(caseOpenPath("c1", "draft", "draft")).toBe("/case/c1/needs");
  });
});

describe("Dashboard cross-tenant isolation (RLS)", () => {
  const password = "Isolation-Test-1!";
  const stamp = Date.now();
  const emails = [`dash-a-${stamp}@bawsala.local`, `dash-b-${stamp}@bawsala.local`];
  const userIds: string[] = [];
  const clients: SupabaseClient<Database>[] = [];
  let caseA = "";
  let caseB = "";

  async function signedInClient(email: string) {
    const client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return client;
  }

  beforeAll(async () => {
    for (const email of emails) {
      const { data, error } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error || !data.user) throw error ?? new Error("createUser failed");
      userIds.push(data.user.id);
      clients.push(await signedInClient(email));
    }

    const inserted = await Promise.all(
      userIds.map((owner_id) =>
        adminSupabase.from("decision_cases").insert({ city: "الرياض", owner_id }).select("id").single()
      )
    );
    caseA = inserted[0].data!.id;
    caseB = inserted[1].data!.id;
  });

  afterAll(async () => {
    await adminSupabase.from("decision_cases").delete().in("id", [caseA, caseB].filter(Boolean));
    for (const id of userIds) {
      await adminSupabase.auth.admin.deleteUser(id);
    }
  });

  it("lists only the signed-in user's own cases", async () => {
    const [forA, forB] = await Promise.all([
      loadDashboardCases(clients[0]),
      loadDashboardCases(clients[1]),
    ]);

    expect(forA.map((c) => c.id)).toEqual([caseA]);
    expect(forB.map((c) => c.id)).toEqual([caseB]);
  });

  it("prevents user B from deleting user A's case", async () => {
    await expect(softDeleteCaseAction(caseA, clients[1])).rejects.toThrow();

    const { data } = await adminSupabase
      .from("decision_cases")
      .select("deleted_at")
      .eq("id", caseA)
      .single();
    expect(data?.deleted_at).toBeNull();
  });

  it("hides a soft-deleted case immediately and blocks further access", async () => {
    await softDeleteCaseAction(caseA, clients[0]);

    expect(await loadDashboardCases(clients[0])).toEqual([]);
    await expect(requireCase(caseA, clients[0])).rejects.toThrow();
    // The other tenant is unaffected
    expect((await loadDashboardCases(clients[1])).map((c) => c.id)).toEqual([caseB]);
  });
});
