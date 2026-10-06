import { describe, it, expect } from "vitest";
import { analyzeProperty } from "@/lib/ai/analyze";
import type { PropertyAnalysisPromptInput } from "@/lib/ai/prompts/analysis";
import type { RequirementsRow } from "./constraints";

describe("Live AI Model Assessment & Negative Constraints Verification (Acceptance 6)", () => {
  const req: RequirementsRow = {
    id: "req-1",
    case_id: "case-1",
    max_budget_sar: 900000,
    purchase_method: "cash",
    household_size: 4,
    min_bedrooms: 3,
    min_area_sqm: 120,
    hard_constraints: [
      { key: "elevator_required", label: "يلزم وجود مصعد" },
      { key: "private_parking", label: "موقف خاص مطلوب" },
    ],
    preferences: [
      { label: "قريب من مدرسة", weight: "high" },
      { label: "تشطيب حديث", weight: "medium" },
    ],
    important_locations: [
      { label: "مقر العمل", address_text: "حي المروج" },
    ],
  };

  it("Property 1 (Good fit): verifies no market-price claims, no travel times, no buy/don't-buy wording", async () => {
    const propInput: PropertyAnalysisPromptInput = {
      propertyLabel: "شقة حي الياسمين (3 غرف)",
      requirements: req,
      constraints: [
        { key: "budget", labelAr: "ضمن الميزانية", result: "pass", detailAr: "السعر 850,000 ر.س ضمن الميزانية" },
        { key: "bedrooms", labelAr: "غرف النوم", result: "pass", detailAr: "3 غرف نوم" },
        { key: "min_area", labelAr: "المساحة", result: "pass", detailAr: "المساحة 135 م²" },
        { key: "elevator_required", labelAr: "وجود مصعد", result: "pass", detailAr: "يتوفر مصعد في المبنى" },
        { key: "private_parking", labelAr: "موقف خاص", result: "pass", detailAr: "يتوفر موقف خاص" },
      ],
      knownFacts: [
        { field: "listing_price_sar", label: "سعر العرض", value: 850000, certainty: "reported" },
        { field: "area_sqm", label: "المساحة", value: 135, certainty: "reported" },
        { field: "bedrooms", label: "غرف النوم", value: 3, certainty: "reported" },
        { field: "bathrooms", label: "دورات المياه", value: 3, certainty: "reported" },
        { field: "floor_no", label: "رقم الدور", value: 2, certainty: "reported" },
        { field: "elevator", label: "مصعد", value: true, certainty: "reported" },
        { field: "private_parking", label: "موقف خاص", value: true, certainty: "reported" },
        { field: "district", label: "الحي", value: "الياسمين", certainty: "reported" },
      ],
      unknownFieldKeys: ["عمر العقار", "إجمالي أدوار المبنى"],
      conflictingFieldKeys: [],
      listingClaims: [
        { scope: "الوحدة", claim: "تشطيب ديلوكس فاخر وإضاءات ذكية" },
        { scope: "الحي", claim: "موقع استراتيجي هادئ بالقرب من كافة الخدمات" },
      ],
    };

    const out = await analyzeProperty(propInput);
    console.log("=== COMMITTED OUTPUT 1 ===");
    console.log(JSON.stringify(out, null, 2));

    const fullText = JSON.stringify(out);

    // Negative constraints checks:
    // 1. No market price claims (like "سعر السوق", "متوسط سعر المتر في الحي", "أسعار الصفقات")
    expect(fullText).not.toContain("سعر السوق");
    expect(fullText).not.toContain("متوسط سعر المتر في الحي");
    // 2. No travel times (like "دقيقة", "دقائق")
    expect(fullText).not.toMatch(/\d+\s*(دقيقة|دقائق)/);
    // 3. No buy / don't buy imperatives (like "ننصحك بالشراء", "لا تشتري", "عليك بالشراء")
    expect(fullText).not.toContain("ننصح بالشراء");
    expect(fullText).not.toContain("ننصحك بالشراء");
    expect(fullText).not.toContain("لا تشتر");
    expect(fullText).not.toContain("لا تشتري");
    // 4. Grounded evidence fields: must only cite known fields
    for (const f of out.evidence_fields) {
      expect(propInput.knownFacts.some((kf) => kf.field === f)).toBe(true);
    }
  });

  it("Property 2 (Over budget & no elevator): verifies negative constraints", async () => {
    const propInput: PropertyAnalysisPromptInput = {
      propertyLabel: "شقة حي الملقا (4 غرف)",
      requirements: req,
      constraints: [
        { key: "budget", labelAr: "ضمن الميزانية", result: "fail", detailAr: "السعر 1,100,000 ر.س يتجاوز الميزانية (900,000 ر.س)" },
        { key: "bedrooms", labelAr: "غرف النوم", result: "pass", detailAr: "4 غرف نوم" },
        { key: "min_area", labelAr: "المساحة", result: "pass", detailAr: "المساحة 160 م²" },
        { key: "elevator_required", labelAr: "وجود مصعد", result: "fail", detailAr: "الدور 3 ولا يتوفر مصعد" },
        { key: "private_parking", labelAr: "موقف خاص", result: "pass", detailAr: "يتوفر موقف خاص" },
      ],
      knownFacts: [
        { field: "listing_price_sar", label: "سعر العرض", value: 1100000, certainty: "reported" },
        { field: "area_sqm", label: "المساحة", value: 160, certainty: "reported" },
        { field: "bedrooms", label: "غرف النوم", value: 4, certainty: "reported" },
        { field: "floor_no", label: "رقم الدور", value: 3, certainty: "reported" },
        { field: "elevator", label: "مصعد", value: false, certainty: "reported" },
        { field: "private_parking", label: "موقف خاص", value: true, certainty: "reported" },
        { field: "district", label: "الحي", value: "الملقا", certainty: "reported" },
      ],
      unknownFieldKeys: ["عمر العقار"],
      conflictingFieldKeys: [],
      listingClaims: [{ scope: "الوحدة", claim: "إطلالة خلابة وموقع مميز جداً" }],
    };

    const out = await analyzeProperty(propInput);
    console.log("=== COMMITTED OUTPUT 2 ===");
    console.log(JSON.stringify(out, null, 2));

    const fullText = JSON.stringify(out);
    expect(fullText).not.toContain("سعر السوق");
    expect(fullText).not.toMatch(/\d+\s*(دقيقة|دقائق)/);
    expect(fullText).not.toContain("ننصح بالشراء");
    expect(fullText).not.toContain("لا تشتر");
  });

  it("Property 3 (Partial fit with unknowns): verifies negative constraints", async () => {
    const propInput: PropertyAnalysisPromptInput = {
      propertyLabel: "شقة حي النرجس (3 غرف)",
      requirements: req,
      constraints: [
        { key: "budget", labelAr: "ضمن الميزانية", result: "pass", detailAr: "السعر 780,000 ر.س ضمن الميزانية" },
        { key: "bedrooms", labelAr: "غرف النوم", result: "pass", detailAr: "3 غرف نوم" },
        { key: "min_area", labelAr: "المساحة", result: "pass", detailAr: "المساحة 125 م²" },
        { key: "elevator_required", labelAr: "وجود مصعد", result: "unknown", detailAr: "توفر المصعد غير معروف" },
        { key: "private_parking", labelAr: "موقف خاص", result: "unknown", detailAr: "الموقف الخاص غير مؤكد" },
      ],
      knownFacts: [
        { field: "listing_price_sar", label: "سعر العرض", value: 780000, certainty: "user_stated" },
        { field: "area_sqm", label: "المساحة", value: 125, certainty: "reported" },
        { field: "bedrooms", label: "غرف النوم", value: 3, certainty: "reported" },
        { field: "floor_no", label: "رقم الدور", value: 2, certainty: "reported" },
        { field: "district", label: "الحي", value: "النرجس", certainty: "reported" },
      ],
      unknownFieldKeys: ["المصعد", "الموقف الخاص", "عمر العقار"],
      conflictingFieldKeys: [],
      listingClaims: [{ scope: "المبنى", claim: "مبنى هادئ وشارع تجاري قريب" }],
    };

    const out = await analyzeProperty(propInput);
    console.log("=== COMMITTED OUTPUT 3 ===");
    console.log(JSON.stringify(out, null, 2));

    const fullText = JSON.stringify(out);
    expect(fullText).not.toContain("سعر السوق");
    expect(fullText).not.toMatch(/\d+\s*(دقيقة|دقائق)/);
    expect(fullText).not.toContain("ننصح بالشراء");
    expect(fullText).not.toContain("لا تشتر");
  });
});
