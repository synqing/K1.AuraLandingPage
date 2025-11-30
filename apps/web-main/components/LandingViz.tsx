'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { K1Engine } from '@/app/engine/K1Engine';

export default function LandingViz() {
  return (
    <div className="h-full w-full">
      <Canvas
        gl={{
          powerPreference: 'high-performance',
          antialias: false,
          toneMapping: 3,
          toneMappingExposure: 1.2,
          preserveDrawingBuffer: true,
        }}
        camera={{ position: [0, 2, 35], fov: 45 }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#000000']} />
        <Suspense fallback={null}>
          <K1Engine
            compositorRect={{
              offset: [0, 0.375],
              scale: [1, 0.25],
            }}
          />
        </Suspense>
        <EffectComposer enableNormalPass={false}>
          <Bloom luminanceThreshold={0.1} mipmapBlur intensity={1.2} radius={0.6} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
