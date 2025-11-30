'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
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
          autoClear: false,
        }}
        camera={{ position: [0, 2, 35], fov: 45 }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <K1Engine
            compositorRect={{
              offset: [0, 0],
              scale: [1, 1],
            }}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
