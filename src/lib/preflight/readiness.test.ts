import { describe, it, expect } from "vitest";
import {
  evaluatePreflight,
  PreflightInput,
  PreflightPropertyInput,
  RequirementsRow,
} from "./evaluate";
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

function makeReadyResolved(): ResolveFactsResult {
  const resolved = makeEmptyResolved();
  resolved.fields.listing_price_sar = {
    status: "known",
    value: 850000,
    certainty: "reported",
    factIds: ["f1"],
  };
  resolved.fields.area_sqm = {
    status: "known",
    value: 130,
    certainty: "reported",
    factIds: ["f2"],
  };
  resolved.fields.district = {
    status: "known",
    value: "الياسمين",
    certainty: "reported",
    factIds: ["f3"],
  };
  resolved.fields.floor_no = {
    status: "known",
    value: 2,
    certainty: "reported",
    factIds: ["f4"],
  };
  resolved.fields.property_age_years = {
    status: "known",
    value: 1,
    certainty: "reported",
    factIds: ["f5"],
  };
  return resolved;
}

function makeRequirements(overrides: Partial<RequirementsRow> = {}): RequirementsRow {
  return {
    case_id: "case-test-1",
    max_budget_sar: 1000000,
    purchase_method: "cash",
    household_size: 4,
    min_bedrooms: 3,
    min_area_sqm: 100,
    hard_constraints: [],
    preferences: [],
    important_locations: [],
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("Commercial Flow: Free Readiness Check", () => {
  const validRequirements = makeRequirements();
  const validProperty: PreflightPropertyInput = {
    id: "prop-1",
    label: "شقة الياسمين الفاخرة",
    district: "الياسمين",
    listingPriceSar: 850000,
    areaSqm: 130,
    floorNo: 2,
    buildingAgeYears: 1,
    resolved: makeReadyResolved(),
  };

  it("returns complete case readiness when buyer profile, 1-5 properties, and all 5 fields are present", () => {
    const input: PreflightInput = {
      requirements: validRequirements,
      properties: [validProperty],
    };
    const res = evaluatePreflight(input);

    expect(res.readiness.isReady).toBe(true);
    expect(res.readiness.status).toBe("complete");
    expect(res.readiness.buyerProfileComplete).toBe(true);
    expect(res.readiness.propertyCountValid).toBe(true);
    expect(res.readiness.propertyCount).toBe(1);
    expect(res.readiness.allMissingItems).toHaveLength(0);

    const propReadiness = res.readiness.properties[0];
    expect(propReadiness.isComplete).toBe(true);
    expect(propReadiness.status).toBe("complete");
    expect(propReadiness.missingItems).toHaveLength(0);
    expect(propReadiness.fields.price).toBe(true);
    expect(propReadiness.fields.area).toBe(true);
    expect(propReadiness.fields.district).toBe(true);
    expect(propReadiness.fields.floor).toBe(true);
    expect(propReadiness.fields.buildingAge).toBe(true);
  });

  it("identifies missing buyer profile items when requirements are absent or zero", () => {
    const input: PreflightInput = {
      requirements: null,
      properties: [validProperty],
    };
    const res = evaluatePreflight(input);

    expect(res.readiness.isReady).toBe(false);
    expect(res.readiness.status).toBe("missing_items");
    expect(res.readiness.buyerProfileComplete).toBe(false);
    expect(res.readiness.buyerProfileMissing.length).toBeGreaterThan(0);
  });

  it("identifies missing items per property for price, area, district, floor, or age", () => {
    const incompleteResolved = makeEmptyResolved();
    // Only district is known
    incompleteResolved.fields.district = {
      status: "known",
      value: "النرجس",
      certainty: "reported",
      factIds: ["fd"],
    };

    const incompleteProperty: PreflightPropertyInput = {
      id: "prop-incomplete",
      label: "شقة غير مكتملة",
      district: "النرجس",
      resolved: incompleteResolved,
    };

    const input: PreflightInput = {
      requirements: validRequirements,
      properties: [incompleteProperty],
    };

    const res = evaluatePreflight(input);

    expect(res.readiness.isReady).toBe(false);
    expect(res.readiness.status).toBe("missing_items");

    const p = res.readiness.properties[0];
    expect(p.isComplete).toBe(false);
    expect(p.status).toBe("missing_items");
    expect(p.missingItems).toContain("سعر العرض");
    expect(p.missingItems).toContain("المساحة (م²)");
    expect(p.missingItems).toContain("رقم الدور");
    expect(p.missingItems).toContain("عمر المبنى");
    expect(p.missingItems).not.toContain("الحي"); // District is present
  });

  it("flags cases with zero properties or more than 5 properties as not ready", () => {
    const zeroProps: PreflightInput = {
      requirements: validRequirements,
      properties: [],
    };
    expect(evaluatePreflight(zeroProps).readiness.isReady).toBe(false);
    expect(evaluatePreflight(zeroProps).readiness.propertyCountValid).toBe(false);

    const sixProps: PreflightInput = {
      requirements: validRequirements,
      properties: Array.from({ length: 6 }, (_, i) => ({
        ...validProperty,
        id: `prop-${i + 1}`,
      })),
    };
    expect(evaluatePreflight(sixProps).readiness.isReady).toBe(false);
    expect(evaluatePreflight(sixProps).readiness.propertyCountValid).toBe(false);
  });
});
