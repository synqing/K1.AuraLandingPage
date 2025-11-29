import dynamic from 'next/dynamic';

import { SITE_CONFIG } from '@/lib/site-config';

const MODULES = [
  {
    id: 'Module · 01',
    title: 'CNC Aluminum Chassis',
    description:
      'A milled mono-block shell acting as both structure and heatsink, optimized for silent thermal bleed.',
    gradient: 'bg-gradient-to-br from-white/5 via-white/0 to-white/0',
    align: 'left' as const,
  },
  {
    id: 'Module · 02',
    title: 'Dual Edge-Lit Diffusion',
    description:
      'Counter-phased light channels sculpt motion with volumetric depth, not surface bloom.',
    gradient: 'bg-gradient-to-bl from-[#FFB84D]/10 via-white/0 to-white/0',
    align: 'right' as const,
  },
  {
    id: 'Module · 03',
    title: 'ESP32-S3 Logic Core',
    description:
      'Real-time spectral analysis and motion synthesis on-device, no uplink, no latency tax.',
    gradient: 'bg-gradient-to-tr from-sky-500/20 via-white/0 to-white/0',
    align: 'left' as const,
  },
];

const LiquidMetalHero = dynamic(() => import('@/components/LiquidMetalHero'), {
  ssr: false,
  loading: () => (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.75rem] border border-white/5 bg-gradient-to-b from-zinc-900 via-black to-black shadow-[0_0_3rem_rgba(0,0,0,0.8)]">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-900 via-zinc-800 to-black opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
    </div>
  ),
});

export default function Page() {
  return (
    <main className="relative min-h-screen snap-y snap-mandatory bg-black text-[#F2F2F2]">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between px-4 sm:px-8 pt-4 text-[clamp(0.65rem,0.8vw,0.85rem)] font-space uppercase tracking-[0.16em] text-zinc-500">
        <span className="opacity-60">K - 1</span>
        <span className="hidden items-center gap-3 sm:inline-flex">
          {[70, 40, 30, 20, 10].map((opacity) => (
            <span
              key={opacity}
              className="h-[0.12rem] w-[1.1rem] rounded-full"
              style={{ backgroundColor: `rgba(113,113,122,${opacity / 100})` }}
            />
          ))}
        </span>
      </div>

      <div className="pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2 text-[clamp(0.6rem,0.7vw,0.75rem)] font-space uppercase tracking-[0.16em] text-zinc-500 sm:flex">
        <div className="flex flex-col items-center gap-1">
          <span>Init</span>
          <div className="h-[7rem] w-[0.09rem] overflow-hidden rounded-full bg-zinc-800/80">
            <div className="h-1/5 w-full bg-[#FFB84D]/80" />
            <div className="h-4/5 w-full bg-zinc-800/80" />
          </div>
        </div>
      </div>

      <div className="relative w-full min-h-screen">
        <section className="relative h-screen w-full snap-start">
          <div className="absolute inset-0">
            <div className="relative h-full w-full bg-gradient-to-br from-black via-black to-zinc-900">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.12)_0,transparent_55%),radial-gradient(circle_at_90%_100%,rgba(120,120,120,0.3)_0,transparent_55%)] mix-blend-screen opacity-20" />
              <div className="absolute inset-0 bg-black/60" />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-black via-black/90 to-transparent" />

          <div className="relative z-20 flex h-full w-full flex-col items-center justify-center px-4 sm:px-10">
            <div className="relative flex items-center justify-center w-full max-w-4xl">
              <LiquidMetalHero className="max-w-4xl" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,184,77,0.4)_0,transparent_55%)] blur-3xl mix-blend-screen opacity-50" />
            </div>

            <div className="relative mt-8 w-full max-w-4xl px-2 sm:px-8">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.75rem] border border-white/5 bg-black shadow-[0_0_4rem_rgba(0,0,0,0.9)]">
                <iframe
                  src="/aura/snapwave-3d-preview.html"
                  title="K1 Live Visualization"
                  loading="lazy"
                  className="h-full w-full border-none"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              </div>
              <p className="mt-4 text-center text-[clamp(0.75rem,0.95vw,1rem)] font-space uppercase tracking-[0.2em] text-zinc-400">
                Live Audio-Reactive Visualization · Snapwave Physics Engine
              </p>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-6 text-[clamp(0.7rem,0.95vw,1rem)] font-space text-zinc-400 sm:px-10 sm:pb-10">
              <span className="uppercase tracking-[0.16em]">Audio-Reactive Light Guide</span>
              <span className="flex items-center gap-2">
                <span className="hidden uppercase tracking-[0.16em] sm:inline">
                  Scroll to Initialize
                </span>
                <span className="uppercase tracking-[0.16em] sm:hidden">Scroll</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-[#FFB84D]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>
          </div>
        </section>

        <section className="relative h-screen w-full snap-start">
          <div className="absolute inset-0 bg-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,184,77,0.18)_0,transparent_55%),radial-gradient(circle_at_10%_110%,rgba(37,99,235,0.28)_0,transparent_60%)] opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/96 to-transparent" />

          <div className="relative z-10 flex h-full w-full flex-col justify-center gap-12 px-4 sm:px-10">
            <div className="relative h-72 w-full max-w-4xl">
              <div className="absolute inset-0 rounded-[2rem] border border-white/5 bg-black/50 shadow-[0_0_4rem_rgba(0,0,0,1)]" />
              <div className="absolute inset-x-6 inset-y-4 rounded-[1.6rem] border border-white/5 bg-gradient-to-b from-white/5 via-white/0 to-white/0" />
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div>
                  <p className="font-space text-[clamp(0.85rem,1vw,1.1rem)] uppercase tracking-[0.2em] text-zinc-400">
                    K1 · Light Guide
                  </p>
                  <p className="font-inter text-[clamp(1.6rem,3vw,3.2rem)] font-semibold uppercase text-zinc-100">
                    Organic diffusion chamber — 33cm span
                  </p>
                </div>
              </div>
              <div className="absolute -inset-[12%] bg-[radial-gradient(circle_at_50%_0%,rgba(255,184,77,0.25)_0,transparent_60%),radial-gradient(circle_at_10%_100%,rgba(15,118,255,0.45)_0,transparent_55%)] opacity-30 blur-3xl" />
            </div>

            <div className="relative z-20 flex h-full w-full max-w-5xl flex-col justify-center gap-10 sm:gap-12 px-2 sm:px-6">
              {MODULES.map((module) => (
                <article
                  key={module.id}
                  className={`${module.align === 'right' ? 'ml-auto' : ''} max-w-sm sm:max-w-md bg-black/40 text-left text-[clamp(0.9rem,1.05vw,1.15rem)] leading-relaxed text-zinc-200/90 shadow-[0_0_3rem_rgba(0,0,0,0.7)] backdrop-blur-xl`}
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className={`absolute inset-0 ${module.gradient}`} />
                    <div className="relative p-5 sm:p-6">
                      <p className="mb-2 text-[clamp(0.82rem,0.95vw,1.05rem)] uppercase tracking-[0.22em] text-zinc-400">
                        {module.id}
                      </p>
                      <h2 className="font-manrope mb-1 text-[clamp(1.3rem,1.9vw,2.1rem)] font-semibold tracking-tight">
                        {module.title}
                      </h2>
                      <p className="text-[clamp(0.98rem,1.1vw,1.2rem)] text-zinc-300/90">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,0,0,0.9)_0,rgba(0,0,0,1)_65%)]" />
          </div>
        </section>

        <section className="relative h-screen w-full snap-start overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black" />
            <div className="absolute inset-0 mix-blend-screen opacity-90 bg-[radial-gradient(circle_at_0%_0%,rgba(255,184,77,0.6)_0,transparent_55%),radial-gradient(circle_at_100%_100%,rgba(56,189,248,0.7)_0,transparent_60%),radial-gradient(circle_at_50%_120%,rgba(37,99,235,0.75)_0,transparent_55%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
          </div>
          <div className="relative z-10 flex h-full w-full items-center justify-center px-4 sm:px-10">
            <div className="max-w-3xl text-center">
              <h2 className="font-inter mb-6 text-[clamp(2.5rem,5vw,3.5rem)] font-extrabold uppercase leading-none">
                Physics, Not Pixels.
              </h2>
              <p className="font-space text-[clamp(1.05rem,1.25vw,1.35rem)] text-zinc-100/95 leading-relaxed">
                Fluid dynamics and diffusion models run natively at{' '}
                <span className="font-semibold text-[#FFB84D]">120Hz</span>, mapping sound pressure
                into tangible, volumetric light.
              </p>
            </div>
          </div>
        </section>

        <section className="relative h-screen w-full snap-start">
          <div className="absolute inset-0 flex flex-col md:flex-row">
            <div className="relative flex flex-1 items-center justify-center bg-black px-4 sm:px-10">
              <div className="max-w-md">
                <h3 className="font-inter text-[clamp(2.2rem,4vw,3.2rem)] font-extrabold uppercase leading-tight">
                  For Pioneers Only.
                </h3>
              </div>
            </div>
            <div className="relative flex flex-1 items-center justify-center bg-gradient-to-b from-black via-black to-zinc-950 px-4 sm:px-10">
              <div className="max-w-md">
                <p className="font-space text-[clamp(1.05rem,1.25vw,1.35rem)] leading-relaxed text-zinc-200">
                  This is raw hardware.{' '}
                  <span className="text-zinc-50 font-semibold">No app. No cloud. No accounts.</span>{' '}
                  Just you, the spectrum, and the chassis that translates it into motion.
                </p>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-1/2 h-full w-[0.11rem] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#FFB84D]/40 to-transparent opacity-60" />
        </section>

        <section className="relative h-screen w-full snap-start overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,184,77,0.18)_0,transparent_55%),radial-gradient(circle_at_10%_110%,rgba(37,99,235,0.28)_0,transparent_60%)] opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/96 to-transparent" />
          </div>
          <div className="relative z-10 flex h-full items-center justify-center px-4 sm:px-10">
            <div className="w-full max-w-md sm:max-w-lg">
              <div className="mx-auto w-full rounded-3xl bg-black/60 shadow-[0_0_4rem_rgba(0,0,0,1)] backdrop-blur-2xl">
                <div className="relative p-6 sm:p-8">
                  <div className="mb-8 flex items-center justify-between">
                    <div className="font-space flex flex-col gap-1 text-[clamp(0.78rem,0.9vw,0.95rem)] uppercase tracking-[0.18em] text-zinc-400">
                      <span className="text-xs">Allocation</span>
                      <span className="text-[clamp(0.86rem,1vw,1rem)] text-zinc-100">
                        {`${String(SITE_CONFIG.unitsSold).padStart(3, '0')}`}
                        <span className="text-zinc-500">/</span>
                        {SITE_CONFIG.unitsTotal}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-inter text-[clamp(1.6rem,2.1vw,2.3rem)] font-semibold tracking-tight text-[#FFB84D] leading-none">
                        ${SITE_CONFIG.price}
                      </span>
                      <p className="mt-1 text-[clamp(0.82rem,0.95vw,1rem)] text-zinc-500">
                        Founders series hardware allocation.
                      </p>
                    </div>
                  </div>
                  <CTAForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

async function submitAccessRequest(data: FormData) {
  'use server';
  const email = data.get('email')?.toString();
  if (!email) {
    return { ok: false, message: 'Email is required.' };
  }

  // in production, send to CRM / Email provider. For now we just respond.
  return { ok: true };
}

function CTAForm() {
  return (
    <form action={submitAccessRequest} className="space-y-5 font-space">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-[clamp(0.86rem,0.98vw,1.05rem)] text-zinc-300">
          Receive an access link
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-zinc-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@domain"
            required
            className="w-full bg-transparent pl-6 pr-2 pb-1 pt-2 text-[clamp(1rem,1.1vw,1.2rem)] text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          <div className="mt-1 h-[0.07rem] w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
        </div>
        <p className="text-[clamp(0.78rem,0.92vw,0.96rem)] text-zinc-500">
          No spam. One message when your allocation window opens.
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 text-sm text-zinc-500">
        <button
          type="submit"
          className="group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[clamp(0.9rem,1vw,1.05rem)] uppercase tracking-[0.18em] text-zinc-100"
        >
          <span className="absolute inset-0 rounded-full bg-[#FFB84D]/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="relative">Request Access</span>
          <span className="relative flex h-5 w-5 items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 text-[#FFB84D]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </button>
        <span>Zero obligation. Pure signal.</span>
      </div>
    </form>
  );
}
