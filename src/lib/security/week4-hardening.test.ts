import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const state = vi.hoisted(() => ({
  client: null as unknown,
  ip: "203.0.113.10",
  modelOutput: {} as Record<string, unknown>,
}));

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
vi.mock("@/lib/ai/client", async () => {
  const { MockLanguageModelV4 } = await import("ai/test");
  return {
    analysisModel: new MockLanguageModelV4({
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
import { sanitizeModelOutput, sanitizeExtractionOutput } from "@/lib/security/authority-firewall";
import {
  RATE_LIMIT_MESSAGE,
  checkRateLimit,
  enforceRateLimit,
  resetRateLimits,
} from "@/lib/security/rate-limit";
import { ANALYSIS_RUNTIME_VERSION } from "@/lib/ai/version";
import { initiateCheckoutAction } from "@/actions/payments";
import { startAnalysis } from "@/actions/analysis";
import { linkGuestCasesToUser } from "@/lib/auth/link";
import { signInWithOtpAction } from "@/actions/auth";
import { settlePayment } from "@/lib/payments/settle";
import { MockPaymentProvider } from "@/lib/payments/mock";
import { loadPreflightData } from "@/lib/preflight/load";
import { evaluatePreflight } from "@/lib/preflight/evaluate";
import { loadDashboardCases } from "@/lib/dashboard/cases";

const validAssessment = {
  fit_rating: "strong",
  fit_summary: "العقار يناسب الميزانية والمساحة وعدد الغرف المطلوبة",
  strengths: ["السعر ضمن الميزانية"],
  risks: [],
  key_unknowns: [],
  visit_priority: "high",
  visit_priority_reason: "يوصى بالمعاينة الميدانية",
  evidence_fields: ["listing_price_sar", "area_sqm", "bedrooms"],
};

const forgedAuthority = {
  payment_status: "paid",
  state_version: 999,
  case_epoch: 42,
  active: true,
  owner_id: "00000000-0000-0000-0000-000000000000",
  status: "committed",
};

function redirectTarget(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  expect(message.startsWith("REDIRECT:")).toBe(true);
  return message.slice("REDIRECT:".length);
}

describe("Model-authority firewall", () => {
  it("strips forged authority keys, including nested ones, and logs a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const clean = sanitizeModelOutput({ ...validAssessment, ...forgedAuthority });

    for (const key of Object.keys(forgedAuthority)) {
      expect(clean).not.toHaveProperty(key);
    }
    expect(clean.fit_rating).toBe("strong");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("payment_status");
    warn.mockRestore();
  });

  it("does not warn on clean output and still rejects schema violations", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(() => sanitizeModelOutput(validAssessment)).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
    expect(() => sanitizeModelOutput({ ...validAssessment, fit_rating: "paid" })).toThrow();
    expect(() => sanitizeModelOutput("not an object")).toThrow();
    warn.mockRestore();
  });

  it("inspects raw text output before schema parsing and drops forged keys in extraction", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const rawWithAuthority = JSON.stringify({
      ...validAssessment,
      ...forgedAuthority,
    });

    const clean = sanitizeModelOutput(validAssessment, rawWithAuthority);
    expect(clean.fit_rating).toBe("strong");
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0][0])).toContain("payment_status");

    // Extraction firewall test
    const rawExtractionWithAuthority = JSON.stringify({
      facts: [{ field: "area_sqm", raw: "120", evidence: "120 م²" }],
      payment_status: "paid",
      state_version: 999,
    });
    const extractionClean = sanitizeExtractionOutput(
      { facts: [{ field: "area_sqm", raw: "120", evidence: "120 م²" }] },
      rawExtractionWithAuthority
    );
    expect(extractionClean.facts).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(2);

    warn.mockRestore();
  });
});

describe("Endpoint rate limiter", () => {
  beforeEach(() => {
    resetRateLimits();
    state.client = null;
    state.ip = "203.0.113.20";
  });

  it("blocks the 4th signInWithOtpAction within 15 minutes with rate limit error", async () => {
    const fakeClient = {
      auth: {
        signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      },
    };
    state.client = fakeClient;

    for (let i = 0; i < 3; i++) {
      const res = await signInWithOtpAction("user@example.com");
      expect(res.success).toBe(true);
    }

    const fourth = await signInWithOtpAction("user@example.com");
    expect(fourth.success).toBe(false);
    expect(fourth.error).toBe(RATE_LIMIT_MESSAGE);
  });

  it("blocks the 6th extraction within 10 minutes with 429 and the Arabic message", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await enforceRateLimit("extract")).allowed).toBe(true);
    }
    const sixth = await enforceRateLimit("extract");

    expect(sixth.allowed).toBe(false);
    if (!sixth.allowed) {
      expect(sixth.status).toBe(429);
      expect(sixth.message).toBe(RATE_LIMIT_MESSAGE);
      expect(sixth.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("slides the window: requests are allowed again after the window passes", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("extract", ["ip:a"], t0 + i).allowed).toBe(true);
    }
    expect(checkRateLimit("extract", ["ip:a"], t0 + 9 * 60_000).allowed).toBe(false);
    expect(checkRateLimit("extract", ["ip:a"], t0 + 10 * 60_000 + 5).allowed).toBe(true);
  });

  it("applies the analyze and checkout limits of 10 per hour, tracked per action and identity", () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit("analyze", ["ip:b"], i).allowed).toBe(true);
      expect(checkRateLimit("checkout", ["ip:b"], i).allowed).toBe(true);
    }
    expect(checkRateLimit("analyze", ["ip:b"], 11).allowed).toBe(false);
    expect(checkRateLimit("checkout", ["ip:b"], 11).allowed).toBe(false);
    expect(checkRateLimit("analyze", ["ip:other"], 11).allowed).toBe(true);
  });

  it("limits by session even when the IP changes", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("extract", ["ip:x1", "session:s1"], i);
    }
    expect(checkRateLimit("extract", ["ip:x2", "session:s1"], 10).allowed).toBe(false);
  });
});

describe("Week 4 end-to-end: guest -> preflight -> checkout -> paid analysis -> permanent account -> dashboard", () => {
  const password = "Hardening-Test-1!";
  const stamp = Date.now();
  const permanentEmail = `hardening-${stamp}@bawsala.local`;
  let guestClient: SupabaseClient<Database>;
  let guestId = "";
  let permanentId = "";
  let caseId = "";

  function freshClient() {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }

  beforeAll(async () => {
    guestClient = freshClient();
    const { data, error } = await guestClient.auth.signInAnonymously();
    if (error || !data.user) throw error ?? new Error("anonymous sign-in failed");
    guestId = data.user.id;

    const { data: permanent, error: permErr } = await adminSupabase.auth.admin.createUser({
      email: permanentEmail,
      password,
      email_confirm: true,
    });
    if (permErr || !permanent.user) throw permErr ?? new Error("createUser failed");
    permanentId = permanent.user.id;

    const { data: created, error: caseErr } = await adminSupabase
      .from("decision_cases")
      .insert({ city: "الرياض", owner_id: guestId, status: "properties_complete" })
      .select("id")
      .single();
    if (caseErr || !created) throw caseErr ?? new Error("case insert failed");
    caseId = created.id;

    await adminSupabase.from("requirements").insert({
      case_id: caseId,
      max_budget_sar: 800000,
      purchase_method: "cash",
      household_size: 4,
      min_bedrooms: 3,
      min_area_sqm: 100,
    });

    const { data: prop, error: propErr } = await adminSupabase
      .from("properties")
      .insert({ case_id: caseId, input_mode: "manual", title: "شقة الياسمين" })
      .select("id")
      .single();
    if (propErr || !prop) throw propErr ?? new Error("property insert failed");

    const facts = [
      { field: "listing_price_sar", value: 700000 },
      { field: "area_sqm", value: 130 },
      { field: "bedrooms", value: 3 },
    ];
    const { error: factsErr } = await adminSupabase
      .from("property_facts")
      .insert(facts.map((f) => ({ ...f, property_id: prop.id, scope: "unit", source: "manual" })));
    if (factsErr) throw factsErr;

    state.client = guestClient;
    state.ip = "203.0.113.30";
    state.modelOutput = { ...validAssessment, ...forgedAuthority };
  });

  afterAll(async () => {
    if (caseId) await adminSupabase.from("decision_cases").delete().eq("id", caseId);
    for (const id of [guestId, permanentId].filter(Boolean)) {
      await adminSupabase.auth.admin.deleteUser(id);
    }
  });

  it("runs the full loop and records the runtime version, ignoring forged model authority", async () => {
    resetRateLimits();

    // 1. Preflight is ready
    const preflight = evaluatePreflight(await loadPreflightData(caseId, guestClient));
    expect(preflight.ready).toBe(true);

    // Analysis is gated until payment is settled
    const gated = await startAnalysis(caseId);
    expect(gated.success).toBe(false);
    expect(gated.redirectTo).toBe(`/case/${caseId}/checkout`);

    // 2. Checkout of 10 SAR creates the payment and expected effect
    const checkoutError = await initiateCheckoutAction(caseId).then(
      () => null,
      (e: unknown) => e
    );
    const callbackUrl = new URL(redirectTarget(checkoutError), "http://localhost");
    expect(callbackUrl.pathname).toBe("/api/payments/mock-callback");
    const key = callbackUrl.searchParams.get("key")!;

    const { data: initiated } = await adminSupabase
      .from("payments")
      .select("status, amount_sar, currency")
      .eq("idempotency_key", key)
      .single();
    expect(initiated).toMatchObject({ status: "initiated", currency: "SAR" });
    expect(Number(initiated!.amount_sar)).toBe(10);

    // 3. Reconcile: the provider's actual effect matches the expected effect
    const verified = await new MockPaymentProvider().verifyWebhook({
      eventId: `evt_${stamp}`,
      caseId,
      amountSar: 10,
    });
    const settled = await settlePayment(key, verified);
    expect(settled).toEqual({ outcome: "paid", caseId });

    const { data: operation } = await adminSupabase
      .from("case_operations")
      .select("effect_status")
      .eq("idempotency_key", key)
      .single();
    expect(operation!.effect_status).toBe("matched");

    // 4. Results unlocked: analysis starts and commits
    const { data: before } = await adminSupabase
      .from("decision_cases")
      .select("owner_id, state_version")
      .eq("id", caseId)
      .single();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const analysisError = await startAnalysis(caseId).then(
      () => null,
      (e: unknown) => e
    );
    warn.mockRestore();
    expect(redirectTarget(analysisError)).toBe(`/case/${caseId}/results`);

    const { data: run } = await adminSupabase
      .from("analysis_runs")
      .select("status, analysis_runtime_version")
      .eq("case_id", caseId)
      .eq("status", "committed")
      .single();
    expect(run!.analysis_runtime_version).toBe(ANALYSIS_RUNTIME_VERSION);

    // Forged authority fields did not alter any stored state
    const { data: after } = await adminSupabase
      .from("decision_cases")
      .select("owner_id, state_version")
      .eq("id", caseId)
      .single();
    expect(after).toEqual(before);
    expect(after!.owner_id).toBe(guestId);
    const { data: payments } = await adminSupabase
      .from("payments")
      .select("id, status")
      .eq("case_id", caseId);
    expect(payments).toHaveLength(1);
    expect(payments![0].status).toBe("paid");

    // 5. Link the guest session to the permanent account
    const linked = await linkGuestCasesToUser(permanentId, guestClient);
    expect(linked).toEqual({ linked: 1 });

    // 6. The permanent account sees the case on its dashboard
    const permanentClient = freshClient();
    const { error: signInErr } = await permanentClient.auth.signInWithPassword({
      email: permanentEmail,
      password,
    });
    expect(signInErr).toBeNull();
    const dashboard = await loadDashboardCases(permanentClient);
    expect(dashboard.map((c) => c.id)).toContain(caseId);
  });
});
