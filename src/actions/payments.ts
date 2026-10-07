"use server";

import { redirect } from "next/navigation";
import { requireCase } from "@/lib/auth";
import { adminSupabase } from "@/lib/supabase/admin";
import { loadPreflightData } from "@/lib/preflight/load";
import { evaluatePreflight } from "@/lib/preflight/evaluate";
import { MockPaymentProvider } from "@/lib/payments/mock";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const CHECKOUT_AMOUNT_SAR = 10.0;
const IN_FLIGHT_WINDOW_MS = 2 * 60 * 1000;

export interface CheckoutActionResult {
  success: false;
  error: string;
}

export async function initiateCheckoutAction(caseId: string): Promise<CheckoutActionResult | void> {
  const currentCase = await requireCase(caseId);

  const limit = await enforceRateLimit("checkout");
  if (!limit.allowed) {
    return { success: false, error: limit.message };
  }

  const preflight = evaluatePreflight(await loadPreflightData(caseId));
  if (!preflight.ready) {
    return {
      success: false,
      error: "الحالة غير جاهزة للدفع بعد، يرجى إكمال متطلبات الفحص المبدئي أولاً.",
    };
  }

  const adapter = new MockPaymentProvider();
  const returnUrl = `/case/${caseId}/results`;

  const { data: existing, error: existingErr } = await adminSupabase
    .from("payments")
    .select("id, status, idempotency_key, created_at")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
  if (existingErr) {
    throw new Error("Failed to load existing payments");
  }
  const attempts = existing ?? [];

  if (attempts.some((p) => p.status === "paid")) {
    redirect(returnUrl);
  }

  // In-flight protection: reuse a recent initiated session instead of opening a new one.
  const latest = attempts[0];
  if (
    latest &&
    latest.status === "initiated" &&
    Date.now() - new Date(latest.created_at).getTime() < IN_FLIGHT_WINDOW_MS
  ) {
    const reused = await adapter.initiatePayment({
      caseId,
      amountSar: CHECKOUT_AMOUNT_SAR,
      idempotencyKey: latest.idempotency_key,
      returnUrl,
    });
    redirect(reused.redirectUrl);
  }

  // Failed or timed-out attempts allow a conscious retry under a new attempt key.
  // Older initiated sessions are abandoned but stay settleable, so a late success is salvaged.
  const { error: abandonErr } = await adminSupabase
    .from("payments")
    .update({ status: "abandoned" })
    .eq("case_id", caseId)
    .eq("status", "initiated");
  if (abandonErr) {
    throw new Error("Failed to supersede earlier payment attempts");
  }

  const attemptNumber = attempts.length + 1;
  const idempotencyKey = `checkout_${caseId}_v${currentCase.state_version}_a${attemptNumber}`;

  const { error: opErr } = await adminSupabase.from("case_operations").upsert(
    {
      case_id: caseId,
      operation_type: "checkout",
      idempotency_key: idempotencyKey,
      expected_effect: { case_id: caseId, amount_sar: CHECKOUT_AMOUNT_SAR, currency: "SAR" },
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true }
  );
  if (opErr) {
    throw new Error("Failed to record checkout operation");
  }

  const { error: insertErr } = await adminSupabase.from("payments").upsert(
    {
      case_id: caseId,
      provider: "mock",
      amount_sar: CHECKOUT_AMOUNT_SAR,
      idempotency_key: idempotencyKey,
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true }
  );
  if (insertErr) {
    throw new Error("Failed to record payment");
  }

  const { data: payment, error: selectErr } = await adminSupabase
    .from("payments")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .single();
  if (selectErr || !payment) {
    throw new Error("Failed to load payment");
  }

  const { redirectUrl, paymentId } = await adapter.initiatePayment({
    caseId,
    amountSar: CHECKOUT_AMOUNT_SAR,
    idempotencyKey,
    returnUrl,
  });

  const { error: refErr } = await adminSupabase
    .from("payments")
    .update({ external_ref: paymentId })
    .eq("id", payment.id);
  if (refErr) {
    throw new Error("Failed to update payment reference");
  }

  redirect(redirectUrl);
}
