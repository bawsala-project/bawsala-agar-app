import type { ConstraintResult, RequirementsRow } from "@/lib/analysis/constraints";
import type { AffectedTargetsResult } from "./reassess-targets";

export type FitRating = "strong" | "partial" | "weak" | "insufficient_evidence";
export type VisitPriority = "high" | "medium" | "low" | "insufficient_evidence";

export interface ReassessInputAssessment {
  id?: string;
  property_id?: string;
  fit_rating: FitRating;
  fit_summary: string;
  strengths: string[];
  risks: string[];
  key_unknowns: string[];
  visit_priority: VisitPriority;
  visit_priority_reason: string;
  evidence_fields: string[];
  constraint_results: ConstraintResult[];
  price_per_sqm: number | null;
}

export interface ReassessmentDiff {
  previousFitRating: FitRating;
  newFitRating: FitRating;
  previousVisitPriority: VisitPriority;
  newVisitPriority: VisitPriority;
  addedRisks: string[];
  resolvedUnknowns: string[];
  explanationAr: string;
}

export interface ReassessmentOutputAssessment {
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
}

export interface ReassessmentResult {
  assessment: ReassessmentOutputAssessment;
  diff: ReassessmentDiff;
}

export interface PropertyFloorInput {
  floor_no?: number | null;
  [key: string]: unknown;
}

/**
 * Pure Reassessment Engine:
 * Re-evaluates ONLY the axes affected by on-site findings.
 * Preserves unaffected analyses (e.g. price per sqm, untouched constraints) verbatim.
 */
export function reassessProperty(
  previousAssessment: ReassessInputAssessment,
  targetFindings: AffectedTargetsResult,
  property: PropertyFloorInput,
  requirements?: Partial<RequirementsRow> | null
): ReassessmentResult {
  // 1. Deep clone previous arrays
  const newConstraints: ConstraintResult[] = (previousAssessment.constraint_results || []).map(
    (c) => ({ ...c })
  );
  const newRisks: string[] = [...(previousAssessment.risks || [])];
  const newStrengths: string[] = [...(previousAssessment.strengths || [])];
  let newKeyUnknowns: string[] = [...(previousAssessment.key_unknowns || [])];

  const addedRisks: string[] = [];
  const resolvedUnknowns: string[] = [];
  let hardConstraintFailed = false;

  const floorNo = typeof property.floor_no === "number" ? property.floor_no : null;

  // Helper to remove keyword matches from unknowns
  function removeFromUnknowns(keyword: string) {
    newKeyUnknowns = newKeyUnknowns.filter((item) => !item.includes(keyword));
  }

  // Helper to get or insert a constraint
  function ensureConstraint(
    key: string,
    labelAr: string
  ): ConstraintResult {
    let c = newConstraints.find((item) => item.key === key);
    if (!c) {
      c = { key, labelAr, result: "unknown", detailAr: "" };
      newConstraints.push(c);
    }
    return c;
  }

  // 2. Process actionable on-site findings
  for (const { item, finding } of targetFindings.actionableFindings) {
    const isElevator =
      item.category === "building_services" &&
      (item.how_to_check_ar.includes("المصعد") || item.question_ar.includes("المصعد"));

    const isParking =
      item.category === "parking_access" &&
      (item.how_to_check_ar.includes("الموقف") || item.question_ar.includes("موقف"));

    const isNewBuilding =
      item.category === "building_services" &&
      (item.how_to_check_ar.includes("إتمام البناء") || item.question_ar.includes("إتمام البناء"));

    const isDeedArea =
      item.category === "unit_specs" &&
      (item.how_to_check_ar.includes("الصك") || item.question_ar.includes("الصك"));

    // --- CASE A: ELEVATOR ---
    if (isElevator) {
      const elevConstraint = ensureConstraint("elevator_required", "مصعد بالعمارة");
      if (finding.result === "problem") {
        elevConstraint.result = "fail";
        elevConstraint.detailAr = finding.note?.trim()
          ? `عطل أو مشكلة بالمصعد تم رصدها ميدانياً: ${finding.note.trim()}`
          : "تم رصد تعطل أو عدم توفر المصعد أثناء المعاينة الميدانية";

        hardConstraintFailed = true;

        const riskDesc = finding.note?.trim()
          ? `المصعد معطل أو به مشكلة تشغيل: ${finding.note.trim()}`
          : `عدم توفر مصعد يعمل بكفاءة في العقار (الدور ${floorNo ?? "المرتفع"})`;

        if (!newRisks.includes(riskDesc)) {
          newRisks.push(riskDesc);
        }
        addedRisks.push(riskDesc);
        removeFromUnknowns("مصعد");
      } else if (finding.result === "good") {
        elevConstraint.result = "pass";
        elevConstraint.detailAr = finding.note?.trim()
          ? `تم التأكد ميدانياً من كفاءة المصعد: ${finding.note.trim()}`
          : "تم التحقق ميدانياً من توفر المصعد وعمله بكفاءة";

        removeFromUnknowns("مصعد");
        const issueLabel = "التحقق من توفر وعمل المصعد بكفاءة";
        resolvedUnknowns.push(issueLabel);
        newStrengths.push("تم التأكد ميدانياً من كفاءة عمل المصعد وتوفر الصيانة الدورية");
      }
      continue;
    }

    // --- CASE B: PARKING ---
    if (isParking) {
      const parkConstraint = ensureConstraint("private_parking", "موقف خاص للسيارة");
      if (finding.result === "problem") {
        parkConstraint.result = "fail";
        parkConstraint.detailAr = finding.note?.trim()
          ? `مشكلة في الموقف: ${finding.note.trim()}`
          : "عدم توفر موقف خاص مخصص للوحدة أو تعذر الدخول";

        hardConstraintFailed = true;

        const riskDesc = finding.note?.trim()
          ? `مشكلة موقف سيارة مرصودة ميدانياً: ${finding.note.trim()}`
          : "عدم توفر موقف سيارة خاص مطابق أو وجود صعوبة حادة في استخدامه";

        if (!newRisks.includes(riskDesc)) {
          newRisks.push(riskDesc);
        }
        addedRisks.push(riskDesc);
        removeFromUnknowns("موقف");
      } else if (finding.result === "good") {
        parkConstraint.result = "pass";
        parkConstraint.detailAr = finding.note?.trim()
          ? `تم التأكد ميدانياً: ${finding.note.trim()}`
          : "تم التحقق ميدانياً من توفر موقف سيارة خاص ومسجل";

        removeFromUnknowns("موقف");
        const issueLabel = "التحقق من توفر موقف سيارة خاص ومسجل";
        resolvedUnknowns.push(issueLabel);
        newStrengths.push("توفر موقف سيارة خاص مطابق ومؤكد ميدانياً");
      }
      continue;
    }

    // --- CASE C: NEW BUILDING ONLY ---
    const hardConstraints = Array.isArray(requirements?.hard_constraints)
      ? (requirements.hard_constraints as Array<{ key?: string } | string>)
      : [];
    const hasNewBuildingConstraint = hardConstraints.some((c) =>
      typeof c === "string" ? c === "new_building_only" : c?.key === "new_building_only"
    );

    if (isNewBuilding && hasNewBuildingConstraint) {
      const nbConstraint = ensureConstraint("new_building_only", "مبنى جديد");
      if (finding.result === "problem") {
        nbConstraint.result = "fail";
        nbConstraint.detailAr = finding.note?.trim() || "المبنى غير حديث أو لا توجد شهادة إشغال معتمدة";
        hardConstraintFailed = true;

        const riskDesc = finding.note?.trim()
          ? `عمر المبنى: ${finding.note.trim()}`
          : "المبنى غير حديث ولا توجد شهادة إتمام بناء سارية";

        if (!newRisks.includes(riskDesc)) {
          newRisks.push(riskDesc);
        }
        addedRisks.push(riskDesc);
        removeFromUnknowns("عمر العقار");
      } else if (finding.result === "good") {
        nbConstraint.result = "pass";
        nbConstraint.detailAr = finding.note?.trim() || "تم التأكد من حداثة المبنى وشهادة الإشغال";
        removeFromUnknowns("عمر العقار");
        resolvedUnknowns.push("التحقق من حداثة المبنى وشهادة الإشغال");
      }
      continue;
    }

    // --- CASE D: DEED / AREA CHECK ---
    if (isDeedArea) {
      if (finding.result === "problem") {
        const riskDesc = finding.note?.trim()
          ? `تعارض مساحة الصك ميدانياً: ${finding.note.trim()}`
          : "اختلاف المساحة المعتمدة بالصك والمخطط عن المعروض في الإعلان";

        if (!newRisks.includes(riskDesc)) {
          newRisks.push(riskDesc);
        }
        addedRisks.push(riskDesc);
      } else if (finding.result === "good") {
        removeFromUnknowns("المساحة");
        resolvedUnknowns.push("مطابقة مساحة الصك المعتمد مع المخطط");
      }
      continue;
    }

    // --- CASE E: OTHER GENERAL FINDINGS ---
    if (finding.result === "problem") {
      const riskDesc = finding.note?.trim()
        ? `${item.question_ar}: ${finding.note.trim()}`
        : `${item.question_ar} (${item.why_it_matters_ar})`;

      if (!newRisks.includes(riskDesc)) {
        newRisks.push(riskDesc);
      }
      addedRisks.push(riskDesc);
    } else if (finding.result === "good") {
      removeFromUnknowns(item.question_ar);
      resolvedUnknowns.push(item.question_ar);
    }
  }

  // 3. Determine new Fit Rating
  let newFitRating: FitRating =
    (previousAssessment.fit_rating as FitRating) || "insufficient_evidence";

  const hasAnyFailedConstraint =
    hardConstraintFailed || newConstraints.some((c) => c.result === "fail");

  if (hasAnyFailedConstraint) {
    // Hard constraint failed -> always drop fit rating to 'weak'
    newFitRating = "weak";
  } else {
    // If no constraints failed
    const hasUnknownConstraints = newConstraints.some((c) => c.result === "unknown");
    if (!hasUnknownConstraints && newKeyUnknowns.length === 0) {
      // All constraints pass and unknowns cleared
      newFitRating = "strong";
    } else if (previousAssessment.fit_rating === "weak" && !hasAnyFailedConstraint) {
      // If was weak because of a previously failing/unknown constraint that now passed
      newFitRating = hasUnknownConstraints ? "partial" : "strong";
    }
  }

  // 4. Determine new Visit Priority
  let newVisitPriority: VisitPriority =
    (previousAssessment.visit_priority as VisitPriority) || "insufficient_evidence";
  let newVisitPriorityReason = previousAssessment.visit_priority_reason;

  if (newFitRating === "weak") {
    newVisitPriority = "low";
    newVisitPriorityReason = `تم تخفيض أولوية المعاينة إلى منخفضة بعد الزيارة الميدانية نظراً لمخالفة اشتراطات أساسية (${addedRisks[0] || "مخالفة شرط جوهري"}).`;
  } else if (newFitRating === "strong") {
    newVisitPriority = "high";
    newVisitPriorityReason =
      "أولوية المعاينة مرتفعة ومكتملة؛ تم التحقق ميدانياً من سلامة كافة الشروط والمرافق الأساسية.";
  } else if (newFitRating === "partial") {
    newVisitPriority = "medium";
    newVisitPriorityReason =
      "أولوية متوسطة؛ تم التحقق من بعض البنود الميدانية مع بقاء ملاحظات أخرى تتطلب المتابعة.";
  }

  // 5. Generate structured explanation in concise Arabic
  let explanationAr = "";
  if (previousAssessment.fit_rating !== newFitRating) {
    if (newFitRating === "weak") {
      explanationAr = `تغير التوافق من (${translateRating(previousAssessment.fit_rating)}) إلى (توافق ضعيف) بسبب مخالفة شرط جوهري أثناء المعاينة (${addedRisks[0] || "عطل أو مشكلة أساسية"}).`;
    } else if (newFitRating === "strong") {
      explanationAr = `ارتفع التوافق من (${translateRating(previousAssessment.fit_rating)}) إلى (توافق قوي) بعد تأكيد سلامة البنود المفحوصة ميدانياً (${resolvedUnknowns.slice(0, 2).join("، ")}).`;
    } else {
      explanationAr = `تغير التوافق من (${translateRating(previousAssessment.fit_rating)}) إلى (${translateRating(newFitRating)}) بعد مراجعة شواهد الزيارة الميدانية.`;
    }
  } else if (addedRisks.length > 0) {
    explanationAr = `تم رصد وتوثيق ${addedRisks.length} مخاطر وملاحظات ميدانية إضافية مع استقرار التوافق العام عند (${translateRating(newFitRating)}).`;
  } else if (resolvedUnknowns.length > 0) {
    explanationAr = `تم حسم وتأكيد ${resolvedUnknowns.length} نقاط كانت غير مؤكدة مع استقرار التوافق العام عند (${translateRating(newFitRating)}).`;
  } else {
    explanationAr = "لم تسفر نتائج المعاينة عن تغييرات جوهرية في محاور التقييم السابقة.";
  }

  // 6. Updated fit summary
  const fitSummaryUpdate = addedRisks.length > 0
    ? `${previousAssessment.fit_summary} [تحديث المعاينة الميدانية: تم رصد ملاحظات أثرت على التقييم: ${addedRisks[0]}].`
    : resolvedUnknowns.length > 0
      ? `${previousAssessment.fit_summary} [تحديث المعاينة الميدانية: تم تأكيد سلامة النقاط غير المؤكدة ميدانياً].`
      : previousAssessment.fit_summary;

  const diff: ReassessmentDiff = {
    previousFitRating: previousAssessment.fit_rating,
    newFitRating,
    previousVisitPriority: previousAssessment.visit_priority,
    newVisitPriority,
    addedRisks,
    resolvedUnknowns,
    explanationAr,
  };

  const outputAssessment: ReassessmentOutputAssessment = {
    fit_rating: newFitRating,
    fit_summary: fitSummaryUpdate,
    strengths: newStrengths,
    risks: newRisks,
    key_unknowns: newKeyUnknowns,
    visit_priority: newVisitPriority,
    visit_priority_reason: newVisitPriorityReason,
    evidence_fields: previousAssessment.evidence_fields || [],
    constraint_results: newConstraints,
    // Unaffected axes preserved verbatim
    price_per_sqm: previousAssessment.price_per_sqm,
  };

  return {
    assessment: outputAssessment,
    diff,
  };
}

function translateRating(rating: string): string {
  switch (rating) {
    case "strong":
      return "توافق قوي";
    case "partial":
      return "توافق جزئي";
    case "weak":
      return "توافق ضعيف";
    case "insufficient_evidence":
      return "بيانات غير كافية";
    default:
      return rating;
  }
}
