"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureSession, ALLOWED_CITIES } from "@/lib/auth";

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
