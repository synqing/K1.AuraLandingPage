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
import { useTimelineController } from './timeline/useTimelineController';
import { TIMELINE_DURATION } from './timeline/sequence';

export const K1Engine: React.FC = () => {
  // --- LEVA CONTROLS ---
  const params = useControls('K1 Lightwave Engine', {
    Timeline: folder({
      timelineEnabled: { value: false },
      loop: { value: true },
      timelineTime: { value: 0, min: 0, max: TIMELINE_DURATION, step: 0.1 },
    }),
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

  // --- TIMELINE CONTROLLER ---
  const { effectiveVisuals, effectivePhysics, effectiveDiagnostics } = useTimelineController({
    enabled: params.timelineEnabled,
    loop: params.loop,
    timelineTimeControl: params.timelineTime,
    manualVisuals: {
      falloff: params.falloff,
      exposure: params.exposure,
      spread: params.spread,
      baseLevel: params.baseLevel,
      tint: params.tint,
    },
    manualPhysics: {
      motionMode: params.motionMode,
      simulationSpeed: params.simulationSpeed,
      decay: params.decay,
      ghostAudio: params.ghostAudio,
    },
    manualDiagnostics: {
      diagnosticMode: params.diagnosticMode,
    },
  });

  // --- PHYSICS KERNEL ---
  const { texBottom, texTop, ledCount } = useK1Physics({
    simulationSpeed: effectivePhysics.simulationSpeed,
    decay: effectivePhysics.decay,
    ghostAudio: effectivePhysics.ghostAudio,
    motionMode: effectivePhysics.motionMode,
    diagnosticMode: effectiveDiagnostics.diagnosticMode as DiagnosticMode,
  });

  // --- LAYER MANAGEMENT ---
  const addLayer = useLayerManager((s) => s.addLayer);
  const layers = useLayerManager((s) => s.layers);

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
  // Initialize uniform bundle once
  const edgeLitUniforms = useMemo(
    () => ({
      uLedStateBottom: { value: texBottom },
      uLedStateTop: { value: texTop },
      uResolution: { value: ledCount },
      uFalloff: { value: effectiveVisuals.falloff },
      uExposure: { value: effectiveVisuals.exposure },
      uSpread: { value: effectiveVisuals.spread },
      uBaseLevel: { value: effectiveVisuals.baseLevel },
      uTint: { value: new THREE.Color(effectiveVisuals.tint) },
    }),
    [] // Create once on mount
  );

  const uniformsRef = useRef(edgeLitUniforms);

  // Imperatively update all uniform values every render
  // This avoids re-creating the uniforms object and causing re-renders or shader recompilation
  uniformsRef.current.uLedStateBottom.value = texBottom;
  uniformsRef.current.uLedStateTop.value = texTop;
  uniformsRef.current.uResolution.value = ledCount;

  uniformsRef.current.uFalloff.value = effectiveVisuals.falloff;
  uniformsRef.current.uExposure.value = effectiveVisuals.exposure;
  uniformsRef.current.uSpread.value = effectiveVisuals.spread;
  uniformsRef.current.uBaseLevel.value = effectiveVisuals.baseLevel;
  uniformsRef.current.uTint.value.set(effectiveVisuals.tint);

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
      {/* @ts-expect-error Leva types are loose */}
      {params.showDebugOverlay && (
        <DebugOverlay texTop={texTop} texBottom={texBottom} ledCount={ledCount} />
      )}
    </>
  );
};
