"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ensureSession, requireCase } from "@/lib/auth";
import type { Database } from "@/types/database";
import {
  SUPPORTED_CITIES,
  SUPPORTED_PROPERTY_TYPES,
  EXPANSION_PROPERTY_TYPES,
  ACTIVE_STRATEGIC_GOALS,
  EXPANSION_TYPES,
} from "@/config/product";

const CitySchema = z.enum(SUPPORTED_CITIES);

export async function startCase(formData: FormData) {
  const rawCity = formData.get("city");
  const parsed = CitySchema.safeParse(rawCity);

  if (!parsed.success) {
    throw new Error("Invalid city");
  }

  const user = await ensureSession();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("decision_cases")
    .insert({
      city: parsed.data,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create case");
  }

  // Validate property typology
  const rawTypology = formData.get("typology")?.toString()?.toLowerCase();
  const normalizedTypology = rawTypology === "apt" ? "apartment" : rawTypology;
  const allowedTypologies = (
    EXPANSION_TYPES ? EXPANSION_PROPERTY_TYPES : SUPPORTED_PROPERTY_TYPES
  ) as readonly string[];
  const validTypology =
    normalizedTypology && allowedTypologies.includes(normalizedTypology)
      ? normalizedTypology
      : SUPPORTED_PROPERTY_TYPES[0];

  // Validate strategic goal (hide investment unless EXPANSION_TYPES)
  const rawIntent = formData.get("purchase_intent")?.toString()?.toLowerCase();
  const allowedIntents = ACTIVE_STRATEGIC_GOALS.map((g) => g.id);
  const validIntent =
    rawIntent && allowedIntents.includes(rawIntent)
      ? rawIntent
      : ACTIVE_STRATEGIC_GOALS[0].id;

  const title = formData.get("session_title")?.toString();

  const searchParams = new URLSearchParams();
  if (validTypology) searchParams.set("typology", validTypology);
  if (validIntent) searchParams.set("intent", validIntent);
  if (title) searchParams.set("title", title);

  const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
  redirect(`/case/${data.id}/profile${qs}`);
}

export async function deleteCase(caseId: string) {
  const supabase = createClient();
  await supabase.rpc("delete_case", { case_id: caseId });
  redirect("/");
}

/** Soft-deletes an owned case and stays on the current page (used by the dashboard). */
export async function softDeleteCaseAction(
  caseId: string,
  clientOverride?: SupabaseClient<Database>
): Promise<void> {
  const supabase = clientOverride ?? createClient();
  // notFound() for cases the caller does not own (RLS) or that are already deleted
  await requireCase(caseId, supabase);
  const { error } = await supabase.rpc("delete_case", { case_id: caseId });
  if (error) {
    throw new Error("Failed to delete case");
  }
  try {
    revalidatePath("/dashboard");
  } catch {
    // Ignore in non-request contexts
  }
}
