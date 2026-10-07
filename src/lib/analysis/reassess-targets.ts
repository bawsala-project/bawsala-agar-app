import type { InspectionItemRow, InspectionFindingRow } from "@/actions/inspection";

export interface ItemWithFinding {
  item: InspectionItemRow;
  finding?: InspectionFindingRow | null;
}

export interface AffectedTargetsResult {
  hasActionableFindings: boolean;
  affectedAxes: Set<string>;
  resolvedIssues: string[];
  newRisks: string[];
  actionableFindings: Array<{
    item: InspectionItemRow;
    finding: InspectionFindingRow;
  }>;
}

/**
 * Pure target resolver gathering affected assessment axes from items with findings.
 * - Collects affected_assessment_types from items where finding.result is 'good' or 'problem'.
 * - Items with 'not_checked' (or no finding) do not trigger axis invalidation.
 * - Collects new problems into newRisks and confirmed items into resolvedIssues.
 */
export function resolveAffectedTargets(
  itemsWithFindings: ItemWithFinding[]
): AffectedTargetsResult {
  const affectedAxes = new Set<string>();
  const resolvedIssues: string[] = [];
  const newRisks: string[] = [];
  const actionableFindings: Array<{
    item: InspectionItemRow;
    finding: InspectionFindingRow;
  }> = [];

  for (const entry of itemsWithFindings) {
    const { item, finding } = entry;
    if (!finding) continue;

    // Items marked not_checked do NOT trigger axis invalidation
    if (finding.result === "not_checked") continue;

    if (finding.result === "problem") {
      actionableFindings.push({ item, finding });

      // Add affected axes
      for (const axis of item.affected_assessment_types || []) {
        affectedAxes.add(axis);
      }

      // Collect new problem description
      const riskDesc = finding.note && finding.note.trim()
        ? `${item.question_ar}: ${finding.note.trim()}`
        : `${item.question_ar} (${item.why_it_matters_ar})`;

      newRisks.push(riskDesc);
    } else if (finding.result === "good") {
      actionableFindings.push({ item, finding });

      // Add affected axes
      for (const axis of item.affected_assessment_types || []) {
        affectedAxes.add(axis);
      }

      // Collect confirmed issue description
      const issueDesc = finding.note && finding.note.trim()
        ? `${item.question_ar} - تم التحقق: ${finding.note.trim()}`
        : `${item.question_ar} (تم التحقق وسليم)`;

      resolvedIssues.push(issueDesc);
    }
  }

  return {
    hasActionableFindings: actionableFindings.length > 0,
    affectedAxes,
    resolvedIssues,
    newRisks,
    actionableFindings,
  };
}
