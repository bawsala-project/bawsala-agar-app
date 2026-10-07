export interface InitiatePaymentParams {
  caseId: string;
  amountSar: number;
  idempotencyKey: string;
  returnUrl: string;
}

export interface InitiatePaymentResult {
  redirectUrl: string;
  paymentId: string;
}

export interface VerifiedWebhook {
  valid: boolean;
  eventId: string;
  caseId: string;
  amountSar: number;
  status: "success" | "failure";
}

export interface PaymentAdapter {
  initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verifyWebhook(payload: unknown, signature?: string): Promise<VerifiedWebhook>;
}
