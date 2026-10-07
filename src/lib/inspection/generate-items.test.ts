import { describe, it, expect } from "vitest";
import {
  generateInspectionCandidates,
  type PropertyInput,
} from "./generate-items";
import type { ResolvedField, ResolveFactsResult } from "@/lib/evidence/resolve";
import type { ConstraintResult } from "@/lib/analysis/constraints";

function makeResolvedKnown(val: unknown): ResolvedField {
  return {
    status: "known",
    value: val,
    certainty: "reported",
    factIds: ["fact-1"],
  };
}

function makeResolvedUnknown(): ResolvedField {
  return { status: "unknown" };
}

function makeResolvedConflicting(): ResolvedField {
  return {
    status: "conflicting",
    candidates: [
      { value: 100, factIds: ["f1"], sources: ["url"] },
      { value: 120, factIds: ["f2"], sources: ["image"] },
    ],
  };
}

describe("generateInspectionCandidates (Pure Generator)", () => {
  it("generates elevator check tagged with ['fit', 'daily_life'] when elevator is unknown", () => {
    const property: PropertyInput = {
      id: "prop-1",
      floor_no: 1,
    };
    const resolvedFacts: Record<string, ResolvedField> = {
      elevator: makeResolvedUnknown(),
      private_parking: makeResolvedKnown(true),
      area_sqm: makeResolvedKnown(150),
      listing_price_sar: makeResolvedKnown(600000),
      bedrooms: makeResolvedKnown(3),
      bathrooms: makeResolvedKnown(2),
      building_floors: makeResolvedKnown(4),
      district: makeResolvedKnown("الملقا"),
    };

    const items = generateInspectionCandidates(property, resolvedFacts, []);

    const elevatorCheck = items.find((i) =>
      i.how_to_check_ar.includes("معاينة عمل المصعد")
    );

    expect(elevatorCheck).toBeDefined();
    expect(elevatorCheck?.category).toBe("building_services");
    expect(elevatorCheck?.affected_assessment_types).toEqual(["fit", "daily_life"]);
    expect(elevatorCheck?.how_to_check_ar).toBe("معاينة عمل المصعد وتاريخ آخر صيانة");
  });

  it("generates deed verification check when area is conflicting", () => {
    const property: PropertyInput = {
      id: "prop-2",
      floor_no: 1,
    };
    const resolvedFacts: Record<string, ResolvedField> = {
      area_sqm: makeResolvedConflicting(),
      elevator: makeResolvedKnown(true),
      private_parking: makeResolvedKnown(true),
      listing_price_sar: makeResolvedKnown(500000),
      bedrooms: makeResolvedKnown(3),
      bathrooms: makeResolvedKnown(2),
      building_floors: makeResolvedKnown(4),
      district: makeResolvedKnown("النرجس"),
    };

    const items = generateInspectionCandidates(property, resolvedFacts, []);

    const deedCheck = items.find((i) =>
      i.how_to_check_ar.includes("طلب مسح الصك العقاري ومطابقة المخطط المعتمد")
    );

    expect(deedCheck).toBeDefined();
    expect(deedCheck?.category).toBe("unit_specs");
    expect(deedCheck?.trigger_reason).toBe("conflict");
    expect(deedCheck?.affected_assessment_types).toEqual(["fit", "price"]);
  });

  it("strictly bounds total items between 5 and 12 when facts are clean/all known", () => {
    const property: PropertyInput = {
      id: "prop-clean",
      floor_no: 1,
    };
    // All known, minimal triggers
    const resolvedFacts: Record<string, ResolvedField> = {
      elevator: makeResolvedKnown(true),
      private_parking: makeResolvedKnown(true),
      area_sqm: makeResolvedKnown(140),
      listing_price_sar: makeResolvedKnown(550000),
      bedrooms: makeResolvedKnown(3),
      bathrooms: makeResolvedKnown(2),
      building_floors: makeResolvedKnown(4),
      property_age_years: makeResolvedKnown(2),
      district: makeResolvedKnown("الياسمين"),
    };

    const items = generateInspectionCandidates(property, resolvedFacts, []);

    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(items.length).toBeLessThanOrEqual(12);

    // Should include fallbacks like water pressure and electricity meter
    const hasWaterCheck = items.some((i) =>
      i.how_to_check_ar.includes("فحص ضغط المياه")
    );
    const hasElectricCheck = items.some((i) =>
      i.how_to_check_ar.includes("فحص عداد الكهرباء")
    );

    expect(hasWaterCheck).toBe(true);
    expect(hasElectricCheck).toBe(true);
  });

  it("strictly bounds total items to max 12 even when many triggers and constraints exist", () => {
    const property: PropertyInput = {
      id: "prop-many-triggers",
      floor_no: 4,
    };
    const resolvedFacts: Record<string, ResolvedField> = {
      elevator: makeResolvedUnknown(),
      private_parking: makeResolvedConflicting(),
      area_sqm: makeResolvedConflicting(),
      listing_price_sar: makeResolvedConflicting(),
      bedrooms: makeResolvedUnknown(),
      bathrooms: makeResolvedUnknown(),
      building_floors: makeResolvedUnknown(),
      property_age_years: makeResolvedUnknown(),
      district: makeResolvedUnknown(),
    };

    const manyConstraints: ConstraintResult[] = [
      { key: "elevator_required", labelAr: "مصعد", result: "unknown", detailAr: "" },
      { key: "private_parking", labelAr: "موقف خاص", result: "unknown", detailAr: "" },
      { key: "new_building_only", labelAr: "مبنى جديد", result: "unknown", detailAr: "" },
      { key: "custom_1", labelAr: "غرفة خادمة", result: "unknown", detailAr: "غير محدد" },
      { key: "custom_2", labelAr: "مستودع خاص", result: "unknown", detailAr: "غير محدد" },
      { key: "custom_3", labelAr: "شرفة خارجية", result: "unknown", detailAr: "غير محدد" },
      { key: "custom_4", labelAr: "دخول ذكي", result: "unknown", detailAr: "غير محدد" },
    ];

    const items = generateInspectionCandidates(property, resolvedFacts, manyConstraints);

    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(items.length).toBeLessThanOrEqual(12);
    expect(items.length).toBe(12); // Clamped at maximum 12

    // Ensure all items have unique questions
    const questionSet = new Set(items.map((i) => i.question_ar));
    expect(questionSet.size).toBe(items.length);
  });

  it("generates parking check with deed verification when parking is unknown", () => {
    const property: PropertyInput = { id: "prop-p1" };
    const resolvedFacts: Record<string, ResolvedField> = {
      private_parking: makeResolvedUnknown(),
    };

    const items = generateInspectionCandidates(property, resolvedFacts, []);

    const parkingCheck = items.find((i) => i.category === "parking_access");
    expect(parkingCheck).toBeDefined();
    expect(parkingCheck?.how_to_check_ar).toBe(
      "التأكد من رقم الموقف المسجل بالصك وتجربة الدخول بالسيارة"
    );
    expect(parkingCheck?.affected_assessment_types).toEqual(["fit", "daily_life"]);
  });

  it("generates building age check when new_building is requested and age is unknown", () => {
    const property: PropertyInput = { id: "prop-new" };
    const resolvedFacts: Record<string, ResolvedField> = {
      property_age_years: makeResolvedUnknown(),
    };
    const constraints: ConstraintResult[] = [
      { key: "new_building_only", labelAr: "مبنى جديد فقط", result: "unknown", detailAr: "" },
    ];

    const items = generateInspectionCandidates(property, resolvedFacts, constraints);

    const ageCheck = items.find((i) =>
      i.how_to_check_ar.includes("التحقق من سنة إتمام البناء وشهادة الإشغال")
    );
    expect(ageCheck).toBeDefined();
    expect(ageCheck?.category).toBe("building_services");
    expect(ageCheck?.affected_assessment_types).toEqual(["fit", "risks"]);
  });

  it("handles ResolveFactsResult nested fields object correctly", () => {
    const property: PropertyInput = { id: "prop-nested" };
    const nestedFacts = {
      fields: {
        elevator: makeResolvedUnknown(),
        area_sqm: makeResolvedConflicting(),
      },
      claims: { unit: [], building: [], neighborhood: [] },
    };

    const items = generateInspectionCandidates(
      property,
      nestedFacts as unknown as ResolveFactsResult,
      []
    );

    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(items.length).toBeLessThanOrEqual(12);
    expect(items.some((i) => i.category === "building_services")).toBe(true);
    expect(items.some((i) => i.category === "unit_specs")).toBe(true);
  });
});
