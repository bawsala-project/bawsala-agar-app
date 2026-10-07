import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { PropertyCard, type PropertyCardAssessment, type PropertyCardProperty } from "./property-card";
import { StepIndicator } from "../step-indicator";

describe("Results View & PropertyCard - Acceptance & Invariants", () => {
  const caseId = "case-test-123";

  const sampleWeakAssessment: PropertyCardAssessment = {
    id: "asmt-weak-1",
    property_id: "prop-overbudget-1",
    fit_rating: "weak",
    fit_summary: "العقار يتجاوز ميزانية المشتري القصوى ولا يتوفر به مصعد بالدور الثالث.",
    strengths: ["المساحة 160 م² ممتازة", "يتوفر 4 غرف نوم"],
    risks: ["السعر 1,100,000 ريال يتجاوز الميزانية", "الدور الثالث بدون مصعد"],
    key_unknowns: ["عمر العقار غير معروف"],
    visit_priority: "low",
    visit_priority_reason: "أولوية منخفضة لتجاوز الميزانية وغياب المصعد",
    evidence_fields: ["listing_price_sar", "floor_no", "elevator"],
    constraint_results: [
      {
        key: "budget",
        labelAr: "ضمن الميزانية",
        result: "fail",
        detailAr: "السعر (1,100,000 ر.س) يتجاوز الميزانية المحددة (900,000 ر.س)",
      },
      {
        key: "elevator_required",
        labelAr: "وجود مصعد",
        result: "fail",
        detailAr: "الشقة بالدور 3 ولا يتوفر مصعد في المبنى",
      },
    ],
    price_per_sqm: 6875,
  };

  const sampleWeakProperty: PropertyCardProperty = {
    id: "prop-overbudget-1",
    title: "شقة واسعة بالملقا",
    district: "الملقا",
    listing_price_sar: 1_100_000,
    source_url: "https://aqar.fm/listing/1",
    input_mode: "url",
    notes: null,
  };

  const sampleStrongAssessment: PropertyCardAssessment = {
    id: "asmt-strong-2",
    property_id: "prop-good-2",
    fit_rating: "strong",
    fit_summary: "شقة مطابقة للميزانية والمساحة وتتوفر بها كافة الشروط الأساسية.",
    strengths: ["السعر ضمن الميزانية", "المساحة 135 م²", "يتوفر مصعد وموقف خاص"],
    risks: ["ادعاء تشطيب ديلوكس غير موثق"],
    key_unknowns: ["عمر العقار"],
    visit_priority: "high",
    visit_priority_reason: "مطابقة ممتازة للشروط الأساسية",
    evidence_fields: ["listing_price_sar", "area_sqm", "bedrooms", "elevator", "private_parking"],
    constraint_results: [
      {
        key: "budget",
        labelAr: "ضمن الميزانية",
        result: "pass",
        detailAr: "السعر (850,000 ر.س) ضمن الميزانية",
      },
      {
        key: "bedrooms",
        labelAr: "غرف النوم",
        result: "pass",
        detailAr: "يتوفر 3 غرف نوم",
      },
    ],
    price_per_sqm: 6296,
  };

  const sampleStrongProperty: PropertyCardProperty = {
    id: "prop-good-2",
    title: "شقة راقية بحي النرجس",
    district: "النرجس",
    listing_price_sar: 850_000,
    source_url: "https://aqar.fm/listing/2",
    input_mode: "url",
    notes: null,
  };

  it("Acceptance 2: Property with failed constraint shows weak badge and low visit priority with exact approved Arabic text", () => {
    const html = renderToString(
      React.createElement(PropertyCard, {
        caseId,
        assessment: sampleWeakAssessment,
        property: sampleWeakProperty,
        resolvedPrice: 1_100_000,
        resolvedDistrict: "الملقا",
      })
    );

    // Fit rating badge
    expect(html).toContain("توافق ضعيف");

    // Visit priority title
    expect(html).toContain("أولوية المعاينة: منخفضة");

    // Exact approved Arabic text
    const exactApprovedLowText =
      "هذا العقار لا يتطابق جيدًا مع متطلباتك الحالية، لذلك قد لا تكون معاينته أولوية الآن. يمكنك مع ذلك فتح قائمة الزيارة إذا رغبت.";
    expect(html).toContain(exactApprovedLowText);
  });

  it("Acceptance 2b: Property with high visit priority shows exact approved Arabic advisory text", () => {
    const html = renderToString(
      React.createElement(PropertyCard, {
        caseId,
        assessment: sampleStrongAssessment,
        property: sampleStrongProperty,
        resolvedPrice: 850_000,
        resolvedDistrict: "النرجس",
      })
    );

    // Fit rating badge
    expect(html).toContain("توافق قوي");

    // Visit priority title
    expect(html).toContain("أولوية المعاينة: مرتفعة");

    // Exact approved Arabic text
    const exactApprovedHighText =
      "هذا العقار متوافق بدرجة جيدة مع متطلباتك الحالية، وقد تكون معاينته خطوة مفيدة للتحقق من النقاط التي لم تُحسم بعد.";
    expect(html).toContain(exactApprovedHighText);
  });

  it("Acceptance 3: The inspection button on a low priority property is clickable and links to /case/[id]/inspection?propertyId=...", () => {
    const html = renderToString(
      React.createElement(PropertyCard, {
        caseId,
        assessment: sampleWeakAssessment,
        property: sampleWeakProperty,
        resolvedPrice: 1_100_000,
        resolvedDistrict: "الملقا",
      })
    );

    // Link text
    expect(html).toContain("قائمة المعاينة الميدانية");

    // Target href
    const expectedHref = `/case/${caseId}/inspection?propertyId=${sampleWeakProperty.id}`;
    expect(html).toContain(expectedHref);
  });

  it("Displays property header with title, district, price (formatSAR) and price per m²", () => {
    const html = renderToString(
      React.createElement(PropertyCard, {
        caseId,
        assessment: sampleStrongAssessment,
        property: sampleStrongProperty,
        resolvedPrice: 850_000,
        resolvedDistrict: "النرجس",
      })
    );

    expect(html).toContain("شقة راقية بحي النرجس");
    expect(html).toContain("النرجس");
    expect(html).toContain("850,000"); // formatted SAR
    expect(html).toContain(Math.round(sampleStrongAssessment.price_per_sqm!).toLocaleString("ar-SA")); // price per m²
    expect(html).toContain("ر.س / م²");
  });

  it("Renders all required collapsible sections (الشروط الأساسية، نقاط القوة، المخاطر، معلومات غير محسومة، الأدلة)", () => {
    const html = renderToString(
      React.createElement(PropertyCard, {
        caseId,
        assessment: sampleStrongAssessment,
        property: sampleStrongProperty,
        resolvedPrice: 850_000,
        resolvedDistrict: "النرجس",
      })
    );

    expect(html).toContain("الشروط الأساسية");
    expect(html).toContain("نقاط القوة");
    expect(html).toContain("المخاطر والتنبيهات");
    expect(html).toContain("معلومات غير محسومة");
    expect(html).toContain("الأدلة المعتمدة");

    // Pills of evidence fields mapped to Arabic
    expect(html).toContain("سعر العرض (ريال)");
    expect(html).toContain("المساحة (م²)");
    expect(html).toContain("غرف النوم");
    expect(html).toContain("مصعد");
  });

  it("Step indicator includes step 4 'النتائج' linking to /case/[id]/results", () => {
    const html = renderToString(React.createElement(StepIndicator, { caseId }));

    expect(html).toContain("النتائج");
    expect(html).toContain(`/case/${caseId}/results`);
  });

  it("Acceptance 4: A case with 1 property displays assessment and hides comparison CTA", async () => {
    // Dynamic import to allow per-test mocking if needed or render page
    const { vi } = await import("vitest");
    const auth = await import("@/lib/auth");
    const serverSupabase = await import("@/lib/supabase/server");

    vi.spyOn(auth, "getSessionUser").mockResolvedValue(null);
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
        if (table === "property_assessments") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({
                  data: [
                    {
                      id: "asmt-1",
                      property_id: "prop-1",
                      run_id: "run-1",
                      fit_rating: "strong",
                      fit_summary: "ملخص العقار الوحيد",
                      strengths: ["سعر مناسب"],
                      risks: [],
                      key_unknowns: [],
                      visit_priority: "high",
                      visit_priority_reason: "مطابق تماماً",
                      evidence_fields: ["listing_price_sar"],
                      constraint_results: [],
                      price_per_sqm: 5000,
                      properties: {
                        id: "prop-1",
                        title: "شقة مفردة",
                        district: "الياسمين",
                        listing_price_sar: 750000,
                        input_mode: "manual",
                        property_facts: [],
                      },
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      },
    } as unknown as ReturnType<typeof serverSupabase.createClient>);

    const ResultsPage = (await import("./page")).default;
    const jsx = await ResultsPage({ params: { id: caseId } });
    const html = renderToString(jsx);

    // Shows the property
    expect(html).toContain("شقة مفردة");
    expect(html).toContain("عقار محلل");

    // HIDES comparison CTA
    expect(html).not.toContain("مقارنة الخيارات");
    expect(html).not.toContain(`/case/${caseId}/compare`);
  });

  it("Acceptance 5: A case with 2+ properties displays comparison CTA linking to /case/[id]/compare", async () => {
    const { vi } = await import("vitest");
    const auth = await import("@/lib/auth");
    const serverSupabase = await import("@/lib/supabase/server");

    vi.spyOn(auth, "getSessionUser").mockResolvedValue(null);
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
        if (table === "analysis_runs") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({
                      data: [{ id: "run-2", status: "committed" }],
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
              eq: () => ({
                order: async () => ({
                  data: [
                    {
                      id: "asmt-1",
                      property_id: "prop-1",
                      run_id: "run-2",
                      fit_rating: "strong",
                      fit_summary: "ملخص عقار 1",
                      strengths: [],
                      risks: [],
                      key_unknowns: [],
                      visit_priority: "high",
                      visit_priority_reason: "ممتاز",
                      evidence_fields: [],
                      constraint_results: [],
                      price_per_sqm: 5000,
                      properties: {
                        id: "prop-1",
                        title: "العقار الأول",
                        district: "النرجس",
                        listing_price_sar: 800000,
                        input_mode: "manual",
                        property_facts: [],
                      },
                    },
                    {
                      id: "asmt-2",
                      property_id: "prop-2",
                      run_id: "run-2",
                      fit_rating: "weak",
                      fit_summary: "ملخص عقار 2",
                      strengths: [],
                      risks: [],
                      key_unknowns: [],
                      visit_priority: "low",
                      visit_priority_reason: "غير مطابق",
                      evidence_fields: [],
                      constraint_results: [],
                      price_per_sqm: 6000,
                      properties: {
                        id: "prop-2",
                        title: "العقار الثاني",
                        district: "الملقا",
                        listing_price_sar: 950000,
                        input_mode: "manual",
                        property_facts: [],
                      },
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      },
    } as unknown as ReturnType<typeof serverSupabase.createClient>);

    const ResultsPage = (await import("./page")).default;
    const jsx = await ResultsPage({ params: { id: caseId } });
    const html = renderToString(jsx);

    // Shows 2 properties
    expect(html).toContain("العقار الأول");
    expect(html).toContain("العقار الثاني");
    expect(html).toContain("عقارات محللة");

    // SHOWS comparison CTA with count
    expect(html).toContain("مقارنة الخيارات (2 عقارات)");
    expect(html).toContain(`/case/${caseId}/compare`);
  });
});
