import { describe, it, expect } from "vitest";
import {
  buyerProfileSchema,
  budgetStepSchema,
  householdStepSchema,
  dailyLifeStepSchema,
  needsStepSchema,
  prioritiesStepSchema,
  constraintsStepSchema,
  DEFAULT_BUYER_PROFILE,
} from "./buyer-profile";

describe("BuyerProfile Schema & Validations", () => {
  it("validates the default buyer profile successfully", () => {
    const result = buyerProfileSchema.safeParse(DEFAULT_BUYER_PROFILE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.max_budget_sar).toBe(1_000_000);
      expect(result.data.payment_method).toBe("cash");
      expect(result.data.ranked_priorities).toHaveLength(5);
    }
  });

  it("validates budget step correctly for cash payment", () => {
    const cashBudget = {
      max_budget_sar: 1_200_000,
      payment_method: "cash",
      monthly_installment_ceiling_sar: null,
    };
    const result = budgetStepSchema.safeParse(cashBudget);
    expect(result.success).toBe(true);
  });

  it("rejects invalid budget below minimum threshold", () => {
    const invalidBudget = {
      max_budget_sar: 10_000, // below 100,000 SAR minimum
      payment_method: "cash",
    };
    const result = budgetStepSchema.safeParse(invalidBudget);
    expect(result.success).toBe(false);
  });

  it("validates household step correctly", () => {
    const household = {
      family_members_count: 5,
      children_count: 3,
      children_ages_range: "3-12",
      has_elderly: true,
      car_count: 2,
    };
    const result = householdStepSchema.safeParse(household);
    expect(result.success).toBe(true);
  });

  it("validates daily life step correctly", () => {
    const dailyLife = {
      work_location: "مركز الملك عبدالله المالي",
      school_location: "حي النرجس",
      commute_tolerance_minutes: 35,
      preferred_neighborhood_type: "vibrant_services",
    };
    const result = dailyLifeStepSchema.safeParse(dailyLife);
    expect(result.success).toBe(true);
  });

  it("validates needs step with specifications", () => {
    const needs = {
      min_bedrooms: 3,
      min_bathrooms: 2,
      min_area_sqm: 140,
      floor_preference: "middle",
      elevator_required: true,
      parking_required: true,
      maid_room_required: false,
      outdoor_space_required: true,
    };
    const result = needsStepSchema.safeParse(needs);
    expect(result.success).toBe(true);
  });

  it("validates priorities step with top 5 ranked items", () => {
    const priorities = {
      ranked_priorities: ["price", "location", "space", "quality", "quiet_privacy"],
    };
    const result = prioritiesStepSchema.safeParse(priorities);
    expect(result.success).toBe(true);
  });

  it("rejects priorities step if less than 1 or more than 5 items", () => {
    const empty = { ranked_priorities: [] };
    expect(prioritiesStepSchema.safeParse(empty).success).toBe(false);

    const tooMany = {
      ranked_priorities: [
        "price",
        "location",
        "quality",
        "space",
        "quiet_privacy",
        "resale_value",
      ],
    };
    expect(prioritiesStepSchema.safeParse(tooMany).success).toBe(false);
  });

  it("validates constraints step with free chips and purchase timeline", () => {
    const constraints = {
      deal_breakers: ["بدون شهادة إتمام بناء", "صك مشاع", "شارع أقل من 15 متر"],
      purchase_timeline: "short_3m",
    };
    const result = constraintsStepSchema.safeParse(constraints);
    expect(result.success).toBe(true);
  });
});
