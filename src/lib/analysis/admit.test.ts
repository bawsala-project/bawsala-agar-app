import { describe, it, expect } from "vitest";
import { admitPropertyAssessment } from "./admit";
import type { ModelPropertyAssessment } from "@/lib/ai/prompts/analysis";
import type { ConstraintResult } from "./constraints";

function makeValidModelOutput(overrides: Partial<ModelPropertyAssessment> = {}): ModelPropertyAssessment {
  return {
    fit_rating: "strong",
    fit_summary: "عقار ممتاز مطابق لجميع متطلبات المشتري وميزانيته المالية.",
    strengths: ["سعر مناسب جداً", "مساحة واسعة للأسرة"],
    risks: ["الدور مرتفع نسبياً"],
    key_unknowns: ["التأكد من عمر المبنى الفعلي"],
    visit_priority: "high",
    visit_priority_reason: "ينصح بالمعاينة السريعة لتوفر كافة الشروط الأساسية.",
    evidence_fields: ["listing_price_sar", "bedrooms", "area_sqm"],
    ...overrides,
  };
}

describe("Output Admission Engine (Acceptance 2)", () => {
  const defaultConstraints: ConstraintResult[] = [
    { key: "budget", labelAr: "الميزانية", result: "pass", detailAr: "ضمن الميزانية" },
    { key: "bedrooms", labelAr: "غرف النوم", result: "pass", detailAr: "3 غرف" },
  ];
  const defaultKnownFields = ["listing_price_sar", "bedrooms", "area_sqm", "elevator"];

  it("admits valid model output with passed constraints and 3 critical fields known", () => {
    const modelOutput = makeValidModelOutput();
    const result = admitPropertyAssessment({
      propertyId: "prop-1",
      modelOutput,
      knownFactFields: defaultKnownFields,
      constraintResults: defaultConstraints,
      pricePerSqm: 6500.5,
      criticalFieldsKnownCount: 3,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.assessment.fit_rating).toBe("strong");
      expect(result.assessment.visit_priority).toBe("high");
      expect(result.assessment.price_per_sqm).toBe(6500.5);
      expect(result.assessment.constraint_results).toEqual(defaultConstraints);
    }
  });

  it("rejects an ungrounded evidence field", () => {
    const modelOutput = makeValidModelOutput({
      // "property_age_years" is NOT in knownFactFields
      evidence_fields: ["listing_price_sar", "property_age_years"],
    });

    const result = admitPropertyAssessment({
      propertyId: "prop-1",
      modelOutput,
      knownFactFields: ["listing_price_sar", "bedrooms", "area_sqm"],
      constraintResults: defaultConstraints,
      pricePerSqm: 6000,
      criticalFieldsKnownCount: 3,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("property_age_years");
      expect(result.reason).toContain("Ungrounded evidence field");
    }
  });

  it("rejects when text exceeds limits or is empty", () => {
    // 1. fit_summary too long (> 400 chars)
    const longSummary = "أ".repeat(401);
    const resLong = admitPropertyAssessment({
      propertyId: "prop-1",
      modelOutput: makeValidModelOutput({ fit_summary: longSummary }),
      knownFactFields: defaultKnownFields,
      constraintResults: defaultConstraints,
      pricePerSqm: 6000,
      criticalFieldsKnownCount: 3,
    });
    expect(resLong.ok).toBe(false);

    // 2. empty visit_priority_reason
    const resEmptyReason = admitPropertyAssessment({
      propertyId: "prop-1",
      modelOutput: makeValidModelOutput({ visit_priority_reason: "   " }),
      knownFactFields: defaultKnownFields,
      constraintResults: defaultConstraints,
      pricePerSqm: 6000,
      criticalFieldsKnownCount: 3,
    });
    expect(resEmptyReason.ok).toBe(false);

    // 3. list item exceeds 200 chars
    const resLongItem = admitPropertyAssessment({
      propertyId: "prop-1",
      modelOutput: makeValidModelOutput({ strengths: ["س".repeat(205)] }),
      knownFactFields: defaultKnownFields,
      constraintResults: defaultConstraints,
      pricePerSqm: 6000,
      criticalFieldsKnownCount: 3,
    });
    expect(resLongItem.ok).toBe(false);

    // 4. list has more than 5 items
    const resTooMany = admitPropertyAssessment({
      propertyId: "prop-1",
      modelOutput: makeValidModelOutput({ strengths: ["1", "2", "3", "4", "5", "6"] }),
      knownFactFields: defaultKnownFields,
      constraintResults: defaultConstraints,
      pricePerSqm: 6000,
      criticalFieldsKnownCount: 3,
    });
    expect(resTooMany.ok).toBe(false);
  });

  it("enforces fail -> weak override and prevents high visit_priority", () => {
    // Model says fit_rating: 'strong', visit_priority: 'high', but a constraint failed
    const failedConstraints: ConstraintResult[] = [
      { key: "budget", labelAr: "الميزانية", result: "fail", detailAr: "يتجاوز الميزانية" },
      { key: "bedrooms", labelAr: "غرف النوم", result: "pass", detailAr: "مطابق" },
    ];

    const modelOutput = makeValidModelOutput({
      fit_rating: "strong",
      visit_priority: "high",
    });

    const result = admitPropertyAssessment({
      propertyId: "prop-1",
      modelOutput,
      knownFactFields: defaultKnownFields,
      constraintResults: failedConstraints,
      pricePerSqm: 8000,
      criticalFieldsKnownCount: 3,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.assessment.fit_rating).toBe("weak");
      expect(result.assessment.visit_priority).toBe("medium"); // Downgraded from high
    }
  });

  it("enforces insufficient_evidence override when fewer than 2 critical fields are known", () => {
    // Only 1 critical field is known
    const modelOutput = makeValidModelOutput({
      fit_rating: "strong",
      visit_priority: "high",
    });

    const result = admitPropertyAssessment({
      propertyId: "prop-1",
      modelOutput,
      knownFactFields: defaultKnownFields,
      constraintResults: defaultConstraints,
      pricePerSqm: null,
      criticalFieldsKnownCount: 1, // < 2!
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.assessment.fit_rating).toBe("insufficient_evidence");
      expect(result.assessment.visit_priority).toBe("insufficient_evidence");
    }
  });

  it("ignores any model-supplied constraint_results or price_per_sqm", () => {
    const codeConstraints: ConstraintResult[] = [
      { key: "budget", labelAr: "الميزانية", result: "pass", detailAr: "حسابي من الكود" },
    ];
    const codePricePerSqm = 7250.0;

    // Model cannot inject or modify constraint_results or price_per_sqm
    const result = admitPropertyAssessment({
      propertyId: "prop-1",
      modelOutput: makeValidModelOutput(),
      knownFactFields: defaultKnownFields,
      constraintResults: codeConstraints,
      pricePerSqm: codePricePerSqm,
      criticalFieldsKnownCount: 3,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.assessment.constraint_results).toEqual(codeConstraints);
      expect(result.assessment.price_per_sqm).toBe(codePricePerSqm);
    }
  });
});
