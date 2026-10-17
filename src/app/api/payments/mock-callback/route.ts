import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { MockPaymentProvider } from "@/lib/payments/mock";
import { settlePayment } from "@/lib/payments/settle";
import { enforceRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  // Next.js Server Action redirect pre-flight sends `RSC: 1` to probe if the target
  // is an RSC page. Returning 204 prevents Node's internal fetch from following the 303
  // redirect into `/results` while keeping the browser URL stuck on `/api/payments/mock-callback`.
  if (request.headers.get("rsc") === "1") {
    return new NextResponse(null, { status: 204 });
  }

  // Security Gate (C1): Mock callback is strictly forbidden in production unless mock payments are explicitly enabled.
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_MOCK_PAYMENTS !== "true") {
    return NextResponse.json({ error: "Mock payment callback is disabled in this environment" }, { status: 403 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing idempotency key" }, { status: 400 });
  }

  // Owner-scoped lookup (RLS): only the buyer's own session can complete the mock payment.
  const { data: payment } = await createClient()
    .from("payments")
    .select("case_id, amount_sar, status")
    .eq("idempotency_key", key)
    .maybeSingle();
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Fast-path if already settled (e.g. refreshing callback URL): redirect to results without rate-limit penalty.
  if (payment.status === "paid" || payment.status === "duplicate_paid") {
    return NextResponse.redirect(new URL(`/case/${payment.case_id}/results`, request.url), 303);
  }

  // Rate limiting (M3): enforce limit and return HTTP 429 on abuse
  const limit = await enforceRateLimit("checkout", request.headers);
  if (!limit.allowed) {
    return rateLimitResponse(limit);
  }

  // The mock gateway reports exactly what was initiated for this key.
  const adapter = new MockPaymentProvider();
  const payload = {
    eventId: `mock_evt_${key}`,
    caseId: payment.case_id,
    amountSar: Number(payment.amount_sar),
  };
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const signature = secret
    ? crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex")
    : undefined;
  const verified = await adapter.verifyWebhook(payload, signature);
  const result = await settlePayment(key, verified);

  switch (result.outcome) {
    case "paid":
    case "duplicate":
      return NextResponse.redirect(new URL(`/case/${result.caseId}/results`, request.url), 303);
    case "mismatch":
      return NextResponse.json(
        { error: `Payment reconciliation mismatch: ${result.reason}` },
        { status: 400 }
      );
    case "invalid":
      return NextResponse.json({ error: "Invalid payment event" }, { status: 400 });
    case "not_found":
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    case "finalized":
      return NextResponse.json({ error: "Payment already finalized" }, { status: 409 });
  }
}
