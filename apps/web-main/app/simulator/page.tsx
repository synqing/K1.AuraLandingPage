'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { K1Engine } from '../engine/K1Engine';
import { Leva } from 'leva';

export default function SimulatorPage() {
  return (
    <main className="relative min-h-screen bg-black overflow-hidden selection:bg-[#FFB84D]/30">
      <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
        <div>
          <h1 className="text-zinc-400 text-sm font-mono uppercase tracking-widest">
            K1 · Physics Simulator
          </h1>
          <p className="text-zinc-600 text-xs mt-1 font-mono">v2.0.0 · Modular Engine · 120Hz</p>
        </div>
        <div className="text-right">
          <span className="inline-block w-2 h-2 rounded-full bg-[#FFB84D] animate-pulse mr-2"></span>
          <span className="text-[#FFB84D] text-xs font-mono uppercase tracking-widest">Active</span>
        </div>
      </div>

      <Leva
        collapsed={false}
        theme={{
          colors: {
            accent1: '#FFB84D',
            elevation1: '#18181b',
            folderTextColor: '#f4f4f5',
          },
        }}
      />

      <div className="relative z-0 flex h-screen w-full items-center justify-center px-4 sm:px-10">
        <div className="relative aspect-[32/6] w-[min(90vw,60rem)] max-w-[60rem] overflow-hidden rounded-[1.75rem] border border-white/5 bg-black shadow-[0_0_4rem_rgba(0,0,0,0.9)]">
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
              <K1Engine />

              <mesh position={[0, -7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[120, 120]} />
                <meshBasicMaterial color="#030303" />
              </mesh>
            </Suspense>

            <EffectComposer enableNormalPass={false}>
              <Bloom luminanceThreshold={0.1} mipmapBlur intensity={1.2} radius={0.6} />
            </EffectComposer>
          </Canvas>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>
      </div>
    </main>
  );
}
