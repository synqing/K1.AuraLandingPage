import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useThree, createPortal } from '@react-three/fiber';
import { useLayerManager } from '../LayerManager';

export const Compositor: React.FC = () => {
  const layers = useLayerManager((s) => s.layers);
  const { size } = useThree();

  // Compositor Scene (Orthographic, Full Screen)
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

  // Simple additive blend shader for the final pass
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uOpacity: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          vec4 tex = texture2D(tDiffuse, vUv);
          gl_FragColor = tex * uOpacity;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  return createPortal(
    <>
      {layers.map((layer) => {
        if (!layer.visible || !layer.fbo) return null;

        return (
          <mesh key={layer.id}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
              attach="material"
              args={[material]}
              uniforms-tDiffuse-value={layer.fbo.texture}
              uniforms-uOpacity-value={layer.opacity}
              transparent={true}
              blending={layer.blendMode === 'ADD' ? THREE.AdditiveBlending : THREE.NormalBlending}
            />
          </mesh>
        );
      })}
    </>,
    scene
  );
};
