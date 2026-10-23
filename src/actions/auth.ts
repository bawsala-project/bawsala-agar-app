"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { linkGuestCasesToUser } from "@/lib/auth/link";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { normalizeArabicDigits } from "@/lib/utils/arabic-numbers";

const emailSchema = z.string().trim().email();

export interface AuthActionState {
  success: boolean;
  error?: string;
  verifiedEmail?: string;
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

/**
 * Verifies an email OTP code directly in the current session, links any guest cases
 * to the verified user, upgrades the session cookies, and sets the session verification cookie
 * so the user is never asked to verify again in the same session.
 */
export async function verifyEmailOtpAction(
  email: string,
  token: string
): Promise<AuthActionState> {
  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return { success: false, error: "يرجى إدخال بريد إلكتروني صحيح" };
  }

  const cleanToken = normalizeArabicDigits(token).replace(/\s+/g, "").trim();
  if (!cleanToken || cleanToken.length < 6) {
    return { success: false, error: "يرجى إدخال رمز التحقق المكون من 6 أرقام" };
  }

  const supabase = createClient();
  const {
    data: { user: guest },
  } = await supabase.auth.getUser();

  const cookieStore = cookies();
  const verifier = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  let verifyResult = await verifier.auth.verifyOtp({
    email: parsedEmail.data,
    token: cleanToken,
    type: "email",
  });

  if (verifyResult.error) {
    verifyResult = await verifier.auth.verifyOtp({
      email: parsedEmail.data,
      token: cleanToken,
      type: "magiclink",
    });
  }

  const { data, error } = verifyResult;
  if (error || !data.session || !data.user) {
    return {
      success: false,
      error: "رمز التحقق غير صحيح أو منتهي الصلاحية. يمكنك فتح الرابط المرسل لبريدك مباشرة.",
    };
  }

  if (guest?.is_anonymous && guest.id !== data.user.id) {
    const linkRes = await linkGuestCasesToUser(data.user.id, supabase);
    if (linkRes.error) {
      try {
        await adminSupabase
          .from("decision_cases")
          .update({ owner_id: data.user.id })
          .eq("owner_id", guest.id);
      } catch {
        // Ignore in mocked test environments
      }
    }
  }

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  try {
    cookieStore.set("bawsala_verified_email", parsedEmail.data, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      httpOnly: false,
    });
  } catch {
    // Ignore if cookies are read-only in test context
  }

  return {
    success: true,
    verifiedEmail: parsedEmail.data,
  };
}
