'use client';

import { LiquidMetal } from '@paper-design/shaders-react';

type Props = {
  className?: string;
};

/**
 * Liquid metal shader applied to the official K1 outline.
 * Uses GPU canvas; render client-side only.
 */
export default function LiquidMetalHero({ className }: Props) {
  return (
    <div
      className={`relative aspect-[55/9] w-full overflow-hidden rounded-[1.75rem] border border-white/5 bg-black shadow-[0_0_4rem_rgba(0,0,0,0.9)] ${className ?? ''}`}
    >
      <LiquidMetal
        width={1280}
        height={720}
        image="/k1-hero.svg"
        colorBack="#000000"
        colorTint="#ffffff"
        shape="none"
        repetition={2}
        softness={0.1}
        shiftRed={0.3}
        shiftBlue={0.3}
        distortion={0.07}
        contour={0.4}
        angle={70}
        speed={1}
        scale={0.6}
        fit="contain"
        suspendWhenProcessingImage
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
    </div>
  );
}
