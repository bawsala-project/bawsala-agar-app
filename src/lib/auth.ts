import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export { ALLOWED_CITIES, type AllowedCity } from "@/lib/constants/cities";

export async function ensureSession(): Promise<User> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(error?.message || "Failed to create anonymous session");
  }

  return data.user;
}

export async function getSessionUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireCase(
  caseId: string,
  client?: SupabaseClient<Database>
): Promise<Tables<"decision_cases">> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("decision_cases")
    .select("*")
    .eq("id", caseId)
    .single();

  if (error || !data) {
    notFound();
  }

  return data;
}
