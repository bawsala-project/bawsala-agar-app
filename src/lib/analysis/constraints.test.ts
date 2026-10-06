import { describe, it, expect } from "vitest";
import {
  evaluateConstraints,
  pricePerSqm,
  RequirementsRow,
} from "./constraints";
import { ResolveFactsResult, ResolvedFieldsMap } from "@/lib/evidence/resolve";
import { ResolvableFieldKey } from "@/lib/evidence/fields";

function makeEmptyResolved(): ResolveFactsResult {
  const allKeys: ResolvableFieldKey[] = [
    "listing_price_sar",
    "area_sqm",
    "bedrooms",
    "bathrooms",
    "floor_no",
    "building_floors",
    "property_age_years",
    "elevator",
    "private_parking",
    "district",
  ];

  const fields = {} as ResolvedFieldsMap;
  for (const k of allKeys) {
    fields[k] = { status: "unknown" };
  }

  return {
    ...fields,
    fields,
    claims: { unit: [], building: [], neighborhood: [] },
  };
}

function makeRequirements(overrides: Partial<RequirementsRow> = {}): RequirementsRow {
  return {
    id: "req-1",
    case_id: "case-1",
    max_budget_sar: 1000000,
    purchase_method: "cash",
    household_size: 4,
    min_bedrooms: 3,
    min_area_sqm: 120,
    hard_constraints: [],
    preferences: [],
    important_locations: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("Constraint Engine (Acceptance 1)", () => {
  describe("Budget Constraint", () => {
    const req = makeRequirements({ max_budget_sar: 900000 });

    it("pass when price <= max_budget_sar", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.listing_price_sar = {
        status: "known",
        value: 850000,
        certainty: "reported",
        factIds: ["f1"],
      };
      const res = evaluateConstraints(req, resolved);
      const budgetRes = res.find((r) => r.key === "budget");
      expect(budgetRes?.result).toBe("pass");
    });

    it("fail when price > max_budget_sar", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.listing_price_sar = {
        status: "known",
        value: 950000,
        certainty: "reported",
        factIds: ["f1"],
      };
      const res = evaluateConstraints(req, resolved);
      const budgetRes = res.find((r) => r.key === "budget");
      expect(budgetRes?.result).toBe("fail");
    });

    it("unknown when price is unknown", () => {
      const resolved = makeEmptyResolved();
      const res = evaluateConstraints(req, resolved);
      const budgetRes = res.find((r) => r.key === "budget");
      expect(budgetRes?.result).toBe("unknown");
    });

    it("unknown when price is conflicting", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.listing_price_sar = {
        status: "conflicting",
        candidates: [
          { value: 850000, factIds: ["1"], sources: ["url"] },
          { value: 950000, factIds: ["2"], sources: ["image"] },
        ],
      };
      const res = evaluateConstraints(req, resolved);
      const budgetRes = res.find((r) => r.key === "budget");
      expect(budgetRes?.result).toBe("unknown");
    });
  });

  describe("Min Bedrooms Constraint", () => {
    const req = makeRequirements({ min_bedrooms: 3 });

    it("pass when bedrooms >= min_bedrooms", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.bedrooms = {
        status: "known",
        value: 3,
        certainty: "reported",
        factIds: ["f1"],
      };
      const res = evaluateConstraints(req, resolved);
      const bedRes = res.find((r) => r.key === "bedrooms");
      expect(bedRes?.result).toBe("pass");
    });

    it("fail when bedrooms < min_bedrooms", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.bedrooms = {
        status: "known",
        value: 2,
        certainty: "reported",
        factIds: ["f1"],
      };
      const res = evaluateConstraints(req, resolved);
      const bedRes = res.find((r) => r.key === "bedrooms");
      expect(bedRes?.result).toBe("fail");
    });

    it("unknown when bedrooms is unknown or conflicting", () => {
      const resolved = makeEmptyResolved();
      const res1 = evaluateConstraints(req, resolved);
      expect(res1.find((r) => r.key === "bedrooms")?.result).toBe("unknown");

      resolved.fields.bedrooms = {
        status: "conflicting",
        candidates: [
          { value: 2, factIds: ["1"], sources: ["url"] },
          { value: 3, factIds: ["2"], sources: ["image"] },
        ],
      };
      const res2 = evaluateConstraints(req, resolved);
      expect(res2.find((r) => r.key === "bedrooms")?.result).toBe("unknown");
    });
  });

  describe("Min Area Sqm Constraint", () => {
    const req = makeRequirements({ min_area_sqm: 120 });

    it("pass when area >= min_area_sqm", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.area_sqm = {
        status: "known",
        value: 135,
        certainty: "reported",
        factIds: ["f1"],
      };
      const res = evaluateConstraints(req, resolved);
      const areaRes = res.find((r) => r.key === "min_area");
      expect(areaRes?.result).toBe("pass");
    });

    it("fail when area < min_area_sqm", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.area_sqm = {
        status: "known",
        value: 110,
        certainty: "reported",
        factIds: ["f1"],
      };
      const res = evaluateConstraints(req, resolved);
      const areaRes = res.find((r) => r.key === "min_area");
      expect(areaRes?.result).toBe("fail");
    });

    it("not evaluated if min_area_sqm is not set or 0", () => {
      const reqNoArea = makeRequirements({ min_area_sqm: null });
      const resolved = makeEmptyResolved();
      const res = evaluateConstraints(reqNoArea, resolved);
      expect(res.find((r) => r.key === "min_area")).toBeUndefined();
    });
  });

  describe("Elevator Rule Edge Cases", () => {
    const req = makeRequirements({
      hard_constraints: [{ key: "elevator_required", label: "يلزم وجود مصعد" }],
    });

    it("passes when elevator is true regardless of floor", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.elevator = {
        status: "known",
        value: true,
        certainty: "reported",
        factIds: ["1"],
      };
      resolved.fields.floor_no = {
        status: "known",
        value: 4,
        certainty: "reported",
        factIds: ["2"],
      };
      const res = evaluateConstraints(req, resolved);
      expect(res.find((r) => r.key === "elevator_required")?.result).toBe("pass");
    });

    it("passes when floor 1 with no elevator (floor 1 edge case)", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.elevator = {
        status: "known",
        value: false,
        certainty: "reported",
        factIds: ["1"],
      };
      resolved.fields.floor_no = {
        status: "known",
        value: 1,
        certainty: "reported",
        factIds: ["2"],
      };
      const res = evaluateConstraints(req, resolved);
      expect(res.find((r) => r.key === "elevator_required")?.result).toBe("pass");
    });

    it("fails when floor 2 or above with no elevator", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.elevator = {
        status: "known",
        value: false,
        certainty: "reported",
        factIds: ["1"],
      };
      resolved.fields.floor_no = {
        status: "known",
        value: 2,
        certainty: "reported",
        factIds: ["2"],
      };
      const res = evaluateConstraints(req, resolved);
      expect(res.find((r) => r.key === "elevator_required")?.result).toBe("fail");
    });

    it("unknown when floor 3 with elevator unknown (floor 3 edge case)", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.elevator = { status: "unknown" };
      resolved.fields.floor_no = {
        status: "known",
        value: 3,
        certainty: "reported",
        factIds: ["2"],
      };
      const res = evaluateConstraints(req, resolved);
      expect(res.find((r) => r.key === "elevator_required")?.result).toBe("unknown");
    });

    it("unknown when elevator false and floor_no is unknown", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.elevator = {
        status: "known",
        value: false,
        certainty: "reported",
        factIds: ["1"],
      };
      resolved.fields.floor_no = { status: "unknown" };
      const res = evaluateConstraints(req, resolved);
      expect(res.find((r) => r.key === "elevator_required")?.result).toBe("unknown");
    });

    it("unknown when either elevator or floor_no is conflicting", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.elevator = {
        status: "conflicting",
        candidates: [
          { value: true, factIds: ["1"], sources: ["url"] },
          { value: false, factIds: ["2"], sources: ["image"] },
        ],
      };
      resolved.fields.floor_no = {
        status: "known",
        value: 4,
        certainty: "reported",
        factIds: ["3"],
      };
      const res = evaluateConstraints(req, resolved);
      expect(res.find((r) => r.key === "elevator_required")?.result).toBe("unknown");
    });
  });

  describe("Private Parking, Max Floor, New Building, Custom", () => {
    const req = makeRequirements({
      hard_constraints: [
        { key: "private_parking", label: "موقف خاص" },
        { key: "max_floor", label: "أقصى دور", value: 3 },
        { key: "new_building_only", label: "بناء حديث فقط" },
        { key: "custom", label: "بلكونة واسعة" },
      ],
    });

    it("private parking pass/fail/unknown", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.private_parking = {
        status: "known",
        value: true,
        certainty: "reported",
        factIds: ["1"],
      };
      expect(evaluateConstraints(req, resolved).find((r) => r.key === "private_parking")?.result).toBe("pass");

      resolved.fields.private_parking = {
        status: "known",
        value: false,
        certainty: "reported",
        factIds: ["1"],
      };
      expect(evaluateConstraints(req, resolved).find((r) => r.key === "private_parking")?.result).toBe("fail");

      resolved.fields.private_parking = { status: "unknown" };
      expect(evaluateConstraints(req, resolved).find((r) => r.key === "private_parking")?.result).toBe("unknown");
    });

    it("max floor pass/fail/unknown", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.floor_no = {
        status: "known",
        value: 2,
        certainty: "reported",
        factIds: ["1"],
      };
      expect(evaluateConstraints(req, resolved).find((r) => r.key === "max_floor")?.result).toBe("pass");

      resolved.fields.floor_no = {
        status: "known",
        value: 4,
        certainty: "reported",
        factIds: ["1"],
      };
      expect(evaluateConstraints(req, resolved).find((r) => r.key === "max_floor")?.result).toBe("fail");

      resolved.fields.floor_no = { status: "unknown" };
      expect(evaluateConstraints(req, resolved).find((r) => r.key === "max_floor")?.result).toBe("unknown");
    });

    it("new building only pass/fail/unknown", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.property_age_years = {
        status: "known",
        value: 0,
        certainty: "reported",
        factIds: ["1"],
      };
      expect(evaluateConstraints(req, resolved).find((r) => r.key === "new_building_only")?.result).toBe("pass");

      resolved.fields.property_age_years = {
        status: "known",
        value: 3,
        certainty: "reported",
        factIds: ["1"],
      };
      expect(evaluateConstraints(req, resolved).find((r) => r.key === "new_building_only")?.result).toBe("fail");

      resolved.fields.property_age_years = { status: "unknown" };
      expect(evaluateConstraints(req, resolved).find((r) => r.key === "new_building_only")?.result).toBe("unknown");
    });

    it("custom free-text constraint is always unknown with 'يتطلب تحققًا يدويًا'", () => {
      const resolved = makeEmptyResolved();
      const res = evaluateConstraints(req, resolved);
      const customRes = res.find((r) => r.key === "custom");
      expect(customRes?.result).toBe("unknown");
      expect(customRes?.detailAr).toBe("يتطلب تحققًا يدويًا");
    });
  });

  describe("pricePerSqm calculation", () => {
    it("returns rounded price per sqm when both price and area are known", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.listing_price_sar = {
        status: "known",
        value: 900000,
        certainty: "reported",
        factIds: ["1"],
      };
      resolved.fields.area_sqm = {
        status: "known",
        value: 120,
        certainty: "reported",
        factIds: ["2"],
      };
      expect(pricePerSqm(resolved)).toBe(7500);
    });

    it("returns null if either price or area is unknown or conflicting", () => {
      const resolved = makeEmptyResolved();
      resolved.fields.listing_price_sar = {
        status: "known",
        value: 900000,
        certainty: "reported",
        factIds: ["1"],
      };
      resolved.fields.area_sqm = { status: "unknown" };
      expect(pricePerSqm(resolved)).toBeNull();

      resolved.fields.listing_price_sar = {
        status: "conflicting",
        candidates: [],
      };
      expect(pricePerSqm(resolved)).toBeNull();
    });
  });
});
