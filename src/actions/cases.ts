"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ensureSession, requireCase, ALLOWED_CITIES } from "@/lib/auth";
import type { Database } from "@/types/database";

const CitySchema = z.enum(ALLOWED_CITIES);

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

  redirect(`/case/${data.id}/needs`);
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
