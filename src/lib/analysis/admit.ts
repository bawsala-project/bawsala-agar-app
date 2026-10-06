import type { ModelPropertyAssessment } from "@/lib/ai/prompts/analysis";
import type { ConstraintResult } from "./constraints";

export interface AdmittedPropertyAssessment {
  property_id: string;
  constraint_results: ConstraintResult[];
  price_per_sqm: number | null;
  fit_rating: "strong" | "partial" | "weak" | "insufficient_evidence";
  fit_summary: string;
  strengths: string[];
  risks: string[];
  key_unknowns: string[];
  visit_priority: "high" | "medium" | "low" | "insufficient_evidence";
  visit_priority_reason: string;
  evidence_fields: string[];
}

export type AdmissionResult =
  | { ok: true; assessment: AdmittedPropertyAssessment }
  | { ok: false; reason: string };

export function admitPropertyAssessment(input: {
  propertyId: string;
  modelOutput: ModelPropertyAssessment;
  knownFactFields: string[];
  constraintResults: ConstraintResult[];
  pricePerSqm: number | null;
  criticalFieldsKnownCount: number;
}): AdmissionResult {
  const { modelOutput, knownFactFields, constraintResults, pricePerSqm, criticalFieldsKnownCount } = input;

  // 1. Evidence fields grounding check: every cited field must be in knownFactFields
  const knownSet = new Set(knownFactFields);
  for (const field of modelOutput.evidence_fields) {
    if (!knownSet.has(field)) {
      return {
        ok: false,
        reason: `Ungrounded evidence field cited: "${field}" was not in known facts`,
      };
    }
  }

  // 2. Text limits & emptiness checks
  const summary = modelOutput.fit_summary?.trim() || "";
  if (!summary || summary.length > 400) {
    return {
      ok: false,
      reason: `fit_summary is empty or exceeds 400 characters (length: ${summary.length})`,
    };
  }

  const priorityReason = modelOutput.visit_priority_reason?.trim() || "";
  if (!priorityReason || priorityReason.length > 400) {
    return {
      ok: false,
      reason: `visit_priority_reason is empty or exceeds 400 characters (length: ${priorityReason.length})`,
    };
  }

  // List validation helper
  const validateList = (list: string[], name: string): string | null => {
    if (!Array.isArray(list)) return `${name} must be an array`;
    if (list.length > 5) return `${name} exceeds 5 items (count: ${list.length})`;
    for (let i = 0; i < list.length; i++) {
      const item = list[i]?.trim() || "";
      if (!item) return `${name} item ${i + 1} is empty`;
      if (item.length > 200) return `${name} item ${i + 1} exceeds 200 characters (length: ${item.length})`;
    }
    return null;
  };

  const strengthsErr = validateList(modelOutput.strengths, "strengths");
  if (strengthsErr) return { ok: false, reason: strengthsErr };

  const risksErr = validateList(modelOutput.risks, "risks");
  if (risksErr) return { ok: false, reason: risksErr };

  const unknownsErr = validateList(modelOutput.key_unknowns, "key_unknowns");
  if (unknownsErr) return { ok: false, reason: unknownsErr };

  // 3. Deterministic Overrides
  let fitRating = modelOutput.fit_rating;
  let visitPriority = modelOutput.visit_priority;

  // Override A: Any constraint 'fail' -> fit_rating = 'weak', and visit_priority cannot be 'high'
  const hasFailConstraint = constraintResults.some((c) => c.result === "fail");
  if (hasFailConstraint) {
    fitRating = "weak";
    if (visitPriority === "high") {
      visitPriority = "medium";
    }
  }

  // Override B: Fewer than 2 critical fields known -> fit_rating and visit_priority = 'insufficient_evidence'
  if (criticalFieldsKnownCount < 2) {
    fitRating = "insufficient_evidence";
    visitPriority = "insufficient_evidence";
  }

  // Deduplicate and filter evidence_fields
  const cleanEvidenceFields = Array.from(new Set(modelOutput.evidence_fields));

  return {
    ok: true,
    assessment: {
      property_id: input.propertyId,
      constraint_results: constraintResults, // Always from code, ignoring any model output
      price_per_sqm: pricePerSqm, // Always from code, ignoring any model output
      fit_rating: fitRating,
      fit_summary: summary,
      strengths: modelOutput.strengths.map((s) => s.trim()),
      risks: modelOutput.risks.map((r) => r.trim()),
      key_unknowns: modelOutput.key_unknowns.map((u) => u.trim()),
      visit_priority: visitPriority,
      visit_priority_reason: priorityReason,
      evidence_fields: cleanEvidenceFields,
    },
  };
}
