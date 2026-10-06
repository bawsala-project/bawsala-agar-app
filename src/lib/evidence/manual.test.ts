import { describe, it, expect } from "vitest";
import { createManualFacts, type ManualPropertyInput } from "./manual";

describe("manual.ts - createManualFacts", () => {
  it("maps complete manual property columns to facts", () => {
    const input: ManualPropertyInput = {
      id: "prop-xyz",
      title: "شقة للبيع",
      district: "الياسمين",
      listing_price_sar: 950000,
      area_sqm: 180,
      bedrooms: 4,
      floor_no: 3,
    };

    const facts = createManualFacts(input);
    expect(facts).toHaveLength(6);

    const priceFact = facts.find((f) => f.field === "listing_price_sar");
    expect(priceFact).toBeDefined();
    expect(priceFact?.value).toBe(950000);
    expect(priceFact?.source).toBe("manual");
    expect(priceFact?.scope).toBe("unit");

    const areaFact = facts.find((f) => f.field === "area_sqm");
    expect(areaFact?.value).toBe(180);

    const districtFact = facts.find((f) => f.field === "district");
    expect(districtFact?.value).toBe("الياسمين");
    expect(districtFact?.scope).toBe("neighborhood");

    const claimFact = facts.find((f) => f.field === "listing_claim");
    expect(claimFact?.value).toBe("شقة للبيع");
    expect(claimFact?.scope).toBe("unit");
  });

  it("omits null or undefined columns", () => {
    const input: ManualPropertyInput = {
      id: "prop-sparse",
      title: null,
      district: "النرجس",
      listing_price_sar: null,
      area_sqm: undefined,
      bedrooms: 3,
      floor_no: null,
    };

    const facts = createManualFacts(input);
    expect(facts).toHaveLength(2); // district and bedrooms
    expect(facts.map((f) => f.field)).toEqual(["bedrooms", "district"]);
  });
});
