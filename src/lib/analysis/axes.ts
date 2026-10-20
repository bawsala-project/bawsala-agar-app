import type { ConstraintResult, RequirementsRow } from "./constraints";
import type { ResolveFactsResult } from "@/lib/evidence/resolve";

export type ConfidenceLevel = "high" | "medium" | "low";

export type DailyLifeStatus =
  | "favorable"
  | "moderate"
  | "challenging"
  | "insufficient_evidence";

export interface DailyLifeAxis {
  status: DailyLifeStatus;
  status_label_ar: string;
  label_ar: string;
  summary_ar: string;
  positives: string[];
  burdens: string[];
  unknowns: string[];
}
export type DailyLifeAssessment = DailyLifeAxis;

export type PriceStatus =
  | "reasonable"
  | "above_expected"
  | "below_expected"
  | "insufficient_evidence";

export interface PriceAxis {
  status: PriceStatus;
  status_label_ar: string;
  label_ar: string;
  summary_ar: string;
  price_per_sqm: number | null;
  budget_delta_sar: number | null;
  explanation_ar: string;
  confidence: ConfidenceLevel;
}
export type FairPriceAssessment = PriceAxis;

export type AffordabilityStatus =
  | "comfortable"
  | "at_limit"
  | "exceeds_budget"
  | "disabled";

export interface AffordabilityAxis {
  enabled: boolean;
  status: AffordabilityStatus;
  status_label_ar: string;
  label_ar: string;
  summary_ar: string;
  purchase_method: "cash" | "mortgage" | null;
  purchase_method_label_ar: string;
  explanation_ar: string;
  assumptions_ar: string[];
}
export type AffordabilityAssessment = AffordabilityAxis;
export type TradeoffSummary = string[];

export interface DecisionAxesResult {
  overall_confidence: ConfidenceLevel;
  confidence_label_ar: string;
  confidence_reason_ar: string;
  daily_life: DailyLifeAxis;
  price_axis: PriceAxis;
  affordability_axis: AffordabilityAxis;
  tradeoffs: string[];
}

export function translateConfidenceAr(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return "ثقة عالية";
    case "medium":
      return "ثقة متوسطة";
    case "low":
      return "ثقة منخفضة";
  }
}

/**
 * Pure deterministic confidence calculator used across initial analysis,
 * comparison ranking, and post-visit reassessment.
 */
export function computeConfidenceLevel(input: {
  fitRating: string;
  constraintResults: ConstraintResult[];
  keyUnknownsCount: number;
  criticalKnownCount?: number;
}): {
  level: ConfidenceLevel;
  labelAr: string;
  reasonAr: string;
} {
  const { fitRating, constraintResults, keyUnknownsCount, criticalKnownCount } = input;
  const unknownConstraints = (constraintResults || []).filter(
    (c) => c.result === "unknown"
  );

  if (
    fitRating === "insufficient_evidence" ||
    (criticalKnownCount !== undefined && criticalKnownCount < 2) ||
    unknownConstraints.length >= 2 ||
    keyUnknownsCount >= 4
  ) {
    const missingNames = unknownConstraints.map((c) => c.labelAr).slice(0, 2);
    const reasonAr =
      fitRating === "insufficient_evidence" ||
      (criticalKnownCount !== undefined && criticalKnownCount < 2)
        ? "نقص في البيانات الأساسية للعقار (السعر أو المساحة أو عدد الغرف) يتطلب استكمالها قبل الجزم بالقرار."
        : missingNames.length > 0
          ? `وجود شروط أساسية غير مؤكدة (${missingNames.join("، ")}) قد تغيّر نتيجة القرار بعد المعاينة.`
          : `وجود ${keyUnknownsCount} معلومات ناقصة مؤثرة تحتاج إلى تحقق ميداني مباشر.`;
    return {
      level: "low",
      labelAr: translateConfidenceAr("low"),
      reasonAr,
    };
  }

  if (
    unknownConstraints.length === 0 &&
    keyUnknownsCount <= 1 &&
    (criticalKnownCount === undefined || criticalKnownCount >= 3)
  ) {
    return {
      level: "high",
      labelAr: translateConfidenceAr("high"),
      reasonAr:
        "البيانات الأساسية والشروط الجوهرية للمشتري واضحة ومؤكدة، مما يمنح درجة ثقة عالية في هذا التقييم.",
    };
  }

  const pendingLabel =
    unknownConstraints.length > 0
      ? `بانتظار التحقق الميداني من (${unknownConstraints[0].labelAr})`
      : keyUnknownsCount > 0
        ? `بانتظار التحقق من ${keyUnknownsCount} نقاط ميدانية أثناء الزيارة`
        : "معظم المعطيات الأساسية متوفرة مع بقاء تفاصيل ميدانية تكميلية";

  return {
    level: "medium",
    labelAr: translateConfidenceAr("medium"),
    reasonAr: `البيانات الأساسية متوفرة لتوجيه القرار، ${pendingLabel}.`,
  };
}

export interface EvaluateDecisionAxesInput {
  fitRating: string;
  constraints: ConstraintResult[];
  strengths: string[];
  risks: string[];
  keyUnknowns: string[];
  price: number | null;
  areaSqm: number | null;
  bedrooms: number | null;
  floorNo?: number | null;
  district?: string | null;
  pricePerSqm: number | null;
  poolMedianPpsqm?: number | null;
  resolved?: ResolveFactsResult | null;
  requirements?: Partial<RequirementsRow> | null;
}

/**
 * Evaluates all 5 v1.9 decision axes connecting the buyer's personal profile
 * to the candidate residential apartment.
 */
export function evaluateDecisionAxes(
  input: EvaluateDecisionAxesInput
): DecisionAxesResult {
  const {
    fitRating,
    constraints,
    strengths,
    risks,
    keyUnknowns,
    price,
    areaSqm,
    bedrooms,
    floorNo,
    district,
    pricePerSqm,
    poolMedianPpsqm,
    resolved,
    requirements,
  } = input;

  const criticalKnownCount = [
    price !== null && price > 0,
    areaSqm !== null && areaSqm > 0,
    bedrooms !== null && bedrooms > 0,
  ].filter(Boolean).length;

  // 1. Confidence Level
  const conf = computeConfidenceLevel({
    fitRating,
    constraintResults: constraints,
    keyUnknownsCount: keyUnknowns.length,
    criticalKnownCount,
  });

  // 2. Daily Life & Micro-Location Axis
  const dailyPositives: string[] = [];
  const dailyBurdens: string[] = [];
  const dailyUnknowns: string[] = [];

  const dailyLocConstraint = constraints.find((c) => c.key === "daily_location");
  const elevConstraint = constraints.find((c) => c.key === "elevator_required");
  const parkConstraint = constraints.find((c) => c.key === "private_parking");
  const maxFloorConstraint = constraints.find((c) => c.key === "max_floor");

  if (dailyLocConstraint) {
    if (dailyLocConstraint.result === "pass") {
      dailyPositives.push(dailyLocConstraint.detailAr);
    } else if (dailyLocConstraint.result === "fail") {
      dailyBurdens.push(dailyLocConstraint.detailAr);
    } else {
      dailyUnknowns.push(dailyLocConstraint.detailAr);
    }
  } else if (district && district.trim().length > 0) {
    dailyPositives.push(`موقع الشقة محدد في حي ${district.trim()}`);
  } else {
    dailyUnknowns.push("حي الشقة أو موقعها الدقيق غير محدد لتقييم سهولة التنقل اليومي");
  }

  // Floor & Elevator daily impact
  const resolvedElev =
    resolved?.fields.elevator.status === "known"
      ? Boolean(resolved.fields.elevator.value)
      : null;
  const resolvedFloor =
    floorNo ??
    (resolved?.fields.floor_no.status === "known"
      ? Number(resolved.fields.floor_no.value)
      : null);

  if (elevConstraint) {
    if (elevConstraint.result === "pass") {
      dailyPositives.push(elevConstraint.detailAr);
    } else if (elevConstraint.result === "fail") {
      dailyBurdens.push(elevConstraint.detailAr);
    } else {
      dailyUnknowns.push(elevConstraint.detailAr);
    }
  } else if (resolvedElev === true) {
    dailyPositives.push("يتوفر مصعد في المبنى يسهّل الحركة اليومية للأسرة");
  } else if (resolvedElev === false && resolvedFloor !== null && resolvedFloor >= 2) {
    dailyBurdens.push(`الشقة في الدور ${resolvedFloor} بدون مصعد مما يمثل عبئاً يومياً في الصعود ونقل الأغراض`);
  } else if (resolvedElev === null && (resolvedFloor === null || resolvedFloor >= 2)) {
    dailyUnknowns.push("يلزم التأكد ميدانياً من توفر مصعد يعمل بكفاءة في العمارة");
  }

  if (maxFloorConstraint?.result === "fail") {
    dailyBurdens.push(maxFloorConstraint.detailAr);
  }

  // Parking daily impact
  const resolvedParking =
    resolved?.fields.private_parking.status === "known"
      ? Boolean(resolved.fields.private_parking.value)
      : null;

  if (parkConstraint) {
    if (parkConstraint.result === "pass") {
      dailyPositives.push(parkConstraint.detailAr);
    } else if (parkConstraint.result === "fail") {
      dailyBurdens.push(parkConstraint.detailAr);
    } else {
      dailyUnknowns.push(parkConstraint.detailAr);
    }
  } else if (resolvedParking === true) {
    dailyPositives.push("يتوفر موقف سيارة خاص يقلل عناء البحث عن موقف يومياً");
  } else if (resolvedParking === false) {
    dailyBurdens.push("لا يتوفر موقف سيارة خاص مخصص للشقة");
  } else {
    dailyUnknowns.push("توفر موقف سيارة خاص ومستقل للشقة غير مؤكد في الإعلان");
  }

  // Household size vs bedrooms/bathrooms daily comfort
  const householdSize = requirements?.household_size
    ? Number(requirements.household_size)
    : null;
  if (householdSize && bedrooms !== null) {
    if (bedrooms >= Math.ceil(householdSize / 2) + 1) {
      dailyPositives.push(
        `عدد غرف النوم (${bedrooms}) يمنح خصوصية ومرونة يومية مريحة لأسرة من ${householdSize} أفراد`
      );
    } else if (bedrooms < (requirements?.min_bedrooms ?? 2)) {
      dailyBurdens.push(
        `عدد غرف النوم (${bedrooms}) أضيق من احتياج الأسرة اليومي (${householdSize} أفراد)`
      );
    }
  }

  let dailyStatus: DailyLifeStatus = "moderate";
  let dailyLabelAr = "مقبول مع نقاط تحتاج تحققاً";

  if (dailyBurdens.length > 0) {
    dailyStatus = "challenging";
    dailyLabelAr = "تحديات في الاستخدام اليومي";
  } else if (dailyPositives.length >= 2 && dailyUnknowns.length <= 1) {
    dailyStatus = "favorable";
    dailyLabelAr = "مناسب ومريح للحياة اليومية";
  } else if (dailyPositives.length === 0 && dailyUnknowns.length >= 2) {
    dailyStatus = "insufficient_evidence";
    dailyLabelAr = "يتطلب تحققاً ميدانياً من الموقع والمرافق";
  }

  const dailySummaryAr =
    dailyStatus === "challenging"
      ? `رُصدت عوائق تؤثر على راحة الاستخدام اليومي للأسرة (${dailyBurdens[0]}).`
      : dailyStatus === "favorable"
        ? `مقومات الحياة اليومية والوصول والمرافق متوافقة بشكل جيد مع نمط حياة الأسرة.`
        : dailyStatus === "insufficient_evidence"
          ? `تفاصيل الموقع الدقيق والمرافق اليومية (كالمصعد والموقف والمسار وقت الذروة) غير مكتملة وتتطلب معاينة ميدانية.`
          : `يتوفر جزء من مقومات الراحة اليومية مع بقاء (${dailyUnknowns[0] || "تفاصيل المرافق والوصول"}) بحاجة للتحقق عند الزيارة.`;

  // 3. Price Reasonableness Axis (v1.9 Section 10.3: reasonable | above_expected | below_expected | insufficient_evidence)
  const maxBudget = requirements?.max_budget_sar
    ? Number(requirements.max_budget_sar)
    : null;
  const budgetDeltaSar =
    price !== null && maxBudget !== null && maxBudget > 0 ? price - maxBudget : null;

  let priceStatus: PriceStatus = "insufficient_evidence";
  let priceLabelAr = "بيانات السعر أو المساحة غير كافية";
  let priceExplanationAr =
    "لا يمكن إصدار حكم دقيق على عدالة السعر لعدم اكتمال سعر العرض أو المساحة بالمتر المربع.";
  let priceConfidence: ConfidenceLevel = "low";

  if (price !== null && price > 0) {
    if (pricePerSqm !== null && pricePerSqm > 0) {
      priceConfidence = poolMedianPpsqm ? "high" : "medium";
      const overBudget = budgetDeltaSar !== null && budgetDeltaSar > 0;
      const ratioToMedian =
        poolMedianPpsqm && poolMedianPpsqm > 0
          ? pricePerSqm / poolMedianPpsqm
          : 1;

      if (overBudget || ratioToMedian > 1.12) {
        priceStatus = "above_expected";
        priceLabelAr = "أعلى من المتوقع للميزانية / البدائل";
        priceExplanationAr = overBudget
          ? `سعر العرض (${price.toLocaleString()} ر.س · ${pricePerSqm.toLocaleString()} ر.س/م²) يتجاوز سقف ميزانيتك بمقدار ${Math.abs(budgetDeltaSar!).toLocaleString()} ر.س.`
          : `سعر المتر (${pricePerSqm.toLocaleString()} ر.س/م²) مرتفع نسبياً مقارنة بمتوسط الشقق المرشحة في هذه الاستشارة (${Math.round(poolMedianPpsqm!).toLocaleString()} ر.س/م²).`;
      } else if (
        ratioToMedian < 0.9 ||
        (budgetDeltaSar !== null &&
          maxBudget !== null &&
          budgetDeltaSar <= -0.12 * maxBudget)
      ) {
        priceStatus = "below_expected";
        priceLabelAr = "سعر تنافسي مقارنة بالميزانية / البدائل";
        priceExplanationAr =
          budgetDeltaSar !== null && budgetDeltaSar < 0
            ? `سعر العرض (${price.toLocaleString()} ر.س · ${pricePerSqm.toLocaleString()} ر.س/م²) يمنح وفراً مالياً قدره ${Math.abs(budgetDeltaSar).toLocaleString()} ر.س تحت سقف ميزانيتك.`
            : `سعر المتر (${pricePerSqm.toLocaleString()} ر.س/م²) أقل من متوسط البدائل المرشحة في حالتك.`;
      } else {
        priceStatus = "reasonable";
        priceLabelAr = "سعر متوازن ضمن النطاق المتوقع";
        priceExplanationAr = `سعر العرض (${price.toLocaleString()} ر.س) وسعر المتر (${pricePerSqm.toLocaleString()} ر.س/م²) متسقان مع سقف ميزانيتك ومعطيات الشقة المتاحة.`;
      }
    } else {
      // Price known, area unknown -> insufficient_evidence for fair price per sqm
      priceStatus = "insufficient_evidence";
      priceConfidence = "low";
      priceLabelAr = "يتطلب معرفة المساحة لحساب سعر المتر";
      priceExplanationAr =
        budgetDeltaSar !== null
          ? budgetDeltaSar <= 0
            ? `السعر الإجمالي (${price.toLocaleString()} ر.س) ضمن ميزانيتك، لكن غياب المساحة المؤكدة يمنع حساب سعر المتر المربع وتقييم عدالة السعر.`
            : `السعر الإجمالي (${price.toLocaleString()} ر.س) يتجاوز ميزانيتك بـ ${Math.abs(budgetDeltaSar).toLocaleString()} ر.س مع غياب المساحة لحساب سعر المتر.`
          : `السعر الإجمالي (${price.toLocaleString()} ر.س) معروف لكن المساحة غير محددة لحساب سعر المتر.`;
    }
  }

  // 4. Buyer Affordability Axis (enabled ONLY when required inputs exist per v1.9 Section 2.1)
  const rawMethod = requirements?.purchase_method;
  const purchaseMethod: "cash" | "mortgage" | null =
    rawMethod === "cash"
      ? "cash"
      : rawMethod === "mortgage" || rawMethod === "finance"
        ? "mortgage"
        : null;
  const purchaseMethodLabelAr =
    purchaseMethod === "mortgage"
      ? "تمويل عقاري"
      : purchaseMethod === "cash"
        ? "شراء نقدي (كاش)"
        : "غير محدد";

  const affordabilityEnabled =
    price !== null &&
    price > 0 &&
    maxBudget !== null &&
    maxBudget > 0 &&
    purchaseMethod !== null;

  let affordabilityStatus: AffordabilityStatus = "disabled";
  let affordabilityLabelAr = "غير مفعّلة (نقص مدخلات السعر أو الميزانية)";
  let affordabilityExplanationAr =
    "تُفعّل دراسة القدرة المالية تلقائياً عند توفر سعر العقار والميزانية القصوى وطريقة الشراء.";
  const affordabilityAssumptions: string[] = [];

  if (affordabilityEnabled && price !== null && maxBudget !== null) {
    const delta = price - maxBudget;
    const utilization = price / maxBudget;

    if (delta > 0) {
      affordabilityStatus = "exceeds_budget";
      affordabilityLabelAr = "يتجاوز السقف المالي المحدد";
      affordabilityExplanationAr = `سعر الشقة يتجاوز ميزانيتك القصوى (${maxBudget.toLocaleString()} ر.س) بفارق ${delta.toLocaleString()} ر.س، مما يتطلب تفاوضاً سعرياً أو زيادة المخصص المالي.`;
    } else if (utilization >= 0.95) {
      affordabilityStatus = "at_limit";
      affordabilityLabelAr = "عند الحد الأعلى للميزانية";
      affordabilityExplanationAr = `سعر الشقة يستهلك ${Math.round(utilization * 100)}% من سقف ميزانيتك (الهامش المتبقي ${Math.abs(delta).toLocaleString()} ر.س)، لذا يلزم حساب رسوم التصرفات العقارية أو السعي والتأثيث بدقة.`;
    } else {
      affordabilityStatus = "comfortable";
      affordabilityLabelAr = "قدرة مالية مريحة ضمن الميزانية";
      affordabilityExplanationAr = `سعر الشقة يوفّر هامش أمان مالي قدره ${Math.abs(delta).toLocaleString()} ر.س تحت سقف ميزانيتك (${Math.round(utilization * 100)}% من الميزانية).`;
    }

    if (purchaseMethod === "mortgage") {
      affordabilityAssumptions.push(
        "بما أن طريقة الشراء (تمويل عقاري)، يعتمد إتمام الشراء على مطابقة تقييم البنك العقاري لسعر العرض وجهوزية الصك وشهادة إتمام البناء."
      );
      affordabilityAssumptions.push(
        "يُنصح بالتحقق من عدم وجود التزامات ائتمانية تؤثر على نسبة الاستقطاع الشهري."
      );
    } else {
      affordabilityAssumptions.push(
        "بما أن طريقة الشراء (نقدي / كاش)، يوصى بالاحتفاظ بهامش سيولة لتغطية السعي ومصاريف نقل الملكية والتجهيز."
      );
    }
  }

  // 5. Buyer Trade-offs (المقايضات بين المزايا والتنازلات)
  const tradeoffs: string[] = [];
  const failedConstraints = constraints.filter((c) => c.result === "fail");
  const unknownConstraints = constraints.filter((c) => c.result === "unknown");

  if (failedConstraints.length > 0 && strengths.length > 0) {
    tradeoffs.push(
      `مقايضة جوهرية: رغم توفر (${strengths[0]})، إلا أن الشقة تخالف شرطاً أساسياً لديك (${failedConstraints[0].labelAr}: ${failedConstraints[0].detailAr}).`
    );
  } else if (failedConstraints.length > 0) {
    tradeoffs.push(
      `تنازل مباشر عن شرط (${failedConstraints[0].labelAr}): ${failedConstraints[0].detailAr}.`
    );
  }

  if (
    budgetDeltaSar !== null &&
    budgetDeltaSar < 0 &&
    (unknownConstraints.length > 0 || keyUnknowns.length > 0)
  ) {
    tradeoffs.push(
      `مقايضة السعر مقابل عدم اليقين: توفر الشقة وفراً مالياً (${Math.abs(budgetDeltaSar).toLocaleString()} ر.س تحت الميزانية) مقابل الحاجة للتحقق الميداني من (${unknownConstraints[0]?.labelAr || keyUnknowns[0]}).`
    );
  }

  if (tradeoffs.length === 0) {
    if (risks.length > 0 && strengths.length > 0) {
      tradeoffs.push(`توازن بين (${strengths[0]}) مقابل ملاحظة (${risks[0]}).`);
    } else if (keyUnknowns.length > 0) {
      tradeoffs.push(
        `المعطيات المتوفرة إيجابية، ويبقى القرار النهائي مرهوناً بالتحقق من (${keyUnknowns[0]}) أثناء المعاينة.`
      );
    } else {
      tradeoffs.push(
        "لا توجد تنازلات حرجة مرصودة بناءً على البيانات المؤكدة حالياً."
      );
    }
  }

  return {
    overall_confidence: conf.level,
    confidence_label_ar: conf.labelAr,
    confidence_reason_ar: conf.reasonAr,
    daily_life: {
      status: dailyStatus,
      status_label_ar: dailyLabelAr,
      label_ar: dailyLabelAr,
      summary_ar: dailySummaryAr,
      positives: dailyPositives,
      burdens: dailyBurdens,
      unknowns: dailyUnknowns,
    },
    price_axis: {
      status: priceStatus,
      status_label_ar: priceLabelAr,
      label_ar: priceLabelAr,
      summary_ar: priceExplanationAr,
      price_per_sqm: pricePerSqm,
      budget_delta_sar: budgetDeltaSar,
      explanation_ar: priceExplanationAr,
      confidence: priceConfidence,
    },
    affordability_axis: {
      enabled: affordabilityEnabled,
      status: affordabilityStatus,
      status_label_ar: affordabilityLabelAr,
      label_ar: affordabilityLabelAr,
      summary_ar: affordabilityExplanationAr,
      purchase_method: purchaseMethod,
      purchase_method_label_ar: purchaseMethodLabelAr,
      explanation_ar: affordabilityExplanationAr,
      assumptions_ar: affordabilityAssumptions,
    },
    tradeoffs,
  };
}
