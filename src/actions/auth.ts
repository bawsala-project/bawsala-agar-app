"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const emailSchema = z.string().trim().email();

export interface AuthActionState {
  success: boolean;
  error?: string;
}

function safeNextPath(nextPath: string | undefined): string {
  return nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
}

function siteOrigin(): string {
  const requestHeaders = headers();
  const origin = requestHeaders.get("origin");
  if (origin) return origin;
  const host = requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://127.0.0.1:3000";
}

/**
 * Sends a passwordless sign-in link. The current guest session stays untouched
 * until the link is opened, so the buyer's flow is not interrupted.
 */
export async function signInWithOtpAction(
  email: string,
  nextPath?: string
): Promise<AuthActionState> {
  const limit = await enforceRateLimit("auth");
  if (!limit.allowed) {
    return { success: false, error: limit.message };
  }

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { success: false, error: "يرجى إدخال بريد إلكتروني صحيح" };
  }

  const redirectTo = `${siteOrigin()}/auth/callback?next=${encodeURIComponent(safeNextPath(nextPath))}`;
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return { success: false, error: "تعذر إرسال رابط الدخول. حاول مرة أخرى." };
  }
  return { success: true };
}
