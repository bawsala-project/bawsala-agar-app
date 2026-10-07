import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";
import { linkGuestCasesToUser } from "@/lib/auth/link";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const next =
    requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  if (!code) {
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
  const { data, error } = await verifier.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (guest?.is_anonymous && guest.id !== data.user.id) {
    const result = await linkGuestCasesToUser(data.user.id, supabase);
    if (result.error) {
      // Keep the guest session so nothing is lost; the buyer can retry linking.
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  return NextResponse.redirect(new URL(next, request.url));
}
