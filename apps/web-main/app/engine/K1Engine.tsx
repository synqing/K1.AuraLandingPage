'use client';

import { folder, useControls } from 'leva';
import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Compositor } from './components/Compositor';
import { DebugOverlay } from './components/Debug/DebugOverlay';
import { VisualLayer } from './components/VisualLayer';
import { useLayerManager } from './LayerManager';
import { edgeLitShader } from './shaders/edge-lit';
import { TIMELINE_DURATION } from './timeline/sequence';
import { useTimelineController } from './timeline/useTimelineController';
import { type DiagnosticMode, useK1Physics } from './useK1Physics';
import { K1_HERO_PRESET } from './presets';

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
    Visuals: folder({
      // Deprecated "falloff" and "spread" from here as they are now Optical properties
      // Keeping them if timeline targets them, but for tuning we use Optics
      exposure: { value: K1_HERO_PRESET.visuals.exposure, min: 0.1, max: 20.0 },
      baseLevel: {
        value: K1_HERO_PRESET.visuals.baseLevel,
        min: 0.0,
        max: 1.0,
      },
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
      topSpreadFar: {
        value: K1_HERO_PRESET.optics.topSpreadFar,
        min: 0.0,
        max: 0.12,
        step: 0.001,
      },
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
      topFalloff: {
        value: K1_HERO_PRESET.optics.topFalloff,
        min: 0.5,
        max: 10.0,
      },
      bottomFalloff: {
        value: K1_HERO_PRESET.optics.bottomFalloff,
        min: 0.5,
        max: 10.0,
      },
      columnBoostStrength: {
        value: K1_HERO_PRESET.optics.columnBoostStrength,
        min: 0.0,
        max: 5.0,
      },
      columnBoostExponent: {
        value: K1_HERO_PRESET.optics.columnBoostExponent,
        min: 0.5,
        max: 3.0,
      },
      edgeHotspotStrength: {
        value: K1_HERO_PRESET.optics.edgeHotspotStrength,
        min: 0.0,
        max: 5.0,
      },
      edgeHotspotWidth: {
        value: K1_HERO_PRESET.optics.edgeHotspotWidth,
        min: 0.0,
        max: 0.25,
      },
    }),
    Physics: folder({
      motionMode: {
        options: ['Center Origin', 'Left Origin', 'Right Origin'],
        value: K1_HERO_PRESET.physics.motionMode,
      },
      simulationSpeed: {
        value: K1_HERO_PRESET.physics.simulationSpeed,
        min: 0.1,
        max: 5.0,
      },
      decay: { value: K1_HERO_PRESET.physics.decay, min: 0.01, max: 0.5 },
      ghostAudio: { value: K1_HERO_PRESET.physics.ghostAudio },
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
  const { effectiveVisuals, effectivePhysics, effectiveDiagnostics, effectiveOptics } =
    useTimelineController({
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
    // biome-ignore lint/correctness/useExhaustiveDependencies: Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      uTopFalloff: { value: effectiveOptics.topFalloff },
      uBottomFalloff: { value: effectiveOptics.bottomFalloff },
      uTopSpreadNear: { value: effectiveOptics.topSpreadNear },
      uTopSpreadFar: { value: effectiveOptics.topSpreadFar },
      uBottomSpreadNear: { value: effectiveOptics.bottomSpreadNear },
      uBottomSpreadFar: { value: effectiveOptics.bottomSpreadFar },
      uColumnBoostStrength: { value: effectiveOptics.columnBoostStrength },
      uColumnBoostExponent: { value: effectiveOptics.columnBoostExponent },
      uEdgeHotspotStrength: { value: effectiveOptics.edgeHotspotStrength },
      uEdgeHotspotWidth: { value: effectiveOptics.edgeHotspotWidth },
    }),
    [] // Create once on mount
    // biome-ignore lint/correctness/useExhaustiveDependencies: Stable reference for mutable uniforms
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  uniformsRef.current.uTopFalloff.value = effectiveOptics.topFalloff;
  uniformsRef.current.uBottomFalloff.value = effectiveOptics.bottomFalloff;
  uniformsRef.current.uTopSpreadNear.value = effectiveOptics.topSpreadNear;
  uniformsRef.current.uTopSpreadFar.value = effectiveOptics.topSpreadFar;
  uniformsRef.current.uBottomSpreadNear.value = effectiveOptics.bottomSpreadNear;
  uniformsRef.current.uBottomSpreadFar.value = effectiveOptics.bottomSpreadFar;
  uniformsRef.current.uColumnBoostStrength.value = effectiveOptics.columnBoostStrength;
  uniformsRef.current.uColumnBoostExponent.value = effectiveOptics.columnBoostExponent;
  uniformsRef.current.uEdgeHotspotStrength.value = effectiveOptics.edgeHotspotStrength;
  uniformsRef.current.uEdgeHotspotWidth.value = effectiveOptics.edgeHotspotWidth;

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
      {/* @ts-expect-error Leva types are loose */}
      {params.showDebugOverlay && (
        <DebugOverlay texTop={texTop} texBottom={texBottom} ledCount={ledCount} />
      )}
    </>
  );
};
