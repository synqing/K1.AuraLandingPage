const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const SITE_CONFIG = {
  price: toNumber(process.env.NEXT_PUBLIC_PRICE, 249),
  unitsTotal: toNumber(process.env.NEXT_PUBLIC_UNITS_TOTAL, 100),
  unitsSold: toNumber(process.env.NEXT_PUBLIC_UNITS_SOLD, 0),
  shipDate: process.env.NEXT_PUBLIC_SHIP_DATE ?? '2025-01-01',
  discordUrl: process.env.NEXT_PUBLIC_DISCORD_URL ?? '#',
  githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL ?? '#',
};
