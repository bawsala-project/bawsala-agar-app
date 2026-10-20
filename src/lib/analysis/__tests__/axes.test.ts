import { describe, it, expect } from "vitest";
import { evaluateDecisionAxes, computeConfidenceLevel } from "../axes";
import { resolveComparison, type PropertyAssessmentWithProperty } from "../compare";
import { reassessProperty } from "../reassess";
import { resolveAffectedTargets } from "../reassess-targets";
import type { InspectionItemRow, InspectionFindingRow } from "@/actions/inspection";

describe("5-Axis Buyer-Property Decision & Confidence Engine (v1.9)", () => {
  it("computes high confidence when critical fields are known and unknowns are minimal", () => {
    const res = computeConfidenceLevel({
      fitRating: "strong",
      constraintResults: [
        {
          key: "budget",
          labelAr: "الميزانية القصوى",
          result: "pass",
          detailAr: "ضمن السقف",
        },
      ],
      keyUnknownsCount: 0,
      criticalKnownCount: 3,
    });

    expect(res.level).toBe("high");
    expect(res.labelAr).toContain("ثقة عالية");
  });

  it("computes low confidence when critical fields are missing or fit_rating is insufficient_evidence", () => {
    const res = computeConfidenceLevel({
      fitRating: "insufficient_evidence",
      constraintResults: [
        {
          key: "elevator_required",
          labelAr: "مصعد",
          result: "unknown",
          detailAr: "غير مذكور",
        },
        {
          key: "private_parking",
          labelAr: "موقف",
          result: "unknown",
          detailAr: "غير مذكور",
        },
      ],
      keyUnknownsCount: 3,
      criticalKnownCount: 1,
    });

    expect(res.level).toBe("low");
    expect(res.labelAr).toContain("ثقة منخفضة");
  });

  it("enables Affordability axis only when max_budget_sar, purchase_method (cash/finance), and listing_price_sar exist", () => {
    const enabledResult = evaluateDecisionAxes({
      fitRating: "strong",
      price: 850_000,
      areaSqm: 150,
      bedrooms: 4,
      district: "الملقا",
      pricePerSqm: 5667,
      poolMedianPpsqm: 6000,
      constraints: [
        {
          key: "budget",
          labelAr: "الميزانية القصوى",
          result: "pass",
          detailAr: "ضمن الميزانية",
        },
        {
          key: "daily_location",
          labelAr: "القرب من المواقع المهمة",
          result: "pass",
          detailAr: "يقع في حي الملقا المطابق لمقرك اليومي",
        },
        {
          key: "elevator_required",
          labelAr: "وجود مصعد",
          result: "pass",
          detailAr: "يتوفر مصعد عامل",
        },
      ],
      strengths: ["مساحة واسعة مناسبة للأسرة", "ضمن الميزانية"],
      risks: [],
      keyUnknowns: [],
      requirements: {
        max_budget_sar: 950_000,
        purchase_method: "finance",
        household_size: 4,
        min_bedrooms: 4,
        min_area_sqm: 140,
      },
    });

    expect(enabledResult.affordability_axis.enabled).toBe(true);
    expect(enabledResult.affordability_axis.status).toBe("comfortable");
    expect(enabledResult.daily_life.status).toBe("favorable");
    expect(enabledResult.overall_confidence).toBe("high");

    const disabledResult = evaluateDecisionAxes({
      fitRating: "partial",
      price: 850_000,
      areaSqm: 150,
      bedrooms: 4,
      district: "النرجس",
      pricePerSqm: 5667,
      poolMedianPpsqm: null,
      constraints: [],
      strengths: [],
      risks: [],
      keyUnknowns: ["حالة المصعد"],
      requirements: {
        max_budget_sar: 950_000,
        purchase_method: "undecided",
      },
    });

    expect(disabledResult.affordability_axis.enabled).toBe(false);
    expect(disabledResult.affordability_axis.status).toBe("disabled");
  });

  it("returns 1-property standalone decision mode with rank: null and populated 5 axes", () => {
    const singlePool: PropertyAssessmentWithProperty[] = [
      {
        id: "asmt-1",
        property_id: "prop-1",
        fit_rating: "strong",
        fit_summary: "الشقة ملائمة لاحتياج أسرتك وميزانيتك.",
        visit_priority: "high",
        visit_priority_reason: "توصى بالمعاينة.",
        price_per_sqm: 6000,
        constraint_results: [
          {
            key: "budget",
            labelAr: "الميزانية القصوى",
            result: "pass",
            detailAr: "ضمن السقف",
          },
        ],
        strengths: ["4 غرف نوم مناسبة للأسرة"],
        risks: [],
        key_unknowns: ["عرض الشارع"],
        properties: {
          id: "prop-1",
          title: "شقة حي الياسمين",
          district: "الياسمين",
          listing_price_sar: 900_000,
          area_sqm: 150,
          bedrooms: 4,
          property_facts: [],
        },
      },
    ];

    const comp = resolveComparison(singlePool, {
      max_budget_sar: 950_000,
      purchase_method: "cash",
      household_size: 4,
      min_bedrooms: 4,
      min_area_sqm: 140,
    });

    expect(comp.mode).toBe("insufficient");
    expect(comp.close_options).toBe(false);
    expect(comp.items).toHaveLength(1);
    expect(comp.items[0].rank).toBeNull();
    expect(comp.items[0].overall_confidence).toBe("high");
    expect(comp.items[0].affordability_axis.enabled).toBe(true);
    expect(comp.items[0].daily_life.status).toBe("moderate");
  });

  it("tracks confidence level transition during post-visit reassessment", () => {
    const parkingItem: InspectionItemRow = {
      id: "item-park",
      property_id: "prop-1",
      category: "parking_access",
      question_ar: "هل يتوفر موقف سيارة خاص ومسجل رسميًا للوحدة؟",
      why_it_matters_ar: "ضمان توفر موقف مخصص.",
      how_to_check_ar: "التأكد من رقم الموقف",
      priority: "medium",
      trigger_reason: "constraint_verification",
      affected_assessment_types: ["fit", "daily_life"],
      created_at: new Date().toISOString(),
    };

    const parkingFinding: InspectionFindingRow = {
      id: "finding-park",
      inspection_item_id: "item-park",
      property_id: "prop-1",
      result: "good",
      note: "موقف خاص متوفر",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const targetFindings = resolveAffectedTargets([
      { item: parkingItem, finding: parkingFinding },
    ]);

    const result = reassessProperty(
      {
        id: "asmt-1",
        property_id: "prop-1",
        fit_rating: "partial",
        fit_summary: "توافق جزئي بسبب نقاط غير مؤكدة.",
        visit_priority: "medium",
        visit_priority_reason: "يلزم التحقق من الموقف.",
        evidence_fields: ["listing_price_sar", "area_sqm", "bedrooms"],
        constraint_results: [
          {
            key: "budget",
            labelAr: "الميزانية القصوى",
            result: "pass",
            detailAr: "ضمن الميزانية",
          },
          {
            key: "private_parking",
            labelAr: "موقف خاص",
            result: "unknown",
            detailAr: "غير مذكور بالإعلان",
          },
        ],
        strengths: ["مساحة مناسبة"],
        risks: [],
        key_unknowns: ["مدى توفر موقف سيارة خاص"],
        price_per_sqm: 6000,
      },
      targetFindings,
      {
        floor_no: 1,
      },
      {
        max_budget_sar: 950_000,
        private_parking: true,
      }
    );

    expect(result.diff.previousFitRating).toBe("partial");
    expect(result.diff.newFitRating).toBe("strong");
    expect(result.diff.previousConfidence).toBe("medium");
    expect(result.diff.newConfidence).toBe("high");
    expect(result.diff.explanationAr).toContain("مستوى الثقة");
  });
});
