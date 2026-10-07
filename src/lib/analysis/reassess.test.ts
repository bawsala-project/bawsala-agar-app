import { describe, it, expect } from "vitest";
import { reassessProperty, type ReassessInputAssessment } from "./reassess";
import { resolveAffectedTargets } from "./reassess-targets";
import type { InspectionItemRow, InspectionFindingRow } from "@/actions/inspection";

describe("Reassessment Engine - Acceptance 1", () => {
  const sampleAssessment: ReassessInputAssessment = {
    id: "asmt-1",
    property_id: "prop-1",
    fit_rating: "partial",
    fit_summary: "عقار يتطابق مع الميزانية وعدد الغرف ومساحته جيدة مع وجود بعض النقاط غير المؤكدة.",
    strengths: ["ضمن الميزانية", "المساحة مناسبة"],
    risks: ["احتمال وجود ضوضاء"],
    key_unknowns: ["مدى توفر المصعد في المبنى", "مدى توفر موقف سيارة خاص"],
    visit_priority: "medium",
    visit_priority_reason: "أولوية متوسطة لوجود نقاط تحتاج فحص ميداني.",
    evidence_fields: ["listing_price_sar", "area_sqm"],
    constraint_results: [
      {
        key: "budget",
        labelAr: "ضمن الميزانية",
        result: "pass",
        detailAr: "السعر 750,000 ريال ضمن الحد الأقصى 900,000 ريال",
      },
      {
        key: "min_bedrooms",
        labelAr: "عدد الغرف",
        result: "pass",
        detailAr: "3 غرف نوم مطابقة للحد الأدنى",
      },
      {
        key: "elevator_required",
        labelAr: "مصعد بالعمارة",
        result: "unknown",
        detailAr: "يتطلب تحققاً ميدانياً",
      },
      {
        key: "private_parking",
        labelAr: "موقف خاص للسيارة",
        result: "unknown",
        detailAr: "يتطلب تحققاً ميدانياً",
      },
    ],
    price_per_sqm: 5500.5,
  };

  it("Acceptance 1: Elevator found broken on floor 3 -> constraint flips to fail, fit rating drops to weak, risk is added", () => {
    const elevatorItem: InspectionItemRow = {
      id: "item-elev",
      property_id: "prop-1",
      category: "building_services",
      question_ar: "هل المصعد متوفر ويعمل بكفاءة وتوجد صيانة دورية معتمدة؟",
      why_it_matters_ar: "سهولة الوصول للأدوار العليا وسلامة السكان.",
      how_to_check_ar: "معاينة عمل المصعد وتاريخ آخر صيانة",
      priority: "high",
      trigger_reason: "unknown_fact",
      affected_assessment_types: ["fit", "daily_life"],
      created_at: new Date().toISOString(),
    };

    const elevatorFinding: InspectionFindingRow = {
      id: "finding-elev",
      inspection_item_id: "item-elev",
      property_id: "prop-1",
      result: "problem",
      note: "المصعد معطل تماماً ولوحة التشغيل مكسورة وتاريخ الصيانة منتهي",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const targetFindings = resolveAffectedTargets([
      { item: elevatorItem, finding: elevatorFinding },
    ]);

    const property = { floor_no: 3 };
    const requirements = { elevator_required: true, max_budget_sar: 900_000 };

    const { assessment, diff } = reassessProperty(
      sampleAssessment,
      targetFindings,
      property,
      requirements
    );

    // 1. Elevator constraint flips to fail
    const elevC = assessment.constraint_results.find((c) => c.key === "elevator_required");
    expect(elevC).toBeDefined();
    expect(elevC?.result).toBe("fail");

    // 2. Fit rating drops to weak
    expect(assessment.fit_rating).toBe("weak");
    expect(diff.previousFitRating).toBe("partial");
    expect(diff.newFitRating).toBe("weak");

    // 3. Risk is added
    expect(diff.addedRisks.length).toBeGreaterThan(0);
    expect(diff.addedRisks[0]).toContain("المصعد معطل");
    expect(assessment.risks.some((r) => r.includes("المصعد معطل"))).toBe(true);

    // 4. Visit priority drops to low
    expect(assessment.visit_priority).toBe("low");

    // 5. Unaffected price_per_sqm and unaffected constraints remain exactly identical
    expect(assessment.price_per_sqm).toBe(5500.5);
    const budgetC = assessment.constraint_results.find((c) => c.key === "budget");
    expect(budgetC).toEqual(sampleAssessment.constraint_results[0]);
    const bedC = assessment.constraint_results.find((c) => c.key === "min_bedrooms");
    expect(bedC).toEqual(sampleAssessment.constraint_results[1]);
  });

  it("Acceptance 1: Parking verified as good -> parking constraint flips to pass, removed from unknowns", () => {
    const parkingItem: InspectionItemRow = {
      id: "item-park",
      property_id: "prop-1",
      category: "parking_access",
      question_ar: "هل يتوفر موقف سيارة خاص ومسجل رسميًا للوحدة؟",
      why_it_matters_ar: "ضمان توفر موقف مخصص ومحمي وتجنب النزاعات اليومية.",
      how_to_check_ar: "التأكد من رقم الموقف المسجل بالصك وتجربة الدخول بالسيارة",
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
      note: "موقف خاص مسجل بالصك برقم 14 وتم تجربة الدخول بالسيارة بسلاسة",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const targetFindings = resolveAffectedTargets([
      { item: parkingItem, finding: parkingFinding },
    ]);

    const property = { floor_no: 1 };
    const requirements = { private_parking: true };

    const { assessment, diff } = reassessProperty(
      sampleAssessment,
      targetFindings,
      property,
      requirements
    );

    // 1. Parking constraint flips to pass
    const parkC = assessment.constraint_results.find((c) => c.key === "private_parking");
    expect(parkC).toBeDefined();
    expect(parkC?.result).toBe("pass");

    // 2. Removed from key_unknowns
    expect(assessment.key_unknowns.some((u) => u.includes("موقف"))).toBe(false);
    expect(diff.resolvedUnknowns.length).toBeGreaterThan(0);
    expect(diff.resolvedUnknowns[0]).toContain("موقف سيارة خاص");

    // 3. Unaffected price per sqm remains verbatim identical
    expect(assessment.price_per_sqm).toBe(5500.5);
    const budgetC = assessment.constraint_results.find((c) => c.key === "budget");
    expect(budgetC?.result).toBe("pass");
  });

  it("Acceptance 1: Unaffected price per sqm and other constraints remain exactly identical", () => {
    // Both items checked: 1 good, 1 problem
    const elevItem: InspectionItemRow = {
      id: "item-elev",
      property_id: "prop-1",
      category: "building_services",
      question_ar: "هل المصعد متوفر ويعمل بكفاءة؟",
      why_it_matters_ar: "المصعد",
      how_to_check_ar: "المصعد",
      priority: "high",
      trigger_reason: "unknown_fact",
      affected_assessment_types: ["fit"],
      created_at: new Date().toISOString(),
    };
    const elevFinding: InspectionFindingRow = {
      id: "f-elev",
      inspection_item_id: "item-elev",
      property_id: "prop-1",
      result: "problem",
      note: "معطل",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const targetFindings = resolveAffectedTargets([
      { item: elevItem, finding: elevFinding },
    ]);

    const { assessment } = reassessProperty(
      sampleAssessment,
      targetFindings,
      { floor_no: 2 },
      { elevator_required: true }
    );

    // Strict identity check for unaffected axes
    expect(assessment.price_per_sqm).toBe(sampleAssessment.price_per_sqm);
    expect(assessment.constraint_results[0]).toEqual(sampleAssessment.constraint_results[0]);
    expect(assessment.constraint_results[1]).toEqual(sampleAssessment.constraint_results[1]);
  });
});
