'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useControls, folder } from 'leva';
import { useK1Physics, DiagnosticMode } from './useK1Physics';
import { useLayerManager } from './LayerManager';
import { VisualLayer } from './components/VisualLayer';
import { Compositor } from './components/Compositor';
import { DebugOverlay } from './components/Debug/DebugOverlay';
import { edgeLitShader } from './shaders/edge-lit';

export const K1Engine: React.FC = () => {
  // --- LEVA CONTROLS ---
  const params = useControls('K1 Lightwave Engine', {
    Visuals: folder({
      falloff: { value: 1.5, min: 0.5, max: 5.0 },
      exposure: { value: 4.0, min: 0.1, max: 20.0 },
      spread: { value: 0.015, min: 0.001, max: 0.1 },
      baseLevel: { value: 0.0, min: 0.0, max: 1.0 },
      tint: { value: '#ffffff' },
    }),
    Physics: folder({
      motionMode: {
        options: ['Center Origin', 'Left Origin', 'Right Origin'],
        value: 'Center Origin',
      },
      simulationSpeed: { value: 1.0, min: 0.1, max: 5.0 },
      decay: { value: 0.15, min: 0.01, max: 0.5 },
      ghostAudio: { value: true },
    }),
    Diagnostics: folder({
      diagnosticMode: {
        options: ['NONE', 'TOP_ONLY', 'BOTTOM_ONLY', 'COLLISION'],
        value: 'NONE',
      },
      showDebugOverlay: { value: false },
    }),
  });

  // --- PHYSICS KERNEL ---
  const { texBottom, texTop, ledCount } = useK1Physics({
    simulationSpeed: params.simulationSpeed,
    decay: params.decay,
    ghostAudio: params.ghostAudio,
    motionMode: params.motionMode,
    diagnosticMode: params.diagnosticMode as DiagnosticMode,
  });

  // --- LAYER MANAGEMENT ---
  const addLayer = useLayerManager((s) => s.addLayer);
  const layers = useLayerManager((s) => s.layers);

  // Initialize the default "Edge Lit" layer on mount
  useEffect(() => {
    if (layers.length === 0) {
      addLayer({
        name: 'Core Edge Lit',
        type: 'simulation',
        visible: true,
        opacity: 1.0,
        blendMode: 'NORMAL',
        uniforms: {},
      });
    }
  }, []);

  // --- UNIFORM SYNC ---
  // We map the Leva controls + Physics Textures to the Shader Uniforms
  const edgeLitUniforms = useMemo(
    () => ({
      uLedStateBottom: { value: texBottom },
      uLedStateTop: { value: texTop },
      uResolution: { value: ledCount },
      uFalloff: { value: params.falloff },
      uExposure: { value: params.exposure },
      uSpread: { value: params.spread },
      uBaseLevel: { value: params.baseLevel },
      uTint: { value: new THREE.Color(params.tint) },
    }),
    [texBottom, texTop, ledCount, params]
  );

  // Keep uniforms updated without re-creating objects
  const uniformsRef = useRef(edgeLitUniforms);
  uniformsRef.current.uFalloff.value = params.falloff;
  uniformsRef.current.uExposure.value = params.exposure;
  uniformsRef.current.uSpread.value = params.spread;
  uniformsRef.current.uBaseLevel.value = params.baseLevel;
  uniformsRef.current.uTint.value.set(params.tint);

  return (
    <>
      {/* Render each active layer to its FBO */}
      {layers.map((layer) => (
        <VisualLayer
          key={layer.id}
          layerId={layer.id}
          vertexShader={edgeLitShader.vertex}
          fragmentShader={edgeLitShader.fragment}
          uniforms={uniformsRef.current}
        />
      ))}

      {/* Composite them to the screen */}
      <Compositor />

      {/* Diagnostics */}
      {/* @ts-expect-error Leva types are loose, but this is a boolean at runtime */}
      {params.showDebugOverlay && (
        <DebugOverlay texTop={texTop} texBottom={texBottom} ledCount={ledCount} />
      )}
    </>
  );
};
