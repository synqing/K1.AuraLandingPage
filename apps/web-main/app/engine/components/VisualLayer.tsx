import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, createPortal } from '@react-three/fiber';
import * as THREE from 'three';
import { IVisualLayer } from '../types';
import { useLayerManager } from '../LayerManager';

interface VisualLayerProps {
  layerId: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, THREE.IUniform>;
}

export const VisualLayer: React.FC<VisualLayerProps> = ({
  layerId,
  vertexShader,
  fragmentShader,
  uniforms,
}) => {
  const updateLayer = useLayerManager((s) => s.updateLayer);
  const layer = useLayerManager((s) => s.layers.find((l) => l.id === layerId));

  // Create an off-screen render target (FBO) for this layer
  const fbo = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1024, 1024, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType, // High precision for physics data
    });
    return target;
  }, []);

  // Register the FBO with the Layer Manager so the Compositor can see it
  useEffect(() => {
    updateLayer(layerId, { fbo });
    return () => fbo.dispose();
  }, [layerId, fbo, updateLayer]);

  // Create a dedicated scene and camera for this layer
  const layerScene = useMemo(() => new THREE.Scene(), []);
  const layerCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

  // Render this layer to its FBO every frame
  useFrame(({ gl }) => {
    if (!layer?.visible) return;

    const currentRenderTarget = gl.getRenderTarget();
    gl.setRenderTarget(fbo);
    gl.clear();
    gl.render(layerScene, layerCamera);
    gl.setRenderTarget(currentRenderTarget); // Restore main buffer
  });

  return createPortal(
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>,
    layerScene
  );
};
