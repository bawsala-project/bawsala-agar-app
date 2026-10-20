import { describe, it, expect } from "vitest";
import {
  evaluatePropertyFit,
  evaluateCaseFit,
  evaluateSuitability,
  evaluatePriceAffordability,
  evaluateLocationDailyLife,
  evaluatePropertyQuality,
  evaluateRisks,
  type PropertyDataInput,
} from "./fit-evaluator";
import { computeDimensionWeights } from "./weights";
import { DEFAULT_BUYER_PROFILE, type BuyerProfile } from "@/lib/schemas/buyer-profile";
import type { ResolvedField } from "@/lib/evidence/resolve";

function knownField(value: unknown, certainty: "reported" | "user_stated" = "user_stated"): ResolvedField {
  return { status: "known", value, certainty, factIds: ["fact-test-1"] };
}

describe("Fit Evaluator: Pure Analysis Logic", () => {
  const sampleProfile: BuyerProfile = {
    ...DEFAULT_BUYER_PROFILE,
    max_budget_sar: 900_000,
    payment_method: "cash",
    family_members_count: 4,
    min_bedrooms: 3,
    min_area_sqm: 130,
    floor_preference: "middle",
    elevator_required: true,
    parking_required: true,
    work_location: "حي الصحافة",
    school_location: "حي الياسمين",
    commute_tolerance_minutes: 35,
    preferred_neighborhood_type: "quiet_family",
    ranked_priorities: ["price", "location", "quality", "space", "quiet_privacy"],
    deal_breakers: ["مبنى بدون مصعد"],
  };

  const idealProperty: PropertyDataInput = {
    id: "prop-ideal",
    title: "شقة الياسمين الفاخرة",
    district: "الياسمين",
    city: "الرياض",
    listingPriceSar: 820_000,
    areaSqm: 145,
    bedrooms: 3,
    bathrooms: 3,
    floorNo: 2,
    buildingAgeYears: 1,
    deedType: "electronic_independent",
    notes: "تشطيب راقي وموقف خاص ومصعد شغال",
    inspectionFindings: [
      { category: "unit_specs", item: "تشطيب", status: "pass", detailAr: "فحص العوازل مطابق" },
    ],
    resolved: {
      fields: {
        listing_price_sar: knownField(820000),
        area_sqm: knownField(145),
        bedrooms: knownField(3),
        bathrooms: knownField(3),
        floor_no: knownField(2),
        building_floors: { status: "unknown" },
        property_age_years: knownField(1),
        district: knownField("الياسمين"),
        elevator: knownField(true),
        private_parking: knownField(true),
      },
      claims: { unit: [], building: [], neighborhood: [] },
    },
  };

  const poorProperty: PropertyDataInput = {
    id: "prop-poor",
    title: "شقة قديمة بدون مصعد",
    district: "الشفاء",
    city: "الرياض",
    listingPriceSar: 1_100_000, // over budget
    areaSqm: 85, // small for 4 people
    bedrooms: 2, // fewer than min 3
    floorNo: 3,
    buildingAgeYears: 14,
    deedType: "shared",
    inspectionFindings: [
      { category: "building_services", item: "مصعد", status: "issue", detailAr: "مصعد معطل" },
    ],
    resolved: {
      fields: {
        listing_price_sar: knownField(1100000, "reported"),
        area_sqm: knownField(85, "reported"),
        bedrooms: knownField(2, "reported"),
        bathrooms: { status: "unknown" },
        floor_no: knownField(3, "reported"),
        building_floors: { status: "unknown" },
        property_age_years: knownField(14, "reported"),
        district: knownField("الشفاء", "reported"),
        elevator: knownField(false, "reported"),
        private_parking: knownField(false, "reported"),
      },
      claims: { unit: [], building: [], neighborhood: [] },
    },
  };

  describe("5 Dimension Pure Evaluations", () => {
    it("computes Suitability: high for ideal bedrooms, area per person and elevator", () => {
      const result = evaluateSuitability(sampleProfile, idealProperty);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.reasonAr).toContain("3 غرف نوم تلبي الحد الأدنى");
      expect(result.supportingEvidence.length).toBeGreaterThan(0);
    });

    it("computes Price & Affordability: rewards savings under budget", () => {
      const result = evaluatePriceAffordability(sampleProfile, idealProperty);
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.reasonAr).toContain("الميزانية القصوى");
    });

    it("computes Price & Affordability: sharply penalizes over-budget property", () => {
      const result = evaluatePriceAffordability(sampleProfile, poorProperty);
      expect(result.score).toBeLessThan(50);
      expect(result.reasonAr).toContain("تجاوز");
    });

    it("computes Location & Daily Life: boosts score when near work/school", () => {
      const result = evaluateLocationDailyLife(sampleProfile, idealProperty);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.reasonAr).toContain("الياسمين");
    });

    it("computes Property Quality: rewards modern building with inspection pass", () => {
      const result = evaluatePropertyQuality(sampleProfile, idealProperty);
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.supportingEvidence.some((e) => e.includes("عمر المبنى"))).toBe(true);
      expect(result.supportingEvidence.some((e) => e.includes("الفحص الهندسي"))).toBe(true);
    });

    it("computes Risks: catches deed issues and area mismatch", () => {
      const mismatchProp: PropertyDataInput = {
        ...idealProperty,
        id: "mismatch-prop",
        resolved: {
          ...idealProperty.resolved!,
          fields: {
            ...idealProperty.resolved!.fields,
            area_sqm: {
              status: "conflicting",
              candidates: [
                { value: 145, factIds: ["fact-1"], sources: ["manual"] },
                { value: 160, factIds: ["fact-2"], sources: ["url"] },
              ],
            },
          },
        },
      };

      const cleanRisk = evaluateRisks(sampleProfile, idealProperty);
      const conflictRisk = evaluateRisks(sampleProfile, mismatchProp);

      expect(cleanRisk.score).toBeGreaterThan(conflictRisk.score);
      expect(conflictRisk.reasonAr).toContain("تعارض في المساحة");
    });
  });

  describe("Weights Calculation", () => {
    it("gives highest weight to rank 1 priority", () => {
      const weightsPriceFirst = computeDimensionWeights(["price", "location", "quality"]);
      expect(weightsPriceFirst.priceAffordability).toBeGreaterThan(weightsPriceFirst.suitability);

      const weightsSpaceFirst = computeDimensionWeights(["space", "price", "location"]);
      expect(weightsSpaceFirst.suitability).toBeGreaterThan(weightsSpaceFirst.priceAffordability);
    });

    it("preserves baseline protection weight for risks regardless of priorities", () => {
      const weights = computeDimensionWeights(["price", "space", "location"]);
      expect(weights.risks).toBeGreaterThanOrEqual(0.09); // baseline safety floor
    });

    it("normalizes all weights so they sum to 1.0", () => {
      const weights = computeDimensionWeights(["quality", "location", "quiet_privacy"]);
      const sum =
        weights.suitability +
        weights.priceAffordability +
        weights.locationDailyLife +
        weights.propertyQuality +
        weights.risks;
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.01);
    });
  });

  describe("Property Fit Evaluation (Comprehensive)", () => {
    it("evaluates ideal property with high fit score and high confidence", () => {
      const fit = evaluatePropertyFit(sampleProfile, idealProperty);

      expect(fit.weightedFitScore).toBeGreaterThanOrEqual(80);
      expect(fit.fitRating).toBe("strong");
      expect(fit.confidence.level).toBe("high");
      expect(fit.isCertain).toBe(true);

      // Top 3 pros and cons
      expect(fit.topPros).toHaveLength(3);
      expect(fit.topCons).toHaveLength(3);
      expect(fit.rankingReasonAr.length).toBeGreaterThan(10);
    });

    it("evaluates poor property with weak fit score", () => {
      const fit = evaluatePropertyFit(sampleProfile, poorProperty);

      expect(fit.weightedFitScore).toBeLessThan(60);
      expect(fit.fitRating).toBe("weak");
    });

    it("flags missing information and reduces confidence when data is scarce", () => {
      const sparseProperty: PropertyDataInput = {
        id: "sparse-1",
        title: "شقة غير مكتملة البيانات",
        listingPriceSar: 750_000,
        areaSqm: 120,
        // missing bedrooms, floorNo, buildingAgeYears, district, etc.
        resolved: {
          fields: {
            listing_price_sar: knownField(750000, "reported"),
            area_sqm: knownField(120, "reported"),
            bedrooms: { status: "unknown" },
            bathrooms: { status: "unknown" },
            floor_no: { status: "unknown" },
            building_floors: { status: "unknown" },
            property_age_years: { status: "unknown" },
            district: { status: "unknown" },
            elevator: { status: "unknown" },
            private_parking: { status: "unknown" },
          },
          claims: { unit: [], building: [], neighborhood: [] },
        },
      };

      const fit = evaluatePropertyFit(sampleProfile, sparseProperty);

      expect(fit.missingInformation.length).toBeGreaterThanOrEqual(4);
      expect(fit.confidence.level).toBe("low");
      // Critical requirement: Never present a score as certain when confidence is low
      expect(fit.isCertain).toBe(false);
      expect(fit.fitRating).toBe("insufficient_evidence");
      expect(fit.rankingReasonAr).toContain("التقييم استرشادي مبدئي لنقص بيانات أساسية");
    });
  });

  describe("Case Fit Evaluation & Ranking", () => {
    it("ranks properties by fit, puts certain options first, and summarizes comparison", () => {
      const caseFit = evaluateCaseFit(sampleProfile, [poorProperty, idealProperty]);

      expect(caseFit.rankedProperties[0].propertyId).toBe(idealProperty.id);
      expect(caseFit.rankedProperties[1].propertyId).toBe(poorProperty.id);
      expect(caseFit.summaryAr).toContain(idealProperty.title);
      expect(caseFit.summaryAr).toContain(String(caseFit.rankedProperties[0].weightedFitScore));
    });
  });
});
