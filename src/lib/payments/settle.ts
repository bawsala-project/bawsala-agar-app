import "server-only";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/admin";
import type { VerifiedWebhook } from "./adapter";
import { reconcilePaymentEffect, type ActualEffect } from "./reconcile";

const SETTLEABLE_STATUSES = ["initiated", "abandoned"];
const UNIQUE_VIOLATION = "23505";

const expectedEffectSchema = z.object({
  case_id: z.string(),
  amount_sar: z.union([z.number(), z.string()]),
  currency: z.string(),
});

export type SettleResult =
  | { outcome: "paid" | "duplicate"; caseId: string }
  | { outcome: "mismatch"; reason: string }
  | { outcome: "invalid" | "not_found" | "finalized" };

/**
 * Settles a verified provider event against the stored payment and its
 * expected effect. Safe to call repeatedly with the same event.
 */
export async function settlePayment(
  idempotencyKey: string,
  verified: VerifiedWebhook
): Promise<SettleResult> {
  if (!verified.valid) {
    return { outcome: "invalid" };
  }

  const [{ data: payment }, { data: operation }] = await Promise.all([
    adminSupabase
      .from("payments")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle(),
    adminSupabase
      .from("case_operations")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle(),
  ]);

  if (!payment || !operation) {
    return { outcome: "not_found" };
  }

  // Deduplication guard: already paid (or flagged duplicate) means no side-effects at all.
  if (payment.status === "paid" || payment.status === "duplicate_paid") {
    return { outcome: "duplicate", caseId: payment.case_id };
  }
  // Abandoned payments are still settleable so a charge made on an older tab is not lost.
  if (!SETTLEABLE_STATUSES.includes(payment.status)) {
    return { outcome: "finalized" };
  }

  const actual: ActualEffect = {
    case_id: verified.caseId,
    amount_sar: verified.amountSar,
    currency: "SAR",
    status: verified.status,
  };

  const expected = expectedEffectSchema.safeParse(operation.expected_effect);
  const result = expected.success
    ? reconcilePaymentEffect(expected.data, actual)
    : { matched: false, reason: "invalid expected effect" };

  const completedAt = new Date().toISOString();

  // The case was already paid by another payment: flag this one for refund, never activate twice.
  const flagDuplicatePaid = async (): Promise<SettleResult> => {
    console.error("DUPLICATE_PAYMENT_DETECTED_FOR_REFUND", {
      idempotencyKey,
      paymentId: payment.id,
      caseId: payment.case_id,
      eventId: verified.eventId,
    });

    const { error: dupErr } = await adminSupabase
      .from("payments")
      .update({ status: "duplicate_paid", provider_event_id: verified.eventId })
      .eq("id", payment.id)
      .in("status", SETTLEABLE_STATUSES);
    if (dupErr) {
      throw new Error("Failed to flag duplicate payment");
    }

    const { error: dupOpErr } = await adminSupabase
      .from("case_operations")
      .update({ effect_status: "mismatch", actual_effect: actual, completed_at: completedAt })
      .eq("id", operation.id);
    if (dupOpErr) {
      throw new Error("Failed to record duplicate payment effect");
    }

    return { outcome: "duplicate", caseId: payment.case_id };
  };

  if (result.matched) {
    const { data: alreadyPaid } = await adminSupabase
      .from("payments")
      .select("id")
      .eq("case_id", payment.case_id)
      .eq("status", "paid")
      .limit(1);
    if (alreadyPaid && alreadyPaid.length > 0) {
      return flagDuplicatePaid();
    }

    // Conditional update claims the transition so concurrent duplicates apply it once.
    const { data: claimed, error: claimErr } = await adminSupabase
      .from("payments")
      .update({ status: "paid", provider_event_id: verified.eventId })
      .eq("id", payment.id)
      .in("status", SETTLEABLE_STATUSES)
      .select("id");
    if (claimErr) {
      // Unique violation: a concurrent callback paid this case first.
      if (claimErr.code === UNIQUE_VIOLATION) {
        return flagDuplicatePaid();
      }
      throw new Error("Failed to mark payment as paid");
    }
    if (!claimed || claimed.length === 0) {
      return { outcome: "duplicate", caseId: payment.case_id };
    }

    const { error: opErr } = await adminSupabase
      .from("case_operations")
      .update({ effect_status: "matched", actual_effect: actual, completed_at: completedAt })
      .eq("id", operation.id);
    if (opErr) {
      throw new Error("Failed to update operation effect");
    }

    return { outcome: "paid", caseId: payment.case_id };
  }

  const reason = result.reason ?? "unknown";
  console.error("Payment reconciliation mismatch", {
    idempotencyKey,
    reason,
    expected: operation.expected_effect,
    actual,
  });

  const { error: failErr } = await adminSupabase
    .from("payments")
    .update({ status: "failed" })
    .eq("id", payment.id)
    .in("status", SETTLEABLE_STATUSES);
  if (failErr) {
    throw new Error("Failed to mark payment as failed");
  }

  const { error: mismatchErr } = await adminSupabase
    .from("case_operations")
    .update({ effect_status: "mismatch", actual_effect: actual, completed_at: completedAt })
    .eq("id", operation.id);
  if (mismatchErr) {
    throw new Error("Failed to record mismatch");
  }

  return { outcome: "mismatch", reason };
}
