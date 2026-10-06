import { describe, it, expect } from "vitest";
import {
  evaluatePreflight,
  PreflightInput,
  PreflightPropertyInput,
  RequirementsRow,
} from "./evaluate";
import { ResolveFactsResult, ResolvedFieldsMap, PropertyFact, resolveFacts } from "@/lib/evidence/resolve";
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
  resolved.fields.bedrooms = {
    status: "known",
    value: 3,
    certainty: "reported",
    factIds: ["f3"],
  };
  resolved.fields.elevator = {
    status: "known",
    value: true,
    certainty: "reported",
    factIds: ["f4"],
  };
  resolved.fields.private_parking = {
    status: "known",
    value: true,
    certainty: "reported",
    factIds: ["f5"],
  };
  resolved.fields.floor_no = {
    status: "known",
    value: 2,
    certainty: "reported",
    factIds: ["f6"],
  };
  resolved.fields.property_age_years = {
    status: "known",
    value: 1,
    certainty: "reported",
    factIds: ["f7"],
  };
  return resolved;
}

function makeRequirements(overrides: Partial<RequirementsRow> = {}): RequirementsRow {
  return {
    id: "req-test-1",
    case_id: "case-test-1",
    max_budget_sar: 1000000,
    purchase_method: "cash",
    household_size: 4,
    min_bedrooms: 3,
    min_area_sqm: 100,
    hard_constraints: [],
    preferences: [],
    important_locations: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("Preflight evaluation - Individual Blockers and Warnings (Acceptance 1)", () => {
  const readyRequirements = makeRequirements();
  const readyProperty: PreflightPropertyInput = {
    id: "prop-1",
    label: "شقة الياسمين",
    latestRun: { status: "succeeded" },
    resolved: makeReadyResolved(),
  };

  it("Fully ready case returns ready=true, blockers=[], warnings=[]", () => {
    const input: PreflightInput = {
      requirements: readyRequirements,
      properties: [readyProperty],
    };
    const res = evaluatePreflight(input);
    expect(res.ready).toBe(true);
    expect(res.blockers).toHaveLength(0);
    expect(res.warnings).toHaveLength(0);
  });

  describe("Blockers", () => {
    it("NO_REQUIREMENTS: missing requirements makes ready=false", () => {
      const input: PreflightInput = {
        requirements: null,
        properties: [readyProperty],
      };
      const res = evaluatePreflight(input);
      expect(res.ready).toBe(false);
      expect(res.blockers.some((b) => b.code === "NO_REQUIREMENTS")).toBe(true);
    });

    it("NO_PROPERTIES: zero properties makes ready=false", () => {
      const input: PreflightInput = {
        requirements: readyRequirements,
        properties: [],
      };
      const res = evaluatePreflight(input);
      expect(res.ready).toBe(false);
      expect(res.blockers.some((b) => b.code === "NO_PROPERTIES")).toBe(true);
    });

    it("EXTRACTION_RUNNING: a running extraction makes ready=false", () => {
      const input: PreflightInput = {
        requirements: readyRequirements,
        properties: [
          {
            ...readyProperty,
            latestRun: { status: "running" },
          },
        ],
      };
      const res = evaluatePreflight(input);
      expect(res.ready).toBe(false);
      const b = res.blockers.find((item) => item.code === "EXTRACTION_RUNNING");
      expect(b).toBeDefined();
      expect(b?.propertyId).toBe("prop-1");
    });

    it("EXTRACTION_FAILED_NO_DATA: failed run with zero known facts makes ready=false", () => {
      const emptyResolved = makeEmptyResolved();
      const input: PreflightInput = {
        requirements: readyRequirements,
        properties: [
          {
            id: "prop-failed",
            label: "عقار غير مكتمل",
            latestRun: { status: "failed" },
            resolved: emptyResolved,
          },
        ],
      };
      const res = evaluatePreflight(input);
      expect(res.ready).toBe(false);
      expect(res.blockers.some((b) => b.code === "EXTRACTION_FAILED_NO_DATA")).toBe(true);
    });

    it("CRITICAL_CONFLICT: listing_price_sar conflicting makes ready=false", () => {
      const resolved = makeReadyResolved();
      resolved.fields.listing_price_sar = {
        status: "conflicting",
        candidates: [
          { value: 800000, factIds: ["f1"], sources: ["url"] },
          { value: 900000, factIds: ["f2"], sources: ["image"] },
        ],
      };

      const input: PreflightInput = {
        requirements: readyRequirements,
        properties: [{ ...readyProperty, resolved }],
      };
      const res = evaluatePreflight(input);
      expect(res.ready).toBe(false);
      const b = res.blockers.find(
        (item) => item.code === "CRITICAL_CONFLICT" && item.field === "listing_price_sar"
      );
      expect(b).toBeDefined();
    });

    it("CRITICAL_CONFLICT: area_sqm conflicting makes ready=false", () => {
      const resolved = makeReadyResolved();
      resolved.fields.area_sqm = {
        status: "conflicting",
        candidates: [
          { value: 140, factIds: ["f1"], sources: ["url"] },
          { value: 125, factIds: ["f2"], sources: ["image"] },
        ],
      };

      const input: PreflightInput = {
        requirements: readyRequirements,
        properties: [{ ...readyProperty, resolved }],
      };
      const res = evaluatePreflight(input);
      expect(res.ready).toBe(false);
      const b = res.blockers.find(
        (item) => item.code === "CRITICAL_CONFLICT" && item.field === "area_sqm"
      );
      expect(b).toBeDefined();
    });

    it("NOTHING_TO_ANALYZE: none of critical fields (price, area, bedrooms) known makes ready=false", () => {
      const resolved = makeEmptyResolved();
      // Only non-critical field is known
      resolved.fields.district = {
        status: "known",
        value: "الملقا",
        certainty: "reported",
        factIds: ["fd"],
      };

      const input: PreflightInput = {
        requirements: readyRequirements,
        properties: [{ ...readyProperty, resolved }],
      };
      const res = evaluatePreflight(input);
      expect(res.ready).toBe(false);
      expect(res.blockers.some((b) => b.code === "NOTHING_TO_ANALYZE")).toBe(true);
    });
  });

  describe("Warnings (ready can still be true)", () => {
    it("PRICE_UNKNOWN: listing_price_sar unknown generates warning, ready remains true", () => {
      const resolved = makeReadyResolved();
      resolved.fields.listing_price_sar = { status: "unknown" };

      const input: PreflightInput = {
        requirements: readyRequirements,
        properties: [{ ...readyProperty, resolved }],
      };
      const res = evaluatePreflight(input);
      expect(res.ready).toBe(true);
      expect(res.warnings.some((w) => w.code === "PRICE_UNKNOWN")).toBe(true);
    });

    it("AREA_UNKNOWN: area_sqm unknown generates warning, ready remains true", () => {
      const resolved = makeReadyResolved();
      resolved.fields.area_sqm = { status: "unknown" };

      const input: PreflightInput = {
        requirements: readyRequirements,
        properties: [{ ...readyProperty, resolved }],
      };
      const res = evaluatePreflight(input);
      expect(res.ready).toBe(true);
      expect(res.warnings.some((w) => w.code === "AREA_UNKNOWN")).toBe(true);
    });

    it("BEDROOMS_UNKNOWN: bedrooms unknown generates warning, ready remains true", () => {
      const resolved = makeReadyResolved();
      resolved.fields.bedrooms = { status: "unknown" };

      const input: PreflightInput = {
        requirements: readyRequirements,
        properties: [{ ...readyProperty, resolved }],
      };
      const res = evaluatePreflight(input);
      expect(res.ready).toBe(true);
      expect(res.warnings.some((w) => w.code === "BEDROOMS_UNKNOWN")).toBe(true);
    });

    it("NON_CRITICAL_CONFLICT: any other conflicting field generates warning, ready remains true", () => {
      const resolved = makeReadyResolved();
      resolved.fields.floor_no = {
        status: "conflicting",
        candidates: [
          { value: 2, factIds: ["f1"], sources: ["url"] },
          { value: 3, factIds: ["f2"], sources: ["image"] },
        ],
      };

      const input: PreflightInput = {
        requirements: readyRequirements,
        properties: [{ ...readyProperty, resolved }],
      };
      const res = evaluatePreflight(input);
      expect(res.ready).toBe(true);
      const w = res.warnings.find(
        (item) => item.code === "NON_CRITICAL_CONFLICT" && item.field === "floor_no"
      );
      expect(w).toBeDefined();
    });

    it("CONSTRAINT_UNVERIFIABLE: hard constraint references an unknown field", () => {
      const reqWithConstraints = makeRequirements({
        hard_constraints: [
          { key: "elevator_required", label: "يلزم وجود مصعد" },
          { key: "max_floor", label: "أقصى دور 4", value: 4 },
          { key: "private_parking", label: "موقف خاص مطلوب" },
          { key: "new_building_only", label: "بناء حديث فقط" },
        ],
      });

      const resolved = makeReadyResolved();
      resolved.fields.elevator = { status: "unknown" };
      resolved.fields.floor_no = { status: "unknown" };
      resolved.fields.private_parking = { status: "unknown" };
      resolved.fields.property_age_years = { status: "unknown" };

      const input: PreflightInput = {
        requirements: reqWithConstraints,
        properties: [{ ...readyProperty, resolved }],
      };
      const res = evaluatePreflight(input);
      expect(res.ready).toBe(true);

      const constraintWarnings = res.warnings.filter(
        (w) => w.code === "CONSTRAINT_UNVERIFIABLE"
      );
      expect(constraintWarnings).toHaveLength(4);
      expect(constraintWarnings.some((w) => w.field === "elevator")).toBe(true);
      expect(constraintWarnings.some((w) => w.field === "floor_no")).toBe(true);
      expect(constraintWarnings.some((w) => w.field === "private_parking")).toBe(true);
      expect(constraintWarnings.some((w) => w.field === "property_age_years")).toBe(true);
    });
  });
});

describe("Acceptance 2: Blocker persistence test (unit)", () => {
  it("CRITICAL_CONFLICT on area persists across unrelated input changes, and clears only when corrected", () => {
    // 1. Initial property facts with conflict on area_sqm (140 vs 125)
    const baseFacts: PropertyFact[] = [
      {
        id: "f-price",
        property_id: "p1",
        extraction_run_id: null,
        field: "listing_price_sar",
        value: 900000,
        raw_text: "900,000",
        scope: "unit",
        source: "url",
        evidence_text: "السعر 900 ألف",
        evidence_verified: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "f-beds",
        property_id: "p1",
        extraction_run_id: null,
        field: "bedrooms",
        value: 3,
        raw_text: "3 غرف",
        scope: "unit",
        source: "url",
        evidence_text: "ثلاث غرف نوم",
        evidence_verified: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "f-area-url",
        property_id: "p1",
        extraction_run_id: null,
        field: "area_sqm",
        value: 140,
        raw_text: "140 م²",
        scope: "unit",
        source: "url",
        evidence_text: "المساحة 140",
        evidence_verified: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "f-area-img",
        property_id: "p1",
        extraction_run_id: null,
        field: "area_sqm",
        value: 125,
        raw_text: "125 م²",
        scope: "unit",
        source: "image",
        evidence_text: "المساحة 125",
        evidence_verified: false,
        created_at: new Date().toISOString(),
      },
    ];

    let req = makeRequirements({
      preferences: [{ label: "قريب من مدرسة", weight: "high" }],
    });

    // Resolve facts
    let resolved = resolveFacts(baseFacts);
    expect(resolved.fields.area_sqm.status).toBe("conflicting");

    // Preflight run 1: CRITICAL_CONFLICT present
    let preflight = evaluatePreflight({
      requirements: req,
      properties: [
        {
          id: "p1",
          label: "شقة الياسمين",
          latestRun: { status: "succeeded" },
          resolved,
        },
      ],
    });
    expect(preflight.ready).toBe(false);
    expect(
      preflight.blockers.some(
        (b) => b.code === "CRITICAL_CONFLICT" && b.field === "area_sqm"
      )
    ).toBe(true);

    // 2. Change an unrelated input (e.g. modify requirements preference or budget)
    req = {
      ...req,
      preferences: [
        { label: "قريب من مدرسة", weight: "high" },
        { label: "إطلالة مفتوحة", weight: "medium" },
      ],
      max_budget_sar: 1200000,
    };

    // Preflight run 2: CRITICAL_CONFLICT still yields without persisting any blocker table
    preflight = evaluatePreflight({
      requirements: req,
      properties: [
        {
          id: "p1",
          label: "شقة الياسمين",
          latestRun: { status: "succeeded" },
          resolved,
        },
      ],
    });
    expect(preflight.ready).toBe(false);
    expect(
      preflight.blockers.some(
        (b) => b.code === "CRITICAL_CONFLICT" && b.field === "area_sqm"
      )
    ).toBe(true);

    // 3. User adds a correction for area_sqm (125)
    const correctedFacts: PropertyFact[] = [
      ...baseFacts,
      {
        id: "f-area-corr",
        property_id: "p1",
        extraction_run_id: null,
        field: "area_sqm",
        value: 125,
        raw_text: "125",
        scope: "unit",
        source: "user_correction",
        evidence_text: null,
        evidence_verified: false,
        created_at: new Date().toISOString(),
      },
    ];

    resolved = resolveFacts(correctedFacts);
    expect(resolved.fields.area_sqm.status).toBe("known");

    // Preflight run 3: Blocker is dynamically cleared and case is now ready
    preflight = evaluatePreflight({
      requirements: req,
      properties: [
        {
          id: "p1",
          label: "شقة الياسمين",
          latestRun: { status: "succeeded" },
          resolved,
        },
      ],
    });
    expect(preflight.ready).toBe(true);
    expect(
      preflight.blockers.some(
        (b) => b.code === "CRITICAL_CONFLICT" && b.field === "area_sqm"
      )
    ).toBe(false);
  });
});
