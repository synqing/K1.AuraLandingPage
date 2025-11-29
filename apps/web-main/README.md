# K1 Lightwave · Aura Landing Page

Standalone Next.js 14 marketing site showcasing the K1 Aura edition. Includes the live Snapwave visualization, payment/API stubs, and Tailwind-driven layout for deployment on Vercel.

## Tech Stack

- Next.js 14 (App Router)
- React 18
- Tailwind CSS 3
- TypeScript
- Payment stubs for Stripe & Square

## Project Structure

```
K1.LandingPage.Aura/
├── app/
│   ├── api/payments/route.ts     # Payment gateway stub endpoint
│   ├── layout.tsx                # Html/body wrapper & metadata
│   ├── page.tsx                  # Aura landing layout
│   └── globals.css               # Site-wide styles
├── lib/
│   ├── payments/stripe.ts        # Stripe placeholder helper
│   ├── payments/square.ts        # Square placeholder helper
│   └── site-config.ts            # Public env config utilities
├── public/
│   └── aura/snapwave-3d-preview.html # Visualization asset
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── next.config.mjs
├── package.json
├── package-lock.json             # Will be generated after npm install
├── .env.example
├── .eslintrc.json
├── .prettierrc
└── docs/
    ├── DEPLOYMENT.md
    └── STYLEGUIDE.md
```

## Getting Started

```bash
npm install
npm run dev
# visit http://localhost:3000
```

### Standard Scripts

- `npm run dev` – local development
- `npm run build` – production build
- `npm run start` – serve `.next` output
- `npm run lint` – Next.js linting

## Environment Variables

Copy `.env.example` to `.env.local` and override with real values:

| Variable                  | Description                             |
| ------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_PRICE`       | Displayed price for the allocation card |
| `NEXT_PUBLIC_UNITS_TOTAL` | Total unit count                        |
| `NEXT_PUBLIC_UNITS_SOLD`  | Units already allocated                 |
| `NEXT_PUBLIC_SHIP_DATE`   | Informational ship date string          |
| `NEXT_PUBLIC_DISCORD_URL` | CTA link                                |
| `NEXT_PUBLIC_GITHUB_URL`  | CTA link                                |
| `STRIPE_SECRET_KEY`       | Server-side Stripe key (future use)     |
| `SQUARE_ACCESS_TOKEN`     | Server-side Square key (future use)     |

If vars are missing, the site uses the fallback values defined in `lib/site-config.ts` purely for preview purposes.

## Deployment (Vercel)

1. `npm run build` locally to verify.
2. Push to a repository and import it into Vercel.
3. In Vercel dashboard → Project Settings → Environment Variables, add the entries listed above.
4. Deploy; Vercel automatically runs `npm install`, `npm run build`, and hosts the Next.js app.

## Payment Gateway Stubs

`/app/api/payments/route.ts` responds to `POST` requests with a provider of `stripe` or `square`, calling the placeholder helpers in `lib/payments/`. Replace those helpers with real SDK integrations and secure them using the server-side env vars when ready.

## Docs

- `docs/DEPLOYMENT.md`: Vercel configuration, production checklist, environment summary.
- `docs/STYLEGUIDE.md`: Notes on fonts, spacing, sectional layouts, and Tailwind conventions.

## Version Control

- `.gitignore` excludes `node_modules`, `.next`, and local env logs.
- Add `package-lock.json` after the first `npm install` to lock dependency versions.
- Optional: configure `.npmrc` or Git hooks as needed.

## License

Add your license text here if the repo is public.
