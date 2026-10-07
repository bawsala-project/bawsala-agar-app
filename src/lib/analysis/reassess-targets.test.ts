import { describe, it, expect } from "vitest";
import { resolveAffectedTargets } from "./reassess-targets";
import type { InspectionItemRow, InspectionFindingRow } from "@/actions/inspection";

describe("reassess-targets - resolveAffectedTargets (pure function)", () => {
  it("gathers affected axes from problem and good findings, while ignoring not_checked", () => {
    const item1: InspectionItemRow = {
      id: "item-1",
      property_id: "prop-1",
      category: "building_services",
      question_ar: "فحص المصعد",
      why_it_matters_ar: "الأمان",
      how_to_check_ar: "الفحص",
      priority: "high",
      trigger_reason: "unknown_fact",
      affected_assessment_types: ["fit", "daily_life"],
      created_at: new Date().toISOString(),
    };

    const item2: InspectionItemRow = {
      id: "item-2",
      property_id: "prop-1",
      category: "unit_specs",
      question_ar: "فحص الصك",
      why_it_matters_ar: "السعر",
      how_to_check_ar: "الصك",
      priority: "high",
      trigger_reason: "conflict",
      affected_assessment_types: ["price"],
      created_at: new Date().toISOString(),
    };

    const item3: InspectionItemRow = {
      id: "item-3",
      property_id: "prop-1",
      category: "neighborhood",
      question_ar: "فحص الألياف",
      why_it_matters_ar: "الإنترنت",
      how_to_check_ar: "السؤال",
      priority: "low",
      trigger_reason: "unknown_fact",
      affected_assessment_types: ["daily_life"],
      created_at: new Date().toISOString(),
    };

    const finding1: InspectionFindingRow = {
      id: "f-1",
      inspection_item_id: "item-1",
      property_id: "prop-1",
      result: "problem",
      note: "معطل",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const finding2: InspectionFindingRow = {
      id: "f-2",
      inspection_item_id: "item-2",
      property_id: "prop-1",
      result: "good",
      note: "مطابق",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const finding3: InspectionFindingRow = {
      id: "f-3",
      inspection_item_id: "item-3",
      property_id: "prop-1",
      result: "not_checked",
      note: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = resolveAffectedTargets([
      { item: item1, finding: finding1 },
      { item: item2, finding: finding2 },
      { item: item3, finding: finding3 },
    ]);

    expect(result.hasActionableFindings).toBe(true);
    expect(result.affectedAxes.has("fit")).toBe(true);
    expect(result.affectedAxes.has("daily_life")).toBe(true);
    expect(result.affectedAxes.has("price")).toBe(true);
    expect(result.actionableFindings.length).toBe(2); // item3 was not_checked, so ignored!
    expect(result.newRisks.length).toBe(1);
    expect(result.resolvedIssues.length).toBe(1);
  });
});
