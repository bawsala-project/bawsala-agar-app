import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reconcilePaymentEffect } from "@/lib/payments/reconcile";
import type { VerifiedWebhook } from "@/lib/payments/adapter";

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = { payments: [], case_operations: [] };
let updateCount = 0;

vi.mock("@/lib/supabase/admin", () => {
  function builder(table: string, mode: "select" | "update", patch?: Row) {
    const filters: Array<(row: Row) => boolean> = [];
    const matching = () => tables[table].filter((row) => filters.every((f) => f(row)));
    const run = () => {
      const rows = matching();
      if (mode === "update") {
        // Emulates the partial unique index: one paid payment per case.
        if (
          table === "payments" &&
          patch?.status === "paid" &&
          rows.some((row) =>
            tables.payments.some((p) => p.case_id === row.case_id && p.status === "paid")
          )
        ) {
          return { data: null, error: { code: "23505" } };
        }
        rows.forEach((row) => Object.assign(row, patch));
        updateCount += rows.length;
      }
      return { data: rows.map((row) => ({ id: row.id })), error: null };
    };
    const chain = {
      eq(col: string, val: unknown) {
        filters.push((row) => row[col] === val);
        return chain;
      },
      in(col: string, vals: unknown[]) {
        filters.push((row) => vals.includes(row[col]));
        return chain;
      },
      select: () => chain,
      limit: () => chain,
      maybeSingle: async () => ({ data: matching()[0] ?? null, error: null }),
      then: (resolve: (value: unknown) => void) => resolve(run()),
    };
    return chain;
  }
  return {
    adminSupabase: {
      from: (table: string) => ({
        select: () => builder(table, "select"),
        update: (patch: Row) => builder(table, "update", patch),
      }),
    },
  };
});

import { settlePayment } from "@/lib/payments/settle";

const expected = { case_id: "case-1", amount_sar: 10, currency: "SAR" };
const goodActual = { case_id: "case-1", amount_sar: 10, currency: "SAR", status: "success" } as const;

describe("reconcilePaymentEffect", () => {
  it("matches when amount is 10.00 SAR and case matches", () => {
    expect(reconcilePaymentEffect(expected, goodActual)).toEqual({ matched: true });
    expect(reconcilePaymentEffect({ ...expected, amount_sar: "10.00" }, goodActual).matched).toBe(true);
  });

  it("mismatches on a tampered amount of 1.00 SAR", () => {
    const result = reconcilePaymentEffect(expected, { ...goodActual, amount_sar: 1 });
    expect(result.matched).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it("mismatches when case_id differs (forged reference)", () => {
    const result = reconcilePaymentEffect(expected, { ...goodActual, case_id: "case-2" });
    expect(result.matched).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it("mismatches on wrong currency or failed status", () => {
    expect(reconcilePaymentEffect(expected, { ...goodActual, currency: "USD" }).matched).toBe(false);
    expect(reconcilePaymentEffect(expected, { ...goodActual, status: "failure" }).matched).toBe(false);
  });
});

describe("settlePayment", () => {
  const key = "checkout_case-1_v1";
  const event = (overrides: Partial<VerifiedWebhook> = {}): VerifiedWebhook => ({
    valid: true,
    eventId: "evt-1",
    caseId: "case-1",
    amountSar: 10,
    status: "success",
    ...overrides,
  });

  beforeEach(() => {
    updateCount = 0;
    tables.payments = [{ id: "pay-1", case_id: "case-1", idempotency_key: key, status: "initiated" }];
    tables.case_operations = [
      {
        id: "op-1",
        case_id: "case-1",
        idempotency_key: key,
        expected_effect: expected,
        effect_status: "pending",
      },
    ];
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks payment paid and operation matched", async () => {
    const result = await settlePayment(key, event());

    expect(result).toEqual({ outcome: "paid", caseId: "case-1" });
    expect(tables.payments[0]).toMatchObject({ status: "paid", provider_event_id: "evt-1" });
    expect(tables.case_operations[0].effect_status).toBe("matched");
    expect(tables.case_operations[0].completed_at).toBeTruthy();
  });

  it("flags a tampered amount as mismatch and leaves the case unpaid", async () => {
    const result = await settlePayment(key, event({ amountSar: 1 }));

    expect(result.outcome).toBe("mismatch");
    expect(tables.payments[0].status).toBe("failed");
    expect(tables.case_operations[0].effect_status).toBe("mismatch");
  });

  it("applies an identical webhook twice exactly once", async () => {
    await settlePayment(key, event());
    const updatesAfterFirst = updateCount;

    const second = await settlePayment(key, event());

    expect(second).toEqual({ outcome: "duplicate", caseId: "case-1" });
    expect(updateCount).toBe(updatesAfterFirst);
  });

  it("rejects an invalid event without mutating state", async () => {
    const result = await settlePayment(key, event({ valid: false }));

    expect(result.outcome).toBe("invalid");
    expect(updateCount).toBe(0);
  });

  it("salvages a late success on an abandoned payment when the case is unpaid", async () => {
    tables.payments[0].status = "abandoned";

    const result = await settlePayment(key, event());

    expect(result).toEqual({ outcome: "paid", caseId: "case-1" });
    expect(tables.payments[0].status).toBe("paid");
    expect(tables.case_operations[0].effect_status).toBe("matched");
  });

  describe("when the case is already paid by another payment", () => {
    const key2 = "checkout_case-1_v1_a2";

    beforeEach(() => {
      tables.payments[0].status = "paid";
      tables.payments.push({ id: "pay-2", case_id: "case-1", idempotency_key: key2, status: "abandoned" });
      tables.case_operations.push({
        id: "op-2",
        case_id: "case-1",
        idempotency_key: key2,
        expected_effect: expected,
        effect_status: "pending",
      });
    });

    it("flags the second successful payment as duplicate_paid without double-activating", async () => {
      const result = await settlePayment(key2, event({ eventId: "evt-2" }));

      expect(result).toEqual({ outcome: "duplicate", caseId: "case-1" });
      expect(tables.payments[1]).toMatchObject({ status: "duplicate_paid", provider_event_id: "evt-2" });
      expect(tables.payments.filter((p) => p.status === "paid")).toHaveLength(1);
      expect(tables.case_operations[1].effect_status).toBe("mismatch");
      expect(console.error).toHaveBeenCalledWith(
        "DUPLICATE_PAYMENT_DETECTED_FOR_REFUND",
        expect.objectContaining({ paymentId: "pay-2", caseId: "case-1" })
      );
    });

    it("returns early on a repeated duplicate callback without further mutation", async () => {
      await settlePayment(key2, event({ eventId: "evt-2" }));
      const updatesAfterFirst = updateCount;

      const second = await settlePayment(key2, event({ eventId: "evt-2" }));

      expect(second.outcome).toBe("duplicate");
      expect(updateCount).toBe(updatesAfterFirst);
    });
  });
});
