/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      K1 ENGINE - CENTER ORIGIN MANDATE                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  ⚠️  CRITICAL: This engine MUST maintain Center Origin at all times  ⚠️    ║
 * ║                                                                           ║
 * ║  The K1Engine orchestrates physics, optics, and rendering. The CENTER     ║
 * ║  ORIGIN MANDATE requires that all light injection be symmetric from       ║
 * ║  the center of the LED strip.                                             ║
 * ║                                                                           ║
 * ║  KEY CONSTRAINTS:                                                         ║
 * ║  1. motionMode Leva control defaults to 'Center Origin'                   ║
 * ║  2. Timeline MUST NOT change motionMode to Left/Right Origin              ║
 * ║  3. Physics hook receives motionMode and MUST respect it                  ║
 * ║                                                                           ║
 * ║  VISUAL VALIDATION: Light should always appear as symmetric columns       ║
 * ║  from the center, never at edges or asymmetric positions.                 ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

'use client';

import React, { useMemo } from 'react';
import { useControls, folder } from 'leva';
import { useK1Physics, DiagnosticMode } from './useK1Physics';
import { useTimelineController } from './timeline/useTimelineController';
import { TIMELINE_DURATION } from './timeline/sequence';
import { K1CoreScene } from '@/app/k1/core/view/K1CoreScene';
import { K1_HERO_V1, K1_PHYSICAL_V1 } from '@/app/k1/core/optics/presets';

// --- PRESET DEFINITIONS ---
export const K1_HERO_PRESET = K1_HERO_V1;
export const K1_PHYSICAL_PRESET = K1_PHYSICAL_V1;

// Preset lookup map
const PRESETS = {
  K1_HERO_V1,
  K1_PHYSICAL_V1,
} as const;

type PresetName = keyof typeof PRESETS;
type OpticsMode = 'HERO' | 'PHYSICAL' | 'EXPERIMENTAL';

type K1EngineProps = {
  compositorRect?: {
    offset: [number, number];
    scale: [number, number];
  };
  /** Override the default preset (defaults to K1_HERO_V1) */
  visualPreset?: PresetName;
};

export const K1Engine: React.FC<K1EngineProps> = ({
  compositorRect,
  visualPreset = 'K1_HERO_V1',
}) => {
  // Get the active preset based on prop
  const activePreset = PRESETS[visualPreset];

  // --- LEVA CONTROLS ---
  const params = useControls('K1 Lightwave Engine', {
    Timeline: folder({
      timelineEnabled: { value: false },
      loop: { value: true },
      timelineTime: { value: 0, min: 0, max: TIMELINE_DURATION, step: 0.1 },
    }),
    Modes: folder({
      opticsMode: {
        value: activePreset.opticsMode,
        options: ['HERO', 'PHYSICAL', 'EXPERIMENTAL'] as OpticsMode[],
        label: 'Optics Mode',
      },
      mode: { value: 'Snapwave', options: ['Existing', 'Snapwave', 'Bloom'] },
      heroMode: { value: false },
    }),
    Visuals: folder({
      // Deprecated "falloff" and "spread" from here as they are now Optical properties
      // Keeping them if timeline targets them, but for tuning we use Optics
      exposure: { value: K1_HERO_PRESET.visuals.exposure, min: 0.1, max: 20.0 },
      baseLevel: { value: K1_HERO_PRESET.visuals.baseLevel, min: 0.0, max: 1.0 },
      tint: { value: K1_HERO_PRESET.visuals.tint },
      hueOffset: { value: K1_HERO_PRESET.visuals.hueOffset ?? 0, min: 0, max: 1, step: 0.001 },
      autoColorShift: { value: K1_HERO_PRESET.visuals.autoColorShift ?? true },

      // Legacy fallbacks for timeline compatibility (will be ignored if Optics override)
      falloff: { value: 1.5, render: () => false },
      spread: { value: 0.015, render: () => false },
    }),
    Optics: folder({
      syncTopBottomOptics: {
        value: true,
        label: 'Sync top/bottom',
      },
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
      railInner: { value: K1_HERO_PRESET.optics.railInner, min: 0.0, max: 0.5, step: 0.001 },
      railOuter: { value: K1_HERO_PRESET.optics.railOuter, min: 0.0, max: 0.5, step: 0.001 },
      railSigma: { value: K1_HERO_PRESET.optics.railSigma, min: 0.5, max: 5.0, step: 0.01 },
      prismCount: { value: K1_HERO_PRESET.optics.prismCount ?? 0, min: 0, max: 4, step: 1 },
      prismOpacity: {
        value: K1_HERO_PRESET.optics.prismOpacity ?? 0.35,
        min: 0,
        max: 1,
        step: 0.01,
      },
    }),
    // ═══════════════════════════════════════════════════════════════════════════
    // PHYSICS CONTROLS - CENTER ORIGIN MANDATE
    // ⚠️ WARNING: motionMode MUST stay at 'Center Origin' for correct visuals
    // 'Left Origin' and 'Right Origin' are DEPRECATED and will cause regressions
    // ═══════════════════════════════════════════════════════════════════════════
    Physics: folder({
      motionMode: {
        // ⚠️ CENTER ORIGIN MANDATE: Default MUST be 'Center Origin'
        // Left/Right options exist for legacy/debug only - DO NOT USE IN PRODUCTION
        options: ['Center Origin', 'Left Origin', 'Right Origin'],
        value: K1_HERO_PRESET.physics.motionMode, // Defaults to 'Center Origin'
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
  const { effectiveVisuals, effectiveOptics, effectivePhysics, effectiveDiagnostics } =
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
        hueOffset: params.hueOffset,
        autoColorShift: params.autoColorShift,
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
        prismCount: params.prismCount,
        prismOpacity: params.prismOpacity,
        railInner: params.railInner,
        railOuter: params.railOuter,
        railSigma: params.railSigma,
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
    mode: params.mode as 'Existing' | 'Snapwave' | 'Bloom',
    heroLoopDuration: TIMELINE_DURATION,
    autoColorShift: effectiveVisuals.autoColorShift ?? true,
    hueOffset: effectiveVisuals.hueOffset ?? 0,
    prismCount: effectiveOptics.prismCount ?? 0,
    prismOpacity: effectiveOptics.prismOpacity ?? 0.35,
  });

  const renderOptics = useMemo(() => {
    const effectiveBottomSpreadNear = params.syncTopBottomOptics
      ? effectiveOptics.topSpreadNear
      : effectiveOptics.bottomSpreadNear;
    const effectiveBottomSpreadFar = params.syncTopBottomOptics
      ? effectiveOptics.topSpreadFar
      : effectiveOptics.bottomSpreadFar;
    const effectiveBottomFalloff = params.syncTopBottomOptics
      ? effectiveOptics.topFalloff
      : effectiveOptics.bottomFalloff;

    return {
      ...effectiveOptics,
      opticsMode: params.opticsMode as OpticsMode,
      bottomSpreadNear: effectiveBottomSpreadNear,
      bottomSpreadFar: effectiveBottomSpreadFar,
      bottomFalloff: effectiveBottomFalloff,
      railInner: effectiveOptics.railInner ?? K1_HERO_PRESET.optics.railInner,
      railOuter: effectiveOptics.railOuter ?? K1_HERO_PRESET.optics.railOuter,
      railSigma: effectiveOptics.railSigma ?? K1_HERO_PRESET.optics.railSigma,
    };
  }, [effectiveOptics, params.syncTopBottomOptics, params.opticsMode]);

  return (
    <K1CoreScene
      texBottom={texBottom}
      texTop={texTop}
      ledCount={ledCount}
      visuals={{
        exposure: effectiveVisuals.exposure,
        baseLevel: effectiveVisuals.baseLevel,
        tint: effectiveVisuals.tint,
      }}
      optics={renderOptics}
      diagnostics={{
        diagnosticMode: effectiveDiagnostics.diagnosticMode as DiagnosticMode,
        showDebugOverlay: params.showDebugOverlay,
      }}
      compositorRect={compositorRect}
    />
  );
};
