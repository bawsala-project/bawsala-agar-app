import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Server-only helper: Moves the calling guest session's cases to the verified permanent account.
 * This is called strictly from verified server endpoints (like /auth/callback) after cryptographic
 * code exchange. It is NEVER exposed as a public client-callable Server Action.
 */
export async function linkGuestCasesToUser(
  targetUserId: string,
  clientOverride?: SupabaseClient<Database>
): Promise<{ linked: number; error?: string }> {
  const supabase = clientOverride ?? createClient();
  const { data, error } = await supabase.rpc("link_guest_cases_to_user", {
    target_user_id: targetUserId,
  });

  if (error) {
    return { linked: 0, error: error.message };
  }
  return { linked: data ?? 0 };
}
