import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentAdapter,
  VerifiedWebhook,
} from "./adapter";
import { z } from "zod";
import { buildPaymentPayload } from "@/lib/security/allowlists";

import crypto from "crypto";

const mockEventSchema = z.object({
  eventId: z.string().min(1),
  caseId: z.string().min(1),
  amountSar: z.number(),
});

export class MockPaymentProvider implements PaymentAdapter {
  constructor() {
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_MOCK_PAYMENTS !== "true") {
      throw new Error("MockPaymentProvider is disabled in production environments");
    }
  }

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_MOCK_PAYMENTS !== "true") {
      throw new Error("Mock payments are disabled in this environment");
    }

    // Outbound allowlist: the gateway only ever sees case_id, amount, currency and return_url.
    const payload = buildPaymentPayload(params.caseId, params.amountSar, params.returnUrl);

    // The idempotency key is our own opaque reference echoed back by the gateway.
    const query = new URLSearchParams({
      key: params.idempotencyKey,
      return: payload.return_url,
    });

    return {
      redirectUrl: `/api/payments/mock-callback?${query.toString()}`,
      paymentId: `mock_${params.idempotencyKey}`,
    };
  }

  async verifyWebhook(payload: unknown, signature?: string): Promise<VerifiedWebhook> {
    // If webhook secret is configured, require and verify HMAC signature
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (secret) {
      if (!signature) {
        return { valid: false, eventId: "", caseId: "", amountSar: 0, status: "failure" };
      }
      const rawPayload = typeof payload === "string" ? payload : JSON.stringify(payload);
      const expected = crypto.createHmac("sha256", secret).update(rawPayload).digest("hex");
      try {
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
          return { valid: false, eventId: "", caseId: "", amountSar: 0, status: "failure" };
        }
      } catch {
        return { valid: false, eventId: "", caseId: "", amountSar: 0, status: "failure" };
      }
    }

    const parsed = mockEventSchema.safeParse(payload);
    if (!parsed.success) {
      return { valid: false, eventId: "", caseId: "", amountSar: 0, status: "failure" };
    }

    return {
      valid: true,
      eventId: parsed.data.eventId,
      caseId: parsed.data.caseId,
      amountSar: parsed.data.amountSar,
      status: process.env.MOCK_PAYMENT_FORCE_FAIL === "1" ? "failure" : "success",
    };
  }
}
