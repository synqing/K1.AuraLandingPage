# Deployment Guide · K1 Aura Landing Page

## Prerequisites

- Node.js 18+ (matches Vercel runtime)
- npm 9+
- Vercel account with access to the target project/organization

## Local Verification

```bash
npm install
npm run lint
npm run build
npm run start
```

If these commands succeed, the app is ready for deployment.

## Environment Variables

Set these in Vercel (Project Settings → Environment Variables):

| Key                         | Type   | Example                             |
| --------------------------- | ------ | ----------------------------------- |
| `NEXT_PUBLIC_PRICE`         | Public | `249`                               |
| `NEXT_PUBLIC_SPLIT_ENABLED` | Public | `false`                             |
| `NEXT_PUBLIC_UNITS_TOTAL`   | Public | `100`                               |
| `NEXT_PUBLIC_UNITS_SOLD`    | Public | `0`                                 |
| `NEXT_PUBLIC_SHIP_DATE`     | Public | `2025-01-01`                        |
| `NEXT_PUBLIC_DISCORD_URL`   | Public | `https://discord.gg/your-community` |
| `NEXT_PUBLIC_GITHUB_URL`    | Public | `https://github.com/your-org/k1`    |
| `STRIPE_SECRET_KEY`         | Secret | `<your-key>`                        |
| `SQUARE_ACCESS_TOKEN`       | Secret | `<your-key>`                        |

(Stripe/Square keys optional until you replace the payment stubs.)

## Deployment Steps

1. Push this folder to its own Git repository.
2. Import the repo in Vercel, pointing to the root of `K1.LandingPage.Aura`.
3. Framework Preset: **Next.js**; Build Command: `npm run build`; Output Directory: `.next`.
4. Add env vars from the table above.
5. Deploy.

## Post-Deploy Checklist

- Smoke test `/` and embedded visualization (`/aura/snapwave-3d-preview.html`).
- Confirm the `/api/payments` endpoint responds (currently stubbed).
- Verify OG/meta tags if you add them.
- Hook up monitoring/logging if required.
