import type { ConstraintResult, RequirementsRow } from "@/lib/analysis/constraints";
import { resolveFacts, type PropertyFact } from "@/lib/evidence/resolve";
import { formatSAR } from "@/lib/utils";

export interface PropertyAssessmentWithProperty {
  id: string;
  property_id: string;
  fit_rating: "strong" | "partial" | "weak" | "insufficient_evidence" | string;
  fit_summary: string;
  strengths: string[];
  risks: string[];
  key_unknowns: string[];
  visit_priority: "high" | "medium" | "low" | "insufficient_evidence" | string;
  visit_priority_reason: string;
  evidence_fields: string[];
  constraint_results: ConstraintResult[];
  price_per_sqm: number | null;
  properties?: {
    id: string;
    title?: string | null;
    district?: string | null;
    listing_price_sar?: number | null;
    area_sqm?: number | null;
    bedrooms?: number | null;
    floor_no?: number | null;
    source_url?: string | null;
    input_mode?: string | null;
    notes?: string | null;
    property_facts?: PropertyFact[];
  } | null;
  property?: {
    id: string;
    title?: string | null;
    district?: string | null;
    listing_price_sar?: number | null;
    area_sqm?: number | null;
    bedrooms?: number | null;
    floor_no?: number | null;
    source_url?: string | null;
    input_mode?: string | null;
    notes?: string | null;
    property_facts?: PropertyFact[];
  } | null;
  resolvedPrice?: number | null;
  resolvedArea?: number | null;
  resolvedBedrooms?: number | null;
  resolvedDistrict?: string | null;
}

export interface RankedItem {
  property_id: string;
  assessment_id: string;
  rank: number | null;
  title: string;
  district: string;
  price: number | null;
  price_per_sqm: number | null;
  price_delta_budget: number | null; // price - max_budget_sar (negative means savings, positive means over budget)
  area_sqm: number | null;
  bedrooms: number | null;
  fit_rating: "strong" | "partial" | "weak" | "insufficient_evidence";
  visit_priority: "high" | "medium" | "low" | "insufficient_evidence";
  constraint_summary: {
    pass: number;
    fail: number;
    unknown: number;
  };
  constraints: ConstraintResult[];
  main_advantage_ar: string;
  main_tradeoff_ar: string;
  what_could_change_rank_ar: string;
  strengths: string[];
  risks: string[];
  key_unknowns: string[];
}

export type ComparisonMode = "ranked" | "provisional" | "insufficient";

export interface ComparisonResult {
  mode: ComparisonMode;
  items: RankedItem[];
  summaryAr: string;
  close_options: boolean;
  tradeoff_summary_ar?: string;
}

const FIT_SCORES: Record<string, number> = {
  strong: 4,
  partial: 3,
  weak: 2,
  insufficient_evidence: 1,
};

export function resolveComparison(
  assessments: PropertyAssessmentWithProperty[],
  requirements?: RequirementsRow | null
): ComparisonResult {
  // 1. Eligibility: max 3 properties from current run
  const pool = (assessments || []).slice(0, 3);

  // If < 2 properties: mode = 'insufficient'
  if (pool.length < 2) {
    const rawItems: RankedItem[] = pool.map((item, idx) => {
      const p = item.property || item.properties;
      const rawFacts = p?.property_facts || [];
      const resolved = rawFacts.length > 0 ? resolveFacts(rawFacts) : null;

      const price =
        item.resolvedPrice ??
        (resolved?.fields.listing_price_sar.status === "known"
          ? Number(resolved.fields.listing_price_sar.value)
          : p?.listing_price_sar ?? null);

      const area =
        item.resolvedArea ??
        (resolved?.fields.area_sqm.status === "known"
          ? Number(resolved.fields.area_sqm.value)
          : p?.area_sqm ?? null);

      const bedrooms =
        item.resolvedBedrooms ??
        (resolved?.fields.bedrooms.status === "known"
          ? Number(resolved.fields.bedrooms.value)
          : p?.bedrooms ?? null);

      const district =
        item.resolvedDistrict ??
        (resolved?.fields.district.status === "known"
          ? String(resolved.fields.district.value)
          : p?.district ?? "");

      const constraints = item.constraint_results || [];
      const pass = constraints.filter((c) => c.result === "pass").length;
      const fail = constraints.filter((c) => c.result === "fail").length;
      const unknown = constraints.filter((c) => c.result === "unknown").length;

      let title = p?.title?.trim() || "";
      if (!title) {
        if (district) {
          title = `شقة في حي ${district}`;
        } else if (p?.input_mode === "url" && p?.source_url) {
          try {
            title = new URL(p.source_url).hostname;
          } catch {
            title = `عقار ${idx + 1}`;
          }
        } else {
          title = `عقار ${idx + 1}`;
        }
      }

      const budget = requirements?.max_budget_sar;
      const deltaBudget = price !== null && budget ? price - budget : null;

      return {
        property_id: item.property_id,
        assessment_id: item.id,
        rank: null,
        title,
        district,
        price,
        price_per_sqm: item.price_per_sqm,
        price_delta_budget: deltaBudget,
        area_sqm: area,
        bedrooms,
        fit_rating: (item.fit_rating as RankedItem["fit_rating"]) || "insufficient_evidence",
        visit_priority: (item.visit_priority as RankedItem["visit_priority"]) || "insufficient_evidence",
        constraint_summary: { pass, fail, unknown },
        constraints,
        main_advantage_ar: item.strengths[0] || "بيانات فردية غير كافية للمقارنة",
        main_tradeoff_ar: item.risks[0] || "لا تتوفر خيارات بديلة للمفاضلة",
        what_could_change_rank_ar: item.key_unknowns[0] || "إضافة عقارات أخرى للمقارنة",
        strengths: item.strengths || [],
        risks: item.risks || [],
        key_unknowns: item.key_unknowns || [],
      };
    });

    return {
      mode: "insufficient",
      items: rawItems,
      summaryAr: "البيانات المتاحة لا تكفي لمقارنة عادلة بين الخيارات",
      close_options: false,
    };
  }

  // 2. Prepare normalized items
  interface NormalizedCandidate {
    raw: PropertyAssessmentWithProperty;
    property_id: string;
    assessment_id: string;
    title: string;
    district: string;
    price: number | null;
    price_per_sqm: number | null;
    price_delta_budget: number | null;
    area_sqm: number | null;
    bedrooms: number | null;
    fit_rating: RankedItem["fit_rating"];
    fit_score: number;
    visit_priority: RankedItem["visit_priority"];
    constraints: ConstraintResult[];
    passCount: number;
    failCount: number;
    unknownCount: number;
    hasUnknownCriticalConstraint: boolean;
  }

  const budget = requirements?.max_budget_sar || null;

  const candidates: NormalizedCandidate[] = pool.map((item, idx) => {
    const p = item.property || item.properties;
    const rawFacts = p?.property_facts || [];
    const resolved = rawFacts.length > 0 ? resolveFacts(rawFacts) : null;

    const price =
      item.resolvedPrice ??
      (resolved?.fields.listing_price_sar.status === "known"
        ? Number(resolved.fields.listing_price_sar.value)
        : p?.listing_price_sar ?? null);

    const area =
      item.resolvedArea ??
      (resolved?.fields.area_sqm.status === "known"
        ? Number(resolved.fields.area_sqm.value)
        : p?.area_sqm ?? null);

    const bedrooms =
      item.resolvedBedrooms ??
      (resolved?.fields.bedrooms.status === "known"
        ? Number(resolved.fields.bedrooms.value)
        : p?.bedrooms ?? null);

    const district =
      item.resolvedDistrict ??
      (resolved?.fields.district.status === "known"
        ? String(resolved.fields.district.value)
        : p?.district ?? "");

    const constraints = item.constraint_results || [];
    const passCount = constraints.filter((c) => c.result === "pass").length;
    const failCount = constraints.filter((c) => c.result === "fail").length;
    const unknownCount = constraints.filter((c) => c.result === "unknown").length;

    const hasUnknownCriticalConstraint = constraints.some(
      (c) =>
        c.result === "unknown" &&
        ["budget", "bedrooms", "min_area", "elevator_required"].includes(c.key)
    );

    let title = p?.title?.trim() || "";
    if (!title) {
      if (district) {
        title = `شقة في حي ${district}`;
      } else if (p?.input_mode === "url" && p?.source_url) {
        try {
          title = new URL(p.source_url).hostname;
        } catch {
          title = `عقار ${idx + 1}`;
        }
      } else {
        title = `عقار ${idx + 1}`;
      }
    }

    const deltaBudget = price !== null && budget !== null ? price - budget : null;
    const fit_rating = (item.fit_rating as RankedItem["fit_rating"]) || "insufficient_evidence";

    return {
      raw: item,
      property_id: item.property_id,
      assessment_id: item.id,
      title,
      district,
      price,
      price_per_sqm: item.price_per_sqm,
      price_delta_budget: deltaBudget,
      area_sqm: area,
      bedrooms,
      fit_rating,
      fit_score: FIT_SCORES[fit_rating] || 1,
      visit_priority: (item.visit_priority as RankedItem["visit_priority"]) || "insufficient_evidence",
      constraints,
      passCount,
      failCount,
      unknownCount,
      hasUnknownCriticalConstraint,
    };
  });

  // 3. Sorting
  // Rule A: 0 failed constraints rank above properties with failed constraints
  // Rule B: Sort by fit rating (strong > partial > weak > insufficient)
  // Rule C: Price per sqm (lower is better value)
  // Rule D: Price (lower is better)
  candidates.sort((a, b) => {
    // Fewer failed constraints wins
    if (a.failCount !== b.failCount) {
      return a.failCount - b.failCount;
    }

    // Higher fit score wins
    if (a.fit_score !== b.fit_score) {
      return b.fit_score - a.fit_score;
    }

    // More passed constraints wins
    if (a.passCount !== b.passCount) {
      return b.passCount - a.passCount;
    }

    // Price per sqm
    if (a.price_per_sqm && b.price_per_sqm && a.price_per_sqm !== b.price_per_sqm) {
      return a.price_per_sqm - b.price_per_sqm;
    }

    // Total price
    if (a.price && b.price && a.price !== b.price) {
      return a.price - b.price;
    }

    return 0;
  });

  // 4. Mode Determination
  // If critical fields or hard constraints are unknown on top candidates: mode = 'provisional'
  const topCandidate = candidates[0];
  const secondCandidate = candidates[1];

  let mode: ComparisonMode = "ranked";
  if (
    topCandidate.hasUnknownCriticalConstraint ||
    topCandidate.price === null ||
    topCandidate.area_sqm === null ||
    (secondCandidate && secondCandidate.hasUnknownCriticalConstraint)
  ) {
    mode = "provisional";
  }

  // 5. Check Close Options (virtually tied within 5% delta)
  let closeOptions = false;
  if (
    topCandidate &&
    secondCandidate &&
    topCandidate.failCount === secondCandidate.failCount &&
    topCandidate.fit_rating === secondCandidate.fit_rating
  ) {
    // Check price delta
    if (topCandidate.price && secondCandidate.price) {
      const priceDelta =
        Math.abs(topCandidate.price - secondCandidate.price) /
        Math.max(topCandidate.price, secondCandidate.price);
      if (priceDelta <= 0.05) {
        closeOptions = true;
      }
    }

    // Check price per sqm delta
    if (!closeOptions && topCandidate.price_per_sqm && secondCandidate.price_per_sqm) {
      const ppmDelta =
        Math.abs(topCandidate.price_per_sqm - secondCandidate.price_per_sqm) /
        Math.max(topCandidate.price_per_sqm, secondCandidate.price_per_sqm);
      if (ppmDelta <= 0.05) {
        closeOptions = true;
      }
    }
  }

  // 6. Build Narrative (Advantage, Tradeoff, What Could Change Rank)
  const rankedItems: RankedItem[] = candidates.map((c, index) => {
    const rank = index + 1;
    const others = candidates.filter((_, idx) => idx !== index);

    // Compute main advantage vs others
    let mainAdvantage = "";
    if (c.failCount === 0 && others.some((o) => o.failCount > 0)) {
      mainAdvantage = "مطابق لجميع الشروط المحددة والميزانية دون أي مخالفات.";
    } else if (c.price && others.every((o) => o.price && c.price! < o.price)) {
      const diff = Math.min(...others.map((o) => o.price! - c.price!));
      mainAdvantage = `الخيار الأقل سعراً (${formatSAR(c.price)}) بفارق توفير ${formatSAR(diff)} عن أقرب خيار.`;
    } else if (c.price_per_sqm && others.every((o) => o.price_per_sqm && c.price_per_sqm! <= o.price_per_sqm)) {
      mainAdvantage = `أفضل قيمة لسعر المتر المربع (${Math.round(c.price_per_sqm).toLocaleString("ar-SA")} ر.س / م²).`;
    } else if (c.area_sqm && others.every((o) => o.area_sqm && c.area_sqm! >= o.area_sqm)) {
      mainAdvantage = `المساحة الأكبر بين الخيارات (${c.area_sqm} م²).`;
    } else if (c.raw.strengths && c.raw.strengths.length > 0) {
      mainAdvantage = c.raw.strengths[0];
    } else {
      mainAdvantage = "توافق جيد مع متطلبات المشتري الأساسية.";
    }

    // Compute main tradeoff vs others
    let mainTradeoff = "";
    const failedConstraint = c.constraints.find((item) => item.result === "fail");
    if (failedConstraint) {
      mainTradeoff = failedConstraint.detailAr;
    } else if (c.price && others.some((o) => o.price && c.price! > o.price)) {
      const cheapest = Math.min(...others.filter((o) => o.price).map((o) => o.price!));
      const extra = c.price - cheapest;
      mainTradeoff = `سعره أعلى بمقدار ${formatSAR(extra)} مقارنة بالخيار الأقل سعراً.`;
    } else if (c.area_sqm && others.some((o) => o.area_sqm && c.area_sqm! < o.area_sqm)) {
      mainTradeoff = `مساحته (${c.area_sqm} م²) أصغر من الخيارات الأوسع في المقارنة.`;
    } else if (c.raw.risks && c.raw.risks.length > 0) {
      mainTradeoff = c.raw.risks[0];
    } else {
      mainTradeoff = "لا توجد تضحيات جوهرية مسجلة.";
    }

    // Compute what could change rank
    let whatCouldChange = "";
    const unknownConstraints = c.constraints.filter((item) => item.result === "unknown");
    if (unknownConstraints.length > 0) {
      const labels = unknownConstraints.map((item) => item.labelAr).join(" أو ");
      whatCouldChange = `التحقق الميداني من (${labels})؛ فثبوت عدم توفرها قد يخفض رتبته.`;
    } else if (c.raw.key_unknowns && c.raw.key_unknowns.length > 0) {
      whatCouldChange = `التأكد من: ${c.raw.key_unknowns.slice(0, 2).join("، ")}.`;
    } else {
      whatCouldChange = "كافة البيانات الجوهرية مؤكدة؛ المعاينة الميدانية والتفاوض هما الفيصل.";
    }

    return {
      property_id: c.property_id,
      assessment_id: c.assessment_id,
      rank,
      title: c.title,
      district: c.district,
      price: c.price,
      price_per_sqm: c.price_per_sqm,
      price_delta_budget: c.price_delta_budget,
      area_sqm: c.area_sqm,
      bedrooms: c.bedrooms,
      fit_rating: c.fit_rating,
      visit_priority: c.visit_priority,
      constraint_summary: {
        pass: c.passCount,
        fail: c.failCount,
        unknown: c.unknownCount,
      },
      constraints: c.constraints,
      main_advantage_ar: mainAdvantage,
      main_tradeoff_ar: mainTradeoff,
      what_could_change_rank_ar: whatCouldChange,
      strengths: c.raw.strengths || [],
      risks: c.raw.risks || [],
      key_unknowns: c.raw.key_unknowns || [],
    };
  });

  const summaryAr =
    mode === "provisional"
      ? "ترتيب تقديري — توجد معلومات حرجة غير محسومة قد تغير النتيجة"
      : "ترتيب مبني على مطابقة الشروط والبيانات المتاحة";

  const tradeoffSummary = closeOptions
    ? "الخيارات الأولى متقاربة جداً في السعر ومستوى التوافق، ويعتمد الاختيار النهائي على المزايا النوعية والمعاينة."
    : undefined;

  return {
    mode,
    items: rankedItems,
    summaryAr,
    close_options: closeOptions,
    tradeoff_summary_ar: tradeoffSummary,
  };
}
