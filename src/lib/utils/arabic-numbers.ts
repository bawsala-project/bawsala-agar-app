/**
 * Utilities for normalizing Eastern Arabic numerals (٠-٩), Extended Arabic-Indic
 * numerals (۰-۹), thousands separators, and written Arabic number words
 * (e.g., «ثمانمائة ألف» -> 800000).
 */

export function normalizeArabicDigits(input: string): string {
  return input
    .replace(/[\u0660-\u0669]/g, (d) => (d.charCodeAt(0) - 0x0660).toString())
    .replace(/[\u06F0-\u06F9]/g, (d) => (d.charCodeAt(0) - 0x06F0).toString())
    .replace(/\u066C/g, ",")
    .replace(/\u066B/g, ".");
}

function stripDiacritics(input: string): string {
  return input.replace(/[\u064B-\u065F\u0670\u0640]/g, "");
}

const WRITTEN_HUNDREDS_PATTERNS: Array<{ pattern: RegExp; value: number }> = [
  {
    pattern: /(?:تسعمائ[ةه]|تسعمئ[ةه]|تسعمي[ةه]|تسع\s*(?:مائ[ةه]|مئ[ةه]|مي[ةه]))/,
    value: 900,
  },
  {
    pattern:
      /(?:ثمانمائ[ةه]|ثمانمئ[ةه]|ثمانيمئ[ةه]|ثمانيمائ[ةه]|ثمانمي[ةه]|تمنمي[ةه]|ثماني?\s*(?:مائ[ةه]|مئ[ةه]|مي[ةه]))/,
    value: 800,
  },
  {
    pattern: /(?:سبعمائ[ةه]|سبعمئ[ةه]|سبعمي[ةه]|سبع\s*(?:مائ[ةه]|مئ[ةه]|مي[ةه]))/,
    value: 700,
  },
  {
    pattern: /(?:ستمائ[ةه]|ستمئ[ةه]|ستمي[ةه]|ست\s*(?:مائ[ةه]|مئ[ةه]|مي[ةه]))/,
    value: 600,
  },
  {
    pattern: /(?:خمسمائ[ةه]|خمسمئ[ةه]|خمسمي[ةه]|خمس\s*(?:مائ[ةه]|مئ[ةه]|مي[ةه]))/,
    value: 500,
  },
  {
    pattern:
      /(?:أربعمائ[ةه]|اربعمائ[ةه]|أربعمئ[ةه]|اربعمئ[ةه]|أربعمي[ةه]|اربعمي[ةه]|(?:أربع|اربع)\s*(?:مائ[ةه]|مئ[ةه]|مي[ةه]))/,
    value: 400,
  },
  {
    pattern: /(?:ثلاثمائ[ةه]|ثلاثمئ[ةه]|ثلاثمي[ةه]|ثلاث\s*(?:مائ[ةه]|مئ[ةه]|مي[ةه]))/,
    value: 300,
  },
  {
    pattern: /(?:مئتين|مائتين|ميتين|مئتا|مائتا|مئتي|مائتي)/,
    value: 200,
  },
  {
    pattern: /(?:مائ[ةه]|مئ[ةه]|مي[ةه])/,
    value: 100,
  },
];

const WRITTEN_TENS_PATTERNS: Array<{ pattern: RegExp; value: number }> = [
  { pattern: /(?:تسعين|تسعون)/, value: 90 },
  { pattern: /(?:ثمانين|ثمانون)/, value: 80 },
  { pattern: /(?:سبعين|سبعون)/, value: 70 },
  { pattern: /(?:ستين|ستون)/, value: 60 },
  { pattern: /(?:خمسين|خمسون)/, value: 50 },
  { pattern: /(?:أربعين|اربعين|أربعون|اربعون)/, value: 40 },
  { pattern: /(?:ثلاثين|ثلاثون)/, value: 30 },
  { pattern: /(?:عشرين|عشرون)/, value: 20 },
  { pattern: /(?:عشر[ةه]?)/, value: 10 },
];

/**
 * Parses a single written Arabic hundred phrase (optionally with tens) into a
 * number between 100 and 990 (e.g., "ثمانمائة" -> 800, "ثمانمائة وخمسين" -> 850).
 */
export function parseWrittenHundredsValue(
  text: string,
  options?: { allowCompoundTens?: boolean }
): number | null {
  const cleaned = stripDiacritics(normalizeArabicDigits(text)).trim();
  for (const h of WRITTEN_HUNDREDS_PATTERNS) {
    const exactHundredRegex = new RegExp(`^${h.pattern.source}$`);
    if (exactHundredRegex.test(cleaned)) {
      return h.value;
    }
    if (options?.allowCompoundTens !== false) {
      for (const t of WRITTEN_TENS_PATTERNS) {
        const compoundRegex = new RegExp(
          `^${h.pattern.source}\\s*و\\s*${t.pattern.source}$`
        );
        if (compoundRegex.test(cleaned)) {
          return h.value + t.value;
        }
      }
    }
  }
  return null;
}

/**
 * Extracts a budget or price from natural-language Arabic text containing either
 * digits or written Arabic number words (e.g., "ثمانمائة ألف" -> 800000).
 */
export function parseArabicBudgetOrPriceFromText(rawText: string): number | null {
  if (!rawText || typeof rawText !== "string") return null;
  const digitsNormalized = normalizeArabicDigits(rawText).replace(
    /(\d)\s*[,،٬]\s*(\d)/g,
    "$1$2"
  );
  const text = stripDiacritics(digitsNormalized).replace(/[،,]/g, " ");

  // 1. "مليون و 200 ألف" (numeric thousands after million)
  const millionWithNumericThousands = text.match(
    /مليون\s*و\s*(\d{2,3})\s*(?:ألف|الف|آلاف|الاف)/
  );
  if (millionWithNumericThousands) {
    return 1_000_000 + Number(millionWithNumericThousands[1]) * 1_000;
  }

  // 2. "مليون و <written hundreds> ألف" (e.g., "مليون ومئتين ألف", "مليون وثلاثمائة ألف")
  for (const h of WRITTEN_HUNDREDS_PATTERNS) {
    const millionWithWrittenHundreds = new RegExp(
      `مليون\\s*و\\s*${h.pattern.source}(?:\\s*(?:ألف|الف|آلاف|الاف))?`
    );
    if (millionWithWrittenHundreds.test(text)) {
      return 1_000_000 + h.value * 1_000;
    }
  }

  // 3. Fractional millions: "مليون ونصف", "مليون وربع", "مليون إلا ربع", "نصف مليون", "مليونين"
  if (/مليونين\s*و\s*(?:نصف|نص)/.test(text)) {
    return 2_500_000;
  }
  if (/مليونين|مليونان/.test(text)) {
    return 2_000_000;
  }
  if (/مليون\s*و\s*(?:نصف|نص)/.test(text)) {
    return 1_500_000;
  }
  if (/مليون\s*و\s*ربع/.test(text)) {
    return 1_250_000;
  }
  if (/مليون\s*(?:إلا|الا)\s*ربع/.test(text)) {
    return 750_000;
  }
  if (/(?:نصف|نص)\s*مليون/.test(text)) {
    return 500_000;
  }

  // 4. Decimal / integer millions (e.g., "1.2 مليون", "2 مليون")
  const decimalMillion = text.match(/(\d+(?:\.\d+)?)\s*مليون/);
  if (decimalMillion) {
    return Math.round(Number(decimalMillion[1]) * 1_000_000);
  }

  // 5. Written hundreds (+ optional tens) + ألف (e.g., "ثمانمائة ألف" -> 800000, "ثمانمائة وخمسين ألف" -> 850000)
  for (const h of WRITTEN_HUNDREDS_PATTERNS) {
    for (const t of WRITTEN_TENS_PATTERNS) {
      const compoundThousandRegex = new RegExp(
        `${h.pattern.source}\\s*و\\s*${t.pattern.source}\\s*(?:ألف|الف|آلاف|الاف)`
      );
      if (compoundThousandRegex.test(text)) {
        return (h.value + t.value) * 1_000;
      }
    }
    const singleHundredThousandRegex = new RegExp(
      `${h.pattern.source}\\s*(?:ألف|الف|آلاف|الاف)`
    );
    if (singleHundredThousandRegex.test(text)) {
      return h.value * 1_000;
    }
  }

  // 6. Standalone "مليون"
  if (/(?:ميزاني[ةه]|بسعر|حدود|سعر|مبلغ)\s*مليون(?!\s*و)/.test(text) || /^مليون$/.test(text.trim())) {
    return 1_000_000;
  }

  // 7. Numeric thousands shorthand (e.g., "800 ألف", "٨٠٠ ألف")
  const thousandsMatch = text.match(/(\d{2,4})\s*(?:ألف|الف|آلاف|الاف)/);
  if (thousandsMatch) {
    return Number(thousandsMatch[1]) * 1_000;
  }

  // 8. Explicit 6-to-8 digit number (e.g., "800000", "٨٠٠٠٠٠")
  const explicitLargeNum = text.match(/\b(\d{5,8})\b/);
  if (explicitLargeNum) {
    return Number(explicitLargeNum[1]);
  }

  return null;
}

/**
 * Preprocesses form and schema numeric inputs so that ASCII digits ("800000"),
 * Eastern Arabic digits ("٨٠٠٠٠٠"), formatted numbers ("800,000" / "٨٠٠،٠٠٠"),
 * and written Arabic numbers ("ثمانمائة ألف") all coerce cleanly into a number.
 */
export function preprocessNumericInput(val: unknown): number | string | undefined {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number") return val;
  if (typeof val !== "string") return val as string;

  const trimmed = val.trim();
  if (!trimmed) return undefined;

  // Normalize Eastern Arabic / Extended Arabic-Indic digits and decimal/thousand separators
  const normalized = stripDiacritics(normalizeArabicDigits(trimmed))
    .replace(/(\d)\s*[,،٬_]\s*(\d)/g, "$1$2")
    .replace(/[,،٬]/g, "")
    .replace(
      /(?:ريال\s*سعودي|ريال|ر\.?\s*س\.?|رس|SAR|sar|SR|sr|متر\s*مربع|مترمربع|متر|م²|م2|غرف\s*نوم|غرف[ةه]?|دورات\s*مياه|دور[ةه]?\s*مياه|حمامات|حمام|أفراد|افراد|أشخاص|اشخاص)/gi,
      ""
    )
    .trim();

  if (!normalized) return undefined;

  // Direct integer or decimal number (e.g. "800000" from "٨٠٠٠٠٠" or "800000")
  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return Number(normalized);
  }

  // Written or shorthand budget/price (e.g. "ثمانمائة ألف", "800 ألف", "1.2 مليون")
  const parsedWritten = parseArabicBudgetOrPriceFromText(trimmed);
  if (parsedWritten !== null) {
    return parsedWritten;
  }

  // Extract leading number if followed by descriptive words (e.g. "٣ غرف" -> 3)
  const leadingNumber = normalized.match(/^-?\d+(?:\.\d+)?/);
  if (leadingNumber) {
    return Number(leadingNumber[0]);
  }

  return normalized;
}
