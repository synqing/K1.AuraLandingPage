export type StripeChargeRequest = {
  amount: number;
  currency: string;
  token: string;
  metadata?: Record<string, string>;
};

export type PaymentResponse = {
  ok: boolean;
  id?: string;
  message?: string;
};

export async function createStripeCharge(payload: StripeChargeRequest): Promise<PaymentResponse> {
  // Placeholder stub: integrate real Stripe SDK on the server using secret keys.
  if (!payload.token) {
    return { ok: false, message: 'Missing payment token.' };
  }

  // Simulate async network call
  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    ok: true,
    id: `stripe_test_${Date.now()}`,
  };
}
