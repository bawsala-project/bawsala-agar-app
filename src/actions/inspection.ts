"use server";

import { revalidatePath } from "next/cache";
import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { resolveFacts, type PropertyFact } from "@/lib/evidence/resolve";
import { evaluateConstraints } from "@/lib/analysis/constraints";
import {
  generateInspectionCandidates,
  type InspectionCandidateItem,
} from "@/lib/inspection/generate-items";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type InspectionItemRow = Database["public"]["Tables"]["inspection_items"]["Row"];
export type InspectionFindingRow = Database["public"]["Tables"]["inspection_findings"]["Row"];
export type FindingResult = "good" | "problem" | "not_checked";

export interface SaveFindingResult {
  success: boolean;
  findingId?: string;
  error?: string;
}

/**
 * Checks if inspection items already exist for this property in DB.
 * If yes, returns them.
 * If not, loads property and facts, generates 5–12 candidates,
 * inserts them via admin client (RLS is SELECT-only), and returns them.
 */
export async function getOrGenerateInspectionItems(
  caseId: string,
  propertyId: string,
  clientOverride?: SupabaseClient<Database>
): Promise<InspectionItemRow[]> {
  // 1. Authenticate & verify case ownership
  await requireCase(caseId, clientOverride);

  const supabase = clientOverride ?? createClient();

  // 2. Check if items already exist for this property
  const { data: existing, error: selectErr } = await supabase
    .from("inspection_items")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: true });

  if (!selectErr && existing && existing.length > 0) {
    return existing;
  }

  // 3. Load property with its facts
  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select(`
      *,
      property_facts (*)
    `)
    .eq("id", propertyId)
    .eq("case_id", caseId)
    .single();

  if (propErr || !property) {
    throw new Error("العقار غير موجود أو لا ينتمي لهذه الحالة");
  }

  // 4. Load requirements for the case
  const { data: requirements } = await supabase
    .from("requirements")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();

  // 5. Resolve facts
  const resolved = resolveFacts((property.property_facts as PropertyFact[]) || []);

  // 6. Evaluate constraints
  const constraints = requirements ? evaluateConstraints(requirements, resolved) : [];

  // 7. Generate targeted candidates (5–12 items)
  const candidates: InspectionCandidateItem[] = generateInspectionCandidates(
    property,
    resolved.fields,
    constraints
  );

  // 8. Insert candidates via admin client (due to SELECT-only owner RLS)
  const rowsToInsert = candidates.map((c) => ({
    property_id: propertyId,
    category: c.category,
    question_ar: c.question_ar,
    why_it_matters_ar: c.why_it_matters_ar,
    how_to_check_ar: c.how_to_check_ar,
    priority: c.priority,
    trigger_reason: c.trigger_reason,
    affected_assessment_types: c.affected_assessment_types,
  }));

  const { data: inserted, error: insertErr } = await adminSupabase
    .from("inspection_items")
    .insert(rowsToInsert)
    .select("*");

  if (insertErr) {
    // If concurrent insert occurred or conflict, re-fetch existing items
    const { data: fallbackItems } = await adminSupabase
      .from("inspection_items")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: true });

    if (fallbackItems && fallbackItems.length > 0) {
      return fallbackItems;
    }

    throw new Error(`تعذر حفظ بنود المعاينة الميدانية: ${insertErr.message}`);
  }

  return inserted || [];
}

/**
 * Retrieves existing inspection findings for a property.
 */
export async function getInspectionFindings(
  caseId: string,
  propertyId: string,
  clientOverride?: SupabaseClient<Database>
): Promise<InspectionFindingRow[]> {
  await requireCase(caseId, clientOverride);
  const supabase = clientOverride ?? createClient();
  const { data: findings } = await supabase
    .from("inspection_findings")
    .select("*")
    .eq("property_id", propertyId);
  return findings || [];
}

/**
 * Server action to save or update an on-site finding for a checklist item.
 * - Enforces case ownership via requireCase()
 * - Trims optional note to max 300 characters
 * - Upserts into inspection_findings via admin client (RLS is SELECT-only)
 * - Atomically increments decision_cases.state_version via Postgres trigger
 * - Returns { success: true, findingId: string }
 */
export async function saveFindingAction(
  caseId: string,
  propertyId: string,
  itemId: string,
  result: FindingResult,
  note?: string | null,
  clientOverride?: SupabaseClient<Database>
): Promise<SaveFindingResult> {
  // 1. Verify case ownership via RLS
  await requireCase(caseId, clientOverride);

  // 2. Validate finding result enum
  if (result !== "good" && result !== "problem" && result !== "not_checked") {
    return { success: false, error: "قيمة الفحص غير صالحة" };
  }

  // 3. Trim and sanitize optional note (max 300 characters)
  const trimmedNote = typeof note === "string" ? note.trim().slice(0, 300) : null;

  // 4. Verify property and item belong to this case
  const supabase = clientOverride ?? createClient();
  const { data: item, error: itemErr } = await supabase
    .from("inspection_items")
    .select("id, property_id")
    .eq("id", itemId)
    .single();

  if (itemErr || !item || item.property_id !== propertyId) {
    return { success: false, error: "بند الفحص غير موجود أو لا ينتمي لهذا العقار" };
  }

  // 5. Upsert finding via admin client (unique on inspection_item_id)
  const now = new Date().toISOString();
  const { data: finding, error: upsertErr } = await adminSupabase
    .from("inspection_findings")
    .upsert(
      {
        inspection_item_id: itemId,
        property_id: propertyId,
        result,
        note: trimmedNote,
        updated_at: now,
      },
      { onConflict: "inspection_item_id" }
    )
    .select("id")
    .single();

  if (upsertErr || !finding) {
    return {
      success: false,
      error: upsertErr?.message || "تعذر حفظ نتيجة الفحص الميداني",
    };
  }

  try {
    revalidatePath(`/case/${caseId}/inspection`);
  } catch {
    // Ignore in non-request contexts like unit tests
  }

  return {
    success: true,
    findingId: finding.id,
  };
}
