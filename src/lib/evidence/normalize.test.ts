import { describe, it, expect } from "vitest";
import {
  normalizeDigits,
  normalizePrice,
  normalizeArea,
  normalizeFloor,
  normalizeBoolean,
  normalizeInteger,
  normalizeDistrict,
  normalizeField,
} from "./normalize";

describe("normalize.ts - Normalization test suite", () => {
  describe("Digits normalization", () => {
    it("converts Arabic-Indic digits ٠-٩ to ASCII", () => {
      expect(normalizeDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
    });

    it("converts Eastern Arabic-Indic digits ۰-۹ to ASCII", () => {
      expect(normalizeDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
    });

    it("replaces Arabic thousands separator ٬ with comma and decimal ٫ with dot", () => {
      expect(normalizeDigits("٨٥٠٬٠٠٠٫٥٠")).toBe("850,000.50");
    });
  });

  describe("Price normalization", () => {
    it("handles plain numeric strings with commas: 850,000", () => {
      expect(normalizePrice("850,000")).toBe(850000);
    });

    it("handles plain numeric strings without commas: 850000", () => {
      expect(normalizePrice("850000")).toBe(850000);
    });

    it("handles Arabic thousands shorthand: 850 ألف", () => {
      expect(normalizePrice("850 ألف")).toBe(850000);
    });

    it("handles Arabic thousands shorthand variant: 850 الف", () => {
      expect(normalizePrice("850 الف")).toBe(850000);
    });

    it("handles millions shorthand with decimals: 1.2 مليون", () => {
      expect(normalizePrice("1.2 مليون")).toBe(1200000);
    });

    it("handles millions shorthand standalone: مليون", () => {
      expect(normalizePrice("مليون")).toBe(1000000);
    });

    it("handles Arabic-Indic digits with currency: ٨٥٠٬٠٠٠ ريال", () => {
      expect(normalizePrice("٨٥٠٬٠٠٠ ريال")).toBe(850000);
    });

    it("strips various currency representations: ر.س, SAR, SR", () => {
      expect(normalizePrice("750,000 ر.س")).toBe(750000);
      expect(normalizePrice("750,000 SAR")).toBe(750000);
      expect(normalizePrice("750,000 SR")).toBe(750000);
    });

    it("returns null for compound words: مليون ومئتين ألف", () => {
      expect(normalizePrice("مليون ومئتين ألف")).toBeNull();
    });

    it("returns null when price is below lower bound (50,000)", () => {
      expect(normalizePrice("40,000")).toBeNull();
    });

    it("returns null when price is above upper bound (50,000,000)", () => {
      expect(normalizePrice("60,000,000")).toBeNull();
    });

    it("returns null for ambiguous non-numeric string", () => {
      expect(normalizePrice("سعر مناسب وممتاز")).toBeNull();
      expect(normalizePrice("")).toBeNull();
    });
  });

  describe("Area normalization", () => {
    it("handles numeric area with م²", () => {
      expect(normalizeArea("150 م²")).toBe(150);
    });

    it("handles area with م2", () => {
      expect(normalizeArea("180 م2")).toBe(180);
    });

    it("handles area with متر مربع", () => {
      expect(normalizeArea("220 متر مربع")).toBe(220);
    });

    it("handles area with Arabic-Indic digits and decimal: ١٧٥٫٥ متر", () => {
      expect(normalizeArea("١٧٥٫٥ متر")).toBe(175.5);
    });

    it("returns null when area is below bound (20)", () => {
      expect(normalizeArea("15 م²")).toBeNull();
    });

    it("returns null when area is above bound (2,000)", () => {
      expect(normalizeArea("2500 م²")).toBeNull();
    });

    it("returns null for ambiguous area text", () => {
      expect(normalizeArea("مساحة واسعة")).toBeNull();
    });
  });

  describe("Floor normalization", () => {
    it("normalizes ordinal الأرضي to 0", () => {
      expect(normalizeFloor("الأرضي")).toBe(0);
      expect(normalizeFloor("الدور الأرضي")).toBe(0);
    });

    it("normalizes ordinals الأول to العاشر", () => {
      expect(normalizeFloor("الأول")).toBe(1);
      expect(normalizeFloor("الدور الثاني")).toBe(2);
      expect(normalizeFloor("الثالث")).toBe(3);
      expect(normalizeFloor("العاشر")).toBe(10);
    });

    it("normalizes digits with الدور prefix: الدور 4", () => {
      expect(normalizeFloor("الدور 4")).toBe(4);
    });

    it("normalizes basement/ground negative levels: قبو", () => {
      expect(normalizeFloor("قبو")).toBe(-1);
      expect(normalizeFloor("-2")).toBe(-2);
    });

    it("returns null when floor is below -2 or above 60", () => {
      expect(normalizeFloor("-3")).toBeNull();
      expect(normalizeFloor("65")).toBeNull();
    });

    it("returns null for ambiguous floor text", () => {
      expect(normalizeFloor("دور علوي مرتفع")).toBeNull();
    });
  });

  describe("Boolean normalization", () => {
    it("normalizes truthy strings: يوجد, متوفر, نعم", () => {
      expect(normalizeBoolean("يوجد")).toBe(true);
      expect(normalizeBoolean("متوفر")).toBe(true);
      expect(normalizeBoolean("نعم")).toBe(true);
      expect(normalizeBoolean("true")).toBe(true);
    });

    it("normalizes falsy strings: لا يوجد, غير متوفر, لا", () => {
      expect(normalizeBoolean("لا يوجد")).toBe(false);
      expect(normalizeBoolean("غير متوفر")).toBe(false);
      expect(normalizeBoolean("لا")).toBe(false);
      expect(normalizeBoolean("false")).toBe(false);
    });

    it("returns null for ambiguous boolean text", () => {
      expect(normalizeBoolean("ربما")).toBeNull();
      expect(normalizeBoolean("قيد الدراسة")).toBeNull();
    });
  });

  describe("Integer and District normalization", () => {
    it("normalizes integer fields with bounds", () => {
      expect(normalizeInteger("4 غرف", "bedrooms")).toBe(4);
      expect(normalizeInteger("20", "bedrooms")).toBeNull(); // max 15
      expect(normalizeInteger("2 حمام", "bathrooms")).toBe(2);
      expect(normalizeInteger("5", "building_floors")).toBe(5);
      expect(normalizeInteger("3 سنوات", "property_age_years")).toBe(3);
    });

    it("normalizes district stripping leading 'حي '", () => {
      expect(normalizeDistrict("حي النرجس")).toBe("النرجس");
      expect(normalizeDistrict("الملقا")).toBe("الملقا");
      expect(normalizeDistrict("")).toBeNull();
    });

    it("unified normalizeField dispatches correctly", () => {
      expect(normalizeField("listing_price_sar", "900 ألف")).toBe(900000);
      expect(normalizeField("area_sqm", "150 م²")).toBe(150);
      expect(normalizeField("bedrooms", "3")).toBe(3);
      expect(normalizeField("elevator", "متوفر")).toBe(true);
      expect(normalizeField("district", "حي الياسمين")).toBe("الياسمين");
    });
  });
});
