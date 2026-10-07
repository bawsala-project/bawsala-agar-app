import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import ReassessPage from "./page";
import * as auth from "@/lib/auth";
import * as serverSupabase from "@/lib/supabase/server";
import * as analysisActions from "@/actions/analysis";

describe("ReassessPage Server Component (Acceptance 1, 3 & 4)", () => {
  const caseId = "test-case-reassess-101";
  const propId1 = "prop-reassess-1";
  const propId2 = "prop-reassess-2";

  it("Acceptance 4: renders 'نتائج إعادة التقييم بعد المعاينة الميدانية' with visual diff box, rating shift, and compare CTA", async () => {
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
        if (table === "properties") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({
                  data: [
                    {
                      id: propId1,
                      title: "شقة النرجس الفاخرة",
                      district: "النرجس",
                      listing_price_sar: 850000,
                      area_sqm: 140,
                      bedrooms: 3,
                      floor_no: 3,
                    },
                    {
                      id: propId2,
                      title: "شقة الملقا الهادئة",
                      district: "الملقا",
                      listing_price_sar: 920000,
                      area_sqm: 155,
                      bedrooms: 4,
                      floor_no: 1,
                    },
                  ],
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
                      data: [{ id: "run-committed-1", status: "committed" }],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "inspection_findings") {
          return {
            select: () => ({
              eq: async () => ({
                count: 3,
                error: null,
              }),
            }),
          };
        }
        if (table === "property_assessments") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: "asmt-reassessed-1",
                      property_id: propId1,
                      run_id: "run-committed-1",
                      fit_rating: "weak",
                      fit_summary: "انخفض التوافق إلى ضعيف بسبب تعطل المصعد",
                      visit_priority: "low",
                      price_per_sqm: 6071,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      },
    } as unknown as ReturnType<typeof serverSupabase.createClient>);

    vi.spyOn(analysisActions, "reassessPropertyAction").mockResolvedValue({
      success: true,
      diff: {
        previousFitRating: "partial",
        newFitRating: "weak",
        previousVisitPriority: "medium",
        newVisitPriority: "low",
        addedRisks: ["المصعد معطل بالكامل ويحتاج استبدال"],
        resolvedUnknowns: ["تم التأكد من وجود موقف خاص مظلل"],
        explanationAr: "أدى تعطل المصعد بالدور 3 إلى مخالفة شرط المصعد وتراجع التقييم لضعيف.",
      },
    });

    const jsx = await ReassessPage({
      params: { id: caseId },
      searchParams: { propertyId: propId1 },
    });
    const html = renderToString(jsx);

    // Page title and header
    expect(html).toContain("نتائج إعادة التقييم بعد المعاينة الميدانية");
    expect(html).toContain("شقة النرجس الفاخرة");

    // Visual diff box
    expect(html).toContain("ما الذي تغير بعد المعاينة الميدانية؟");
    expect(html).toContain("تغير درجة التوافق الإجمالية");
    expect(html).toContain("توافق جزئي");
    expect(html).toContain("توافق ضعيف");

    // Added risks and resolved unknowns
    expect(html).toContain("المصعد معطل بالكامل ويحتاج استبدال");
    expect(html).toContain("تم التأكد من وجود موقف خاص مظلل");
    expect(html).toContain("أدى تعطل المصعد بالدور 3 إلى مخالفة شرط المصعد");

    // Compare CTA linking to /compare
    expect(html).toContain("العودة إلى مقارنة الخيارات المحدّثة ←");
    expect(html).toContain(`/case/${caseId}/compare`);

    // Back to inspection link
    expect(html).toContain(`/case/${caseId}/inspection?propertyId=${propId1}`);
  });

  it("Acceptance 2: displays stale warning notice when state changed during reassessment", async () => {
    vi.spyOn(auth, "requireCase").mockResolvedValue({
      id: caseId,
      owner_id: "user-1",
      city: "الرياض",
      state_version: 2,
      status: "analyzed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    vi.spyOn(serverSupabase, "createClient").mockReturnValue({
      from: (table: string) => {
        if (table === "properties") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({
                  data: [
                    {
                      id: propId1,
                      title: "شقة النرجس",
                      district: "النرجس",
                      listing_price_sar: 850000,
                    },
                  ],
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
                      data: [{ id: "run-1", status: "committed" }],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "inspection_findings") {
          return {
            select: () => ({
              eq: async () => ({
                count: 1,
                error: null,
              }),
            }),
          };
        }
        if (table === "property_assessments") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      },
    } as unknown as ReturnType<typeof serverSupabase.createClient>);

    vi.spyOn(analysisActions, "reassessPropertyAction").mockResolvedValue({
      success: false,
      stale: true,
      messageAr: "تغيّرت بيانات أو اشتراطات العقار أثناء المعاينة. تم منع التعديل التلقائي لضمان الدقة.",
    });

    const jsx = await ReassessPage({
      params: { id: caseId },
      searchParams: { propertyId: propId1 },
    });
    const html = renderToString(jsx);

    expect(html).toContain("تنبيه: تزامن غير مكتمل (بيانات محدثة)");
    expect(html).toContain("تغيّرت بيانات أو اشتراطات العقار أثناء المعاينة");
  });

  it("Acceptance 5: displays empty state prompt when no inspection findings recorded yet", async () => {
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
        if (table === "properties") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({
                  data: [
                    {
                      id: propId1,
                      title: "شقة النرجس",
                      district: "النرجس",
                      listing_price_sar: 850000,
                    },
                  ],
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
                      data: [{ id: "run-1", status: "committed" }],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "inspection_findings") {
          return {
            select: () => ({
              eq: async () => ({
                count: 0,
                error: null,
              }),
            }),
          };
        }
        if (table === "property_assessments") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      },
    } as unknown as ReturnType<typeof serverSupabase.createClient>);

    const jsx = await ReassessPage({
      params: { id: caseId },
      searchParams: { propertyId: propId1 },
    });
    const html = renderToString(jsx);

    expect(html).toContain("لم تسجل أي نتائج فحص لهذا العقار حتى الآن");
    expect(html).toContain("الانتقال لقائمة الفحص الميداني");
    expect(html).toContain(`/case/${caseId}/inspection?propertyId=${propId1}`);
  });
});
