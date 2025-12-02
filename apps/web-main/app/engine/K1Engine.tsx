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

// --- HERO PRESET DEFINITION ---
export const K1_HERO_PRESET = {
  visuals: {
    exposure: 4.0,
    baseLevel: 0.0,
    tint: '#ffffff',
  },
  optics: {
    topSpreadNear: 0.0706,
    topSpreadFar: 0.0539,
    bottomSpreadNear: 0.0706,
    bottomSpreadFar: 0.0539,
    topFalloff: 2.61,
    bottomFalloff: 2.61,
    columnBoostStrength: 0.0,
    columnBoostExponent: 1.2,
    edgeHotspotStrength: 5.0,
    edgeHotspotWidth: 0.1,
  },
  physics: {
    motionMode: 'Center Origin',
    simulationSpeed: 1.0,
    decay: 0.15,
    ghostAudio: true,
  },
};

type K1EngineProps = {
  compositorRect?: {
    offset: [number, number];
    scale: [number, number];
  };
};

export const K1Engine: React.FC<K1EngineProps> = ({ compositorRect }) => {
  // --- LEVA CONTROLS ---
  const params = useControls('K1 Lightwave Engine', {
    Timeline: folder({
      timelineEnabled: { value: false },
      loop: { value: true },
      timelineTime: { value: 0, min: 0, max: TIMELINE_DURATION, step: 0.1 },
    }),
    Modes: folder({
      heroMode: { value: true },
    }),
    Visuals: folder({
      // Deprecated "falloff" and "spread" from here as they are now Optical properties
      // Keeping them if timeline targets them, but for tuning we use Optics
      exposure: { value: K1_HERO_PRESET.visuals.exposure, min: 0.1, max: 20.0 },
      baseLevel: { value: K1_HERO_PRESET.visuals.baseLevel, min: 0.0, max: 1.0 },
      tint: { value: K1_HERO_PRESET.visuals.tint },

      // Legacy fallbacks for timeline compatibility (will be ignored if Optics override)
      falloff: { value: 1.5, render: () => false },
      spread: { value: 0.015, render: () => false },
    }),
    Optics: folder({
      topSpreadNear: {
        value: K1_HERO_PRESET.optics.topSpreadNear,
        min: 0.0,
        max: 0.12,
        step: 0.001,
      },
      topSpreadFar: { value: K1_HERO_PRESET.optics.topSpreadFar, min: 0.0, max: 0.12, step: 0.001 },
      bottomSpreadNear: {
        value: K1_HERO_PRESET.optics.bottomSpreadNear,
        min: 0.0,
        max: 0.12,
        step: 0.001,
      },
      bottomSpreadFar: {
        value: K1_HERO_PRESET.optics.bottomSpreadFar,
        min: 0.0,
        max: 0.12,
        step: 0.001,
      },
      topFalloff: { value: K1_HERO_PRESET.optics.topFalloff, min: 0.5, max: 10.0 },
      bottomFalloff: { value: K1_HERO_PRESET.optics.bottomFalloff, min: 0.5, max: 10.0 },
      columnBoostStrength: { value: K1_HERO_PRESET.optics.columnBoostStrength, min: 0.0, max: 5.0 },
      columnBoostExponent: { value: K1_HERO_PRESET.optics.columnBoostExponent, min: 0.5, max: 3.0 },
      edgeHotspotStrength: { value: K1_HERO_PRESET.optics.edgeHotspotStrength, min: 0.0, max: 5.0 },
      edgeHotspotWidth: { value: K1_HERO_PRESET.optics.edgeHotspotWidth, min: 0.0, max: 0.25 },
    }),
    Physics: folder({
      motionMode: {
        options: ['Center Origin', 'Left Origin', 'Right Origin'],
        value: K1_HERO_PRESET.physics.motionMode,
      },
      simulationSpeed: { value: K1_HERO_PRESET.physics.simulationSpeed, min: 0.1, max: 5.0 },
      decay: { value: K1_HERO_PRESET.physics.decay, min: 0.01, max: 0.5 },
      ghostAudio: { value: K1_HERO_PRESET.physics.ghostAudio },
    }),
    Diagnostics: folder({
      diagnosticMode: {
        options: ['NONE', 'TOP_ONLY', 'BOTTOM_ONLY', 'COLLISION', 'EDGES_ONLY'],
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
      falloff: params.falloff, // Legacy
      exposure: params.exposure,
      spread: params.spread, // Legacy
      baseLevel: params.baseLevel,
      tint: params.tint,
    },
    manualOptics: {
      topSpreadNear: params.topSpreadNear,
      topSpreadFar: params.topSpreadFar,
      bottomSpreadNear: params.bottomSpreadNear,
      bottomSpreadFar: params.bottomSpreadFar,
      topFalloff: params.topFalloff,
      bottomFalloff: params.bottomFalloff,
      columnBoostStrength: params.columnBoostStrength,
      columnBoostExponent: params.columnBoostExponent,
      edgeHotspotStrength: params.edgeHotspotStrength,
      edgeHotspotWidth: params.edgeHotspotWidth,
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
    heroMode: params.heroMode,
    heroLoopDuration: TIMELINE_DURATION,
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
  }, [layers, addLayer]);

  // --- UNIFORM SYNC ---
  const edgeLitUniforms = useMemo(
    () => ({
      uLedStateBottom: { value: texBottom },
      uLedStateTop: { value: texTop },
      uResolution: { value: ledCount },

      // Visuals
      uExposure: { value: effectiveVisuals.exposure },
      uBaseLevel: { value: effectiveVisuals.baseLevel },
      uTint: { value: new THREE.Color(effectiveVisuals.tint) },

      // Optics (Not controlled by timeline yet, driven by Leva "Optics" folder)
      uTopFalloff: { value: params.topFalloff },
      uBottomFalloff: { value: params.bottomFalloff },
      uTopSpreadNear: { value: params.topSpreadNear },
      uTopSpreadFar: { value: params.topSpreadFar },
      uBottomSpreadNear: { value: params.bottomSpreadNear },
      uBottomSpreadFar: { value: params.bottomSpreadFar },
      uColumnBoostStrength: { value: params.columnBoostStrength },
      uColumnBoostExponent: { value: params.columnBoostExponent },
      uEdgeHotspotStrength: { value: params.edgeHotspotStrength },
      uEdgeHotspotWidth: { value: params.edgeHotspotWidth },
    }),
    [] // Create once on mount
  );

  const uniformsRef = useRef(edgeLitUniforms);

  // Imperatively update all uniform values every render
  uniformsRef.current.uLedStateBottom.value = texBottom;
  uniformsRef.current.uLedStateTop.value = texTop;
  uniformsRef.current.uResolution.value = ledCount;

  // Visuals (Timeline-driven)
  uniformsRef.current.uExposure.value = effectiveVisuals.exposure;
  uniformsRef.current.uBaseLevel.value = effectiveVisuals.baseLevel;
  uniformsRef.current.uTint.value.set(effectiveVisuals.tint);

  // Optics (Manual tuning)
  uniformsRef.current.uTopFalloff.value = params.topFalloff;
  uniformsRef.current.uBottomFalloff.value = params.bottomFalloff;
  uniformsRef.current.uTopSpreadNear.value = params.topSpreadNear;
  uniformsRef.current.uTopSpreadFar.value = params.topSpreadFar;
  uniformsRef.current.uBottomSpreadNear.value = params.bottomSpreadNear;
  uniformsRef.current.uBottomSpreadFar.value = params.bottomSpreadFar;
  uniformsRef.current.uColumnBoostStrength.value = params.columnBoostStrength;
  uniformsRef.current.uColumnBoostExponent.value = params.columnBoostExponent;
  uniformsRef.current.uEdgeHotspotStrength.value = params.edgeHotspotStrength;
  uniformsRef.current.uEdgeHotspotWidth.value = params.edgeHotspotWidth;

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
      <Compositor offset={compositorRect?.offset} scale={compositorRect?.scale} />

      {/* Diagnostics */}
      {params.showDebugOverlay && (
        <DebugOverlay texTop={texTop} texBottom={texBottom} ledCount={ledCount} />
      )}
    </>
  );
};
