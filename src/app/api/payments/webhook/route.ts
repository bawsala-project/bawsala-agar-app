import { NextResponse, type NextRequest } from "next/server";
import { MockPaymentProvider } from "@/lib/payments/mock";
import { settlePayment } from "@/lib/payments/settle";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limiting (M3): enforce limit and return HTTP 429 on abuse
  const limit = await enforceRateLimit("checkout", request.headers);
  if (!limit.allowed) {
    return rateLimitResponse(limit);
  }

  // Security Gate (C1): Webhook mock provider is strictly forbidden in production without mock flag.
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_MOCK_PAYMENTS !== "true") {
    return NextResponse.json({ error: "Webhook is disabled in this environment" }, { status: 403 });
  }

  // If secret is set, require x-signature
  if (process.env.PAYMENT_WEBHOOK_SECRET && !request.headers.get("x-signature")) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing idempotency key" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const adapter = new MockPaymentProvider();
  const verified = await adapter.verifyWebhook(payload, request.headers.get("x-signature") ?? undefined);
  const result = await settlePayment(key, verified);

  switch (result.outcome) {
    case "paid":
    case "duplicate":
      return NextResponse.json({ ok: true }, { status: 200 });
    case "mismatch":
      return NextResponse.json(
        { error: `Payment reconciliation mismatch: ${result.reason}` },
        { status: 400 }
      );
    case "invalid":
      return NextResponse.json({ error: "Invalid webhook payload or signature" }, { status: 400 });
    case "not_found":
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    case "finalized":
      return NextResponse.json({ error: "Payment already finalized" }, { status: 409 });
  }
}
