import { describe, it, expect } from "vitest";
import { checkAndStartAnalysis } from "@/actions/preflight";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("Preflight Action - Acceptance 4: forced post rejection and server re-check", () => {
  it("Rejects forced post when case has blockers", async () => {
    // Mock client: user has access to case, but requirements are missing (NO_REQUIREMENTS blocker)
    const mockBlockedClient = {
      from: (table: string) => {
        if (table === "decision_cases") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: "case-blocked-1", status: "draft" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "requirements") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: null, // missing requirements!
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "properties") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({
                  data: [], // zero properties!
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
              single: async () => ({ data: null, error: null }),
            }),
          }),
        };
      },
    } as unknown as SupabaseClient<Database>;

    // Attempt to submit start analysis while blocked
    const result = await checkAndStartAnalysis(
      "case-blocked-1",
      undefined,
      mockBlockedClient
    );

    expect(result.ready).toBe(false);
    expect(result.errors?.form).toBeDefined();
    expect(result.errors?.form?.[0]).toContain("لم يتم تحديد احتياجات الشراء والميزانية بعد");
  });

  it("Accepts post and returns ready=true when case has zero blockers", async () => {
    const mockReadyClient = {
      from: (table: string) => {
        if (table === "decision_cases") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: "case-ready-1", status: "draft" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "requirements") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "req-1",
                    case_id: "case-ready-1",
                    max_budget_sar: 1000000,
                    purchase_method: "cash",
                    household_size: 4,
                    min_bedrooms: 3,
                    hard_constraints: [],
                    preferences: [],
                    important_locations: [],
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "properties") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({
                  data: [
                    {
                      id: "prop-ready-1",
                      title: "شقة الياسمين",
                      case_id: "case-ready-1",
                      input_mode: "manual",
                      extraction_runs: [{ status: "succeeded", started_at: new Date().toISOString() }],
                      property_facts: [
                        {
                          id: "f1",
                          property_id: "prop-ready-1",
                          field: "listing_price_sar",
                          value: 850000,
                          scope: "unit",
                          source: "manual",
                          evidence_text: null,
                          evidence_verified: false,
                        },
                        {
                          id: "f2",
                          property_id: "prop-ready-1",
                          field: "area_sqm",
                          value: 130,
                          scope: "unit",
                          source: "manual",
                          evidence_text: null,
                          evidence_verified: false,
                        },
                        {
                          id: "f3",
                          property_id: "prop-ready-1",
                          field: "bedrooms",
                          value: 3,
                          scope: "unit",
                          source: "manual",
                          evidence_text: null,
                          evidence_verified: false,
                        },
                      ],
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      },
    } as unknown as SupabaseClient<Database>;

    const result = await checkAndStartAnalysis(
      "case-ready-1",
      undefined,
      mockReadyClient
    );

    expect(result.ready).toBe(true);
    expect(result.message).toContain("الحالة مكتملة وجاهزة للتحليل");
  });

  it("Rejects post with 404 if user has no access to case", async () => {
    const mockUnauthorizedClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: null,
              error: new Error("Case not found or unauthorized"),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    await expect(
      checkAndStartAnalysis("case-foreign", undefined, mockUnauthorizedClient)
    ).rejects.toThrow();
  });
});
