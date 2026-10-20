import type { PaymentAdapter } from "./adapter";
import { MockPaymentProvider } from "./mock";

/**
 * Payment Provider Gate & Factory
 * Allows seamless swapping of the payment gateway behind the PaymentAdapter interface.
 */
export function getPaymentProvider(): PaymentAdapter {
  const providerType = process.env.PAYMENT_PROVIDER || "mock";
  switch (providerType) {
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}
