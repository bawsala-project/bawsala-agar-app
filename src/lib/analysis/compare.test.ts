import { describe, it, expect } from "vitest";
import { resolveComparison, type PropertyAssessmentWithProperty } from "./compare";
import type { RequirementsRow } from "./constraints";

describe("Comparison Engine (compare.ts) - Acceptance 1", () => {
  const sampleRequirements: RequirementsRow = {
    id: "req-1",
    case_id: "case-1",
    max_budget_sar: 900_000,
    household_size: 4,
    min_bedrooms: 3,
    min_area_sqm: 120,
    purchase_method: "cash",
    hard_constraints: [
      { key: "elevator_required", label: "وجود مصعد" },
    ],
    preferences: [],
    important_locations: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const propertyA: PropertyAssessmentWithProperty = {
    id: "asmt-a",
    property_id: "prop-a",
    fit_rating: "strong",
    fit_summary: "مطابق تماماً لجميع الشروط والميزانية",
    strengths: ["سعر مناسب 800 ألف", "مساحة واسعة 130 م²"],
    risks: [],
    key_unknowns: [],
    visit_priority: "high",
    visit_priority_reason: "خيار مثالي",
    evidence_fields: ["listing_price_sar", "area_sqm", "bedrooms", "elevator"],
    constraint_results: [
      { key: "budget", labelAr: "ضمن الميزانية", result: "pass", detailAr: "السعر 800,000 ضمن الميزانية" },
      { key: "bedrooms", labelAr: "غرف النوم", result: "pass", detailAr: "3 غرف نوم" },
      { key: "min_area", labelAr: "الحد الأدنى للمساحة", result: "pass", detailAr: "المساحة 130 م²" },
      { key: "elevator_required", labelAr: "وجود مصعد", result: "pass", detailAr: "يتوفر مصعد" },
    ],
    price_per_sqm: 6153,
    property: {
      id: "prop-a",
      title: "شقة النرجس المميزة",
      district: "النرجس",
      listing_price_sar: 800_000,
      area_sqm: 130,
      bedrooms: 3,
      input_mode: "manual",
    },
  };

  const propertyB: PropertyAssessmentWithProperty = {
    id: "asmt-b",
    property_id: "prop-b",
    fit_rating: "weak",
    fit_summary: "يتجاوز الميزانية بشكل كبير",
    strengths: ["مساحة 150 م²"],
    risks: ["السعر 1.1 مليون يتجاوز الميزانية"],
    key_unknowns: [],
    visit_priority: "low",
    visit_priority_reason: "تجاوز الميزانية",
    evidence_fields: ["listing_price_sar", "area_sqm", "bedrooms"],
    constraint_results: [
      { key: "budget", labelAr: "ضمن الميزانية", result: "fail", detailAr: "السعر (1,100,000 ر.س) يتجاوز الميزانية المحددة (900,000 ر.س)" },
      { key: "bedrooms", labelAr: "غرف النوم", result: "pass", detailAr: "4 غرف نوم" },
      { key: "min_area", labelAr: "الحد الأدنى للمساحة", result: "pass", detailAr: "المساحة 150 م²" },
      { key: "elevator_required", labelAr: "وجود مصعد", result: "pass", detailAr: "يتوفر مصعد" },
    ],
    price_per_sqm: 7333,
    property: {
      id: "prop-b",
      title: "شقة الملقا الفاخرة",
      district: "الملقا",
      listing_price_sar: 1_100_000,
      area_sqm: 150,
      bedrooms: 4,
      input_mode: "manual",
    },
  };

  it("Test 1: 1 property returns mode = 'insufficient'", () => {
    const result = resolveComparison([propertyA], sampleRequirements);

    expect(result.mode).toBe("insufficient");
    expect(result.items.length).toBe(1);
    expect(result.items[0].rank).toBeNull();
    expect(result.summaryAr).toBe("البيانات المتاحة لا تكفي لمقارنة عادلة بين الخيارات");
  });

  it("Test 2: Property A (pass all constraints, 800k) vs Property B (fail budget, 1.1M) -> A ranks #1, B ranks #2 (weak)", () => {
    const result = resolveComparison([propertyB, propertyA], sampleRequirements);

    expect(result.mode).toBe("ranked");
    expect(result.items.length).toBe(2);

    // Property A is Rank #1
    const rank1 = result.items[0];
    expect(rank1.property_id).toBe("prop-a");
    expect(rank1.rank).toBe(1);
    expect(rank1.fit_rating).toBe("strong");
    expect(rank1.constraint_summary.fail).toBe(0);

    // Property B is Rank #2 with weak rating
    const rank2 = result.items[1];
    expect(rank2.property_id).toBe("prop-b");
    expect(rank2.rank).toBe(2);
    expect(rank2.fit_rating).toBe("weak");
    expect(rank2.constraint_summary.fail).toBe(1);
    expect(rank2.main_tradeoff_ar).toContain("يتجاوز الميزانية");
  });

  it("Test 3: Property A and Property B virtually tied -> close_options = true with explicit trade-off", () => {
    // Property C: 820k, 130 sqm, pass all constraints, strong fit (within 2.5% of Property A 800k)
    const propertyC: PropertyAssessmentWithProperty = {
      id: "asmt-c",
      property_id: "prop-c",
      fit_rating: "strong",
      fit_summary: "مطابق للشروط والميزانية",
      strengths: ["موقع ممتاز بحي الياسمين", "سعر منافس 820 ألف"],
      risks: ["إطلالة جانبية"],
      key_unknowns: [],
      visit_priority: "high",
      visit_priority_reason: "خيار قوي",
      evidence_fields: ["listing_price_sar", "area_sqm", "bedrooms", "elevator"],
      constraint_results: [
        { key: "budget", labelAr: "ضمن الميزانية", result: "pass", detailAr: "السعر 820,000 ضمن الميزانية" },
        { key: "bedrooms", labelAr: "غرف النوم", result: "pass", detailAr: "3 غرف نوم" },
        { key: "min_area", labelAr: "الحد الأدنى للمساحة", result: "pass", detailAr: "المساحة 130 م²" },
        { key: "elevator_required", labelAr: "وجود مصعد", result: "pass", detailAr: "يتوفر مصعد" },
      ],
      price_per_sqm: 6307,
      property: {
        id: "prop-c",
        title: "شقة الياسمين الحديثة",
        district: "الياسمين",
        listing_price_sar: 820_000,
        area_sqm: 130,
        bedrooms: 3,
        input_mode: "manual",
      },
    };

    const result = resolveComparison([propertyA, propertyC], sampleRequirements);

    expect(result.mode).toBe("ranked");
    expect(result.close_options).toBe(true);
    expect(result.tradeoff_summary_ar).toBeDefined();

    // Ranks assigned
    expect(result.items[0].rank).toBe(1);
    expect(result.items[1].rank).toBe(2);

    // Tradeoff narratives populated
    expect(result.items[0].main_advantage_ar).toBeDefined();
    expect(result.items[1].main_tradeoff_ar).toBeDefined();
  });

  it("Test 4: Top candidate with unknown critical constraint -> provisional mode", () => {
    // Property with unknown elevator constraint (critical constraint)
    const propertyWithUnknownElevator: PropertyAssessmentWithProperty = {
      id: "asmt-unk",
      property_id: "prop-unk",
      fit_rating: "partial",
      fit_summary: "سعر ومساحة مناسبة لكن المصعد غير مؤكد بالدور الثاني",
      strengths: ["سعر 750 ألف"],
      risks: ["توفر المصعد غير مؤكد"],
      key_unknowns: ["هل يتوفر مصعد؟"],
      visit_priority: "medium",
      visit_priority_reason: "يحتاج تحقق",
      evidence_fields: ["listing_price_sar", "area_sqm", "bedrooms"],
      constraint_results: [
        { key: "budget", labelAr: "ضمن الميزانية", result: "pass", detailAr: "السعر 750,000 ضمن الميزانية" },
        { key: "bedrooms", labelAr: "غرف النوم", result: "pass", detailAr: "3 غرف نوم" },
        { key: "min_area", labelAr: "الحد الأدنى للمساحة", result: "pass", detailAr: "المساحة 125 م²" },
        { key: "elevator_required", labelAr: "وجود مصعد", result: "unknown", detailAr: "توفر المصعد غير مؤكد" },
      ],
      price_per_sqm: 6000,
      property: {
        id: "prop-unk",
        title: "شقة العارض",
        district: "العارض",
        listing_price_sar: 750_000,
        area_sqm: 125,
        bedrooms: 3,
        input_mode: "manual",
      },
    };

    const result = resolveComparison([propertyWithUnknownElevator, propertyB], sampleRequirements);

    // Top candidate has unknown elevator -> mode must be 'provisional'
    expect(result.mode).toBe("provisional");
    expect(result.summaryAr).toBe("ترتيب تقديري — توجد معلومات حرجة غير محسومة قد تغير النتيجة");
    expect(result.items[0].property_id).toBe("prop-unk");
    expect(result.items[0].what_could_change_rank_ar).toContain("وجود مصعد");
  });
});
