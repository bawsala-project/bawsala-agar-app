export interface ExpectedEffect {
  case_id: string;
  amount_sar: number | string;
  currency: string;
}

export type ActualEffect = {
  case_id: string;
  amount_sar: number | string;
  currency: string;
  status: "success" | "failure";
};

export interface ReconcileResult {
  matched: boolean;
  reason?: string;
}

export function reconcilePaymentEffect(
  expected: ExpectedEffect,
  actual: ActualEffect
): ReconcileResult {
  if (expected.case_id !== actual.case_id) {
    return { matched: false, reason: "case_id mismatch" };
  }
  if (Number(expected.amount_sar) !== Number(actual.amount_sar)) {
    return { matched: false, reason: "amount mismatch" };
  }
  if (expected.currency !== actual.currency || actual.currency !== "SAR") {
    return { matched: false, reason: "currency mismatch" };
  }
  if (actual.status !== "success") {
    return { matched: false, reason: "payment was not successful" };
  }
  return { matched: true };
}
