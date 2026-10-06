import { describe, it, expect } from "vitest";
import { resolveFacts, type PropertyFact } from "./resolve";

function createMockFact(overrides: Partial<PropertyFact>): PropertyFact {
  return {
    id: `fact-${Math.random().toString(36).substring(2, 9)}`,
    property_id: "prop-123",
    extraction_run_id: null,
    field: "bedrooms",
    value: 3,
    raw_text: "3 غرف",
    scope: "unit",
    source: "url",
    evidence_text: null,
    evidence_verified: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("resolve.ts - Resolution test suite", () => {
  it("returns unknown when no facts exist for a field", () => {
    const result = resolveFacts([]);
    expect(result.bedrooms).toEqual({ status: "unknown" });
    expect(result.listing_price_sar).toEqual({ status: "unknown" });
  });

  it("resolves single known fact from url as 'reported'", () => {
    const fact = createMockFact({
      field: "bedrooms",
      value: 4,
      source: "url",
    });

    const result = resolveFacts([fact]);
    expect(result.bedrooms).toEqual({
      status: "known",
      value: 4,
      certainty: "reported",
      factIds: [fact.id],
    });
  });

  it("keeps certainty as 'reported' when two equal values are reported (no corroboration upgrade)", () => {
    const fact1 = createMockFact({
      id: "f1",
      field: "area_sqm",
      value: 150,
      source: "url",
    });
    const fact2 = createMockFact({
      id: "f2",
      field: "area_sqm",
      value: 150,
      source: "image",
    });

    const result = resolveFacts([fact1, fact2]);
    expect(result.area_sqm).toEqual({
      status: "known",
      value: 150,
      certainty: "reported",
      factIds: ["f1", "f2"],
    });
  });

  it("marks field as conflicting when two different values exist", () => {
    const fact1 = createMockFact({
      id: "f1",
      field: "listing_price_sar",
      value: 800000,
      source: "url",
    });
    const fact2 = createMockFact({
      id: "f2",
      field: "listing_price_sar",
      value: 850000,
      source: "image",
    });

    const result = resolveFacts([fact1, fact2]);
    expect(result.listing_price_sar.status).toBe("conflicting");

    if (result.listing_price_sar.status === "conflicting") {
      expect(result.listing_price_sar.candidates).toHaveLength(2);
      expect(result.listing_price_sar.candidates.map((c) => c.value)).toContain(800000);
      expect(result.listing_price_sar.candidates.map((c) => c.value)).toContain(850000);
    }
  });

  it("overrides conflicting observations when user_correction exists", () => {
    const fact1 = createMockFact({
      id: "f1",
      field: "bedrooms",
      value: 3,
      source: "url",
      created_at: "2026-10-04T01:00:00Z",
    });
    const fact2 = createMockFact({
      id: "f2",
      field: "bedrooms",
      value: 4,
      source: "image",
      created_at: "2026-10-04T01:05:00Z",
    });
    const correction = createMockFact({
      id: "c1",
      field: "bedrooms",
      value: 5,
      source: "user_correction",
      created_at: "2026-10-04T01:10:00Z",
    });

    const result = resolveFacts([fact1, fact2, correction]);
    expect(result.bedrooms).toEqual({
      status: "known",
      value: 5,
      certainty: "user_stated",
      factIds: ["c1"],
    });
  });

  it("picks the most recent user_correction if multiple exist", () => {
    const correctionOlder = createMockFact({
      id: "c_old",
      field: "floor_no",
      value: 2,
      source: "user_correction",
      created_at: "2026-10-04T01:00:00Z",
    });
    const correctionNewer = createMockFact({
      id: "c_new",
      field: "floor_no",
      value: 3,
      source: "user_correction",
      created_at: "2026-10-04T02:00:00Z",
    });

    const result = resolveFacts([correctionOlder, correctionNewer]);
    expect(result.floor_no).toEqual({
      status: "known",
      value: 3,
      certainty: "user_stated",
      factIds: ["c_new"],
    });
  });

  it("resolves manual-only fact as 'user_stated'", () => {
    const fact = createMockFact({
      id: "m1",
      field: "district",
      value: "النرجس",
      source: "manual",
    });

    const result = resolveFacts([fact]);
    expect(result.district).toEqual({
      status: "known",
      value: "النرجس",
      certainty: "user_stated",
      factIds: ["m1"],
    });
  });

  it("separates listing_claims and groups them by scope without resolving them", () => {
    const claim1 = createMockFact({
      field: "listing_claim",
      value: "إطلالة بانورامية رائعة",
      scope: "unit",
    });
    const claim2 = createMockFact({
      field: "listing_claim",
      value: "واجهة كلادينج فاخرة",
      scope: "building",
    });
    const claim3 = createMockFact({
      field: "listing_claim",
      value: "قريب من حديقة ومسجد",
      scope: "neighborhood",
    });

    const result = resolveFacts([claim1, claim2, claim3]);
    expect(result.claims.unit).toHaveLength(1);
    expect(result.claims.unit[0].value).toBe("إطلالة بانورامية رائعة");
    expect(result.claims.building).toHaveLength(1);
    expect(result.claims.neighborhood).toHaveLength(1);
  });
});
