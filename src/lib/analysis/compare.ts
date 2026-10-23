import type { ConstraintResult, RequirementsRow } from "@/lib/analysis/constraints";
import { resolveFacts, type PropertyFact } from "@/lib/evidence/resolve";
import { formatSAR } from "@/lib/utils";
import {
  evaluateDecisionAxes,
  type AffordabilityAxis,
  type ConfidenceLevel,
  type DailyLifeAxis,
  type PriceAxis,
} from "@/lib/analysis/axes";

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
  evidence_fields?: string[];
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
  fit_summary?: string;
  visit_priority: "high" | "medium" | "low" | "insufficient_evidence";
  visit_priority_reason?: string;
  overall_confidence: ConfidenceLevel;
  confidence_label_ar: string;
  confidence_reason_ar: string;
  daily_life: DailyLifeAxis;
  price_axis: PriceAxis;
  affordability_axis: AffordabilityAxis;
  tradeoffs: string[];
  constraint_summary: {
    pass: number;
    fail: number;
    unknown: number;
  };
  constraints: ConstraintResult[];
  main_advantage_ar: string;
  main_tradeoff_ar: string;
  what_could_change_rank_ar: string;
  ranking_reason_ar?: string;
  preferences_impact_ar?: string;
  score_vs_rank_note_ar?: string;
  preference_match_count?: number;
  preference_total_count?: number;
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

/**
 * Computes honest, deterministic engineering fit scores (percentage 45..96)
 * for a pool of RankedItems based strictly on constraint compliance, fit rating,
 * visit priority, preference alignment, price-per-sqm efficiency, and budget
 * compliance — without any artificial rank-subtraction penalty.
 */
export function computePoolFitScores(
  items: RankedItem[],
  maxBudget?: number | null
): number[] {
  const validPpsqm = items
    .map((i) => i.price_per_sqm)
    .filter((v): v is number => v !== null && v > 0);
  const minPpsqm = validPpsqm.length > 0 ? Math.min(...validPpsqm) : null;
  const maxPpsqm = validPpsqm.length > 0 ? Math.max(...validPpsqm) : null;

  const validPrices = items
    .map((i) => i.price)
    .filter((v): v is number => v !== null && v > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : null;

  return items.map((item) => {
    const { pass, fail, unknown } = item.constraint_summary;
    const totalConstraints = pass + fail + unknown;

    const rawConstraintPts =
      totalConstraints > 0
        ? Math.round(
            ((pass * 1.0 + unknown * 0.55 + fail * 0.05) / totalConstraints) * 38
          )
        : 26;
    const constraintPts =
      fail > 0 ? Math.max(6, rawConstraintPts - fail * 10) : rawConstraintPts;

    const fitBase =
      item.fit_rating === "strong"
        ? 30
        : item.fit_rating === "partial"
        ? 22
        : item.fit_rating === "weak"
        ? 15
        : 12;

    const priorityBonus =
      item.visit_priority === "high"
        ? 4
        : item.visit_priority === "medium"
        ? 2
        : 0;

    const prefBonus = Math.min(6, (item.preference_match_count || 0) * 3);

    let ppsqmPts = 10;
    if (
      item.price_per_sqm &&
      minPpsqm !== null &&
      maxPpsqm !== null &&
      maxPpsqm > minPpsqm
    ) {
      const eff = 1 - (item.price_per_sqm - minPpsqm) / (maxPpsqm - minPpsqm);
      ppsqmPts = Math.round(7 + eff * 9);
    } else if (
      item.price_per_sqm &&
      minPpsqm !== null &&
      item.price_per_sqm === minPpsqm
    ) {
      ppsqmPts = 14;
    }

    let pricePts = 8;
    if (item.price && maxBudget && maxBudget > 0) {
      if (item.price <= maxBudget) {
        const savingsRatio = Math.min(1, (maxBudget - item.price) / maxBudget);
        pricePts = Math.round(8 + savingsRatio * 4);
      } else {
        const overRatio = (item.price - maxBudget) / maxBudget;
        pricePts = Math.max(2, Math.round(7 - overRatio * 14));
      }
    } else if (
      item.price &&
      minPrice !== null &&
      maxPrice !== null &&
      maxPrice > minPrice
    ) {
      const priceEff = 1 - (item.price - minPrice) / (maxPrice - minPrice);
      pricePts = Math.round(6 + priceEff * 6);
    }

    // Hard constraints take priority over cheaper price: cap price bonuses when any hard constraint fails
    const combinedPricePts =
      fail > 0 ? Math.min(14, ppsqmPts + pricePts) : ppsqmPts + pricePts;

    const totalScore =
      constraintPts + fitBase + priorityBonus + prefBonus + combinedPricePts;

    return Math.min(
      fail > 0 ? 68 : 96,
      Math.max(45, totalScore)
    );
  });
}

interface PreferenceEvaluation {
  score: number;
  matchedLabels: string[];
  contradictedLabels: string[];
  unverifiedLabels: string[];
  totalCount: number;
  impactAr: string;
}

function normalizePreferencesList(
  rawPreferences: unknown
): Array<{ label: string; weight: "high" | "medium" | "low" }> {
  if (!Array.isArray(rawPreferences)) return [];
  const out: Array<{ label: string; weight: "high" | "medium" | "low" }> = [];
  for (const item of rawPreferences) {
    if (typeof item === "string" && item.trim()) {
      out.push({ label: item.trim(), weight: "medium" });
    } else if (
      item &&
      typeof item === "object" &&
      "label" in item &&
      typeof (item as { label: unknown }).label === "string" &&
      (item as { label: string }).label.trim()
    ) {
      const w = (item as { weight?: string }).weight;
      out.push({
        label: (item as { label: string }).label.trim(),
        weight: w === "high" || w === "low" ? w : "medium",
      });
    }
  }
  return out;
}

function evaluatePreferencesImpact(
  rawPreferences: unknown,
  params: {
    title: string;
    district: string;
    notes?: string | null;
    fitSummary?: string | null;
    strengths: string[];
    risks: string[];
    facts?: PropertyFact[];
    resolved: ReturnType<typeof resolveFacts> | null;
  }
): PreferenceEvaluation {
  const preferences = normalizePreferencesList(rawPreferences);
  if (preferences.length === 0) {
    return {
      score: 0,
      matchedLabels: [],
      contradictedLabels: [],
      unverifiedLabels: [],
      totalCount: 0,
      impactAr:
        "تأثير التفضيلات: لم تُحدّد تفضيلات إضافية في ملف احتياجك، لذا اعتمد الترتيب على شروطك الملزمة والسعر.",
    };
  }

  const factTexts = (params.facts || [])
    .map(
      (f) =>
        `${f.field || ""} ${String(f.value ?? "")} ${f.evidence_text || ""} ${f.raw_text || ""}`
    )
    .join(" ");

  const positiveCorpus = [
    params.title,
    params.district,
    params.notes || "",
    params.fitSummary || "",
    ...params.strengths,
    factTexts,
  ]
    .join(" ")
    .toLowerCase();

  const riskCorpus = params.risks.join(" ").toLowerCase();

  const matchedLabels: string[] = [];
  const contradictedLabels: string[] = [];
  const unverifiedLabels: string[] = [];
  let score = 0;

  for (const pref of preferences) {
    const label = pref.label;
    const weightPts = pref.weight === "high" ? 3 : pref.weight === "medium" ? 2 : 1;
    let status: "matched" | "contradicted" | "unverified" = "unverified";

    if (/هدوء|هادئ/.test(label)) {
      if (
        /إزعاج|صاخب|ضوضاء|مزدحم/.test(riskCorpus) ||
        /شارع تجاري مزدحم|إزعاج/.test(positiveCorpus)
      ) {
        status = "contradicted";
      } else if (/هادئ|هدوء|شارع داخلي|سكني هادئ/.test(positiveCorpus)) {
        status = "matched";
      }
    } else if (/مسجد|جامع|خدمات/.test(label)) {
      if (/مسجد|جامع|خدمات|مدارس|حديقة|مرافق/.test(positiveCorpus)) {
        status = "matched";
      }
    } else if (/شمال|شرق|واجهة/.test(label)) {
      if (/شمال|شمالية|شرق|شرقية/.test(positiveCorpus)) {
        status = "matched";
      } else if (/غربية|جنوبية/.test(positiveCorpus) && !/شمال|شرق/.test(positiveCorpus)) {
        status = "contradicted";
      }
    } else if (/مدخلين|مدخل مستقل/.test(label)) {
      if (/مدخلين|مدخل مستقل|مدخل خاص/.test(positiveCorpus)) {
        status = "matched";
      }
    } else if (/خادمة|عاملة/.test(label)) {
      if (/خادمة|عاملة/.test(positiveCorpus)) {
        status = "matched";
      }
    } else if (/بلكونة|شرفة|سطح|حوش/.test(label)) {
      if (/بلكونة|شرفة|سطح|حوش|ارتداد/.test(positiveCorpus)) {
        status = "matched";
      }
    } else if (/مصعد/.test(label)) {
      const elevVal =
        params.resolved?.fields.elevator.status === "known"
          ? params.resolved.fields.elevator.value
          : null;
      if (elevVal === true || (/مصعد/.test(positiveCorpus) && !/بدون مصعد|لا يتوفر مصعد|لا يوجد مصعد/.test(positiveCorpus))) {
        status = "matched";
      } else if (elevVal === false || /بدون مصعد|لا يتوفر مصعد|لا يوجد مصعد/.test(positiveCorpus)) {
        status = "contradicted";
      }
    } else if (/موقف/.test(label)) {
      const parkVal =
        params.resolved?.fields.private_parking.status === "known"
          ? params.resolved.fields.private_parking.value
          : null;
      if (parkVal === true || (/موقف/.test(positiveCorpus) && !/بدون موقف|لا يتوفر موقف/.test(positiveCorpus))) {
        status = "matched";
      } else if (parkVal === false || /بدون موقف|لا يتوفر موقف/.test(positiveCorpus)) {
        status = "contradicted";
      }
    } else {
      const tokens = label
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
        .split(/\s+/)
        .map((t) => t.replace(/^ال/, "").trim())
        .filter((t) => t.length >= 3 && !["قرب", "وجود", "تفضيل", "أفضل", "يفضل"].includes(t));
      if (tokens.some((tok) => positiveCorpus.includes(tok))) {
        status = "matched";
      }
    }

    if (status === "matched") {
      matchedLabels.push(label);
      score += weightPts;
    } else if (status === "contradicted") {
      contradictedLabels.push(label);
      score -= weightPts;
    } else {
      unverifiedLabels.push(label);
    }
  }

  let impactAr = "";
  if (matchedLabels.length > 0) {
    impactAr = `تأثير تفضيلاتك: تتوافق الشقة مع (${matchedLabels.join("، ")}) مما عزز نقاطها وترتيبها${
      unverifiedLabels.length > 0
        ? `، بينما (${unverifiedLabels.join("، ")}) غير مذكور في الإعلان ويُتحقق منه ميدانياً`
        : ""
    }.`;
  } else if (contradictedLabels.length > 0) {
    impactAr = `تأثير تفضيلاتك: لا تحقق تفضيل (${contradictedLabels.join("، ")}) مما خفّض أولويتها مقارنة بالخيارات المتوافقة.`;
  } else {
    impactAr = `تأثير تفضيلاتك: تفضيل (${unverifiedLabels.join("، ")}) غير محسوم في بيانات الإعلان فلم يمنحها نقاط أفضلية إضافية، ويُحسم عند المعاينة.`;
  }

  return {
    score,
    matchedLabels,
    contradictedLabels,
    unverifiedLabels,
    totalCount: preferences.length,
    impactAr,
  };
}

function syncHardConstraintsWithFacts(
  rawConstraints: ConstraintResult[],
  resolved: ReturnType<typeof resolveFacts> | null,
  requirements?: Partial<RequirementsRow> | null
): ConstraintResult[] {
  const updated = rawConstraints.map((c) => ({ ...c }));

  const hasHardConstraintKey = (key: string) => {
    if (updated.some((c) => c.key === key)) return true;
    if (!Array.isArray(requirements?.hard_constraints)) return false;
    return requirements!.hard_constraints.some((hc) =>
      typeof hc === "string"
        ? hc === key
        : hc && typeof hc === "object" && "key" in hc && (hc as { key: string }).key === key
    );
  };

  // Ensure elevator_required is strictly enforced when the user required an elevator
  if (hasHardConstraintKey("elevator_required")) {
    const knownElevator =
      resolved?.fields.elevator.status === "known"
        ? Boolean(resolved.fields.elevator.value)
        : null;
    const idx = updated.findIndex((c) => c.key === "elevator_required");

    if (idx >= 0) {
      const existing = updated[idx];
      const detailIndicatesNoElevator =
        existing.detailAr.includes("لا يتوفر مصعد") ||
        existing.detailAr.includes("ولا يتطلب مصعدًا") ||
        existing.detailAr.includes("بدون مصعد");

      if (knownElevator === false || detailIndicatesNoElevator) {
        updated[idx] = {
          ...existing,
          result: "fail",
          detailAr: "لا يتوفر مصعد في المبنى (شرط ملزم للمستخدم)",
        };
      } else if (knownElevator === true && existing.result !== "pass") {
        updated[idx] = {
          ...existing,
          result: "pass",
          detailAr: "يتوفر مصعد في المبنى",
        };
      }
    } else if (knownElevator !== null) {
      updated.push({
        key: "elevator_required",
        labelAr: "وجود مصعد",
        result: knownElevator ? "pass" : "fail",
        detailAr: knownElevator
          ? "يتوفر مصعد في المبنى"
          : "لا يتوفر مصعد في المبنى (شرط ملزم للمستخدم)",
      });
    }
  }

  // Ensure private_parking is strictly synced when known in resolved facts
  if (hasHardConstraintKey("private_parking")) {
    const knownParking =
      resolved?.fields.private_parking.status === "known"
        ? Boolean(resolved.fields.private_parking.value)
        : null;
    const idx = updated.findIndex((c) => c.key === "private_parking");
    if (idx >= 0 && knownParking !== null) {
      updated[idx] = {
        ...updated[idx],
        result: knownParking ? "pass" : "fail",
        detailAr: knownParking
          ? "يتوفر موقف خاص للشقة"
          : "لا يتوفر موقف خاص (شرط ملزم للمستخدم)",
      };
    }
  }

  return updated;
}

export function resolveComparison(
  assessments: PropertyAssessmentWithProperty[],
  requirements?: Partial<RequirementsRow> | null
): ComparisonResult {
  // 1. Eligibility: up to 5 properties from current run
  const pool = (assessments || []).slice(0, 5);

  // If < 2 properties: mode = 'insufficient' (standalone decision analysis for 1 property)
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

      const floorNo =
        resolved?.fields.floor_no.status === "known"
          ? Number(resolved.fields.floor_no.value)
          : p?.floor_no ?? null;

      const constraints = syncHardConstraintsWithFacts(
        item.constraint_results || [],
        resolved,
        requirements
      );
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
      const rawFitRating =
        (item.fit_rating as RankedItem["fit_rating"]) || "insufficient_evidence";
      const fitRating: RankedItem["fit_rating"] =
        fail > 0 && rawFitRating !== "insufficient_evidence" ? "weak" : rawFitRating;
      const visitPriority =
        (item.visit_priority as RankedItem["visit_priority"]) ||
        "insufficient_evidence";

      const prefEval = evaluatePreferencesImpact(requirements?.preferences, {
        title,
        district,
        notes: p?.notes,
        fitSummary: item.fit_summary,
        strengths: item.strengths || [],
        risks: item.risks || [],
        facts: rawFacts,
        resolved,
      });

      const axes = evaluateDecisionAxes({
        fitRating,
        constraints,
        strengths: item.strengths || [],
        risks: item.risks || [],
        keyUnknowns: item.key_unknowns || [],
        price,
        areaSqm: area,
        bedrooms,
        floorNo,
        district,
        pricePerSqm: item.price_per_sqm,
        poolMedianPpsqm: null,
        resolved,
        requirements,
      });

      const failedConstraint = constraints.find((c) => c.result === "fail");
      const unknownConstraints = constraints.filter((c) => c.result === "unknown");

      const mainAdvantage =
        item.strengths?.[0] ||
        (fail === 0 && pass > 0
          ? "مطابق للشروط الأساسية المتوفرة ضمن حدود الميزانية."
          : "تم تحليل المعطيات المتاحة في مواجهة ملف احتياجك.");

      const mainTradeoff =
        failedConstraint?.detailAr ||
        item.risks?.[0] ||
        axes.tradeoffs[0] ||
        "لا توجد مقايضات حرجة مسجلة بناءً على البيانات المتاحة.";

      const whatCouldChange =
        unknownConstraints.length > 0
          ? `التحقق الميداني من (${unknownConstraints.map((u) => u.labelAr).join("، ")}) لحسم مستوى الثقة في القرار.`
          : item.key_unknowns?.[0]
            ? `التأكد الميداني من: ${item.key_unknowns.slice(0, 2).join("، ")}.`
            : "استكمال المعاينة الميدانية أو إضافة شقق مرشحة أخرى للمقارنة.";

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
        fit_rating: fitRating,
        fit_summary: item.fit_summary,
        visit_priority: visitPriority,
        visit_priority_reason: item.visit_priority_reason,
        overall_confidence: axes.overall_confidence,
        confidence_label_ar: axes.confidence_label_ar,
        confidence_reason_ar: axes.confidence_reason_ar,
        daily_life: axes.daily_life,
        price_axis: axes.price_axis,
        affordability_axis: axes.affordability_axis,
        tradeoffs: axes.tradeoffs,
        constraint_summary: { pass, fail, unknown },
        constraints,
        main_advantage_ar: mainAdvantage,
        main_tradeoff_ar: mainTradeoff,
        what_could_change_rank_ar: whatCouldChange,
        ranking_reason_ar:
          fail === 0
            ? "تحليل منفرد: الشقة تحقق الشروط الملزمة المتوفرة في بياناتها."
            : `تحليل منفرد: الشقة تخالف شرطاً ملزماً (${failedConstraint?.labelAr || "أحد الشروط الأساسية"}).`,
        preferences_impact_ar: prefEval.impactAr,
        preference_match_count: prefEval.matchedLabels.length,
        preference_total_count: prefEval.totalCount,
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
    resolved: ReturnType<typeof resolveFacts> | null;
    property_id: string;
    assessment_id: string;
    title: string;
    district: string;
    floor_no: number | null;
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
    prefEval: PreferenceEvaluation;
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

    const floorNo =
      resolved?.fields.floor_no.status === "known"
        ? Number(resolved.fields.floor_no.value)
        : p?.floor_no ?? null;

    const constraints = syncHardConstraintsWithFacts(
      item.constraint_results || [],
      resolved,
      requirements
    );
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
    const rawFitRating =
      (item.fit_rating as RankedItem["fit_rating"]) || "insufficient_evidence";
    // Any failed hard constraint (e.g. missing required elevator or exceeding budget) downgrades fit_rating to weak
    const fit_rating: RankedItem["fit_rating"] =
      failCount > 0 && rawFitRating !== "insufficient_evidence"
        ? "weak"
        : rawFitRating;

    const prefEval = evaluatePreferencesImpact(requirements?.preferences, {
      title,
      district,
      notes: p?.notes,
      fitSummary: item.fit_summary,
      strengths: item.strengths || [],
      risks: item.risks || [],
      facts: rawFacts,
      resolved,
    });

    const computedPpsqm =
      item.price_per_sqm ??
      (price !== null && area !== null && area > 0
        ? Math.round(price / area)
        : null);

    return {
      raw: item,
      resolved,
      property_id: item.property_id,
      assessment_id: item.id,
      title,
      district,
      floor_no: floorNo,
      price,
      price_per_sqm: computedPpsqm,
      price_delta_budget: deltaBudget,
      area_sqm: area,
      bedrooms,
      fit_rating,
      fit_score: FIT_SCORES[fit_rating] || 1,
      visit_priority:
        failCount > 0 && item.visit_priority === "high"
          ? "low"
          : ((item.visit_priority as RankedItem["visit_priority"]) ||
            "insufficient_evidence"),
      constraints,
      passCount,
      failCount,
      unknownCount,
      hasUnknownCriticalConstraint,
      prefEval,
    };
  });

  // Compute pool median price_per_sqm for fair comparative price axis
  const validPoolPpsqm = candidates
    .map((c) => c.price_per_sqm)
    .filter((v): v is number => v !== null && v > 0)
    .sort((a, b) => a - b);
  const poolMedianPpsqm =
    validPoolPpsqm.length >= 2
      ? validPoolPpsqm[Math.floor(validPoolPpsqm.length / 2)]
      : null;

  // 3. Sorting
  // Rule A: Fewer failed hard constraints ALWAYS wins (an apartment missing a required elevator never beats a compliant one because of cheaper price)
  // Rule B: More verified passed hard constraints wins (verified compliance beats unverified/unknown hard constraints before price)
  // Rule C: Higher fit rating (strong > partial > weak > insufficient)
  // Rule D: Higher alignment with user's explicit preferences
  // Rule E: Price per sqm (lower is better value), then total price
  candidates.sort((a, b) => {
    // Rule A: Fewer failed hard constraints wins unconditionally
    if (a.failCount !== b.failCount) {
      return a.failCount - b.failCount;
    }

    // Rule B: More passed hard constraints wins (so verified elevator/constraints beat unknown ones regardless of price)
    if (a.passCount !== b.passCount) {
      return b.passCount - a.passCount;
    }

    // Rule C: Higher fit score wins
    if (a.fit_score !== b.fit_score) {
      return b.fit_score - a.fit_score;
    }

    // Rule D: Higher preference alignment wins
    if (a.prefEval.score !== b.prefEval.score) {
      return b.prefEval.score - a.prefEval.score;
    }

    // Rule E: Price per sqm
    if (a.price_per_sqm && b.price_per_sqm && a.price_per_sqm !== b.price_per_sqm) {
      return a.price_per_sqm - b.price_per_sqm;
    }

    // Rule F: Total price
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

  // 6. Build Narrative (Advantage, Tradeoff, What Could Change Rank, Ranking Reason, Preferences Impact) + 5 Decision Axes
  const rankedItems: RankedItem[] = candidates.map((c, index) => {
    const rank = index + 1;
    const others = candidates.filter((_, idx) => idx !== index);

    const axes = evaluateDecisionAxes({
      fitRating: c.fit_rating,
      constraints: c.constraints,
      strengths: c.raw.strengths || [],
      risks: c.raw.risks || [],
      keyUnknowns: c.raw.key_unknowns || [],
      price: c.price,
      areaSqm: c.area_sqm,
      bedrooms: c.bedrooms,
      floorNo: c.floor_no,
      district: c.district,
      pricePerSqm: c.price_per_sqm,
      poolMedianPpsqm,
      resolved: c.resolved,
      requirements,
    });

    // Compute main advantage vs others
    let mainAdvantage = "";
    if (c.failCount === 0 && others.some((o) => o.failCount > 0)) {
      mainAdvantage = "مطابق لجميع الشروط المحددة والميزانية دون أي مخالفات.";
    } else if (
      c.prefEval.matchedLabels.length > 0 &&
      others.some((o) => o.prefEval.score < c.prefEval.score)
    ) {
      mainAdvantage = `مطابق للشروط الملزمة ومتوافق مع تفضيلاتك (${c.prefEval.matchedLabels.join("، ")}).`;
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
      mainTradeoff = axes.tradeoffs[0] || "لا توجد تضحيات جوهرية مسجلة.";
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

    // Compute explicit reason for this apartment's rank (سبب ترتيب كل شقة)
    let rankingReasonAr = "";
    if (rank === 1) {
      const parts: string[] = [];
      if (c.failCount === 0) {
        parts.push(
          c.unknownCount === 0
            ? `تصدرت المركز #1 لأنها تحقق جميع شروطك الملزمة المؤكدة (${c.passCount} من ${c.constraints.length}) دون أي مخالفة`
            : `تصدرت المركز #1 مبدئياً لأنها الأعلى توافقاً مع شروطك دون مخالفات مسجلة`
        );
      } else {
        parts.push("تصدرت المركز #1 مبدئياً لأنها الأقل مخالفة لشروطك مقارنة ببقية الخيارات");
      }

      if (others.some((o) => o.failCount > c.failCount)) {
        const cheaperFailedOther = others.some(
          (o) => o.failCount > c.failCount && o.price && c.price && o.price < c.price
        );
        parts.push(
          cheaperFailedOther
            ? "وتقدمت على الشقق الأرخص التي خالفت شرطاً ملزماً (الشروط الملزمة تتقدم دائماً على السعر)"
            : "وتفوقت على الخيارات الأخرى التي خالفت أحد شروطك الملزمة"
        );
      } else if (others.some((o) => o.passCount < c.passCount)) {
        parts.push("مع اكتمال التحقق من شروطك الأساسية مقارنة بالخيارات غير المؤكدة");
      }

      if (c.prefEval.matchedLabels.length > 0) {
        parts.push(`وتتوافق مع تفضيلاتك (${c.prefEval.matchedLabels.join("، ")})`);
      } else if (
        c.price_per_sqm &&
        others.some((o) => o.failCount === c.failCount && o.price_per_sqm && c.price_per_sqm! < o.price_per_sqm)
      ) {
        parts.push(`وبأفضلية في قيمة المتر (${Math.round(c.price_per_sqm).toLocaleString("en-US")} ر.س/م²)`);
      }

      rankingReasonAr = `${parts.join("، ")}.`;
    } else {
      const failedLabels = c.constraints
        .filter((item) => item.result === "fail")
        .map((item) => item.labelAr)
        .join("، ");
      const unknownLabels = unknownConstraints.map((item) => item.labelAr).join("، ");
      const isCheaperThanTop =
        c.price !== null && topCandidate.price !== null && c.price < topCandidate.price;

      if (c.failCount > topCandidate.failCount) {
        rankingReasonAr = isCheaperThanTop
          ? `جاءت في المركز #${rank} لعدم تحقق شرط ملزم (${failedLabels || "شرط أساسي"}) رغم أن سعرها أقل من المتصدر — الشروط الملزمة تتقدم دائماً على رخص السعر.`
          : `جاءت في المركز #${rank} بسبب مخالفة شرط ملزم (${failedLabels || "شرط أساسي"})، بينما الشقة #1 تحقق شروطك الأساسية.`;
      } else if (c.passCount < topCandidate.passCount) {
        rankingReasonAr = isCheaperThanTop
          ? `جاءت في المركز #${rank} لأن شرط (${unknownLabels || "أحد الشروط الملزمة"}) غير مؤكد في بياناتها رغم انخفاض سعرها، فتقدمت عليها الشقة المؤكدة الشروط.`
          : `جاءت في المركز #${rank} لأن شرط (${unknownLabels || "أحد الشروط الملزمة"}) غير مؤكد بعد، بينما الشقة #1 مؤكدة الشروط.`;
      } else if (c.fit_score < topCandidate.fit_score) {
        rankingReasonAr = `جاءت في المركز #${rank} لأن درجة ملاءمتها الإجمالية أقل من الخيار المتصدر (#1).`;
      } else if (c.prefEval.score < topCandidate.prefEval.score) {
        rankingReasonAr = `جاءت في المركز #${rank} لأن الشقة #1 حققت توافقاً أعلى مع تفضيلاتك (${topCandidate.prefEval.matchedLabels.join("، ")}).`;
      } else if (
        c.price_per_sqm &&
        topCandidate.price_per_sqm &&
        c.price_per_sqm > topCandidate.price_per_sqm
      ) {
        rankingReasonAr = `جاءت في المركز #${rank} لأنها تحقق شروطك الملزمة، لكن الشقة #1 تفوقت عليها بقيمة أفضل لسعر المتر (${Math.round(topCandidate.price_per_sqm).toLocaleString("en-US")} مقابل ${Math.round(c.price_per_sqm).toLocaleString("en-US")} ر.س/م²).`;
      } else if (c.price && topCandidate.price && c.price > topCandidate.price) {
        rankingReasonAr = `جاءت في المركز #${rank} لأنها تحقق شروطك الملزمة، وتقدمت الشقة #1 عليها لانخفاض سعرها الإجمالي بفارق ${formatSAR(c.price - topCandidate.price)}.`;
      } else {
        rankingReasonAr = `جاءت في المركز #${rank} بتوافق متقارب جداً مع الخيار المتصدر، ويُحسم الفرق بالمعاينة الميدانية.`;
      }
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
      fit_summary: c.raw.fit_summary,
      visit_priority: c.visit_priority,
      visit_priority_reason: c.raw.visit_priority_reason,
      overall_confidence: axes.overall_confidence,
      confidence_label_ar: axes.confidence_label_ar,
      confidence_reason_ar: axes.confidence_reason_ar,
      daily_life: axes.daily_life,
      price_axis: axes.price_axis,
      affordability_axis: axes.affordability_axis,
      tradeoffs: axes.tradeoffs,
      constraint_summary: {
        pass: c.passCount,
        fail: c.failCount,
        unknown: c.unknownCount,
      },
      constraints: c.constraints,
      main_advantage_ar: mainAdvantage,
      main_tradeoff_ar: mainTradeoff,
      what_could_change_rank_ar: whatCouldChange,
      ranking_reason_ar: rankingReasonAr,
      preferences_impact_ar: c.prefEval.impactAr,
      preference_match_count: c.prefEval.matchedLabels.length,
      preference_total_count: c.prefEval.totalCount,
      strengths: c.raw.strengths || [],
      risks: c.raw.risks || [],
      key_unknowns: c.raw.key_unknowns || [],
    };
  });

  // 7. Populate score_vs_rank_note_ar when displayed percentages or cheaper prices could appear different from rank
  const poolScores = computePoolFitScores(rankedItems, budget);
  for (let i = 0; i < rankedItems.length; i++) {
    const item = rankedItems[i];
    const score = poolScores[i];
    const prevItem = i > 0 ? rankedItems[i - 1] : null;
    const prevScore = i > 0 ? poolScores[i - 1] : null;

    if (prevItem && prevScore !== null && score > prevScore) {
      item.score_vs_rank_note_ar = `توضيح الترتيب مقابل النسبة (${score}%): رغم ارتفاع النسبة الحسابية لهذه الشقة بسبب انخفاض سعرها، إلا أنها وُضعت في المركز #${item.rank} لأن أولوية الترتيب تشترط استيفاء الشروط الملزمة المؤكدة وتفضيلاتك قبل السعر.`;
    } else if (prevItem && prevScore !== null && score === prevScore) {
      item.score_vs_rank_note_ar = `توضيح الترتيب عند تساوي النسبة (${score}%): حُسم الترتيب بين الخيارين بناءً على أولوية الشروط المؤكدة ثم التفضيلات وسعر المتر المربع.`;
    } else if (
      i > 0 &&
      item.price !== null &&
      rankedItems[0].price !== null &&
      item.price < rankedItems[0].price &&
      (item.constraint_summary.fail > rankedItems[0].constraint_summary.fail ||
        item.constraint_summary.pass < rankedItems[0].constraint_summary.pass)
    ) {
      const missingOrFailed = item.constraints
        .filter((c) => c.result !== "pass")
        .map((c) => c.labelAr)
        .join("، ");
      item.score_vs_rank_note_ar = `لماذا لم تتقدم رغم أن سعرها أرخص؟ لأن الشقة #1 استوفت شروطك الملزمة (${missingOrFailed || "الشروط الأساسية"}) بينما هذه الشقة لم تستوفها — والشروط الملزمة لا يُتنازل عنها مقابل السعر.`;
    }
  }

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
