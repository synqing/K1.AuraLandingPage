import { NextResponse } from 'next/server';
import { createStripeCharge } from '@/lib/payments/stripe';
import { createSquarePayment } from '@/lib/payments/square';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, message: 'Invalid payload' }, { status: 400 });
  }

  const { provider, amount, currency = 'usd', token, nonce } = body as Record<string, unknown>;
  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ ok: false, message: 'Amount is required' }, { status: 400 });
  }

  if (provider === 'stripe') {
    const result = await createStripeCharge({ amount, currency, token });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  if (provider === 'square') {
    const result = await createSquarePayment({ amount, currency, nonce });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  return NextResponse.json({ ok: false, message: 'Unsupported provider' }, { status: 400 });
}
