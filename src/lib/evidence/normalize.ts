import { FIELD_REGISTRY, type FieldKey } from "./fields";

export function normalizeDigits(input: string): string {
  return input
    .replace(/[\u0660-\u0669]/g, (d) => (d.charCodeAt(0) - 0x0660).toString())
    .replace(/[\u06F0-\u06F9]/g, (d) => (d.charCodeAt(0) - 0x06F0).toString())
    .replace(/\u066C/g, ",")
    .replace(/\u066B/g, ".");
}

function checkBounds(val: number, min?: number, max?: number): number | null {
  if (min !== undefined && val < min) return null;
  if (max !== undefined && val > max) return null;
  return val;
}

export function normalizePrice(raw: string): number | null {
  if (!raw || typeof raw !== "string") return null;
  let text = normalizeDigits(raw).trim();

  // Compound Arabic text (e.g. "مليون ومئتين ألف") is NOT required and returns null
  if (/و\s*مئتين|ومئتين|وخمسم|و\s*\d+|و\s*ألف|و\s*الف/.test(text)) {
    return null;
  }

  // Strip currency words
  text = text
    .replace(/(?:ريال\s*سعودي|ريال|ر\.?\s*س\.?|رس|SAR|sar|SR|sr)/gi, "")
    .trim();

  const bounds = FIELD_REGISTRY.listing_price_sar;

  // Millions shorthand e.g. "1.2 مليون" or "مليون"
  if (/مليون/.test(text)) {
    const numPart = text.replace(/مليون/g, "").replace(/,/g, "").trim();
    const multiplier = 1_000_000;
    if (numPart === "") {
      return checkBounds(multiplier, bounds.min, bounds.max);
    }
    const val = parseFloat(numPart);
    if (isNaN(val)) return null;
    return checkBounds(Math.round(val * multiplier), bounds.min, bounds.max);
  }

  // Thousands shorthand e.g. "850 ألف" or "850 الف" or "850k"
  if (/ألف|الف|\bk\b/i.test(text)) {
    const numPart = text
      .replace(/(?:ألف|الف|\bk\b)/gi, "")
      .replace(/,/g, "")
      .trim();
    const multiplier = 1_000;
    if (numPart === "") return null;
    const val = parseFloat(numPart);
    if (isNaN(val)) return null;
    return checkBounds(Math.round(val * multiplier), bounds.min, bounds.max);
  }

  // Direct number e.g. "850,000"
  const cleanNum = text.replace(/,/g, "").trim();
  if (!/^[0-9]+(?:\.[0-9]+)?$/.test(cleanNum)) return null;
  const val = parseFloat(cleanNum);
  if (isNaN(val)) return null;
  return checkBounds(Math.round(val), bounds.min, bounds.max);
}

export function normalizeArea(raw: string): number | null {
  if (!raw || typeof raw !== "string") return null;
  let text = normalizeDigits(raw).trim();

  // Strip area units
  text = text
    .replace(/(?:متر\s*مربع|مترمربع|متر|م²|م2|م\^2|sqm|sq\s*m)/gi, "")
    .trim();
  text = text.replace(/,/g, "").trim();

  if (!/^[0-9]+(?:\.[0-9]+)?$/.test(text)) return null;
  const val = parseFloat(text);
  if (isNaN(val)) return null;

  const bounds = FIELD_REGISTRY.area_sqm;
  return checkBounds(val, bounds.min, bounds.max);
}

export function normalizeFloor(raw: string): number | null {
  if (!raw || typeof raw !== "string") return null;
  let text = normalizeDigits(raw).trim();
  text = text.replace(/(?:الدور|طابق|الطابق|دور|floor)/gi, "").trim();

  const ordinals: Record<string, number> = {
    الأرضي: 0,
    الارضي: 0,
    أرضي: 0,
    ارضي: 0,
    الأول: 1,
    الاول: 1,
    أول: 1,
    اول: 1,
    الثاني: 2,
    الثانى: 2,
    ثاني: 2,
    ثانى: 2,
    الثالث: 3,
    ثالث: 3,
    الرابع: 4,
    رابع: 4,
    الخامس: 5,
    خامس: 5,
    السادس: 6,
    سادس: 6,
    السابع: 7,
    سابع: 7,
    الثامن: 8,
    ثامن: 8,
    التاسع: 9,
    تاسع: 9,
    العاشر: 10,
    عاشر: 10,
    قبو: -1,
    تسوية: -1,
    بدروم: -1,
  };

  const bounds = FIELD_REGISTRY.floor_no;

  if (ordinals[text] !== undefined) {
    return checkBounds(ordinals[text], bounds.min, bounds.max);
  }

  if (/^-?[0-9]+$/.test(text)) {
    const val = parseInt(text, 10);
    return checkBounds(val, bounds.min, bounds.max);
  }

  return null;
}

export function normalizeBoolean(raw: string): boolean | null {
  if (!raw || typeof raw !== "string") return null;
  const text = raw.trim().toLowerCase();

  const truthy = ["يوجد", "متوفر", "نعم", "موجود", "true", "1"];
  const falsy = ["لا يوجد", "غير متوفر", "لا", "غير موجود", "بدون", "false", "0"];

  if (truthy.includes(text)) return true;
  if (falsy.includes(text)) return false;
  return null;
}

export function normalizeInteger(
  raw: string,
  fieldKey: "bedrooms" | "bathrooms" | "building_floors" | "property_age_years"
): number | null {
  if (!raw || typeof raw !== "string") return null;
  let text = normalizeDigits(raw).trim();
  text = text.replace(/,/g, "").trim();

  // Extract leading or first integer match
  const match = text.match(/-?[0-9]+/);
  if (!match) return null;

  const val = parseInt(match[0], 10);
  if (isNaN(val)) return null;

  const def = FIELD_REGISTRY[fieldKey];
  return checkBounds(val, def.min, def.max);
}

export function normalizeDistrict(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  let text = raw.trim();
  // Strip leading "حي "
  text = text.replace(/^حي\s+/i, "").trim();
  if (text.length === 0 || text.length > 100) return null;
  return text;
}

export function normalizeListingClaim(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const text = raw.trim();
  if (text.length === 0) return null;
  return text.slice(0, 200);
}

export function normalizeField(
  field: FieldKey,
  raw: string
): number | boolean | string | null {
  switch (field) {
    case "listing_price_sar":
      return normalizePrice(raw);
    case "area_sqm":
      return normalizeArea(raw);
    case "floor_no":
      return normalizeFloor(raw);
    case "bedrooms":
    case "bathrooms":
    case "building_floors":
    case "property_age_years":
      return normalizeInteger(raw, field);
    case "elevator":
    case "private_parking":
      return normalizeBoolean(raw);
    case "district":
      return normalizeDistrict(raw);
    case "listing_claim":
      return normalizeListingClaim(raw);
    default:
      return null;
  }
}
