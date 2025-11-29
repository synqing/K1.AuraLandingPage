export type SquarePaymentRequest = {
  amount: number;
  currency: string;
  nonce: string;
  note?: string;
};

export async function createSquarePayment(payload: SquarePaymentRequest) {
  if (!payload.nonce) {
    return { ok: false, message: 'Missing Square nonce.' };
  }

  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    ok: true,
    id: `square_test_${Date.now()}`,
  };
}
