import { describe, it, expect, vi, beforeEach } from "vitest";

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = { payments: [], case_operations: [] };

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

let preflightReady = true;

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireCase: async (id: string) => ({ id, state_version: 3 }),
  };
});

vi.mock("@/lib/preflight/load", () => ({
  loadPreflightData: async () => ({}),
}));

vi.mock("@/lib/preflight/evaluate", () => ({
  evaluatePreflight: () => ({ ready: preflightReady, blockers: [], warnings: [] }),
}));

vi.mock("@/lib/supabase/admin", () => {
  function select(table: string) {
    const filters: Array<[string, unknown]> = [];
    const matching = () =>
      tables[table]
        .filter((row) => filters.every(([col, val]) => row[col] === val))
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    const chain = {
      eq(col: string, val: unknown) {
        filters.push([col, val]);
        return chain;
      },
      order: () => chain,
      single: async () => ({ data: matching()[0] ?? null, error: null }),
      then: (resolve: (value: unknown) => void) => resolve({ data: matching(), error: null }),
    };
    return chain;
  }
  return {
    adminSupabase: {
      from: (table: string) => ({
        select: () => select(table),
        upsert: async (row: Row) => {
          if (!tables[table].some((r) => r.idempotency_key === row.idempotency_key)) {
            tables[table].push({
              id: `${table}-${row.idempotency_key}`,
              status: "initiated",
              created_at: new Date().toISOString(),
              ...row,
            });
          }
          return { error: null };
        },
        update: (patch: Row) => {
          const filters: Array<[string, unknown]> = [];
          const chain = {
            eq(col: string, val: unknown) {
              filters.push([col, val]);
              return chain;
            },
            then: (resolve: (value: unknown) => void) => {
              tables[table]
                .filter((r) => filters.every(([col, val]) => r[col] === val))
                .forEach((r) => Object.assign(r, patch));
              resolve({ error: null });
            },
          };
          return chain;
        },
      }),
    },
  };
});

import { initiateCheckoutAction } from "@/actions/payments";

const key = (attempt: number) => `checkout_case-1_v3_a${attempt}`;

describe("initiateCheckoutAction", () => {
  beforeEach(() => {
    tables.payments = [];
    tables.case_operations = [];
    preflightReady = true;
  });

  it("rejects an unready case without writing any rows", async () => {
    preflightReady = false;

    const result = await initiateCheckoutAction("case-1");

    expect(result).toEqual({
      success: false,
      error: "الحالة غير جاهزة للدفع بعد، يرجى إكمال متطلبات الفحص المبدئي أولاً.",
    });
    expect(tables.payments).toHaveLength(0);
    expect(tables.case_operations).toHaveLength(0);
  });

  it("records exact expected effect and redirects to the mock callback", async () => {
    await expect(initiateCheckoutAction("case-1")).rejects.toThrow(
      `REDIRECT:/api/payments/mock-callback?key=${key(1)}`
    );

    expect(tables.case_operations[0].expected_effect).toEqual({
      case_id: "case-1",
      amount_sar: 10,
      currency: "SAR",
    });
    expect(tables.payments[0].amount_sar).toBe(10);
  });

  it("reuses an in-flight payment created less than 2 minutes ago", async () => {
    await expect(initiateCheckoutAction("case-1")).rejects.toThrow("REDIRECT:");
    await expect(initiateCheckoutAction("case-1")).rejects.toThrow(
      `REDIRECT:/api/payments/mock-callback?key=${key(1)}`
    );

    expect(tables.payments).toHaveLength(1);
    expect(tables.case_operations).toHaveLength(1);
  });

  it("allows a retry with a new attempt key after a failed payment", async () => {
    await expect(initiateCheckoutAction("case-1")).rejects.toThrow("REDIRECT:");
    tables.payments[0].status = "failed";

    await expect(initiateCheckoutAction("case-1")).rejects.toThrow(
      `REDIRECT:/api/payments/mock-callback?key=${key(2)}`
    );

    expect(tables.payments.map((p) => p.idempotency_key)).toEqual([key(1), key(2)]);
    expect(tables.payments[0].status).toBe("failed");
  });

  it("allows a retry when the initiated payment is older than 2 minutes", async () => {
    await expect(initiateCheckoutAction("case-1")).rejects.toThrow("REDIRECT:");
    tables.payments[0].created_at = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    await expect(initiateCheckoutAction("case-1")).rejects.toThrow(`key=${key(2)}`);

    expect(tables.payments).toHaveLength(2);
    expect(tables.payments[0].status).toBe("abandoned");
    expect(tables.payments[1].status).toBe("initiated");
  });

  it("redirects to results without charging when a paid payment exists", async () => {
    await expect(initiateCheckoutAction("case-1")).rejects.toThrow("REDIRECT:");
    tables.payments[0].status = "paid";

    await expect(initiateCheckoutAction("case-1")).rejects.toThrow("REDIRECT:/case/case-1/results");

    expect(tables.payments).toHaveLength(1);
  });

  describe("C1 Security Guarantees", () => {
    it("disables MockPaymentProvider in production unless ENABLE_MOCK_PAYMENTS=true", async () => {
      const origEnv = process.env.NODE_ENV;
      const origMock = process.env.ENABLE_MOCK_PAYMENTS;
      try {
        process.env.NODE_ENV = "production";
        delete process.env.ENABLE_MOCK_PAYMENTS;

        const { MockPaymentProvider } = await import("@/lib/payments/mock");
        expect(() => new MockPaymentProvider()).toThrow("MockPaymentProvider is disabled in production");
      } finally {
        process.env.NODE_ENV = origEnv;
        if (origMock) process.env.ENABLE_MOCK_PAYMENTS = origMock;
      }
    });

    it("verifies HMAC signature when PAYMENT_WEBHOOK_SECRET is set", async () => {
      const crypto = await import("crypto");
      const secret = "test_webhook_secret_key_12345";
      const origSecret = process.env.PAYMENT_WEBHOOK_SECRET;
      try {
        process.env.PAYMENT_WEBHOOK_SECRET = secret;
        const { MockPaymentProvider } = await import("@/lib/payments/mock");
        const adapter = new MockPaymentProvider();

        const payload = { eventId: "evt_1", caseId: "case-1", amountSar: 10 };
        const raw = JSON.stringify(payload);
        const validSig = crypto.createHmac("sha256", secret).update(raw).digest("hex");

        // Valid signature -> valid
        const validRes = await adapter.verifyWebhook(payload, validSig);
        expect(validRes.valid).toBe(true);
        expect(validRes.caseId).toBe("case-1");

        // Missing signature -> invalid
        const missingRes = await adapter.verifyWebhook(payload, undefined);
        expect(missingRes.valid).toBe(false);

        // Tampered signature -> invalid
        const tamperedRes = await adapter.verifyWebhook(payload, "invalid_signature_hex");
        expect(tamperedRes.valid).toBe(false);
      } finally {
        if (origSecret) process.env.PAYMENT_WEBHOOK_SECRET = origSecret;
        else delete process.env.PAYMENT_WEBHOOK_SECRET;
      }
    });
  });
});

