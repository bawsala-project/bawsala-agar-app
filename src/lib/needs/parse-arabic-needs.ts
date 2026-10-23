import type { PreferenceWeight } from "@/lib/schemas/requirements";
import { parseArabicBudgetOrPriceFromText } from "@/lib/utils/arabic-numbers";

export interface ParsedPreference {
  label: string;
  weight: PreferenceWeight;
}

export interface ParsedArabicNeeds {
  budget?: number;
  purchaseMethod?: "cash" | "finance" | "undecided";
  householdSize?: number;
  minBedrooms?: number;
  minAreaSqm?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasNewBuilding?: boolean;
  hasMaxFloor?: boolean;
  maxFloor?: number;
  districtOrLocation?: string;
  preferences?: ParsedPreference[];
  matchedFieldsAr: string[];
}

export const PREFERENCE_SUGGESTIONS: ParsedPreference[] = [
  { label: "الهدوء", weight: "high" },
  { label: "واجهة شمالية أو شرقية", weight: "medium" },
  { label: "قرب من المسجد والحديقة", weight: "high" },
  { label: "إضاءة طبيعية وتهوية جيدة", weight: "medium" },
  { label: "الخصوصية ومدخلين للشقة", weight: "high" },
  { label: "سطح أو ارتداد خاص", weight: "medium" },
];

export function normalizeDigits(input: string): string {
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  const extendedArabicIndic = "۰۱۲۳۴۵۶۷۸۹";
  let out = input;
  for (let i = 0; i < 10; i++) {
    out = out.split(arabicIndic[i]).join(String(i));
    out = out.split(extendedArabicIndic[i]).join(String(i));
  }
  return out;
}

export function stripArabicDiacritics(input: string): string {
  return input.replace(/[\u064B-\u065F\u0670\u0640]/g, "");
}

/**
 * Determines whether a constraint keyword matched inside a text is positively
 * required ("positive") or negated / marked indifferent ("negative").
 *
 * Handles:
 * - Pre-nominal negation: "لا أشترط مصعدًا", "بدون مصعد", "مو شرط مصعد", "لا يهم المصعد"
 * - Coordinated negation: "لا أشترط مصعدًا ولا موقفًا", "بدون مصعد أو موقف", "لا يهمني المصعد والموقف"
 * - Post-nominal negation: "المصعد غير مهم", "المصعد والموقف مو شرط", "المصعد ليس شرطاً"
 * - Alternation / indifference: "بمصعد أو بدون", "سواء بمصعد أو بدونه", "بوجودهما أو بدونهما"
 * - Positive resets within a clause: "لا أشترط مصعدًا لكن أشترط موقفًا"
 */
export function analyzeConstraintPolarity(
  text: string,
  keywordPattern: RegExp
): "positive" | "negative" | undefined {
  const clauses = text.split(/[.،,;؛!\n]+/);
  let state: "positive" | "negative" | undefined = undefined;

  // Words that break a prior negation scope and introduce a positive requirement
  const positiveResetRegex =
    /(?:^|\s)(?:ولكن|لكن|بس|بل|إلا|الا|غير أن|غير ان|بشرط|وأشترط|واشترط|ويشترط|وأحتاج|واحتاج|وأريد|واريد|وأبغى|وابغى|وأبي|ابي|ومع|مع وجود)(?=\s|$)/g;

  // Pre-nominal negation or indifference markers preceding the keyword
  const preNegationRegex =
    /(?:^|\s)(?:لا|ولا|ما|وما|لم|لن|ليس|ليست|وليس|مو|ومو|مش|ومش|غير|وغير|بدون|وبدون|دون|ودون|بلا|وبلا|عدم|وعدم|لا\s*أشترط|لا\s*اشترط|لا\s*يشترط|لا\s*تشترط|لا\s*نشترط|لا\s*يهم(?:ني)?|لا\s*تهم(?:ني)?|ما\s*يهم(?:ني)?|ما\s*تهم(?:ني)?|مو\s*شرط|مش\s*شرط|ليس\s*شرط[اًا]?|مو\s*لازم|مش\s*لازم|لا\s*يلزم|ما\s*يلزم|لا\s*أحتاج|لا\s*احتاج|ما\s*أحتاج|ما\s*احتاج|غير\s*مهم[ةين]*|غير\s*مشروط[ةه]?|غير\s*ضروري[ةه]?|عادي\s*بدون|أقبل\s*بدون|اقبل\s*بدون)(?:\s|$)/;

  // Immediate post-nominal negation/indifference right after the keyword (e.g. "المصعد غير مهم", "بمصعد أو بدون")
  const immediatePostNegationRegex =
    /^\s*(?:خاص[ةه]?\s*)?(?:غير\s*مهم[ةين]*|لا\s*يهم(?:ني)?|لا\s*تهم(?:ني)?|ما\s*يهم(?:ني)?|ما\s*تهم(?:ني)?|مو\s*شرط|مش\s*شرط|ليس\s*شرط[اًا]?|ليست\s*شرط[اًا]?|مو\s*لازم|مش\s*لازم|لا\s*يلزم|ما\s*يلزم|غير\s*ضروري[ةه]?|غير\s*مشروط[ةه]?|اختياري[ةه]?|ثانوي[ةه]?|(?:أو|او)\s*(?:بدون(?:ه|ها|هما)?|دون(?:ه|ها|هما)?|عدم(?:ه|ها|هما)?)|بوجود(?:ه|ها|هما)?\s*(?:أو|او)\s*بدون(?:ه|ها|هما)?)(?:\s|$)/;

  // Coordinated post-nominal negation (e.g. "المصعد والموقف غير مهمين", "المصعد أو الموقف مو شرط")
  const coordinatedPostNegationRegex =
    /^\s*(?:خاص[ةه]?\s*)?(?:(?:و|أو|او|ولا)\s*(?:ال)?[\u0600-\u06FF]+(?:\s+خاص[ةه]?)?\s*){1,3}?(?:غير\s*مهم[ةين]*|لا\s*يهم(?:ني|ون)?|لا\s*تهم(?:ني)?|ما\s*يهم(?:ني|ون)?|ما\s*تهم(?:ني)?|مو\s*شرط|مش\s*شرط|ليس\s*شرط[اًا]?|ليست\s*شرط[اًا]?|مو\s*لازم|مش\s*لازم|لا\s*يلزم|ما\s*يلزم|غير\s*ضروري[ةين]*|غير\s*مشروط[ةين]*|اختياري[ةين]*|(?:أو|او)\s*(?:بدون(?:ه|ها|هما)?|دون(?:ه|ها|هما)?|عدم(?:ه|ها|هما)?))(?:\s|$)/;

  // Positive governing prepositions/verbs right before a noun that prevent it from sharing a later noun's predicate
  const positiveGovernorBeforeNoun =
    /(?:^|\s)(?:مع|بشرط|أشترط|اشترط|يشترط|لازم|يلزم)\s*(?:وجود\s*)?$/;

  for (const rawClause of clauses) {
    const clause = rawClause.trim();
    if (!clause) continue;

    const flags = keywordPattern.flags.includes("g")
      ? keywordPattern.flags
      : `${keywordPattern.flags}g`;
    const matcher = new RegExp(keywordPattern.source, flags);
    let match: RegExpExecArray | null;

    while ((match = matcher.exec(clause)) !== null) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;

      let beforeSegment = clause.slice(0, matchStart);
      let resetMatch: RegExpExecArray | null;
      let lastResetEnd = -1;
      positiveResetRegex.lastIndex = 0;
      while ((resetMatch = positiveResetRegex.exec(beforeSegment)) !== null) {
        const preReset = beforeSegment.slice(0, resetMatch.index);
        if (!/(?:^|\s)(?:لا|ولا|ما|وما|ليس|مو|مش|غير|بدون|دون)\s*$/.test(preReset)) {
          lastResetEnd = resetMatch.index + resetMatch[0].length;
        }
      }
      if (lastResetEnd >= 0) {
        beforeSegment = beforeSegment.slice(lastResetEnd);
      }

      const afterSegment = clause.slice(matchEnd);

      const isPreNegated = preNegationRegex.test(beforeSegment);
      const isImmediatePostNegated = immediatePostNegationRegex.test(afterSegment);
      const isCoordinatedPostNegated =
        !positiveGovernorBeforeNoun.test(beforeSegment) &&
        coordinatedPostNegationRegex.test(afterSegment);

      if (isPreNegated || isImmediatePostNegated || isCoordinatedPostNegated) {
        state = "negative";
      } else {
        state = "positive";
      }
    }
  }

  return state;
}

function addUniquePreference(
  list: ParsedPreference[],
  label: string,
  weight: PreferenceWeight
) {
  const cleaned = label.trim();
  if (!cleaned || cleaned.length < 2) return;
  const normCandidate = stripArabicDiacritics(cleaned)
    .replace(/^ال/, "")
    .trim();
  const exists = list.some((p) => {
    const normExisting = stripArabicDiacritics(p.label)
      .replace(/^ال/, "")
      .trim();
    return (
      normExisting === normCandidate ||
      normExisting.includes(normCandidate) ||
      normCandidate.includes(normExisting)
    );
  });
  if (!exists && list.length < 10) {
    list.push({ label: cleaned, weight });
  }
}

export function parseArabicNeedsDescription(rawText: string): ParsedArabicNeeds {
  // Join numeric thousands separators (e.g., 800,000 or ٨٠٠،٠٠٠) while keeping clause commas
  const digitsNormalized = normalizeDigits(rawText).replace(
    /(\d)\s*[,،٬]\s*(\d)/g,
    "$1$2"
  );
  const text = stripArabicDiacritics(digitsNormalized);
  const flatText = text.replace(/[،,]/g, " ");
  const result: ParsedArabicNeeds = { matchedFieldsAr: [] };

  // 1. Budget extraction (supports digits, Eastern Arabic numerals, and written Arabic number words like «ثمانمائة ألف»)
  const parsedBudget = parseArabicBudgetOrPriceFromText(rawText);
  if (parsedBudget !== null) {
    result.budget = parsedBudget;
    result.matchedFieldsAr.push("الميزانية القصوى");
  }

  // 2. Purchase Method
  if (/(?:كاش|نقد|نقدا)/.test(flatText)) {
    result.purchaseMethod = "cash";
    result.matchedFieldsAr.push("الدفع كاش");
  } else if (/(?:تمويل|بنك|عقاري|رهن|أقساط|اقساط)/.test(flatText)) {
    result.purchaseMethod = "finance";
    result.matchedFieldsAr.push("تمويل عقاري");
  }

  // 3. Bedrooms
  const bedroomsNum = flatText.match(/(\d+)\s*(?:غرف|غرف[ةه])/);
  if (bedroomsNum) {
    result.minBedrooms = Number(bedroomsNum[1]);
    result.matchedFieldsAr.push("عدد الغرف");
  } else if (/غرفتين/.test(flatText)) {
    result.minBedrooms = 2;
    result.matchedFieldsAr.push("عدد الغرف");
  } else if (/(?:ثلاث|ثلاث[ةه])\s*غرف/.test(flatText)) {
    result.minBedrooms = 3;
    result.matchedFieldsAr.push("عدد الغرف");
  } else if (/(?:أربع|اربع|أربع[ةه]|اربع[ةه])\s*غرف/.test(flatText)) {
    result.minBedrooms = 4;
    result.matchedFieldsAr.push("عدد الغرف");
  } else if (/(?:خمس|خمس[ةه])\s*غرف/.test(flatText)) {
    result.minBedrooms = 5;
    result.matchedFieldsAr.push("عدد الغرف");
  }

  // 4. Area (sqm)
  const areaMatch = flatText.match(/(\d{2,4})\s*(?:متر|م2|م²)/);
  if (areaMatch) {
    result.minAreaSqm = Number(areaMatch[1]);
    result.matchedFieldsAr.push("المساحة الدنيا");
  }

  // 5. Household size
  const familyMatch =
    flatText.match(/(?:أسر[ةه]|اسر[ةه]|عائل[ةه]|افراد|أفراد|أشخاص|اشخاص)\s*(?:من\s*)?(\d+)/) ||
    flatText.match(/(\d+)\s*(?:أفراد|افراد|أشخاص|اشخاص)/);
  if (familyMatch) {
    result.householdSize = Number(familyMatch[1]);
    result.matchedFieldsAr.push("حجم الأسرة");
  }

  // 6. Hard constraints (with full negation & indifference awareness)
  const elevatorPolarity = analyzeConstraintPolarity(text, /(?:بمصعد|مصعد[اًا]?)/);
  if (elevatorPolarity === "positive") {
    result.hasElevator = true;
    result.matchedFieldsAr.push("شرط المصعد");
  } else if (elevatorPolarity === "negative") {
    result.hasElevator = false;
    result.matchedFieldsAr.push("دون اشتراط مصعد");
  }

  const parkingPolarity = analyzeConstraintPolarity(
    text,
    /(?:بموقف|موقف[اًا]?|مواقف|بايك[ةه]|باركنج)/
  );
  if (parkingPolarity === "positive") {
    result.hasParking = true;
    result.matchedFieldsAr.push("شرط الموقف الخاص");
  } else if (parkingPolarity === "negative") {
    result.hasParking = false;
    result.matchedFieldsAr.push("دون اشتراط موقف");
  }

  const newBuildingPolarity = analyzeConstraintPolarity(
    text,
    /(?:جديد[ةها]?|أول ساكن|اول ساكن)/
  );
  if (newBuildingPolarity === "positive") {
    result.hasNewBuilding = true;
    result.matchedFieldsAr.push("مبنى جديد");
  } else if (newBuildingPolarity === "negative") {
    result.hasNewBuilding = false;
    result.matchedFieldsAr.push("دون اشتراط مبنى جديد");
  }

  const floorIndifferent =
    /(?:لا\s*أشترط|لا\s*اشترط|لا\s*يشترط|لا\s*يهم(?:ني)?|ما\s*يهم(?:ني)?|غير\s*مهم|مو\s*شرط|مش\s*شرط|أي|اي)\s*(?:ال)?دور/.test(
      text
    ) || /(?:ال)?دور\s*(?:غير\s*مهم|لا\s*يهم|ما\s*يهم|مو\s*شرط|مش\s*شرط)/.test(text);

  if (floorIndifferent) {
    result.hasMaxFloor = false;
  } else if (/(?:دور أرضي|دور ارضي|الأرضي|الارضي)/.test(flatText)) {
    result.hasMaxFloor = true;
    result.maxFloor = 0;
    result.matchedFieldsAr.push("الحد الأعلى للدور");
  } else if (/(?:الدور الأول|الدور الاول|دور اول|دور أول)/.test(flatText)) {
    result.hasMaxFloor = true;
    result.maxFloor = 1;
    result.matchedFieldsAr.push("الحد الأعلى للدور");
  } else {
    const floorMatch = flatText.match(/(?:دور|الدور)\s*(\d+)/);
    if (floorMatch) {
      result.hasMaxFloor = true;
      result.maxFloor = Number(floorMatch[1]);
      result.matchedFieldsAr.push("الحد الأعلى للدور");
    }
  }

  // 7. Important daily location / district
  const districtRegex = /حي\s+([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)?)/g;
  let districtMatch: RegExpExecArray | null;
  while ((districtMatch = districtRegex.exec(flatText)) !== null) {
    const cleaned = districtMatch[1]
      .replace(
        /\s+(?:مع|أو|او|و|ولا|بمساح[ةه]|بميزاني[ةه]|كاش|تمويل|لا|أفضل|افضل|يفضل|قريب[ةه]?|في|من).*$/,
        ""
      )
      .trim();
    if (
      cleaned &&
      !/^(?:هاد[ئءي][ةه]?|راق|راقي|جديد[ةه]?|ممتاز[ةه]?|قريب[ةه]?|مناسب[ةه]?)(?:\s|$)/.test(
        cleaned
      )
    ) {
      result.districtOrLocation = `حي ${cleaned}`;
      result.matchedFieldsAr.push("الموقع اليومي المهم");
      break;
    }
  }

  // 8. User Preferences extraction (explicit "أفضل ..." phrases + positive soft attributes)
  const extractedPrefs: ParsedPreference[] = [];

  // 8a. Explicit preference expressions: "أفضل الهدوء", "يفضل ...", "يهمني ...", "أرغب في ..."
  const explicitPrefRegex =
    /(?:^|[.،,;؛!\n]|\s)(?:(لا|ولا|ما|وما)\s+)?(?:و|ف)?(أفضل|افضل|يفضل|تفضل|نفضل|الأفضل|الافضل|من المفضل|أحبذ|احبذ|يحبذ|أتمنى|اتمنى|أرغب\s*في|ارغب\s*في|أرغب\s*بـ?|ارغب\s*بـ?|يهمني|تهمني)\s+([^.،,;؛!\n]+)/g;

  let prefMatch: RegExpExecArray | null;
  while ((prefMatch = explicitPrefRegex.exec(text)) !== null) {
    // Skip if the preference verb itself is negated (e.g., "لا أفضل ...")
    if (prefMatch[1]) {
      continue;
    }

    let rawPhrase = prefMatch[3]
      // Truncate if the sentence transitions into another requirement clause
      .split(
        /\b(?:ولا\s*أشترط|ولا\s*اشترط|ولا\s*يشترط|لا\s*أشترط|لا\s*اشترط|لا\s*يشترط|ولا\s*يهم|لا\s*يهم|وبدون|بدون|وبميزاني[ةه]|بميزاني[ةه]|وميزاني[ةه]|وبسعر|بسعر|بمساح[ةه]|ومساح[ةه]|لأسر[ةه]|لاسر[ةه]|مع\s*مصعد|قريب[ةه]?\s*من\s*حي)\b/
      )[0]
      .trim();

    // Strip leading grammatical filler words
    rawPhrase = rawPhrase
      .replace(
        /^(?:أن\s*تكون|ان\s*تكون|أن\s*يكون|ان\s*يكون|تكون|يكون|وجود|توفر|توافر|الشق[ةه]|العقار|المبنى|فيها|فيه)\s+/g,
        ""
      )
      .trim();

    // Normalize common quietness variations to canonical "الهدوء"
    if (
      /^(?:هاد[ئءي][ةه]?|الهدوء|هدوء|حي\s*هاد[ئءي]|منطق[ةه]\s*هاد[ئءي][ةه]?)$/.test(
        rawPhrase
      )
    ) {
      addUniquePreference(extractedPrefs, "الهدوء", "high");
    } else if (rawPhrase.length >= 2 && rawPhrase.length <= 70) {
      addUniquePreference(extractedPrefs, rawPhrase, "high");
    }
  }

  // 8b. Implicit positive soft preferences mentioned in non-negated clauses
  if (
    analyzeConstraintPolarity(
      text,
      /(?:الهدوء|هدوء|حي\s*هاد[ئءي]|منطق[ةه]\s*هاد[ئءي][ةه]?|شقة\s*هاد[ئءي][ةه]|بعيد[ةه]?\s*عن\s*ال[إا]زعاج)/
    ) === "positive"
  ) {
    addUniquePreference(extractedPrefs, "الهدوء", "high");
  }

  const facadeMatch = text.match(
    /واجه[ةه]\s*(شمالي[ةه]\s*(?:أو|او|و)\s*شرقي[ةه]|شرقي[ةه]\s*(?:أو|او|و)\s*شمالي[ةه]|شمالي[ةه]\s*شرقي[ةه]|شمالي[ةه]|شرقي[ةه]|جنوبي[ةه]|غربي[ةه])/
  );
  if (facadeMatch && analyzeConstraintPolarity(text, /واجه[ةه]/) === "positive") {
    addUniquePreference(extractedPrefs, `واجهة ${facadeMatch[1].trim()}`, "medium");
  }

  if (
    analyzeConstraintPolarity(
      text,
      /(?:قريب[ةه]?\s*من|قرب|بجوار)\s*(?:ال)?(?:مسجد|جامع)/
    ) === "positive"
  ) {
    addUniquePreference(extractedPrefs, "قرب من المسجد", "high");
  }

  if (
    analyzeConstraintPolarity(text, /(?:قريب[ةه]?\s*من|قرب|بجوار)\s*(?:ال)?حديق[ةه]/) ===
    "positive"
  ) {
    addUniquePreference(extractedPrefs, "قرب من الحديقة", "medium");
  }

  if (
    analyzeConstraintPolarity(
      text,
      /(?:إضاء[ةه]\s*طبيعي[ةه]|اضاء[ةه]\s*طبيعي[ةه]|تهوي[ةه]\s*جيد[ةه]|شرح[ةه])/
    ) === "positive"
  ) {
    addUniquePreference(extractedPrefs, "إضاءة طبيعية وتهوية جيدة", "medium");
  }

  if (
    analyzeConstraintPolarity(text, /(?:الخصوصي[ةه]|خصوصي[ةه]|مدخلين)/) === "positive"
  ) {
    addUniquePreference(extractedPrefs, "الخصوصية", "high");
  }

  if (extractedPrefs.length > 0) {
    result.preferences = extractedPrefs;
    for (const pref of extractedPrefs) {
      result.matchedFieldsAr.push(`تفضيل: ${pref.label}`);
    }
  }

  return result;
}
