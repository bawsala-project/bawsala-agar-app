import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { formatSAR } from "@/lib/utils";

describe("Compare Page - Acceptance 2 & 3", () => {
  const caseId = "case-compare-test";

  it("Acceptance 3: Attempting to access /compare on a case with only 1 property redirects to /results?notice=insufficient_compare", async () => {
    const auth = await import("@/lib/auth");
    const serverSupabase = await import("@/lib/supabase/server");

    vi.spyOn(auth, "requireCase").mockResolvedValue({
      id: caseId,
      owner_id: "user-1",
      city: "الرياض",
      state_version: 1,
      status: "analyzed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    vi.spyOn(serverSupabase, "createClient").mockReturnValue({
      from: (table: string) => {
        if (table === "requirements") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { max_budget_sar: 900_000, min_bedrooms: 3 },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "analysis_runs") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({
                      data: [{ id: "run-single", status: "committed" }],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "property_assessments") {
          return {
            select: () => ({
              eq: async () => ({
                // Only 1 assessment!
                data: [
                  {
                    id: "asmt-1",
                    property_id: "prop-1",
                    fit_rating: "strong",
                    fit_summary: "عقار وحيد",
                    strengths: [],
                    risks: [],
                    key_unknowns: [],
                    visit_priority: "high",
                    visit_priority_reason: "ممتاز",
                    evidence_fields: [],
                    constraint_results: [],
                    price_per_sqm: 6000,
                    properties: {
                      id: "prop-1",
                      title: "عقار وحيد",
                      district: "الياسمين",
                      listing_price_sar: 800_000,
                    },
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return {};
      },
    } as unknown as ReturnType<typeof serverSupabase.createClient>);

    const ComparePage = (await import("./page")).default;

    let caughtError: unknown;
    try {
      await ComparePage({ params: { id: caseId } });
    } catch (err: unknown) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    const digest = (caughtError as { digest?: string }).digest || (caughtError as Error).message || "";
    expect(digest).toContain("NEXT_REDIRECT");
    expect(digest).toContain(`/case/${caseId}/results?notice=insufficient_compare`);
  });

  it("Acceptance 2: Multi-property comparison displays side-by-side cards with all required rows and mode banner", async () => {
    const auth = await import("@/lib/auth");
    const serverSupabase = await import("@/lib/supabase/server");

    vi.spyOn(auth, "requireCase").mockResolvedValue({
      id: caseId,
      owner_id: "user-1",
      city: "الرياض",
      state_version: 1,
      status: "analyzed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    vi.spyOn(serverSupabase, "createClient").mockReturnValue({
      from: (table: string) => {
        if (table === "requirements") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { max_budget_sar: 900_000, min_bedrooms: 3 },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "analysis_runs") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({
                      data: [{ id: "run-multi", status: "committed" }],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "property_assessments") {
          return {
            select: () => ({
              eq: async () => ({
                data: [
                  {
                    id: "asmt-1",
                    property_id: "prop-1",
                    fit_rating: "strong",
                    fit_summary: "مطابق تماماً",
                    strengths: ["سعر ممتاز"],
                    risks: [],
                    key_unknowns: [],
                    visit_priority: "high",
                    visit_priority_reason: "خيار أول",
                    evidence_fields: ["listing_price_sar", "area_sqm"],
                    constraint_results: [
                      { key: "budget", labelAr: "ضمن الميزانية", result: "pass", detailAr: "السعر ضمن الميزانية" },
                      { key: "bedrooms", labelAr: "غرف النوم", result: "pass", detailAr: "3 غرف" },
                    ],
                    price_per_sqm: 6000,
                    properties: {
                      id: "prop-1",
                      title: "شقة النرجس الذهبية",
                      district: "النرجس",
                      listing_price_sar: 800_000,
                      area_sqm: 130,
                      bedrooms: 3,
                    },
                  },
                  {
                    id: "asmt-2",
                    property_id: "prop-2",
                    fit_rating: "weak",
                    fit_summary: "تتجاوز الميزانية",
                    strengths: ["مساحة واسعة"],
                    risks: ["سعر مرتفع"],
                    key_unknowns: ["عمر العقار"],
                    visit_priority: "low",
                    visit_priority_reason: "فوق الميزانية",
                    evidence_fields: ["listing_price_sar", "area_sqm"],
                    constraint_results: [
                      { key: "budget", labelAr: "ضمن الميزانية", result: "fail", detailAr: "السعر يتجاوز الميزانية" },
                      { key: "bedrooms", labelAr: "غرف النوم", result: "pass", detailAr: "4 غرف" },
                    ],
                    price_per_sqm: 7500,
                    properties: {
                      id: "prop-2",
                      title: "شقة الملقا الفاخرة",
                      district: "الملقا",
                      listing_price_sar: 1_100_000,
                      area_sqm: 150,
                      bedrooms: 4,
                    },
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return {};
      },
    } as unknown as ReturnType<typeof serverSupabase.createClient>);

    const ComparePage = (await import("./page")).default;
    const jsx = await ComparePage({ params: { id: caseId } });
    const html = renderToString(jsx);

    // Mode banner
    expect(html).toContain("ترتيب مبني على مطابقة الشروط والبيانات المتاحة");

    // Side-by-side cards content
    expect(html).toContain("شقة النرجس الذهبية");
    expect(html).toContain("شقة الملقا الفاخرة");

    // Rank badges
    expect(html).toContain("#1");
    expect(html).toContain("#2");

    // Row 1: Fit rating & Visit priority
    expect(html).toContain("توافق قوي");
    expect(html).toContain("توافق ضعيف");
    expect(html).toContain("معاينة مرتفعة");
    expect(html).toContain("معاينة منخفضة");

    // Row 2: Price SAR & Price/m² & Delta vs budget
    expect(html).toContain(formatSAR(800_000));
    expect(html).toContain(formatSAR(1_100_000));
    expect(html).toContain("توفير"); // Savings for prop 1
    expect(html).toContain("يتجاوز الميزانية"); // Over budget for prop 2

    // Row 3: Area & Bedrooms
    expect(html).toContain("130 م²");
    expect(html).toContain("150 م²");
    expect(html).toContain("3 غرف نوم");
    expect(html).toContain("4 غرف نوم");

    // Row 4: Hard constraints summary
    expect(html).toContain("الشروط الملزمة");

    // Row 5: لماذا هذا الترتيب؟
    expect(html).toContain("لماذا هذا الترتيب؟");

    // Row 6: ما الذي قد يغيّر الترتيب؟
    expect(html).toContain("ما الذي قد يغيّر الترتيب؟");

    // Row 7: Action buttons linking to inspection
    expect(html).toContain(`/case/${caseId}/inspection?propertyId=prop-1`);
    expect(html).toContain(`/case/${caseId}/inspection?propertyId=prop-2`);

    // Back link
    expect(html).toContain("العودة إلى النتائج الفردية");
    expect(html).toContain(`/case/${caseId}/results`);
  });
});
