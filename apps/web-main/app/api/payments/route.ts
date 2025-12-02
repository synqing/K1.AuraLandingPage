import { NextResponse } from 'next/server';
import { createStripeCharge } from '@/lib/payments/stripe';
import { createSquarePayment } from '@/lib/payments/square';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, message: 'Invalid payload' }, { status: 400 });
  }

  const { provider, amount, currency = 'usd', token, nonce } = body as Record<string, unknown>;
  const currencyCode = typeof currency === 'string' ? currency : 'usd';

  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ ok: false, message: 'Amount is required' }, { status: 400 });
  }

  if (provider === 'stripe') {
    const tokenStr = typeof token === 'string' ? token : '';
    const result = await createStripeCharge({ amount, currency: currencyCode, token: tokenStr });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  if (provider === 'square') {
    const nonceStr = typeof nonce === 'string' ? nonce : '';
    const result = await createSquarePayment({ amount, currency: currencyCode, nonce: nonceStr });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  return NextResponse.json({ ok: false, message: 'Unsupported provider' }, { status: 400 });
}
