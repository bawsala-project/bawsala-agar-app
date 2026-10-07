import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/auth";

export type RateLimitedAction = "extract" | "analyze" | "checkout" | "auth";

export const RATE_LIMIT_MESSAGE =
  "تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار بضع دقائق والمحاولة مجددًا.";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export const RATE_LIMITS: Record<RateLimitedAction, { max: number; windowMs: number }> = {
  extract: { max: 5, windowMs: 10 * MINUTE_MS },
  analyze: { max: 10, windowMs: HOUR_MS },
  checkout: { max: 10, windowMs: HOUR_MS },
  auth: { max: 3, windowMs: 15 * MINUTE_MS },
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; status: 429; message: string; retryAfterSeconds: number };

// Sliding window log: key -> request timestamps (ms) within the window.
const hits = new Map<string, number[]>();

function windowHits(key: string, windowMs: number, now: number): number[] {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length === 0) {
    hits.delete(key);
  } else {
    hits.set(key, recent);
  }
  return recent;
}

/**
 * Checks every identifier against the action's limit. The request is recorded
 * against all identifiers only if none of them is over the limit.
 */
export function checkRateLimit(
  action: RateLimitedAction,
  identifiers: string[],
  now: number = Date.now()
): RateLimitResult {
  const { max, windowMs } = RATE_LIMITS[action];
  const keys = identifiers.map((id) => `${action}:${id}`);

  let retryAfterMs = 0;
  for (const key of keys) {
    const recent = windowHits(key, windowMs, now);
    if (recent.length >= max) {
      retryAfterMs = Math.max(retryAfterMs, recent[0] + windowMs - now);
    }
  }

  if (retryAfterMs > 0) {
    return {
      allowed: false,
      status: 429,
      message: RATE_LIMIT_MESSAGE,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  for (const key of keys) {
    hits.set(key, [...(hits.get(key) ?? []), now]);
  }
  return { allowed: true };
}

async function requestIdentifiers(requestHeaders?: Headers): Promise<string[]> {
  const identifiers: string[] = [];
  try {
    const h = requestHeaders ?? headers();
    const ip =
      h.get("x-real-ip") ||
      h.get("cf-connecting-ip") ||
      h.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (ip) identifiers.push(`ip:${ip}`);
  } catch {
    // Outside a request scope: no IP available.
  }
  try {
    const user = await getSessionUser();
    if (user) identifiers.push(`session:${user.id}`);
  } catch {
    // Outside a request scope: no session available.
  }
  return identifiers;
}

/**
 * Rate-limits the current request by IP and session. When the request can be
 * identified by neither (no request scope), there is nothing to key on and it is allowed.
 */
export async function enforceRateLimit(
  action: RateLimitedAction,
  requestHeaders?: Headers
): Promise<RateLimitResult> {
  const identifiers = await requestIdentifiers(requestHeaders);
  if (identifiers.length === 0) return { allowed: true };
  return checkRateLimit(action, identifiers);
}

/** Builds the HTTP 429 response for route handlers. */
export function rateLimitResponse(result: Extract<RateLimitResult, { allowed: false }>): NextResponse {
  return NextResponse.json(
    { error: result.message },
    { status: result.status, headers: { "Retry-After": String(result.retryAfterSeconds) } }
  );
}

/** Test helper: clears all recorded hits. */
export function resetRateLimits(): void {
  hits.clear();
}
