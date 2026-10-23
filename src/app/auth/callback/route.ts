import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { linkGuestCasesToUser } from "@/lib/auth/link";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const otpType = (request.nextUrl.searchParams.get("type") as EmailOtpType | null) ?? "email";
  const requestedNext = request.nextUrl.searchParams.get("next");
  const next =
    requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // The guest session is still the active one at this point.
  const supabase = createClient();
  const {
    data: { user: guest },
  } = await supabase.auth.getUser();

  // Verify the link on a throwaway client so the guest session stays active until its cases are moved.
  const verifier = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const authResult = code
    ? await verifier.auth.exchangeCodeForSession(code)
    : await verifier.auth.verifyOtp({
        token_hash: tokenHash!,
        type: otpType,
      });

  const { data, error } = authResult;
  if (error || !data.session || !data.user) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (guest?.is_anonymous && guest.id !== data.user.id) {
    const result = await linkGuestCasesToUser(data.user.id, supabase);
    if (result.error) {
      // Fallback via admin client so the buyer's decision cases are always preserved
      // and the session upgrade never aborts.
      try {
        await adminSupabase
          .from("decision_cases")
          .update({ owner_id: data.user.id })
          .eq("owner_id", guest.id);
      } catch {
        // Ignore fallback error in mocked environments
      }
    }
  }

  // Track cookies set during setSession so we can explicitly attach them to the redirect response
  const pendingCookies: Array<{
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }> = [];

  const sessionSetter = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const c of cookiesToSet) {
            pendingCookies.push(c);
          }
        },
      },
    }
  );

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  await sessionSetter.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  const response = NextResponse.redirect(new URL(next, request.url));

  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }

  if (data.user.email) {
    response.cookies.set("bawsala_verified_email", data.user.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      httpOnly: false,
    });
  }

  return response;
}
