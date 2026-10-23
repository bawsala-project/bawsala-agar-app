import { describe, it, expect } from "vitest";
import { parseArabicNeedsDescription } from "./parse-arabic-needs";
import { requirementsSchema } from "@/lib/schemas/requirements";
import { manualPropertySchema } from "@/lib/schemas/property";
import { preprocessNumericInput } from "@/lib/utils/arabic-numbers";

describe("parseArabicNeedsDescription — Client Notes #1 and #2", () => {
  describe("Note #1: Understanding User Intent & Negation (فهم طلب المستخدم)", () => {
    it("does NOT set elevator or parking as required when user writes «لا أشترط مصعدًا ولا موقفًا»", () => {
      const parsed = parseArabicNeedsDescription("لا أشترط مصعدًا ولا موقفًا");
      expect(parsed.hasElevator).toBe(false);
      expect(parsed.hasParking).toBe(false);
      expect(parsed.matchedFieldsAr).toContain("دون اشتراط مصعد");
      expect(parsed.matchedFieldsAr).toContain("دون اشتراط موقف");
      expect(parsed.matchedFieldsAr).not.toContain("شرط المصعد");
      expect(parsed.matchedFieldsAr).not.toContain("شرط الموقف الخاص");
    });

    it("handles negation without hamzas or diacritics: «لا اشترط مصعد ولا موقف»", () => {
      const parsed = parseArabicNeedsDescription("لا اشترط مصعد ولا موقف");
      expect(parsed.hasElevator).toBe(false);
      expect(parsed.hasParking).toBe(false);
    });

    it("handles pre-nominal negation with بدون / دون / مو شرط / لا يهم", () => {
      expect(parseArabicNeedsDescription("بدون مصعد أو موقف")).toMatchObject({
        hasElevator: false,
        hasParking: false,
      });
      expect(parseArabicNeedsDescription("مو شرط مصعد ولا بايكة")).toMatchObject({
        hasElevator: false,
        hasParking: false,
      });
      expect(parseArabicNeedsDescription("لا يهمني المصعد والموقف")).toMatchObject({
        hasElevator: false,
        hasParking: false,
      });
      expect(parseArabicNeedsDescription("لا أشترط مبنى جديد")).toMatchObject({
        hasNewBuilding: false,
      });
    });

    it("handles post-nominal negation & indifference: «المصعد والموقف غير مهمين», «بمصعد أو بدونه»", () => {
      expect(parseArabicNeedsDescription("المصعد والموقف غير مهمين")).toMatchObject({
        hasElevator: false,
        hasParking: false,
      });
      expect(parseArabicNeedsDescription("المصعد مو شرط والموقف اختياري")).toMatchObject({
        hasElevator: false,
        hasParking: false,
      });
      expect(parseArabicNeedsDescription("أقبل الشقة بمصعد أو بدونه")).toMatchObject({
        hasElevator: false,
      });
    });

    it("correctly separates positive requirements from negated ones in mixed sentences", () => {
      const p1 = parseArabicNeedsDescription(
        "أبحث عن شقة 4 غرف مع مصعد، ولا أشترط موقفًا"
      );
      expect(p1.minBedrooms).toBe(4);
      expect(p1.hasElevator).toBe(true);
      expect(p1.hasParking).toBe(false);

      const p2 = parseArabicNeedsDescription(
        "لا أشترط مصعدًا لكن أشترط موقفًا خاصًا"
      );
      expect(p2.hasElevator).toBe(false);
      expect(p2.hasParking).toBe(true);

      const p3 = parseArabicNeedsDescription(
        "شقة 3 غرف مع مصعد والموقف مو شرط"
      );
      expect(p3.hasElevator).toBe(true);
      expect(p3.hasParking).toBe(false);
    });
  });

  describe("Note #2: Preferences Extraction & Zero Unsolicited Preferences (التفضيلات)", () => {
    it("extracts «الهدوء» into preferences when user writes «أفضل الهدوء»", () => {
      const parsed = parseArabicNeedsDescription("أفضل الهدوء");
      expect(parsed.preferences).toEqual([{ label: "الهدوء", weight: "high" }]);
      expect(parsed.matchedFieldsAr).toContain("تفضيل: الهدوء");
    });

    it("does NOT add unsolicited preferences like «واجهة شمالية أو شرقية» when not requested", () => {
      const parsed = parseArabicNeedsDescription(
        "شقة 4 غرف بمساحة 150 متر وميزانية 900 ألف كاش، لا أشترط مصعدًا ولا موقفًا، وأفضل الهدوء"
      );
      expect(parsed.hasElevator).toBe(false);
      expect(parsed.hasParking).toBe(false);
      expect(parsed.preferences).toEqual([{ label: "الهدوء", weight: "high" }]);
      expect(
        parsed.preferences?.some((p) => p.label.includes("واجهة"))
      ).toBe(false);
    });

    it("adds «واجهة شمالية أو شرقية» ONLY when the user explicitly requests it", () => {
      const parsed = parseArabicNeedsDescription(
        "أفضل الهدوء، وأفضل واجهة شمالية أو شرقية"
      );
      expect(parsed.preferences).toEqual([
        { label: "الهدوء", weight: "high" },
        { label: "واجهة شمالية أو شرقية", weight: "high" },
      ]);
    });

    it("handles implicit quietness expressions like «في حي هادئ» without treating «هادئ» as a district name", () => {
      const parsed = parseArabicNeedsDescription(
        "أبحث عن شقة 4 غرف في حي هادئ قريبة من حي الملقا"
      );
      expect(parsed.preferences).toEqual([{ label: "الهدوء", weight: "high" }]);
      expect(parsed.districtOrLocation).toBe("حي الملقا");
    });
  });

  describe("Note #3: Arabic Numerals & Written Numbers (الأرقام)", () => {
    it("accepts both «٨٠٠٠٠٠» and «800000» in requirementsSchema and manualPropertySchema", () => {
      const reqArabic = requirementsSchema.safeParse({
        max_budget_sar: "٨٠٠٠٠٠",
        purchase_method: "cash",
        household_size: "٤",
        min_bedrooms: "٣",
        min_area_sqm: "١٥٠",
      });
      expect(reqArabic.success).toBe(true);
      if (reqArabic.success) {
        expect(reqArabic.data.max_budget_sar).toBe(800000);
        expect(reqArabic.data.household_size).toBe(4);
        expect(reqArabic.data.min_bedrooms).toBe(3);
        expect(reqArabic.data.min_area_sqm).toBe(150);
      }

      const reqAscii = requirementsSchema.safeParse({
        max_budget_sar: "800000",
        purchase_method: "cash",
        household_size: "4",
        min_bedrooms: "3",
        min_area_sqm: "150",
      });
      expect(reqAscii.success).toBe(true);
      if (reqAscii.success) {
        expect(reqAscii.data.max_budget_sar).toBe(800000);
      }

      const propArabic = manualPropertySchema.safeParse({
        input_mode: "manual",
        title: "شقة النرجس",
        listing_price_sar: "٨٠٠٠٠٠",
        area_sqm: "١٤٥",
        bedrooms: "٤",
        floor_no: "٢",
      });
      expect(propArabic.success).toBe(true);
      if (propArabic.success) {
        expect(propArabic.data.listing_price_sar).toBe(800000);
        expect(propArabic.data.area_sqm).toBe(145);
        expect(propArabic.data.bedrooms).toBe(4);
        expect(propArabic.data.floor_no).toBe(2);
      }
    });

    it("understands «ثمانمائة ألف» as 800000 SAR in the needs description and price preprocessor", () => {
      const parsed = parseArabicNeedsDescription(
        "أبحث عن شقة 4 غرف بمساحة 150 متر وميزانية ثمانمائة ألف ريال"
      );
      expect(parsed.budget).toBe(800000);
      expect(parsed.minBedrooms).toBe(4);
      expect(parsed.minAreaSqm).toBe(150);

      expect(preprocessNumericInput("ثمانمائة ألف")).toBe(800000);
      expect(preprocessNumericInput("٨٠٠٠٠٠")).toBe(800000);
      expect(preprocessNumericInput("800000")).toBe(800000);
      expect(preprocessNumericInput("٨٠٠،٠٠٠")).toBe(800000);
    });

    it("handles other written Arabic hundreds and millions in needs description", () => {
      expect(parseArabicNeedsDescription("ميزانيتي سبعمائة ألف").budget).toBe(700000);
      expect(parseArabicNeedsDescription("بحدود تسعمائة ألف ريال").budget).toBe(900000);
      expect(parseArabicNeedsDescription("ميزانية ثمانمائة وخمسين ألف").budget).toBe(850000);
      expect(parseArabicNeedsDescription("ميزانية مليون ومئتين ألف").budget).toBe(1200000);
      expect(parseArabicNeedsDescription("ميزانية مليون ونصف").budget).toBe(1500000);
      expect(parseArabicNeedsDescription("ميزانية نصف مليون").budget).toBe(500000);
    });
  });
});
