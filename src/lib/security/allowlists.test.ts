import { describe, it, expect, expectTypeOf } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import {
  buildAIAnalysisPayload,
  buildAIExtractionPayload,
  buildPaymentPayload,
  type CleanFact,
  type CleanRequirements,
} from "@/lib/security/allowlists";
import { MockPaymentProvider } from "@/lib/payments/mock";
import { analyzeProperty } from "@/lib/ai/analyze";
import { extractFactsFromText } from "@/lib/ai/extract";
import type { PropertyAnalysisPromptInput } from "@/lib/ai/prompts/analysis";
import type { RequirementsRow } from "@/lib/analysis/constraints";

const SENSITIVE = {
  user_id: "SECRET_USER_ID",
  email: "secret@example.com",
  raw_db_row: { id: "SECRET_ROW_ID" },
  internal_token: "SECRET_INTERNAL_TOKEN",
};

const requirementsRow = {
  ...SENSITIVE,
  case_id: "SECRET_CASE_ID",
  updated_at: "2026-10-07T00:00:00Z",
  max_budget_sar: 900000,
  purchase_method: "finance",
  household_size: 5,
  min_bedrooms: 3,
  min_area_sqm: 120,
  hard_constraints: [
    { key: "elevator_required", label: "مصعد", ...SENSITIVE },
    { key: "max_floor", label: "حتى الدور 3", value: 3 },
  ],
  preferences: [{ label: "قريب من مدرسة", weight: "high", user_id: "SECRET_USER_ID" }],
  important_locations: [
    { label: "العمل", address_text: "SECRET_WORK_ADDRESS", frequency: "daily" },
  ],
};

const factRow = {
  ...SENSITIVE,
  id: "SECRET_FACT_ID",
  property_id: "SECRET_PROPERTY_ID",
  created_at: "2026-10-07T00:00:00Z",
  field: "listing_price_sar",
  label: "سعر العرض (ريال)",
  value: 850000,
  certainty: "reported",
};

describe("buildAIExtractionPayload", () => {
  it("returns strictly { text }", () => {
    const payload = buildAIExtractionPayload("شقة للبيع");

    expect(payload).toEqual({ text: "شقة للبيع" });
    expect(Object.keys(payload)).toEqual(["text"]);
  });

  it("rejects an object smuggled in place of the text", () => {
    expect(() => buildAIExtractionPayload({ ...SENSITIVE, text: "x" } as unknown as string)).toThrow();
  });
});

describe("buildAIAnalysisPayload", () => {
  it("drops every unauthorized key from requirements and facts", () => {
    const payload = buildAIAnalysisPayload(requirementsRow, [factRow]);

    expect(Object.keys(payload).sort()).toEqual(["facts", "requirements"]);
    expect(Object.keys(payload.requirements).sort()).toEqual([
      "hard_constraints",
      "max_budget_sar",
      "min_area_sqm",
      "min_bedrooms",
      "preferences",
    ]);
    expect(payload.requirements.hard_constraints).toEqual([
      { key: "elevator_required", label: "مصعد" },
      { key: "max_floor", label: "حتى الدور 3", value: 3 },
    ]);
    expect(payload.facts).toEqual([
      { field: "listing_price_sar", label: "سعر العرض (ريال)", value: 850000, certainty: "reported" },
    ]);

    const serialized = JSON.stringify(payload);
    for (const secret of [
      "SECRET_USER_ID",
      "secret@example.com",
      "SECRET_ROW_ID",
      "SECRET_INTERNAL_TOKEN",
      "SECRET_CASE_ID",
      "SECRET_FACT_ID",
      "SECRET_PROPERTY_ID",
      "SECRET_WORK_ADDRESS",
      "updated_at",
      "created_at",
    ]) {
      expect(serialized).not.toContain(secret);
    }
  });

  it("rejects facts outside the allowlisted fields or with non-scalar values", () => {
    expect(() => buildAIAnalysisPayload(requirementsRow, [{ ...factRow, field: "owner_notes" }])).toThrow();
    expect(() => buildAIAnalysisPayload(requirementsRow, [{ ...factRow, field: "listing_claim" }])).toThrow();
    expect(() =>
      buildAIAnalysisPayload(requirementsRow, [{ ...factRow, value: { nested: "SECRET_RAW" } }])
    ).toThrow();
  });

  it("sanitizes propertyLabel, city, and listingClaims and strips toxic keys", () => {
    const payload = buildAIAnalysisPayload(requirementsRow, [factRow], {
      propertyLabel: "   شقة فاخرة بحي النرجس شمال الرياض قريبة جدا من جميع الخدمات الرئيسية والمدارس والمراكز التجارية   ",
      city: "الرياض",
      listingClaims: [
        { scope: "الوحدة", claim: "إطلالة بانورامية مميزة على الحديقة", ...SENSITIVE },
      ],
    });

    expect(payload.propertyLabel?.length).toBeLessThanOrEqual(60);
    expect(payload.city).toBe("الرياض");
    expect(payload.listingClaims).toEqual([
      { scope: "الوحدة", claim: "إطلالة بانورامية مميزة على الحديقة" },
    ]);
    const serialized = JSON.stringify(payload);
    for (const secret of Object.values(SENSITIVE)) {
      if (typeof secret === "string") {
        expect(serialized).not.toContain(secret);
      }
    }
  });

  it("rejects non-allowlisted cities or smuggled objects in propertyLabel", () => {
    expect(() =>
      buildAIAnalysisPayload(requirementsRow, [factRow], {
        propertyLabel: { secret: "toxic" },
      })
    ).toThrow();

    expect(() =>
      buildAIAnalysisPayload(requirementsRow, [factRow], {
        city: "London",
      })
    ).toThrow();
  });
});

describe("buildPaymentPayload", () => {
  it("returns strictly { case_id, amount: 10, currency: 'SAR', return_url }", () => {
    const payload = buildPaymentPayload("case-1", 10, "/case/case-1/results");

    expect(payload).toEqual({
      case_id: "case-1",
      amount: 10,
      currency: "SAR",
      return_url: "/case/case-1/results",
    });
    expect(Object.keys(payload).sort()).toEqual(["amount", "case_id", "currency", "return_url"]);
  });

  it("rejects a tampered amount and unsafe return URLs", () => {
    expect(() => buildPaymentPayload("case-1", 1, "/case/case-1/results")).toThrow();
    expect(() => buildPaymentPayload("case-1", 10, "//evil.example.com")).toThrow();
    expect(() => buildPaymentPayload("case-1", 10, "javascript:alert(1)")).toThrow();
  });
});

describe("compile-time allowlist pinning", () => {
  it("fails type-checking if a key is added to a schema without updating this list", () => {
    expectTypeOf<keyof CleanRequirements>().toEqualTypeOf<
      "max_budget_sar" | "min_bedrooms" | "min_area_sqm" | "hard_constraints" | "preferences"
    >();
    expectTypeOf<keyof CleanFact>().toEqualTypeOf<"field" | "label" | "value" | "certainty">();
    expectTypeOf<keyof ReturnType<typeof buildPaymentPayload>>().toEqualTypeOf<
      "case_id" | "amount" | "currency" | "return_url"
    >();
    expectTypeOf<keyof ReturnType<typeof buildAIExtractionPayload>>().toEqualTypeOf<"text">();
  });
});

describe("integration audit: outbound payloads", () => {
  it("payment provider URL carries only the reference key and the return path", async () => {
    const result = await new MockPaymentProvider().initiatePayment({
      caseId: "case-1",
      amountSar: 10,
      idempotencyKey: "checkout_case-1_v1_a1",
      returnUrl: "/case/case-1/results",
    });

    const url = new URL(result.redirectUrl, "https://app.test");
    expect(Array.from(url.searchParams.keys()).sort()).toEqual(["key", "return"]);
  });

  it("payment provider refuses a non-10 SAR amount", async () => {
    await expect(
      new MockPaymentProvider().initiatePayment({
        caseId: "case-1",
        amountSar: 1,
        idempotencyKey: "k",
        returnUrl: "/case/case-1/results",
      })
    ).rejects.toThrow();
  });

  it("Gemini analysis prompt contains no ids, locations or secrets", async () => {
    let captured = "";
    const model = new MockLanguageModelV4({
      doGenerate: async (options) => {
        captured = JSON.stringify(options.prompt);
        throw new Error("captured");
      },
    });

    const input = {
      propertyLabel: "شقة الياسمين",
      city: "الرياض",
      requirements: requirementsRow as unknown as RequirementsRow,
      constraints: [],
      knownFacts: [factRow] as unknown as PropertyAnalysisPromptInput["knownFacts"],
      unknownFieldKeys: [],
      conflictingFieldKeys: [],
      listingClaims: [],
    } satisfies PropertyAnalysisPromptInput;

    await expect(analyzeProperty(input, model)).rejects.toThrow();

    expect(captured).toContain("900,000");
    for (const secret of [
      "SECRET_USER_ID",
      "secret@example.com",
      "SECRET_INTERNAL_TOKEN",
      "SECRET_CASE_ID",
      "SECRET_PROPERTY_ID",
      "SECRET_WORK_ADDRESS",
    ]) {
      expect(captured).not.toContain(secret);
    }
  });

  it("Gemini extraction prompt contains only the listing text", async () => {
    let captured = "";
    const model = new MockLanguageModelV4({
      doGenerate: async (options) => {
        captured = JSON.stringify(options.prompt);
        throw new Error("captured");
      },
    });

    await expect(extractFactsFromText("شقة للبيع في حي الياسمين", model)).rejects.toThrow();

    expect(captured).toContain("شقة للبيع في حي الياسمين");
  });
});
