'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useLayerManager } from '@/app/engine/LayerManager';
import { VisualLayer } from '@/app/engine/components/VisualLayer';
import { Compositor } from '@/app/engine/components/Compositor';
import { DebugOverlay } from '@/app/engine/components/Debug/DebugOverlay';
import { edgeLitShader } from '@/app/k1/core/optics/edgeLitShader';
import type { DiagnosticMode } from '@/app/k1/core/physics/useK1Physics';

type VisualParams = {
  exposure: number;
  baseLevel: number;
  tint: string;
};

type OpticsParams = {
  opticsMode?: 'PHYSICAL' | 'HERO' | 'EXPERIMENTAL';
  topSpreadNear: number;
  topSpreadFar: number;
  bottomSpreadNear: number;
  bottomSpreadFar: number;
  topFalloff: number;
  bottomFalloff: number;
  columnBoostStrength: number;
  columnBoostExponent: number;
  edgeHotspotStrength: number;
  edgeHotspotWidth: number;
  railInner: number;
  railOuter: number;
  railSigma: number;
  prismCount?: number;
  prismOpacity?: number;
};

type DiagnosticsParams = {
  diagnosticMode: DiagnosticMode;
  showDebugOverlay?: boolean;
};

type K1CoreSceneProps = {
  texBottom: THREE.DataTexture;
  texTop: THREE.DataTexture;
  ledCount: number;
  visuals: VisualParams;
  optics: OpticsParams;
  diagnostics: DiagnosticsParams;
  compositorRect?: {
    offset?: [number, number];
    scale?: [number, number];
  };
};

// Convert opticsMode string to shader uniform value
function opticsModeToUniform(mode?: 'PHYSICAL' | 'HERO' | 'EXPERIMENTAL'): number {
  switch (mode) {
    case 'PHYSICAL':
      return 0.0;
    case 'EXPERIMENTAL':
      return 2.0;
    case 'HERO':
    default:
      return 1.0;
  }
}

/**
 * Core renderer that maps physics LED textures through the edge-lit optics shader
 * and composites to screen. Shared by both the landing engine and simulator.
 */
export function K1CoreScene({
  texBottom,
  texTop,
  ledCount,
  visuals,
  optics,
  diagnostics,
  compositorRect,
}: K1CoreSceneProps) {
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

  const edgeLitUniforms = useMemo(
    () => ({
      uLedStateBottom: { value: texBottom },
      uLedStateTop: { value: texTop },
      uResolution: { value: ledCount },

      // Visuals
      uExposure: { value: visuals.exposure },
      uBaseLevel: { value: visuals.baseLevel },
      uTint: { value: new THREE.Color(visuals.tint) },

      // Optics Mode (0 = PHYSICAL, 1 = HERO, 2 = EXPERIMENTAL)
      uOpticsMode: { value: opticsModeToUniform(optics.opticsMode) },

      // Optics
      uTopFalloff: { value: optics.topFalloff },
      uBottomFalloff: { value: optics.bottomFalloff },
      uTopSpreadNear: { value: optics.topSpreadNear },
      uTopSpreadFar: { value: optics.topSpreadFar },
      uBottomSpreadNear: { value: optics.bottomSpreadNear },
      uBottomSpreadFar: { value: optics.bottomSpreadFar },
      uColumnBoostStrength: { value: optics.columnBoostStrength },
      uColumnBoostExponent: { value: optics.columnBoostExponent },
      uEdgeHotspotStrength: { value: optics.edgeHotspotStrength },
      uEdgeHotspotWidth: { value: optics.edgeHotspotWidth },
      uRailInner: { value: optics.railInner },
      uRailOuter: { value: optics.railOuter },
      uRailSigma: { value: optics.railSigma },
    }),
    // Create once on mount; values are updated imperatively below
    []
  );

  const uniformsRef = useRef(edgeLitUniforms);

  // Imperatively update uniforms each render from current props
  uniformsRef.current.uLedStateBottom.value = texBottom;
  uniformsRef.current.uLedStateTop.value = texTop;
  uniformsRef.current.uResolution.value = ledCount;

  uniformsRef.current.uExposure.value = visuals.exposure;
  uniformsRef.current.uBaseLevel.value = visuals.baseLevel;
  uniformsRef.current.uTint.value.set(visuals.tint);

  uniformsRef.current.uOpticsMode.value = opticsModeToUniform(optics.opticsMode);

  uniformsRef.current.uTopFalloff.value = optics.topFalloff;
  uniformsRef.current.uBottomFalloff.value = optics.bottomFalloff;
  uniformsRef.current.uTopSpreadNear.value = optics.topSpreadNear;
  uniformsRef.current.uTopSpreadFar.value = optics.topSpreadFar;
  uniformsRef.current.uBottomSpreadNear.value = optics.bottomSpreadNear;
  uniformsRef.current.uBottomSpreadFar.value = optics.bottomSpreadFar;
  uniformsRef.current.uColumnBoostStrength.value = optics.columnBoostStrength;
  uniformsRef.current.uColumnBoostExponent.value = optics.columnBoostExponent;
  uniformsRef.current.uEdgeHotspotStrength.value = optics.edgeHotspotStrength;
  uniformsRef.current.uEdgeHotspotWidth.value = optics.edgeHotspotWidth;
  uniformsRef.current.uRailInner.value = optics.railInner;
  uniformsRef.current.uRailOuter.value = optics.railOuter;
  uniformsRef.current.uRailSigma.value = optics.railSigma;

  return (
    <>
      {layers.map((layer) => (
        <VisualLayer
          key={layer.id}
          layerId={layer.id}
          vertexShader={edgeLitShader.vertex}
          fragmentShader={edgeLitShader.fragment}
          uniforms={uniformsRef.current}
        />
      ))}

      <Compositor offset={compositorRect?.offset} scale={compositorRect?.scale} />

      {diagnostics.showDebugOverlay && (
        <DebugOverlay texTop={texTop} texBottom={texBottom} ledCount={ledCount} />
      )}
    </>
  );
}
