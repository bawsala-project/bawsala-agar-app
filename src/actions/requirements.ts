"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirementsSchema } from "@/lib/schemas/requirements";

export interface RequirementsFormState {
  errors?: Record<string, string[] | undefined>;
  message?: string;
}

export async function saveRequirements(
  caseId: string,
  prevStateOrPayload?: RequirementsFormState | FormData | Record<string, unknown>,
  maybePayload?: FormData | Record<string, unknown>
): Promise<RequirementsFormState> {
  const payload =
    maybePayload !== undefined ? maybePayload : prevStateOrPayload;

  if (!payload) {
    return {
      errors: {
        form: ["بيانات النموذج غير صالحة"],
      },
    };
  }

  let rawValues: Record<string, unknown> = {};

  if (payload instanceof FormData) {
    const parseJsonField = (key: string) => {
      const raw = payload.get(key);
      if (!raw || typeof raw !== "string") return [];
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    };

    rawValues = {
      max_budget_sar: payload.get("max_budget_sar"),
      purchase_method: payload.get("purchase_method"),
      household_size: payload.get("household_size"),
      min_bedrooms: payload.get("min_bedrooms"),
      min_area_sqm: payload.get("min_area_sqm") || undefined,
      hard_constraints: parseJsonField("hard_constraints"),
      preferences: parseJsonField("preferences"),
      important_locations: parseJsonField("important_locations"),
    };
  } else if (typeof payload === "object" && payload !== null) {
    rawValues = payload as Record<string, unknown>;
  }

  const parsed = requirementsSchema.safeParse(rawValues);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: fieldErrors,
    };
  }

  const supabase = createClient();

  const { error: upsertError } = await supabase.from("requirements").upsert({
    case_id: caseId,
    max_budget_sar: parsed.data.max_budget_sar,
    purchase_method: parsed.data.purchase_method,
    household_size: parsed.data.household_size,
    min_bedrooms: parsed.data.min_bedrooms,
    min_area_sqm: parsed.data.min_area_sqm ?? null,
    hard_constraints: parsed.data.hard_constraints,
    preferences: parsed.data.preferences,
    important_locations: parsed.data.important_locations,
  });

  if (upsertError) {
    return {
      errors: {
        form: [upsertError.message || "حدث خطأ أثناء حفظ البيانات"],
      },
    };
  }

  // Set case status to 'needs_complete' if it is currently 'draft'
  await supabase
    .from("decision_cases")
    .update({ status: "needs_complete" })
    .eq("id", caseId)
    .eq("status", "draft");

  redirect(`/case/${caseId}/properties`);
}
